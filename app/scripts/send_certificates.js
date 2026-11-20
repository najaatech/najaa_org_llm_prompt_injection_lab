/**
 * Emails every participant a certificate with their results and the top 3 of each challenge.
 *
 *   node scripts/send_certificates.js                  dry run: lists the recipients and writes previews to /tmp
 *   node scripts/send_certificates.js --send           really sends the emails
 *   node scripts/send_certificates.js --exclude=a,b    nicknames to ignore
 *   node scripts/send_certificates.js --send --only=a  email only these nicknames (rankings still use everyone)
 *
 * Excluded nicknames are left out of every ranking and receive no email.
 * A participant is a learner that submitted a quiz or game, or opened a flag challenge.
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { APP_TITLE, readServerSettings } from '../server/config.js';
import { mailgunConfig } from '../server/services/mailgun_service.js';
import { buildLeaderboards } from '../server/services/leaderboard_service.js';
import { MongoStore } from '../server/stores/mongo_store.js';

for (const file of ['.env', '../.env']) {
  try {
    process.loadEnvFile(file);
    break;
  } catch {
    // Try the next location.
  }
}

const args = process.argv.slice(2);
const send = args.includes('--send');

const only = (args.find((arg) => arg.startsWith('--only='))?.slice('--only='.length) ?? '')
  .split(',').map((nickname) => nickname.trim().toLowerCase()).filter(Boolean);

const QUIZ_BOARDS = [
  ['sorting', 'Instruction or data? game'],
  ['rag-quiz', 'RAG quick quiz'],
  ['rag-game', 'Build a RAG pipeline']
];
const FLAG_LEVELS = [
  ['l1', 'Flag challenge 1'],
  ['l2', 'Flag challenge 2'],
  ['l3', 'Flag challenge 3']
];

const escapeHtml = (text) => String(text).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
const duration = (seconds) => (seconds == null ? '-' : seconds >= 60 ? `${Math.floor(seconds / 60)}m ${String(seconds % 60).padStart(2, '0')}s` : `${seconds}s`);
const medal = (rank) => ['1st', '2nd', '3rd'][rank - 1] ?? `${rank}th`;

/** Fastest correct flag first. A solved flag with no recorded time sorts last. */
function flagLevelBoard(users, levelId) {
  return users
    .filter((user) => user.solved?.[levelId])
    .map((user) => {
      const { startedAt, solvedAt } = user.flagTimes?.[levelId] ?? {};
      const seconds = startedAt && solvedAt ? Math.max(0, Math.round((new Date(solvedAt) - new Date(startedAt)) / 1000)) : null;
      return { nickname: user.nickname || 'anonymous', seconds };
    })
    .sort((a, b) => (a.seconds ?? Infinity) - (b.seconds ?? Infinity) || a.nickname.localeCompare(b.nickname))
    .map((entry, index) => ({ ...entry, rank: index + 1 }));
}

/** Every challenge with its ranked rows: three quizzes/games, then the three flag challenges. */
function buildChallenges(users) {
  const boards = buildLeaderboards(users.map((user) => ({ ...user, id: user._id })), null);
  return [
    ...QUIZ_BOARDS.map(([id, label]) => ({
      id, label,
      rows: boards[id].map((row) => ({ rank: row.rank, nickname: row.nickname, result: `${row.score}/${row.total}`, seconds: row.seconds }))
    })),
    ...FLAG_LEVELS.map(([id, label]) => ({
      id, label,
      rows: flagLevelBoard(users, id).map((row) => ({ rank: row.rank, nickname: row.nickname, result: 'Flag found', seconds: row.seconds }))
    }))
  ];
}

function isParticipant(user) {
  return Boolean(Object.keys(user.quizScores ?? {}).length || Object.values(user.solved ?? {}).some(Boolean) || Object.keys(user.flagTimes ?? {}).length);
}

const cell = 'padding:8px 10px;border-bottom:1px solid #e2e8f0;font-size:14px;';

/** The email for one participant: their own results first, then the top 3 of each challenge. */
function renderCertificate(user, challenges, issuedOn) {
  const nickname = user.nickname || 'participant';
  const myRows = challenges.map((challenge) => ({ challenge, row: challenge.rows.find((row) => row.nickname === user.nickname) ?? null }));

  const textLines = [`CERTIFICATE OF PARTICIPATION`, APP_TITLE, '', `Awarded to ${nickname} on ${issuedOn}.`, '', 'YOUR RESULTS'];
  myRows.forEach(({ challenge, row }) => textLines.push(row ? `- ${challenge.label}: ${row.result} in ${duration(row.seconds)} (rank ${row.rank} of ${challenge.rows.length})` : `- ${challenge.label}: not completed`));
  textLines.push('', 'TOP 3 PER CHALLENGE');
  for (const challenge of challenges) {
    textLines.push(challenge.label);
    if (!challenge.rows.length) textLines.push('  No results');
    challenge.rows.slice(0, 3).forEach((row) => textLines.push(`  ${medal(row.rank)}  ${row.nickname}  ${row.result}  ${duration(row.seconds)}`));
  }

  const resultRows = myRows.map(({ challenge, row }) => `
    <tr>
      <td style="${cell}">${escapeHtml(challenge.label)}</td>
      <td style="${cell}">${row ? escapeHtml(row.result) : '-'}</td>
      <td style="${cell}">${row ? escapeHtml(duration(row.seconds)) : '-'}</td>
      <td style="${cell}">${row ? `${medal(row.rank)} of ${challenge.rows.length}` : 'not completed'}</td>
    </tr>`).join('');

  const topBlocks = challenges.map((challenge) => {
    const rows = challenge.rows.slice(0, 3).map((row) => `
      <tr style="${row.nickname === user.nickname ? 'background:#eef6ff;font-weight:bold;' : ''}">
        <td style="${cell}width:48px;">${medal(row.rank)}</td>
        <td style="${cell}">${escapeHtml(row.nickname)}</td>
        <td style="${cell}">${escapeHtml(row.result)}</td>
        <td style="${cell}">${escapeHtml(duration(row.seconds))}</td>
      </tr>`).join('');
    return `
      <h3 style="margin:22px 0 6px;font-size:15px;color:#0f2742;">${escapeHtml(challenge.label)}</h3>
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;">
        ${rows || `<tr><td style="${cell}color:#64748b;">No results yet</td></tr>`}
      </table>`;
  }).join('');

  const html = `<!doctype html>
<html><body style="margin:0;padding:24px;background:#f1f5f9;font-family:Helvetica,Arial,sans-serif;color:#0f172a;">
  <table role="presentation" align="center" width="640" cellspacing="0" cellpadding="0" style="max-width:640px;width:100%;background:#ffffff;border:6px double #0f2742;">
    <tr><td style="padding:32px 36px;">
      <p style="margin:0;text-align:center;letter-spacing:3px;font-size:12px;color:#64748b;">CERTIFICATE OF PARTICIPATION</p>
      <h1 style="margin:10px 0 4px;text-align:center;font-size:22px;color:#0f2742;">${escapeHtml(APP_TITLE)}</h1>
      <p style="margin:18px 0 0;text-align:center;font-size:15px;">This certifies that</p>
      <p style="margin:6px 0;text-align:center;font-size:30px;font-weight:bold;color:#0f2742;">${escapeHtml(nickname)}</p>
      <p style="margin:0 0 24px;text-align:center;font-size:15px;">took part in the prompt injection escape room on ${escapeHtml(issuedOn)}.</p>

      <h2 style="margin:0 0 6px;font-size:16px;color:#0f2742;">Your results</h2>
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;">
        <tr style="background:#f8fafc;text-align:left;">
          <th style="${cell}">Challenge</th><th style="${cell}">Result</th><th style="${cell}">Time</th><th style="${cell}">Rank</th>
        </tr>${resultRows}
      </table>

      <h2 style="margin:30px 0 0;font-size:16px;color:#0f2742;">Top 3 of each challenge</h2>${topBlocks}
    </td></tr>
  </table>
</body></html>`;

  return { subject: `Your certificate: ${APP_TITLE}`, text: textLines.join('\n'), html };
}

async function sendEmail(config, to, message) {
  const body = new URLSearchParams({ from: `${APP_TITLE} <${config.from}>`, to, subject: message.subject, text: message.text, html: message.html });
  const response = await fetch(`${config.baseUrl}/v3/${encodeURIComponent(config.domain)}/messages`, {
    method: 'POST',
    headers: { Authorization: `Basic ${Buffer.from(`api:${config.apiKey}`).toString('base64')}` },
    body,
    signal: AbortSignal.timeout(15000)
  });
  if (!response.ok) throw new Error(`Mailgun HTTP ${response.status}`);
}

async function main() {
  const settings = readServerSettings();
  const store = await MongoStore.connect(settings.mongoUri, settings.mongoDb);
  try {
    const everyone = await store.users.find({}, { projection: { email: 1, nickname: 1, solved: 1, quizScores: 1, flagTimes: 1 } }).toArray();
    const counted = everyone;
    const participants = counted.filter(isParticipant);
    const challenges = buildChallenges(participants);
    const issuedOn = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

    for (const challenge of challenges) {
      console.log(`${challenge.label}: ${challenge.rows.slice(0, 3).map((row) => `${row.rank}. ${row.nickname} (${row.result}, ${duration(row.seconds)})`).join('  ') || 'no results'}`);
    }

    if (!send) {
      await mkdir('/tmp/certificates', { recursive: true });
      for (const user of participants.slice(0, 3)) {
        await writeFile(`/tmp/certificates/${user.nickname || user._id}.html`, renderCertificate(user, challenges, issuedOn).html);
      }
      console.log('Dry run: nothing was sent. Sample previews are in /tmp/certificates. Recipients:');
      participants.forEach((user) => console.log(`  ${user.nickname || '(no nickname)'} <${user.email}>`));
      return;
    }

    const config = mailgunConfig();
    if (!config) throw new Error('Mailgun is not configured in .env.');
    const recipients = only.length ? participants.filter((user) => only.includes(String(user.nickname).toLowerCase())) : participants;
    let sent = 0;
    for (const user of recipients) {
      try {
        await sendEmail(config, user.email, renderCertificate(user, challenges, issuedOn));
        sent += 1;
        console.log(`Sent: ${user.nickname || user._id}`);
      } catch (cause) {
        console.error(`Failed: ${user.nickname || user._id}: ${cause.message}`);
      }
    }
    console.log(`Done: ${sent} of ${recipients.length} sent.`);
  } finally {
    await store.client.close();
  }
}

await main();
