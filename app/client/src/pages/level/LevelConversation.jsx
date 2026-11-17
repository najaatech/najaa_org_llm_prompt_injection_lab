import { useState } from 'react';
import { Badge, Button, Stack } from '@mui/material';
import { useLevelChat } from '../../hooks/useLevelChat.js';
import { ChatDrawer } from './ChatDrawer.jsx';

/** The conversation lives in an off-canvas drawer opened from the level page. */
export function LevelConversation({ level }) {
  const [open, setOpen] = useState(false);
  const chat = useLevelChat(level);

  return (
    <>
      <Stack direction="row" spacing={2} sx={{ alignItems: 'center', flexWrap: 'wrap' }} useFlexGap>
        <Badge color="secondary" badgeContent={chat.messageCount} max={99}>
          <Button variant="contained" onClick={() => setOpen(true)}>Open conversation →</Button>
        </Badge>
      </Stack>
      <ChatDrawer level={level} chat={chat} open={open} onClose={() => setOpen(false)} />
    </>
  );
}
