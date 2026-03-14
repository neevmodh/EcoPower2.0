import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

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
import { Payment } from './models/Payment.js';

const MONGO_URI = process.env.MONGODB_URI;

async function seedComplete() {
  try {
    console.log('🌱 Starting Complete EaaS Platform Seed...');
    console.log('📡 Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI, { dbName: 'eaas_platform' });
    console.log('✅ Connected to MongoDB');

    // Clear existing data
    console.log('🧹 Clearing existing data...');
    const collections = [
      User, Location, Device, EnergyReading, Invoice, 
      SupportTicket, EnergyPlan, Subscription, CarbonStat, 
      Notification, Payment
    ];
    
    for (const collection of collections) {
      try {
        await collection.collection.drop();
      } catch (e) {
        // Collection doesn't exist, ignore
      }
    }

    // ============ ENERGY PLANS ============
    console.log('📦 Creating Energy Plans (All Varieties)...');
    const plans = await EnergyPlan.insertMany([
      {
        plan_name: 'Home Starter',
        description: '3 kW Solar System - Perfect for small apartments',
        price_per_month: 999,
        max_kwh: 250,
        solar_capacity_kw: 3,
        battery_included: false
      },
      {
        plan_name: 'Home Basic',
        description: '5 kW Solar + Smart Monitoring - Ideal for 2-3 BHK homes',
        price_per_month: 1499,
        max_kwh: 400,
        solar_capacity_kw: 5,
        battery_included: false
      },
      {
        plan_name: 'Home Premium',
        description: '10 kW Solar + 10 kWh Battery + Priority Support',
        price_per_month: 2999,
        max_kwh: 800,
        solar_capacity_kw: 10,
        battery_included: true
      },
      {
        plan_name: 'Home Elite',
        description: '15 kW Solar + 20 kWh Battery + AI Optimization',
        price_per_month: 4999,
        max_kwh: 1200,
        solar_capacity_kw: 15,
        battery_included: true
      },
      {
        plan_name: 'Business Standard',
        description: '25 kW Solar - Small business & retail shops',
        price_per_month: 8999,
        max_kwh: 2000,
        solar_capacity_kw: 25,
        battery_included: false
      },
      {
        plan_name: 'Business Pro',
        description: '50 kW Solar + 50 kWh Battery + Load Management',
        price_per_month: 15999,
        max_kwh: 4000,
        solar_capacity_kw: 50,
        battery_included: true
      },
      {
        plan_name: 'Enterprise Fleet',
        description: '100 kW Solar + Multi-Site Dashboard + Dedicated Support',
        price_per_month: 25000,
        max_kwh: 8000,
        solar_capacity_kw: 100,
        battery_included: true
      },
      {
        plan_name: 'Industrial Mega',
        description: '500 kW Solar + Predictive Maintenance + 100% Uptime SLA',
        price_per_month: 99000,
        max_kwh: 40000,
        solar_capacity_kw: 500,
        battery_included: true
      }
    ]);

    console.log(`✅ Created ${plans.length} energy plans`);

    // ============ USERS (All Roles) ============
    console.log('👥 Creating Users (Admin, Enterprise, Consumer)...');
    const salt = await bcrypt.genSalt(10);
    const defaultPassword = await bcrypt.hash('password123', salt);

    const users = await User.insertMany([
      // Admin Users
      {
        name: 'Neev Modh',
        email: 'admin@ecopower.com',
        password_hash: defaultPassword,
        role: 'admin',
        status: 'active',
        phone: '+91 9876543210'
      },
      {
        name: 'Priya Patel',
        email: 'priya.admin@ecopower.com',
        password_hash: defaultPassword,
        role: 'admin',
        status: 'active',
        phone: '+91 9876543211'
      },
      // Enterprise Users
      {
        name: 'Vikram Desai',
        email: 'vikram@techcorp.in',
        password_hash: defaultPassword,
        role: 'enterprise',
        status: 'active',
        phone: '+91 9988776655'
      },
      {
        name: 'Anjali Mehta',
        email: 'anjali@manufacturing.in',
        password_hash: defaultPassword,
        role: 'enterprise',
        status: 'active',
        phone: '+91 9988776656'
      },
      {
        name: 'Rajesh Kumar',
        email: 'rajesh@retailchain.in',
        password_hash: defaultPassword,
        role: 'enterprise',
        status: 'active',
        phone: '+91 9988776657'
      },
      // Consumer Users
      {
        name: 'Rahul Sharma',
        email: 'rahul.sharma@gmail.com',
        password_hash: defaultPassword,
        role: 'consumer',
        status: 'active',
        phone: '+91 9123456789'
      },
      {
        name: 'Sneha Gupta',
        email: 'sneha.gupta@gmail.com',
        password_hash: defaultPassword,
        role: 'consumer',
        status: 'active',
        phone: '+91 9123456790'
      },
      {
        name: 'Amit Verma',
        email: 'amit.verma@yahoo.com',
        password_hash: defaultPassword,
        role: 'consumer',
        status: 'active',
        phone: '+91 9123456791'
      },
      {
        name: 'Pooja Singh',
        email: 'pooja.singh@outlook.com',
        password_hash: defaultPassword,
        role: 'consumer',
        status: 'active',
        phone: '+91 9123456792'
      },
      {
        name: 'Karan Joshi',
        email: 'karan.joshi@gmail.com',
        password_hash: defaultPassword,
        role: 'consumer',
        status: 'active',
        phone: '+91 9123456793'
      }
    ]);

    console.log(`✅ Created ${users.length} users`);

    const [admin1, admin2, ent1, ent2, ent3, cons1, cons2, cons3, cons4, cons5] = users;

    // ============ LOCATIONS (Diverse) ============
    console.log('📍 Creating Locations (Residential, Commercial, Industrial)...');
    const locations = await Location.insertMany([
      // Enterprise Locations
      {
        user_id: ent1._id,
        name: 'TechCorp HQ',
        address_line1: 'Titanium Square, Thaltej',
        city: 'Ahmedabad',
        state: 'Gujarat',
        postal_code: '380054',
        country: 'India',
        location_type: 'commercial',
        latitude: 23.0470,
        longitude: 72.5040
      },
      {
        user_id: ent1._id,
        name: 'TechCorp R&D Center',
        address_line1: 'GIFT City, Block A',
        city: 'Gandhinagar',
        state: 'Gujarat',
        postal_code: '382355',
        country: 'India',
        location_type: 'commercial',
        latitude: 23.1645,
        longitude: 72.6369
      },
      {
        user_id: ent2._id,
        name: 'Manufacturing Plant 1',
        address_line1: 'GIDC Estate, Plot 45',
        city: 'Sanand',
        state: 'Gujarat',
        postal_code: '382170',
        country: 'India',
        location_type: 'industrial',
        latitude: 22.9676,
        longitude: 72.3645
      },
      {
        user_id: ent2._id,
        name: 'Manufacturing Plant 2',
        address_line1: 'Vatva GIDC, Phase 3',
        city: 'Ahmedabad',
        state: 'Gujarat',
        postal_code: '382445',
        country: 'India',
        location_type: 'industrial',
        latitude: 22.9876,
        longitude: 72.6543
      },
      {
        user_id: ent3._id,
        name: 'Retail Store - CG Road',
        address_line1: 'CG Road, Near Parimal Garden',
        city: 'Ahmedabad',
        state: 'Gujarat',
        postal_code: '380006',
        country: 'India',
        location_type: 'commercial',
        latitude: 23.0359,
        longitude: 72.5559
      },
      // Consumer Locations
      {
        user_id: cons1._id,
        name: 'Home',
        address_line1: 'Orchid Heights, Tower B, Flat 402',
        city: 'Ahmedabad',
        state: 'Gujarat',
        postal_code: '380058',
        country: 'India',
        location_type: 'residential',
        latitude: 23.0095,
        longitude: 72.4711
      },
      {
        user_id: cons2._id,
        name: 'Home',
        address_line1: 'Shilp Shaligram, A-701',
        city: 'Ahmedabad',
        state: 'Gujarat',
        postal_code: '380015',
        country: 'India',
        location_type: 'residential',
        latitude: 23.0225,
        longitude: 72.5714
      },
      {
        user_id: cons3._id,
        name: 'Home',
        address_line1: 'Prahladnagar, Bungalow 12',
        city: 'Ahmedabad',
        state: 'Gujarat',
        postal_code: '380015',
        country: 'India',
        location_type: 'residential',
        latitude: 23.0069,
        longitude: 72.5311
      },
      {
        user_id: cons4._id,
        name: 'Home',
        address_line1: 'Makarba, Villa 45',
        city: 'Ahmedabad',
        state: 'Gujarat',
        postal_code: '380051',
        country: 'India',
        location_type: 'residential',
        latitude: 22.9876,
        longitude: 72.5012
      },
      {
        user_id: cons5._id,
        name: 'Home',
        address_line1: 'Satellite, Flat 301, Sunrise Apartments',
        city: 'Ahmedabad',
        state: 'Gujarat',
        postal_code: '380015',
        country: 'India',
        location_type: 'residential',
        latitude: 23.0258,
        longitude: 72.5098
      }
    ]);

    console.log(`✅ Created ${locations.length} locations`);

    // ============ SUBSCRIPTIONS ============
    console.log('📋 Creating Subscriptions...');
    const subscriptions = await Subscription.insertMany([
      // Enterprise subscriptions
      { user_id: ent1._id, plan_id: plans[6]._id, location_id: locations[0]._id, status: 'active', billing_cycle: 'monthly', start_date: new Date('2025-01-01') },
      { user_id: ent1._id, plan_id: plans[5]._id, location_id: locations[1]._id, status: 'active', billing_cycle: 'monthly', start_date: new Date('2025-02-01') },
      { user_id: ent2._id, plan_id: plans[7]._id, location_id: locations[2]._id, status: 'active', billing_cycle: 'monthly', start_date: new Date('2024-12-01') },
      { user_id: ent2._id, plan_id: plans[7]._id, location_id: locations[3]._id, status: 'active', billing_cycle: 'monthly', start_date: new Date('2025-01-15') },
      { user_id: ent3._id, plan_id: plans[4]._id, location_id: locations[4]._id, status: 'active', billing_cycle: 'monthly', start_date: new Date('2025-03-01') },
      // Consumer subscriptions
      { user_id: cons1._id, plan_id: plans[2]._id, location_id: locations[5]._id, status: 'active', billing_cycle: 'monthly', start_date: new Date('2025-01-10') },
      { user_id: cons2._id, plan_id: plans[1]._id, location_id: locations[6]._id, status: 'active', billing_cycle: 'monthly', start_date: new Date('2025-02-15') },
      { user_id: cons3._id, plan_id: plans[3]._id, location_id: locations[7]._id, status: 'active', billing_cycle: 'yearly', start_date: new Date('2024-11-01') },
      { user_id: cons4._id, plan_id: plans[0]._id, location_id: locations[8]._id, status: 'paused', billing_cycle: 'monthly', start_date: new Date('2025-01-01') },
      { user_id: cons5._id, plan_id: plans[1]._id, location_id: locations[9]._id, status: 'active', billing_cycle: 'monthly', start_date: new Date('2025-03-01') }
    ]);

    console.log(`✅ Created ${subscriptions.length} subscriptions`);

    // ============ DEVICES ============
    console.log('🔌 Installing IoT Devices...');
    const devices = [];
    
    locations.forEach((loc, idx) => {
      const sub = subscriptions.find(s => s.location_id.toString() === loc._id.toString());
      if (!sub) return;
      
      const plan = plans.find(p => p._id.toString() === sub.plan_id.toString());
      const hasInverter = plan.solar_capacity_kw > 0;
      const hasBattery = plan.battery_included;
      
      if (hasInverter) {
        devices.push({
          device_serial: `INV-${idx.toString().padStart(3, '0')}`,
          location_id: loc._id,
          device_type: 'solar_inverter',
          status: 'online',
          firmware_version: '2.4.1',
          installed_at: sub.start_date,
          last_seen: new Date()
        });
      }
      
      if (hasBattery) {
        devices.push({
          device_serial: `BAT-${idx.toString().padStart(3, '0')}`,
          location_id: loc._id,
          device_type: 'battery_system',
          status: 'online',
          firmware_version: '1.8.3',
          installed_at: sub.start_date,
          last_seen: new Date()
        });
      }
      
      devices.push({
        device_serial: `MET-${idx.toString().padStart(3, '0')}`,
        location_id: loc._id,
        device_type: 'smart_meter',
        status: 'online',
        firmware_version: '3.1.0',
        installed_at: sub.start_date,
        last_seen: new Date()
      });
    });

    const createdDevices = await Device.insertMany(devices);
    console.log(`✅ Created ${createdDevices.length} devices`);

    // ============ TELEMETRY DATA (Last 7 days, hourly) ============
    console.log('📈 Generating Telemetry Data (Last 7 days)...');
    const telemetryData = [];
    const now = new Date();
    
    for (let day = 6; day >= 0; day--) {
      for (let hour = 0; hour < 24; hour++) {
        const timestamp = new Date(now);
        timestamp.setDate(timestamp.getDate() - day);
        timestamp.setHours(hour, 0, 0, 0);
        
        // Solar generation curve (peak at 1 PM)
        let solarMultiplier = 0;
        if (hour >= 6 && hour <= 18) {
          solarMultiplier = Math.max(0, 1 - Math.pow((hour - 13) / 7, 2));
        }
        
        createdDevices.forEach(device => {
          if (device.device_type !== 'smart_meter') return;
          
          const location = locations.find(l => l._id.toString() === device.location_id.toString());
          const subscription = subscriptions.find(s => s.location_id.toString() === location._id.toString());
          const plan = plans.find(p => p._id.toString() === subscription.plan_id.toString());
          
          const capacity = plan.solar_capacity_kw;
          const generation = Number((solarMultiplier * capacity * (0.7 + Math.random() * 0.2)).toFixed(2));
          
          // Consumption patterns
          let baseLoad = capacity * 0.2;
          if (location.location_type === 'industrial') {
            baseLoad = capacity * 0.4;
            if (hour >= 8 && hour <= 18) baseLoad *= 1.5;
          } else if (location.location_type === 'commercial') {
            baseLoad = capacity * 0.3;
            if (hour >= 9 && hour <= 20) baseLoad *= 1.3;
          } else {
            // Residential
            if (hour >= 6 && hour <= 9) baseLoad *= 1.4; // Morning
            if (hour >= 18 && hour <= 23) baseLoad *= 1.6; // Evening
            if (hour >= 0 && hour <= 5) baseLoad *= 0.3; // Night
          }
          
          const consumption = Number((baseLoad + Math.random() * capacity * 0.1).toFixed(2));
          const gridUsage = Math.max(0, Number((consumption - generation).toFixed(2)));
          
          // Battery SOC
          let batterySoc = 50;
          if (plan.battery_included) {
            if (hour >= 10 && hour <= 16) batterySoc = 90 + Math.floor(Math.random() * 10);
            else if (hour >= 18 && hour <= 23) batterySoc = 40 + Math.floor(Math.random() * 30);
            else batterySoc = 60 + Math.floor(Math.random() * 20);
          }
          
          telemetryData.push({
            device_id: device._id,
            timestamp,
            energy_generated_kwh: generation,
            energy_consumed_kwh: consumption,
            grid_usage_kwh: gridUsage,
            battery_soc: batterySoc,
            voltage: 230 + Math.random() * 10,
            current: consumption / 0.23,
            power_factor: 0.95 + Math.random() * 0.04
          });
        });
      }
    }
    
    await EnergyReading.insertMany(telemetryData);
    console.log(`✅ Generated ${telemetryData.length} telemetry readings`);

    // ============ INVOICES (6 months, varied statuses) ============
    console.log('🧾 Creating Invoices (6 months, varied statuses)...');
    const invoices = [];

    // Status distribution per month offset (0 = current month, 5 = 5 months ago)
    // Older months are mostly paid, recent months have pending/overdue variety
    const statusByOffset = [
      // monthOffset: [statuses to pick from]
      ['pending', 'pending', 'pending'],          // current month — all pending
      ['pending', 'overdue', 'overdue'],           // 1 month ago — mix of pending/overdue
      ['paid', 'paid', 'overdue'],                 // 2 months ago — mostly paid, some overdue
      ['paid', 'paid', 'paid'],                    // 3 months ago — all paid
      ['paid', 'paid', 'paid'],                    // 4 months ago — all paid
      ['paid', 'paid', 'paid'],                    // 5 months ago — all paid
    ];

    subscriptions.forEach((sub, subIdx) => {
      const plan = plans.find(p => p._id.toString() === sub.plan_id.toString());
      const baseAmount = plan.price_per_month;
      const tax = Number((baseAmount * 0.18).toFixed(2));
      const totalAmount = Number((baseAmount + tax).toFixed(2));

      for (let offset = 5; offset >= 0; offset--) {
        const d = new Date();
        d.setMonth(d.getMonth() - offset);
        const start = new Date(d.getFullYear(), d.getMonth(), 1);
        const end = new Date(d.getFullYear(), d.getMonth() + 1, 0);
        const dueDate = new Date(end.getTime() + 15 * 24 * 60 * 60 * 1000);
        const period = d.toLocaleString('default', { month: 'short', year: 'numeric' });

        // Skip if subscription started after this period
        if (sub.start_date > end) continue;

        const pool = statusByOffset[offset];
        const status = pool[subIdx % pool.length];

        // Slight energy variation per month
        const variation = 0.55 + (offset * 0.07) + Math.random() * 0.15;
        const energyUsed = Math.floor(plan.max_kwh * variation);

        // Occasional discount on older paid invoices
        const discount = (status === 'paid' && offset >= 3 && subIdx % 3 === 0) ? Math.floor(baseAmount * 0.05) : 0;
        const finalTotal = Number((totalAmount - discount).toFixed(2));

        invoices.push({
          subscription_id: sub._id,
          billing_period: period,
          billing_period_start: start,
          billing_period_end: end,
          due_date: dueDate,
          energy_used_kwh: energyUsed,
          base_amount: baseAmount,
          tax,
          discount,
          total_amount: finalTotal,
          status,
        });
      }
    });

    const createdInvoices = await Invoice.insertMany(invoices);
    console.log(`✅ Created ${createdInvoices.length} invoices (paid/pending/overdue variety)`);

    // ============ PAYMENTS ============
    console.log('💳 Creating Payment Records...');
    const payments = [];
    
    createdInvoices.filter(inv => inv.status === 'paid').forEach(invoice => {
      payments.push({
        invoice_id: invoice._id,
        amount: invoice.total_amount,
        payment_method: ['upi', 'card', 'netbanking', 'wallet'][Math.floor(Math.random() * 4)],
        transaction_id: `TXN_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        status: 'completed',
        gateway_response: { success: true, message: 'Payment successful' }
      });
    });
    
    await Payment.insertMany(payments);
    console.log(`✅ Created ${payments.length} payment records`);

    // ============ SUPPORT TICKETS ============
    console.log('🎫 Creating Support Tickets...');
    const tickets = await SupportTicket.insertMany([
      {
        user_id: ent2._id,
        subject: 'Dust accumulation affecting efficiency',
        description: 'Factory environment is dusty. Solar panel efficiency dropped by 12% over 2 weeks.',
        category: 'technical',
        priority: 'high',
        status: 'in_progress'
      },
      {
        user_id: cons1._id,
        subject: 'Dashboard not syncing',
        description: 'Mobile app shows offline but inverter lights are green.',
        category: 'technical',
        priority: 'medium',
        status: 'resolved',
        resolved_at: new Date()
      },
      {
        user_id: cons3._id,
        subject: 'Invoice clarification needed',
        description: 'Need breakdown of charges for last month.',
        category: 'billing',
        priority: 'low',
        status: 'open'
      },
      {
        user_id: ent1._id,
        subject: 'Request for capacity upgrade',
        description: 'Need to increase solar capacity from 100kW to 150kW at HQ location.',
        category: 'account',
        priority: 'medium',
        status: 'open'
      },
      {
        user_id: cons2._id,
        subject: 'Battery not charging',
        description: 'Battery SOC stuck at 45% for last 2 days.',
        category: 'device',
        priority: 'critical',
        status: 'in_progress'
      }
    ]);
    
    console.log(`✅ Created ${tickets.length} support tickets`);

    // ============ CARBON STATS ============
    console.log('🌱 Calculating Carbon Impact...');
    const carbonStats = [];
    
    subscriptions.forEach(sub => {
      const totalGeneration = telemetryData
        .filter(t => {
          const device = createdDevices.find(d => d._id.toString() === t.device_id.toString());
          return device && device.location_id.toString() === sub.location_id.toString();
        })
        .reduce((sum, t) => sum + t.energy_generated_kwh, 0);
      
      const carbonSaved = Number((totalGeneration * 0.7).toFixed(2)); // 0.7 kg CO2 per kWh
      const treesEquivalent = Math.floor(carbonSaved / 21); // 21 kg CO2 per tree per year
      
      carbonStats.push({
        subscription_id: sub._id,
        carbon_saved_kg: carbonSaved,
        trees_equivalent: treesEquivalent
      });
    });
    
    await CarbonStat.insertMany(carbonStats);
    console.log(`✅ Created ${carbonStats.length} carbon statistics`);

    // ============ NOTIFICATIONS ============
    console.log('🔔 Creating Notifications...');
    const notifications = [];
    
    users.filter(u => u.role !== 'admin').forEach(user => {
      notifications.push({
        user_id: user._id,
        type: 'info',
        title: 'Welcome to EcoPower EaaS',
        message: 'Your energy journey begins now. Monitor your savings in real-time!',
        priority: 'low',
        read: true
      });
      
      if (Math.random() > 0.5) {
        notifications.push({
          user_id: user._id,
          type: 'alert',
          title: 'High Energy Usage Detected',
          message: 'Your consumption is 15% higher than usual. Check your dashboard for details.',
          priority: 'medium',
          read: false
        });
      }
      
      if (user.role === 'consumer') {
        notifications.push({
          user_id: user._id,
          type: 'success',
          title: 'Monthly Savings Report',
          message: `You saved ₹${Math.floor(500 + Math.random() * 1000)} this month compared to grid-only power!`,
          priority: 'low',
          read: false
        });
      }
    });
    
    await Notification.insertMany(notifications);
    console.log(`✅ Created ${notifications.length} notifications`);

    // ============ SUMMARY ============
    console.log('\n🎉 ============ SEED COMPLETE ============');
    console.log(`✅ Energy Plans: ${plans.length}`);
    console.log(`✅ Users: ${users.length} (${users.filter(u => u.role === 'admin').length} admin, ${users.filter(u => u.role === 'enterprise').length} enterprise, ${users.filter(u => u.role === 'consumer').length} consumer)`);
    console.log(`✅ Locations: ${locations.length}`);
    console.log(`✅ Subscriptions: ${subscriptions.length}`);
    console.log(`✅ Devices: ${createdDevices.length}`);
    console.log(`✅ Telemetry Readings: ${telemetryData.length}`);
    console.log(`✅ Invoices: ${createdInvoices.length}`);
    console.log(`✅ Payments: ${payments.length}`);
    console.log(`✅ Support Tickets: ${tickets.length}`);
    console.log(`✅ Carbon Stats: ${carbonStats.length}`);
    console.log(`✅ Notifications: ${notifications.length}`);
    console.log('\n📝 Test Credentials:');
    console.log('   Admin: admin@ecopower.com / password123');
    console.log('   Enterprise: vikram@techcorp.in / password123');
    console.log('   Consumer: rahul.sharma@gmail.com / password123');
    console.log('\n🚀 Platform ready for testing!');

    process.exit(0);
  } catch (err) {
    console.error('❌ SEED ERROR:', err);
    process.exit(1);
  }
}

seedComplete();
