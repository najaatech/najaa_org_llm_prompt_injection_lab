import { Box, Stack, Typography } from '@mui/material';
import { Pre } from './Pre.jsx';

/** Numbered list of the steps the server took, each with its text in a code block. */
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
