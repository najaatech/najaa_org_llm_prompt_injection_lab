import { AppBar, IconButton, Toolbar, Tooltip, Typography } from '@mui/material';
import GitHub from '@mui/icons-material/GitHub';
import Leaderboard from '@mui/icons-material/Leaderboard';
import { title } from '../../theme.js';
import { useApp } from '../../context/AppContext.js';
import { NavLogo } from '../branding/Branding.jsx';
import { ProfileMenu } from './ProfileMenu.jsx';
import { StatusMenu } from './StatusMenu.jsx';

const REPO_URL = 'https://github.com/najaatech/najaa_org_llm_prompt_injection_lab';

export function NavBar({ authed, online, modelStatus, onLogout }) {
  const { go } = useApp();
  return (
    <AppBar position="fixed" sx={{ zIndex: (t) => t.zIndex.drawer + 1 }}>
      <Toolbar sx={{ gap: 0.5 }}>
        <NavLogo height={38} />
        <Typography variant="h6" sx={{ flexGrow: 1, ml: 1.5, fontSize: { xs: 14, md: 20 } }}>{title}</Typography>
        <StatusMenu online={online} models={modelStatus?.localModels} />
        <Tooltip title="Source code on GitHub">
          <IconButton color="inherit" component="a" href={REPO_URL} target="_blank" rel="noopener noreferrer" aria-label="GitHub repository"><GitHub /></IconButton>
        </Tooltip>
        {authed && (
          <>
            <Tooltip title="Leaderboards">
              <IconButton color="inherit" aria-label="Leaderboards" onClick={() => go('leaderboard')}><Leaderboard /></IconButton>
            </Tooltip>
            <ProfileMenu onLogout={onLogout} />
          </>
        )}
      </Toolbar>
    </AppBar>
  );
}
