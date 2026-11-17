import { Divider, Drawer, List, ListItemButton, ListItemText, ListSubheader, Toolbar } from '@mui/material';
import { go } from '../../lib/navigation.js';

export const SIDE_NAV_WIDTH = 270;

/** Permanent left menu with every page, ticking the ones the learner has finished. */
export function SideNav({ route, catalog, user }) {
  const item = (id, label, done) => (
    <ListItemButton key={id} selected={route === id} onClick={() => go(id)}>
      <ListItemText primary={`${label}${done ? ' ✓' : ''}`} />
    </ListItemButton>
  );

  return (
    <Drawer variant="permanent" sx={{ width: SIDE_NAV_WIDTH, '& .MuiDrawer-paper': { width: SIDE_NAV_WIDTH, boxSizing: 'border-box' } }}>
      <Toolbar />
      <List>
        {item('start', 'Start here')}
        <Divider />
        <ListSubheader>Games &amp; leaderboard</ListSubheader>
        {item('sorting', 'Instruction or data? game', user.quizScores?.sorting)}
        {item('quiz', 'RAG quick quiz', user.quizScores?.['rag-quiz'])}
        {item('rag-game', 'Build a RAG pipeline', user.quizScores?.['rag-game'])}
        {item('leaderboard', 'Leaderboards')}
        <Divider />
        <ListSubheader>Flag challenges</ListSubheader>
        {catalog.levels.map((level) => item(level.id, level.title.replace(/^Level \d+ · /, `L${level.level} · `), user.solved[level.id]))}
      </List>
    </Drawer>
  );
}
