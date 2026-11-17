import { useState } from 'react';
import { Divider, IconButton, ListItemIcon, ListItemText, Menu, MenuItem, Tooltip, Typography } from '@mui/material';
import Circle from '@mui/icons-material/Circle';
import { overallStatus } from '../../lib/modelStatus.js';

/** Traffic-light button in the app bar; the menu lists every local model. */
export function StatusMenu({ online, models }) {
  const [anchor, setAnchor] = useState(null);
  const overall = overallStatus(online, models);
  return (
    <>
      <Tooltip title={overall.label}>
        <IconButton color="inherit" aria-label={`Status: ${overall.label}`} aria-haspopup="menu" onClick={(e) => setAnchor(e.currentTarget)}>
          <Circle sx={{ color: overall.color, stroke: 'white', strokeWidth: 1 }} />
        </IconButton>
      </Tooltip>
      <Menu anchorEl={anchor} open={Boolean(anchor)} onClose={() => setAnchor(null)}>
        <Typography variant="subtitle2" sx={{ px: 2, py: 0.5 }}>{overall.label}</Typography>
        <Divider />
        {!online && <Typography variant="body2" sx={{ px: 2, py: 1, maxWidth: 280 }}>Server connection interrupted. The status below cannot be refreshed.</Typography>}
        {online && (!models || models.length === 0) && <Typography variant="body2" sx={{ px: 2, py: 1 }}>No model information yet.</Typography>}
        {online && (models ?? []).map((m) => (
          <MenuItem key={m.name} dense onClick={() => setAnchor(null)}>
            <ListItemIcon><Circle fontSize="small" sx={{ color: m.running ? 'success.main' : 'error.main' }} /></ListItemIcon>
            <ListItemText primary={m.name} secondary={`${m.role === 'embedding' ? 'Embedding' : 'Chat'} · ${m.running ? 'running' : 'not running'}`} />
          </MenuItem>
        ))}
      </Menu>
    </>
  );
}
