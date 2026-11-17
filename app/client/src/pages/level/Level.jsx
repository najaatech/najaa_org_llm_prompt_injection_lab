import { Alert, Typography } from '@mui/material';
import { useApp } from '../../context/AppContext.js';
import { useLevelStart } from '../../hooks/useLevelStart.js';
import { Mitigation, Pills, Section } from '../../components/ui/index.js';
import { FlagForm } from './FlagForm.jsx';
import { Hints } from './Hints.jsx';
import { LevelConversation } from './LevelConversation.jsx';

export function Level({ level }) {
  const { session } = useApp();
  const solved = Boolean(session.user.solved[level.id]);
  useLevelStart(level);

  return (
    <>
      <Pills items={[[level.difficulty], ['LOCAL MODEL', 'secondary'], ['FICTIONAL DATA'], solved && ['SOLVED', 'success']]} />
      <Typography variant="h4" gutterBottom>{level.title}</Typography>
      <Typography sx={{ mb: 2 }}>{level.story}</Typography>
      <Section title="01 Your goal">
        <Typography>{level.goal}</Typography>
        <Typography color="text.secondary" sx={{ mt: 1 }}>{level.how}</Typography>
      </Section>
      <Section title="02 What you know">
        {level.context.map((line) => <Typography key={line} sx={{ mb: 1 }}>• {line}</Typography>)}
      </Section>
      <Section title="03 Conversation"><LevelConversation level={level} /></Section>
      <Section title="04 Submit the flag"><FlagForm level={level} solved={solved} /></Section>
      <Section title="Hints"><Hints hints={level.hints} /></Section>
      {solved ? <Mitigation data={level.mitigation} /> : <Alert severity="info">Solve the level to unlock the mitigation write-up.</Alert>}
    </>
  );
}
