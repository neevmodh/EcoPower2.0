import mongoose from 'mongoose';

const subscriptionSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  plan_id: { type: mongoose.Schema.Types.ObjectId, ref: 'EnergyPlan', required: true },
  location_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Location', required: true },
  status: { type: String, enum: ['active', 'paused', 'cancelled'], default: 'active' },
  billing_cycle: { type: String, enum: ['monthly', 'yearly'], default: 'monthly' },
  start_date: { type: Date, default: Date.now },
  end_date: { type: Date, default: null }
}, {
  timestamps: true
});

// Indexes for performance
subscriptionSchema.index({ user_id: 1 });
subscriptionSchema.index({ location_id: 1 });
subscriptionSchema.index({ status: 1 });
subscriptionSchema.index({ location_id: 1, status: 1 }); // Compound index for uniqueness check

export const Subscription = mongoose.model('Subscription', subscriptionSchema);
