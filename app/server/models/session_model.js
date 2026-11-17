import { SESSION_TTL_MS } from '../config.js';
import { generateToken } from '../utils/tokens.js';

/** A signed-in browser session: who it belongs to, its CSRF token and when it ends. */
export function createSession(userId) {
  return {
    userId,
    csrf: generateToken(),
    expires: Date.now() + SESSION_TTL_MS
  };
}

export const isSessionActive = (session) => Boolean(session) && session.expires > Date.now();
