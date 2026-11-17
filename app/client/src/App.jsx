import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, AppBar, Box, Button, Chip, CircularProgress, Divider, Drawer, List, ListItemButton, ListItemText, ListSubheader, Toolbar, Typography } from '@mui/material';
import { api, onUnauthorized, setCsrf } from './api.js';
import { AppContext } from './context.js';
import { title } from './theme.js';
import { Auth } from './views/Auth.jsx';
import { Start } from './views/Start.jsx';
import { Sorting } from './views/Sorting.jsx';
import { Quiz } from './views/Quiz.jsx';
import { Level } from './views/Level.jsx';
import { Mission } from './views/Mission.jsx';
import { Logo, PoweredBy } from './views/common.jsx';

const DRAWER = 270;
const REPO_URL = 'https://github.com/najaatech/najaa_org_llm_prompt_injection_lab';
const routeFromHash = () => window.location.hash.replace('#', '') || 'start';

export default function App() {
  const [session, setSession] = useState(null);
  const [catalog, setCatalog] = useState(null);
  const [route, setRoute] = useState(routeFromHash());
  const [message, setMessage] = useState(null);
  const [loadError, setLoadError] = useState('');
  const [online, setOnline] = useState(true);
  const chats = useRef({});

  const notify = useCallback((text, severity = 'info') => setMessage(text ? { text, severity } : null), []);
  const go = useCallback((id) => { window.location.hash = id; }, []);

  const applySession = useCallback((data) => {
    setCsrf(data.csrf); setSession(data);
  }, []);

  const load = useCallback(async () => {
    setLoadError('');
    try {
      const [s, c] = await Promise.all([api('/api/session'), api('/api/catalog')]);
      setCatalog(c); applySession(s); setOnline(true);
    } catch (err) { setLoadError(err.message); setOnline(false); }
  }, [applySession]);

  useEffect(() => {
    onUnauthorized(() => { chats.current = {}; setSession((s) => (s ? { ...s, authenticated: false, user: null } : s)); });
    const onHash = () => { setRoute(routeFromHash()); setMessage(null); };
    window.addEventListener('hashchange', onHash);
    load();
    return () => window.removeEventListener('hashchange', onHash);
  }, [load]);

  const logout = async () => {
    try { await api('/api/logout', {}); } catch { /* session may already be gone */ }
    chats.current = {};
    await load();
    go('start');
  };

  if (loadError) {
    return <Box sx={{ p: 4 }}><Alert severity="error" sx={{ mb: 2 }}>{loadError}</Alert><Button variant="contained" onClick={load}>Retry connection</Button></Box>;
  }
  if (!session || !catalog) {
    return <Box sx={{ p: 6, textAlign: 'center' }}><CircularProgress /><Typography sx={{ mt: 2 }}>Preparing your workspace.</Typography><Typography color="text.secondary">Loading the session and challenges…</Typography></Box>;
  }

  const authed = session.authenticated && session.user;
  const level = catalog.levels.find((l) => l.id === route);
  const mission = catalog.missions.find((m) => m.id === route);
  const ctx = { session, setSession, catalog, notify, go, chats };

  let view = <Start />;
  if (route === 'sorting') view = <Sorting />;
  else if (route === 'quiz') view = <Quiz />;
  else if (level) view = <Level key={level.id} level={level} />;
  else if (mission) view = <Mission key={mission.id} mission={mission} />;

  const navItem = (id, label, done) => (
    <ListItemButton key={id} selected={route === id} onClick={() => go(id)}>
      <ListItemText primary={`${label}${done ? ' ✓' : ''}`} />
    </ListItemButton>
  );

  return (
    <AppContext.Provider value={ctx}>
      <AppBar position="fixed" sx={{ zIndex: (t) => t.zIndex.drawer + 1 }}>
        <Toolbar sx={{ gap: 2 }}>
          <Logo height={34} tile />
          <Typography variant="h6" sx={{ flexGrow: 1, fontSize: { xs: 14, md: 20 } }}>{title}</Typography>
          <Typography variant="body2">{authed ? session.user.email : 'Not signed in'}</Typography>
          <Chip size="small" color={online ? 'success' : 'warning'} label={online ? 'Server connected' : 'Connection interrupted'} />
          <Button color="inherit" href={REPO_URL} target="_blank" rel="noopener noreferrer">GitHub</Button>
          {authed && <Button color="inherit" onClick={logout}>Log out</Button>}
        </Toolbar>
      </AppBar>
      {authed && (
        <Drawer variant="permanent" sx={{ width: DRAWER, '& .MuiDrawer-paper': { width: DRAWER, boxSizing: 'border-box' } }}>
          <Toolbar />
          <List>
            {navItem('start', 'Start here')}
            {navItem('sorting', 'Instruction or data? game')}
            {navItem('quiz', 'RAG quick quiz')}
            <Divider />
            <ListSubheader>Flag challenges</ListSubheader>
            {catalog.levels.map((l) => navItem(l.id, l.title.replace(/^Level \d+ · /, `L${l.level} · `), session.user.solved[l.id]))}
            <ListSubheader>Bonus missions</ListSubheader>
            {catalog.missions.map((m) => navItem(m.id, m.title, session.user.progress?.includes(m.id)))}
          </List>
        </Drawer>
      )}
      <Box component="main" sx={{ ml: authed ? `${DRAWER}px` : 0, p: 3 }}>
        <Toolbar />
        {message && <Alert severity={message.severity} sx={{ mb: 2 }} onClose={() => setMessage(null)}>{message.text}</Alert>}
        {authed ? view : <Auth onSession={(data) => { applySession(data); go('start'); }} setNotice={(t) => notify(t)} />}
        <PoweredBy />
      </Box>
    </AppContext.Provider>
  );
}
