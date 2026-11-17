import { useState } from 'react';
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField, Typography } from '@mui/material';
import { api } from '../../api/client.js';
import { useApp } from '../../context/AppContext.js';

/** Lets the learner choose the nickname that appears on the leaderboards. */
export function NicknameDialog({ open, onClose }) {
  const { session, setSession, notify } = useApp();
  const [value, setValue] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const save = async () => {
    setBusy(true); setError('');
    try {
      const { user } = await api('/api/nickname', { nickname: value.trim() });
      setSession((current) => ({ ...current, user: { ...current.user, nickname: user.nickname } }));
      notify('Nickname saved.', 'success');
      onClose();
    } catch (err) { setError(err.message); }
    finally { setBusy(false); }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs" slotProps={{ transition: { onEnter: () => { setValue(session.user.nickname ?? ''); setError(''); } } }}>
      <DialogTitle>Set your nickname</DialogTitle>
      <DialogContent>
        <Typography variant="body2" sx={{ mb: 2 }}>Leaderboards show this nickname instead of your email. Use 3 to 20 letters, numbers, underscores, dots, or dashes.</Typography>
        <TextField autoFocus fullWidth label="Nickname" value={value} onChange={(e) => setValue(e.target.value)} error={Boolean(error)} helperText={error || ' '}
          onKeyDown={(e) => { if (e.key === 'Enter' && !busy) save(); }} slotProps={{ htmlInput: { maxLength: 20 } }} />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" disabled={busy || value.trim().length < 3} onClick={save}>Save</Button>
      </DialogActions>
    </Dialog>
  );
}
