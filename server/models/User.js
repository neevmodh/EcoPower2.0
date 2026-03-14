import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password_hash: { type: String, required: true },
  phone: { type: String },
  role: { type: String, enum: ['admin', 'consumer', 'enterprise'], required: true },
  organization_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', default: null },
  status: { type: String, enum: ['active', 'suspended', 'pending'], default: 'active' },
  created_at: { type: Date, default: Date.now }
});

userSchema.index({ organization_id: 1 });
userSchema.index({ status: 1 });

export const User = mongoose.model('User', userSchema);
