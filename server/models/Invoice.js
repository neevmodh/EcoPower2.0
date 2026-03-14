import mongoose from 'mongoose';

const invoiceSchema = new mongoose.Schema({
  subscription_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Subscription', required: true },
  billing_period: { type: String, required: true }, // e.g., "Feb 2026"
  billing_period_start: { type: Date },
  billing_period_end: { type: Date },
  due_date: { type: Date },
  energy_used_kwh: { type: Number, required: true },
  base_amount: { type: Number, required: true }, // Added
  tax: { type: Number, required: true },
  discount: { type: Number, default: 0 }, // Added
  total_amount: { type: Number, required: true },
  status: { type: String, enum: ['paid', 'pending', 'overdue', 'cancelled'], default: 'pending' },
  payment_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Payment' }, // Added
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
}, {
  timestamps: true
});

// Index for faster queries
invoiceSchema.index({ subscription_id: 1 });
invoiceSchema.index({ status: 1 });
invoiceSchema.index({ due_date: 1 });

export const Invoice = mongoose.model('Invoice', invoiceSchema);
