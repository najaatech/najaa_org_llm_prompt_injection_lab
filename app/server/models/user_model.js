import { randomBytes, randomInt, randomUUID } from 'node:crypto';

const NICKNAME_ADJECTIVES = [
  'ghost', 'shadow', 'silent', 'rogue', 'cipher', 'neon', 'zero', 'binary',
  'phantom', 'stealth', 'rooted', 'kernel', 'quantum', 'null', 'cyber', 'dark'
];
const NICKNAME_NOUNS = [
  'wolf', 'fox', 'raven', 'hex', 'byte', 'root', 'daemon', 'exploit',
  'proxy', 'shell', 'payload', 'viper', 'cobra', 'glitch', 'packet', 'wraith'
];

/** A hacker-style nickname such as ghost_packet_482. Not guaranteed unique; the store enforces that. */
export const generateNickname = (pick = randomInt) =>
  `${NICKNAME_ADJECTIVES[pick(NICKNAME_ADJECTIVES.length)]}_${NICKNAME_NOUNS[pick(NICKNAME_NOUNS.length)]}_${pick(100, 1000)}`;

/** Nicknames are unique ignoring case, so "Ghost" and "ghost" cannot both exist. */
export const nicknameKey = (nickname) => String(nickname).toLowerCase();

/** How many past attempts are kept per learner. Older ones are dropped. */
export const MAX_STORED_ATTEMPTS = 30;

/**
 * Fictional data only. Every learner gets three random flags (one per level);
 * flags never leave the server except through model output.
 */
export const newFlag = () => `FLAG{${randomBytes(6).toString('hex')}}`;

/**
 * The part of a learner record that "Reset" wipes. Quiz scores are deliberately not here:
 * a quiz can be submitted only once, and a reset must not give a second try.
 */
export const initialProgress = () => ({ progress: [], attempts: [] });

/** Builds a brand new learner record for a first sign-in. */
export function createUserDocument(email) {
  return {
    _id: randomUUID(),
    email,
    flags: { l1: newFlag(), l2: newFlag(), l3: newFlag() },
    solved: { l1: false, l2: false, l3: false },
    ...initialProgress(),
    quizScores: {},
    quizStarts: {},
    flagTimes: {},
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
    nickname: user.nickname ?? null,
    solved: user.solved,
    progress: user.progress,
    attempts: user.attempts,
    // Learners created before quiz scores existed have no field yet.
    quizScores: user.quizScores ?? {},
    // When each quiz was started (the server's clock). The countdown is based on this.
    quizStarts: user.quizStarts ?? {},
    // Per flag challenge: when it was first opened and when its flag was first submitted correctly. No time limit.
    flagTimes: user.flagTimes ?? {}
  };
}
