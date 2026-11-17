// Embedding retriever. Each document and the question become vectors from the local embedding model;
// documents are ranked by cosine similarity. Vectors are stored on the MongoDB documents and compared
// in application code (community MongoDB has no vector search). Authorisation is applied by the caller
// before any document reaches this module.

export const queryPrefix = 'search_query: ';
export const documentPrefix = 'search_document: ';

/** Below this similarity a document is considered unrelated and is not placed in the prompt. */
export const minScore = 0.6;

/** Cosine similarity of two vectors, or 0 when they cannot be compared. */
export function cosine(a, b) {
  if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length || !a.length) return 0;

  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  return normA && normB ? dot / Math.sqrt(normA * normB) : 0;
}

/** The text that is embedded for a document. */
export const embeddingText = (document) => `${documentPrefix}${document.title}\n${document.text}`;

/**
 * corpus: [{ id, title, text, embedding }].
 * Returns every chunk scored, with the top `k` above the threshold marked `selected`.
 */
export function retrieve(queryVector, corpus, k, threshold = minScore) {
  const scored = corpus
    .map(({ embedding, ...chunk }) => ({ ...chunk, score: Math.round(cosine(queryVector, embedding) * 100) / 100 }))
    .sort((a, b) => b.score - a.score || String(a.id).localeCompare(String(b.id)));

  const selected = new Set(scored.filter((chunk) => chunk.score >= threshold).slice(0, k).map((chunk) => chunk.id));
  return { scored: scored.map((chunk) => ({ ...chunk, selected: selected.has(chunk.id) })) };
}
