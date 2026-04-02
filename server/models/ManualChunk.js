const mongoose = require('mongoose');

const manualChunkSchema = new mongoose.Schema({
  // The raw text content of this chunk
  content: { type: String, required: true },

  // Embedding vector (array of floats from OllamaEmbeddings)
  embedding: { type: [Number], required: true },

  // Metadata for filtering and display
  source: { type: String, default: '' },          // URL or file path
  title:  { type: String, default: '' },           // page/section title
  category: { type: String, default: 'general' },  // brakes, engine, electrical, etc.
  vehicle: {
    make:  { type: String, default: '' },
    model: { type: String, default: '' },
    year:  { type: String, default: '' },
  },
}, { timestamps: true });

// Index on category for pre-filtering before vector search
manualChunkSchema.index({ category: 1 });
manualChunkSchema.index({ 'vehicle.make': 1, 'vehicle.model': 1 });

module.exports = mongoose.model('ManualChunk', manualChunkSchema);
