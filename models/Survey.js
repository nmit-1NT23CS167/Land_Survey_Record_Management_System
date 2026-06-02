const mongoose = require('mongoose');

const DocumentSchema = new mongoose.Schema({
  filename: String,
  original_name: String,
  mimetype: String,
  size: Number,
  uploaded_at: { type: Date, default: Date.now },
  uploaded_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
});

const AuditSchema = new mongoose.Schema({
  action: {
    type: String,
    enum: ['created', 'updated', 'deleted', 'viewed', 'exported'],
    required: true,
  },
  performed_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  performed_by_name: String,
  timestamp: { type: Date, default: Date.now },
  changes: { type: mongoose.Schema.Types.Mixed },
  ip_address: String,
});

const SurveySchema = new mongoose.Schema({
  // Identification
  plot_number: {
    type: String,
    required: [true, 'Plot number is required'],
    unique: true,
    trim: true,
    uppercase: true,
  },
  survey_number: {
    type: String,
    trim: true,
  },

  // Ownership
  owner_name: {
    type: String,
    required: [true, 'Owner name is required'],
    trim: true,
  },
  owner_contact: {
    type: String,
    trim: true,
  },
  owner_aadhaar: {
    type: String,
    trim: true,
  },

  // Land Details
  area: {
    type: String,
    required: [true, 'Area is required'],
  },
  area_unit: {
    type: String,
    enum: ['acres', 'hectares', 'sq_meters', 'sq_feet', 'guntha'],
    default: 'acres',
  },
  land_type: {
    type: String,
    enum: ['agricultural', 'residential', 'commercial', 'industrial', 'forest', 'waste', 'other'],
    default: 'agricultural',
  },
  land_use: {
    type: String,
    trim: true,
  },

  // Location
  lat: {
    type: String,
    required: [true, 'Latitude is required'],
  },
  lng: {
    type: String,
    required: [true, 'Longitude is required'],
  },
  address: {
    type: String,
    trim: true,
  },
  village: {
    type: String,
    trim: true,
  },
  taluka: {
    type: String,
    trim: true,
  },
  district: {
    type: String,
    trim: true,
  },
  state: {
    type: String,
    trim: true,
  },
  country: {
    type: String,
    trim: true,
    default: 'India',
  },
  pincode: {
    type: String,
    trim: true,
  },

  // Survey Details
  survey_date: {
    type: Date,
    required: [true, 'Survey date is required'],
  },
  registration_date: {
    type: Date,
  },
  last_verified_date: {
    type: Date,
  },

  // Status
  status: {
    type: String,
    enum: ['active', 'disputed', 'under_review', 'transferred', 'archived'],
    default: 'active',
  },
  remarks: {
    type: String,
    trim: true,
  },

  // Files
  ownership_proofs: [DocumentSchema],
  survey_images: [DocumentSchema],

  // Metadata
  created_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  created_by_name: String,
  updated_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  updated_by_name: String,
  audit_trail: [AuditSchema],

}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
});

// Indexes for fast search
//SurveySchema.index({ plot_number: 1 });
SurveySchema.index({ owner_name: 'text', address: 'text', village: 'text' });
SurveySchema.index({ state: 1, district: 1 });
SurveySchema.index({ survey_date: -1 });
SurveySchema.index({ status: 1 });

module.exports = mongoose.model('Survey', SurveySchema);
