const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const employeeSchema = new mongoose.Schema({
  organization: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, lowercase: true },
  password: { type: String, default: null }, // set by admin, employee uses this to login
  role: { type: String, required: true },
  department: { type: String, required: true },
  skills: [{ type: String }],
  walletAddress: { type: String, default: '' },
  status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  joinedAt: { type: Date, default: Date.now },
  // AI-computed fields
  productivityScore: { type: Number, default: 0, min: 0, max: 100 },
  taskCompletionRate: { type: Number, default: 0 },
  avgTaskTime: { type: Number, default: 0 }
});

// Hash password before save
employeeSchema.pre('save', async function (next) {
  if (!this.isModified('password') || !this.password) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

employeeSchema.methods.comparePassword = async function (plain) {
  if (!this.password) return false;
  return bcrypt.compare(plain, this.password);
};

// Compound index — unique email per org
employeeSchema.index({ organization: 1, email: 1 }, { unique: true });

module.exports = mongoose.model('Employee', employeeSchema);