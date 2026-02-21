import React, { Component } from 'react';
import { API } from '../context/AuthContext';
import { Plus, X, CheckSquare } from 'lucide-react';

const EMPTY_FORM = { title:'', description:'', priority:'medium', requiredSkills:'', deadline:'', assignedTo:'' };
const STATUS_FLOW = { unassigned:'assigned', assigned:'in_progress', in_progress:'completed' };
const STATUS_LABEL = { unassigned:'Assign', assigned:'Start', in_progress:'Complete', completed:'Done' };

class Tasks extends Component {
  constructor(props) {
    super(props);
    this.state = {
      tasks: [], employees: [], loading: true,
      modal: null, form: { ...EMPTY_FORM },
      filter: 'all', saving: false
    };
  }

  componentDidMount() { this.load(); }

  load = () => {
    this.setState({ loading: true });
    Promise.all([API.get('/tasks'), API.get('/employees')])
      .then(([t, e]) => this.setState({ tasks: t.data, employees: e.data, loading: false }))
      .catch(() => this.setState({ loading: false }));
  };

  setField = (k) => (e) => this.setState(prev => ({ form: { ...prev.form, [k]: e.target.value } }));

  save = async (e) => {
    e.preventDefault();
    this.setState({ saving: true });
    try {
      const { form } = this.state;
      const payload = {
        ...form,
        requiredSkills: form.requiredSkills.split(',').map(s => s.trim()).filter(Boolean),
        assignedTo: form.assignedTo || null,
        status: form.assignedTo ? 'assigned' : 'unassigned',
        deadline: form.deadline || null
      };
      const { data } = await API.post('/tasks', payload);
      if (form.assignedTo) {
        const { data: updated } = await API.put(`/tasks/${data._id}`, { assignedTo: form.assignedTo, status: 'assigned' });
        this.setState(prev => ({ tasks: [updated, ...prev.tasks] }));
      } else {
        this.setState(prev => ({ tasks: [data, ...prev.tasks] }));
      }
      this.setState({ modal: null, form: { ...EMPTY_FORM } });
    } catch (err) {
      alert(err.response?.data?.message || 'Error creating task');
    } finally {
      this.setState({ saving: false });
    }
  };

  advanceStatus = async (task) => {
    const next = STATUS_FLOW[task.status];
    if (!next) return;
    const { data } = await API.put(`/tasks/${task._id}`, { status: next });
    this.setState(prev => ({ tasks: prev.tasks.map(t => t._id === task._id ? data : t) }));
  };

  assignEmployee = async (taskId, empId) => {
    const { data } = await API.put(`/tasks/${taskId}`, { assignedTo: empId || null, status: empId ? 'assigned' : 'unassigned' });
    this.setState(prev => ({ tasks: prev.tasks.map(t => t._id === taskId ? data : t) }));
  };

  remove = async (id) => {
    if (!window.confirm('Delete task?')) return;
    await API.delete(`/tasks/${id}`);
    this.setState(prev => ({ tasks: prev.tasks.filter(t => t._id !== id) }));
  };

  render() {
    const { tasks, employees, loading, modal, form, filter, saving } = this.state;

    const filtered = filter === 'all' ? tasks : tasks.filter(t => t.status === filter);
    const statusCounts = tasks.reduce((acc, t) => { acc[t.status] = (acc[t.status] || 0) + 1; return acc; }, {});

    return (
      <div>
        <div className="page-header">
          <div>
            <div className="page-title">Tasks</div>
            <div className="page-subtitle">{tasks.length} total tasks</div>
          </div>
          <button className="btn btn-primary" onClick={() => this.setState({ form: { ...EMPTY_FORM }, modal: 'form' })}>
            <Plus size={15} /> New Task
          </button>
        </div>

        <div style={{display:'flex',gap:8,marginBottom:20,flexWrap:'wrap'}}>
          {['all','unassigned','assigned','in_progress','completed'].map(s => (
            <button key={s} onClick={() => this.setState({ filter: s })}
              className={`btn btn-sm ${filter === s ? 'btn-primary' : 'btn-outline'}`}>
              {s.replace('_',' ')}
              {s !== 'all' && statusCounts[s] ? ` (${statusCounts[s]})` : s === 'all' ? ` (${tasks.length})` : ''}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{textAlign:'center',paddingTop:60}}><div className="spinner" style={{margin:'0 auto'}} /></div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon"><CheckSquare /></div>
            <div>No tasks here yet</div>
          </div>
        ) : (
          <div style={{display:'grid',gap:12}}>
            {filtered.map(task => (
              <div key={task._id} className="card" style={{padding:'18px 20px'}}>
                <div className="flex-between">
                  <div style={{flex:1}}>
                    <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:6}}>
                      <span style={{fontWeight:700,fontSize:15}}>{task.title}</span>
                      <span className={`badge badge-${task.priority}`}>{task.priority}</span>
                      <span className={`badge badge-${task.status}`}>{task.status.replace('_',' ')}</span>
                    </div>
                    {task.description && <div className="text-muted text-sm" style={{marginBottom:8}}>{task.description}</div>}
                    <div style={{display:'flex',gap:12,alignItems:'center',flexWrap:'wrap'}}>
                      {(task.requiredSkills||[]).map(s => <span key={s} className="tag">{s}</span>)}
                      {task.deadline && <span className="text-muted text-sm">Due: {new Date(task.deadline).toLocaleDateString()}</span>}
                      {task.onChainHash && <span className="ai-badge" style={{fontSize:10}}>⛓ On-Chain</span>}
                    </div>
                  </div>
                  <div style={{display:'flex',gap:8,alignItems:'center',marginLeft:16}}>
                    <select className="form-input btn-sm" style={{paddingRight:28,cursor:'pointer',minWidth:130}}
                      value={task.assignedTo?._id || task.assignedTo || ''}
                      onChange={e => this.assignEmployee(task._id, e.target.value)}>
                      <option value="">Unassigned</option>
                      {employees.map(e => <option key={e._id} value={e._id}>{e.name}</option>)}
                    </select>
                    {task.status !== 'completed' && (
                      <button className="btn btn-primary btn-sm" onClick={() => this.advanceStatus(task)}>
                        {STATUS_LABEL[task.status]}
                      </button>
                    )}
                    <button className="btn btn-danger btn-sm" onClick={() => this.remove(task._id)}><X size={12} /></button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {modal === 'form' && (
          <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && this.setState({ modal: null })}>
            <div className="modal">
              <div className="flex-between mb-16">
                <div className="modal-title" style={{marginBottom:0}}>Create New Task</div>
                <button className="btn btn-ghost btn-sm" onClick={() => this.setState({ modal: null })}><X size={16} /></button>
              </div>
              <form onSubmit={this.save}>
                <div className="form-group">
                  <label className="form-label">Task Title *</label>
                  <input className="form-input" placeholder="Implement user auth" value={form.title} onChange={this.setField('title')} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Description</label>
                  <textarea className="form-input" rows={3} placeholder="Task details..." value={form.description} onChange={this.setField('description')} />
                </div>
                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">Priority</label>
                    <select className="form-input" value={form.priority} onChange={this.setField('priority')}>
                      {['low','medium','high','critical'].map(p => <option key={p}>{p}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Deadline</label>
                    <input className="form-input" type="date" value={form.deadline} onChange={this.setField('deadline')} />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Required Skills (comma separated)</label>
                  <input className="form-input" placeholder="React, TypeScript" value={form.requiredSkills} onChange={this.setField('requiredSkills')} />
                </div>
                <div className="form-group">
                  <label className="form-label">Assign To (optional)</label>
                  <select className="form-input" value={form.assignedTo} onChange={this.setField('assignedTo')}>
                    <option value="">Leave unassigned</option>
                    {employees.map(e => <option key={e._id} value={e._id}>{e.name} — {e.role}</option>)}
                  </select>
                </div>
                <div style={{display:'flex',gap:10,justifyContent:'flex-end'}}>
                  <button type="button" className="btn btn-outline" onClick={() => this.setState({ modal: null })}>Cancel</button>
                  <button type="submit" className="btn btn-primary" disabled={saving}>
                    {saving ? <><div className="spinner" />Creating...</> : 'Create Task'}
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

export default Tasks;