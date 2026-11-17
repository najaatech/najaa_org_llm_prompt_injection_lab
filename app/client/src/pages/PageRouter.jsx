import { lazy, Suspense } from 'react';
import { CircularProgress } from '@mui/material';
import { Leaderboard } from './leaderboard/Leaderboard.jsx';
import { Level } from './level/Level.jsx';
import { Quiz } from './quiz/Quiz.jsx';
import { Sorting } from './sorting/Sorting.jsx';
import { Start } from './start/Start.jsx';

// three.js is large, so the 3D game is only downloaded when someone opens it.
const RagGame = lazy(() => import('./rag-game/RagGame.jsx'));

/** Picks the page for the current route. A level page waits until the saved chats are loaded. */
export function PageRouter({ route, catalog, chatsReady }) {
  const level = catalog.levels.find((l) => l.id === route);

  if (route === 'sorting') return <Sorting />;
  if (route === 'quiz') return <Quiz />;
  if (route === 'leaderboard') return <Leaderboard />;
  if (route === 'rag-game') return <Suspense fallback={<CircularProgress />}><RagGame /></Suspense>;
  if (level) return chatsReady ? <Level key={level.id} level={level} /> : <CircularProgress />;
  return <Start />;
}
