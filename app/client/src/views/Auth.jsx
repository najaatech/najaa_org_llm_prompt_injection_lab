import { useState } from 'react';
import { Alert, Box, Button, Stack, TextField, Typography } from '@mui/material';
import { api } from '../api.js';
import { title } from '../theme.js';
import { Logo } from './common.jsx';

export function Auth({ onSession, setNotice }) {
  const [step, setStep] = useState('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const run = async (fn) => {
    setError(''); setBusy(true);
    try { await fn(); } catch (err) { setError(err.message); } finally { setBusy(false); }
  };

  const request = (event) => {
    event.preventDefault();
    run(async () => {
      await api('/api/auth/request', { email });
      setStep('code'); setNotice('If the address is valid, a code is on its way.');
    });
  };
  const verify = (event) => {
    event.preventDefault();
    run(async () => { onSession(await api('/api/auth/verify', { email, code })); setCode(''); });
  };

  return (
    <Box sx={{ maxWidth: 520, mx: 'auto', mt: 6 }}>
      <Box sx={{ mb: 3 }}><Logo height={72} /></Box>
      <Typography variant="h4" gutterBottom>{title}</Typography>
      <Typography color="text.secondary" sx={{ mb: 3 }}>Sign in with an email code to get your own account and your own flags.</Typography>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {step === 'email' ? (
        <Stack component="form" spacing={2} onSubmit={request}>
          <TextField label="Email" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <Typography variant="body2" color="text.secondary">A 6-digit code is valid for 10 minutes. First sign-in creates your account.</Typography>
          <Button type="submit" variant="contained" disabled={busy}>Email me a code →</Button>
        </Stack>
      ) : (
        <Stack component="form" spacing={2} onSubmit={verify}>
          <Typography variant="h6">Enter your code</Typography>
          <Typography variant="body2" color="text.secondary">Sent to {email}. Check your inbox and spam folder.</Typography>
          <TextField label="6-digit code" required value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            slotProps={{ htmlInput: { inputMode: 'numeric', autoComplete: 'one-time-code', pattern: '[0-9]{6}', maxLength: 6 } }} />
          <Button type="submit" variant="contained" disabled={busy}>Verify and enter →</Button>
          <Button onClick={() => { setStep('email'); setCode(''); setError(''); }}>Use a different email</Button>
        </Stack>
      )}
    </Box>
  );
}
