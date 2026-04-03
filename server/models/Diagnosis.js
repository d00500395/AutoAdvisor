const mongoose = require('mongoose');
const { Schema } = mongoose;

const recommendedPartSchema = new Schema({
  partName:      { type: String, required: true },
  partCategory:  { type: String, required: true },
  oemPartNumber: { type: String },
  causationProbability: { type: Number, min: 0, max: 100, default: 50 },
}, { _id: false });

const diagnosisResultSchema = new Schema({
  likelyCause:      { type: String, required: true },
  confidenceLevel:  { type: String, enum: ['high', 'medium', 'low'], required: true },
  recommendedParts: [recommendedPartSchema],
  repairDifficulty: { type: String, enum: ['DIY-Easy', 'DIY-Moderate', 'Shop-Recommended'] },
  urgency:          { type: String, enum: ['Drive carefully', 'Fix soon', 'Stop driving'] },
  additionalNotes:  { type: String },
}, { _id: false });

const replacementProcessSchema = new Schema({
  partName:      { type: String, required: true },
  steps:         [{ type: String }],
  tools:         [{ type: String }],
  estimatedTime: { type: String },
  difficulty:    { type: String },
  warnings:      [{ type: String }],
}, { _id: false });

const diagnosisSchema = new Schema({
  userId:             { type: Schema.Types.ObjectId, ref: 'User', index: true },
  vehicleId:          { type: Schema.Types.ObjectId, ref: 'GarageVehicle' },
  symptomDescription: { type: String, required: true, minlength: 10, maxlength: 1000 },
  vehicleContext:     {
    year:    Number,
    make:    String,
    model:   String,
    trim:    String,
    engine:  String,
    mileage: Number,
  },
  clarifyingQuestions: [{ type: String }],
  clarifyingAnswers:   [{ type: String }],
  diagnosisResult:     diagnosisResultSchema,
  ragSourcesUsed:      [{ source: String, title: String, score: Number }],
  replacementProcesses: [replacementProcessSchema],
  status:              { type: String, enum: ['pending', 'clarifying', 'complete', 'error'], default: 'pending' },
}, { timestamps: true });

// Automatically expire guest diagnoses after 24 hours while preserving signed-in users' records.
diagnosisSchema.index(
  { createdAt: 1 },
  {
    name: 'guest_diagnosis_ttl_24h',
    expireAfterSeconds: 24 * 60 * 60,
    partialFilterExpression: { userId: { $exists: false } },
  }
);

module.exports = mongoose.model('Diagnosis', diagnosisSchema);
