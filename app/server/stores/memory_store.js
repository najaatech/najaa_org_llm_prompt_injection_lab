import { createUserDocument, initialProgress, nicknameKey, trimAttempts } from '../models/user_model.js';
import { byConversationOrder, MAX_LOADED_MESSAGES } from '../models/conversation_model.js';
import { publicDocuments, privateDocumentsFor } from '../models/knowledge_document_model.js';
import { vaultEntriesFor } from '../models/vault_entry_model.js';

/** Same interface as MongoStore, kept in memory. Used by tests and never by the real server. */
export class MemoryStore {
  users = new Map();
  otps = new Map();
  sessions = new Map();
  docs = new Map(publicDocuments.map((document) => [document._id, { ...document }]));
  vault = [];
  conversations = [];
  // ---- learners ----

  async getUserByEmail(email) {
    return [...this.users.values()].find((user) => user.email === email) ?? null;
  }

  async getUser(id) {
    return this.users.get(id) ?? null;
  }

  async createUser(email) {
    const existing = await this.getUserByEmail(email);
    if (existing) return existing;

    const user = createUserDocument(email);
    this.users.set(user._id, user);
    for (const document of privateDocumentsFor(user._id, user.flags)) this.docs.set(document._id, document);
    this.vault.push(...vaultEntriesFor(user._id, user.flags));
    return user;
  }

  async saveUser(user) {
    user.attempts = trimAttempts(user.attempts);
    const existing = this.users.get(user._id);
    // Copy only what the database saves, so a stale copy cannot erase quiz scores.
    if (existing && existing !== user) Object.assign(existing, { solved: user.solved, progress: user.progress, attempts: user.attempts });
    else this.users.set(user._id, user);
  }

  async resetUser(id) {
    const user = this.users.get(id);
    if (user) Object.assign(user, initialProgress());
    this.conversations = this.conversations.filter((message) => message.userId !== String(id));
  }

  /** Saves a quiz result only if this quiz has no result yet. Returns false when one already exists. */
  async saveQuizResult(userId, quizId, record) {
    const user = this.users.get(userId);
    if (!user) return false;
    user.quizScores ??= {};
    if (Object.hasOwn(user.quizScores, quizId)) return false;
    user.quizScores[quizId] = record;
    return true;
  }

  /** Records when a quiz was started, unless it was already started or submitted. The first start wins. */
  async startQuiz(userId, quizId, startedAt) {
    const user = this.users.get(userId);
    if (!user) return;
    user.quizStarts ??= {};
    if (Object.hasOwn(user.quizStarts, quizId) || Object.hasOwn(user.quizScores ?? {}, quizId)) return;
    user.quizStarts[quizId] = startedAt;
  }

  /** Records when a learner first opened a flag challenge. There is no time limit; the first open wins. */
  async startLevel(userId, levelId, startedAt) {
    const user = this.users.get(userId);
    if (!user) return;
    user.flagTimes ??= {};
    user.flagTimes[levelId] ??= {};
    user.flagTimes[levelId].startedAt ??= startedAt;
  }

  /** Records when a flag was first submitted correctly. The first correct submission wins. */
  async markLevelSolved(userId, levelId, solvedAt) {
    const user = this.users.get(userId);
    if (!user) return;
    user.flagTimes ??= {};
    user.flagTimes[levelId] ??= {};
    user.flagTimes[levelId].solvedAt ??= solvedAt;
  }

  /**
   * Gives a learner a nickname. Returns false when another learner already has it (ignoring case),
   * or, with onlyIfMissing, when this learner already has one.
   */
  async setNickname(userId, nickname, { onlyIfMissing = false } = {}) {
    const user = this.users.get(userId);
    if (!user || (onlyIfMissing && user.nickname)) return false;
    const key = nicknameKey(nickname);
    if ([...this.users.values()].some((other) => other._id !== userId && other.nicknameKey === key)) return false;
    Object.assign(user, { nickname, nicknameKey: key });
    return true;
  }

  /** The fields the leaderboard needs for every learner. Never includes the email. */
  async listLeaderboardUsers() {
    return [...this.users.values()].map((user) => ({
      id: user._id, nickname: user.nickname ?? null, solved: user.solved, quizScores: user.quizScores ?? {}, flagTimes: user.flagTimes ?? {}
    }));
  }

  async appendConversation(documents) {
    this.conversations.push(...documents.map((document) => structuredClone(document)));
  }

  async listConversations(userId) {
    return this.conversations
      .filter((message) => message.userId === String(userId))
      .sort(byConversationOrder)
      .slice(-MAX_LOADED_MESSAGES)
      .map((message) => structuredClone(message));
  }

  async clearConversation(userId, levelId, model) {
    this.conversations = this.conversations.filter(
      (message) => !(message.userId === String(userId) && message.levelId === levelId && message.model === model)
    );
  }

  // ---- knowledge documents ----

  async listDocs(ownerId) {
    return [...this.docs.values()]
      .filter((document) => document.ownerId === null || document.ownerId === ownerId)
      .map((document) => ({ ...document }));
  }

  async setDocEmbeddings(updates) {
    for (const { id, embedding, embeddingKey } of updates) {
      const document = this.docs.get(id);
      if (document) Object.assign(document, { embedding, embeddingKey });
    }
  }

  // ---- level 3 vault ----

  async vaultFind(ownerId, key) {
    if (typeof key !== 'string' || typeof ownerId !== 'string') return null;
    return this.vault.find((entry) => entry.ownerId === ownerId && entry.key === key) ?? null;
  }

  // ---- sign-in codes ----

  async getOtp(email) {
    const record = this.otps.get(email);
    return record && record.expiresAt > Date.now() ? record : null;
  }

  async putOtp(email, record) {
    this.otps.set(email, { ...record });
  }

  async bumpOtp(email) {
    const record = this.otps.get(email);
    if (!record) return Infinity;
    record.attempts += 1;
    return record.attempts;
  }

  async deleteOtp(email) {
    this.otps.delete(email);
  }

  // ---- sign-in sessions (keyed by the hash of the cookie's session id) ----

  async putSession(idHash, session) {
    this.sessions.set(idHash, { ...session });
  }

  async getSession(idHash) {
    const session = this.sessions.get(idHash);
    return session ? { ...session } : null;
  }

  async deleteSession(idHash) {
    this.sessions.delete(idHash);
  }

  async close() {}
}
