import { Alert, Box, Typography } from '@mui/material';
import { Details } from './Details.jsx';
import { Pre } from './Pre.jsx';
import { Section } from './Section.jsx';

/** The "how to mitigate this" write-up shown after a level or mission. */
export function Mitigation({ data }) {
  if (!data) return null;
  return (
    <Section title="How to mitigate this">
      <Typography sx={{ mb: 1 }}>{data.principle}</Typography>
      <Box component="ol" sx={{ pl: 3, mt: 0 }}>
        {data.steps.map((step) => <li key={step}><Typography>{step}</Typography></li>)}
      </Box>
      {data.labTip && <Alert severity="info" sx={{ mb: 1 }}>{data.labTip}</Alert>}
      <Details summary={`Sample code (${data.language})`}>
        <Pre>{data.code}</Pre>
        <Typography variant="caption" color="text.secondary">Teaching example. This prototype does not run it.</Typography>
      </Details>
      <Typography variant="body2" sx={{ mt: 1 }}>Limits: {data.limits} Layer controls rather than relying on one.</Typography>
    </Section>
  );
}
