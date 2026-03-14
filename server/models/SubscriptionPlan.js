import mongoose from 'mongoose';

const subscriptionPlanSchema = new mongoose.Schema({
  planId: { type: String, required: true, unique: true },
  name: { type: String, required: true }, // 'Solar Basic', 'Solar Premium', 'Enterprise Fleet'
  description: { type: String },
  targetAudience: { type: String, enum: ['Consumer', 'Enterprise'], required: true },
  
  basePrice: { type: Number, required: true }, // Monthly INR
  includedSolarKw: { type: Number, required: true },
  includedBatteryKwh: { type: Number, default: 0 },
  
  features: [{ type: String }],
  isActive: { type: Boolean, default: true }
});

export const SubscriptionPlan = mongoose.model('SubscriptionPlan', subscriptionPlanSchema);
