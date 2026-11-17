# Understanding and mitigating prompt injection vulnerabilities

A deliberately vulnerable, single-user local lab for learning prompt injection against a small local LLM. Everything runs on your machine: a native Ollama model, a local MongoDB, and a fixed fictional MCP server. Do not expose it to the Internet.

## What is in it

- **Levels 1-3**: a chat assistant (MUI X Chat interface; choose `qwen2.5:3b` or the weaker `qwen2.5:1.5b`) with a hidden per-user flag. L1 relies on a weak prompt-only guard. L2 adds a stronger prompt, an input keyword filter and exact-match output redaction. L3 lets the model choose a vault key that the server validates before a fixed MongoDB lookup. Submit the flag you obtain to mark a level solved.
- **Bonus C (MCP)**: a live experiment with an optional defended mode. State is per user. The MCP server only exposes fictional constants.
- **Sorting game** and **RAG quick quiz**: short deterministic exercises.

## How retrieval works (RAG with embeddings)

The Level 1 and 2 notes are embedded once per user with `nomic-embed-text` (Ollama) and the vectors are stored in the local MongoDB next to the notes. Each question is embedded, compared with the stored vectors by cosine similarity in Node.js (minimum score 0.6), and the best matches are pasted into the model prompt. No Atlas Vector Search is needed. If the embedding model is unavailable the request fails with an explicit error; there is no keyword fallback. The retrieval scores are shown in the "What the server did" panel.

Flags are random per user, created at the first verified login and never sent to the browser except through model output. Simulated outcomes are not used; model results come from the local model.

## Requirements

- Node.js 24 or later
- MongoDB on `localhost:27017` (or set `MONGODB_URI`)
- Ollama running natively with `qwen2.5:3b`, `qwen2.5:1.5b` and `nomic-embed-text` (`npm run model:pull`)
- A Mailgun domain for sign-in codes

## Setup

Create `.env` (ignored by git):

```
MAILGUN_API_KEY=...
MAILGUN_DOMAIN=...
MAILGUN_FROM_EMAIL=...
```

Optional: `MAILGUN_BASE_URL`, `MONGODB_URI`, `MONGODB_DB` (default `prompt_injection_prototype`), `PORT` (3000), `HOST` (default `127.0.0.1`), `LAB_MODEL` (default `qwen2.5:3b`), `LAB_EMBED_MODEL` (default `nomic-embed-text`).

```
npm install
npm run preflight
npm start   # builds the client first
```

Open http://localhost:3000, enter your email and the six-digit code you receive. Codes last 10 minutes, allow 5 attempts and have a 60 second resend cooldown. Sessions last eight hours and are kept in memory.

## Sharing with an audience (ngrok and QR code)

Install ngrok and authenticate it once with `ngrok config add-authtoken <token>`, then run `npm run start:ngrok`. The script starts the tunnel, waits for its https address and starts the server with it as `PUBLIC_URL`. On the home page choose **Show QR code** and project it so the audience can scan it. Set `NGROK_DOMAIN` to use a reserved ngrok domain.

The server listens only on this computer; ngrok is the single way in. Anyone with the link can sign in and use the lab (each learner's data stays separate, enforced server-side), so stop it when the session ends. Free ngrok accounts show a one-time interstitial page before the app.

## Server structure

```
app/server/
  index.js        starts the server (MongoDB, listen, shutdown)
  app.js          builds the Express app and wires middleware
  routes.js       one line per endpoint, pointing at its controller
  config.js       limits, settings, environment
  controllers/    one function per endpoint, named like auth_login, auth_otp_verify
  middleware/     security headers, API guard, session loading, auth guards, errors
  models/         shape of each stored record (user, session, otp, vault entry, document)
  stores/         MongoDB and in-memory storage
  services/       model, retrieval, email, challenges, missions, MCP
  validators/     request schemas
  utils/          small shared helpers
```

## Commands

| Command | Purpose |
| --- | --- |
| `npm run build` | Build the React + MUI client into `app/dist` |
| `npm run dev` | Vite dev server on :5173, proxying `/api` to :3000 (run `npm start` too) |
| `npm start` | Build, then start on 127.0.0.1 |
| `npm run start:lan` | Bind to all interfaces (trusted network only; HTTP is unencrypted) |
| `npm run start:ngrok` | Build, open an ngrok tunnel, then start the lab with that public address (see below) |
| `npm run check` | Syntax check of every server file and script |
| `npm test` | Unit and HTTP tests (fake model and mailer), plus isolated local MongoDB integration; not live model results |
| `npm run preflight` | Check MongoDB, Mailgun configuration and Ollama |
| `npm run benchmark` | Time live model requests |

## Security notes

- Real tool capability is limited to fixed fictional constants in the local MCP server. There is no shell, arbitrary URL or file access.
- Learner and model text is rendered by React (escaped; model text is shown as sanitized Markdown). Authorization, CSRF and per-user data ownership are enforced server-side, independent of model output.
- Level 3 never passes model output to MongoDB except a key matching `^[a-z0-9-]{1,40}$`, scoped to the signed-in user.
- Do not put credentials in version control.

`lab.md` holds the original curriculum and sources.
