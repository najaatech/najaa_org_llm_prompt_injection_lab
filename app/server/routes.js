import { Router } from 'express';
import { requireCsrf, requireSignedIn } from './middleware/auth_guards.js';
import { auth_login, auth_logout, auth_otp_verify } from './controllers/auth_controller.js';
import { catalog_get, health_get, join_info_get, session_get } from './controllers/session_controller.js';
import { challenge_ask, challenge_flag_submit, challenge_start, conversation_reset, conversations_get } from './controllers/challenge_controller.js';
import { quiz_start, quiz_submit } from './controllers/quiz_controller.js';
import { leaderboard_get } from './controllers/leaderboard_controller.js';
import { nickname_set } from './controllers/profile_controller.js';
import { mission_attempt_run } from './controllers/mission_controller.js';
import { progress_reset } from './controllers/progress_controller.js';

/**
 * Every API endpoint and the controller that answers it.
 * Express 5 forwards errors from async controllers to the error handler, so no wrapper is needed.
 */
export function createApiRouter() {
  const router = Router();
  const signedInWithCsrf = [requireSignedIn, requireCsrf];

  // Public
  router.get('/session', session_get);
  router.get('/catalog', catalog_get);
  router.get('/health', health_get);
  router.get('/join_info', join_info_get);

  // Sign in
  router.post('/auth/request', auth_login);
  router.post('/auth/verify', auth_otp_verify);
  router.post('/logout', ...signedInWithCsrf, auth_logout);

  // Signed-in learners only
  router.get('/conversations', requireSignedIn, conversations_get);
  router.get('/leaderboard', requireSignedIn, leaderboard_get);
  router.post('/nickname', ...signedInWithCsrf, nickname_set);
  router.post('/quiz/start', ...signedInWithCsrf, quiz_start);
  router.post('/quiz', ...signedInWithCsrf, quiz_submit);
  router.post('/challenge', ...signedInWithCsrf, challenge_ask);
  router.post('/challenge/start', ...signedInWithCsrf, challenge_start);
  router.post('/conversations/reset', ...signedInWithCsrf, conversation_reset);
  router.post('/flag', ...signedInWithCsrf, challenge_flag_submit);
  router.post('/attempt', ...signedInWithCsrf, mission_attempt_run);
  router.post('/reset', ...signedInWithCsrf, progress_reset);

  return router;
}
