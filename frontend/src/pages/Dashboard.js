import React, { Component } from 'react';
import { API, AuthContext } from '../context/AuthContext';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Users, CheckSquare, Clock, TrendingUp, Activity, Star } from 'lucide-react';

const COLORS = ['#6c63ff', '#00d9ff', '#ff6b6b', '#00e676', '#ffd740'];

class Dashboard extends Component {
  static contextType = AuthContext;

  constructor(props) {
    super(props);
    this.state = { data: null, loading: true };
  }

  componentDidMount() {
    API.get('/dashboard')
      .then(r => this.setState({ data: r.data, loading: false }))
      .catch(() => this.setState({ loading: false }));
  }

  render() {
    const { data, loading } = this.state;
    const { org } = this.context;

    if (loading) return <div style={{display:'flex',justifyContent:'center',paddingTop:80}}><div className="spinner" /></div>;
    if (!data) return null;

    const { stats, topEmployees, recentActivity, deptBreakdown } = data;

    const taskPieData = [
      { name: 'Completed', value: stats.completedTasks },
      { name: 'In Progress', value: stats.inProgressTasks },
      { name: 'Assigned', value: stats.assignedTasks },
      { name: 'Unassigned', value: stats.unassignedTasks },
    ].filter(d => d.value > 0);

    const deptData = deptBreakdown.map(d => ({
      name: d._id, employees: d.count, avgScore: Math.round(d.avgScore || 0)
    }));

    return (
      <div>
        <div className="page-header">
          <div>
            <div className="page-title">Dashboard</div>
            <div className="page-subtitle">Welcome back, {org?.name}</div>
          </div>
          <div className="ai-badge"><Activity size={11} /> Live Analytics</div>
        </div>

        <div className="stat-grid">
          <div className="stat-card purple">
            <div className="stat-label"><Users size={11} style={{marginRight:4}} />Total Employees</div>
            <div className="stat-value">{stats.totalEmployees}</div>
            <div className="stat-sub">{stats.activeEmployees} active</div>
          </div>
          <div className="stat-card cyan">
            <div className="stat-label"><CheckSquare size={11} style={{marginRight:4}} />Total Tasks</div>
            <div className="stat-value">{stats.totalTasks}</div>
            <div className="stat-sub">{stats.completionRate}% completion rate</div>
          </div>
          <div className="stat-card green">
            <div className="stat-label"><TrendingUp size={11} style={{marginRight:4}} />Completed</div>
            <div className="stat-value">{stats.completedTasks}</div>
            <div className="stat-sub">tasks done</div>
          </div>
          <div className="stat-card yellow">
            <div className="stat-label"><Clock size={11} style={{marginRight:4}} />In Progress</div>
            <div className="stat-value">{stats.inProgressTasks}</div>
            <div className="stat-sub">{stats.assignedTasks} assigned</div>
          </div>
        </div>

        <div className="grid-2" style={{marginBottom:20}}>
          <div className="card">
            <div className="flex-between mb-16">
              <div style={{fontWeight:700}}>Task Distribution</div>
            </div>
            {taskPieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={taskPieData} cx="50%" cy="50%" innerRadius={60} outerRadius={85} dataKey="value" paddingAngle={3}>
                    {taskPieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{backgroundColor:'#ffd740',border:'1px solid var(--border)',borderRadius:8,color:'green'}} />
                </PieChart>
              </ResponsiveContainer>
            ) : <div className="empty-state"><div>No assign tasks yet</div></div>}
            <div style={{display:'flex',gap:12,justifyContent:'center',flexWrap:'wrap',marginTop:8}}>
              {taskPieData.map((d,i) => (
                <div key={i} style={{display:'flex',alignItems:'center',gap:6,fontSize:12}}>
                  <div style={{width:8,height:8,borderRadius:'50%',background:COLORS[i]}} />
                  <span className="text-muted">{d.name}: {d.value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <div style={{fontWeight:700, marginBottom:16}}>Departments</div>
            {deptData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={deptData} barSize={28}>
                  <XAxis dataKey="name" tick={{fill:'var(--text-muted)',fontSize:11}} axisLine={false} tickLine={false} />
                  <YAxis tick={{fill:'var(--text-muted)',fontSize:11}} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{background:'var(--bg2)',border:'1px solid var(--border)',borderRadius:8,color:'var(--text)'}} />
                  <Bar dataKey="employees" fill="var(--accent)" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : <div className="empty-state"><div>No departments yet</div></div>}
          </div>
        </div>

        <div className="grid-2">
          <div className="card">
            <div style={{fontWeight:700, marginBottom:16}}>
              <Star size={14} style={{color:'var(--yellow)',marginRight:6}} />
              Top Performers
            </div>
            {topEmployees.length > 0 ? topEmployees.map((emp, i) => (
              <div key={emp._id} style={{display:'flex',alignItems:'center',gap:12,padding:'10px 0',borderBottom:i<topEmployees.length-1?'1px solid var(--border)':'none'}}>
                <div style={{width:28,height:28,borderRadius:'50%',background:'var(--bg3)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,fontWeight:700,color:'var(--accent)'}}>
                  #{i+1}
                </div>
                <div style={{flex:1}}>
                  <div style={{fontWeight:600,fontSize:14}}>{emp.name}</div>
                  <div className="text-muted text-sm">{emp.role} • {emp.department}</div>
                  <div className="score-bar" style={{marginTop:6}}>
                    <div className="score-fill" style={{width:`${emp.productivityScore}%`,background:`linear-gradient(90deg, var(--accent), var(--accent2))`}} />
                  </div>
                </div>
                <div style={{textAlign:'right'}}>
                  <div style={{fontWeight:800,fontSize:16}}>{emp.productivityScore}<span style={{fontSize:11,color:'var(--text-muted)'}}>/100</span></div>
                </div>
              </div>
            )) : <div className="empty-state" style={{padding:'30px 0'}}><div>No performance data yet</div></div>}
          </div>

          <div className="card">
            <div style={{fontWeight:700, marginBottom:16}}>
              <Activity size={14} style={{color:'var(--green)',marginRight:6}} />
              Recent Completions
            </div>
            {recentActivity.length > 0 ? recentActivity.map((t, i) => (
              <div key={t._id} style={{display:'flex',alignItems:'center',gap:10,padding:'8px 0',borderBottom:i<recentActivity.length-1?'1px solid var(--border)':'none'}}>
                <div style={{width:8,height:8,borderRadius:'50%',background:'var(--green)',flexShrink:0}} />
                <div style={{flex:1}}>
                  <div style={{fontSize:13,fontWeight:600}}>{t.title}</div>
                  <div className="text-muted" style={{fontSize:11}}>{t.assignedTo?.name || 'Unknown'} • {new Date(t.completedAt).toLocaleDateString()}</div>
                </div>
                <span className={`badge badge-${t.priority}`}>{t.priority}</span>
              </div>
            )) : <div className="empty-state" style={{padding:'30px 0'}}><div>No completions yet</div></div>}
          </div>
        </div>
      </div>
    );
  }
}

export default Dashboard;