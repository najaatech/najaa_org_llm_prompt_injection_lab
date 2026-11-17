# Prompt Injection Prototype: implementation plan

Convert Trust Lab (team classroom) into a single-user **Prompt Injection Prototype**: email OTP login (Mailgun), MongoDB at `localhost:27017`, three flag-hunting levels with per-user flags. Reference for the implementation; tick items as they are completed. Never commit or push without an explicit request.

## Decisions

- Level design: L1 RAG (weak prompt-only guard), L2 RAG (stronger prompt, input keyword filter, output redaction), L3 MongoDB vault secret via a fixed lookup tool.
- Per-user random flags, created at first verified login, stored in MongoDB.
- Kept: advanced missions (memory, worm, MCP), sorting game. Removed: doors, disguises, labs L1-L5, primer, foundations, React Flow, quiz, evidence, instructor console, teams, join code, old docs.
- `lab.md` is left untouched.
- Mailgun: HTTP API via `fetch`, US base URL by default, optional `MAILGUN_BASE_URL`. Env from `.env` through `process.loadEnvFile()`.
- Sessions are in memory (8 h). The queue is kept (one model job at a time, one per user).
- The user's flag must reach the client only through model output; it is redacted from recorded evidence.
- No user-controlled query ever reaches MongoDB; owner always comes from the session.

## Phase 1: Foundations

- [x] Add pinned `mongodb` driver; drop `react`, `react-dom`, `@xyflow/react`, `esbuild`, build script and `prestart`
- [x] Load `.env` at startup; support `MONGODB_URI`, `MONGODB_DB`; fail fast for Mongo and report missing Mailgun configuration without printing secrets
- [x] Async Mongo store (`users`, `otps`, `kb_documents`, `vault`) with indexes and idempotent public seed
- [x] In-memory store with the same interface for tests

## Phase 2: Email OTP login

- [x] `app/server/mailgun.js` (injectable, no secret logging)
- [x] `POST /api/auth/request` and `POST /api/auth/verify` (hashed 6-digit code, 10 min, 5 attempts, 60 s cooldown, rate limits, no enumeration)
- [x] Create user on first verified email with three random flags
- [x] Remove `/api/join`, `/api/login`, `/api/instructor`, `/api/quiz`, `/api/lab`, pause logic

## Phase 3: Challenge engine

- [x] Level definitions, hints, example prompts and mitigations in `app/content/catalog.js`
- [x] `app/server/retrieval.js` (embedding retriever; vectors stored on MongoDB documents, cosine similarity in app code)
- [x] `app/server/challenges.js` (`runChallenge`), `POST /api/challenge`, `POST /api/flag`
- [x] Flag redaction in challenge evidence; timing-safe flag check
- [x] `/api/attempt` kept for advanced missions only, per user

## Phase 4: Removal

- [x] Doors, disguises, quiz, schedule from `catalog.js` and related mitigations/runner code
- [x] Delete labs content/runner, React Flow, old docs, team/instructor API code, `teams.json` persistence

## Phase 5: Frontend

- [x] Rename to "Prompt Injection Prototype"; remove "YOUR FIELD WORKSPACE", instructor button, flow assets
- [x] Email then code login screen
- [x] Nav: Levels 1-3, Advanced missions, sorting game
- [x] Level page: chat, answer, hints, example prompt, flag submit, mitigation
- [ ] Optional cleanup: trim unused legacy CSS

## Phase 6: Tests, docs, instructions

- [x] Rewrite tests; add OTP, flag isolation, level, L3 key validation tests
- [x] Mongo integration test (skips if unavailable; disposable database)
- [x] Rewrite `README.md`; update `.github/copilot-instructions.md` and `scripts/preflight.mjs`

## Phase 7: Verification

- [x] `npm run check`, `npm test` (24 passed, including MongoDB), `npm audit` (0 vulnerabilities)
- [x] Browser OTP flow using an isolated database and fake mailbox; real Mailgun delivery remains untested
- [x] Live qwen2.5:3b benign smoke test per level; Level 2 blocklist path also checked
- [x] Tests verify catalog/session views hide generated flags, challenge evidence redacts flags, and cross-user flag checks fail

Browser checks also covered all navigation routes, sign-out and a 390px viewport without horizontal overflow. The temporary smoke database was deleted. The normal app remains running on localhost:3000. No commit, push or deployment check was performed; pre-existing changes to `lab.md` were not touched.
