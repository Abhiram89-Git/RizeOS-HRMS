import React, { Component } from 'react';
import { API } from '../context/AuthContext';
import { Plus, Edit2, Trash2, X, Search, User } from 'lucide-react';

const EMPTY_FORM = { name:'', email:'', role:'', department:'', skills:'', walletAddress:'', password:'', status:'active' };

class Employees extends Component {
  constructor(props) {
    super(props);
    this.state = {
      employees: [], loading: true, search: '',
      modal: null, form: { ...EMPTY_FORM }, editing: null, saving: false
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

  save = async (e) => {
    e.preventDefault();
    this.setState({ saving: true });
    try {
      const { form, editing } = this.state;
      const payload = { ...form, skills: form.skills.split(',').map(s => s.trim()).filter(Boolean) };
      if (editing) {
        const { data } = await API.put(`/employees/${editing}`, payload);
        this.setState(prev => ({ employees: prev.employees.map(e => e._id === editing ? data : e) }));
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

  remove = async (id) => {
    if (!window.confirm('Delete this employee?')) return;
    await API.delete(`/employees/${id}`);
    this.setState(prev => ({ employees: prev.employees.filter(e => e._id !== id) }));
  };

  setField = (k) => (e) => this.setState(prev => ({ form: { ...prev.form, [k]: e.target.value } }));

  render() {
    const { employees, loading, search, modal, form, editing, saving } = this.state;

    const filtered = employees.filter(e =>
      e.name.toLowerCase().includes(search.toLowerCase()) ||
      e.role.toLowerCase().includes(search.toLowerCase()) ||
      e.department.toLowerCase().includes(search.toLowerCase())
    );

    return (
      <div>
        <div className="page-header">
          <div>
            <div className="page-title">Employees</div>
            <div className="page-subtitle">{employees.length} team members</div>
          </div>
          <button className="btn btn-primary" onClick={this.openAdd}><Plus size={15} /> Add Employee</button>
        </div>

        <div className="card" style={{padding:'12px 16px',marginBottom:16}}>
          <div style={{display:'flex',alignItems:'center',gap:10}}>
            <Search size={15} style={{color:'var(--text-muted)'}} />
            <input
              style={{background:'transparent',border:'none',outline:'none',color:'var(--text)',fontSize:14,width:'100%',fontFamily:'Syne,sans-serif'}}
              placeholder="Search by name, role, or department..."
              value={search} onChange={e => this.setState({ search: e.target.value })}
            />
          </div>
        </div>

        <div className="card" style={{padding:0}}>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Employee</th><th>Role</th><th>Department</th>
                  <th>Skills</th><th>Score</th><th>Status</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={7} style={{textAlign:'center',padding:40}}><div className="spinner" style={{margin:'0 auto'}} /></td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={7}>
                    <div className="empty-state">
                      <div className="empty-icon"><User /></div>
                      <div>{search ? 'No results found' : 'No employees yet. Add your first team member!'}</div>
                    </div>
                  </td></tr>
                ) : filtered.map(emp => (
                  <tr key={emp._id}>
                    <td>
                      <div style={{fontWeight:600}}>{emp.name}</div>
                      <div className="text-muted text-sm">{emp.email}</div>
                    </td>
                    <td>{emp.role}</td>
                    <td>{emp.department}</td>
                    <td>
                      <div style={{display:'flex',flexWrap:'wrap',gap:4}}>
                        {(emp.skills||[]).slice(0,3).map(s => <span key={s} className="tag">{s}</span>)}
                        {(emp.skills||[]).length > 3 && <span className="tag">+{emp.skills.length-3}</span>}
                      </div>
                    </td>
                    <td>
                      <div style={{display:'flex',alignItems:'center',gap:8}}>
                        <div style={{width:60}}>
                          <div className="score-bar">
                            <div className="score-fill" style={{width:`${emp.productivityScore}%`,background:'linear-gradient(90deg,var(--accent),var(--accent2))'}} />
                          </div>
                        </div>
                        <span style={{fontSize:13,fontWeight:700}}>{emp.productivityScore}</span>
                      </div>
                    </td>
                    <td><span className={`badge badge-${emp.status}`}>{emp.status}</span></td>
                    <td>
                      <div style={{display:'flex',gap:6}}>
                        <button className="btn btn-outline btn-sm" onClick={() => this.openEdit(emp)}><Edit2 size={12} /></button>
                        <button className="btn btn-danger btn-sm" onClick={() => this.remove(emp._id)}><Trash2 size={12} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {modal === 'form' && (
          <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && this.setState({ modal: null })}>
            <div className="modal">
              <div className="flex-between mb-16">
                <div className="modal-title" style={{marginBottom:0}}>{editing ? 'Edit Employee' : 'Add Employee'}</div>
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
                  <input className="form-input" placeholder="React, Node.js, MongoDB" value={form.skills} onChange={this.setField('skills')} />
                </div>
                <div className="form-group">
                  <label className="form-label">Wallet Address (optional)</label>
                  <input className="form-input" placeholder="0x..." value={form.walletAddress} onChange={this.setField('walletAddress')} />
                </div>
                <div className="form-group">
                  <label className="form-label">Login Password {editing ? '(leave blank to keep existing)' : '*'}</label>
                  <input className="form-input" type="password" placeholder="Employee uses this to login at /employee"
                    value={form.password || ''} onChange={this.setField('password')} required={!editing} />
                  <div style={{fontSize:11,color:'var(--text-muted)',marginTop:4}}>Share with employee — they login at /employee with email + this password</div>
                </div>
                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select className="form-input" value={form.status} onChange={this.setField('status')}>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
                <div style={{display:'flex',gap:10,justifyContent:'flex-end'}}>
                  <button type="button" className="btn btn-outline" onClick={() => this.setState({ modal: null })}>Cancel</button>
                  <button type="submit" className="btn btn-primary" disabled={saving}>
                    {saving ? <><div className="spinner" />Saving...</> : editing ? 'Update' : 'Add Employee'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }
}

export default Employees;