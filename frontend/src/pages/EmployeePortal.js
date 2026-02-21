import React, { Component } from 'react';
import axios from 'axios';
import { CheckSquare, Clock, AlertCircle, LogOut, User, Star, ChevronRight } from 'lucide-react';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const STATUS_FLOW = { assigned: 'in_progress', in_progress: 'completed' };
const STATUS_NEXT_LABEL = { assigned: 'Start Task', in_progress: 'Mark Complete' };
const STATUS_COLORS = {
  assigned: 'var(--accent)',
  in_progress: 'var(--accent2)',
  completed: 'var(--green)'
};

class EmployeePortal extends Component {
  constructor(props) {
    super(props);
    this.state = {
      tasks: [], loading: true, updating: null
    };
  }

  componentDidMount() { this.loadTasks(); }

  getToken = () => localStorage.getItem('emp_token');

  loadTasks = async () => {
    this.setState({ loading: true });
    try {
      const { data } = await axios.get(`${API_URL}/employee-auth/my-tasks`, {
        headers: { Authorization: `Bearer ${this.getToken()}` }
      });
      this.setState({ tasks: data, loading: false });
    } catch (err) {
      this.setState({ loading: false });
    }
  };

  updateStatus = async (task) => {
    const next = STATUS_FLOW[task.status];
    if (!next) return;
    this.setState({ updating: task._id });
    try {
      const { data } = await axios.put(`${API_URL}/employee-auth/my-tasks/${task._id}`,
        { status: next },
        { headers: { Authorization: `Bearer ${this.getToken()}` } }
      );
      this.setState(prev => ({
        tasks: prev.tasks.map(t => t._id === task._id ? data : t)
      }));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update task');
    } finally {
      this.setState({ updating: null });
    }
  };

  logout = () => {
    localStorage.removeItem('emp_token');
    localStorage.removeItem('emp_data');
    this.props.onLogout();
  };

  render() {
    const { employee } = this.props;
    const { tasks, loading, updating } = this.state;

    const assigned = tasks.filter(t => t.status === 'assigned');
    const inProgress = tasks.filter(t => t.status === 'in_progress');
    const completed = tasks.filter(t => t.status === 'completed');
    const completionRate = tasks.length > 0 ? Math.round((completed.length / tasks.length) * 100) : 0;

    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
        {/* Top navbar */}
        <div style={{ background: 'var(--bg2)', borderBottom: '1px solid var(--border)', padding: '0 24px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg,var(--accent),var(--accent2))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: 'white' }}>
              {employee.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 14 }}>{employee.name}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{employee.role} • {employee.department}</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div className="ai-badge"><Star size={11} /> Score: {employee.productivityScore}/100</div>
            <button className="btn btn-outline btn-sm" onClick={this.logout}>
              <LogOut size={13} /> Logout
            </button>
          </div>
        </div>

        <div style={{ padding: '28px 32px', maxWidth: 900, margin: '0 auto' }}>
          {/* Welcome */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 24, fontWeight: 800, marginBottom: 4 }}>
              My Task Checklist 👋
            </div>
            <div className="text-muted text-sm">Welcome back, {employee.name}. Here are all your assigned tasks.</div>
          </div>

          {/* Stats row */}
          <div className="stat-grid" style={{ marginBottom: 28 }}>
            <div className="stat-card purple">
              <div className="stat-label"><CheckSquare size={11} style={{ marginRight: 4 }} />Total Tasks</div>
              <div className="stat-value">{tasks.length}</div>
              <div className="stat-sub">assigned to me</div>
            </div>
            <div className="stat-card cyan">
              <div className="stat-label"><Clock size={11} style={{ marginRight: 4 }} />In Progress</div>
              <div className="stat-value">{inProgress.length}</div>
              <div className="stat-sub">currently working</div>
            </div>
            <div className="stat-card green">
              <div className="stat-label"><CheckSquare size={11} style={{ marginRight: 4 }} />Completed</div>
              <div className="stat-value">{completed.length}</div>
              <div className="stat-sub">{completionRate}% completion rate</div>
            </div>
            <div className="stat-card yellow">
              <div className="stat-label"><AlertCircle size={11} style={{ marginRight: 4 }} />Pending</div>
              <div className="stat-value">{assigned.length}</div>
              <div className="stat-sub">not started yet</div>
            </div>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', paddingTop: 60 }}><div className="spinner" style={{ margin: '0 auto' }} /></div>
          ) : tasks.length === 0 ? (
            <div className="empty-state card">
              <div className="empty-icon"><CheckSquare /></div>
              <div style={{ fontWeight: 700, marginBottom: 8 }}>No tasks assigned yet</div>
              <div className="text-muted text-sm">Your admin hasn't assigned any tasks to you yet.</div>
            </div>
          ) : (
            <>
              {/* In Progress section */}
              {inProgress.length > 0 && (
                <div style={{ marginBottom: 28 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: 'var(--accent2)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent2)' }} />
                    In Progress ({inProgress.length})
                  </div>
                  {inProgress.map(task => (
                    <TaskCard key={task._id} task={task} updating={updating} onUpdate={this.updateStatus} />
                  ))}
                </div>
              )}

              {/* Assigned (not started) section */}
              {assigned.length > 0 && (
                <div style={{ marginBottom: 28 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: 'var(--accent)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent)' }} />
                    Assigned to Me ({assigned.length})
                  </div>
                  {assigned.map(task => (
                    <TaskCard key={task._id} task={task} updating={updating} onUpdate={this.updateStatus} />
                  ))}
                </div>
              )}

              {/* Completed section */}
              {completed.length > 0 && (
                <div style={{ marginBottom: 28 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: 'var(--green)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--green)' }} />
                    Completed ({completed.length})
                  </div>
                  {completed.map(task => (
                    <TaskCard key={task._id} task={task} updating={updating} onUpdate={this.updateStatus} />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    );
  }
}

// Task Card component
class TaskCard extends Component {
  render() {
    const { task, updating, onUpdate } = this.props;
    const nextLabel = STATUS_NEXT_LABEL[task.status];
    const isUpdating = updating === task._id;
    const isCompleted = task.status === 'completed';

    return (
      <div className="card" style={{
        marginBottom: 10, padding: '16px 20px',
        borderLeft: `3px solid ${STATUS_COLORS[task.status]}`,
        opacity: isCompleted ? 0.75 : 1
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              {/* Checkbox style indicator */}
              <div style={{
                width: 20, height: 20, borderRadius: 4, flexShrink: 0,
                background: isCompleted ? 'var(--green)' : 'transparent',
                border: `2px solid ${isCompleted ? 'var(--green)' : STATUS_COLORS[task.status]}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                {isCompleted && <span style={{ color: 'white', fontSize: 12, fontWeight: 800 }}>✓</span>}
              </div>
              <span style={{ fontWeight: 700, fontSize: 15, textDecoration: isCompleted ? 'line-through' : 'none', color: isCompleted ? 'var(--text-muted)' : 'var(--text)' }}>
                {task.title}
              </span>
              <span className={`badge badge-${task.priority}`}>{task.priority}</span>
            </div>

            {task.description && (
              <div className="text-muted text-sm" style={{ marginBottom: 8, marginLeft: 30 }}>{task.description}</div>
            )}

            <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap', marginLeft: 30 }}>
              {(task.requiredSkills || []).map(s => <span key={s} className="tag">{s}</span>)}
              {task.deadline && (
                <span style={{ fontSize: 11, color: new Date(task.deadline) < new Date() && !isCompleted ? 'var(--accent3)' : 'var(--text-muted)' }}>
                  {new Date(task.deadline) < new Date() && !isCompleted ? '⚠️ Overdue: ' : 'Due: '}
                  {new Date(task.deadline).toLocaleDateString()}
                </span>
              )}
              {task.completedAt && (
                <span style={{ fontSize: 11, color: 'var(--green)' }}>
                  ✓ Completed {new Date(task.completedAt).toLocaleDateString()}
                </span>
              )}
            </div>
          </div>

          {!isCompleted && (
            <button className="btn btn-primary btn-sm" style={{ flexShrink: 0 }}
              onClick={() => onUpdate(task)} disabled={isUpdating}>
              {isUpdating
                ? <><div className="spinner" />Updating...</>
                : <>{nextLabel} <ChevronRight size={12} /></>}
            </button>
          )}
        </div>
      </div>
    );
  }
}

export default EmployeePortal;