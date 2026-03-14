import mongoose from 'mongoose';

const energyReadingSchema = new mongoose.Schema({
  device_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Device', required: true },
  timestamp: { type: Date, required: true },
  energy_generated_kwh: { type: Number, default: 0 },
  energy_consumed_kwh: { type: Number, default: 0 },
  grid_usage_kwh: { type: Number, default: 0 },
  battery_soc: { type: Number, default: 100 },
  voltage: { type: Number }, // Added
  current: { type: Number }, // Added
  power_factor: { type: Number }, // Added
  created_at: { type: Date, default: Date.now }
}, {
  timeseries: {
    timeField: 'timestamp',
    metaField: 'device_id',
    granularity: 'minutes'
  }
});

// Indexes for performance
energyReadingSchema.index({ device_id: 1, timestamp: -1 });
energyReadingSchema.index({ timestamp: -1 });

export const EnergyReading = mongoose.model('EnergyReading', energyReadingSchema);
