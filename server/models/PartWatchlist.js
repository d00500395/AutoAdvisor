const mongoose = require('mongoose');
const { Schema } = mongoose;

const partWatchlistSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    partSearchId: { type: Schema.Types.ObjectId, ref: 'PartSearch', required: true, index: true },
  },
  { timestamps: true }
);

partWatchlistSchema.index({ userId: 1, partSearchId: 1 }, { unique: true });

module.exports = mongoose.model('PartWatchlist', partWatchlistSchema);
