const mongoose = require('mongoose');
const { Schema } = mongoose;

// A user's saved vehicle in their garage
const garageVehicleSchema = new Schema({
  userId:     { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  year:       { type: Number, required: true },
  make:       { type: String, required: true, trim: true },
  model:      { type: String, required: true, trim: true },
  trim:       { type: String, trim: true, default: '' },
  engine:     { type: String, trim: true, default: '' },
  bodyStyle:  { type: String, trim: true, default: '' },
  driveType:  { type: String, trim: true, default: '' },
  nickname:   { type: String, trim: true, maxlength: 30, default: '' },
  isDefault:  { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('GarageVehicle', garageVehicleSchema);
