import { randomBytes, timingSafeEqual } from 'node:crypto';

/** Random 48-character hex string, used for session ids and CSRF tokens. */
export function generateToken() {
  return randomBytes(24).toString('hex');
}

/** Constant-time string comparison. Returns false for anything that is not a string. */
export function safeEqual(first, second) {
  if (typeof first !== 'string' || typeof second !== 'string') return false;
  if (Buffer.byteLength(first) !== Buffer.byteLength(second)) return false;
  return timingSafeEqual(Buffer.from(first), Buffer.from(second));
}
