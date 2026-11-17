import { useEffect } from 'react';
import { api } from '../api/client.js';
import { useApp } from '../context/AppContext.js';

/**
 * Tells the server the learner opened this flag challenge, once. The server keeps the first open as the start time
 * (no time limit) and later turns it into the time shown on the flag leaderboard.
 */
export function useLevelStart(level) {
  const { session, setSession } = useApp();
  const started = Boolean(session.user.flagTimes?.[level.id]?.startedAt || session.user.solved[level.id]);

  useEffect(() => {
    if (started) return undefined;
    let cancelled = false;
    api('/api/challenge/start', { level: level.level })
      .then((result) => { if (!cancelled) setSession((s) => ({ ...s, user: result.user })); })
      .catch(() => {}); // Recording the start is best effort; the server also records it when the flag is submitted.
    return () => { cancelled = true; };
  }, [started, level.level, setSession]);
}
