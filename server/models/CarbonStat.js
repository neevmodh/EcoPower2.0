import mongoose from 'mongoose';

const carbonStatSchema = new mongoose.Schema({
  subscription_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Subscription', required: true },
  carbon_saved_kg: { type: Number, default: 0 },
  trees_equivalent: { type: Number, default: 0 },
  calculated_at: { type: Date, default: Date.now }
});

export const CarbonStat = mongoose.model('CarbonStat', carbonStatSchema);
