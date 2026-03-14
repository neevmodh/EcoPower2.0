import mongoose from 'mongoose';

const deviceLogSchema = new mongoose.Schema({
  device_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Device', required: true },
  event: { type: String, enum: ['device_online', 'device_offline', 'energy_spike', 'device_error'], required: true },
  timestamp: { type: Date, required: true }
}, {
  timeseries: {
    timeField: 'timestamp',
    metaField: 'device_id',
    granularity: 'minutes'
  }
});

export const DeviceLog = mongoose.model('DeviceLog', deviceLogSchema);
