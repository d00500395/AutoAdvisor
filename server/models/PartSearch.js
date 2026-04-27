const mongoose = require('mongoose');
const { Schema } = mongoose;

const partSearchSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    vehicleQuery: { type: String, required: true, trim: true },
    partQuery: { type: String, required: true, trim: true },
    status: { type: String, enum: ['success', 'partial', 'error'], default: 'success' },
    scraperResponse: { type: Schema.Types.Mixed, required: true },
    successfulDomains: [{ type: String }],
    failedDomains: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

partSearchSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('PartSearch', partSearchSchema);
