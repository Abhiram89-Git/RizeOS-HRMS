/**
 * Run this script to manually set an employee's password
 * Usage: node set-employee-password.js <email> <password>
 * Example: node set-employee-password.js abhiramnaikbanoth@gmail.com mypassword123
 */
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const email = process.argv[2];
const password = process.argv[3];

if (!email || !password) {
  console.log('Usage: node set-employee-password.js <email> <newpassword>');
  process.exit(1);
}

mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/ai-hrms')
  .then(async () => {
    // Use raw mongoose model to bypass any middleware issues
    const db = mongoose.connection.db;
    const collection = db.collection('employees');

    // Find employee
    const emp = await collection.findOne({ email: email.toLowerCase() });
    if (!emp) {
      console.log(`❌ No employee found with email: ${email}`);
      process.exit(1);
    }

    console.log(`✅ Found employee: ${emp.name}`);

    // Hash password directly
    const hashed = await bcrypt.hash(password, 10);

    // Update directly in MongoDB
    await collection.updateOne(
      { email: email.toLowerCase() },
      { $set: { password: hashed } }
    );

    console.log(`✅ Password set successfully for ${emp.name} (${email})`);
    console.log(`\nEmployee can now login at /employee with:`);
    console.log(`  Email: ${email}`);
    console.log(`  Password: ${password}`);

    process.exit(0);
  })
  .catch(err => {
    console.error('Error:', err.message);
    process.exit(1);
  });