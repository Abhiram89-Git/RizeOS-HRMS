require('dotenv').config();
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/ai-hrms').then(async () => {
  console.log('Connected to MongoDB');
  
  const Employee = require('./models/Employee');
  
  // Find all employees
  const employees = await Employee.find({}).select('name email password status organization');
  
  console.log('\n=== All Employees ===');
  employees.forEach(e => {
    console.log(`Name: ${e.name}`);
    console.log(`Email: ${e.email}`);
    console.log(`Password set: ${!!e.password}`);
    console.log(`Status: ${e.status}`);
    console.log(`OrgId: ${e.organization}`);
    console.log('---');
  });
  
  process.exit();
}).catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});