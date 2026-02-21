const express = require('express');
const Employee = require('../models/Employee');
const Task = require('../models/Task');
const { protect } = require('../middleware/auth');

const router = express.Router();
router.use(protect);

router.get('/', async (req, res) => {
  try {
    const orgId = req.org._id;

    const [
      totalEmployees, activeEmployees,
      totalTasks, completedTasks, inProgressTasks, assignedTasks,
      topEmployees
    ] = await Promise.all([
      Employee.countDocuments({ organization: orgId }),
      Employee.countDocuments({ organization: orgId, status: 'active' }),
      Task.countDocuments({ organization: orgId }),
      Task.countDocuments({ organization: orgId, status: 'completed' }),
      Task.countDocuments({ organization: orgId, status: 'in_progress' }),
      Task.countDocuments({ organization: orgId, status: 'assigned' }),
      Employee.find({ organization: orgId, status: 'active' })
        .sort('-productivityScore')
        .limit(5)
        .select('name role department productivityScore taskCompletionRate')
    ]);

    // Recent activity: last 10 completed tasks
    const recentActivity = await Task.find({ organization: orgId, status: 'completed' })
      .populate('assignedTo', 'name')
      .sort('-completedAt')
      .limit(10)
      .select('title assignedTo completedAt priority');

    // Dept breakdown
    const deptBreakdown = await Employee.aggregate([
      { $match: { organization: orgId } },
      { $group: { _id: '$department', count: { $sum: 1 }, avgScore: { $avg: '$productivityScore' } } },
      { $sort: { count: -1 } }
    ]);

    res.json({
      stats: {
        totalEmployees, activeEmployees,
        totalTasks, completedTasks, inProgressTasks, assignedTasks,
        unassignedTasks: totalTasks - completedTasks - inProgressTasks - assignedTasks,
        completionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
      },
      topEmployees,
      recentActivity,
      deptBreakdown
    });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
