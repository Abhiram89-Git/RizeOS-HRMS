const express = require('express');
const jwt = require('jsonwebtoken');
const Organization = require('../models/Organization');
const { protect } = require('../middleware/auth');

const router = express.Router();

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET || 'secret_key_change_in_prod', { expiresIn: '7d' });

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, industry, size } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ message: 'Name, email and password are required' });

    const existing = await Organization.findOne({ email });
    if (existing) return res.status(409).json({ message: 'Email already registered' });

    const org = await Organization.create({ name, email, password, industry, size });
    const token = signToken(org._id);

    res.status(201).json({ token, org: { id: org._id, name: org.name, email: org.email, industry: org.industry, size: org.size } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const org = await Organization.findOne({ email });
    if (!org || !(await org.comparePassword(password)))
      return res.status(401).json({ message: 'Invalid email or password' });

    const token = signToken(org._id);
    res.json({ token, org: { id: org._id, name: org.name, email: org.email, industry: org.industry, size: org.size } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/auth/me
router.get('/me', protect, (req, res) => {
  res.json({ org: req.org });
});

module.exports = router;
