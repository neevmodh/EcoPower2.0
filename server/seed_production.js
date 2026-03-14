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
import { SystemLog } from './models/SystemLog.js';
import { DeviceLog } from './models/DeviceLog.js';
import { AuditLog } from './models/AuditLog.js';
import { GridTransaction } from './models/GridTransaction.js';
import { EnergyForecast } from './models/EnergyForecast.js';

dotenv.config({ path: '.env.local' });

const MONGO_URI = process.env.MONGODB_URI;

// Batch configuration
const BATCH_SIZE = 50000;
const TOTAL_RECORDS_TARGET = 1000000;

// Helper array for generating fake data
const names = ['Aarav', 'Vihaan', 'Vivaan', 'Ananya', 'Diya', 'Advik', 'Kabir', 'Anaya', 'Aarohi', 'Shruti', 'Meera', 'Rohan', 'Karan', 'Priya', 'Neha', 'Amit', 'Sneha', 'Raj', 'Sonia', 'Nikhil'];
const surnames = ['Patel', 'Sharma', 'Singh', 'Desai', 'Joshi', 'Chauhan', 'Mehta', 'Shah', 'Modi', 'Iyer', 'Bhatt', 'Kapoor'];
const cities = ['Ahmedabad', 'Surat', 'Vadodara', 'Rajkot', 'Bhavnagar', 'Jamnagar', 'Gandhinagar'];
const orgNames = ['Tech Solutions', 'Global Logistics', 'Sunrise Manufacturing', 'Nexus Corp', 'Apex Industries', 'Pinnacle Systems'];

async function seed() {
  try {
    console.log('🌱 Connecting to MongoDB Atlas [eaas_platform]...');
    await mongoose.connect(MONGO_URI, { dbName: 'eaas_platform' });

    console.log('🧹 Clearing old data...');
    const collections = [User, Organization, Location, EnergyPlan, Subscription, Device, EnergyReading, Invoice, Payment, CarbonStat, SupportTicket, Notification, SystemLog, DeviceLog, AuditLog, GridTransaction, EnergyForecast];
    for (const Model of collections) {
      try { await Model.collection.drop(); } catch (e) {}
    }

    console.log('⚡ Ensuring optimized indexes...');
    await User.createIndexes();
    await Location.createIndexes();
    await Device.createIndexes();

    // -------------- 1. PLANS --------------
    console.log('📦 Creating Energy Plans...');
    const planBasic = await EnergyPlan.create({
      plan_name: 'Solar Basic', description: '3kW solar system for small homes.', price_per_month: 1499, max_kwh: 400, solar_capacity_kw: 3, battery_included: false
    });
    const planPremium = await EnergyPlan.create({
      plan_name: 'Solar Premium', description: 'Solar + Battery Backup for total independence.', price_per_month: 2999, max_kwh: 800, solar_capacity_kw: 5, battery_included: true
    });
    const planPro = await EnergyPlan.create({
      plan_name: 'Solar Pro', description: 'Full backup and maximum efficiency.', price_per_month: 4999, max_kwh: 1500, solar_capacity_kw: 10, battery_included: true
    });
    const planEnterprise = await EnergyPlan.create({
      plan_name: 'Enterprise Grade', description: 'Multi-site heavy industrial solar coverage.', price_per_month: 25000, max_kwh: 20000, solar_capacity_kw: 100, battery_included: true
    });

    const consumerPlans = [planBasic, planPremium, planPro];

    // -------------- 2. ORGANIZATIONS --------------
    console.log('🏢 Generating 50 Organizations...');
    const orgs = [];
    for(let i=0; i<50; i++) {
        orgs.push({
            organization_name: `${orgNames[i % orgNames.length]} ${i}`,
            industry: i % 2 === 0 ? 'Manufacturing' : 'Logistics',
            contact_email: `admin${i}@org${i}.com`
        });
    }
    const createdOrgs = await Organization.insertMany(orgs);

    // -------------- 3. USERS --------------
    console.log('👥 Generating 1,000 Users...');
    const salt = await bcrypt.genSalt(10);
    const passHash = await bcrypt.hash('admin@123', salt);

    const admin = await User.create({
      name: 'Neev Modh', email: 'admin@instinct.com', password_hash: passHash, phone: '+91 9876543210', role: 'admin', status: 'active'
    });

    const enterpriseUsers = [];
    for(let i=0; i<50; i++) {
        enterpriseUsers.push({
            name: `${names[i % names.length]} ${surnames[i % surnames.length]}`,
            email: i === 0 ? 'vikram@abc.com' : `ent${i}@example.com`,
            password_hash: passHash,
            role: 'enterprise',
            organization_id: createdOrgs[i]._id,
            status: 'active'
        });
    }
    const createdEntUsers = await User.insertMany(enterpriseUsers);

    const consumerUsers = [];
    for(let i=0; i<1000; i++) {
        consumerUsers.push({
            name: `${names[i % names.length]} ${surnames[i % surnames.length]}`,
            email: i === 0 ? 'rahul.sharma@gmail.com' : `consumer${i}@example.com`,
            password_hash: passHash,
            phone: `+91 ${Math.floor(1000000000 + Math.random() * 9000000000)}`,
            role: 'consumer',
            status: 'active'
        });
    }
    const createdConUsers = await User.insertMany(consumerUsers);

    // -------------- 4. LOCATIONS & SUBS (optimized with insertMany) --------------
    console.log('📍 Plotting 2,000+ Locations & IoT Device Fleet (Turbo Mode)...');
    
    const locationsToInsert = [];
    const subscriptionsToInsert = [];
    const devicesToInsert = [];

    // Consumer data
    for(const u of createdConUsers) {
        const locId = new mongoose.Types.ObjectId();
        locationsToInsert.push({
            _id: locId, user_id: u._id, address: `Street ${Math.floor(Math.random()*1000)}, Ahmedabad`,
            city: 'Ahmedabad', state: 'Gujarat'
        });
        const plan = consumerPlans[Math.floor(Math.random()*consumerPlans.length)];
        subscriptionsToInsert.push({ user_id: u._id, plan_id: plan._id, location_id: locId, billing_cycle: 'monthly' });
        devicesToInsert.push({ device_serial: `SMT-CON-${u._id.toString().substr(-5)}`, location_id: locId, device_type: 'smart_meter' });
    }

    // Enterprise data
    for(const u of createdEntUsers) {
        for(let j=0; j<4; j++) {
            const locId = new mongoose.Types.ObjectId();
            locationsToInsert.push({
                _id: locId, user_id: u._id, organization_id: u.organization_id,
                address: `Industrial Area ${j}, Surat`, city: 'Surat', state: 'Gujarat'
            });
            subscriptionsToInsert.push({ user_id: u._id, plan_id: planEnterprise._id, location_id: locId, billing_cycle: 'monthly' });
            devicesToInsert.push({ device_serial: `SMT-ENT-${u._id.toString().substr(-5)}-${j}`, location_id: locId, device_type: 'smart_meter' });
        }
    }

    await Location.insertMany(locationsToInsert);
    await Subscription.insertMany(subscriptionsToInsert);
    const createdDevices = await Device.insertMany(devicesToInsert);

    // -------------- 5. TELEMETRY (THE BIG ONE) --------------
    console.log(`📈 Generating ${TOTAL_RECORDS_TARGET.toLocaleString()} Telemetry Records in batches...`);
    const startTime = Date.now();
    let recordsGenerated = 0;
    
    const days = 30;
    const today = new Date();
    today.setHours(0,0,0,0);

    while (recordsGenerated < TOTAL_RECORDS_TARGET) {
        const batch = [];
        const currentBatchSize = Math.min(BATCH_SIZE, TOTAL_RECORDS_TARGET - recordsGenerated);
        
        for (let i = 0; i < currentBatchSize; i++) {
            const dev = createdDevices[Math.floor(Math.random() * createdDevices.length)];
            const ts = new Date(today.getTime() - (Math.random() * days * 24 * 3600000));
            const hour = ts.getHours();
            
            const solarMult = hour >= 7 && hour <= 18 ? Math.max(0, 1 - Math.pow((hour - 13) / 6, 2)) : 0;
            const gen = Number((solarMult * 10 * (0.8 + Math.random()*0.4)).toFixed(2));
            const cons = hour >= 18 && hour <= 23 ? 8 + Math.random() * 5 : 2 + Math.random() * 3;

            batch.push({
                device_id: dev._id,
                timestamp: ts,
                energy_generated_kwh: gen,
                energy_consumed_kwh: cons,
                grid_usage_kwh: Math.max(0, cons - gen),
                battery_soc: 40 + Math.random() * 60
            });
        }
        
        await EnergyReading.insertMany(batch, { ordered: false });
        recordsGenerated += currentBatchSize;
        console.log(`   Processed ${recordsGenerated.toLocaleString()} / ${TOTAL_RECORDS_TARGET.toLocaleString()} records...`);
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`✅ Telemetry Generation Complete in ${duration}s!`);

    // -------------- 6. NOTIFICATIONS & WINNING DATA --------------
    console.log('🏆 Seeding Demo "Winning Features" data...');
    const rahul = await User.findOne({ email: 'rahul.sharma@gmail.com' });
    const vikram = await User.findOne({ email: 'vikram@abc.com' });

    if (rahul) {
        await Notification.create({ user_id: rahul._id, title: 'AI Energy Advisor', message: '💡 Optimize power: Run appliances at 1 PM today for zero cost.', type: 'info' });
        const rahulSub = await Subscription.findOne({ user_id: rahul._id });
        if (rahulSub) {
            await CarbonStat.create({ subscription_id: rahulSub._id, carbon_saved_kg: 1250, trees_equivalent: 45 });
        }
    }

    if (vikram) {
        await Notification.create({ user_id: vikram._id, title: 'Peak Demand AI', message: '⚠ Industrial Load Spike Alert: Current load 438 kW exceeds threshold.', type: 'alert' });
    }

    await SystemLog.create({ service: 'seeder', level: 'INFO', message: `Millions Scaled Seeding Complete: ${TOTAL_RECORDS_TARGET} readings.` });

    console.log('\n🚀 SYSTEM READY FOR MILLIONS. PROCEED TO DASHBOARD CHECK.');
    process.exit(0);
  } catch (err) {
    console.error('❌ SEED ERROR:', err);
    process.exit(1);
  }
}

seed();
