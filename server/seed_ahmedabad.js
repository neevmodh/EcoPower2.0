import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';

import { User } from './models/User.js';
import { Location } from './models/Location.js';
import { Device } from './models/Device.js';
import { EnergyReading } from './models/EnergyReading.js';
import { Invoice } from './models/Invoice.js';
import { SupportTicket } from './models/SupportTicket.js';
import { EnergyPlan } from './models/EnergyPlan.js';
import { Subscription } from './models/Subscription.js';
import { CarbonStat } from './models/CarbonStat.js';
import { Notification } from './models/Notification.js';

dotenv.config({ path: '.env.local' });

const MONGO_URI = process.env.MONGODB_URI;

async function seed() {
  try {
    console.log('🌱 Connecting to MongoDB Atlas...');
    await mongoose.connect(MONGO_URI, { dbName: 'eaas_platform' });
    console.log('✅ Connected.');

    console.log('🧹 Clearing old data and legacy indexes...');
    try { await User.collection.drop(); } catch (e) {}
    try { await Location.collection.drop(); } catch (e) {}
    try { await Device.collection.drop(); } catch (e) {}
    try { await EnergyReading.collection.drop(); } catch (e) {}
    try { await Invoice.collection.drop(); } catch (e) {}
    try { await SupportTicket.collection.drop(); } catch (e) {}
    try { await EnergyPlan.collection.drop(); } catch (e) {}
    try { await Subscription.collection.drop(); } catch (e) {}
    try { await CarbonStat.collection.drop(); } catch (e) {}
    try { await Notification.collection.drop(); } catch (e) {}

    // -------------- PLANS --------------
    console.log('📦 Creating Subscription Plans...');
    const planBasic = await EnergyPlan.create({
      plan_name: 'Home Basic', description: '5 kW Solar, Basic App Access, Grid Sync',
      price_per_month: 1499, max_kwh: 400, solar_capacity_kw: 5, battery_included: false
    });
    const planPremium = await EnergyPlan.create({
      plan_name: 'Home Premium', description: '10 kW Solar, 10 kWh Battery, Priority Support, Smart Load Sync',
      price_per_month: 2999, max_kwh: 800, solar_capacity_kw: 10, battery_included: true
    });
    const planEnterprise = await EnergyPlan.create({
      plan_name: 'Enterprise Fleet', description: 'Multi-Site Dashboard, Dedicated KAM, 100% Uptime SLA, Predictive Maintenance',
      price_per_month: 25000, max_kwh: 20000, solar_capacity_kw: 100, battery_included: true
    });

    // -------------- USERS --------------
    console.log('👥 Creating Users (Admin, Enterprise, Consumer)...');
    const salt = await bcrypt.genSalt(10);
    const passHash = await bcrypt.hash('admin@123', salt);

    const admin = await User.create({
      name: 'Neev Modh', email: 'admin@instinct.com',
      password_hash: passHash, role: 'admin', status: 'active', phone: '+91 9876543210'
    });

    const enterprise = await User.create({
      name: 'Vikram Desai', email: 'vikram@techpark.in',
      password_hash: passHash, role: 'enterprise', status: 'active',
      phone: '+91 9876543210'
    });

    const consumer = await User.create({
      name: 'Rahul Sharma', email: 'rahul.sharma@gmail.com',
      password_hash: passHash, role: 'consumer', status: 'active',
      phone: '+91 9988776655'
    });

    // -------------- LOCATIONS (Ahmedabad) --------------
    console.log('📍 Plotting Ahmedabad Locations...');
    
    // Enterprise Locations
    const locSG = await Location.create({
      user_id: enterprise._id, name: 'SG Highway HQ',
      address: 'Titanium Square, Thaltej, SG Highway', area: 'SG Highway',
      city: 'Ahmedabad', state: 'Gujarat', site_type: 'Office'
    });
    
    const locSanand = await Location.create({
      user_id: enterprise._id, name: 'Sanand Manufacturing Unit',
      address: 'GIDC Estate, Plot 45, Sanand', area: 'Sanand',
      city: 'Ahmedabad', state: 'Gujarat', site_type: 'Industrial'
    });

    // Consumer Location
    const locBopal = await Location.create({
      user_id: consumer._id, name: 'Orchid Heights Apt',
      address: 'Orchid Heights Apt, Tower B, Flat 402, South Bopal', area: 'South Bopal',
      city: 'Ahmedabad', state: 'Gujarat', site_type: 'Residential'
    });

    // -------------- SUBSCRIPTIONS --------------
    console.log('📋 Creating Subscriptions...');
    const subSG = await Subscription.create({
      user_id: enterprise._id, plan_id: planEnterprise._id, location_id: locSG._id, billing_cycle: 'monthly'
    });
    const subSanand = await Subscription.create({
      user_id: enterprise._id, plan_id: planEnterprise._id, location_id: locSanand._id, billing_cycle: 'monthly'
    });
    const subBopal = await Subscription.create({
      user_id: consumer._id, plan_id: planPremium._id, location_id: locBopal._id, billing_cycle: 'monthly'
    });

    // -------------- DEVICES --------------
    console.log('🔌 Installing Hardware...');
    const devices = await Device.insertMany([
      // SG Highway (Enterprise)
      { device_serial: 'INV-SG-01', location_id: locSG._id, device_type: 'solar_inverter', status: 'online' },
      { device_serial: 'BAT-SG-01', location_id: locSG._id, device_type: 'battery_system', status: 'online' },
      { device_serial: 'MET-SG-01', location_id: locSG._id, device_type: 'smart_meter', status: 'online' },
      
      // Sanand (Enterprise)
      { device_serial: 'INV-SAN-01', location_id: locSanand._id, device_type: 'solar_inverter', status: 'online' },
      
      // Bopal (Consumer)
      { device_serial: 'INV-BOP-01', location_id: locBopal._id, device_type: 'solar_inverter', status: 'online' },
      { device_serial: 'BAT-BOP-01', location_id: locBopal._id, device_type: 'battery_system', status: 'online' }
    ]);

    // -------------- TELEMETRY (Today's Curve) --------------
    console.log('📈 Generating Real-Time Telemetry Data for Ahmedabad...');
    const telemetryDocs = [];
    const today = new Date();
    today.setHours(0,0,0,0); // Start of today

    // Generate 24 hours of data, hourly points
    for (let hour = 0; hour < 24; hour++) {
      const ts = new Date(today);
      ts.setHours(hour);
      
      // Solar Curve Logic (Peak at 1 PM)
      let solarMult = 0;
      if (hour >= 7 && hour <= 18) {
         // rough bell curve peaking at 13 (1 PM)
         solarMult = Math.max(0, 1 - Math.pow((hour - 13) / 6, 2)); 
      }

      // Generate for each device
      devices.forEach(dev => {
        const isEnterprise = dev.device_serial.includes('ENT') || dev.device_serial.includes('SG') || dev.device_serial.includes('SAN');
        const cap = isEnterprise ? (dev.device_serial.includes('SAN') ? 150 : 50) : 10;
        
        let gen = Number((solarMult * cap * 0.8).toFixed(2)); // 80% efficiency max
        let cons = Number((cap * 0.3 + (Math.random() * cap * 0.2)).toFixed(2)); // Base load + variance
        
        // Night time for enterprise HQ might drop, Sanand stays flat
        if (dev.device_serial.includes('SG') && (hour < 8 || hour > 19)) cons = Number((cons * 0.2).toFixed(2));
        // Consumer peaks in evening
        if (!isEnterprise && hour >= 18 && hour <= 23) cons = Number((cons * 1.5).toFixed(2));

        telemetryDocs.push({
          device_id: dev._id,
          timestamp: ts,
          energy_generated_kwh: gen,
          energy_consumed_kwh: cons,
          grid_usage_kwh: Math.max(0, cons - gen),
          battery_soc: hour < 7 ? 40 : (hour < 16 ? 100 : 80)
        });
      });
    }
    await EnergyReading.insertMany(telemetryDocs);

    // -------------- INVOICES --------------
    console.log('🧾 Generating Ahmedabad Utility Bills...');
    const lastMonthStart = new Date(); lastMonthStart.setMonth(lastMonthStart.getMonth() - 1); lastMonthStart.setDate(1);
    const lastMonthEnd = new Date(); lastMonthEnd.setDate(0);
    const dueDate = new Date(); dueDate.setDate(dueDate.getDate() + 7);
    
    await Invoice.insertMany([
      {
        subscription_id: subSG._id, billing_period: 'Feb 2026',
        billing_period_start: lastMonthStart, billing_period_end: lastMonthEnd, due_date: dueDate,
        energy_used_kwh: 4500, base_amount: 25000, tax: 4500, discount: 0, total_amount: 29500,
        status: 'pending'
      },
      {
        subscription_id: subBopal._id, billing_period: 'Feb 2026',
        billing_period_start: lastMonthStart, billing_period_end: lastMonthEnd, due_date: dueDate,
        energy_used_kwh: 450, base_amount: 2999, tax: 540, discount: 0, total_amount: 3539,
        status: 'pending'
      }
    ]);

    // -------------- TICKETS --------------
    console.log('🎫 Logging Support Tickets...');
    await SupportTicket.insertMany([
      {
        user_id: enterprise._id, location_id: locSanand._id,
        subject: 'Dust accumulation causing efficiency drop', issue_type: 'maintenance',
        description: 'Sanand factory environment is dusty. Inverter Generation dropped by 12% over 2 weeks.',
        priority: 'medium', status: 'open'
      },
      {
        user_id: consumer._id, location_id: locBopal._id,
        subject: 'App not syncing data', issue_type: 'technical',
        description: 'Dashboard shows offline but inverter lights are green.',
        priority: 'low', status: 'resolved'
      }
    ]);

    // -------------- CARBON STATS --------------
    console.log('🌱 Calculating Carbon Impact...');
    await CarbonStat.insertMany([
      { subscription_id: subBopal._id, carbon_saved_kg: 1250, trees_equivalent: 45 },
      { subscription_id: subSG._id, carbon_saved_kg: 5800, trees_equivalent: 210 },
      { subscription_id: subSanand._id, carbon_saved_kg: 12400, trees_equivalent: 450 }
    ]);

    // -------------- NOTIFICATIONS --------------
    console.log('🔔 Creating Notifications...');
    await Notification.insertMany([
      {
        user_id: consumer._id, title: 'AI Energy Advisor', type: 'info',
        message: '💡 Optimize power: Run appliances at 1 PM today for zero cost.'
      },
      {
        user_id: enterprise._id, title: 'Peak Demand AI', type: 'alert',
        message: '⚠ Industrial Load Spike Alert: Current load 438 kW exceeds threshold.'
      }
    ]);

    console.log('✅ Ahmedabad Database Seed Complete! Fully loaded for Admin/Enterprise/Consumer roles.');
    process.exit(0);
  } catch (err) {
    console.error('❌ SEED ERROR:', err);
    process.exit(1);
  }
}

seed();
