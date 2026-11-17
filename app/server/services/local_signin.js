const LOOPBACK_HOSTS = new Set(['127.0.0.1', 'localhost', '::1']);

/**
 * Sign-in without a code is only for a lab run on this computer alone: plain `npm start`, so no public (ngrok) address,
 * the server bound to loopback, and this particular request addressed to localhost and not relayed by a proxy.
 * `npm run start:lan` and `npm run start:ngrok` keep the emailed code.
 */
export const isLocalOnlyServer = ({ publicUrl, host }) => !publicUrl && LOOPBACK_HOSTS.has(host);

export function otpRequired(req) {
  const { localOnly } = req.app.locals.services;
  const direct = LOOPBACK_HOSTS.has(req.hostname) && !req.headers['x-forwarded-for'] && !req.headers.forwarded;
  return !(localOnly && direct);
}
