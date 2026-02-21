const mongoose = require('mongoose');

const employeeSchema = new mongoose.Schema({
  organization: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, lowercase: true },
  role: { type: String, required: true },
  department: { type: String, required: true },
  skills: [{ type: String }],
  walletAddress: { type: String, default: '' },
  status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  joinedAt: { type: Date, default: Date.now },
  // AI-computed fields
  productivityScore: { type: Number, default: 0, min: 0, max: 100 },
  taskCompletionRate: { type: Number, default: 0 },
  avgTaskTime: { type: Number, default: 0 } // hours
});

// Compound index to ensure unique email per org
employeeSchema.index({ organization: 1, email: 1 }, { unique: true });

module.exports = mongoose.model('Employee', employeeSchema);
