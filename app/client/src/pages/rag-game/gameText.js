export const STEP_MS = 2400;

export const START_MESSAGE = { severity: 'info', text: 'Click the piece that takes "start" to begin. A piece only fits after a piece that gives what it needs.' };

export const LESSON_POISONED = 'Lesson: RAG gives the model new text that the app does not control. Treat retrieved passages as untrusted data, and enforce limits on the server instead of trusting the model. The levels in this lab let you try the same idea safely.';

export const LESSON_CLEAN = 'Run it again with the poisoned document switched on to see how an attacker can reach the model without ever talking to it.';
