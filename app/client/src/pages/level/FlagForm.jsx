import { useState } from 'react';
import { Alert, Button, Stack, TextField } from '@mui/material';
import { api } from '../../api/client.js';
import { useApp } from '../../context/AppContext.js';

export function FlagForm({ level, solved }) {
  const { setSession, notify } = useApp();
  const [flag, setFlag] = useState('');
  const [feedback, setFeedback] = useState(null);

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
      <Stack component="form" direction="row" spacing={1} onSubmit={submit}>
        <TextField size="small" fullWidth placeholder="FLAG{...}" value={flag} disabled={solved} onChange={(e) => setFlag(e.target.value)} />
        <Button type="submit" variant="contained" disabled={solved || !flag.trim()}>{solved ? 'Already solved' : 'Check flag'}</Button>
      </Stack>
      {feedback && <Alert severity={feedback.ok ? 'success' : 'warning'} sx={{ mt: 1 }}>
        {feedback.ok ? 'Correct. Level solved.' : 'Not the flag. Check it against the assistant’s output and try again.'}
      </Alert>}
    </>
  );
}
