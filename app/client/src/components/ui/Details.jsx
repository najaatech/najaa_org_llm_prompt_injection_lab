import { Accordion, AccordionDetails, AccordionSummary, Typography } from '@mui/material';

/** Collapsible block for evidence the learner may want to inspect. */
export function Details({ summary, children }) {
  return (
    <Accordion variant="outlined" disableGutters sx={{ mt: 1 }}>
      <AccordionSummary><Typography variant="subtitle2">{summary}</Typography></AccordionSummary>
      <AccordionDetails>{children}</AccordionDetails>
    </Accordion>
  );
}
