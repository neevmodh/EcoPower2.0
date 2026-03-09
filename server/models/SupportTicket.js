import mongoose from 'mongoose';

const supportTicketSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    userId: { type: String, required: true },
    subject: { type: String, required: true },
    description: { type: String, required: true },
    status: { type: String, required: true, default: 'open' },
    priority: { type: String, required: true, default: 'medium' },
    category: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

export const SupportTicket = mongoose.model('SupportTicket', supportTicketSchema);
