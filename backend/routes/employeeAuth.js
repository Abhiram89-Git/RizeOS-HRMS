const express = require('express');
const jwt = require('jsonwebtoken');
const Employee = require('../models/Employee');
const Task = require('../models/Task');

const router = express.Router();

const signToken = (id, orgId) =>
  jwt.sign({ id, orgId, type: 'employee' }, process.env.JWT_SECRET || 'secret_key_change_in_prod', { expiresIn: '7d' });

// POST /api/employee-auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, orgId } = req.body;
    if (!email || !orgId)
      return res.status(400).json({ message: 'Email and Organization ID required' });

    const emp = await Employee.findOne({ email: email.toLowerCase(), organization: orgId });
    if (!emp)
      return res.status(401).json({ message: 'Employee not found in this organization' });

    if (emp.status === 'inactive')
      return res.status(403).json({ message: 'Your account is inactive. Contact admin.' });

    const token = signToken(emp._id, orgId);
    res.json({
      token,
      employee: {
        id: emp._id, name: emp.name, email: emp.email,
        role: emp.role, department: emp.department,
        skills: emp.skills, productivityScore: emp.productivityScore
      }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/employee-auth/my-tasks (protected)
router.get('/my-tasks', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'No token' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret_key_change_in_prod');
    if (decoded.type !== 'employee') return res.status(403).json({ message: 'Not an employee token' });

    const tasks = await Task.find({
      assignedTo: decoded.id,
      organization: decoded.orgId
    }).sort('-createdAt');

    res.json(tasks);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/employee-auth/my-tasks/:id (employee updates own task status)
router.put('/my-tasks/:id', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'No token' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret_key_change_in_prod');
    if (decoded.type !== 'employee') return res.status(403).json({ message: 'Not an employee token' });

    const task = await Task.findOne({ _id: req.params.id, assignedTo: decoded.id });
    if (!task) return res.status(404).json({ message: 'Task not found' });

    // Employee can only move forward — not go back
    const allowed = { assigned: 'in_progress', in_progress: 'completed' };
    if (req.body.status && !allowed[task.status])
      return res.status(400).json({ message: 'Cannot update this task status' });

    Object.assign(task, req.body);
    await task.save();
    res.json(task);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/employee-auth/me
router.get('/me', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'No token' });
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret_key_change_in_prod');
    const emp = await Employee.findById(decoded.id).select('-__v');
    if (!emp) return res.status(404).json({ message: 'Employee not found' });
    res.json({ employee: emp });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;