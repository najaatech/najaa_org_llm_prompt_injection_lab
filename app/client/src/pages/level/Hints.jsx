import { useState } from 'react';
import { Button, Typography } from '@mui/material';

/** Hints are revealed one at a time. */
export function Hints({ hints }) {
  const [revealed, setRevealed] = useState(0);
  return (
    <>
      {hints.slice(0, revealed).map((hint) => <Typography key={hint} sx={{ mb: 1 }}>• {hint}</Typography>)}
      <Button size="small" disabled={revealed >= hints.length} onClick={() => setRevealed((n) => n + 1)}>
        {revealed >= hints.length ? 'All hints revealed' : `Reveal hint ${revealed + 1} of ${hints.length}`}
      </Button>
    </>
  );
}
