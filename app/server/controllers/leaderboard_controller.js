import { RATE_LIMITS } from '../config.js';
import { buildLeaderboards } from '../services/leaderboard_service.js';
import { consumeRateLimit } from '../middleware/auth_guards.js';

/** GET /api/leaderboard: nicknames and quiz results, best first. Never includes emails. */
export async function leaderboard_get(req, res) {
  const { store } = req.app.locals.services;
  consumeRateLimit(req, 'leaderboard', RATE_LIMITS.leaderboard);
  res.json({ boards: buildLeaderboards(await store.listLeaderboardUsers(), req.session.userId) });
}
