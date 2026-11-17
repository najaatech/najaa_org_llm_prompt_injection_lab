import express from 'express';
import { fileURLToPath } from 'node:url';
import { JSON_BODY_LIMIT } from './config.js';
import { apiGuard } from './middleware/api_guard.js';
import { apiNotFound, errorHandler } from './middleware/error_handler.js';
import { securityHeaders } from './middleware/security_headers.js';
import { sessionLoader } from './middleware/session_loader.js';
import { createApiRouter } from './routes.js';
import { page_index } from './controllers/page_controller.js';
import { createMailgunMailer } from './services/mailgun_service.js';
import { embed, generate, readiness } from './services/ollama_service.js';
import { runChallenge } from './services/challenge_service.js';
import { runAttempt } from './services/mission_service.js';
import { RequestGate } from './services/request_gate.js';
import { SessionRegistry } from './services/session_registry.js';
import { RateLimiter } from './utils/rate_limiter.js';
import { hostOfUrl } from './utils/network_urls.js';

/**
 * Builds the Express app. Everything it needs can be replaced through options, which is how the
 * tests run it without a real model, mailer or database.
 *
 * Options: store (required), mailer, readiness, runner, challengeRunner, llm, embed,
 * allowedOrigins (URLs this server answers to), publicUrl (address shown as a QR code), distDir.
 */
export function createApp(options = {}) {
  if (!options.store) throw new Error('createApp requires a store.');

  const requestGate = new RequestGate();
  const services = {
    store: options.store,
    mailer: options.mailer || createMailgunMailer(),
    sessions: new SessionRegistry(),
    rateLimiter: new RateLimiter(),
    requestGate,
    readiness: options.readiness || readiness,
    missionRunner: options.runner || runAttempt,
    challengeRunner: options.challengeRunner || runChallenge,
    llm: options.llm || generate,
    embed: options.embed || embed,
    publicUrl: options.publicUrl || null,
    distDir: options.distDir || fileURLToPath(new URL('../dist/', import.meta.url))
  };

  const allowedHosts = new Set((options.allowedOrigins || []).map(hostOfUrl));
  if (services.publicUrl && allowedHosts.size) allowedHosts.add(hostOfUrl(services.publicUrl));

  const app = express();
  app.locals.services = services;
  app.disable('x-powered-by');
  // ngrok (or any local reverse proxy) connects from loopback: trust it for the real client address and protocol.
  app.set('trust proxy', 'loopback');

  app.use(securityHeaders());
  app.use('/api', apiGuard({ allowedHosts }));
  app.use(express.json({ limit: JSON_BODY_LIMIT }));
  app.use('/api', sessionLoader());
  app.use('/api', createApiRouter());
  app.use('/api', apiNotFound);

  app.get('/', page_index);
  app.use(express.static(services.distDir, { dotfiles: 'deny', index: false }));
  app.use(errorHandler);

  return { app, store: services.store, requestGate, services };
}
