import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    role: { type: String, default: 'user' },
    status: { type: String, default: 'active' },
    company: { type: String },
    phone: { type: String },
    createdAt: { type: Date, default: Date.now },
    walletBalance: { type: Number, default: 0 },
    plan: { type: String, default: 'standard' },
});

export const User = mongoose.model('User', userSchema);
