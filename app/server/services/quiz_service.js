import { ragQuiz, sortingGame } from '../../content/catalog.js';
import { attach, isComplete, stages } from '../../content/ragStages.js';
import { QUIZ_GRACE_MS, QUIZ_TIME_LIMIT_MS } from '../config.js';
import { httpError } from '../utils/http_error.js';

/**
 * The two quizzes, with the right answers. They stay on the server.
 * `label` turns a stored answer into text that the learner can read in their result.
 */
const quizzes = {
  sorting: {
    items: sortingGame.lines.map((line) => ({
      id: line.id,
      correct: line.correct,
      why: line.why,
      accepts: (answer) => answer === 'instruction' || answer === 'data',
      label: (answer) => answer
    }))
  },
  'rag-quiz': {
    items: ragQuiz.questions.map((question) => ({
      id: question.id,
      correct: question.correct,
      why: question.why,
      accepts: (answer) => Number.isInteger(answer) && answer >= 0 && answer < question.options.length,
      label: (answer) => question.options[answer]
    }))
  }
};

/** The browser and server clocks can differ by a moment, so a submit this close to the end counts as time-out. */
const TIMEOUT_TOLERANCE_MS = 1000;

const timing = (startedAt, now) => {
  const elapsedMs = Math.max(0, now.getTime() - new Date(startedAt).getTime());
  return {
    elapsedMs,
    timedOut: elapsedMs >= QUIZ_TIME_LIMIT_MS - TIMEOUT_TOLERANCE_MS,
    tooLate: elapsedMs > QUIZ_TIME_LIMIT_MS + QUIZ_GRACE_MS
  };
};

const timeFields = (startedAt, now, elapsedMs, timedOut) => ({
  submittedAt: now.toISOString(),
  startedAt: new Date(startedAt).toISOString(),
  durationMs: Math.min(elapsedMs, QUIZ_TIME_LIMIT_MS),
  timedOut
});

/** The pipeline game is graded by replaying the learner's picks: the server counts the wrong tries itself. */
const MAX_PICKS = 200;
const PICK_TOKENS = new Set([...stages.map((stage) => stage.id), 'undo', 'reset']);

function gradePipeline(answers, { startedAt, now }) {
  const keys = Object.keys(answers);
  if (keys.length > MAX_PICKS) throw httpError('Too many moves.', 400);
  const picks = [];
  for (const key of keys) {
    const match = /^p(\d{1,3})$/.exec(key);
    if (!match || typeof answers[key] !== 'string' || !PICK_TOKENS.has(answers[key])) throw httpError('Invalid move.', 400);
    picks[Number(match[1])] = answers[key];
  }
  if (picks.length !== keys.length || picks.includes(undefined)) throw httpError('Invalid move order.', 400);

  const { elapsedMs, timedOut, tooLate } = timing(startedAt, now);
  let placed = [];
  let mistakes = 0;
  for (const pick of tooLate ? [] : picks) {
    if (pick === 'undo') placed = placed.slice(0, -1);
    else if (pick === 'reset') placed = [];
    else {
      const result = attach(placed, pick);
      if (result.ok) placed = result.placed;
      else mistakes += 1;
    }
  }
  if (!isComplete(placed) && !timedOut) throw httpError('Finish the pipeline before submitting.', 400);

  return {
    score: Math.max(0, placed.length - mistakes),
    total: stages.length,
    mistakes,
    ...timeFields(startedAt, now, elapsedMs, timedOut),
    review: []
  };
}

/**
 * Grades a quiz that the learner started at `startedAt` (server time) and records how long it took.
 * Before the time limit every item must be answered, so a score always means the same thing.
 * At the time limit the browser submits what it has, and unanswered items count as wrong.
 * A submission that arrives well after the limit plus a short grace period scores zero.
 * The result is what gets saved and later shown to the learner.
 */
export function gradeQuiz(quizId, answers, { startedAt, now = new Date() }) {
  if (quizId === 'rag-game') return gradePipeline(answers, { startedAt, now });
  const quiz = quizzes[quizId];
  if (!quiz) throw httpError('Unknown quiz.', 400);

  const known = new Set(quiz.items.map((item) => item.id));
  if (Object.keys(answers).some((id) => !known.has(id))) throw httpError('Unknown quiz item.', 400);
  for (const item of quiz.items) {
    if (Object.hasOwn(answers, item.id) && !item.accepts(answers[item.id])) throw httpError('Invalid answer.', 400);
  }

  const { elapsedMs, timedOut, tooLate } = timing(startedAt, now);
  const used = tooLate ? {} : answers;

  const review = quiz.items.map((item) => {
    const answered = Object.hasOwn(used, item.id);
    if (!answered && !timedOut) throw httpError('Answer every question before submitting.', 400);
    const answer = answered ? used[item.id] : null;
    return {
      id: item.id,
      answer,
      right: answered && answer === item.correct,
      correct: item.correct,
      correctLabel: item.label(item.correct),
      why: item.why
    };
  });

  return {
    score: review.filter((entry) => entry.right).length,
    total: review.length,
    ...timeFields(startedAt, now, elapsedMs, timedOut),
    review
  };
}
