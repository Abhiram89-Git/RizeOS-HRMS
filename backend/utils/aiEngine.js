/**
 * AI Workforce Intelligence Engine
 * Features:
 * 1. Smart Task Assignment — Recommends best employee for a task
 * 2. Productivity Score — Calculates score based on task history
 */

const Employee = require('../models/Employee');
const Task = require('../models/Task');

/**
 * SMART TASK ASSIGNMENT ALGORITHM
 * 
 * Scoring factors (weighted):
 * - Skill match (40%): How many required skills does employee have?
 * - Workload (30%): Fewer active tasks = higher score
 * - Productivity history (20%): Past completion rate
 * - Department relevance (10%): Same dept as task category
 * 
 * Returns ranked list of employees with match scores and reasoning.
 */
async function smartTaskAssignment(taskId, orgId) {
  const task = await Task.findOne({ _id: taskId, organization: orgId });
  if (!task) throw new Error('Task not found');

  const employees = await Employee.find({ organization: orgId, status: 'active' });
  if (!employees.length) return [];

  // Get current active task counts per employee
  const activeTasks = await Task.aggregate([
    { $match: { organization: orgId, status: { $in: ['assigned', 'in_progress'] } } },
    { $group: { _id: '$assignedTo', count: { $sum: 1 } } }
  ]);
  const activeTaskMap = {};
  activeTasks.forEach(a => { activeTaskMap[a._id?.toString()] = a.count; });

  const requiredSkills = task.requiredSkills.map(s => s.toLowerCase());

  const scored = employees.map(emp => {
    const empSkills = emp.skills.map(s => s.toLowerCase());

    // 1. Skill match score (0-40)
    let skillScore = 0;
    let matchedSkills = [];
    let missingSkills = [];
    if (requiredSkills.length > 0) {
      matchedSkills = requiredSkills.filter(s => empSkills.includes(s));
      missingSkills = requiredSkills.filter(s => !empSkills.includes(s));
      skillScore = (matchedSkills.length / requiredSkills.length) * 40;
    } else {
      skillScore = 30; // No required skills = neutral
    }

    // 2. Workload score (0-30): fewer tasks = better
    const currentLoad = activeTaskMap[emp._id.toString()] || 0;
    const workloadScore = Math.max(0, 30 - (currentLoad * 7));

    // 3. Productivity score contribution (0-20)
    const productivityContrib = (emp.productivityScore / 100) * 20;

    // 4. Completion rate bonus (0-10)
    const completionBonus = (emp.taskCompletionRate / 100) * 10;

    const totalScore = skillScore + workloadScore + productivityContrib + completionBonus;

    // Generate human-readable reasoning
    const reasons = [];
    if (matchedSkills.length > 0) reasons.push(`Has ${matchedSkills.length}/${requiredSkills.length} required skills: ${matchedSkills.join(', ')}`);
    if (missingSkills.length > 0) reasons.push(`Missing skills: ${missingSkills.join(', ')}`);
    reasons.push(`Current workload: ${currentLoad} active task${currentLoad !== 1 ? 's' : ''}`);
    if (emp.productivityScore > 0) reasons.push(`Productivity score: ${emp.productivityScore.toFixed(1)}/100`);

    return {
      employee: {
        _id: emp._id,
        name: emp.name,
        email: emp.email,
        role: emp.role,
        department: emp.department,
        skills: emp.skills,
        productivityScore: emp.productivityScore,
        taskCompletionRate: emp.taskCompletionRate
      },
      matchScore: Math.round(Math.min(100, totalScore)),
      breakdown: {
        skillMatch: Math.round(skillScore),
        workloadScore: Math.round(workloadScore),
        productivityContrib: Math.round(productivityContrib),
        completionBonus: Math.round(completionBonus),
        currentActiveTasks: currentLoad,
        matchedSkills,
        missingSkills
      },
      reasons,
      recommendation: totalScore >= 70 ? 'Highly Recommended' : totalScore >= 45 ? 'Good Match' : 'Available'
    };
  });

  // Sort by matchScore descending
  scored.sort((a, b) => b.matchScore - a.matchScore);

  return {
    task: { _id: task._id, title: task.title, requiredSkills: task.requiredSkills, priority: task.priority },
    recommendations: scored,
    topPick: scored[0] || null,
    analysisNote: requiredSkills.length === 0
      ? 'No specific skills required — ranked by availability and productivity.'
      : `Ranked by skill match (${requiredSkills.join(', ')}), workload, and performance history.`
  };
}

/**
 * PRODUCTIVITY SCORE CALCULATOR
 * 
 * Score factors:
 * - Task completion rate (50%)
 * - On-time completion (30%): tasks completed before deadline
 * - Recency bias (20%): recent completions weighted more
 */
async function updateProductivityScore(employeeId, orgId) {
  const allTasks = await Task.find({ assignedTo: employeeId, organization: orgId });
  if (!allTasks.length) return;

  const completed = allTasks.filter(t => t.status === 'completed');
  const completionRate = (completed.length / allTasks.length) * 100;

  // On-time completion
  const tasksWithDeadline = completed.filter(t => t.deadline);
  let onTimeRate = 100;
  if (tasksWithDeadline.length > 0) {
    const onTime = tasksWithDeadline.filter(t => t.completedAt <= t.deadline);
    onTimeRate = (onTime.length / tasksWithDeadline.length) * 100;
  }

  // Recency bias: tasks completed in last 30 days
  const now = new Date();
  const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);
  const recentCompleted = completed.filter(t => t.completedAt && t.completedAt >= thirtyDaysAgo);
  const recencyBonus = Math.min(20, recentCompleted.length * 4);

  const productivityScore = Math.min(100,
    (completionRate * 0.5) + (onTimeRate * 0.3) + recencyBonus
  );

  await Employee.findByIdAndUpdate(employeeId, {
    productivityScore: Math.round(productivityScore * 10) / 10,
    taskCompletionRate: Math.round(completionRate * 10) / 10
  });
}

module.exports = { smartTaskAssignment, updateProductivityScore };
