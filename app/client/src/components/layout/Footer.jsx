import { Box } from '@mui/material';
import { PoweredBy } from '../branding/Branding.jsx';

export const FOOTER_HEIGHT = 48;

/** Footer fixed to the bottom of the window. `offsetLeft` keeps it clear of the side menu. */
export function Footer({ offsetLeft = 0 }) {
  return (
    <Box
      component="footer"
      sx={{
        position: 'fixed', bottom: 0, left: offsetLeft, right: 0, height: FOOTER_HEIGHT,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        bgcolor: 'background.paper', borderTop: 1, borderColor: 'divider',
        zIndex: (theme) => theme.zIndex.appBar,
      }}
    >
      <PoweredBy />
    </Box>
  );
}
