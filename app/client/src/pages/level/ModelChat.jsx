import { useMemo } from 'react';
import { Box } from '@mui/material';
import { ChatBox } from '@mui/x-chat';
import { useApp } from '../../context/AppContext.js';
import { useModelChat } from '../../hooks/useModelChat.js';
import { botAvatarUrl, userAvatarUrl } from '../../components/avatars/avatarUrls.jsx';

/** The chat box of one model. It stays mounted while hidden, so its conversation and any pending reply are kept. */
export function ModelChat({ level, model, visible, onChange, onError }) {
  const { session } = useApp();
  const { adapter, initialMessages, onMessagesChange } = useModelChat(level, model, onChange);
  const learnerAvatar = useMemo(() => userAvatarUrl(session.user.nickname), [session.user.nickname]);

  return (
    <Box sx={{ height: '100%', display: visible ? 'block' : 'none' }}>
      <ChatBox
        adapter={adapter}
        initialMessages={initialMessages}
        onMessagesChange={onMessagesChange}
        features={{ conversationList: false, attachments: false, suggestions: false }}
        currentUser={{ id: 'learner', displayName: 'You', avatarUrl: learnerAvatar }}
        getMessageAuthorAvatarUrl={(message) => (message.role === 'assistant' ? botAvatarUrl : undefined)}
        onError={onError}
        sx={{ height: '100%' }}
      />
    </Box>
  );
}
