/**
 * Script to create demo admin in MongoDB Atlas
 * 
 * Usage:
 * 1. Ensure MONGODB_URI is set in .env.local
 * 2. Run: node server/create-demo-admin.js
 * 
 * Or use the API endpoint directly:
 * POST http://localhost:5000/api/admins/create
 * {
 *   "fullName": "Demo Admin",
 *   "email": "admin@clinicconnect.com",
 *   "password": "admin123"
 * }
 */

import dotenv from 'dotenv';
import { MongoClient } from 'mongodb';
import bcrypt from 'bcryptjs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('✗ Error: MONGODB_URI is not set in .env.local');
  process.exit(1);
}

async function createDemoAdmin() {
  const client = new MongoClient(MONGODB_URI);

  try {
    console.log('Connecting to MongoDB Atlas...');
    await client.connect();
    console.log('✓ Connected to MongoDB Atlas');

    const db = client.db('clinicconnect');

    // Hash the password
    const password = 'admin123';
    console.log('Hashing password...');
    const passwordHash = await bcrypt.hash(password, 10);
    console.log('✓ Password hashed');

    // Admin data
    const adminData = {
      fullName: 'Demo Admin',
      email: 'admin@clinicconnect.com',
      passwordHash,
      createdAt: new Date(),
      isActive: true
    };

    // Check if admin already exists
    const existingAdmin = await db.collection('admins').findOne({ email: adminData.email });
    
    if (existingAdmin) {
      console.log('ℹ Admin already exists. Updating record...');
      const result = await db.collection('admins').updateOne(
        { email: adminData.email },
        { $set: { ...adminData, updatedAt: new Date() } }
      );
      
      console.log('✓ Admin record updated');
    } else {
      console.log('Creating new admin...');
      const result = await db.collection('admins').insertOne(adminData);
      console.log('✓ New admin created');
    }

    console.log('\n' + '━'.repeat(50));
    console.log('LOGIN CREDENTIALS');
    console.log('━'.repeat(50));
    console.log('Email:    admin@clinicconnect.com');
    console.log('Password: admin123');
    console.log('━'.repeat(50));
    console.log('\nAdmin details saved in collection: clinicconnect.admins');
    console.log('Ready to test admin login at: http://localhost:5173/login');

  } catch (error) {
    console.error('\n✗ Error:', error.message);
    console.log('\nTroubleshooting:');
    console.log('1. Verify MONGODB_URI is set in .env.local');
    console.log('2. Check IP whitelist in MongoDB Atlas Network Access');
    console.log('3. Ensure database name is "clinicconnect"');
    console.log('4. Verify bcryptjs is installed: npm install bcryptjs');
    process.exit(1);
  } finally {
    await client.close();
    console.log('\n✓ Database connection closed');
  }
}

// Run the script
createDemoAdmin();
