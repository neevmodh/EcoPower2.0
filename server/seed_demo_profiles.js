import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';

import { User } from './models/User.js';
import { Organization } from './models/Organization.js';
import { Location } from './models/Location.js';
import { EnergyPlan } from './models/EnergyPlan.js';
import { Subscription } from './models/Subscription.js';
import { Device } from './models/Device.js';
import { EnergyReading } from './models/EnergyReading.js';
import { Invoice } from './models/Invoice.js';
import { Payment } from './models/Payment.js';
import { CarbonStat } from './models/CarbonStat.js';
import { SupportTicket } from './models/SupportTicket.js';
import { Notification } from './models/Notification.js';

dotenv.config({ path: '.env.local' });
const MONGO_URI = process.env.MONGODB_URI;

async function seedDemo() {
  try {
    console.log('🌱 Connecting to MongoDB Atlas...');
    await mongoose.connect(MONGO_URI, { dbName: 'eaas_platform' });

    const emails = ['admin@instinct.com', 'vikram@abc.com', 'rahul.sharma@gmail.com'];
    
    // 1. Ensure Users Exist (using same hash for demo: admin@123)
    const salt = await bcrypt.genSalt(10);
    const passHash = await bcrypt.hash('admin@123', salt);

    console.log('👤 Synchronizing Demo Users...');
    let admin = await User.findOne({ email: 'admin@instinct.com' });
    if (!admin) admin = await User.create({ name: 'System Admin', email: 'admin@instinct.com', password_hash: passHash, role: 'admin', status: 'active' });

    let enterprise = await User.findOne({ email: 'vikram@abc.com' });
    if (!enterprise) {
        let org = await Organization.findOne({ organization_name: 'Eco Industrial Corp' });
        if (!org) org = await Organization.create({ organization_name: 'Eco Industrial Corp', industry: 'Manufacturing', contact_email: 'vikram@abc.com' });
        enterprise = await User.create({ name: 'Vikram Singh', email: 'vikram@abc.com', password_hash: passHash, role: 'enterprise', organization_id: org._id, status: 'active' });
    }

    let consumer = await User.findOne({ email: 'rahul.sharma@gmail.com' });
    if (!consumer) consumer = await User.create({ name: 'Rahul Sharma', email: 'rahul.sharma@gmail.com', password_hash: passHash, role: 'consumer', phone: '+91 9988776655', status: 'active' });

    const demoUsers = [admin, enterprise, consumer];

    // 2. Setup Plans
    const plans = await EnergyPlan.find();
    const planBasic = plans.find(p => p.plan_name === 'Solar Basic');
    const planEnt = plans.find(p => p.plan_name === 'Enterprise Grade');

    // 3. Clear existing related data for these users to start fresh & clean
    const userIds = demoUsers.map(u => u._id);
    console.log('🧹 Cleaning old demo associations...');
    await Location.deleteMany({ user_id: { $in: userIds } });
    await Subscription.deleteMany({ user_id: { $in: userIds } });
    await SupportTicket.deleteMany({ user_id: { $in: userIds } });
    await Notification.deleteMany({ user_id: { $in: userIds } });
    await Device.deleteMany({ $or: [
        { device_serial: { $regex: /RAHUL/ } },
        { device_serial: { $regex: /MAX-ENT/ } }
    ]});

    // 4. Create Locations & Subscriptions
    console.log('📍 Re-planting Locations & IoT Assets...');
    
    // Consumer Location
    const rahulLoc = await Location.create({ user_id: consumer._id, address: 'B-402, Green Valley Apartments, Satellite', city: 'Ahmedabad', state: 'Gujarat', pincode: '380015' });
    await Subscription.create({ user_id: consumer._id, plan_id: planBasic._id, location_id: rahulLoc._id, status: 'active', start_date: new Date('2025-01-01') });
    const rahulMeter = await Device.create({ device_serial: 'SMT-CON-RAHUL-01', location_id: rahulLoc._id, device_type: 'smart_meter', status: 'online' });
    const rahulInv = await Device.create({ device_serial: 'INV-CON-RAHUL-01', location_id: rahulLoc._id, device_type: 'solar_inverter', status: 'online' });

    // Enterprise Locations (Multi-site)
    const sites = [
        { name: 'Surat Textile Factory', area: 'Pandesara GIDC', city: 'Surat' },
        { name: 'Vapi Chemical Unit', area: 'Vapi Industrial Estate', city: 'Vapi' },
        { name: 'Ahmedabad Logistics Hub', area: 'Sanand Industrial Area', city: 'Ahmedabad' }
    ];
    const entDevices = [];
    for (const s of sites) {
        const loc = await Location.create({ user_id: enterprise._id, organization_id: enterprise.organization_id, name: s.name, address: s.area, city: s.city, state: 'Gujarat' });
        await Subscription.create({ user_id: enterprise._id, plan_id: planEnt._id, location_id: loc._id, status: 'active', start_date: new Date('2025-01-01') });
        const dev = await Device.create({ device_serial: `MAX-ENT-${s.city.toUpperCase()}-01`, location_id: loc._id, device_type: 'smart_meter', status: 'online' });
        entDevices.push(dev);
    }

    // 5. Telemetry Generation (30 Days @ 1hr)
    console.log('📈 Injection of High-Fidelity Telemetry (30 Days)...');
    const telemetry = [];
    const today = new Date();
    today.setHours(0,0,0,0);
    
    const allDemoDevices = [rahulMeter, rahulInv, ...entDevices];
    const deviceIds = allDemoDevices.map(d => d._id);
    await EnergyReading.deleteMany({ device_id: { $in: deviceIds } });

    for (const dev of allDemoDevices) {
        const isEnterprise = dev.device_serial.includes('ENT');
        for (let d = 0; d < 30; d++) {
            for (let h = 0; h < 24; h++) {
                const ts = new Date(today.getTime() - (d * 86400000) + (h * 3600000));
                
                // Realistic Gen Pattern (Bell curve)
                const solarMult = h >= 7 && h <= 18 ? Math.max(0, 1 - Math.pow((h - 13) / 6, 2)) : 0;
                let gen = Number((solarMult * (isEnterprise ? 150 : 5) * (0.9 + Math.random()*0.2)).toFixed(2));
                
                // Realistic Consumption
                let cons = 0;
                if (isEnterprise) {
                    // Industrial load: peak during shift (9am-6pm)
                    cons = h >= 9 && h <= 18 ? 400 + Math.random()*100 : 80 + Math.random()*40;
                } else {
                    // Residential load: peak evening
                    cons = h >= 18 && h <= 23 ? 6 + Math.random()*3 : 1.5 + Math.random()*1.5;
                }

                telemetry.push({
                    device_id: dev._id,
                    timestamp: ts,
                    energy_generated_kwh: gen,
                    energy_consumed_kwh: cons,
                    grid_usage_kwh: Math.max(0, cons - gen),
                    battery_soc: 40 + Math.random() * 60
                });
            }
        }
    }
    await EnergyReading.insertMany(telemetry);

    // 6. 12 Months of Invoices
    console.log('💰 Generating 12-Month Financial History...');
    await Invoice.deleteMany({});
    
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    
    // Consumer Invoices
    const rahulSubs = await Subscription.find({ user_id: consumer._id });
    for (const sub of rahulSubs) {
        for (let i = 0; i < 12; i++) {
            const date = new Date(2025, i, 1);
            if (date > new Date()) continue;
            const amount = 1499 + (Math.random()*200);
            const tax = amount * 0.18;
            await Invoice.create({
                subscription_id: sub._id,
                billing_period: `${months[i]} 2025`,
                energy_used_kwh: 350 + Math.random()*50,
                amount: amount,
                tax: tax,
                total_amount: amount + tax,
                status: (i === today.getMonth() && today.getDate() < 10) ? 'pending' : 'paid',
                created_at: date
            });
        }
    }

    // Enterprise Invoices
    const vikySubs = await Subscription.find({ user_id: enterprise._id });
    for (const sub of vikySubs) {
        for (let i = 0; i < 12; i++) {
            const date = new Date(2025, i, 1);
            if (date > new Date()) continue;
            const amount = 25000 + (Math.random()*5000);
            const tax = amount * 0.18;
            await Invoice.create({
                subscription_id: sub._id,
                billing_period: `${months[i]} 2025`,
                energy_used_kwh: 15000 + Math.random()*2000,
                amount: amount,
                tax: tax,
                total_amount: amount + tax,
                status: (i === today.getMonth() && today.getDate() < 10) ? 'pending' : 'paid',
                created_at: date
            });
        }
    }

    // 7. Rich Notifications
    console.log('🔔 Seeding High-Engagement Notifications...');
    const notifs = [
        { u: consumer, t: 'AI Advisor', m: '💡 Solar production is peaked. Run your EV charger now to save ₹45 today.', type: 'info' },
        { u: consumer, t: 'Grid Alert', m: '⚠ Grid frequency fluctuating in Ahmedabad West. Switching to Battery backup.', type: 'warning' },
        { u: consumer, t: 'Bill Paid', m: '✅ Your February invoice of ₹1,642 was successfully paid.', type: 'success' },
        { u: enterprise, t: 'Peak Demand', m: '⚠ Industrial Load Spike: Vapi Factory hit 444 kW. Load balancing recommended.', type: 'alert' },
        { u: enterprise, t: 'ESG Milestone', m: '🌱 Corporate Goal: You have avoided 5,000kg of CO2 this month!', type: 'success' },
        { u: admin, t: 'System Health', m: '🚀 Infrastructure Scaling: Successfully provisioned 50 new IoT gateways.', type: 'info' }
    ];
    for (const n of notifs) {
        await Notification.create({ user_id: n.u._id, title: n.t, message: n.m, type: n.type, is_read: false });
    }

    // 8. Support Tickets
    console.log('🎫 Generating Support Ticket History...');
    const entLocs = await Location.find({ user_id: enterprise._id });
    const rahulLocs = await Location.find({ user_id: consumer._id });

    const tickets = [
        { u: consumer, l: rahulLocs[0], type: 'technical_fault', desc: 'Meter Display Flickering: The LCD on the SMT unit started flickering after the rains.', status: 'resolved' },
        { u: consumer, l: rahulLocs[0], type: 'technical_fault', desc: 'Battery Drain Alert: SoC drops 10% between 2am and 4am without load.', status: 'in_progress' },
        { u: enterprise, l: entLocs[0], type: 'billing_query', desc: 'API Access: Need developer credentials for industrial JSON feed portal.', status: 'open' }
    ];
    for (const t of tickets) {
        await SupportTicket.create({ 
            user_id: t.u._id, 
            location_id: t.l._id, 
            issue_type: t.type, 
            description: t.desc, 
            status: t.status 
        });
    }

    // 9. Carbon Stats
    console.log('🍃 Finalizing Sustainability Profiles...');
    await CarbonStat.deleteMany({});
    const rahulSub = await Subscription.findOne({ user_id: consumer._id });
    if (rahulSub) await CarbonStat.create({ subscription_id: rahulSub._id, total_carbon_saved_kg: 1250, total_trees_equivalent: 45 });
    
    const entSubs = await Subscription.find({ user_id: enterprise._id });
    for (const s of entSubs) {
        await CarbonStat.create({ subscription_id: s._id, total_carbon_saved_kg: 5400, total_trees_equivalent: 185 });
    }

    console.log('\n🌟 DEMO ACCOUNT SYNC COMPLETE 🌟');
    console.log('Accounts Ready:');
    console.log('- Admin: admin@instinct.com | admin@123');
    console.log('- Enterprise: vikram@abc.com | admin@123');
    console.log('- Consumer: rahul.sharma@gmail.com | admin@123');
    
    process.exit(0);
  } catch (err) {
    console.error('❌ SYNC ERROR:', err);
    process.exit(1);
  }
}

seedDemo();
