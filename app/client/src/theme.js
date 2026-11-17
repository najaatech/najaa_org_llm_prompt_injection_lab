import { createTheme } from '@mui/material';

// System font stack only: the CSP does not allow external fonts.
export const theme = createTheme({
  palette: {
    primary: { main: '#212e7e' },
    secondary: { main: '#0f766e' },
    background: { default: '#f4f5fb' }
  },
  shape: { borderRadius: 10 },
  typography: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    h4: { fontWeight: 700 },
    h5: { fontWeight: 700 },
    h6: { fontWeight: 700 },
    button: { textTransform: 'none', fontWeight: 600 }
  }
});

export const title = 'Understanding and mitigating prompt injection vulnerabilities';
