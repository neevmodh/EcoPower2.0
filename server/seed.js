import mongoose from 'mongoose';
import { connectDB } from './db.js';
import { User } from './models/User.js';
import { Device } from './models/Device.js';
import { EnergyReading } from './models/EnergyReading.js';
import { Invoice } from './models/Invoice.js';
import { Notification } from './models/Notification.js';
import { SupportTicket } from './models/SupportTicket.js';
import { GridTransaction } from './models/GridTransaction.js';
import { subDays, addDays, startOfDay, format } from 'date-fns';

const USERS = [
    {
        id: 'USR001',
        name: 'Neev Modh',
        email: 'neevmodh205@gmail.com',
        role: 'admin',
        company: 'EcoPower Headquarters',
        phone: '+91 9876543210',
        walletBalance: 1250.50,
        plan: 'enterprise'
    },
    {
        id: 'USR002',
        name: 'Modh Industries',
        email: 'modh4001@gmail.com',
        role: 'user',
        company: 'Modh Manufacturing (East Dept)',
        phone: '+91 9876543211',
        walletBalance: 450.50,
        plan: 'premium'
    },
    {
        id: 'USR003',
        name: 'Demo Client',
        email: 'demo@ecopower.in',
        role: 'user',
        company: 'EcoPower Demos',
        phone: '+91 9876543212',
        walletBalance: 875.25,
        plan: 'standard'
    }
];

const DEVICE_TYPES = ['Solar Panel', 'Inverter', 'Battery Storage', 'Smart Meter', 'Wind Turbine', 'EV Charger'];
const DEPARTMENTS = ['Main HQ', 'R&D', 'Production Plant', 'Warehouse', 'Operations Deck', 'Loading Dock'];

const generateDevices = (userId) => {
    const devices = [];
    let count = 0;
    for (let i = 0; i < 6; i++) {
        count++;
        devices.push({
            id: `DEV_${userId}_${count.toString().padStart(3, '0')}`,
            userId,
            name: `${DEVICE_TYPES[i % DEVICE_TYPES.length]} - ${DEPARTMENTS[i % DEPARTMENTS.length]}`,
            type: DEVICE_TYPES[i % DEVICE_TYPES.length],
            status: Math.random() > 0.1 ? 'online' : 'maintenance',
            capacity: Math.floor(Math.random() * 50) + 10,
            location: DEPARTMENTS[i % DEPARTMENTS.length],
            firmwareVersion: `v${Math.floor(Math.random() * 3 + 1)}.${Math.floor(Math.random() * 10)}.0`,
            installedAt: subDays(new Date(), Math.floor(Math.random() * 500) + 100),
            lastMaintenance: subDays(new Date(), Math.floor(Math.random() * 30) + 1),
            nextMaintenance: addDays(new Date(), Math.floor(Math.random() * 60) + 10),
        });
    }
    return devices;
};

const generateEnergyReadings = (userId) => {
    const readings = [];
    const now = new Date();
    // Generate hourly data for the past 30 days
    for (let i = 30 * 24; i >= 0; i--) {
        const time = new Date(now.getTime() - i * 60 * 60 * 1000);
        const hour = time.getHours();
        
        let production = 0.5 + Math.random();
        // Bell curve for solar production during the day (6 AM to 6 PM)
        if (hour >= 6 && hour <= 18) {
            production = Math.max(0.5, Math.sin(((hour - 6) / 12) * Math.PI) * (Math.random() * 20 + 30));
        }

        const consumption = Math.random() * 15 + 10 + (hour >= 9 && hour <= 17 ? 20 : 0.5); // Higher during work hours
        const diff = production - consumption;
        
        let gridImport = 0.1;
        let gridExport = 0.1;
        if (diff > 0) {
            gridExport = Math.max(0.1, diff * 0.8); // Store 20%, export 80%
        } else {
            gridImport = Math.max(0.1, Math.abs(diff));
        }

        readings.push({
            userId,
            timestamp: time,
            production: Number(Math.max(0.1, production).toFixed(2)),
            consumption: Number(Math.max(0.1, consumption).toFixed(2)),
            gridExport: Number(Math.max(0.1, gridExport).toFixed(2)),
            gridImport: Number(Math.max(0.1, gridImport).toFixed(2)),
            batteryLevel: Number(Math.max(0.1, 50 + Math.sin(i / 24) * 20).toFixed(2)) // Simulated oscillating battery level
        });
    }
    return readings;
};

const generateInvoices = (userId) => {
    const invoices = [];
    for (let i = 0; i < 6; i++) {
        const date = subDays(new Date(), i * 30);
        invoices.push({
            id: `INV_${userId}_${i+1}`,
            userId,
            date,
            dueDate: addDays(date, 15),
            amount: Math.floor(Math.random() * 500) + 100,
            status: i === 0 ? 'unpaid' : 'paid',
            energyConsumed: Math.floor(Math.random() * 1000) + 500,
            energyProduced: Math.floor(Math.random() * 800) + 200,
            baseRate: 0.12
        });
    }
    return invoices;
};

const generateNotifications = (userId) => {
    const notifications = [];
    const types = ['alert', 'info', 'warning', 'success'];
    for (let i = 0; i < 10; i++) {
        notifications.push({
            id: `NOTIF_${userId}_${i+1}`,
            userId,
            title: `System Update ${i+1}`,
            message: `This is an automated system notification for your devices in ${DEPARTMENTS[Math.floor(Math.random()*DEPARTMENTS.length)]}.`,
            type: types[Math.floor(Math.random() * types.length)],
            read: Math.random() > 0.5,
            timestamp: subDays(new Date(), Math.floor(Math.random() * 30))
        });
    }
    return notifications;
};

const generateTickets = (userId) => {
    const tickets = [];
    const categories = ['Hardware', 'Software', 'Billing', 'General'];
    const statuses = ['open', 'in_progress', 'resolved', 'closed'];
    for (let i = 0; i < 5; i++) {
        tickets.push({
            id: `TKT_${userId}_${i+1}`,
            userId,
            subject: `Issue with ${DEVICE_TYPES[i % DEVICE_TYPES.length]} at ${DEPARTMENTS[i % DEPARTMENTS.length]}`,
            description: `Experiencing anomalous readings and intermittent connectivity drops. Needs inspection.`,
            status: statuses[Math.floor(Math.random() * statuses.length)],
            priority: Math.random() > 0.7 ? 'high' : 'medium',
            category: categories[Math.floor(Math.random() * categories.length)],
            createdAt: subDays(new Date(), Math.floor(Math.random() * 60)),
            updatedAt: subDays(new Date(), Math.floor(Math.random() * 10))
        });
    }
    return tickets;
};

const generateTransactions = (userId) => {
    const txs = [];
    for (let i = 0; i < 15; i++) {
        const type = Math.random() > 0.5 ? 'import' : 'export';
        const amount = Math.floor(Math.random() * 200) + 50;
        const rate = type === 'import' ? 0.15 : 0.08;
        txs.push({
            id: `TX_${userId}_${i+1}`,
            userId,
            timestamp: subDays(new Date(), i * 2),
            type,
            amount,
            rate,
            totalCost: amount * rate,
            status: 'completed'
        });
    }
    return txs;
};

const runSeeder = async () => {
    await connectDB();
    console.log('Clearing existing data...');
    await User.deleteMany();
    await Device.deleteMany();
    await EnergyReading.deleteMany();
    await Invoice.deleteMany();
    await Notification.deleteMany();
    await SupportTicket.deleteMany();
    await GridTransaction.deleteMany();
    console.log('Data cleared.');

    console.log('Seeding rich data for users, departments, and devices...');
    
    for (const user of USERS) {
        // Insert User
        await User.create(user);
        
        // Insert Devices
        const devices = generateDevices(user.id);
        await Device.insertMany(devices);
        
        // Insert Energy Readings
        const readings = generateEnergyReadings(user.id);
        // split readings into chunks to avoid too big payload
        const chunkSize = 500;
        for (let i = 0; i < readings.length; i += chunkSize) {
            await EnergyReading.insertMany(readings.slice(i, i + chunkSize));
        }
        
        // Insert Invoices
        const invoices = generateInvoices(user.id);
        await Invoice.insertMany(invoices);
        
        // Insert Notifications
        const notifs = generateNotifications(user.id);
        await Notification.insertMany(notifs);
        
        // Insert Support Tickets
        const tickets = generateTickets(user.id);
        await SupportTicket.insertMany(tickets);
        
        // Insert Grid Transactions
        const txs = generateTransactions(user.id);
        await GridTransaction.insertMany(txs);
        
        console.log(`Seeded fully rich data for ${user.id} (${user.name}) with departments and devices.`);
    }

    console.log('Seeding complete!');
    process.exit(0);
};

runSeeder().catch(err => {
    console.error(err);
    process.exit(1);
});
