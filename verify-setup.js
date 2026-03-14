import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function verify() {
  try {
    console.log('🔍 Verifying EcoPower 2.0 Setup...\n');
    
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI, { dbName: 'eaas_platform' });
    console.log('✅ Database connection successful');
    
    // Check collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    const collectionNames = collections.map(c => c.name);
    
    console.log('\n📊 Database Collections:');
    const requiredCollections = [
      'users', 'locations', 'devices', 'energyreadings', 
      'invoices', 'energyplans', 'subscriptions', 
      'supporttickets', 'carbonstats', 'notifications'
    ];
    
    let allPresent = true;
    for (const col of requiredCollections) {
      const exists = collectionNames.includes(col);
      console.log(`  ${exists ? '✅' : '❌'} ${col}`);
      if (!exists) allPresent = false;
    }
    
    if (!allPresent) {
      console.log('\n⚠️  Some collections are missing. Run: npm run seed');
    }
    
    // Count documents
    console.log('\n📈 Document Counts:');
    for (const col of requiredCollections) {
      if (collectionNames.includes(col)) {
        const count = await mongoose.connection.db.collection(col).countDocuments();
        console.log(`  ${col}: ${count} documents`);
      }
    }
    
    // Test demo users
    console.log('\n👥 Demo Users:');
    const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));
    const demoEmails = ['admin@instinct.com', 'vikram@techpark.in', 'rahul.sharma@gmail.com'];
    
    for (const email of demoEmails) {
      const user = await User.findOne({ email });
      if (user) {
        console.log(`  ✅ ${email} (${user.role})`);
      } else {
        console.log(`  ❌ ${email} - NOT FOUND`);
      }
    }
    
    await mongoose.connection.close();
    
    console.log('\n🎉 Setup verification complete!');
    console.log('\n📝 Next steps:');
    console.log('  1. Ensure backend is running: npm run server');
    console.log('  2. Ensure frontend is running: npm run dev');
    console.log('  3. Open http://localhost:3000 in your browser');
    console.log('  4. Login with any demo account');
    
    process.exit(0);
  } catch (err) {
    console.error('❌ Verification failed:', err.message);
    process.exit(1);
  }
}

verify();
