import { httpError } from '../utils/http_error.js';

// All talking to the local Ollama server lives here. Ollama is only ever reached on this fixed
// loopback address, and the model names come from a fixed allow-list, never from a request.
const OLLAMA_URL = 'http://127.0.0.1:11434';
const GENERATION_TIMEOUT_MS = 90 * 1000;
const EMBEDDING_TIMEOUT_MS = 60 * 1000;

export const model = process.env.LAB_MODEL || 'qwen2.5:3b';

/** Fixed, hand-picked comparison models only. Never accept an arbitrary model name from a request. */
export const ALLOWED_MODELS = [...new Set([model, 'qwen2.5:1.5b'])];

/** One fixed embedding model for retrieval. Never accepted from a request. */
export const embedModel = process.env.LAB_EMBED_MODEL || 'nomic-embed-text';

const withTimeout = (signal, timeoutMs) =>
  signal ? AbortSignal.any([signal, AbortSignal.timeout(timeoutMs)]) : AbortSignal.timeout(timeoutMs);

const clamp = (value, low, high, fallback) =>
  typeof value === 'number' && Number.isFinite(value) ? Math.min(high, Math.max(low, value)) : fallback;

const measured = (value) => (typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : null);
const nanosecondsToMs = (value) => (measured(value) === null ? null : value / 1e6);

/**
 * The models this lab uses, with whether each can answer right now (Ollama is reachable and the
 * model is installed). The names come from fixed settings, never from a request.
 */
export const localModelStatus = (installedNames, reachable) => [
  ...ALLOWED_MODELS.map((name) => ({ name, role: 'chat', running: reachable && installedNames.has(name) })),
  { name: embedModel, role: 'embedding', running: reachable && (installedNames.has(embedModel) || installedNames.has(`${embedModel}:latest`)) }
];

/** Checks that Ollama answers and which of the lab's models are installed. */
export async function readiness() {
  try {
    const response = await fetch(`${OLLAMA_URL}/api/tags`, { signal: AbortSignal.timeout(2500) });
    if (!response.ok) throw new Error('Ollama not ready');

    const data = await response.json();
    const installed = new Set((data.models || []).map((item) => item.name));
    const match = data.models?.find((item) => item.name === model);
    const embedInstalled = [...installed].some((name) => name === embedModel || name === `${embedModel}:latest`);

    return {
      available: true,
      installed: Boolean(match),
      model,
      digest: match?.digest || null,
      models: ALLOWED_MODELS.map((name) => ({ name, installed: installed.has(name) })),
      embedModel,
      embedInstalled,
      localModels: localModelStatus(installed, true)
    };
  } catch {
    return {
      available: false,
      installed: false,
      model,
      models: ALLOWED_MODELS.map((name) => ({ name, installed: false })),
      embedModel,
      embedInstalled: false,
      localModels: localModelStatus(new Set(), false)
    };
  }
}

/**
 * The exact request sent to Ollama. Only the model name (from the allow-list) and three sampling
 * values (within fixed bounds) may vary. Context size never changes.
 */
export function generationRequest(overrides = {}) {
  return {
    model: ALLOWED_MODELS.includes(overrides.model) ? overrides.model : model,
    stream: false,
    think: false,
    keep_alive: '10m',
    options: {
      num_ctx: 4096,
      num_predict: Math.round(clamp(overrides.num_predict, 1, 192, 192)),
      temperature: clamp(overrides.temperature, 0, 1.5, 0.2),
      seed: Math.round(clamp(overrides.seed, 0, 2147483647, 42))
    }
  };
}

/** Turns texts into vectors with the local embedding model. Same no-fallback policy as generation. */
export async function embed(texts, signal) {
  try {
    const response = await fetch(`${OLLAMA_URL}/api/embed`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: withTimeout(signal, EMBEDDING_TIMEOUT_MS),
      body: JSON.stringify({ model: embedModel, input: texts })
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const { embeddings } = await response.json();
    const isValidVector = (vector) => Array.isArray(vector) && vector.length > 0 && vector.every(Number.isFinite);
    if (!Array.isArray(embeddings) || embeddings.length !== texts.length || !embeddings.every(isValidVector)) {
      throw new Error('Unexpected embedding response');
    }
    return embeddings;
  } catch {
    if (signal?.aborted) throw signal.reason;
    throw httpError(`Local embedding model unavailable. Run "ollama pull ${embedModel}" and check Ollama. No fallback was used.`, 503);
  }
}

/** Removes any <think> reasoning from a model reply and reports whether something was removed. */
export function sanitizeFinal(value) {
  let content = typeof value === 'string' ? value : '';
  const reasoningOmitted = /<\/?(?:think|thinking)\b[^>]*>/i.test(content);

  content = content.replace(/<(think|thinking)\b[^>]*>[\s\S]*?<\/\1\s*>/gi, '');
  // An orphan closing tag means its prefix may be reasoning too.
  content = content.replace(/^[\s\S]*?<\/(?:think|thinking)\s*>/gi, '');
  content = content.replace(/<(?:think|thinking)\b[^>]*>[\s\S]*$/gi, '');

  return { content: content.trim(), reasoningOmitted };
}

/**
 * Asks the local model for one reply. The observer receives the request and a sanitized response
 * but never message.thinking or an unsanitized provider body.
 */
export async function generate(messages, signal, observer, overrides) {
  const request = generationRequest(overrides);
  observer?.({ request: structuredClone(request) });

  try {
    const response = await fetch(`${OLLAMA_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: withTimeout(signal, GENERATION_TIMEOUT_MS),
      body: JSON.stringify({ ...request, messages })
    });
    if (!response.ok) {
      throw Object.assign(new Error(`Local model unavailable (HTTP ${response.status}).`), { safeModelError: true });
    }

    const data = await response.json();
    const final = sanitizeFinal(data.message?.content);
    observer?.({
      response: {
        ...final,
        reasoningOmitted: final.reasoningOmitted || Boolean(data.message?.thinking),
        doneReason: typeof data.done_reason === 'string' ? data.done_reason : null,
        inputTokens: measured(data.prompt_eval_count),
        outputTokens: measured(data.eval_count),
        totalDurationMs: nanosecondsToMs(data.total_duration),
        loadDurationMs: nanosecondsToMs(data.load_duration),
        promptEvalDurationMs: nanosecondsToMs(data.prompt_eval_duration),
        evalDurationMs: nanosecondsToMs(data.eval_duration)
      }
    });

    // Labs that deliberately cap output (token counting, sampling samples) accept truncated or empty finals.
    const unusable = !final.content || data.done_reason === 'length';
    if (overrides?.partial !== true && unusable) {
      throw Object.assign(
        new Error('The local model did not finish a usable final answer. Use the tested qwen2.5:3b model or shorten the source.'),
        { safeModelError: true }
      );
    }
    return final.content;
  } catch (cause) {
    if (signal?.aborted) throw signal.reason;
    const reason = cause.safeModelError ? cause.message : 'Local model connection, timeout, or response decoding failed.';
    const usedModel = overrides && ALLOWED_MODELS.includes(overrides.model) ? overrides.model : model;
    throw httpError(`${reason} Check local Ollama and model ${usedModel}. No fallback was used.`, 503);
  }
}
