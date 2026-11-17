import { httpError } from './http_error.js';

const WINDOW_MS = 60 * 1000;
const MAX_TRACKED_KEYS = 2000;

/** Fixed-window request counter, kept in memory and keyed by client address and category. */
export class RateLimiter {
  #windows = new Map();

  /** Counts one request and throws a 429 error when the client went over the limit. */
  consume(clientId, category, maxPerWindow) {
    const key = `${clientId}:${category}`;
    const now = Date.now();
    this.#forgetExpired(now);

    let window = this.#windows.get(key);
    if (!window || window.resetAt < now) {
      window = { count: 0, resetAt: now + WINDOW_MS };
      this.#windows.set(key, window);
    }

    window.count += 1;
    if (window.count > maxPerWindow) {
      throw httpError('Too many requests. Wait one minute and retry.', 429);
    }
  }

  // Keeps memory bounded: expired windows are only swept when the map grows large.
  #forgetExpired(now) {
    if (this.#windows.size <= MAX_TRACKED_KEYS) return;
    for (const [key, window] of this.#windows) {
      if (window.resetAt < now) this.#windows.delete(key);
    }
  }
}
