import { useState } from 'react';
import { Alert, Button, Checkbox, Chip, FormControlLabel, Stack, TextField, Typography } from '@mui/material';
import { api } from '../api.js';
import { useApp } from '../context.js';
import { Details, Mitigation, Pills, Pre, Section } from './common.jsx';

function Result({ attempt }) {
  const filter = attempt.filter || {};
  return (
    <Section title="Observation desk">
      <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap', mb: 1 }}>
        <Chip size="small" label={attempt.execution === 'administrative-reset' ? 'ADMINISTRATIVE RESET' : 'LOCAL MODEL'} />
        <Chip size="small" color={filter.blocked ? 'warning' : 'default'} label={filter.blocked ? 'KEYWORD MATCHED · LAB STILL RAN' : 'NO KEYWORD MATCH'} />
        {attempt.markerObserved !== undefined && <Chip size="small" label={attempt.markerObserved ? 'MARKER OBSERVED' : 'MARKER NOT OBSERVED'} />}
      </Stack>
      {attempt.status === 'failed' && attempt.error && <Alert severity="error" sx={{ mb: 1 }}>{attempt.error}</Alert>}
      <Typography variant="body2" sx={{ mb: 1 }}>
        {attempt.defended ? 'Defended' : 'Vulnerable'} configuration · {((attempt.durationMs || 0) / 1000).toFixed(1)} seconds
      </Typography>
      {filter.reason && <Typography variant="body2" sx={{ mb: 1 }}>{filter.reason}</Typography>}
      {attempt.output && <Pre>{attempt.output}</Pre>}
      {(attempt.modelCalls || []).map((call, i) => (
        <Details key={`${call.purpose}-${i}`} summary={`Model call: ${call.purpose} (${((call.durationMs || 0) / 1000).toFixed(1)} s)`}>
          <Pre>{JSON.stringify(call.messages, null, 2)}</Pre>
          <Typography variant="subtitle2" sx={{ mt: 1 }}>Final response</Typography>
          <Pre>{call.response?.content}</Pre>
        </Details>
      ))}
      {(attempt.trace || []).length > 0 && (
        <Details summary="Trace">
          <ol>{attempt.trace.map((t, i) => <li key={i}><strong>{t.stage}</strong>: {t.detail}</li>)}</ol>
        </Details>
      )}
    </Section>
  );
}

export function Mission({ mission }) {
  const { setSession, notify } = useApp();
  const [payload, setPayload] = useState(mission.payload);
  const [defended, setDefended] = useState(false);
  const [busy, setBusy] = useState(false);
  const [attempt, setAttempt] = useState(null);
  const [hints, setHints] = useState(0);

  const run = async () => {
    setBusy(true);
    try {
      const response = await api('/api/attempt', { missionId: mission.id, payload, mode: 'live', defended, action: 'run' });
      setAttempt(response.attempt); setSession((s) => ({ ...s, user: response.user }));
      notify(`${mission.title}: experiment recorded. Inspect the evidence; completing it does not certify attack success.`, 'success');
    } catch (err) {
      if (err.attempt) setAttempt(err.attempt);
      notify(err.message, 'error');
    } finally { setBusy(false); }
  };

  return (
    <>
      <Pills items={[['LOWER-TRUST CONTENT', 'warning'], ['FICTIONAL SANDBOX']]} />
      <Typography variant="overline">{mission.subtitle}</Typography>
      <Typography variant="h4" gutterBottom>{mission.title}</Typography>
      <Typography sx={{ mb: 2 }}>{mission.objective}</Typography>
      <Section title="Your task"><Typography>{mission.task}</Typography></Section>
      <Section title="Payload">
        <TextField multiline minRows={6} fullWidth value={payload} onChange={(e) => setPayload(e.target.value.slice(0, 4000))} />
        <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
          <Button size="small" onClick={() => setPayload(mission.benign)}>Use benign control</Button>
          <Button size="small" onClick={() => setPayload(mission.payload)}>Restore starter</Button>
        </Stack>
      </Section>
      <Section title="Run">
        <Chip size="small" color="secondary" label="LOCAL MODEL" sx={{ mb: 1 }} />
        <FormControlLabel control={<Checkbox checked={defended} onChange={(e) => setDefended(e.target.checked)} />}
          label={`Enable the defended configuration: ${mission.defense}`} />
        <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
          <Button variant="contained" disabled={busy || !payload.trim()} onClick={run}>Run experiment →</Button>
          <Typography variant="body2" color="text.secondary">
            {busy ? 'Waiting for the local model…' : 'Ready. Every reply comes from the local model; there is no fallback.'}
          </Typography>
        </Stack>
      </Section>
      <Section title="Hints">
        {mission.hints.slice(0, hints).map((hint) => <Typography key={hint} sx={{ mb: 1 }}>• {hint}</Typography>)}
        <Button size="small" disabled={hints >= mission.hints.length} onClick={() => setHints((h) => h + 1)}>
          {hints >= mission.hints.length ? 'All hints revealed' : `Reveal hint ${hints + 1} of ${mission.hints.length}`}
        </Button>
      </Section>
      {attempt && <Result attempt={attempt} />}
      {attempt && <Section title="Debrief"><Typography>{mission.debrief}</Typography></Section>}
      {attempt && <Mitigation data={mission.mitigation} />}
    </>
  );
}
