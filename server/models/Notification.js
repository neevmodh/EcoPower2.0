import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, enum: ['usage_alert', 'maintenance_alert', 'system_alert', 'billing_alert', 'alert', 'info', 'warning', 'success', 'payment_success', 'payment_failed'], required: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  priority: { type: String, enum: ['low', 'medium', 'high', 'critical'], default: 'medium' }, // Added
  read: { type: Boolean, default: false }, // Updated field name
  is_read: { type: Boolean, default: false }, // Keep for backward compatibility
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
}, {
  timestamps: true
});

// Indexes
notificationSchema.index({ user_id: 1, read: 1 });
notificationSchema.index({ created_at: -1 });

export const Notification = mongoose.model('Notification', notificationSchema);
