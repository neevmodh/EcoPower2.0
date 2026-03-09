import mongoose from 'mongoose';

const energyReadingSchema = new mongoose.Schema({
    userId: { type: String, required: true },
    deviceId: { type: String },
    timestamp: { type: Date, required: true },
    production: { type: Number, default: 0 },
    consumption: { type: Number, default: 0 },
    gridExport: { type: Number, default: 0 },
    gridImport: { type: Number, default: 0 },
    batteryCharge: { type: Number, default: 0 },
    batteryDischarge: { type: Number, default: 0 },
    batteryLevel: { type: Number, default: 0 }
});

export const EnergyReading = mongoose.model('EnergyReading', energyReadingSchema);
