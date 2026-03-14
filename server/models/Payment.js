import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema({
  invoice_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Invoice', required: true },
  amount: { type: Number, required: true },
  payment_method: { type: String, enum: ['upi', 'card', 'wallet', 'netbanking'], required: true },
  transaction_id: { type: String, required: true, unique: true },
  status: { type: String, enum: ['completed', 'failed', 'pending'], default: 'pending' },
  gateway_response: { type: mongoose.Schema.Types.Mixed },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
}, {
  timestamps: true
});

// Index for faster queries
paymentSchema.index({ invoice_id: 1 });
paymentSchema.index({ transaction_id: 1 });
paymentSchema.index({ status: 1 });

export const Payment = mongoose.model('Payment', paymentSchema);
