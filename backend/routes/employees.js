const express = require('express');
const Employee = require('../models/Employee');
const Task = require('../models/Task');
const { protect } = require('../middleware/auth');

const router = express.Router();
router.use(protect);

// GET all employees
router.get('/', async (req, res) => {
  try {
    const employees = await Employee.find({ organization: req.org._id }).sort('-joinedAt');
    res.json(employees);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// POST create employee
router.post('/', async (req, res) => {
  try {
    const { name, email, role, department, skills, walletAddress } = req.body;
    if (!name || !email || !role || !department)
      return res.status(400).json({ message: 'Name, email, role and department required' });

    const emp = await Employee.create({
      organization: req.org._id, name, email, role, department,
      skills: skills || [], walletAddress: walletAddress || ''
    });
    res.status(201).json(emp);
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ message: 'Employee email already exists' });
    res.status(500).json({ message: err.message });
  }
});

// GET single employee
router.get('/:id', async (req, res) => {
  try {
    const emp = await Employee.findOne({ _id: req.params.id, organization: req.org._id });
    if (!emp) return res.status(404).json({ message: 'Employee not found' });
    
    const tasks = await Task.find({ assignedTo: emp._id, organization: req.org._id });
    res.json({ ...emp.toObject(), tasks });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// PUT update employee
router.put('/:id', async (req, res) => {
  try {
    const emp = await Employee.findOneAndUpdate(
      { _id: req.params.id, organization: req.org._id },
      req.body,
      { new: true, runValidators: true }
    );
    if (!emp) return res.status(404).json({ message: 'Employee not found' });
    res.json(emp);
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
