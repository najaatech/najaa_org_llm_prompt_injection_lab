import { useEffect, useRef, useState } from 'react';
import { api } from '../api/client.js';
import { createChatStore } from '../lib/chatStore.js';

/**
 * Loads the learner's saved chats once per sign-in, before any level chat is shown.
 * `chats.current` is the chat store; it is replaced by an empty one whenever the learner changes or signs out.
 */
export function useChatHistory(userId) {
  const chats = useRef(createChatStore());
  const [chatsReady, setChatsReady] = useState(false);

  useEffect(() => {
    chats.current = createChatStore();
    if (!userId) { setChatsReady(false); return undefined; }
    let cancelled = false;
    api('/api/conversations')
      .then(({ conversations }) => { if (!cancelled) chats.current = createChatStore(conversations); })
      .catch(() => { /* chats start empty if history cannot be loaded */ })
      .finally(() => { if (!cancelled) setChatsReady(true); });
    return () => { cancelled = true; };
  }, [userId]);

  return { chats, chatsReady };
}
