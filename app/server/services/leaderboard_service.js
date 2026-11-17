const BOARD_SIZE = 100;
const SOLVED_LEVELS = ['l1', 'l2', 'l3'];

/** Higher score first, then shorter time, then the nickname so equal results have a steady order. */
const better = (a, b) => b.score - a.score || a.seconds - b.seconds || a.nickname.localeCompare(b.nickname);

const toRows = (entries, meId) =>
  entries
    .sort(better)
    .slice(0, BOARD_SIZE)
    .map((entry, index) => ({
      rank: index + 1, nickname: entry.nickname, me: entry.id === meId, score: entry.score, total: entry.total, seconds: entry.seconds, solved: entry.solved,
      ...(entry.levels ? { levels: entry.levels } : {})
    }));

/**
 * Per flag challenge: submitted (flag found, with the time from first open to submission, if recorded),
 * open (started but no correct flag yet) or not started. The time is recorded, never limited.
 */
const flagLevels = (user) =>
  SOLVED_LEVELS.map((id) => {
    const times = user.flagTimes?.[id] ?? {};
    const submitted = Boolean(user.solved?.[id]);
    const seconds = submitted && times.startedAt && times.solvedAt
      ? Math.max(0, Math.round((Date.parse(times.solvedAt) - Date.parse(times.startedAt)) / 1000))
      : null;
    return { id, status: submitted ? 'submitted' : times.startedAt ? 'open' : 'not-started', seconds };
  });

/**
 * Builds the leaderboards from the stored learners. Rows carry the nickname only, never the email or id.
 * Ranking rule: higher score first, then shorter time. The overall board adds the scores of the quizzes and the pipeline game
 * and their times; only learners that finished all of them appear on it.
 * The flag board lists every learner that opened at least one flag challenge: score is the flags submitted, time is the sum of their durations.
 */
export function buildLeaderboards(users, meId) {
  const quizIds = ['sorting', 'rag-quiz', 'rag-game'];
  const boards = { overall: [], flags: [], sorting: [], 'rag-quiz': [], 'rag-game': [] };

  for (const user of users) {
    const nickname = user.nickname || 'anonymous';
    const solved = SOLVED_LEVELS.filter((level) => user.solved?.[level]).length;
    const levels = flagLevels(user);
    if (levels.some((level) => level.status !== 'not-started')) {
      boards.flags.push({ id: user.id, nickname, solved, levels, score: solved, total: SOLVED_LEVELS.length, seconds: levels.reduce((sum, level) => sum + (level.seconds ?? 0), 0) });
    }
    const results = quizIds.map((id) => user.quizScores?.[id]);
    results.forEach((result, index) => {
      if (!result) return;
      boards[quizIds[index]].push({ id: user.id, nickname, score: result.score, total: result.total, seconds: Math.round((result.durationMs ?? 0) / 1000), solved });
    });
    if (results.every(Boolean)) {
      boards.overall.push({
        id: user.id, nickname, solved,
        score: results.reduce((sum, result) => sum + result.score, 0),
        total: results.reduce((sum, result) => sum + result.total, 0),
        seconds: results.reduce((sum, result) => sum + Math.round((result.durationMs ?? 0) / 1000), 0)
      });
    }
  }

  return Object.fromEntries(Object.entries(boards).map(([name, entries]) => [name, toRows(entries, meId)]));
}
