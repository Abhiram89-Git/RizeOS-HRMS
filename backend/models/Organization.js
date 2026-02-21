const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const organizationSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },
  industry: { type: String, default: '' },
  size: { type: String, enum: ['1-10', '11-50', '51-200', '201-500', '500+'], default: '1-10' },
  walletAddress: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now }
});

organizationSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

organizationSchema.methods.comparePassword = async function(candidate) {
  return bcrypt.compare(candidate, this.password);
};

module.exports = mongoose.model('Organization', organizationSchema);
