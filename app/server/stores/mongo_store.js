import { MongoClient } from 'mongodb';
import { createUserDocument, initialProgress, nicknameKey, trimAttempts } from '../models/user_model.js';
import { legacyConversationDocuments, MAX_LOADED_MESSAGES } from '../models/conversation_model.js';
import { publicDocuments, privateDocumentsFor } from '../models/knowledge_document_model.js';
import { vaultEntriesFor } from '../models/vault_entry_model.js';

const DUPLICATE_KEY_ERROR = 11000;

/** MongoDB persistence for learners, sign-in codes, chat messages, knowledge documents and the level 3 vault. */
export class MongoStore {
  static async connect(uri, dbName) {
    const client = new MongoClient(uri, { serverSelectionTimeoutMS: 4000 });
    await client.connect();
    const store = new MongoStore(client, client.db(dbName));
    await store.init();
    return store;
  }

  constructor(client, db) {
    this.client = client;
    this.users = db.collection('users');
    this.otps = db.collection('otps');
    this.sessions = db.collection('sessions');
    this.docs = db.collection('kb_documents');
    this.vault = db.collection('vault');
    this.conversations = db.collection('conversations');
  }

  /** Creates indexes and (re)loads the public FAQ documents. */
  async init() {
    await Promise.all([
      this.users.createIndex({ email: 1 }, { unique: true }),
      // Unique among learners that have a nickname; older learners without one are not affected.
      this.users.createIndex({ nicknameKey: 1 }, { unique: true, partialFilterExpression: { nicknameKey: { $type: 'string' } } }),
      this.otps.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }),
      this.sessions.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }),
      this.docs.createIndex({ ownerId: 1 }),
      this.vault.createIndex({ ownerId: 1, key: 1 }, { unique: true }),
      this.conversations.createIndex({ userId: 1, levelId: 1, model: 1, at: 1 })
    ]);
    await this.migrateEmbeddedConversations();

    // $set keeps any stored embedding; a changed text is detected later by its embeddingKey.
    for (const document of publicDocuments) {
      const { _id, ...fields } = document;
      await this.docs.updateOne({ _id }, { $set: fields }, { upsert: true });
    }
  }

  /** Older versions kept chats inside the learner document. Copies them into `conversations` once, then removes the field. */
  async migrateEmbeddedConversations() {
    const learners = this.users.find({ conversations: { $exists: true } }, { projection: { conversations: 1 } });
    for await (const learner of learners) {
      const documents = legacyConversationDocuments(learner._id, learner.conversations);
      if (documents.length) {
        await this.conversations.bulkWrite(documents.map((document) => ({
          replaceOne: { filter: { _id: document._id }, replacement: document, upsert: true }
        })));
      }
      await this.users.updateOne({ _id: learner._id }, { $unset: { conversations: '' } });
    }
  }

  // ---- learners ----

  getUserByEmail(email) {
    return this.users.findOne({ email: String(email) });
  }

  getUser(id) {
    return this.users.findOne({ _id: String(id) });
  }

  async createUser(email) {
    const user = createUserDocument(String(email));
    try {
      await this.users.insertOne(user);
    } catch (cause) {
      // Two sign-ins at the same moment: the other one won, so return that learner.
      if (cause?.code === DUPLICATE_KEY_ERROR) return this.getUserByEmail(email);
      throw cause;
    }
    await this.docs.insertMany(privateDocumentsFor(user._id, user.flags));
    await this.vault.insertMany(vaultEntriesFor(user._id, user.flags));
    return user;
  }

  async saveUser(user) {
    await this.users.updateOne(
      { _id: user._id },
      { $set: { solved: user.solved, progress: user.progress, attempts: trimAttempts(user.attempts) } }
    );
  }

  async resetUser(id) {
    await this.users.updateOne({ _id: String(id) }, { $set: initialProgress() });
    await this.conversations.deleteMany({ userId: String(id) });
  }

  /**
   * Saves a quiz result only if this quiz has no result yet. The filter makes it atomic,
   * so two simultaneous submissions cannot both be saved. Returns false when one already exists.
   */
  async saveQuizResult(userId, quizId, record) {
    const field = `quizScores.${quizId}`;
    const outcome = await this.users.updateOne(
      { _id: String(userId), [field]: { $exists: false } },
      { $set: { [field]: record } }
    );
    return outcome.modifiedCount === 1;
  }

  /** Records when a quiz was started, unless it was already started or submitted. The first start wins. */
  async startQuiz(userId, quizId, startedAt) {
    await this.users.updateOne(
      { _id: String(userId), [`quizStarts.${quizId}`]: { $exists: false }, [`quizScores.${quizId}`]: { $exists: false } },
      { $set: { [`quizStarts.${quizId}`]: startedAt } }
    );
  }

  /** Records when a learner first opened a flag challenge. There is no time limit; the first open wins. */
  async startLevel(userId, levelId, startedAt) {
    const field = `flagTimes.${levelId}.startedAt`;
    await this.users.updateOne({ _id: String(userId), [field]: { $exists: false } }, { $set: { [field]: startedAt } });
  }

  /** Records when a flag was first submitted correctly. The first correct submission wins. */
  async markLevelSolved(userId, levelId, solvedAt) {
    const field = `flagTimes.${levelId}.solvedAt`;
    await this.users.updateOne({ _id: String(userId), [field]: { $exists: false } }, { $set: { [field]: solvedAt } });
  }

  /**
   * Gives a learner a nickname. Returns false when another learner already has it (unique index,
   * ignoring case), or, with onlyIfMissing, when this learner already has one.
   */
  async setNickname(userId, nickname, { onlyIfMissing = false } = {}) {
    try {
      const outcome = await this.users.updateOne(
        { _id: String(userId), ...(onlyIfMissing ? { nicknameKey: { $exists: false } } : {}) },
        { $set: { nickname, nicknameKey: nicknameKey(nickname) } }
      );
      return outcome.matchedCount === 1;
    } catch (cause) {
      if (cause?.code === DUPLICATE_KEY_ERROR) return false;
      throw cause;
    }
  }

  /** The fields the leaderboard needs for every learner. Never includes the email. */
  async listLeaderboardUsers() {
    const users = await this.users
      .find({}, { projection: { nickname: 1, solved: 1, quizScores: 1, flagTimes: 1 } })
      .limit(5000)
      .toArray();
    return users.map((user) => ({
      id: user._id, nickname: user.nickname ?? null, solved: user.solved ?? {}, quizScores: user.quizScores ?? {}, flagTimes: user.flagTimes ?? {}
    }));
  }

  // ---- chat messages (collection `conversations`, one document per message) ----

  /** Saves chat message documents built by conversationDocuments(). */
  async appendConversation(documents) {
    if (documents.length) await this.conversations.insertMany(documents);
  }

  /** The learner's newest saved messages, oldest first. */
  async listConversations(userId) {
    const newest = await this.conversations
      .find({ userId: String(userId) })
      .sort({ at: -1, seq: -1 })
      .limit(MAX_LOADED_MESSAGES)
      .toArray();
    return newest.reverse();
  }

  /** Deletes the saved chat of one model on one level. levelId and model must be validated values. */
  async clearConversation(userId, levelId, model) {
    await this.conversations.deleteMany({ userId: String(userId), levelId: String(levelId), model: String(model) });
  }

  // ---- knowledge documents ----

  listDocs(ownerId) {
    return this.docs.find({ ownerId: { $in: [null, String(ownerId)] } }).toArray();
  }

  async setDocEmbeddings(updates) {
    if (!updates.length) return;
    await this.docs.bulkWrite(updates.map(({ id, embedding, embeddingKey }) => ({
      updateOne: { filter: { _id: String(id) }, update: { $set: { embedding, embeddingKey } } }
    })));
  }

  // ---- level 3 vault ----

  // The key must already be a validated plain string; objects are never passed into the query.
  async vaultFind(ownerId, key) {
    if (typeof key !== 'string' || typeof ownerId !== 'string') return null;
    return this.vault.findOne({ ownerId, key });
  }

  // ---- sign-in codes ----

  getOtp(email) {
    return this.otps.findOne({ _id: String(email) });
  }

  async putOtp(email, record) {
    await this.otps.replaceOne({ _id: String(email) }, { _id: String(email), ...record }, { upsert: true });
  }

  /** Adds one failed attempt and returns the new total. */
  async bumpOtp(email) {
    const updated = await this.otps.findOneAndUpdate(
      { _id: String(email) },
      { $inc: { attempts: 1 } },
      { returnDocument: 'after' }
    );
    return updated?.attempts ?? Infinity;
  }

  async deleteOtp(email) {
    await this.otps.deleteOne({ _id: String(email) });
  }

  // ---- sign-in sessions (keyed by the hash of the cookie's session id; expired ones are removed by a TTL index) ----

  async putSession(idHash, session) {
    await this.sessions.replaceOne(
      { _id: String(idHash) },
      { _id: String(idHash), userId: session.userId, csrf: session.csrf, expires: session.expires, expiresAt: new Date(session.expires) },
      { upsert: true }
    );
  }

  async getSession(idHash) {
    const stored = await this.sessions.findOne({ _id: String(idHash) });
    return stored ? { userId: stored.userId, csrf: stored.csrf, expires: stored.expires } : null;
  }

  async deleteSession(idHash) {
    await this.sessions.deleteOne({ _id: String(idHash) });
  }

  async close() {
    await this.client.close();
  }
}
