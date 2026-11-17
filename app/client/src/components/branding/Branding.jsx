import { Box, Typography } from '@mui/material';

// ktech logo (dark blue on transparent) for light backgrounds such as the sign-in page.
export const Logo = ({ height = 40 }) => (
  <Box sx={{ display: 'inline-flex', alignItems: 'center' }}>
    <Box component="img" src="/ktech-logo.png" alt="ktech, Kuwait Technical College" sx={{ height, width: 'auto', display: 'block' }} />
  </Box>
);

// Light ktech logo made for the dark blue app bar. Hosted locally because the CSP blocks external images.
export const NavLogo = ({ height = 40 }) => (
  <Box component="img" src="/ktech-nav-logo.png" alt="ktech, Kuwait Technical College" sx={{ height, width: 'auto', display: 'block' }} />
);

export const PoweredBy = () => (
  <Box
    component="a"
    href="https://najaa.org"
    target="_blank"
    rel="noopener noreferrer"
    aria-label="Powered by Najaa Technologies (najaa.org)"
    sx={{ display: 'inline-flex', alignItems: 'center', gap: 1.5, color: 'text.secondary', textDecoration: 'none', '&:hover .najaa-link-text': { textDecoration: 'underline' } }}
  >
    <Typography className="najaa-link-text" variant="caption" color="inherit">Powered by: Najaa Technologies</Typography>
    <Box component="img" src="/najaa-logo.png" alt="" sx={{ height: 22, width: 'auto', display: 'block' }} />
  </Box>
);
