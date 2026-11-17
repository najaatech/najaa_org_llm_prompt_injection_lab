import { Box } from '@mui/material';
import { textOf } from '../../lib/text.js';

/** Dark code block for model output, prompts and sample code. */
export const Pre = ({ children }) => (
  <Box component="pre" sx={{ m: 0, p: 1.5, bgcolor: '#0f172a', color: '#e2e8f0', borderRadius: 1, overflow: 'auto', fontSize: 13, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
    {textOf(children)}
  </Box>
);
