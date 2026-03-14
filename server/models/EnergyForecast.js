import mongoose from 'mongoose';

const energyForecastSchema = new mongoose.Schema({
  location_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Location', required: true },
  forecast_type: { type: String, enum: ['demand', 'generation'], required: true },
  timestamp: { type: Date, required: true },
  predicted_value_kwh: { type: Number, required: true },
  confidence_score: { type: Number, default: 0.85 },
  created_at: { type: Date, default: Date.now }
});

export const EnergyForecast = mongoose.model('EnergyForecast', energyForecastSchema);
