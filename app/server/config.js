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
  levelStart: 60,
  chatReset: 20,
  quiz: 20,
  attempt: 30,
  profile: 10,
  leaderboard: 30
};

/** Every quiz is timed. The server measures the time from the moment the learner presses Start. */
export const QUIZ_TIME_LIMIT_MS = 5 * 60 * 1000;

/** Extra time allowed for the network when the browser submits right at the end. */
export const QUIZ_GRACE_MS = 15 * 1000;

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
