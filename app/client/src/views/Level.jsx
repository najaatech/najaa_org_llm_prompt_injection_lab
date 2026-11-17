import { useMemo, useRef, useState } from 'react';
import { Alert, Badge, Box, Button, Chip, Drawer, IconButton, MenuItem, Stack, TextField, Typography } from '@mui/material';
import { ChatBox } from '@mui/x-chat';
import { api } from '../api.js';
import { useApp } from '../context.js';
import { Details, Mitigation, Pills, Section, Steps } from './common.jsx';

const textFromMessage = (message) => message.parts.filter((p) => p.type === 'text').map((p) => p.text).join('');

// The conversation lives in an off-canvas drawer opened from the level page.
function LevelConversation({ level }) {
  const { session, chats } = useApp();
  const saved = (chats.current[level.id] ||= { messages: [], evidence: null, model: session.model });
  const [open, setOpen] = useState(false);
  const [messageCount, setMessageCount] = useState(saved.messages.length);
  const [evidence, setEvidence] = useState(saved.evidence);
  const [model, setModel] = useState(saved.model);
  const modelRef = useRef(model);
  modelRef.current = model;

  const adapter = useMemo(() => ({
    async sendMessage({ message }) {
      const result = await api('/api/challenge', { level: level.level, message: textFromMessage(message), model: modelRef.current });
      saved.evidence = result; setEvidence(result);
      const id = `a-${crypto.randomUUID()}`;
      const part = `t-${id}`;
      return new ReadableStream({
        start(controller) {
          controller.enqueue({ type: 'start', messageId: id });
          controller.enqueue({ type: 'text-start', id: part });
          controller.enqueue({ type: 'text-delta', id: part, delta: result.answer });
          controller.enqueue({ type: 'text-end', id: part });
          controller.enqueue({ type: 'finish', messageId: id });
          controller.close();
        }
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [level.level]);

  const [error, setError] = useState('');

  return (
    <>
      <Stack direction="row" spacing={2} sx={{ alignItems: 'center', flexWrap: 'wrap' }} useFlexGap>
        <Badge color="secondary" badgeContent={messageCount} max={99}>
          <Button variant="contained" onClick={() => setOpen(true)}>Open conversation →</Button>
        </Badge>
        <Typography variant="body2" color="text.secondary">
          The chat opens in a side panel. Messages are limited to 600 characters. Every reply comes from the local model.
        </Typography>
      </Stack>
      <Drawer
        anchor="right"
        open={open}
        onClose={() => setOpen(false)}
        // Keep the chat mounted so a reply that is still loading is not lost when the panel closes.
        slotProps={{ root: { keepMounted: true } }}
        sx={{ zIndex: (theme) => theme.zIndex.drawer + 2, '& .MuiDrawer-paper': { width: { xs: '100%', sm: 560 }, maxWidth: '100%' } }}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          <Stack direction="row" sx={{ p: 2, alignItems: 'center', justifyContent: 'space-between', borderBottom: 1, borderColor: 'divider' }}>
            <Box>
              <Typography variant="overline" color="text.secondary">Conversation</Typography>
              <Typography variant="h6">{level.title}</Typography>
            </Box>
            <IconButton aria-label="Close conversation" onClick={() => setOpen(false)}>✕</IconButton>
          </Stack>
          <Box sx={{ px: 2, pt: 2 }}>
            {session.models.length > 0 && (
              <TextField select size="small" label="Model" value={model} sx={{ minWidth: 220, mb: 1 }}
                onChange={(e) => { setModel(e.target.value); saved.model = e.target.value; }}
                helperText="Try both models to compare how easily each one is fooled.">
                {session.models.map((m) => <MenuItem key={m} value={m}>{m}</MenuItem>)}
              </TextField>
            )}
            {error && <Alert severity="error" sx={{ mb: 1 }} onClose={() => setError('')}>{error}</Alert>}
          </Box>
          <Box sx={{ flex: 1, minHeight: 0, mx: 2, border: 1, borderColor: 'divider', borderRadius: 1, overflow: 'hidden' }}>
            <ChatBox
              adapter={adapter}
              initialMessages={saved.messages}
              onMessagesChange={(messages) => { saved.messages = messages; setMessageCount(messages.length); }}
              features={{ conversationList: false, attachments: false, suggestions: false }}
              currentUser={{ id: 'learner', displayName: 'You' }}
              onError={(err) => setError(err.message)}
              sx={{ height: '100%' }}
            />
          </Box>
          <Box sx={{ p: 2, maxHeight: '35%', overflow: 'auto' }}>
            <Typography variant="caption" color="text.secondary">Messages are limited to 600 characters.</Typography>
            {evidence && (
              <Details summary="What the server did (latest reply)">
                {evidence.blocked && <Chip color="warning" size="small" label="BLOCKED BY INPUT FILTER" sx={{ mb: 1 }} />}
                <Steps steps={evidence.steps || []} />
              </Details>
            )}
          </Box>
        </Box>
      </Drawer>
    </>
  );
}

export function Level({ level }) {
  const { session, setSession, notify } = useApp();
  const solved = Boolean(session.user.solved[level.id]);
  const [flag, setFlag] = useState('');
  const [feedback, setFeedback] = useState(null);
  const [hints, setHints] = useState(0);

  const submit = async (event) => {
    event.preventDefault();
    try {
      const result = await api('/api/flag', { level: level.level, flag });
      if (result.correct) { setSession((s) => ({ ...s, user: result.user })); setFeedback({ ok: true }); setFlag(''); notify(''); }
      else setFeedback({ ok: false });
    } catch (err) { notify(err.message, 'error'); }
  };

  return (
    <>
      <Pills items={[[level.difficulty], ['LOCAL MODEL', 'secondary'], ['FICTIONAL DATA'], solved && ['SOLVED', 'success']]} />
      <Typography variant="h4" gutterBottom>{level.title}</Typography>
      <Typography sx={{ mb: 2 }}>{level.story}</Typography>
      <Section title="01 Your goal">
        <Typography>{level.goal}</Typography>
        <Typography color="text.secondary" sx={{ mt: 1 }}>{level.how}</Typography>
      </Section>
      <Section title="02 Conversation"><LevelConversation level={level} /></Section>
      <Section title="03 Submit the flag">
        <Stack component="form" direction="row" spacing={1} onSubmit={submit}>
          <TextField size="small" fullWidth placeholder="FLAG{...}" value={flag} disabled={solved} onChange={(e) => setFlag(e.target.value)} />
          <Button type="submit" variant="contained" disabled={solved || !flag.trim()}>{solved ? 'Already solved' : 'Check flag'}</Button>
        </Stack>
        {feedback && <Alert severity={feedback.ok ? 'success' : 'warning'} sx={{ mt: 1 }}>
          {feedback.ok ? 'Correct. Level solved.' : 'Not the flag. Check it against the assistant’s output and try again.'}
        </Alert>}
      </Section>
      <Section title="Hints">
        {level.hints.slice(0, hints).map((hint) => <Typography key={hint} sx={{ mb: 1 }}>• {hint}</Typography>)}
        <Button size="small" disabled={hints >= level.hints.length} onClick={() => setHints((h) => h + 1)}>
          {hints >= level.hints.length ? 'All hints revealed' : `Reveal hint ${hints + 1} of ${level.hints.length}`}
        </Button>
      </Section>
      {solved ? <Mitigation data={level.mitigation} /> : <Alert severity="info">Solve the level to unlock the mitigation write-up.</Alert>}
    </>
  );
}
