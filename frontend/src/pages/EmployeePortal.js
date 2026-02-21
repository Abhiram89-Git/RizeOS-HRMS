import React, { Component } from 'react';
import axios from 'axios';
import {
  CheckSquare, Clock, AlertCircle, LogOut, Star,
  ChevronRight, User, Lock, Edit2, X, Save, Key
} from 'lucide-react';

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
      tasks: [], loading: true, updating: null,
      activeTab: 'tasks', // 'tasks' | 'profile' | 'password'
      // profile form
      profile: {
        name: props.employee.name || '',
        walletAddress: props.employee.walletAddress || '',
        skills: (props.employee.skills || []).join(', ')
      },
      profileSaving: false, profileMsg: null,
      // password form
      currentPassword: '', newPassword: '', confirmPassword: '',
      passwordSaving: false, passwordMsg: null,
    };
  }

  componentDidMount() { this.loadTasks(); }

  getToken = () => localStorage.getItem('emp_token');

  headers = () => ({ Authorization: `Bearer ${this.getToken()}` });

  loadTasks = async () => {
    this.setState({ loading: true });
    try {
      const { data } = await axios.get(`${API_URL}/employee-auth/my-tasks`, { headers: this.headers() });
      this.setState({ tasks: data, loading: false });
    } catch { this.setState({ loading: false }); }
  };

  updateStatus = async (task) => {
    const next = STATUS_FLOW[task.status];
    if (!next) return;
    this.setState({ updating: task._id });
    try {
      const { data } = await axios.put(
        `${API_URL}/employee-auth/my-tasks/${task._id}`,
        { status: next },
        { headers: this.headers() }
      );
      this.setState(prev => ({ tasks: prev.tasks.map(t => t._id === task._id ? data : t) }));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update task');
    } finally {
      this.setState({ updating: null });
    }
  };

  saveProfile = async (e) => {
    e.preventDefault();
    this.setState({ profileSaving: true, profileMsg: null });
    try {
      const { profile } = this.state;
      const { data } = await axios.put(`${API_URL}/employee-auth/profile`, {
        name: profile.name,
        walletAddress: profile.walletAddress,
        skills: profile.skills.split(',').map(s => s.trim()).filter(Boolean)
      }, { headers: this.headers() });

      // Update localStorage
      const empData = JSON.parse(localStorage.getItem('emp_data') || '{}');
      const updated = { ...empData, name: data.employee.name };
      localStorage.setItem('emp_data', JSON.stringify(updated));

      this.setState({ profileMsg: { type: 'success', text: '✅ Profile updated successfully!' } });
    } catch (err) {
      this.setState({ profileMsg: { type: 'error', text: err.response?.data?.message || 'Failed to update profile' } });
    } finally {
      this.setState({ profileSaving: false });
    }
  };

  changePassword = async (e) => {
    e.preventDefault();
    const { currentPassword, newPassword, confirmPassword } = this.state;
    if (newPassword !== confirmPassword)
      return this.setState({ passwordMsg: { type: 'error', text: 'New passwords do not match' } });
    if (newPassword.length < 6)
      return this.setState({ passwordMsg: { type: 'error', text: 'Password must be at least 6 characters' } });

    this.setState({ passwordSaving: true, passwordMsg: null });
    try {
      await axios.put(`${API_URL}/employee-auth/change-password`,
        { currentPassword, newPassword },
        { headers: this.headers() }
      );
      this.setState({
        passwordMsg: { type: 'success', text: '✅ Password changed successfully!' },
        currentPassword: '', newPassword: '', confirmPassword: ''
      });
    } catch (err) {
      this.setState({ passwordMsg: { type: 'error', text: err.response?.data?.message || 'Failed to change password' } });
    } finally {
      this.setState({ passwordSaving: false });
    }
  };

  logout = () => {
    localStorage.removeItem('emp_token');
    localStorage.removeItem('emp_data');
    this.props.onLogout();
  };

  render() {
    const { employee } = this.props;
    const { tasks, loading, updating, activeTab, profile, profileSaving, profileMsg,
      currentPassword, newPassword, confirmPassword, passwordSaving, passwordMsg } = this.state;

    const assigned = tasks.filter(t => t.status === 'assigned');
    const inProgress = tasks.filter(t => t.status === 'in_progress');
    const completed = tasks.filter(t => t.status === 'completed');
    const completionRate = tasks.length > 0 ? Math.round((completed.length / tasks.length) * 100) : 0;

    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
        {/* Navbar */}
        <div style={{ background: 'var(--bg2)', borderBottom: '1px solid var(--border)', padding: '0 24px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg,var(--accent),var(--accent2))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: 'white', fontSize: 16 }}>
              {employee.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 14 }}>{employee.name}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{employee.role} • {employee.department}</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div className="ai-badge"><Star size={11} /> Score: {employee.productivityScore}/100</div>
            <button className="btn btn-outline btn-sm" onClick={this.logout}><LogOut size={13} /> Logout</button>
          </div>
        </div>

        <div style={{ padding: '28px 32px', maxWidth: 900, margin: '0 auto' }}>
          {/* Tabs */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
            {[
              { key: 'tasks', label: 'My Tasks', icon: CheckSquare },
              { key: 'profile', label: 'Edit Profile', icon: User },
              { key: 'password', label: 'Change Password', icon: Key }
            ].map(({ key, label, icon: Icon }) => (
              <button key={key}
                className={`btn ${activeTab === key ? 'btn-primary' : 'btn-outline'}`}
                onClick={() => this.setState({ activeTab: key, profileMsg: null, passwordMsg: null })}>
                <Icon size={14} /> {label}
              </button>
            ))}
          </div>

          {/* ── TASKS TAB ── */}
          {activeTab === 'tasks' && (
            <>
              <div className="stat-grid" style={{ marginBottom: 24 }}>
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
                  <div className="stat-sub">{completionRate}% rate</div>
                </div>
                <div className="stat-card yellow">
                  <div className="stat-label"><AlertCircle size={11} style={{ marginRight: 4 }} />Pending</div>
                  <div className="stat-value">{assigned.length}</div>
                  <div className="stat-sub">not started</div>
                </div>
              </div>

              {loading ? (
                <div style={{ textAlign: 'center', paddingTop: 60 }}><div className="spinner" style={{ margin: '0 auto' }} /></div>
              ) : tasks.length === 0 ? (
                <div className="empty-state card">
                  <div className="empty-icon"><CheckSquare /></div>
                  <div style={{ fontWeight: 700, marginBottom: 8 }}>No tasks assigned yet</div>
                  <div className="text-muted text-sm">Your admin hasn't assigned any tasks yet.</div>
                </div>
              ) : (
                <>
                  {inProgress.length > 0 && (
                    <div style={{ marginBottom: 24 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: 'var(--accent2)', marginBottom: 10 }}>
                        ● In Progress ({inProgress.length})
                      </div>
                      {inProgress.map(t => <TaskCard key={t._id} task={t} updating={updating} onUpdate={this.updateStatus} />)}
                    </div>
                  )}
                  {assigned.length > 0 && (
                    <div style={{ marginBottom: 24 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: 'var(--accent)', marginBottom: 10 }}>
                        ● Assigned to Me ({assigned.length})
                      </div>
                      {assigned.map(t => <TaskCard key={t._id} task={t} updating={updating} onUpdate={this.updateStatus} />)}
                    </div>
                  )}
                  {completed.length > 0 && (
                    <div style={{ marginBottom: 24 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: 'var(--green)', marginBottom: 10 }}>
                        ● Completed ({completed.length})
                      </div>
                      {completed.map(t => <TaskCard key={t._id} task={t} updating={updating} onUpdate={this.updateStatus} />)}
                    </div>
                  )}
                </>
              )}
            </>
          )}

          {/* ── PROFILE TAB ── */}
          {activeTab === 'profile' && (
            <div className="card" style={{ maxWidth: 520 }}>
              <div style={{ fontWeight: 800, fontSize: 18, marginBottom: 4 }}>Edit Profile</div>
              <div className="text-muted text-sm" style={{ marginBottom: 24 }}>Update your name, skills and wallet address</div>

              {profileMsg && (
                <div style={{ padding: '10px 14px', borderRadius: 8, marginBottom: 16, fontSize: 14, background: profileMsg.type === 'success' ? 'rgba(0,230,118,0.1)' : 'rgba(255,107,107,0.1)', border: `1px solid ${profileMsg.type === 'success' ? 'rgba(0,230,118,0.3)' : 'rgba(255,107,107,0.3)'}`, color: profileMsg.type === 'success' ? 'var(--green)' : 'var(--accent3)' }}>
                  {profileMsg.text}
                </div>
              )}

              {/* Read-only info */}
              <div className="grid-2" style={{ marginBottom: 16 }}>
                <div>
                  <div className="form-label">Email (cannot change)</div>
                  <div style={{ fontSize: 13, padding: '8px 12px', background: 'var(--bg3)', borderRadius: 8, border: '1px solid var(--border)', color: 'var(--text-muted)' }}>{employee.email}</div>
                </div>
                <div>
                  <div className="form-label">Department (set by admin)</div>
                  <div style={{ fontSize: 13, padding: '8px 12px', background: 'var(--bg3)', borderRadius: 8, border: '1px solid var(--border)', color: 'var(--text-muted)' }}>{employee.department}</div>
                </div>
              </div>

              <form onSubmit={this.saveProfile}>
                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <input className="form-input" value={profile.name}
                    onChange={e => this.setState(prev => ({ profile: { ...prev.profile, name: e.target.value } }))} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Skills (comma separated)</label>
                  <input className="form-input" placeholder="React, Node.js, MongoDB"
                    value={profile.skills}
                    onChange={e => this.setState(prev => ({ profile: { ...prev.profile, skills: e.target.value } }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Wallet Address (optional)</label>
                  <input className="form-input" placeholder="0x..."
                    value={profile.walletAddress}
                    onChange={e => this.setState(prev => ({ profile: { ...prev.profile, walletAddress: e.target.value } }))} />
                </div>
                <button type="submit" className="btn btn-primary" disabled={profileSaving}>
                  {profileSaving ? <><div className="spinner" />Saving...</> : <><Save size={14} /> Save Profile</>}
                </button>
              </form>
            </div>
          )}

          {/* ── CHANGE PASSWORD TAB ── */}
          {activeTab === 'password' && (
            <div className="card" style={{ maxWidth: 520 }}>
              <div style={{ fontWeight: 800, fontSize: 18, marginBottom: 4 }}>Change Password</div>
              <div className="text-muted text-sm" style={{ marginBottom: 24 }}>Update your login password</div>

              {passwordMsg && (
                <div style={{ padding: '10px 14px', borderRadius: 8, marginBottom: 16, fontSize: 14, background: passwordMsg.type === 'success' ? 'rgba(0,230,118,0.1)' : 'rgba(255,107,107,0.1)', border: `1px solid ${passwordMsg.type === 'success' ? 'rgba(0,230,118,0.3)' : 'rgba(255,107,107,0.3)'}`, color: passwordMsg.type === 'success' ? 'var(--green)' : 'var(--accent3)' }}>
                  {passwordMsg.text}
                </div>
              )}

              <form onSubmit={this.changePassword}>
                <div className="form-group">
                  <label className="form-label"><Lock size={11} style={{ marginRight: 4 }} />Current Password</label>
                  <input className="form-input" type="password" placeholder="Your current password"
                    value={currentPassword} onChange={e => this.setState({ currentPassword: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label className="form-label"><Key size={11} style={{ marginRight: 4 }} />New Password</label>
                  <input className="form-input" type="password" placeholder="Min 6 characters"
                    value={newPassword} onChange={e => this.setState({ newPassword: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label className="form-label"><Key size={11} style={{ marginRight: 4 }} />Confirm New Password</label>
                  <input className="form-input" type="password" placeholder="Repeat new password"
                    value={confirmPassword} onChange={e => this.setState({ confirmPassword: e.target.value })} required />
                </div>
                <button type="submit" className="btn btn-primary" disabled={passwordSaving}>
                  {passwordSaving ? <><div className="spinner" />Changing...</> : <><Key size={14} /> Change Password</>}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    );
  }
}

// Task Card
class TaskCard extends Component {
  render() {
    const { task, updating, onUpdate } = this.props;
    const nextLabel = STATUS_NEXT_LABEL[task.status];
    const isUpdating = updating === task._id;
    const isCompleted = task.status === 'completed';

    return (
      <div className="card" style={{ marginBottom: 10, padding: '16px 20px', borderLeft: `3px solid ${STATUS_COLORS[task.status]}`, opacity: isCompleted ? 0.75 : 1 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              <div style={{ width: 20, height: 20, borderRadius: 4, flexShrink: 0, background: isCompleted ? 'var(--green)' : 'transparent', border: `2px solid ${isCompleted ? 'var(--green)' : STATUS_COLORS[task.status]}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {isCompleted && <span style={{ color: 'white', fontSize: 12, fontWeight: 800 }}>✓</span>}
              </div>
              <span style={{ fontWeight: 700, fontSize: 15, textDecoration: isCompleted ? 'line-through' : 'none', color: isCompleted ? 'var(--text-muted)' : 'var(--text)' }}>
                {task.title}
              </span>
              <span className={`badge badge-${task.priority}`}>{task.priority}</span>
            </div>
            {task.description && <div className="text-muted text-sm" style={{ marginBottom: 8, marginLeft: 30 }}>{task.description}</div>}
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', marginLeft: 30 }}>
              {(task.requiredSkills || []).map(s => <span key={s} className="tag">{s}</span>)}
              {task.deadline && (
                <span style={{ fontSize: 11, color: new Date(task.deadline) < new Date() && !isCompleted ? 'var(--accent3)' : 'var(--text-muted)' }}>
                  {new Date(task.deadline) < new Date() && !isCompleted ? '⚠️ Overdue: ' : 'Due: '}
                  {new Date(task.deadline).toLocaleDateString()}
                </span>
              )}
              {task.completedAt && <span style={{ fontSize: 11, color: 'var(--green)' }}>✓ Completed {new Date(task.completedAt).toLocaleDateString()}</span>}
            </div>
          </div>
          {!isCompleted && (
            <button className="btn btn-primary btn-sm" style={{ flexShrink: 0 }}
              onClick={() => onUpdate(task)} disabled={isUpdating}>
              {isUpdating ? <><div className="spinner" />Updating...</> : <>{nextLabel} <ChevronRight size={12} /></>}
            </button>
          )}
        </div>
      </div>
    );
  }
}

export default EmployeePortal;