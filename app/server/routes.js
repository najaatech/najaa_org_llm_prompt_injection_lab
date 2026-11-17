import { Router } from 'express';
import { requireCsrf, requireSignedIn } from './middleware/auth_guards.js';
import { auth_login, auth_logout, auth_otp_verify } from './controllers/auth_controller.js';
import { catalog_get, health_get, join_info_get, session_get } from './controllers/session_controller.js';
import { challenge_ask, challenge_flag_submit } from './controllers/challenge_controller.js';
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
  router.post('/challenge', ...signedInWithCsrf, challenge_ask);
  router.post('/flag', ...signedInWithCsrf, challenge_flag_submit);
  router.post('/attempt', ...signedInWithCsrf, mission_attempt_run);
  router.post('/reset', ...signedInWithCsrf, progress_reset);

  return router;
}
