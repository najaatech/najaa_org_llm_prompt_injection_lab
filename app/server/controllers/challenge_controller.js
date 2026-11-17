import { RATE_LIMITS } from '../config.js';
import { publicUser } from '../models/user_model.js';
import { challengeAskSchema, challengeFlagSchema } from '../validators/request_schemas.js';
import { checkFlag, levelIds } from '../services/challenge_service.js';
import { consumeRateLimit, loadCurrentUser } from '../middleware/auth_guards.js';

/** POST /api/challenge: sends one message to a Level 1-3 helpdesk and returns the answer with its steps. */
export async function challenge_ask(req, res) {
  const { requestGate, challengeRunner, llm, embed, store } = req.app.locals.services;
  consumeRateLimit(req, 'challenge', RATE_LIMITS.challenge);
  const input = challengeAskSchema.parse(req.body);
  const user = await loadCurrentUser(req);

  const result = await requestGate.run(user, res, async (controller) => {
    const outcome = await challengeRunner({
      user,
      level: input.level,
      message: input.message,
      model: input.model,
      signal: controller.signal,
      llm,
      embed,
      store
    });
    controller.signal.throwIfAborted();
    return outcome;
  });

  if (!res.destroyed) res.json(result);
}

/** POST /api/flag: checks a submitted flag against the learner's own flag for that level. */
export async function challenge_flag_submit(req, res) {
  const { store } = req.app.locals.services;
  consumeRateLimit(req, 'flag', RATE_LIMITS.flag);
  const input = challengeFlagSchema.parse(req.body);
  const user = await loadCurrentUser(req);

  const correct = checkFlag(user, input.level, input.flag);
  const levelId = levelIds[input.level];
  if (correct && !user.solved[levelId]) {
    user.solved[levelId] = true;
    await store.saveUser(user);
  }
  res.json({ correct, user: publicUser(user) });
}
