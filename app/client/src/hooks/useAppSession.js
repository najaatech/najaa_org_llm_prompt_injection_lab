import { useCallback, useEffect, useState } from 'react';
import { api, onUnauthorized, setCsrf } from '../api/client.js';

/**
 * The signed-in session and the level catalog. `onConnection(true|false)` reports whether the server answered.
 * When the server says the session is no longer valid, the session is marked as signed out.
 */
export function useAppSession(onConnection) {
  const [session, setSession] = useState(null);
  const [catalog, setCatalog] = useState(null);
  const [loadError, setLoadError] = useState('');

  const applySession = useCallback((data) => {
    setCsrf(data.csrf);
    setSession({ ...data, clockSkewMs: data.serverNow ? Date.parse(data.serverNow) - Date.now() : 0 });
  }, []);

  const load = useCallback(async () => {
    setLoadError('');
    try {
      const [sessionData, catalogData] = await Promise.all([api('/api/session'), api('/api/catalog')]);
      setCatalog(catalogData); applySession(sessionData); onConnection(true);
    } catch (err) { setLoadError(err.message); onConnection(false); }
  }, [applySession, onConnection]);

  useEffect(() => {
    onUnauthorized(() => setSession((current) => (current ? { ...current, authenticated: false, user: null } : current)));
    load();
  }, [load]);

  return { session, setSession, catalog, loadError, applySession, load };
}
