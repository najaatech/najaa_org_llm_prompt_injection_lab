import { useState } from 'react';
import { Alert, Box, Button, Drawer, IconButton, MenuItem, Stack, TextField, Typography } from '@mui/material';
import { EvidencePanel } from './EvidencePanel.jsx';
import { ModelChat } from './ModelChat.jsx';

/** Side panel with the model picker and one chat per model (only the chosen model's chat is visible). */
export function ChatDrawer({ level, chat, open, onClose }) {
  const [error, setError] = useState('');
  const { models, model, selectModel, evidence, refresh, resetChat, versionOf } = chat;
  const [resetting, setResetting] = useState(false);

  const reset = async () => {
    if (!window.confirm(`Delete your saved conversation with ${model} on this level? This cannot be undone.`)) return;
    setResetting(true);
    setError('');
    try { await resetChat(); } catch (err) { setError(err.message); } finally { setResetting(false); }
  };

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      // Keep the chats mounted so a reply that is still loading is not lost when the panel closes.
      slotProps={{ root: { keepMounted: true } }}
      sx={{ zIndex: (theme) => theme.zIndex.drawer + 2, '& .MuiDrawer-paper': { width: { xs: '100%', sm: 560 }, maxWidth: '100%' } }}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <Stack direction="row" sx={{ p: 2, alignItems: 'center', justifyContent: 'space-between', borderBottom: 1, borderColor: 'divider' }}>
          <Box>
            <Typography variant="overline" color="text.secondary">Conversation</Typography>
            <Typography variant="h6">{level.title}</Typography>
          </Box>
          <IconButton aria-label="Close conversation" onClick={onClose}>✕</IconButton>
        </Stack>
        <Box sx={{ px: 2, pt: 2 }}>
          <Stack direction="row" sx={{ alignItems: 'flex-start', justifyContent: 'space-between', gap: 1 }}>
            {models.length > 1 ? (
              <TextField select size="small" label="Model" value={model} sx={{ minWidth: 220, mb: 1 }}
                onChange={(e) => selectModel(e.target.value)}
                helperText="Each model keeps its own conversation. Try both to compare how easily each one is fooled.">
                {models.map((m) => <MenuItem key={m} value={m}>{m}</MenuItem>)}
              </TextField>
            ) : <span />}
            <Button size="small" color="error" variant="outlined" disabled={resetting} onClick={reset} sx={{ flexShrink: 0 }}>Reset chat</Button>
          </Stack>
          {error && <Alert severity="error" sx={{ mb: 1 }} onClose={() => setError('')}>{error}</Alert>}
        </Box>
        <Box sx={{ flex: 1, minHeight: 0, mx: 2, border: 1, borderColor: 'divider', borderRadius: 1, overflow: 'hidden' }}>
          {models.map((m) => (
            <ModelChat key={`${m}-${versionOf(m)}`} level={level} model={m} visible={m === model} onChange={refresh} onError={(err) => setError(err.message)} />
          ))}
        </Box>
        <Box sx={{ p: 2, maxHeight: '35%', overflow: 'auto' }}>
          <Typography variant="caption" color="text.secondary">Messages are limited to 600 characters.</Typography>
          <EvidencePanel evidence={evidence} />
        </Box>
      </Box>
    </Drawer>
  );
}
