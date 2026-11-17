import { useEffect, useState } from 'react';
import { Alert, Box, Button, Stack, TextField, Typography } from '@mui/material';
import { api } from '../../api/client.js';
import { title } from '../../theme.js';
import { Logo } from '../../components/branding/Branding.jsx';
import { JoinQr } from './JoinQr.jsx';

export function Auth({ onSession, setNotice }) {
  const [step, setStep] = useState('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  // False when the lab runs only on this computer: the server then signs in with the email alone.
  const [otpRequired, setOtpRequired] = useState(true);

  useEffect(() => {
    api('/api/join_info').then((info) => setOtpRequired(info.otpRequired !== false)).catch(() => {});
  }, []);

  const run = async (fn) => {
    setError(''); setBusy(true);
    try { await fn(); } catch (err) { setError(err.message); } finally { setBusy(false); }
  };

  const request = (event) => {
    event.preventDefault();
    run(async () => {
      const result = await api('/api/auth/request', { email });
      if (result.authenticated) { onSession(result); return; }
      setStep('code'); setNotice('If the address is valid, a code is on its way.');
    });
  };
  const verify = (event) => {
    event.preventDefault();
    run(async () => { onSession(await api('/api/auth/verify', { email, code })); setCode(''); });
  };

  return (
    <Box sx={{ maxWidth: 520, mx: 'auto', mt: 6 }}>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'center' }}><Logo height={72} /></Box>
      <Typography variant="h4" gutterBottom>{title}</Typography>
      <Typography color="text.secondary" sx={{ mb: 3 }}>Sign in {otpRequired ? 'with an email code ' : 'with your email '}to get your own account and your own flags.</Typography>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {step === 'email' ? (
        <Stack component="form" spacing={2} onSubmit={request}>
          <TextField label="Email" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <Typography variant="body2" color="text.secondary">{otpRequired ? 'A 6-digit code is valid for 10 minutes. First sign-in creates your account.' : 'No code is needed on this computer. First sign-in creates your account.'}</Typography>
          <Button type="submit" variant="contained" disabled={busy}>{otpRequired ? 'Email me a code →' : 'Sign in →'}</Button>
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
      <JoinQr />
    </Box>
  );
}
