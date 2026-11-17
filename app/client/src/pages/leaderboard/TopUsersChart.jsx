import { Paper, Typography } from '@mui/material';
import { BarChart } from '@mui/x-charts/BarChart';
import { formatDuration } from '../../lib/quizFeedback.js';

const TOP_USERS = 10;

/** Horizontal bar chart of the best scores on a board. */
export function TopUsersChart({ rows, boardLabel }) {
  const top = rows.slice(0, TOP_USERS).map(({ nickname, score, total, seconds }) => ({ nickname, score, total, seconds }));
  const describe = (value, { dataIndex }) => `${value} / ${top[dataIndex].total} in ${formatDuration(top[dataIndex].seconds * 1000)}`;

  return (
    <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
      <Typography variant="h6" component="h2">Top {top.length === 1 ? 'user' : `${top.length} users`}</Typography>
      <BarChart
        dataset={top}
        yAxis={[{ scaleType: 'band', dataKey: 'nickname', width: 110 }]}
        xAxis={[{ min: 0 }]}
        series={[{ dataKey: 'score', label: 'Score', color: '#212e7e', valueFormatter: describe }]}
        layout="horizontal"
        grid={{ vertical: true }}
        height={Math.max(160, top.length * 40 + 60)}
        borderRadius={4}
        hideLegend
        skipAnimation
        aria-label={`Top users, ${boardLabel}`}
      />
    </Paper>
  );
}
