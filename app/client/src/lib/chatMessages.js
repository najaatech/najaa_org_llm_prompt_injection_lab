/** The text of a chat-box message: every text part joined together. */
export const textFromMessage = (message) => message.parts.filter((part) => part.type === 'text').map((part) => part.text).join('');

/** Turns saved chat entries from the server into the shape the chat box restores from. */
export const restoredMessages = (levelId, model, entries) => entries.map((entry, index) => ({
  id: `saved-${levelId}-${model}-${index}`,
  role: entry.role,
  parts: [{ type: 'text', text: entry.text }],
  createdAt: entry.at,
  ...(entry.role === 'user' ? { author: { id: 'learner', displayName: 'You' } } : {})
}));

/** A finished model reply as the stream of events the chat box expects from an adapter. */
export function replyStream(answer) {
  const id = `a-${crypto.randomUUID()}`;
  const part = `t-${id}`;
  return new ReadableStream({
    start(controller) {
      controller.enqueue({ type: 'start', messageId: id });
      controller.enqueue({ type: 'text-start', id: part });
      controller.enqueue({ type: 'text-delta', id: part, delta: answer });
      controller.enqueue({ type: 'text-end', id: part });
      controller.enqueue({ type: 'finish', messageId: id });
      controller.close();
    }
  });
}
