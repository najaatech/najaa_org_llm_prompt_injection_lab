import { randomUUID } from 'node:crypto';

/** Longest stored chat message. Model replies can be long, so they are cut. */
export const MAX_STORED_MESSAGE_LENGTH = 4000;

/** How many of a learner's newest messages the browser receives when it restores the chats. */
export const MAX_LOADED_MESSAGES = 300;

const cut = (text) => String(text).slice(0, MAX_STORED_MESSAGE_LENGTH);

/**
 * The `conversations` collection holds one document per chat message:
 *   { _id, userId, levelId, model, turnId, seq, role, text, at, retrieved? }
 * A question and its reply share a turnId. seq (0 = question, 1 = reply) keeps them in order.
 * Reply documents also list the notes the RAG retrieval picked for that question: [{ title, score }].
 * Nothing secret is stored here beyond what the model already said to the learner.
 */
export function conversationDocuments({ userId, levelId, message, answer, model, retrieved = [] }, now = new Date()) {
  const base = { userId: String(userId), levelId, model: String(model ?? ''), turnId: randomUUID(), at: now.toISOString() };
  return [
    { _id: randomUUID(), ...base, seq: 0, role: 'user', text: cut(message) },
    {
      _id: randomUUID(), ...base, seq: 1, role: 'assistant', text: cut(answer),
      retrieved: retrieved.map(({ title, score }) => ({ title: String(title), score: Number(score) }))
    }
  ];
}

/** Oldest first, a question before its reply. Both stores sort with this so they behave the same. */
export const byConversationOrder = (a, b) => (a.at < b.at ? -1 : a.at > b.at ? 1 : a.seq - b.seq);

/** Saved messages as the browser receives them. Shape: { levelId: { model: entries } }. */
export function groupConversations(documents) {
  const chats = {};
  for (const { levelId, model, role, text, at, retrieved } of documents) {
    ((chats[levelId] ??= {})[model] ??= []).push({ role, text, model, at, ...(retrieved ? { retrieved } : {}) });
  }
  return chats;
}

/**
 * Chats saved inside the learner document by older versions ({ levelId: [entries] }) as collection documents.
 * Older user messages had no model, so they take the model of the reply that follows them.
 * The ids are fixed, so running the migration twice cannot create duplicates.
 */
export function legacyConversationDocuments(userId, conversations) {
  return Object.entries(conversations ?? {}).flatMap(([levelId, entries]) => {
    const documents = [];
    let pending = [];
    const add = (entry, model) => documents.push({
      _id: `legacy-${userId}-${levelId}-${documents.length}`,
      userId: String(userId),
      levelId,
      model,
      seq: entry.role === 'user' ? 0 : 1,
      role: entry.role,
      text: cut(entry.text),
      at: String(entry.at ?? '')
    });
    for (const entry of entries ?? []) {
      const model = entry.model || (entry.role === 'assistant' ? 'unknown' : '');
      if (!model) { pending.push(entry); continue; }
      for (const waiting of pending) add(waiting, model);
      add(entry, model);
      pending = [];
    }
    return documents;
  });
}
