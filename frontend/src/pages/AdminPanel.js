import React, { Component } from 'react';
import { API, AuthContext } from '../context/AuthContext';
import {
  Users, Plus, Edit2, Trash2, X, Search,
  Shield, ToggleLeft, ToggleRight, BarChart2, Mail, Briefcase
} from 'lucide-react';

const EMPTY_FORM = {
  name: '', email: '', role: '', department: '',
  skills: '', walletAddress: '', status: 'active'
};

const STAT_COLORS = ['purple', 'cyan', 'green', 'yellow'];

class AdminPanel extends Component {
  static contextType = AuthContext;

  constructor(props) {
    super(props);
    this.state = {
      employees: [],
      loading: true,
      search: '',
      deptFilter: 'all',
      statusFilter: 'all',
      modal: null,
      form: { ...EMPTY_FORM },
      editing: null,
      saving: false,
      activeTab: 'employees' // 'employees' | 'stats'
    };
  }

  componentDidMount() { this.load(); }

  load = () => {
    this.setState({ loading: true });
    API.get('/employees')
      .then(r => this.setState({ employees: r.data, loading: false }))
      .catch(() => this.setState({ loading: false }));
  };

  openAdd = () => this.setState({ form: { ...EMPTY_FORM }, editing: null, modal: 'form' });

  openEdit = (emp) => this.setState({
    form: { ...emp, skills: (emp.skills || []).join(', ') },
    editing: emp._id,
    modal: 'form'
  });

  openView = (emp) => this.setState({ form: emp, modal: 'view' });

  save = async (e) => {
    e.preventDefault();
    this.setState({ saving: true });
    try {
      const { form, editing } = this.state;
      const payload = {
        ...form,
        skills: typeof form.skills === 'string'
          ? form.skills.split(',').map(s => s.trim()).filter(Boolean)
          : form.skills
      };
      if (editing) {
        const { data } = await API.put(`/employees/${editing}`, payload);
        this.setState(prev => ({
          employees: prev.employees.map(e => e._id === editing ? data : e)
        }));
      } else {
        const { data } = await API.post('/employees', payload);
        this.setState(prev => ({ employees: [data, ...prev.employees] }));
      }
      this.setState({ modal: null });
    } catch (err) {
      alert(err.response?.data?.message || 'Error saving employee');
    } finally {
      this.setState({ saving: false });
    }
  };

  toggleStatus = async (emp) => {
    const newStatus = emp.status === 'active' ? 'inactive' : 'active';
    const { data } = await API.put(`/employees/${emp._id}`, { status: newStatus });
    this.setState(prev => ({
      employees: prev.employees.map(e => e._id === emp._id ? data : e)
    }));
  };

  remove = async (id) => {
    if (!window.confirm('Are you sure you want to remove this employee?')) return;
    await API.delete(`/employees/${id}`);
    this.setState(prev => ({ employees: prev.employees.filter(e => e._id !== id) }));
  };

  setField = k => e => this.setState(prev => ({ form: { ...prev.form, [k]: e.target.value } }));

  getFiltered = () => {
    const { employees, search, deptFilter, statusFilter } = this.state;
    return employees.filter(e => {
      const matchSearch =
        e.name.toLowerCase().includes(search.toLowerCase()) ||
        e.email.toLowerCase().includes(search.toLowerCase()) ||
        e.role.toLowerCase().includes(search.toLowerCase()) ||
        e.department.toLowerCase().includes(search.toLowerCase());
      const matchDept = deptFilter === 'all' || e.department === deptFilter;
      const matchStatus = statusFilter === 'all' || e.status === statusFilter;
      return matchSearch && matchDept && matchStatus;
    });
  };

  getDepts = () => {
    const { employees } = this.state;
    return [...new Set(employees.map(e => e.department).filter(Boolean))];
  };

  getStats = () => {
    const { employees } = this.state;
    const active = employees.filter(e => e.status === 'active').length;
    const depts = [...new Set(employees.map(e => e.department))].length;
    const avgScore = employees.length
      ? Math.round(employees.reduce((s, e) => s + e.productivityScore, 0) / employees.length)
      : 0;
    return { total: employees.length, active, depts, avgScore };
  };

  render() {
    const { org } = this.context;
    const { loading, search, deptFilter, statusFilter, modal, form, editing, saving, activeTab } = this.state;

    const filtered = this.getFiltered();
    const depts = this.getDepts();
    const stats = this.getStats();

    const statCards = [
      { label: 'Total Employees', value: stats.total, sub: 'in your org', color: 'purple' },
      { label: 'Active Employees', value: stats.active, sub: 'currently working', color: 'green' },
      { label: 'Departments', value: stats.depts, sub: 'across org', color: 'cyan' },
      { label: 'Avg Productivity', value: stats.avgScore, sub: 'out of 100', color: 'yellow' },
    ];

    return (
      <div>
        {/* Header */}
        <div className="page-header">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Shield size={22} color="var(--accent)" />
              <div className="page-title">Admin Panel</div>
            </div>
            <div className="page-subtitle">
              Logged in as <span style={{ color: 'var(--accent)', fontWeight: 700 }}>{org?.name}</span> — Organization Admin
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              className={`btn ${activeTab === 'employees' ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => this.setState({ activeTab: 'employees' })}>
              <Users size={14} /> Manage Employees
            </button>
            <button
              className={`btn ${activeTab === 'stats' ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => this.setState({ activeTab: 'stats' })}>
              <BarChart2 size={14} /> Org Stats
            </button>
          </div>
        </div>

        {/* Admin identity card */}
        <div className="card" style={{ marginBottom: 20, borderColor: 'rgba(108,99,255,0.3)', padding: '16px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(108,99,255,0.2)', border: '2px solid var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Shield size={20} color="var(--accent)" />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: 15 }}>{org?.name}</div>
              <div className="text-muted text-sm">{org?.email}</div>
              <div style={{ marginTop: 4 }}>
                <span style={{ fontSize: 11, background: 'rgba(108,99,255,0.15)', color: 'var(--accent)', padding: '2px 10px', borderRadius: 20, fontWeight: 700 }}>
                  ORGANIZATION ADMIN
                </span>
              </div>
            </div>
            <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 2 }}>Org Size</div>
              <div style={{ fontWeight: 700 }}>{org?.size || 'N/A'}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>{org?.industry || 'N/A'}</div>
            </div>
          </div>
          {/* Org ID — admin shares this with employees */}
          <div style={{ marginTop: 16, padding: '12px 16px', background: 'rgba(0,217,255,0.06)', border: '1px solid rgba(0,217,255,0.2)', borderRadius: 10 }}>
            <div style={{ fontSize: 12, color: 'var(--accent2)', fontWeight: 700, marginBottom: 6 }}>
              🔑 Organization ID — Share with employees so they can login at /employee
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <code style={{ fontFamily: 'monospace', fontSize: 12, color: 'var(--text)', background: 'var(--bg3)', padding: '6px 12px', borderRadius: 6, flex: 1, border: '1px solid var(--border)', wordBreak: 'break-all' }}>
                {org?._id}
              </code>
              <button className="btn btn-outline btn-sm" onClick={() => { navigator.clipboard.writeText(org?._id || ''); alert('Org ID copied to clipboard!'); }}>
                Copy
              </button>
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6 }}>
              Employee portal: <span style={{ color: 'var(--accent2)' }}>{window.location.origin}/employee</span>
            </div>
          </div>
        </div>

        {/* Stat cards */}
        <div className="stat-grid" style={{ marginBottom: 20 }}>
          {statCards.map((s, i) => (
            <div key={i} className={`stat-card ${s.color}`}>
              <div className="stat-label">{s.label}</div>
              <div className="stat-value">{s.value}</div>
              <div className="stat-sub">{s.sub}</div>
            </div>
          ))}
        </div>

        {/* Employees tab */}
        {activeTab === 'employees' && (
          <>
            {/* Filters row */}
            <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
              {/* Search */}
              <div className="card" style={{ padding: '10px 14px', flex: 1, minWidth: 200 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Search size={14} style={{ color: 'var(--text-muted)' }} />
                  <input
                    style={{ background: 'transparent', border: 'none', outline: 'none', color: 'var(--text)', fontSize: 14, width: '100%', fontFamily: 'Syne,sans-serif' }}
                    placeholder="Search name, email, role..."
                    value={search}
                    onChange={e => this.setState({ search: e.target.value })}
                  />
                </div>
              </div>
              {/* Dept filter */}
              <select className="form-input" style={{ width: 160 }} value={deptFilter}
                onChange={e => this.setState({ deptFilter: e.target.value })}>
                <option value="all">All Departments</option>
                {depts.map(d => <option key={d}>{d}</option>)}
              </select>
              {/* Status filter */}
              <select className="form-input" style={{ width: 130 }} value={statusFilter}
                onChange={e => this.setState({ statusFilter: e.target.value })}>
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
              <button className="btn btn-primary" onClick={this.openAdd}>
                <Plus size={14} /> Add Employee
              </button>
            </div>

            {/* Results count */}
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 10 }}>
              Showing {filtered.length} of {this.state.employees.length} employees
            </div>

            {/* Employee cards grid */}
            {loading ? (
              <div style={{ textAlign: 'center', paddingTop: 60 }}><div className="spinner" style={{ margin: '0 auto' }} /></div>
            ) : filtered.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon"><Users /></div>
                <div>No employees found</div>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 14 }}>
                {filtered.map(emp => (
                  <div key={emp._id} className="card" style={{ padding: '18px 20px', cursor: 'pointer' }}
                    onClick={() => this.openView(emp)}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'linear-gradient(135deg,var(--accent),var(--accent2))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 800, color: 'white', flexShrink: 0 }}>
                          {emp.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: 15 }}>{emp.name}</div>
                          <div className="text-muted text-sm">{emp.role}</div>
                        </div>
                      </div>
                      <span className={`badge badge-${emp.status}`}>{emp.status}</span>
                    </div>

                    <div style={{ display: 'flex', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 4, color: 'var(--text-muted)' }}>
                        <Briefcase size={11} />{emp.department}
                      </span>
                      <span style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 4, color: 'var(--text-muted)' }}>
                        <Mail size={11} />{emp.email}
                      </span>
                    </div>

                    <div style={{ marginBottom: 10 }}>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                        {(emp.skills || []).slice(0, 4).map(s => <span key={s} className="tag">{s}</span>)}
                        {(emp.skills || []).length > 4 && <span className="tag">+{emp.skills.length - 4}</span>}
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Productivity</div>
                      <div style={{ flex: 1 }}>
                        <div className="score-bar">
                          <div className="score-fill" style={{ width: `${emp.productivityScore}%`, background: 'linear-gradient(90deg,var(--accent),var(--accent2))' }} />
                        </div>
                      </div>
                      <div style={{ fontWeight: 800, fontSize: 13 }}>{emp.productivityScore}</div>
                    </div>

                    {/* Action buttons */}
                    <div style={{ display: 'flex', gap: 8 }} onClick={e => e.stopPropagation()}>
                      <button className="btn btn-outline btn-sm" style={{ flex: 1 }}
                        onClick={() => this.openEdit(emp)}>
                        <Edit2 size={12} /> Edit
                      </button>
                      <button className="btn btn-outline btn-sm"
                        onClick={() => this.toggleStatus(emp)}
                        title={emp.status === 'active' ? 'Deactivate' : 'Activate'}>
                        {emp.status === 'active'
                          ? <ToggleRight size={14} color="var(--green)" />
                          : <ToggleLeft size={14} color="var(--text-muted)" />}
                      </button>
                      <button className="btn btn-danger btn-sm"
                        onClick={() => this.remove(emp._id)}>
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Org Stats tab */}
        {activeTab === 'stats' && (
          <div>
            <div className="grid-2" style={{ gap: 16 }}>
              {/* Department breakdown */}
              <div className="card">
                <div style={{ fontWeight: 700, marginBottom: 16 }}>Employees by Department</div>
                {depts.length === 0 ? <div className="empty-state"><div>No data</div></div> : depts.map(dept => {
                  const count = this.state.employees.filter(e => e.department === dept).length;
                  const pct = Math.round((count / this.state.employees.length) * 100);
                  return (
                    <div key={dept} style={{ marginBottom: 12 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 13 }}>
                        <span style={{ fontWeight: 600 }}>{dept}</span>
                        <span className="text-muted">{count} employees ({pct}%)</span>
                      </div>
                      <div className="score-bar" style={{ height: 8 }}>
                        <div className="score-fill" style={{ width: `${pct}%`, background: 'linear-gradient(90deg,var(--accent),var(--accent2))' }} />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Top performers */}
              <div className="card">
                <div style={{ fontWeight: 700, marginBottom: 16 }}>All Employees — Productivity Ranked</div>
                {[...this.state.employees]
                  .sort((a, b) => b.productivityScore - a.productivityScore)
                  .map((emp, i) => (
                    <div key={emp._id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                      <div style={{ width: 24, fontSize: 12, fontWeight: 700, color: i < 3 ? 'var(--accent)' : 'var(--text-muted)' }}>#{i + 1}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, fontSize: 13 }}>{emp.name}</div>
                        <div className="text-muted" style={{ fontSize: 11 }}>{emp.role} • {emp.department}</div>
                      </div>
                      <div style={{ width: 80 }}>
                        <div className="score-bar">
                          <div className="score-fill" style={{ width: `${emp.productivityScore}%`, background: emp.productivityScore >= 70 ? 'var(--green)' : emp.productivityScore >= 40 ? 'var(--yellow)' : 'var(--accent3)' }} />
                        </div>
                      </div>
                      <div style={{ fontWeight: 800, fontSize: 14, width: 32, textAlign: 'right' }}>{emp.productivityScore}</div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}

        {/* Add/Edit Modal */}
        {modal === 'form' && (
          <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && this.setState({ modal: null })}>
            <div className="modal">
              <div className="flex-between mb-16">
                <div className="modal-title" style={{ marginBottom: 0 }}>
                  {editing ? 'Edit Employee' : 'Add New Employee'}
                </div>
                <button className="btn btn-ghost btn-sm" onClick={() => this.setState({ modal: null })}><X size={16} /></button>
              </div>
              <form onSubmit={this.save}>
                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">Full Name *</label>
                    <input className="form-input" placeholder="Jane Smith" value={form.name} onChange={this.setField('name')} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Email *</label>
                    <input className="form-input" type="email" placeholder="jane@company.com" value={form.email} onChange={this.setField('email')} required />
                  </div>
                </div>
                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">Role *</label>
                    <input className="form-input" placeholder="Frontend Developer" value={form.role} onChange={this.setField('role')} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Department *</label>
                    <input className="form-input" placeholder="Engineering" value={form.department} onChange={this.setField('department')} required />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Skills (comma separated)</label>
                  <input className="form-input" placeholder="React, Node.js, MongoDB"
                    value={typeof form.skills === 'string' ? form.skills : (form.skills || []).join(', ')}
                    onChange={this.setField('skills')} />
                </div>
                <div className="form-group">
                  <label className="form-label">Wallet Address (optional)</label>
                  <input className="form-input" placeholder="0x..." value={form.walletAddress || ''} onChange={this.setField('walletAddress')} />
                </div>
                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select className="form-input" value={form.status} onChange={this.setField('status')}>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
                <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                  <button type="button" className="btn btn-outline" onClick={() => this.setState({ modal: null })}>Cancel</button>
                  <button type="submit" className="btn btn-primary" disabled={saving}>
                    {saving ? <><div className="spinner" />Saving...</> : editing ? 'Update Employee' : 'Add Employee'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* View Employee Modal */}
        {modal === 'view' && (
          <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && this.setState({ modal: null })}>
            <div className="modal">
              <div className="flex-between mb-16">
                <div className="modal-title" style={{ marginBottom: 0 }}>Employee Profile</div>
                <button className="btn btn-ghost btn-sm" onClick={() => this.setState({ modal: null })}><X size={16} /></button>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20, paddingBottom: 20, borderBottom: '1px solid var(--border)' }}>
                <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'linear-gradient(135deg,var(--accent),var(--accent2))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 800, color: 'white' }}>
                  {form.name?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div style={{ fontWeight: 800, fontSize: 18 }}>{form.name}</div>
                  <div className="text-muted">{form.role} • {form.department}</div>
                  <span className={`badge badge-${form.status}`} style={{ marginTop: 6 }}>{form.status}</span>
                </div>
              </div>
              <div className="grid-2" style={{ marginBottom: 16 }}>
                <div><div className="form-label">Email</div><div style={{ fontSize: 13 }}>{form.email}</div></div>
                <div><div className="form-label">Department</div><div style={{ fontSize: 13 }}>{form.department}</div></div>
                <div><div className="form-label">Productivity Score</div><div style={{ fontSize: 20, fontWeight: 800, color: 'var(--accent)' }}>{form.productivityScore}/100</div></div>
                <div><div className="form-label">Completion Rate</div><div style={{ fontSize: 20, fontWeight: 800, color: 'var(--green)' }}>{form.taskComplet