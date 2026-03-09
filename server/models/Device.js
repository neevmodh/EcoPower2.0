import mongoose from 'mongoose';

const deviceSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    userId: { type: String, required: true },
    name: { type: String, required: true },
    type: { type: String, required: true },
    status: { type: String, default: 'offline' },
    capacity: { type: Number },
    location: { type: String },
    firmwareVersion: { type: String },
    lastMaintenance: { type: Date },
    nextMaintenance: { type: Date },
    installedAt: { type: Date, default: Date.now }
});

export const Device = mongoose.model('Device', deviceSchema);
