import { httpError } from '../utils/http_error.js';
import { safeEqual } from '../utils/tokens.js';

/** Route guard: the browser must have a signed-in session. */
export function requireSignedIn(req, res, next) {
  next(req.session ? undefined : httpError('Sign in first.', 401));
}

/** Route guard: the x-csrf-token header must match the session's CSRF token. */
export function requireCsrf(req, res, next) {
  const matches = safeEqual(req.get('x-csrf-token'), req.session.csrf);
  next(matches ? undefined : httpError('Session check failed. Refresh and retry.', 403));
}

/** Loads the learner that owns the current session. */
export async function loadCurrentUser(req) {
  const user = await req.app.locals.services.store.getUser(req.session.userId);
  if (!user) throw httpError('Sign in first.', 401);
  return user;
}

/** Applies the per-client rate limit for one category of request. */
export function consumeRateLimit(req, category, limit) {
  req.app.locals.services.rateLimiter.consume(req.ip, category, limit);
}
