const express = require('express');
const router = express.Router();
const { RecursiveCharacterTextSplitter } = require('@langchain/textsplitters');
const ManualChunk = require('../models/ManualChunk');
const { embeddings, searchChunks } = require('../rag/search');

const splitter = new RecursiveCharacterTextSplitter({
  chunkSize: 1000,
  chunkOverlap: 200,
  separators: ['\n## ', '\n### ', '\n\n', '\n', '. ', ' '],
});

// ─────────────────────────────────────────────────────────────────────
// POST /api/rag/ingest — ingest raw text into the vector store
// Body: { text, source?, title?, category?, vehicle?: { make, model, year } }
// ─────────────────────────────────────────────────────────────────────
router.post('/ingest', async (req, res) => {
  try {
    const { text, source, title, category, vehicle } = req.body;
    if (!text || text.length < 20) {
      return res.status(400).json({ error: 'text is required (min 20 chars)' });
    }

    const chunks = await splitter.splitText(text);
    const vectors = await Promise.all(
      chunks.map(chunk => embeddings.embedQuery(chunk))
    );

    const docs = chunks.map((content, i) => ({
      content,
      embedding: vectors[i],
      source: source || '',
      title: title || '',
      category: category || 'general',
      vehicle: vehicle || {},
    }));

    await ManualChunk.insertMany(docs);

    res.json({ ingested: docs.length, message: `Stored ${docs.length} chunks` });
  } catch (err) {
    console.error('Ingest error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────
// POST /api/rag/search — test vector search
// Body: { query, category?, vehicle?, limit? }
// ─────────────────────────────────────────────────────────────────────
router.post('/search', async (req, res) => {
  try {
    const { query, category, vehicle, limit } = req.body;
    if (!query) return res.status(400).json({ error: 'query is required' });

    const results = await searchChunks(query, { category, vehicle, limit });
    res.json({ results, count: results.length });
  } catch (err) {
    console.error('Search error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────
// GET /api/rag/stats — chunk counts by category
// ─────────────────────────────────────────────────────────────────────
router.get('/stats', async (req, res) => {
  try {
    const total = await ManualChunk.countDocuments();
    const byCategory = await ManualChunk.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);
    res.json({ total, byCategory });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────
// DELETE /api/rag/chunks — clear all chunks (or by category)
// Query: ?category=brakes
// ─────────────────────────────────────────────────────────────────────
router.delete('/chunks', async (req, res) => {
  try {
    const filter = req.query.category ? { category: req.query.category } : {};
    const result = await ManualChunk.deleteMany(filter);
    res.json({ deleted: result.deletedCount });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
