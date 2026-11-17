import { createSession, isSessionActive } from '../models/session_model.js';
import { generateToken } from '../utils/tokens.js';

/** Signed-in browser sessions, kept in memory (they end when the server restarts). */
export class SessionRegistry {
  #sessions = new Map();

  /** Starts a session for the user and returns its id (for the cookie) and its data. */
  start(userId) {
    const id = generateToken();
    const session = createSession(userId);
    this.#sessions.set(id, session);
    return { id, session };
  }

  /** The session for this id, or undefined when unknown or expired (expired ones are removed). */
  find(id) {
    const session = this.#sessions.get(id);
    if (!session) return undefined;
    if (isSessionActive(session)) return session;
    this.#sessions.delete(id);
    return undefined;
  }

  end(id) {
    this.#sessions.delete(id);
  }
}
