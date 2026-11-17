import { OTP_RESEND_COOLDOWN_MS, OTP_MAX_ATTEMPTS, RATE_LIMITS, SESSION_COOKIE, SESSION_TTL_MS } from '../config.js';
import { generateOtpCode, hashOtp, createOtpRecord, isOtpExpired } from '../models/otp_model.js';
import { authLoginSchema, authOtpVerifySchema } from '../validators/request_schemas.js';
import { consumeRateLimit } from '../middleware/auth_guards.js';
import { build_session_view } from './session_controller.js';
import { httpError } from '../utils/http_error.js';
import { ensureNickname } from '../services/nickname_service.js';
import { safeEqual } from '../utils/tokens.js';
import { otpRequired } from '../services/local_signin.js';

/** Finds or creates the account for this email and starts a session for it (a new sign-in replaces this browser's old one). */
async function signIn(req, res, email) {
  const { store, sessions } = req.app.locals.services;
  const user = (await store.getUserByEmail(email)) || (await store.createUser(email));
  await ensureNickname(store, user);
  if (req.sessionId) await sessions.end(req.sessionId);
  const { id, session } = await sessions.start(user._id);
  res.cookie(SESSION_COOKIE, id, {
    httpOnly: true,
    sameSite: 'strict',
    secure: req.secure,
    maxAge: SESSION_TTL_MS,
    path: '/'
  });
  res.json(build_session_view(session, user));
}

/** POST /api/auth/request: emails a one-time sign-in code. On a lab run only on this computer it signs in directly instead. */
export async function auth_login(req, res) {
  const { store, mailer } = req.app.locals.services;
  consumeRateLimit(req, 'otp-request', RATE_LIMITS.otpRequest);
  const { email } = authLoginSchema.parse(req.body);
  if (!otpRequired(req)) return signIn(req, res, email);

  // Respect the resend cooldown but answer identically, so the response reveals nothing.
  const existing = await store.getOtp(email);
  if (existing && Date.now() - existing.sentAt < OTP_RESEND_COOLDOWN_MS) return res.json({ ok: true });

  const code = generateOtpCode();
  await mailer.sendCode(email, code);
  await store.putOtp(email, createOtpRecord(email, code));
  res.json({ ok: true });
}

/** POST /api/auth/verify: checks the code and starts a session. */
export async function auth_otp_verify(req, res) {
  const { store } = req.app.locals.services;
  consumeRateLimit(req, 'otp-verify', RATE_LIMITS.otpVerify);
  const { email, code } = authOtpVerifySchema.parse(req.body);
  const invalidCode = () => httpError('Invalid or expired code.', 403);

  const record = await store.getOtp(email);
  if (!record || isOtpExpired(record)) throw invalidCode();

  if (record.attempts >= OTP_MAX_ATTEMPTS) {
    await store.deleteOtp(email);
    throw invalidCode();
  }

  if (!safeEqual(hashOtp(record.salt, email, code), record.hash)) {
    if ((await store.bumpOtp(email)) >= OTP_MAX_ATTEMPTS) await store.deleteOtp(email);
    throw invalidCode();
  }

  await store.deleteOtp(email);
  await signIn(req, res, email);
}

/** POST /api/logout */
export async function auth_logout(req, res) {
  await req.app.locals.services.sessions.end(req.sessionId);
  res.clearCookie(SESSION_COOKIE, { path: '/' });
  res.json({ ok: true });
}
