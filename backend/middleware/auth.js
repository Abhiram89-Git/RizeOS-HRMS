const jwt = require('jsonwebtoken');
const Organization = require('../models/Organization');

const protect = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'No token provided' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret_key_change_in_prod');
    req.org = await Organization.findById(decoded.id).select('-password');
    if (!req.org) return res.status(401).json({ message: 'Organization not found' });

    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};

module.exports = { protect };
