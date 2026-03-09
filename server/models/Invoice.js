import mongoose from 'mongoose';

const invoiceSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    userId: { type: String, required: true },
    date: { type: Date, required: true },
    dueDate: { type: Date, required: true },
    amount: { type: Number, required: true },
    status: { type: String, required: true },
    energyConsumed: { type: Number },
    energyProduced: { type: Number },
    gridImport: { type: Number },
    gridExport: { type: Number },
    baseRate: { type: Number },
});

export const Invoice = mongoose.model('Invoice', invoiceSchema);
