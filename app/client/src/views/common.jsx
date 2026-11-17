import { Alert, Box, Card, CardContent, Chip, Stack, Typography, Accordion, AccordionSummary, AccordionDetails } from '@mui/material';
import { textOf } from '../api.js';

export const Pre = ({ children }) => (
  <Box component="pre" sx={{ m: 0, p: 1.5, bgcolor: '#0f172a', color: '#e2e8f0', borderRadius: 1, overflow: 'auto', fontSize: 13, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
    {textOf(children)}
  </Box>
);

export const Section = ({ title, children }) => (
  <Card variant="outlined" sx={{ mb: 2 }}>
    <CardContent>
      {title && <Typography variant="h6" gutterBottom>{title}</Typography>}
      {children}
    </CardContent>
  </Card>
);

export const Pills = ({ items }) => (
  <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap', mb: 1 }}>
    {items.filter(Boolean).map(([label, color]) => <Chip key={label} size="small" label={label} color={color || 'default'} variant="outlined" />)}
  </Stack>
);

export function Details({ summary, children }) {
  return (
    <Accordion variant="outlined" disableGutters sx={{ mt: 1 }}>
      <AccordionSummary><Typography variant="subtitle2">{summary}</Typography></AccordionSummary>
      <AccordionDetails>{children}</AccordionDetails>
    </Accordion>
  );
}

export function Steps({ steps }) {
  return (
    <Stack spacing={1.5}>
      {steps.map((step, index) => (
        <Box key={`${step.title}-${index}`}>
          <Typography variant="subtitle2">{index + 1}. {step.title}</Typography>
          <Pre>{step.body}</Pre>
        </Box>
      ))}
    </Stack>
  );
}

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

// ktech logo (dark blue on transparent), shown on a white tile so it stays readable on the blue app bar.
export const Logo = ({ height = 40, tile = false }) => (
  <Box sx={{ display: 'inline-flex', alignItems: 'center', ...(tile && { bgcolor: '#fff', borderRadius: 1, px: 1, py: 0.5 }) }}>
    <Box component="img" src="/ktech-logo.png" alt="ktech, Kuwait Technical College" sx={{ height, width: 'auto', display: 'block' }} />
  </Box>
);

export const PoweredBy = () => (
  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mt: 4 }}>
    <Typography variant="caption" color="text.secondary">Powered by: Najaa Technologies</Typography>
    <Box component="img" src="/najaa-logo.png" alt="Najaa Technologies" sx={{ height: 22, width: 'auto', display: 'block' }} />
  </Box>
);
