import mongoose from 'mongoose';

const organizationSchema = new mongoose.Schema({
  organization_name: { type: String, required: true },
  industry: { type: String },
  contact_email: { type: String, required: true },
  created_at: { type: Date, default: Date.now }
});

export const Organization = mongoose.model('Organization', organizationSchema);
