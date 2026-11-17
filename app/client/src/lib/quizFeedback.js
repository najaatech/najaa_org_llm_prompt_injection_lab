// Plain functions (no React) that turn a saved quiz result into the feedback shown to the learner.

export const formatDuration = (ms) => {
  const seconds = Math.max(0, Math.round((Number(ms) || 0) / 1000));
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
};

const RANKING_RULE = 'On the leaderboard a higher score ranks first, and among equal scores the shorter time wins.';

/**
 * Feedback for the pipeline game: { severity, title, text }. Each wrong try costs one point.
 * result is the saved result: { score, total, mistakes, durationMs, timedOut }.
 */
export function pipelineFeedback(result, limitMs = 5 * 60 * 1000) {
  const { score, total, durationMs, timedOut } = result;
  const mistakes = result.mistakes ?? 0;
  const summary = `${score} / ${total} in ${formatDuration(durationMs)}, with ${mistakes} wrong ${mistakes === 1 ? 'try' : 'tries'}.`;
  if (timedOut && score < total) {
    return { severity: 'warning', title: 'Time ran out', text: `${summary} Pieces you had not placed count for nothing. ${RANKING_RULE}` };
  }
  if (score === total) {
    const fast = durationMs <= limitMs * 0.25;
    return {
      severity: 'success',
      title: fast ? 'Perfect and fast' : 'Perfect build',
      text: `${summary} Every piece went in on the first try${fast ? ' and you were quick' : '. A shorter time would rank you even higher'}. ${RANKING_RULE}`
    };
  }
  return {
    severity: score / total >= 0.7 ? 'success' : 'info',
    title: 'Pipeline built',
    text: `${summary} Each wrong try costs one point, so think about what each piece needs before you place it. ${RANKING_RULE}`
  };
}

/**
 * Feedback for a finished quiz: { severity, title, text }.
 * result is the saved result: { score, total, durationMs, timedOut }.
 */
export function quizFeedback(result, limitMs = 5 * 60 * 1000) {
  const { score, total, durationMs, timedOut } = result;
  const summary = `${score} / ${total} in ${formatDuration(durationMs)}.`;
  const ratio = total > 0 ? score / total : 0;

  if (timedOut) {
    return {
      severity: 'warning',
      title: 'Time ran out',
      text: `${summary} Questions you had not answered count as wrong. Next time, answer the ones you know first. ${RANKING_RULE}`
    };
  }
  if (ratio === 1) {
    const fast = durationMs <= limitMs * 0.25;
    return {
      severity: 'success',
      title: fast ? 'Perfect and fast' : 'Perfect score',
      text: fast
        ? `${summary} Every answer is right and you were quick. That is the best possible kind of result. ${RANKING_RULE}`
        : `${summary} Every answer is right. A shorter time would rank you even higher. ${RANKING_RULE}`
    };
  }
  if (ratio >= 0.7) {
    return {
      severity: 'success',
      title: 'Strong result',
      text: `${summary} Read the explanations for the ones you missed. ${RANKING_RULE}`
    };
  }
  if (ratio >= 0.4) {
    return {
      severity: 'info',
      title: 'Getting there',
      text: `${summary} Read each explanation below, then play the levels to see the ideas in action. ${RANKING_RULE}`
    };
  }
  return {
    severity: 'warning',
    title: 'Worth another look',
    text: `${summary} The explanations below show what to look for. Work through the levels, which teach the same ideas. ${RANKING_RULE}`
  };
}
