import { createUserDocument, initialProgress, trimAttempts } from '../models/user_model.js';
import { publicDocuments, privateDocumentsFor } from '../models/knowledge_document_model.js';
import { vaultEntriesFor } from '../models/vault_entry_model.js';

/** Same interface as MongoStore, kept in memory. Used by tests and never by the real server. */
export class MemoryStore {
  users = new Map();
  otps = new Map();
  docs = new Map(publicDocuments.map((document) => [document._id, { ...document }]));
  vault = [];

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
    this.users.set(user._id, user);
  }

  async resetUser(id) {
    const user = this.users.get(id);
    if (user) Object.assign(user, initialProgress());
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

  async close() {}
}
