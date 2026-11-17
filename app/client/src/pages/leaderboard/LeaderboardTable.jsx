import { Box, Chip, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';
import { UserAvatar } from '../../components/avatars/UserAvatar.jsx';
import { formatDuration } from '../../lib/quizFeedback.js';

/** Per flag challenge: submitted (with the time from first open), open (started, not submitted) or not started. */
function FlagStatus({ levels }) {
  return (
    <Box sx={{ display: 'inline-flex', gap: 0.5, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
      {levels.map(({ id, status, seconds }) => (
        <Chip
          key={id}
          size="small"
          variant={status === 'not-started' ? 'outlined' : 'filled'}
          color={status === 'submitted' ? 'success' : status === 'open' ? 'warning' : 'default'}
          label={`${id.toUpperCase()} ${status === 'submitted' ? `submitted${seconds === null ? '' : ` ${formatDuration(seconds * 1000)}`}` : status === 'open' ? 'open' : 'not started'}`}
        />
      ))}
    </Box>
  );
}

/** Full ranking of a board, highlighting the signed-in learner. The flag board shows each level's status instead. */
export function LeaderboardTable({ rows, boardLabel }) {
  const flags = rows.some((row) => row.levels);
  return (
    <TableContainer component={Paper} variant="outlined">
      <Table size="small" aria-label={`${boardLabel} leaderboard`}>
        <TableHead>
          <TableRow>
            <TableCell>Rank</TableCell>
            <TableCell>Nickname</TableCell>
            <TableCell align="right">Score</TableCell>
            <TableCell align="right">Time</TableCell>
            <TableCell align="right">{flags ? 'Flags' : 'Levels solved'}</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={`${row.rank}-${row.nickname}`} selected={row.me}>
              <TableCell>{row.rank}</TableCell>
              <TableCell>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <UserAvatar name={row.nickname} size={24} />
                  <Box component="span" sx={{ fontFamily: 'monospace' }}>{row.nickname}</Box>
                  {row.me && <Chip size="small" color="primary" label="you" />}
                </Box>
              </TableCell>
              <TableCell align="right">{row.score} / {row.total}</TableCell>
              <TableCell align="right">{flags && row.score === 0 ? '–' : formatDuration(row.seconds * 1000)}</TableCell>
              <TableCell align="right">{flags ? <FlagStatus levels={row.levels} /> : `${row.solved} / 3`}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
