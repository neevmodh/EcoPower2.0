import mongoose from 'mongoose';

const systemLogSchema = new mongoose.Schema({
  service: { type: String, required: true },
  level: { type: String, enum: ['INFO', 'WARNING', 'ERROR', 'CRITICAL'], required: true },
  message: { type: String, required: true },
  timestamp: { type: Date, required: true }
}, {
  timeseries: {
    timeField: 'timestamp',
    metaField: 'service',
    granularity: 'minutes'
  }
});

export const SystemLog = mongoose.model('SystemLog', systemLogSchema);
