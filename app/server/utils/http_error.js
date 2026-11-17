/**
 * Creates an Error that carries the HTTP status the error handler should answer with.
 * The message is shown to the learner, so keep it free of secrets and internals.
 */
export function httpError(message, status = 400) {
  return Object.assign(new Error(message), { status });
}
