import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    userId: { type: String, required: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: { type: String, required: true },
    read: { type: Boolean, default: false },
    timestamp: { type: Date, default: Date.now },
    link: { type: String }
});

export const Notification = mongoose.model('Notification', notificationSchema);
