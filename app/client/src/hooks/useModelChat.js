import { useCallback, useMemo } from 'react';
import { api } from '../api/client.js';
import { useApp } from '../context/AppContext.js';
import { replyStream, textFromMessage } from '../lib/chatMessages.js';

/**
 * Connects a chat box to the server for one level and one model. The adapter is bound to the model
 * that was asked, so a reply that arrives late is still stored with that model's chat.
 */
export function useModelChat(level, model, onChange) {
  const { chats } = useApp();
  const chat = chats.current.chat(level.id, model);

  const adapter = useMemo(() => ({
    async sendMessage({ message }) {
      const result = await api('/api/challenge', { level: level.level, message: textFromMessage(message), model });
      chat.evidence = result;
      onChange();
      return replyStream(result.answer);
    }
  }), [chat, level.level, model, onChange]);

  const onMessagesChange = useCallback((messages) => {
    chat.messages = messages;
    onChange();
  }, [chat, onChange]);

  return { adapter, initialMessages: chat.messages, onMessagesChange };
}
