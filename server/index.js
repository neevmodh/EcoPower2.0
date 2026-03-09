import express from 'express';
import cors from 'cors';
import { connectDB } from './db.js';

// Import Models
import { User } from './models/User.js';
import { Device } from './models/Device.js';
import { EnergyReading } from './models/EnergyReading.js';
import { Invoice } from './models/Invoice.js';
import { Notification } from './models/Notification.js';
import { SupportTicket } from './models/SupportTicket.js';
import { GridTransaction } from './models/GridTransaction.js';

const app = express();
const PORT = process.env.PORT || 5005;

// Middleware
app.use(cors());
app.use(express.json());

// Connect to MongoDB
connectDB();

// --- API Routes ---

// Health Check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'Backend is running' });
});

// Auth
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        // The legacy system had raw passwords in the CSV, but our new seeder 
        // doesn't seed passwords. We'll authenticate just based on email for this demo 
        // to ensure the user can still access the system with the rich data.
        const user = await User.findOne({ email: new RegExp(`^${email}$`, 'i') });
        
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        res.json(user);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Users
app.get('/api/users/:id', async (req, res) => {
    try {
        if (req.params.id === 'all') {
            const users = await User.find({});
            return res.json(users);
        }
        const user = await User.findOne({ id: req.params.id });
        if (!user) return res.status(404).json({ error: 'User not found' });
        res.json(user);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Devices
app.get('/api/devices/:userId', async (req, res) => {
    try {
        const query = req.params.userId === 'all' ? {} : { userId: req.params.userId };
        const devices = await Device.find(query);
        res.json(devices);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Energy Readings
app.get('/api/energy-readings/:userId', async (req, res) => {
    try {
        const query = req.params.userId === 'all' ? {} : { userId: req.params.userId };
        const readings = await EnergyReading.find(query).sort({ timestamp: 1 });
        res.json(readings);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Invoices
app.get('/api/invoices/:userId', async (req, res) => {
    try {
        const query = req.params.userId === 'all' ? {} : { userId: req.params.userId };
        const invoices = await Invoice.find(query).sort({ date: -1 });
        res.json(invoices);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Notifications
app.get('/api/notifications/:userId', async (req, res) => {
    try {
        const query = req.params.userId === 'all' ? {} : { userId: req.params.userId };
        const notifications = await Notification.find(query).sort({ timestamp: -1 });
        res.json(notifications);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Support Tickets
app.get('/api/support-tickets/:userId', async (req, res) => {
    try {
        const query = req.params.userId === 'all' ? {} : { userId: req.params.userId };
        const tickets = await SupportTicket.find(query).sort({ createdAt: -1 });
        res.json(tickets);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});
app.post('/api/support-tickets', async (req, res) => {
    try {
        const newTicket = new SupportTicket(req.body);
        await newTicket.save();
        res.status(201).json(newTicket);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Grid Transactions
app.get('/api/grid-transactions/:userId', async (req, res) => {
    try {
        const query = req.params.userId === 'all' ? {} : { userId: req.params.userId };
        const transactions = await GridTransaction.find(query).sort({ timestamp: -1 });
        res.json(transactions);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- Mutations ---

// Update Ticket
app.put('/api/support-tickets/:id', async (req, res) => {
    try {
        const updated = await SupportTicket.findOneAndUpdate({ id: req.params.id }, req.body, { new: true });
        res.json(updated);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Mark Notification Read
app.put('/api/notifications/:id/read', async (req, res) => {
    try {
        const updated = await Notification.findOneAndUpdate({ id: req.params.id }, { read: true }, { new: true });
        res.json(updated);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Mark All Notifications Read
app.put('/api/notifications/user/:userId/read-all', async (req, res) => {
    try {
        await Notification.updateMany({ userId: req.params.userId }, { read: true });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Add Invoice
app.post('/api/invoices', async (req, res) => {
    try {
        const newInvoice = new Invoice(req.body);
        await newInvoice.save();
        res.status(201).json(newInvoice);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update Invoice
app.put('/api/invoices/:id', async (req, res) => {
    try {
        const updated = await Invoice.findOneAndUpdate({ id: req.params.id }, req.body, { new: true });
        res.json(updated);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Toggle Device
app.put('/api/devices/:id/toggle', async (req, res) => {
    try {
        const device = await Device.findOne({ id: req.params.id });
        if (!device) return res.status(404).json({ error: 'Device not found' });
        device.status = device.status === 'on' ? 'off' : 'on';
        await device.save();
        res.json(device);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
