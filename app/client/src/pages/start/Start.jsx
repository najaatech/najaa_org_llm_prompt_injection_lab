import { Box } from '@mui/material';

/** The Start page is the slide deck only. It is built by scripts/build_slides.mjs and served at /slides/. */
export function Start() {
  return (
    <Box
      component="iframe"
      title="Understanding and mitigating Prompt Injection (slides)"
      src="/slides/"
      allowFullScreen
      sx={{ display: 'block', width: '100%', aspectRatio: '16 / 9', maxHeight: 'calc(100vh - 160px)', border: 1, borderColor: 'divider', borderRadius: 1, bgcolor: 'background.paper' }}
    />
  );
}
