import { RATE_LIMITS } from '../config.js';
import { model as defaultModel } from '../services/ollama_service.js';
import { publicUser } from '../models/user_model.js';
import { conversationDocuments, groupConversations } from '../models/conversation_model.js';
import { challengeAskSchema, challengeFlagSchema, challengeStartSchema, conversationResetSchema } from '../validators/request_schemas.js';
import { httpError } from '../utils/http_error.js';
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
    // Saved only for replies that were really delivered, never for stopped or reset requests.
    await store.appendConversation(conversationDocuments({
      userId: user._id,
      levelId: levelIds[input.level],
      message: input.message,
      answer: outcome.answer,
      model: input.model ?? defaultModel,
      retrieved: outcome.retrieved
    }));
    return outcome;
  });

  if (!res.destroyed) res.json(result);
}

/** GET /api/conversations: the learner's saved chats, keyed by level id and then by model. */
export async function conversations_get(req, res) {
  const { store } = req.app.locals.services;
  const user = await loadCurrentUser(req);
  res.json({ conversations: groupConversations(await store.listConversations(user._id)) });
}

/**
 * POST /api/conversations/reset: stops a running reply and deletes the learner's saved chat with one model
 * on one level. Other models' chats, flags and progress are not touched.
 */
export async function conversation_reset(req, res) {
  const { store, requestGate } = req.app.locals.services;
  consumeRateLimit(req, 'chatReset', RATE_LIMITS.chatReset);
  const input = conversationResetSchema.parse(req.body);
  const user = await loadCurrentUser(req);
  requestGate.abort(user._id, httpError('Chat reset.', 409));
  await store.clearConversation(user._id, levelIds[input.level], input.model ?? defaultModel);
  res.json({ ok: true });
}

/**
 * POST /api/challenge/start: records when the learner first opened a flag challenge. There is no time limit;
 * opening it again changes nothing, so the first open is the start time.
 */
export async function challenge_start(req, res) {
  const { store } = req.app.locals.services;
  consumeRateLimit(req, 'levelStart', RATE_LIMITS.levelStart);
  const { level } = challengeStartSchema.parse(req.body);
  const user = await loadCurrentUser(req);
  await store.startLevel(user._id, levelIds[level], new Date().toISOString());
  res.json({ user: publicUser(await store.getUser(user._id)) });
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
    const now = new Date().toISOString();
    user.solved[levelId] = true;
    await store.saveUser(user);
    await store.startLevel(user._id, levelId, now);
    await store.markLevelSolved(user._id, levelId, now);
  }
  res.json({ correct, user: publicUser(await store.getUser(user._id)) });
}
