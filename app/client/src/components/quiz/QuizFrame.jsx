import { Alert, AlertTitle, Box, Button, LinearProgress, Stack, Typography } from '@mui/material';
import { useApp } from '../../context/AppContext.js';
import { Section } from '../ui/index.js';
import { formatDuration, quizFeedback } from '../../lib/quizFeedback.js';

/**
 * Shared layout of a timed quiz: a start screen, then a countdown with the questions (children),
 * then the saved score, time and feedback. `quiz` is the object returned by useQuizSubmission.
 * Optional: `notes` (extra rules on the start screen), `progressText` (replaces the answered counter),
 * `describe` (own feedback function) and `hideSubmit` (for games that submit by themselves).
 */
export function QuizFrame({ quiz, title, intro, noun, answered, total, children, extraActions, notes = [], progressText, describe = quizFeedback, hideSubmit = false }) {
  const { go } = useApp();
  const { phase, saved, busy, start, submit, remainingMs, limitMs, expired } = quiz;
  const feedback = saved ? describe(saved, limitMs) : null;
  const low = remainingMs <= 30_000;

  return (
    <>
      <Typography variant="h4" gutterBottom>{title}</Typography>
      <Typography sx={{ mb: 2 }}>{intro}</Typography>

      {phase === 'idle' && (
        <Section title="Ready?">
          <Box component="ul" sx={{ pl: 3, mt: 0 }}>
            <li><Typography>You have {Math.round(limitMs / 60000)} minutes once you press Start. The timer runs on the server.</Typography></li>
            <li><Typography>You can submit only once, and your score and time are saved.</Typography></li>
            <li><Typography>A higher score is better. For the same score, a shorter time is better.</Typography></li>
            <li><Typography>When time runs out, the answers you have given so far are submitted for you.</Typography></li>
            {notes.map((note) => <li key={note}><Typography>{note}</Typography></li>)}
          </Box>
          <Stack direction="row" spacing={2}>
            <Button variant="contained" disabled={busy} onClick={start}>Start {noun}</Button>
            <Button onClick={() => go('leaderboard')}>View leaderboard</Button>
          </Stack>
        </Section>
      )}

      {phase === 'running' && (
        <Box sx={{ position: 'sticky', top: 64, zIndex: 2, bgcolor: 'background.paper', border: 1, borderColor: low ? 'error.main' : 'divider', borderRadius: 1, p: 1.5, mb: 2 }}>
          <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'baseline' }}>
            <Typography variant="h6" aria-live="off" sx={{ color: low ? 'error.main' : 'text.primary' }}>
              Time left: {formatDuration(Math.ceil(remainingMs / 1000) * 1000)}
            </Typography>
            <Typography variant="body2" color="text.secondary">{progressText ?? `${answered} / ${total} answered`}</Typography>
          </Stack>
          <LinearProgress variant="determinate" color={low ? 'error' : 'primary'} value={(remainingMs / limitMs) * 100} sx={{ mt: 1 }} />
        </Box>
      )}

      {feedback && (
        <Alert severity={feedback.severity} sx={{ mb: 2 }}>
          <AlertTitle>{feedback.title}</AlertTitle>
          {feedback.text}
        </Alert>
      )}

      {phase !== 'idle' && children}

      {phase === 'running' && !hideSubmit && (
        <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
          <Button variant="contained" disabled={busy || (!expired && answered < total)} onClick={submit}>Submit answers (final)</Button>
          <Typography variant="body2" color="text.secondary">Answer everything before the time runs out.</Typography>
        </Stack>
      )}
      {phase === 'done' && (
        <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
          <Typography>Score: {saved.score} / {saved.total} · Time: {formatDuration(saved.durationMs)}</Typography>
          <Button onClick={() => go('leaderboard')}>View leaderboard</Button>
          {extraActions}
        </Stack>
      )}
    </>
  );
}
