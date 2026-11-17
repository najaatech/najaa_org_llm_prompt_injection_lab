import { catalog } from '../../content/catalog.js';
import { RATE_LIMITS } from '../config.js';
import { publicUser } from '../models/user_model.js';
import { model, ALLOWED_MODELS } from '../services/ollama_service.js';
import { consumeRateLimit } from '../middleware/auth_guards.js';

/** What the browser needs to know about the current session. */
export function build_session_view(session, user) {
  const signedIn = Boolean(session && user);
  return {
    authenticated: signedIn,
    csrf: session?.csrf,
    user: signedIn ? publicUser(user) : undefined,
    model,
    models: ALLOWED_MODELS
  };
}

/** GET /api/session */
export async function session_get(req, res) {
  const { store } = req.app.locals.services;
  const user = req.session ? await store.getUser(req.session.userId) : null;
  res.json(build_session_view(user ? req.session : null, user));
}

/** GET /api/catalog */
export function catalog_get(req, res) {
  res.json(catalog);
}

/** GET /api/health */
export async function health_get(req, res) {
  const { readiness, mailer } = req.app.locals.services;
  consumeRateLimit(req, 'health', RATE_LIMITS.health);
  res.json({ ...(await readiness()), mailConfigured: mailer.configured() });
}

/** GET /api/join_info: the address the audience can use, shown as a QR code on the home page. */
export function join_info_get(req, res) {
  const { publicUrl } = req.app.locals.services;
  res.json({ publicUrl });
}
