import { randomBytes } from 'node:crypto';
import helmet from 'helmet';

/**
 * Adds a fresh CSP nonce to every request and sets the security headers.
 * Emotion (MUI) writes <style> tags at runtime; the nonce allows exactly those without 'unsafe-inline'.
 */
export function securityHeaders() {
  const createNonce = (req, res, next) => {
    res.locals.cspNonce = randomBytes(16).toString('base64');
    next();
  };
  const styleNonce = (req, res) => `'nonce-${res.locals.cspNonce}'`;

  const helmetMiddleware = helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", styleNonce],
        imgSrc: ["'self'", 'data:'],
        fontSrc: ["'self'"],
        connectSrc: ["'self'"],
        upgradeInsecureRequests: null
      }
    },
    // The lab also runs over plain HTTP on localhost, so HSTS must stay off.
    strictTransportSecurity: false
  });

  return [createNonce, helmetMiddleware];
}
