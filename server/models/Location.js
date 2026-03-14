import mongoose from 'mongoose';

const locationSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  organization_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', default: null },
  name: { type: String },
  address_line1: { type: String, required: true }, // Updated
  address_line2: { type: String }, // Added
  address: { type: String }, // Keep for backward compatibility
  area: { type: String },
  city: { type: String, required: true },
  state: { type: String, required: true },
  postal_code: { type: String }, // Added
  country: { type: String, default: 'India' },
  latitude: { type: Number }, // Added
  longitude: { type: Number }, // Added
  location_type: { type: String, enum: ['residential', 'commercial', 'industrial'] }, // Updated
  site_type: { type: String }, // Keep for backward compatibility
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
}, {
  timestamps: true
});

locationSchema.index({ user_id: 1 });
locationSchema.index({ organization_id: 1 });

export const Location = mongoose.model('Location', locationSchema);
