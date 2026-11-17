import { createHash, randomBytes, randomInt } from 'node:crypto';
import { OTP_TTL_MS } from '../config.js';

/** Random six digit sign-in code, zero padded. */
export const generateOtpCode = () => String(randomInt(0, 1000000)).padStart(6, '0');

/** Only a salted hash of the code is stored, never the code itself. */
export const hashOtp = (salt, email, code) => createHash('sha256').update(`${salt}:${email}:${code}`).digest('hex');

/** Builds the record saved while a sign-in code is waiting to be used. */
export function createOtpRecord(email, code) {
  const salt = randomBytes(12).toString('hex');
  return {
    salt,
    hash: hashOtp(salt, email, code),
    attempts: 0,
    sentAt: Date.now(),
    expiresAt: new Date(Date.now() + OTP_TTL_MS)
  };
}

export const isOtpExpired = (record) => new Date(record.expiresAt).getTime() <= Date.now();
