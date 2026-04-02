const { OllamaEmbeddings } = require('@langchain/ollama');
const ManualChunk = require('../models/ManualChunk');

// ─────────────────────────────────────────────────────────────────────
// Shared embedding model (same Ollama instance as the LLM)
// ─────────────────────────────────────────────────────────────────────
const embeddings = new OllamaEmbeddings({
  model: process.env.EMBEDDING_MODEL || 'qwen3-embedding',
  baseUrl: process.env.OLLAMA_URL || 'http://golem:11434',
});

// ─────────────────────────────────────────────────────────────────────
// Cosine similarity (from rag_examples/examples2/vector-test.js)
// ─────────────────────────────────────────────────────────────────────
function cosineSimilarity(a, b) {
  let dot = 0, magA = 0, magB = 0;
  for (let i = 0; i < a.length; i++) {
    dot  += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }
  magA = Math.sqrt(magA);
  magB = Math.sqrt(magB);
  if (magA === 0 || magB === 0) return 0;
  return dot / (magA * magB);
}

// ─────────────────────────────────────────────────────────────────────
// Search: embed query → fetch chunks → rank by cosine similarity
// ─────────────────────────────────────────────────────────────────────
async function searchChunks(query, { category = null, vehicle = null, limit = 5, minScore = 0.3 } = {}) {
  // 1. Embed the query
  const queryVector = await embeddings.embedQuery(query);

  // 2. Build a MongoDB filter for pre-filtering (vehicle only — category handled below)
  const vehicleFilter = {};
  if (vehicle?.make) vehicleFilter['vehicle.make'] = new RegExp(vehicle.make, 'i');
  if (vehicle?.model) {
    // Match first word of model to handle "Silverado 1500" vs stored "Silverado"
    const modelWord = vehicle.model.split(/\s/)[0];
    vehicleFilter['vehicle.model'] = new RegExp(modelWord, 'i');
  }

  // 3. Try with category filter first, then broaden if no results
  let candidates;
  if (category) {
    candidates = await ManualChunk.find({ ...vehicleFilter, category })
      .select('content embedding source title category vehicle')
      .lean();
  }

  if (!candidates || candidates.length === 0) {
    // Broaden: drop category filter
    candidates = await ManualChunk.find(vehicleFilter)
      .select('content embedding source title category vehicle')
      .lean();
  }

  if (candidates.length === 0) return [];

  // 4. Score each candidate by cosine similarity
  const scored = candidates.map(chunk => ({
    content: chunk.content,
    source: chunk.source,
    title: chunk.title,
    category: chunk.category,
    vehicle: chunk.vehicle,
    score: cosineSimilarity(queryVector, chunk.embedding),
  }));

  // 5. Sort descending, apply minimum score threshold, and limit
  return scored
    .filter(c => c.score >= minScore)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

module.exports = { embeddings, cosineSimilarity, searchChunks };
