import { generateNickname } from '../models/user_model.js';

const MAX_TRIES = 12;

/**
 * Gives a learner a random hacker-style nickname the first time it is needed.
 * Nicknames are unique, so a taken one is skipped. The learner can change it later.
 * Sets user.nickname on the object passed in. If every try is taken the learner stays without one.
 */
export async function ensureNickname(store, user) {
  if (user.nickname) return user;
  for (let attempt = 0; attempt < MAX_TRIES; attempt++) {
    const candidate = generateNickname();
    if (await store.setNickname(user._id, candidate, { onlyIfMissing: true })) {
      user.nickname = candidate;
      return user;
    }
    // Another request may have just given this learner a nickname.
    const fresh = await store.getUser(user._id);
    if (fresh?.nickname) {
      user.nickname = fresh.nickname;
      return user;
    }
  }
  return user;
}
