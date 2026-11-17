import { restoredMessages } from './chatMessages.js';

/**
 * In-memory chats for the signed-in learner. Every level has a separate chat per model,
 * so the answers of one model are never shown in another model's conversation.
 *
 * Shape of one chat: { messages, evidence, version }. `evidence` is the server's latest reply details.
 * `version` grows each time the chat is cleared, so its chat box can be rebuilt empty.
 */
export function createChatStore(savedConversations = {}) {
  const chats = {};
  const selectedModels = {};

  for (const [levelId, byModel] of Object.entries(savedConversations)) {
    chats[levelId] = Object.fromEntries(Object.entries(byModel).map(([model, entries]) => [
      model,
      { messages: restoredMessages(levelId, model, entries), evidence: null, version: 0 }
    ]));
  }

  return {
    /** The chat for one level and model, created empty on first use. */
    chat(levelId, model) {
      chats[levelId] ??= {};
      chats[levelId][model] ??= { messages: [], evidence: null, version: 0 };
      return chats[levelId][model];
    },
    /**
     * Empties one chat. The old chat object is dropped, so a reply that arrives late for it is discarded
     * instead of reappearing in the cleared chat.
     */
    clear(levelId, model) {
      const { version } = this.chat(levelId, model);
      chats[levelId][model] = { messages: [], evidence: null, version: version + 1 };
    },
    /** The model last chosen on a level, so the choice survives leaving and returning. */
    selectedModel: (levelId) => selectedModels[levelId],
    selectModel(levelId, model) { selectedModels[levelId] = model; }
  };
}
