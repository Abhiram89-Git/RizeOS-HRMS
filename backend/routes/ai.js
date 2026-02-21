const express = require('express');
const { protect } = require('../middleware/auth');
const { smartTaskAssignment, updateProductivityScore } = require('../utils/aiEngine');
const Employee = require('../models/Employee');

const router = express.Router();
router.use(protect);

// GET AI smart task assignment recommendations
router.get('/assign/:taskId', async (req, res) => {
  try {
    const result = await smartTaskAssignment(req.params.taskId, req.org._id);
    res.json(result);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// POST recalculate all productivity scores for org
router.post('/recalculate-scores', async (req, res) => {
  try {
    const employees = await Employee.find({ organization: req.org._id });
    await Promise.all(employees.map(e => updateProductivityScore(e._id, req.org._id)));
    const updated = await Employee.find({ organization: req.org._id }).select('name productivityScore taskCompletionRate');
    res.json({ message: 'Scores recalculated', employees: updated });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
