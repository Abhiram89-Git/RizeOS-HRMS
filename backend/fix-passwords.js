require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/ai-hrms')
  .then(async () => {
    const hashed = await bcrypt.hash('test123', 10);
    const result = await mongoose.connection.db
      .collection('employees')
      .updateMany(
        { password: null },
        { $set: { password: hashed } }
      );
    console.log('✅ Updated', result.modifiedCount, 'employees');
    console.log('All employees can now login with password: test123');
    process.exit();
  })
  .catch(err => {
    console.error('Error:', err.message);
    process.exit(1);
  });
  