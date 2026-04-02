const mongoose = require('mongoose');
const { Schema } = mongoose;

// Represents a VCdb vehicle configuration (used to populate cascading dropdowns)
const vehicleConfigSchema = new Schema({
  year:         { type: Number, required: true, index: true },
  make:         { type: String, required: true, trim: true, index: true },
  model:        { type: String, required: true, trim: true, index: true },
  trim:         { type: String, trim: true, default: '' },
  engine:       { type: String, trim: true, default: '' },
  bodyStyle:    { type: String, trim: true, default: '' },
  driveType:    { type: String, trim: true, default: '' },
  transmission: { type: String, trim: true, default: '' },
});

// Compound indexes for fast cascading lookups
vehicleConfigSchema.index({ year: 1, make: 1 });
vehicleConfigSchema.index({ year: 1, make: 1, model: 1 });
vehicleConfigSchema.index({ year: 1, make: 1, model: 1, trim: 1 });

module.exports = mongoose.model('VehicleConfig', vehicleConfigSchema);
