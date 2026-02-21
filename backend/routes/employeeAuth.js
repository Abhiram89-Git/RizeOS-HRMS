const express = require('express');
const jwt = require('jsonwebtoken');
const Employee = require('../models/Employee');
const Task = require('../models/Task');

const router = express.Router();

const signToken = (id, orgId) =>
  jwt.sign(
    { id, orgId, type: 'employee' },
    process.env.JWT_SECRET || 'secret_key_change_in_prod',
    { expiresIn: '7d' }
  );

// POST /api/employee-auth/login  — email + password only
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ message: 'Email and password are required' });

    // Find employee by email across any org
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
        id: emp._id,
        name: emp.name,
        email: emp.email,
        role: emp.role,
        department: emp.department,
        skills: emp.skills,
        productivityScore: emp.productivityScore
      }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Middleware for employee routes
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

// GET /api/employee-auth/me
router.get('/me', empAuth, async (req, res) => {
  try {
    const emp = await Employee.findById(req.empId).select('-password');
    if (!emp) return res.status(404).json({ message: 'Employee not found' });
    res.json({ employee: emp });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/employee-auth/my-tasks
router.get('/my-tasks', empAuth, async (req, res) => {
  try {
    const tasks = await Task.find({
      assignedTo: req.empId,
      organization: req.orgId
    }).sort('-createdAt');
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
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
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;