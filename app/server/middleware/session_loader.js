import { SESSION_COOKIE } from '../config.js';
import { readCookie } from '../utils/cookies.js';

/** Attaches req.session and req.sessionId when the cookie belongs to an active session. */
export function sessionLoader() {
  return (req, res, next) => {
    const { sessions } = req.app.locals.services;
    const sessionId = readCookie(req, SESSION_COOKIE);
    const session = sessions.find(sessionId);

    if (session) {
      req.session = session;
      req.sessionId = sessionId;
    }
    next();
  };
}
