import { Alert, Box, Button, ToggleButton, ToggleButtonGroup } from '@mui/material';
import { useApp } from '../../context/AppContext.js';
import { Section } from '../../components/ui/index.js';
import { QuizFrame } from '../../components/quiz/QuizFrame.jsx';
import { useQuizSubmission } from '../../hooks/useQuizSubmission.js';

const labelOf = (value) => (value === 'instruction' ? 'Trusted instruction' : 'Lower-trust data');

export function Sorting() {
  const { catalog, go } = useApp();
  const game = catalog.sortingGame;
  const quiz = useQuizSubmission('sorting');
  const { saved, busy, answers, setAnswer } = quiz;
  return (
    <QuizFrame
      quiz={quiz} title={game.title} intro={game.intro} noun="game" answered={Object.keys(answers).length} total={game.lines.length}
      extraActions={<Button variant="contained" onClick={() => go('l1')}>Start Level 1 →</Button>}
    >
      {game.lines.map((line) => {
        const review = saved?.review.find((entry) => entry.id === line.id);
        return (
          <Section key={line.id}>
            <Box component="pre" sx={{ m: 0, mb: 1, whiteSpace: 'pre-wrap', fontFamily: 'monospace' }}>{line.text}</Box>
            <ToggleButtonGroup exclusive size="small" disabled={Boolean(saved) || busy} value={(review ? review.answer : answers[line.id]) || null}
              onChange={(_, value) => value && setAnswer(line.id, value)}>
              <ToggleButton value="instruction">{labelOf('instruction')}</ToggleButton>
              <ToggleButton value="data">{labelOf('data')}</ToggleButton>
            </ToggleButtonGroup>
            {review && (
              <Alert severity={review.right ? 'success' : 'warning'} sx={{ mt: 1 }}>
                {review.right ? 'CORRECT. ' : `${review.answer === null ? 'NOT TAGGED. ' : ''}ACTUALLY: ${labelOf(review.correct)}. `}{review.why}
              </Alert>
            )}
          </Section>
        );
      })}
    </QuizFrame>
  );
}
