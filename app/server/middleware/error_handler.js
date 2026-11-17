import { ZodError } from 'zod';

/** Answers /api requests that matched no route. */
export function apiNotFound(req, res) {
  res.status(404).json({ error: 'Unknown endpoint.' });
}

/** Turns any error into a JSON answer. Internal details are logged, never sent to the browser. */
export function errorHandler(err, req, res, next) {
  if (res.headersSent) return next(err);

  const isValidation = err instanceof ZodError;
  const isTimeout = err.name === 'AbortError' || err.name === 'TimeoutError';
  const status = isValidation ? 400 : err.status || (isTimeout ? 503 : 500);

  if (status === 500) console.error('Request failed:', err.message);

  let message = err.message;
  if (isValidation) message = 'Invalid request. Check the field values and sizes.';
  else if (status === 500) message = 'Request failed. Check the server terminal. No fallback was used.';

  res.status(status).json({
    error: message,
    ...(res.locals.attempt ? { attempt: res.locals.attempt } : {})
  });
}
