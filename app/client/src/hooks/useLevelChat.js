import { useCallback, useState } from 'react';
import { api } from '../api/client.js';
import { useApp } from '../context/AppContext.js';

/**
 * Chat state of one level. Each model has its own chat, so switching the model shows that model's
 * conversation and evidence. `refresh` must be called when a chat changes so the badge and evidence update.
 */
export function useLevelChat(level) {
  const { session, chats } = useApp();
  const models = session.models?.length ? session.models : [session.model];
  const [model, setModel] = useState(() => chats.current.selectedModel(level.id) ?? session.model);
  const [, setRevision] = useState(0);
  const refresh = useCallback(() => setRevision((n) => n + 1), []);

  const selectModel = (next) => {
    chats.current.selectModel(level.id, next);
    setModel(next);
  };

  const active = chats.current.chat(level.id, model);

  /** Deletes the saved conversation with the chosen model, then empties it on screen. */
  const resetChat = async () => {
    await api('/api/conversations/reset', { level: level.level, model });
    chats.current.clear(level.id, model);
    refresh();
  };

  return {
    models, model, selectModel, messageCount: active.messages.length, evidence: active.evidence, refresh,
    resetChat, versionOf: (name) => chats.current.chat(level.id, name).version
  };
}
