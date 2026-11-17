import { useState } from 'react';
import { Alert, Button, FormControl, FormControlLabel, FormLabel, Radio, RadioGroup, Stack, Typography } from '@mui/material';
import { useApp } from '../context.js';
import { Section } from './common.jsx';

export function Quiz() {
  const { catalog } = useApp();
  const quiz = catalog.ragQuiz;
  const [answers, setAnswers] = useState({});
  const [checked, setChecked] = useState(false);
  const score = quiz.questions.filter((q) => answers[q.id] === q.correct).length;
  return (
    <>
      <Typography variant="h4" gutterBottom>{quiz.title}</Typography>
      <Typography sx={{ mb: 2 }}>{quiz.intro}</Typography>
      {quiz.questions.map((q, index) => (
        <Section key={q.id}>
          <FormControl disabled={checked}>
            <FormLabel sx={{ color: 'text.primary', mb: 1 }}>{index + 1}. {q.question}</FormLabel>
            <RadioGroup value={answers[q.id] ?? ''} onChange={(e) => setAnswers((a) => ({ ...a, [q.id]: Number(e.target.value) }))}>
              {q.options.map((option, i) => <FormControlLabel key={option} value={i} control={<Radio />} label={option} />)}
            </RadioGroup>
          </FormControl>
          {checked && (
            <Alert severity={answers[q.id] === q.correct ? 'success' : 'warning'} sx={{ mt: 1 }}>
              {answers[q.id] === q.correct ? 'Correct. ' : `Correct answer: ${q.options[q.correct]}. `}{q.why}
            </Alert>
          )}
        </Section>
      ))}
      <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
        {!checked && <Button variant="contained" disabled={Object.keys(answers).length < quiz.questions.length} onClick={() => setChecked(true)}>Check answers</Button>}
        {checked && <Typography>Score: {score} / {quiz.questions.length}</Typography>}
        {checked && <Button onClick={() => { setAnswers({}); setChecked(false); }}>Try again</Button>}
      </Stack>
    </>
  );
}
