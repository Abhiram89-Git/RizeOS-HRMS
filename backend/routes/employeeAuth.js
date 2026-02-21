const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const Employee = require('../models/Employee');
const Task = require('../models/Task');

const router = express.Router();

const signToken = (id, orgId) =>
  jwt.sign(
    { id, orgId, type: 'employee' },
    process.env.JWT_SECRET || 'secret_key_change_in_prod',
    { expiresIn: '7d' }
  );

// Middleware
const empAuth = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'No token' });
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret_key_change_in_prod');
    if (decoded.type !== 'employee') return res.status(403).json({ message: 'Not an employee token' });
    req.empId = decoded.id;
    req.orgId = decoded.orgId;
    next();
  } catch {
    res.status(401).json({ message: 'Invalid token' });
  }
};

// POST /api/employee-auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ message: 'Email and password are required' });

    const emp = await Employee.findOne({ email: email.toLowerCase() });
    if (!emp)
      return res.status(401).json({ message: 'Invalid email or password' });

    if (emp.status === 'inactive')
      return res.status(403).json({ message: 'Your account is inactive. Contact your admin.' });

    if (!emp.password)
      return res.status(401).json({ message: 'No password set. Ask your admin to set your password.' });

    const valid = await emp.comparePassword(password);
    if (!valid)
      return res.status(401).json({ message: 'Invalid email or password' });

    const token = signToken(emp._id, emp.organization);
    res.json({
      token,
      employee: {
        id: emp._id, name: emp.name, email: emp.email,
        role: emp.role, department: emp.department,
        skills: emp.skills, productivityScore: emp.productivityScore,
        walletAddress: emp.walletAddress
      }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/employee-auth/me
router.get('/me', empAuth, async (req, res) => {
  try {
    const emp = await Employee.findById(req.empId).select('-password');
    if (!emp) return res.status(404).json({ message: 'Employee not found' });
    res.json({ employee: emp });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// PUT /api/employee-auth/profile — update own profile
router.put('/profile', empAuth, async (req, res) => {
  try {
    const emp = await Employee.findById(req.empId);
    if (!emp) return res.status(404).json({ message: 'Employee not found' });

    const { name, walletAddress, skills } = req.body;
    if (name) emp.name = name;
    if (walletAddress !== undefined) emp.walletAddress = walletAddress;
    if (skills !== undefined) emp.skills = skills;

    await emp.save();
    const result = emp.toObject();
    delete result.password;
    res.json({ employee: result });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// PUT /api/employee-auth/change-password
router.put('/change-password', empAuth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword)
      return res.status(400).json({ message: 'Current and new password required' });
    if (newPassword.length < 6)
      return res.status(400).json({ message: 'New password must be at least 6 characters' });

    const emp = await Employee.findById(req.empId);
    if (!emp) return res.status(404).json({ message: 'Employee not found' });

    const valid = await emp.comparePassword(currentPassword);
    if (!valid) return res.status(401).json({ message: 'Current password is incorrect' });

    emp.password = newPassword; // bcrypt hook will hash it
    await emp.save();
    res.json({ message: 'Password changed successfully' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// GET /api/employee-auth/my-tasks
router.get('/my-tasks', empAuth, async (req, res) => {
  try {
    const tasks = await Task.find({
      assignedTo: req.empId,
      organization: req.orgId
    }).sort('-createdAt');
    res.json(tasks);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// PUT /api/employee-auth/my-tasks/:id
router.put('/my-tasks/:id', empAuth, async (req, res) => {
  try {
    const task = await Task.findOne({ _id: req.params.id, assignedTo: req.empId });
    if (!task) return res.status(404).json({ message: 'Task not found' });

    const allowed = { assigned: 'in_progress', in_progress: 'completed' };
    if (req.body.status && !allowed[task.status])
      return res.status(400).json({ message: 'Cannot update this task status' });

    Object.assign(task, req.body);
    if (req.body.status === 'completed') task.completedAt = new Date();
    await task.save();
    res.json(task);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;