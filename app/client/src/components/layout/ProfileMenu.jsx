import { useState } from 'react';
import { Box, Divider, IconButton, ListItemIcon, ListItemText, Menu, MenuItem, Tooltip, Typography } from '@mui/material';
import Edit from '@mui/icons-material/Edit';
import Logout from '@mui/icons-material/Logout';
import { useApp } from '../../context/AppContext.js';
import { UserAvatar } from '../avatars/UserAvatar.jsx';
import { NicknameDialog } from './NicknameDialog.jsx';

/** Avatar button in the app bar: shows who is signed in, and offers nickname and log out. */
export function ProfileMenu({ onLogout }) {
  const { session } = useApp();
  const [anchor, setAnchor] = useState(null);
  const [dialog, setDialog] = useState(false);
  return (
    <>
      <Tooltip title="Profile">
        <IconButton color="inherit" aria-label="Profile menu" aria-haspopup="menu" onClick={(e) => setAnchor(e.currentTarget)}>
          <UserAvatar name={session.user.nickname} size={30} />
        </IconButton>
      </Tooltip>
      <Menu anchorEl={anchor} open={Boolean(anchor)} onClose={() => setAnchor(null)}>
        <Box sx={{ px: 2, py: 1, display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <UserAvatar name={session.user.nickname} size={40} />
          <Box>
            <Typography variant="subtitle2" sx={{ fontFamily: 'monospace' }}>{session.user.nickname}</Typography>
            <Typography variant="body2" color="text.secondary">{session.user.email}</Typography>
          </Box>
        </Box>
        <Divider />
        <MenuItem onClick={() => { setAnchor(null); setDialog(true); }}>
          <ListItemIcon><Edit fontSize="small" /></ListItemIcon><ListItemText>Set nickname</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => { setAnchor(null); onLogout(); }}>
          <ListItemIcon><Logout fontSize="small" /></ListItemIcon><ListItemText>Log out</ListItemText>
        </MenuItem>
      </Menu>
      <NicknameDialog open={dialog} onClose={() => setDialog(false)} />
    </>
  );
}
