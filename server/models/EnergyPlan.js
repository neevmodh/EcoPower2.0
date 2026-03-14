import mongoose from 'mongoose';

const energyPlanSchema = new mongoose.Schema({
  plan_name: { type: String, required: true },
  description: { type: String },
  price_per_month: { type: Number, required: true },
  max_kwh: { type: Number },
  solar_capacity_kw: { type: Number },
  battery_included: { type: Boolean, default: false },
  created_at: { type: Date, default: Date.now }
});

export const EnergyPlan = mongoose.model('EnergyPlan', energyPlanSchema);
