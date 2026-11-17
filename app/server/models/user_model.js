import { randomBytes, randomUUID } from 'node:crypto';

/** How many past attempts are kept per learner. Older ones are dropped. */
export const MAX_STORED_ATTEMPTS = 30;

/**
 * Fictional data only. Every learner gets three random flags (one per level);
 * flags never leave the server except through model output.
 */
export const newFlag = () => `FLAG{${randomBytes(6).toString('hex')}}`;

/** The part of a learner record that "Reset" wipes. */
export const initialProgress = () => ({ progress: [], attempts: [] });

/** Builds a brand new learner record for a first sign-in. */
export function createUserDocument(email) {
  return {
    _id: randomUUID(),
    email,
    flags: { l1: newFlag(), l2: newFlag(), l3: newFlag() },
    solved: { l1: false, l2: false, l3: false },
    ...initialProgress(),
    createdAt: new Date().toISOString()
  };
}

/** Keeps only the newest attempts. */
export const trimAttempts = (attempts) => attempts.slice(-MAX_STORED_ATTEMPTS);

/** What the browser may see about a learner. Flags and other secrets are left out on purpose. */
export function publicUser(user) {
  if (!user) return user;
  return {
    id: user._id,
    email: user.email,
    solved: user.solved,
    progress: user.progress,
    attempts: user.attempts
  };
}
