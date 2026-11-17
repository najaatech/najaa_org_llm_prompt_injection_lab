import { RATE_LIMITS } from '../config.js';
import { publicUser } from '../models/user_model.js';
import { consumeRateLimit, loadCurrentUser } from '../middleware/auth_guards.js';
import { httpError } from '../utils/http_error.js';
import { nicknameSchema } from '../validators/request_schemas.js';

/** POST /api/nickname: lets a learner choose their public nickname. Nicknames are unique. */
export async function nickname_set(req, res) {
  const { store } = req.app.locals.services;
  consumeRateLimit(req, 'profile', RATE_LIMITS.profile);
  const { nickname } = nicknameSchema.parse(req.body);
  const user = await loadCurrentUser(req);

  if (!(await store.setNickname(user._id, nickname))) throw httpError('That nickname is taken. Try another.', 409);
  res.json({ user: publicUser(await store.getUser(user._id)) });
}
