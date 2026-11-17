import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import createCache from '@emotion/cache';
import { CacheProvider } from '@emotion/react';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { theme } from './theme.js';
import App from './App.jsx';

const nonce = document.querySelector('meta[name="csp-nonce"]')?.content;
const cache = createCache({ key: 'mui', nonce: nonce && !nonce.startsWith('__') ? nonce : undefined });

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <CacheProvider value={cache}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <App />
      </ThemeProvider>
    </CacheProvider>
  </StrictMode>
);
