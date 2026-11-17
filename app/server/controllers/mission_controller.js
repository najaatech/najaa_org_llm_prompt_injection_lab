import { RATE_LIMITS } from '../config.js';
import { publicUser } from '../models/user_model.js';
import { missionAttemptSchema } from '../validators/request_schemas.js';
import { consumeRateLimit, loadCurrentUser } from '../middleware/auth_guards.js';

/** POST /api/attempt: runs one trust-lab mission with the local model and saves the evidence. */
export async function mission_attempt_run(req, res) {
  const receivedAt = Date.now();
  const { store, requestGate, missionRunner } = req.app.locals.services;
  consumeRateLimit(req, 'attempt', RATE_LIMITS.attempt);
  const input = missionAttemptSchema.parse(req.body);
  const user = await loadCurrentUser(req);
  const queuedAt = Date.now();

  const result = await requestGate.run(user, res, async (controller) => {
    const queueWaitMs = Date.now() - queuedAt;
    const withTimings = (attempt) => ({ ...attempt, queueWaitMs, endToEndMs: Date.now() - receivedAt });

    // Work on a snapshot. A reset or abort can never commit a late model response.
    const draft = structuredClone(user);
    let attempt;
    try {
      attempt = await missionRunner(draft, input, controller.signal);
    } catch (err) {
      controller.signal.throwIfAborted();
      if (err.attempt) {
        // A failed run is still evidence: keep it on the learner's record and return it with the error.
        const failedAttempt = withTimings(err.attempt);
        user.attempts.push(failedAttempt);
        await store.saveUser(user);
        res.locals.attempt = failedAttempt;
      }
      throw err;
    }
    controller.signal.throwIfAborted();

    attempt = withTimings(attempt);
    draft.attempts.push(attempt);
    if (!draft.progress.includes(input.missionId)) draft.progress.push(input.missionId);
    await store.saveUser(draft);
    return { attempt, user: publicUser(draft) };
  });

  if (!res.destroyed) res.json(result);
}
