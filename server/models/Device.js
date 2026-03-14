import mongoose from 'mongoose';

const deviceSchema = new mongoose.Schema({
  device_serial: { type: String, required: true, unique: true },
  location_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Location', required: true },
  device_type: { type: String, enum: ['smart_meter', 'solar_inverter', 'battery_system'], required: true },
  status: { type: String, enum: ['online', 'offline', 'error'], default: 'online' },
  firmware_version: { type: String }, // Added
  installed_at: { type: Date, default: Date.now },
  last_seen: { type: Date, default: Date.now }, // Added
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
}, {
  timestamps: true
});

deviceSchema.index({ location_id: 1 });
deviceSchema.index({ status: 1 });
deviceSchema.index({ device_serial: 1 });

export const Device = mongoose.model('Device', deviceSchema);
