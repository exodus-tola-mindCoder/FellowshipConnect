import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';

// Load environment variables
dotenv.config();

// Log the MONGODB_URI to verify it's being read
console.log('MONGODB_URI:', process.env.MONGODB_URI);

if (!process.env.MONGODB_URI) {
  console.error('❌ MONGODB_URI is not defined. Please check your .env file.');
  process.exit(1);
}

const createAdmin = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);

    console.log('Connected to MongoDB');

    // Admin details
    const adminDetails = {
      name: 'Admin User',
      email: 'admin@gmail.com',
      password: '123456', // Change this to a strong password
      role: 'admin',
      fellowshipRole: 'Administrator',
    };

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: adminDetails.email });
    if (existingAdmin) {
      console.log('Admin user already exists');
      return;
    }

    // Create admin user
    const admin = new User(adminDetails);
    await admin.save();

    console.log('Admin user created successfully');
  } catch (error) {
    console.error('Error creating admin user:', error);
  } finally {
    // Disconnect from MongoDB
    mongoose.connection.close();
  }
};

createAdmin();
