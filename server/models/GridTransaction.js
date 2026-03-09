import mongoose from 'mongoose';

const gridTransactionSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    userId: { type: String, required: true },
    timestamp: { type: Date, required: true, default: Date.now },
    type: { type: String, required: true }, // 'import' or 'export'
    amount: { type: Number, required: true }, // kWh
    rate: { type: Number, required: true }, // $/kWh
    totalCost: { type: Number, required: true }, // $
    status: { type: String, default: 'completed' }
});

export const GridTransaction = mongoose.model('GridTransaction', gridTransactionSchema);
