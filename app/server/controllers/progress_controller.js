import { publicUser } from '../models/user_model.js';
import { httpError } from '../utils/http_error.js';
import { loadCurrentUser } from '../middleware/auth_guards.js';

/** POST /api/reset: stops any running request and clears the learner's progress. */
export async function progress_reset(req, res) {
  const { store, requestGate } = req.app.locals.services;
  const user = await loadCurrentUser(req);

  requestGate.abort(user._id, httpError('Activity stopped or reset.', 409));
  await store.resetUser(user._id);
  res.json({ user: publicUser(await store.getUser(user._id)) });
}
