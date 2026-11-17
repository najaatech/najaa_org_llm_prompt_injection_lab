import { httpError } from '../utils/http_error.js';

const SAFE_METHODS = ['GET', 'HEAD'];

/**
 * First checks for every /api request:
 * - the Host header must be one this server is known by (when a list is configured),
 * - a browser Origin header must match the Host the request was sent to,
 * - cross-site requests are refused,
 * - requests that change data must be JSON.
 * Comparing hosts (not full origins) keeps this working over both http and https tunnels.
 */
export function apiGuard({ allowedHosts }) {
  return (req, res, next) => {
    res.set('Cache-Control', 'no-store');

    const host = req.get('host');
    if (allowedHosts.size && !allowedHosts.has(host)) {
      return next(httpError('Unrecognized host.', 403));
    }

    const origin = req.get('origin');
    if (origin && hostOfOrigin(origin) !== host) {
      return next(httpError('Cross-origin request blocked.', 403));
    }

    if (req.get('sec-fetch-site') === 'cross-site') {
      return next(httpError('Cross-site request blocked.', 403));
    }

    if (!SAFE_METHODS.includes(req.method) && !req.is('application/json')) {
      return next(httpError('JSON requests required.', 415));
    }

    next();
  };
}

function hostOfOrigin(origin) {
  try {
    return new URL(origin).host;
  } catch {
    return null;
  }
}
