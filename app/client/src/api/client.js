// Thin fetch wrapper. The CSRF token comes from /api/session and is sent on every POST except /api/auth/*.
let csrf = '';
let unauthorizedHandler = () => {};

export const setCsrf = (value) => { csrf = value || ''; };
export const onUnauthorized = (handler) => { unauthorizedHandler = handler; };

export async function api(endpoint, body) {
  const headers = { Accept: 'application/json' };
  const options = { method: body === undefined ? 'GET' : 'POST', credentials: 'same-origin', headers, cache: 'no-store' };
  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
    if (!endpoint.startsWith('/api/auth/')) {
      if (!csrf) throw new Error('Your session token is missing. Sign in again.');
      headers['X-CSRF-Token'] = csrf;
    }
    options.body = JSON.stringify(body);
  }
  let response;
  try { response = await fetch(endpoint, options); }
  catch { throw new Error('Cannot reach the server. Check that it is running.'); }
  let data;
  try { data = await response.json(); }
  catch { throw new Error(`HTTP ${response.status}: the server did not return JSON.`); }
  if (!response.ok) {
    const advice = response.status === 503 ? ' Check that the local model (Ollama) is running. No fallback was used.' : '';
    if (response.status === 401) unauthorizedHandler();
    throw Object.assign(new Error(`${typeof data.error === 'string' ? data.error : 'Request failed.'}${advice}`), { attempt: data.attempt, status: response.status });
  }
  return data;
}
