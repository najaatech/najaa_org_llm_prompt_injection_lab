import { QUIZ_TIME_LIMIT_MS, RATE_LIMITS } from '../config.js';
import { publicUser } from '../models/user_model.js';
import { gradeQuiz } from '../services/quiz_service.js';
import { quizStartSchema, quizSubmitSchema } from '../validators/request_schemas.js';
import { consumeRateLimit, loadCurrentUser } from '../middleware/auth_guards.js';
import { httpError } from '../utils/http_error.js';

const ALREADY_SUBMITTED = 'You already submitted this quiz. Your score is saved.';

/**
 * POST /api/quiz/start: starts the quiz timer on the server. Starting again resumes the same timer,
 * so reloading the page does not give extra time.
 */
export async function quiz_start(req, res) {
  const { store } = req.app.locals.services;
  consumeRateLimit(req, 'quiz', RATE_LIMITS.quiz);
  const { quizId } = quizStartSchema.parse(req.body);
  const user = await loadCurrentUser(req);
  if (user.quizScores && Object.hasOwn(user.quizScores, quizId)) throw httpError(ALREADY_SUBMITTED, 409);

  await store.startQuiz(user._id, quizId, new Date().toISOString());
  const { quizStarts } = await loadCurrentUser(req);
  res.json({ quizId, startedAt: quizStarts[quizId], serverNow: new Date().toISOString(), limitMs: QUIZ_TIME_LIMIT_MS });
}

/** POST /api/quiz: grades a quiz on the server and saves the score. A quiz can be submitted only once. */
export async function quiz_submit(req, res) {
  const { store } = req.app.locals.services;
  consumeRateLimit(req, 'quiz', RATE_LIMITS.quiz);
  const input = quizSubmitSchema.parse(req.body);
  const user = await loadCurrentUser(req);

  if (user.quizScores && Object.hasOwn(user.quizScores, input.quizId)) throw httpError(ALREADY_SUBMITTED, 409);

  const startedAt = user.quizStarts?.[input.quizId];
  if (!startedAt) throw httpError('Start the quiz first.', 409);

  const result = gradeQuiz(input.quizId, input.answers, { startedAt });
  // The store only saves if there is no result yet, so two simultaneous submissions cannot both count.
  if (!(await store.saveQuizResult(user._id, input.quizId, result))) throw httpError(ALREADY_SUBMITTED, 409);

  res.json({ result, user: publicUser(await store.getUser(user._id)) });
}
