/** Name shown in the browser, emails and the startup banner. */
export const APP_TITLE = 'Understanding and mitigating prompt injection vulnerabilities';

/** Cookie that carries the session id. */
export const SESSION_COOKIE = 'lab_session';
export const SESSION_TTL_MS = 8 * 60 * 60 * 1000;

/** Sign-in code rules. */
export const OTP_TTL_MS = 10 * 60 * 1000;
export const OTP_RESEND_COOLDOWN_MS = 60 * 1000;
export const OTP_MAX_ATTEMPTS = 5;

/** Largest JSON body accepted by the API. */
export const JSON_BODY_LIMIT = '16kb';

/** Requests allowed per client address, per category, per minute. */
export const RATE_LIMITS = {
  health: 20,
  otpRequest: 6,
  otpVerify: 10,
  challenge: 30,
  flag: 20,
  attempt: 30
};

/**
 * Reads the process settings from environment variables.
 * PUBLIC_URL is the address people outside this computer use (set by `npm run start:ngrok`).
 */
export function readServerSettings(env = process.env) {
  return {
    port: Number(env.PORT || 3000),
    host: env.HOST || '127.0.0.1',
    mongoUri: env.MONGODB_URI || 'mongodb://localhost:27017',
    mongoDb: env.MONGODB_DB || 'prompt_injection_prototype',
    publicUrl: parsePublicUrl(env.PUBLIC_URL)
  };
}

function parsePublicUrl(value) {
  if (!value) return null;
  const url = new URL(value);
  if (!['http:', 'https:'].includes(url.protocol)) throw new Error('PUBLIC_URL must start with http:// or https://');
  return url.origin;
}
