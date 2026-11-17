import { MongoClient } from 'mongodb';
import { createUserDocument, initialProgress, trimAttempts } from '../models/user_model.js';
import { publicDocuments, privateDocumentsFor } from '../models/knowledge_document_model.js';
import { vaultEntriesFor } from '../models/vault_entry_model.js';

const DUPLICATE_KEY_ERROR = 11000;

/** MongoDB persistence for learners, sign-in codes, knowledge documents and the level 3 vault. */
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
    this.docs = db.collection('kb_documents');
    this.vault = db.collection('vault');
  }

  /** Creates indexes and (re)loads the public FAQ documents. */
  async init() {
    await Promise.all([
      this.users.createIndex({ email: 1 }, { unique: true }),
      this.otps.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }),
      this.docs.createIndex({ ownerId: 1 }),
      this.vault.createIndex({ ownerId: 1, key: 1 }, { unique: true })
    ]);

    // $set keeps any stored embedding; a changed text is detected later by its embeddingKey.
    for (const document of publicDocuments) {
      const { _id, ...fields } = document;
      await this.docs.updateOne({ _id }, { $set: fields }, { upsert: true });
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

  async close() {
    await this.client.close();
  }
}
