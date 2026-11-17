import { useCallback, useState } from 'react';
import { Alert, Box, Button, CircularProgress, Toolbar, Typography } from '@mui/material';
import { api } from './api/client.js';
import { Footer, FOOTER_HEIGHT } from './components/layout/Footer.jsx';
import { NavBar } from './components/layout/NavBar.jsx';
import { SIDE_NAV_WIDTH, SideNav } from './components/layout/SideNav.jsx';
import { AppContext } from './context/AppContext.js';
import { useAppSession } from './hooks/useAppSession.js';
import { useChatHistory } from './hooks/useChatHistory.js';
import { useHashRoute } from './hooks/useHashRoute.js';
import { useServerHealth } from './hooks/useServerHealth.js';
import { go } from './lib/navigation.js';
import { Auth } from './pages/auth/Auth.jsx';
import { PageRouter } from './pages/PageRouter.jsx';

function LoadError({ message, onRetry }) {
  return (
    <Box sx={{ p: 4 }}>
      <Alert severity="error" sx={{ mb: 2 }}>{message}</Alert>
      <Button variant="contained" onClick={onRetry}>Retry connection</Button>
    </Box>
  );
}

function Loading() {
  return (
    <Box sx={{ p: 6, textAlign: 'center' }}>
      <CircularProgress />
      <Typography sx={{ mt: 2 }}>Preparing your workspace.</Typography>
      <Typography color="text.secondary">Loading the session and challenges…</Typography>
    </Box>
  );
}

export default function App() {
  const [message, setMessage] = useState(null);
  const notify = useCallback((text, severity = 'info') => setMessage(text ? { text, severity } : null), []);
  const clearMessage = useCallback(() => setMessage(null), []);

  const route = useHashRoute(clearMessage);
  const { modelStatus, online, setOnline } = useServerHealth();
  const { session, setSession, catalog, loadError, applySession, load } = useAppSession(setOnline);
  const userId = session?.authenticated ? session.user?.id ?? session.user?.email : null;
  const { chats, chatsReady } = useChatHistory(userId);

  const logout = async () => {
    try { await api('/api/logout', {}); } catch { /* session may already be gone */ }
    await load();
    go('start');
  };

  if (loadError) return <LoadError message={loadError} onRetry={load} />;
  if (!session || !catalog) return <Loading />;

  const authed = Boolean(session.authenticated && session.user);
  const context = { session, setSession, catalog, notify, go, chats, modelStatus };

  return (
    <AppContext.Provider value={context}>
      <NavBar authed={authed} online={online} modelStatus={modelStatus} onLogout={logout} />
      {authed && <SideNav route={route} catalog={catalog} user={session.user} />}
      <Box component="main" sx={{ ml: authed ? `${SIDE_NAV_WIDTH}px` : 0, p: 3, pb: `${FOOTER_HEIGHT + 24}px` }}>
        <Toolbar />
        {message && <Alert severity={message.severity} sx={{ mb: 2 }} onClose={clearMessage}>{message.text}</Alert>}
        {authed
          ? <PageRouter route={route} catalog={catalog} chatsReady={chatsReady} />
          : <Auth onSession={(data) => { applySession(data); go('start'); }} setNotice={(text) => notify(text)} />}
      </Box>
      <Footer offsetLeft={authed ? SIDE_NAV_WIDTH : 0} />
    </AppContext.Provider>
  );
}
