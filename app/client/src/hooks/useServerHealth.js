import { useEffect, useState } from 'react';
import { api } from '../api/client.js';

const HEALTH_POLL_MS = 30_000;

/**
 * Polls the local model status. The status dot follows it; a failed check means the server is unreachable.
 * Returns { modelStatus, online, setOnline } — other requests also report the connection state through setOnline.
 */
export function useServerHealth() {
  const [modelStatus, setModelStatus] = useState(null);
  const [online, setOnline] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const check = async () => {
      try {
        const health = await api('/api/health');
        if (!cancelled) { setModelStatus(health); setOnline(true); }
      } catch { if (!cancelled) { setModelStatus(null); setOnline(false); } }
    };
    check();
    const timer = setInterval(check, HEALTH_POLL_MS);
    return () => { cancelled = true; clearInterval(timer); };
  }, []);

  return { modelStatus, online, setOnline };
}
