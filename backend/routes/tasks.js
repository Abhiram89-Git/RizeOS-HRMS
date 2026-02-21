const express = require('express');
const Task = require('../models/Task');
const Employee = require('../models/Employee');
const { protect } = require('../middleware/auth');
const { updateProductivityScore } = require('../utils/aiEngine');

const router = express.Router();
router.use(protect);

// GET all tasks
router.get('/', async (req, res) => {
  try {
    const { status } = req.query;
    const filter = { organization: req.org._id };
    if (status) filter.status = status;

    const tasks = await Task.find(filter)
      .populate('assignedTo', 'name email role department')
      .sort('-createdAt');
    res.json(tasks);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// POST create task
router.post('/', async (req, res) => {
  try {
    const { title, description, priority, requiredSkills, deadline } = req.body;
    if (!title) return res.status(400).json({ message: 'Title is required' });

    const task = await Task.create({
      organization: req.org._id, title, description,
      priority: priority || 'medium',
      requiredSkills: requiredSkills || [],
      deadline: deadline || null
    });
    res.status(201).json(task);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// PUT update task (status change, assignment)
router.put('/:id', async (req, res) => {
  try {
    const task = await Task.findOne({ _id: req.params.id, organization: req.org._id });
    if (!task) return res.status(404).json({ message: 'Task not found' });

    const wasCompleted = task.status !== 'completed' && req.body.status === 'completed';
    Object.assign(task, req.body);
    await task.save();

    // Recalculate productivity score when task completed
    if (wasCompleted && task.assignedTo) {
      await updateProductivityScore(task.assignedTo, req.org._id);
    }

    const populated = await task.populate('assignedTo', 'name email role department');
    res.json(populated);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// DELETE task
router.delete('/:id', async (req, res) => {
  try {
    const task = await Task.findOneAndDelete({ _id: req.params.id, organization: req.org._id });
    if (!task) return res.status(404).json({ message: 'Task not found' });
    res.json({ message: 'Task deleted' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
