#!/usr/bin/env node

/**
 * EcoPower EaaS Platform - Comprehensive Test Script
 * Tests all major functionality to ensure everything works
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '.env.local') });

// Import models
import { User } from './server/models/User.js';
import { EnergyPlan } from './server/models/EnergyPlan.js';
import { Location } from './server/models/Location.js';
import { Subscription } from './server/models/Subscription.js';
import { Device } from './server/models/Device.js';
import { EnergyReading } from './server/models/EnergyReading.js';
import { Invoice } from './server/models/Invoice.js';
import { Payment } from './server/models/Payment.js';
import { SupportTicket } from './server/models/SupportTicket.js';
import { Notification } from './server/models/Notification.js';
import { CarbonStat } from './server/models/CarbonStat.js';

const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m'
};

let testsPassed = 0;
let testsFailed = 0;

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function testResult(name, passed, details = '') {
  if (passed) {
    log(`✅ ${name}`, 'green');
    testsPassed++;
  } else {
    log(`❌ ${name}`, 'red');
    if (details) log(`   ${details}`, 'yellow');
    testsFailed++;
  }
}

async function runTests() {
  try {
    log('\n🧪 Starting EcoPower EaaS Platform Tests...\n', 'cyan');

    // Connect to MongoDB
    log('📡 Connecting to MongoDB...', 'blue');
    await mongoose.connect(process.env.MONGODB_URI, { dbName: 'eaas_platform' });
    log('✅ Connected to MongoDB\n', 'green');

    // Test 1: Check if collections exist
    log('📊 Testing Database Collections...', 'blue');
    const collections = await mongoose.connection.db.listCollections().toArray();
    const collectionNames = collections.map(c => c.name);
    
    const requiredCollections = [
      'users', 'energyplans', 'locations', 'subscriptions', 
      'devices', 'energyreadings', 'invoices', 'payments',
      'supporttickets', 'notifications', 'carbonstats'
    ];

    requiredCollections.forEach(name => {
      testResult(
        `Collection '${name}' exists`,
        collectionNames.includes(name)
      );
    });

    // Test 2: Check data counts
    log('\n📈 Testing Data Counts...', 'blue');
    
    const userCount = await User.countDocuments();
    testResult('Users exist', userCount > 0, `Found ${userCount} users`);
    
    const planCount = await EnergyPlan.countDocuments();
    testResult('Energy plans exist', planCount > 0, `Found ${planCount} plans`);
    
    const locationCount = await Location.countDocuments();
    testResult('Locations exist', locationCount > 0, `Found ${locationCount} locations`);
    
    const subscriptionCount = await Subscription.countDocuments();
    testResult('Subscriptions exist', subscriptionCount > 0, `Found ${subscriptionCount} subscriptions`);
    
    const deviceCount = await Device.countDocuments();
    testResult('Devices exist', deviceCount > 0, `Found ${deviceCount} devices`);
    
    const readingCount = await EnergyReading.countDocuments();
    testResult('Telemetry readings exist', readingCount > 0, `Found ${readingCount} readings`);
    
    const invoiceCount = await Invoice.countDocuments();
    testResult('Invoices exist', invoiceCount > 0, `Found ${invoiceCount} invoices`);

    // Test 3: Check user roles
    log('\n👥 Testing User Roles...', 'blue');
    
    const adminCount = await User.countDocuments({ role: 'admin' });
    testResult('Admin users exist', adminCount > 0, `Found ${adminCount} admins`);
    
    const enterpriseCount = await User.countDocuments({ role: 'enterprise' });
    testResult('Enterprise users exist', enterpriseCount > 0, `Found ${enterpriseCount} enterprise users`);
    
    const consumerCount = await User.countDocuments({ role: 'consumer' });
    testResult('Consumer users exist', consumerCount > 0, `Found ${consumerCount} consumers`);

    // Test 4: Check subscription states
    log('\n📋 Testing Subscription States...', 'blue');
    
    const activeSubs = await Subscription.countDocuments({ status: 'active' });
    testResult('Active subscriptions exist', activeSubs > 0, `Found ${activeSubs} active`);

    // Test 5: Check relationships
    log('\n🔗 Testing Data Relationships...', 'blue');
    
    const subWithPlan = await Subscription.findOne().populate('plan_id');
    testResult('Subscription → Plan relationship', subWithPlan && subWithPlan.plan_id, 
      subWithPlan ? `Plan: ${subWithPlan.plan_id?.plan_name}` : '');
    
    const subWithLocation = await Subscription.findOne().populate('location_id');
    testResult('Subscription → Location relationship', subWithLocation && subWithLocation.location_id,
      subWithLocation ? `Location: ${subWithLocation.location_id?.city}` : '');
    
    const deviceWithLocation = await Device.findOne().populate('location_id');
    testResult('Device → Location relationship', deviceWithLocation && deviceWithLocation.location_id);
    
    const invoiceWithSub = await Invoice.findOne().populate('subscription_id');
    testResult('Invoice → Subscription relationship', invoiceWithSub && invoiceWithSub.subscription_id);

    // Test 6: Check data integrity
    log('\n🔍 Testing Data Integrity...', 'blue');
    
    const invoice = await Invoice.findOne();
    if (invoice) {
      const calculatedTotal = invoice.base_amount + invoice.tax - invoice.discount;
      testResult('Invoice calculation correct', 
        Math.abs(calculatedTotal - invoice.total_amount) < 0.01,
        `Expected: ${calculatedTotal}, Got: ${invoice.total_amount}`);
    }
    
    const reading = await EnergyReading.findOne();
    if (reading) {
      testResult('Energy reading has valid timestamp', 
        reading.timestamp instanceof Date && reading.timestamp <= new Date());
      testResult('Energy values are non-negative',
        reading.energy_generated_kwh >= 0 && reading.energy_consumed_kwh >= 0);
      testResult('Battery SOC in valid range',
        reading.battery_soc >= 0 && reading.battery_soc <= 100);
    }

    // Test 7: Check indexes
    log('\n⚡ Testing Database Indexes...', 'blue');
    
    const userIndexes = await User.collection.getIndexes();
    testResult('User indexes exist', Object.keys(userIndexes).length > 1);
    
    const subscriptionIndexes = await Subscription.collection.getIndexes();
    testResult('Subscription indexes exist', Object.keys(subscriptionIndexes).length > 1);
    
    const deviceIndexes = await Device.collection.getIndexes();
    testResult('Device indexes exist', Object.keys(deviceIndexes).length > 1);

    // Test 8: Check test credentials
    log('\n🔐 Testing Login Credentials...', 'blue');
    
    const adminUser = await User.findOne({ email: 'admin@ecopower.com' });
    testResult('Admin test account exists', adminUser !== null);
    
    const enterpriseUser = await User.findOne({ email: 'vikram@techcorp.in' });
    testResult('Enterprise test account exists', enterpriseUser !== null);
    
    const consumerUser = await User.findOne({ email: 'rahul.sharma@gmail.com' });
    testResult('Consumer test account exists', consumerUser !== null);

    // Test 9: Check telemetry data variety
    log('\n📊 Testing Telemetry Data Variety...', 'blue');
    
    const distinctDevices = await EnergyReading.distinct('device_id');
    testResult('Multiple devices have telemetry', distinctDevices.length > 1,
      `${distinctDevices.length} devices reporting`);
    
    const oldestReading = await EnergyReading.findOne().sort({ timestamp: 1 });
    const newestReading = await EnergyReading.findOne().sort({ timestamp: -1 });
    if (oldestReading && newestReading) {
      const daysDiff = (newestReading.timestamp - oldestReading.timestamp) / (1000 * 60 * 60 * 24);
      testResult('Telemetry spans multiple days', daysDiff >= 1,
        `${daysDiff.toFixed(1)} days of data`);
    }

    // Test 10: Check invoice variety
    log('\n💰 Testing Invoice Variety...', 'blue');
    
    const paidInvoices = await Invoice.countDocuments({ status: 'paid' });
    const pendingInvoices = await Invoice.countDocuments({ status: 'pending' });
    testResult('Mix of paid and pending invoices', paidInvoices > 0 && pendingInvoices > 0,
      `${paidInvoices} paid, ${pendingInvoices} pending`);

    // Summary
    log('\n' + '='.repeat(50), 'cyan');
    log('📊 Test Summary', 'cyan');
    log('='.repeat(50), 'cyan');
    log(`✅ Tests Passed: ${testsPassed}`, 'green');
    log(`❌ Tests Failed: ${testsFailed}`, testsFailed > 0 ? 'red' : 'green');
    log(`📈 Success Rate: ${((testsPassed / (testsPassed + testsFailed)) * 100).toFixed(1)}%`, 
      testsFailed === 0 ? 'green' : 'yellow');
    log('='.repeat(50) + '\n', 'cyan');

    if (testsFailed === 0) {
      log('🎉 All tests passed! Platform is ready for use.', 'green');
      log('\n📝 Next Steps:', 'blue');
      log('1. Start backend: npm run server', 'cyan');
      log('2. Start frontend: npm run dev', 'cyan');
      log('3. Open http://localhost:3000', 'cyan');
      log('4. Login with test credentials\n', 'cyan');
    } else {
      log('⚠️  Some tests failed. Please check the errors above.', 'yellow');
      log('💡 Try running: npm run seed:complete\n', 'cyan');
    }

    process.exit(testsFailed === 0 ? 0 : 1);

  } catch (error) {
    log(`\n❌ Test Error: ${error.message}`, 'red');
    console.error(error);
    process.exit(1);
  }
}

runTests();
