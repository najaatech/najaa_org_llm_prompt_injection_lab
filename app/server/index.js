import { createApp } from './app.js';
import { APP_TITLE, readServerSettings } from './config.js';
import { model } from './services/ollama_service.js';
import { createMailgunMailer } from './services/mailgun_service.js';
import { MongoStore } from './stores/mongo_store.js';
import { listLocalUrls } from './utils/network_urls.js';
import { isLocalOnlyServer } from './services/local_signin.js';

/** Starts the real server: loads .env, connects to MongoDB and listens. Run with `npm start`. */
async function startServer() {
  try {
    process.loadEnvFile();
  } catch {
    // .env is optional.
  }

  const settings = readServerSettings();
  const localUrls = listLocalUrls(settings.port, settings.host);
  const mailer = createMailgunMailer();

  let store;
  try {
    store = await MongoStore.connect(settings.mongoUri, settings.mongoDb);
  } catch {
    console.error('Cannot reach MongoDB. Start it on localhost:27017 or set MONGODB_URI.');
    process.exit(1);
  }

  const runtime = createApp({
    store,
    mailer,
    allowedOrigins: localUrls,
    publicUrl: settings.publicUrl,
    localOnly: isLocalOnlyServer(settings)
  });

  const server = runtime.app.listen(settings.port, settings.host, () => {
    printBanner({ localUrls, publicUrl: settings.publicUrl, mailer, localOnly: isLocalOnlyServer(settings) });
  });

  const shutdown = async () => {
    runtime.requestGate.abortAll();
    server.close();
    server.closeAllConnections();
    await store.close();
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

function printBanner({ localUrls, publicUrl, mailer, localOnly }) {
  const addresses = publicUrl ? [...localUrls, `${publicUrl}  (public)`] : localUrls;
  const mailStatus = localOnly ? 'not needed, sign-in needs no code on this computer'
    : mailer.configured() ? 'configured' : 'NOT configured, sign-in codes cannot be sent';
  const warning = publicUrl
    ? 'PUBLIC mode: anyone with the public link can sign in and use this lab. Stop it when the session ends.'
    : 'LAN mode is trusted HTTP only. Never expose publicly.';

  console.log(`
${APP_TITLE}
${addresses.join('\n')}

Model: ${model}
MongoDB: connected
Email (Mailgun): ${mailStatus}
All experiments require the local model. No fallback.
${warning}
`);
}

await startServer();
