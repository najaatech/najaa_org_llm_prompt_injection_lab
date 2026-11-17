import { useEffect, useState } from 'react';
import { Alert, CircularProgress, Tab, Tabs, Typography } from '@mui/material';
import { api } from '../../api/client.js';
import { BOARDS } from './boards.js';
import { LeaderboardTable } from './LeaderboardTable.jsx';
import { TopUsersChart } from './TopUsersChart.jsx';

export function Leaderboard() {
  const [boards, setBoards] = useState(null);
  const [error, setError] = useState('');
  const [tab, setTab] = useState('overall');

  useEffect(() => {
    let cancelled = false;
    api('/api/leaderboard')
      .then((data) => { if (!cancelled) setBoards(data.boards); })
      .catch((err) => { if (!cancelled) setError(err.message); });
    return () => { cancelled = true; };
  }, []);

  const rows = boards?.[tab] ?? [];
  const boardLabel = BOARDS.find(([id]) => id === tab)[1];
  const emptyText = tab === 'overall' ? 'Nobody has finished all three yet.'
    : tab === 'flags' ? 'Nobody has opened a flag challenge yet.'
    : 'Nobody has finished this one yet. Be the first.';

  return (
    <>
      <Typography variant="h4" gutterBottom>Leaderboards</Typography>
      <Typography sx={{ mb: 2 }}>
        A higher score ranks first. Among equal scores, the shorter time wins. Learners appear by nickname only. The overall board needs all three: both quizzes and the pipeline game. The flag challenges board has no time limit: it records when you opened each level and whether you submitted its flag.
      </Typography>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {!boards && !error && <CircularProgress />}
      {boards && (
        <>
          <Tabs value={tab} onChange={(_, value) => setTab(value)} variant="scrollable" sx={{ mb: 2 }}>
            {BOARDS.map(([id, label]) => <Tab key={id} value={id} label={label} />)}
          </Tabs>
          {rows.length === 0 ? (
            <Alert severity="info">{emptyText}</Alert>
          ) : (
            <>
              <TopUsersChart rows={rows} boardLabel={boardLabel} />
              <LeaderboardTable rows={rows} boardLabel={boardLabel} />
            </>
          )}
        </>
      )}
    </>
  );
}
