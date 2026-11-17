import { useState } from 'react';
import { Box, Button, Chip, LinearProgress, Typography } from '@mui/material';
import { useApp } from '../context.js';
import { Section } from './common.jsx';
import { QrDialog } from './QrDialog.jsx';

export function Start() {
  const { catalog, session, go } = useApp();
  const [qrOpen, setQrOpen] = useState(false);
  const levels = catalog.levels;
  const solved = levels.filter((l) => session.user.solved[l.id]).length;
  const next = levels.find((l) => !session.user.solved[l.id]);
  return (
    <>
      <Typography variant="h4" gutterBottom>Hunt the flags.</Typography>
      <Section title="How it works">
        <Box component="ol" sx={{ pl: 3, m: 0 }}>
          <li>The app searches its notes for ones that match your question (retrieval).</li>
          <li>It pastes those notes into the prompt for the chatbot.</li>
          <li>The model cannot tell the app’s rules from text inside the notes.</li>
          <li>Find the flag, submit it, then read the defense.</li>
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Everything is fictional and local. Flags are generated per account.
        </Typography>
      </Section>
      <Section title="Warm-up and quick quiz">
        <Button onClick={() => go('sorting')} sx={{ mr: 1 }}>Instruction or data? game →</Button>
        <Button onClick={() => go('quiz')}>RAG quick quiz →</Button>
      </Section>
      <Section title="Your progress">
        <Typography>{solved} / {levels.length} Levels solved</Typography>
        <LinearProgress variant="determinate" value={(solved / levels.length) * 100} sx={{ my: 1 }} />
        {next
          ? <Button variant="contained" onClick={() => go(next.id)}>Open Level {next.level} →</Button>
          : <Typography>All levels solved. Try the bonus missions in the sidebar.</Typography>}
      </Section>
      <Section title="Share with the audience">
        <Typography sx={{ mb: 1 }}>Show a QR code so everyone in the room can open the lab on their own device.</Typography>
        <Button variant="outlined" onClick={() => setQrOpen(true)}>Show QR code</Button>
        <QrDialog open={qrOpen} onClose={() => setQrOpen(false)} />
      </Section>
      <Section title="Local model">
        <Chip size="small" color="secondary" label="LOCAL MODEL ONLY" sx={{ mr: 1 }} />
        <Typography component="span">{session.model}</Typography>
        {session.models.length > 1 && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            You can switch models inside each level to compare how easily each one is fooled.
          </Typography>
        )}
      </Section>
    </>
  );
}
