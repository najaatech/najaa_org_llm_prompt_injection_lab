// Starts ngrok and the lab together, so the audience can open the lab (or scan its QR code)
// from their own phones without being on the same network.
//
//   npm run start:ngrok
//
// Requirements: ngrok installed and authenticated once with `ngrok config add-authtoken <token>`.
// Optional: NGROK_DOMAIN=my-name.ngrok-free.app to use a reserved domain.
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const NGROK_API = 'http://127.0.0.1:4040/api/tunnels';
const TUNNEL_WAIT_MS = 20_000;
const serverEntry = fileURLToPath(new URL('../app/server/index.js', import.meta.url));

try {
  process.loadEnvFile();
} catch {
  // .env is optional.
}

const port = Number(process.env.PORT || 3000);
const reservedDomain = process.env.NGROK_DOMAIN;
const children = [];

main().catch((error) => stopWith(error.message));

async function main() {
  const ngrok = startNgrok();
  const publicUrl = await waitForPublicUrl(ngrok);
  console.log(`\nngrok tunnel ready: ${publicUrl}`);
  startServer(publicUrl);
}

function startNgrok() {
  const args = ['http', `127.0.0.1:${port}`, '--log=stdout'];
  if (reservedDomain) args.push(`--url=${reservedDomain}`);

  const ngrok = spawn('ngrok', args, { stdio: ['ignore', 'pipe', 'pipe'] });
  children.push(ngrok);

  ngrok.lastOutput = '';
  const remember = (chunk) => {
    ngrok.lastOutput = (ngrok.lastOutput + chunk).slice(-2000);
  };
  ngrok.stdout.on('data', remember);
  ngrok.stderr.on('data', remember);

  ngrok.once('error', (error) => {
    const message = error.code === 'ENOENT' ? 'ngrok is not installed or not on PATH. Install it from https://ngrok.com/download' : error.message;
    stopWith(message);
  });
  return ngrok;
}

/** Polls the local ngrok API until the https tunnel for this port exists. */
async function waitForPublicUrl(ngrok) {
  let exited = false;
  ngrok.once('exit', () => {
    exited = true;
  });

  const deadline = Date.now() + TUNNEL_WAIT_MS;
  while (Date.now() < deadline) {
    if (exited) throw new Error(ngrokFailureMessage(ngrok.lastOutput));

    const url = await readHttpsTunnelUrl();
    if (url) return url;
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error(`ngrok did not report a tunnel within ${TUNNEL_WAIT_MS / 1000} seconds.\n${ngrok.lastOutput}`);
}

async function readHttpsTunnelUrl() {
  try {
    const response = await fetch(NGROK_API);
    const { tunnels = [] } = await response.json();
    const tunnel = tunnels.find((item) => item.public_url?.startsWith('https://') && item.config?.addr?.endsWith(`:${port}`));
    return tunnel?.public_url ?? null;
  } catch {
    return null; // ngrok is still starting.
  }
}

function ngrokFailureMessage(output) {
  if (/ERR_NGROK_4018|authentication failed|authtoken/i.test(output)) {
    return 'ngrok is not authenticated. Run once: ngrok config add-authtoken <your token> (token at https://dashboard.ngrok.com/get-started/your-authtoken)';
  }
  if (/ERR_NGROK_108|simultaneous/i.test(output)) {
    return 'Another ngrok session is already running on this account. Stop it, or use that tunnel, and retry.';
  }
  return `ngrok stopped unexpectedly.\n${output}`;
}

function startServer(publicUrl) {
  const server = spawn(process.execPath, [serverEntry], {
    stdio: 'inherit',
    // Listen only on this computer: ngrok is the single way in from outside.
    env: { ...process.env, PUBLIC_URL: publicUrl, HOST: '127.0.0.1', PORT: String(port) }
  });
  children.push(server);
  server.once('exit', (code) => stopWith(code ? `The server stopped with code ${code}.` : null, code ?? 0));
}

function stopWith(message, code = 1) {
  if (message) console.error(`\n${message}`);
  for (const child of children) child.kill('SIGTERM');
  process.exit(code);
}

process.on('SIGINT', () => stopWith(null, 0));
process.on('SIGTERM', () => stopWith(null, 0));
