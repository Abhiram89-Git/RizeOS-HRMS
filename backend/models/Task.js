const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  organization: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
  title: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', default: null },
  status: {
    type: String,
    enum: ['unassigned', 'assigned', 'in_progress', 'completed'],
    default: 'unassigned'
  },
  priority: { type: String, enum: ['low', 'medium', 'high', 'critical'], default: 'medium' },
  requiredSkills: [{ type: String }],
  deadline: { type: Date },
  completedAt: { type: Date },
  onChainHash: { type: String, default: '' }, // Web3 transaction hash
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

taskSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  if (this.status === 'completed' && !this.completedAt) {
    this.completedAt = Date.now();
  }
  next();
});

module.exports = mongoose.model('Task', taskSchema);
