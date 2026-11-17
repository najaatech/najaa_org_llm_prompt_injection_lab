import { createSession, isSessionActive } from '../models/session_model.js';
import { generateToken, hashToken } from '../utils/tokens.js';

/**
 * Signed-in browser sessions. The cookie carries a random session id; the session itself is saved in the
 * store (under the id's hash), so a sign-in survives a server restart until the session expires.
 */
export class SessionRegistry {
  constructor(store) {
    this.store = store;
  }

  /** Starts a session for the user and returns its id (for the cookie) and its data. */
  async start(userId) {
    const id = generateToken();
    const session = createSession(userId);
    await this.store.putSession(hashToken(id), session);
    return { id, session };
  }

  /** The session for this id, or undefined when unknown or expired (expired ones are removed). */
  async find(id) {
    if (typeof id !== 'string' || !id) return undefined;
    const session = await this.store.getSession(hashToken(id));
    if (!session) return undefined;
    if (isSessionActive(session)) return session;
    await this.store.deleteSession(hashToken(id));
    return undefined;
  }

  async end(id) {
    if (typeof id === 'string' && id) await this.store.deleteSession(hashToken(id));
  }
}
