const express = require('express');
const Employee = require('../models/Employee');
const Task = require('../models/Task');
const { protect } = require('../middleware/auth');

const router = express.Router();
router.use(protect);

// GET all employees
router.get('/', async (req, res) => {
  try {
    const employees = await Employee.find({ organization: req.org._id })
      .select('-password').sort('-joinedAt');
    res.json(employees);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// POST create employee
router.post('/', async (req, res) => {
  try {
    const { name, email, role, department, skills, walletAddress, password, status } = req.body;
    if (!name || !email || !role || !department)
      return res.status(400).json({ message: 'Name, email, role and department required' });

    const emp = new Employee({
      organization: req.org._id, name, email, role, department,
      skills: skills || [], walletAddress: walletAddress || '',
      status: status || 'active',
      password: password || null
    });
    await emp.save(); // triggers bcrypt pre-save hook
    const result = emp.toObject();
    delete result.password;
    res.status(201).json(result);
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ message: 'Employee email already exists in this org' });
    res.status(500).json({ message: err.message });
  }
});

// GET single employee
router.get('/:id', async (req, res) => {
  try {
    const emp = await Employee.findOne({ _id: req.params.id, organization: req.org._id }).select('-password');
    if (!emp) return res.status(404).json({ message: 'Employee not found' });
    const tasks = await Task.find({ assignedTo: emp._id, organization: req.org._id });
    res.json({ ...emp.toObject(), tasks });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// PUT update employee — use findById + save so bcrypt hook runs
router.put('/:id', async (req, res) => {
  try {
    const emp = await Employee.findOne({ _id: req.params.id, organization: req.org._id });
    if (!emp) return res.status(404).json({ message: 'Employee not found' });

    const { name, email, role, department, skills, walletAddress, status, password, onChainHash } = req.body;

    if (name) emp.name = name;
    if (email) emp.email = email;
    if (role) emp.role = role;
    if (department) emp.department = department;
    if (skills !== undefined) emp.skills = skills;
    if (walletAddress !== undefined) emp.walletAddress = walletAddress;
    if (status) emp.status = status;
    if (onChainHash) emp.onChainHash = onChainHash;
    // Only update password if a new one is provided
    if (password && password.trim() !== '') emp.password = password;

    await emp.save(); // triggers bcrypt hook if password changed
    const result = emp.toObject();
    delete result.password;
    res.json(result);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// DELETE employee
router.delete('/:id', async (req, res) => {
  try {
    const emp = await Employee.findOneAndDelete({ _id: req.params.id, organization: req.org._id });
    if (!emp) return res.status(404).json({ message: 'Employee not found' });
    res.json({ message: 'Employee deleted' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;