import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '../api/client.js';
import { useApp } from '../context/AppContext.js';

const DEFAULT_LIMIT_MS = 5 * 60 * 1000;

/**
 * Runs one timed quiz: start (the server records the start time), answer, submit once.
 * The server keeps the clock and grades the answers, so the saved result in the session is the only
 * source of the score, the time and the right answers. The countdown here is only a display.
 * When the time runs out the answers given so far are submitted automatically.
 */
export function useQuizSubmission(quizId) {
  const { session, setSession, notify } = useApp();
  const [busy, setBusy] = useState(false);
  const [answers, setAnswers] = useState({});
  const [now, setNow] = useState(() => Date.now());
  const autoSubmitted = useRef(false);
  const answersRef = useRef(answers);
  answersRef.current = answers;

  const saved = session.user.quizScores?.[quizId] ?? null;
  const startedAt = session.user.quizStarts?.[quizId] ?? null;
  const limitMs = session.quizLimitMs ?? DEFAULT_LIMIT_MS;
  const phase = saved ? 'done' : startedAt ? 'running' : 'idle';
  const skew = session.clockSkewMs ?? 0;
  const remainingMs = startedAt ? Math.max(0, Date.parse(startedAt) + limitMs - (now + skew)) : limitMs;

  const refreshUser = useCallback(async () => {
    try {
      const fresh = await api('/api/session');
      setSession((current) => ({ ...current, user: fresh.user }));
    } catch { /* the message shown by the caller is still enough */ }
  }, [setSession]);

  const start = async () => {
    setBusy(true);
    try {
      const data = await api('/api/quiz/start', { quizId });
      setNow(Date.now());
      setSession((current) => ({
        ...current,
        clockSkewMs: Date.parse(data.serverNow) - Date.now(),
        user: { ...current.user, quizStarts: { ...current.user.quizStarts, [quizId]: data.startedAt } }
      }));
    } catch (err) {
      if (err.status === 409) await refreshUser();
      notify(err.message, err.status === 409 ? 'info' : 'error');
    } finally {
      setBusy(false);
    }
  };

  const submit = useCallback(async () => {
    setBusy(true);
    try {
      const { user } = await api('/api/quiz', { quizId, answers: answersRef.current });
      setSession((current) => ({ ...current, user }));
    } catch (err) {
      if (err.status === 409) await refreshUser();
      notify(err.message, err.status === 409 ? 'info' : 'error');
    } finally {
      setBusy(false);
    }
  }, [quizId, refreshUser, setSession, notify]);

  useEffect(() => {
    if (phase !== 'running') return undefined;
    const timer = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(timer);
  }, [phase]);

  const expired = phase === 'running' && remainingMs <= 0;
  useEffect(() => {
    if (!expired || autoSubmitted.current) return;
    autoSubmitted.current = true;
    submit();
  }, [expired, submit]);

  const setAnswer = (id, value) => setAnswers((current) => ({ ...current, [id]: value }));

  return { phase, saved, busy, answers, setAnswer, start, submit, remainingMs, limitMs, expired };
}
