import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load models
import { User } from './models/User.js';
import { SubscriptionPlan } from './models/SubscriptionPlan.js';
import { Device } from './models/Device.js';
import { EnergyTelemetry } from './models/EnergyTelemetry.js';
import { Invoice } from './models/Invoice.js';
import { SupportTicket } from './models/SupportTicket.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

// Force the URI to target 'instinct' database specifically
const DB_URI = process.env.MONGODB_URI;

const runSeeder = async () => {
    if (!DB_URI) {
        console.error('ERROR: MONGODB_URI missing in .env.local');
        return process.exit(1);
    }
    
    try {
        console.log('Connecting to MongoDB specifically targeting "instinct" database...');
        await mongoose.connect(DB_URI, { dbName: 'instinct' });
        console.log('✅ Connected.');

        console.log('Clearing existing records...');
        await Promise.all([
            User.deleteMany({}),
            SubscriptionPlan.deleteMany({}),
            Device.deleteMany({}),
            EnergyTelemetry.deleteMany({}),
            Invoice.deleteMany({}),
            SupportTicket.deleteMany({})
        ]);

        console.log('Creating Highly Realistic Users...');
        const salt = await bcrypt.genSalt(10);
        
        // --- ADMIN ---
        const passAdmin = await bcrypt.hash('admin@123', salt);
        const admin = await User.create({
            userId: 'ADM-001',
            name: 'Neev Modh (SuperAdmin)',
            email: 'admin@instinct.com',
            passwordHash: passAdmin,
            role: 'Admin',
            companyName: 'Instinct Energy Corp',
        });

        // --- ENTERPRISE USER ---
        const passEnt = await bcrypt.hash('enterprise2026', salt);
        const enterprise = await User.create({
            userId: 'ENT-884',
            name: 'Vikram Singh',
            email: 'vikram@techpark.in',
            passwordHash: passEnt,
            role: 'Enterprise',
            companyName: 'TechPark Delta Solutions',
            walletBalance: 14500
        });

        // --- CONSUMER USER ---
        const passCon = await bcrypt.hash('consumer@pass', salt);
        const consumer = await User.create({
            userId: 'CON-902',
            name: 'Rahul Sharma',
            email: 'rahul.sharma@gmail.com',
            passwordHash: passCon,
            role: 'Consumer',
            walletBalance: 450
        });

        console.log('Creating Subscription Plans...');
        const planPro = await SubscriptionPlan.create({
            planId: 'PLAN-PRO',
            name: 'Solar Enterprise Pro',
            basePrice: 4999,
            includedKwh: 10000,
            features: ['24/7 Priority Support', 'Dedicated Account Manager', 'Advanced Anomaly Detection']
        });

        const planPremium = await SubscriptionPlan.create({
            planId: 'PLAN-PREM',
            name: 'Solar Residential Premium',
            basePrice: 999,
            includedKwh: 1500,
            features: ['Live Dashboard', 'Monthly AI Report', 'Email Support']
        });

        console.log('Deploying Virtual Devices...');
        const enterpriseDevices = await Device.insertMany([
            { deviceId: 'DEV-INV-ENT-1', ownerId: enterprise._id, type: 'Solar Inverter', capacity: 500, location: 'Tower A Roof', status: 'Online' },
            { deviceId: 'DEV-BAT-ENT-1', ownerId: enterprise._id, type: 'Battery', capacity: 200, location: 'Tower A Basement', status: 'Online' },
            { deviceId: 'DEV-MET-ENT-1', ownerId: enterprise._id, type: 'Smart Meter', capacity: 1000, location: 'Main Grid Connect', status: 'Online' }
        ]);

        const consumerDevices = await Device.insertMany([
            { deviceId: 'DEV-INV-CON-1', ownerId: consumer._id, type: 'Solar Inverter', capacity: 10, location: 'Residential Roof', status: 'Online' },
            { deviceId: 'DEV-MET-CON-1', ownerId: consumer._id, type: 'Smart Meter', capacity: 50, location: 'House Entrance', status: 'Online' }
        ]);

        console.log('Simulating High-Frequency Smart Meter Telemetry (30 Days)...');
        const telemetryData = [];
        const now = new Date();
        
        // Helper to generate bell-curve solar generation
        const generateSolar = (hour, maxCapacity) => {
            if (hour < 6 || hour > 18) return 0; // complete night
            const peakHour = 13; // 1 PM
            const bell = Math.exp(-Math.pow(hour - peakHour, 2) / 8); 
            // Add slight randomness for clouds (0.8 to 1.0 multiplier)
            const cloudFactor = 0.8 + (Math.random() * 0.2);
            return Number((maxCapacity * bell * cloudFactor).toFixed(2));
        };

        // Go back 30 days, generate hour by hour
        for(let daysAgo = 30; daysAgo >= 0; daysAgo--) {
            for(let hour = 0; hour < 24; hour++) {
                const ts = new Date(now.getTime() - (daysAgo * 24 * 60 * 60 * 1000));
                ts.setHours(hour, 0, 0, 0);

                // --- ENTERPRISE METRICS ---
                // Office runs 9 to 6 heavily
                const isWorkingHour = hour >= 9 && hour <= 18;
                const entCons = isWorkingHour ? (150 + Math.random() * 50) : (40 + Math.random() * 20);
                const entGen = generateSolar(hour, 450); // 500kW inverter cap
                
                let entGridImp = 0, entGridExp = 0;
                if(entCons > entGen) entGridImp = entCons - entGen;
                else entGridExp = entGen - entCons;

                telemetryData.push({
                    deviceId: enterpriseDevices[2]._id, // using smart meter
                    userId: enterprise._id,
                    timestamp: ts,
                    generationKwh: entGen,
                    consumptionKwh: entCons,
                    gridImportKwh: entGridImp,
                    gridExportKwh: entGridExp,
                    batterySocPercentage: isWorkingHour ? 40 : 90 // dummy curve
                });

                // --- CONSUMER METRICS ---
                // House runs evening heavily
                const isEvening = hour >= 18 && hour <= 23;
                const conCons = isEvening ? (8 + Math.random() * 4) : (2 + Math.random() * 3);
                const conGen = generateSolar(hour, 8); // 10kW inverter cap
                
                let conGridImp = 0, conGridExp = 0;
                if(conCons > conGen) conGridImp = conCons - conGen;
                else conGridExp = conGen - conCons;

                telemetryData.push({
                    deviceId: consumerDevices[1]._id, 
                    userId: consumer._id,
                    timestamp: ts,
                    generationKwh: conGen,
                    consumptionKwh: conCons,
                    gridImportKwh: conGridImp,
                    gridExportKwh: conGridExp,
                    batterySocPercentage: null
                });
            }
        }

        // Insert telemetry in chunks to not explode memory
        const chunkSize = 500;
        for(let i=0; i < telemetryData.length; i+= chunkSize) {
            await EnergyTelemetry.insertMany(telemetryData.slice(i, i+chunkSize));
        }

        console.log('Generating Invoices...');
        const lastMonth = new Date();
        lastMonth.setMonth(lastMonth.getMonth() - 1);
        
        await Invoice.insertMany([
            {
                invoiceId: 'INV-ENT-001',
                userId: enterprise._id,
                issueDate: lastMonth,
                dueDate: new Date(lastMonth.getTime() + (15 * 24 * 60 * 60 * 1000)),
                billingPeriodStart: new Date(lastMonth.getFullYear(), lastMonth.getMonth() - 1, 1),
                billingPeriodEnd: new Date(lastMonth.getFullYear(), lastMonth.getMonth(), 0),
                totalConsumptionKwh: 45000,
                totalGenerationKwh: 38000,
                subtotalAmount: planPro.basePrice + (7000 * 8), // assuming 8rs per kwh overage
                taxAmount: 5000,
                totalAmount: planPro.basePrice + (7000 * 8) + 5000,
                status: 'Paid'
            },
            {
                invoiceId: 'INV-CON-001',
                userId: consumer._id,
                issueDate: lastMonth,
                dueDate: new Date(lastMonth.getTime() + (15 * 24 * 60 * 60 * 1000)),
                billingPeriodStart: new Date(lastMonth.getFullYear(), lastMonth.getMonth() - 1, 1),
                billingPeriodEnd: new Date(lastMonth.getFullYear(), lastMonth.getMonth(), 0),
                totalConsumptionKwh: 450,
                totalGenerationKwh: 600,
                subtotalAmount: planPremium.basePrice, 
                taxAmount: Math.round(planPremium.basePrice * 0.18),
                totalAmount: Math.round(planPremium.basePrice * 1.18),
                status: 'Unpaid'
            }
        ]);


        console.log('Generating Support Tickets...');
        await SupportTicket.create({
            ticketId: 'TKT-2026-991',
            userId: enterprise._id,
            subject: 'Inverter Array B efficiency drop',
            category: 'Hardware',
            priority: 'High',
            status: 'Open',
            description: 'Noticing a 15% drop in conversion efficiency on inverter array B for the last 48 hours.'
        });

        console.log('✅ Seeding Complete. The "instinct" database is fully loaded with highly realistic EaaS data.');
        process.exit(0);
        

    } catch(err) {
        console.error(err);
        process.exit(1);
    }
}

runSeeder();
