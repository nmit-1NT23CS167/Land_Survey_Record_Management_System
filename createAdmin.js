// createAdmin.js — Run once to create your first admin account
// Usage: node createAdmin.js

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/land_survey_db';

const UserSchema = new mongoose.Schema({
  full_name: String,
  email: { type: String, unique: true, lowercase: true },
  password: { type: String, select: false },
  role: { type: String, default: 'user' },
  phone: String,
  department: String,
  is_active: { type: Boolean, default: true },
  last_login: Date,
  created_at: { type: Date, default: Date.now },
});

const User = mongoose.model('User', UserSchema);

async function createAdmin() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB...');

    // Change these credentials before running
    const adminData = {
      full_name: 'System Administrator',
      email: 'admin@landsurvey.com',
      password: 'Admin@1234',
      role: 'admin',
      department: 'Administration',
      phone: '+91 9000000000',
      is_active: true,
    };

    const existing = await User.findOne({ email: adminData.email });
    if (existing) {
      console.log(`\nAdmin already exists: ${adminData.email}`);
      console.log('To reset password, delete the user from MongoDB Atlas and re-run this script.');
      process.exit(0);
    }

    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(adminData.password, salt);

    const admin = await User.create({ ...adminData, password: hashedPassword });

    console.log('\nAdmin account created successfully!');
    console.log('─────────────────────────────────────');
    console.log(`  Email    : ${adminData.email}`);
    console.log(`  Password : ${adminData.password}`);
    console.log(`  Role     : ${admin.role}`);
    console.log('─────────────────────────────────────');
    console.log('Login at: http://localhost:5500/login');
    console.log('\nIMPORTANT: Change the password after first login.\n');

    process.exit(0);
  } catch (err) {
    console.error('Error creating admin:', err.message);
    process.exit(1);
  }
}

createAdmin();