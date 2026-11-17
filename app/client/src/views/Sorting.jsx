import { useState } from 'react';
import { Alert, Box, Button, Stack, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material';
import { useApp } from '../context.js';
import { Section } from './common.jsx';

export function Sorting() {
  const { catalog, go } = useApp();
  const game = catalog.sortingGame;
  const [answers, setAnswers] = useState({});
  const [checked, setChecked] = useState(false);
  const tagged = Object.keys(answers).length;
  const score = game.lines.filter((l) => answers[l.id] === l.correct).length;
  return (
    <>
      <Typography variant="h4" gutterBottom>{game.title}</Typography>
      <Typography sx={{ mb: 2 }}>{game.intro}</Typography>
      {game.lines.map((line) => {
        const right = answers[line.id] === line.correct;
        return (
          <Section key={line.id}>
            <Box component="pre" sx={{ m: 0, mb: 1, whiteSpace: 'pre-wrap', fontFamily: 'monospace' }}>{line.text}</Box>
            <ToggleButtonGroup exclusive size="small" disabled={checked} value={answers[line.id] || null}
              onChange={(_, value) => value && setAnswers((a) => ({ ...a, [line.id]: value }))}>
              <ToggleButton value="instruction">Trusted instruction</ToggleButton>
              <ToggleButton value="data">Lower-trust data</ToggleButton>
            </ToggleButtonGroup>
            {checked && (
              <Alert severity={right ? 'success' : 'warning'} sx={{ mt: 1 }}>
                {right ? 'CORRECT. ' : `ACTUALLY: ${line.correct === 'instruction' ? 'Trusted instruction' : 'Lower-trust data'}. `}{line.why}
              </Alert>
            )}
          </Section>
        );
      })}
      <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
        <Typography>{tagged} / {game.lines.length} tagged.</Typography>
        {!checked && <Button variant="contained" disabled={tagged < game.lines.length} onClick={() => setChecked(true)}>Check my answers</Button>}
        {checked && <Typography>Score: {score} / {game.lines.length}</Typography>}
        {checked && <Button onClick={() => { setAnswers({}); setChecked(false); }}>Try again</Button>}
        {checked && <Button variant="contained" onClick={() => go('l1')}>Start Level 1 →</Button>}
      </Stack>
    </>
  );
}
