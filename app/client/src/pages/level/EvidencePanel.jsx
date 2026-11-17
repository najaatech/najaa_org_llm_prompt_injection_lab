import { Chip } from '@mui/material';
import { Details, Steps } from '../../components/ui/index.js';

/** What the server did to produce the latest reply of the chosen model. */
export function EvidencePanel({ evidence }) {
  if (!evidence) return null;
  return (
    <Details summary="What the server did (latest reply)">
      {evidence.blocked && <Chip color="warning" size="small" label="BLOCKED BY INPUT FILTER" sx={{ mb: 1 }} />}
      <Steps steps={evidence.steps || []} />
    </Details>
  );
}
