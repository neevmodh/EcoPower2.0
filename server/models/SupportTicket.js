import mongoose from 'mongoose';

const supportTicketSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  location_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Location' }, // Made optional
  subject: { type: String, required: true },
  description: { type: String, required: true },
  category: { type: String, enum: ['billing', 'technical', 'device', 'account', 'other'], default: 'other' }, // Updated
  issue_type: { type: String }, // Keep for backward compatibility
  priority: { type: String, enum: ['low', 'medium', 'high', 'critical'], default: 'medium' },
  status: { type: String, enum: ['open', 'in_progress', 'resolved', 'closed'], default: 'open' },
  assigned_to: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Added
  resolution: { type: String }, // Added
  resolved_at: { type: Date }, // Added
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
}, {
  timestamps: true
});

// Indexes
supportTicketSchema.index({ user_id: 1 });
supportTicketSchema.index({ status: 1 });
supportTicketSchema.index({ priority: 1 });

export const SupportTicket = mongoose.model('SupportTicket', supportTicketSchema);
