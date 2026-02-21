import React, { Component } from 'react';
import { API } from '../context/AuthContext';
import { Brain, Zap, Target, RefreshCw, CheckCircle, AlertTriangle, User } from 'lucide-react';

class AIInsights extends Component {
  constructor(props) {
    super(props);
    this.state = {
      tasks: [], selectedTask: '', result: null,
      loading: false, recalcLoading: false, recalcResult: null
    };
  }

  componentDidMount() {
    API.get('/tasks?status=unassigned')
      .then(r => this.setState({ tasks: r.data }))
      .catch(() => {});
  }

  analyze = async () => {
    const { selectedTask } = this.state;
    if (!selectedTask) return;
    this.setState({ loading: true, result: null });
    try {
      const { data } = await API.get(`/ai/assign/${selectedTask}`);
      this.setState({ result: data });
    } catch (err) {
      alert(err.response?.data?.message || 'AI analysis failed');
    } finally {
      this.setState({ loading: false });
    }
  };

  assignTopPick = async () => {
    const { result, selectedTask, tasks } = this.state;
    if (!result?.topPick) return;
    try {
      await API.put(`/tasks/${selectedTask}`, {
        assignedTo: result.topPick.employee._id,
        status: 'assigned'
      });
      alert(`✅ Task assigned to ${result.topPick.employee.name}!`);
      this.setState({
        tasks: tasks.filter(t => t._id !== selectedTask),
        selectedTask: '', result: null
      });
    } catch (err) {
      alert('Failed to assign task');
    }
  };

  recalculate = async () => {
    this.setState({ recalcLoading: true });
    try {
      const { data } = await API.post('/ai/recalculate-scores');
      this.setState({ recalcResult: data.employees });
    } catch (err) {
      alert('Recalculation failed');
    } finally {
      this.setState({ recalcLoading: false });
    }
  };

  scoreColor = (score) => {
    if (score >= 75) return 'var(--green)';
    if (score >= 45) return 'var(--yellow)';
    return 'var(--accent3)';
  };

  recColor = (rec) => {
    if (rec === 'Highly Recommended') return 'var(--green)';
    if (rec === 'Good Match') return 'var(--accent2)';
    return 'var(--text-muted)';
  };

  render() {
    const { tasks, selectedTask, result, loading, recalcLoading, recalcResult } = this.state;

    return (
      <div>
        <div className="page-header">
          <div>
            <div className="page-title">AI Insights</div>
            <div className="page-subtitle">Smart workforce intelligence engine</div>
          </div>
          <div className="ai-badge"><Brain size={11} /> Powered by AI</div>
        </div>

        {/* Smart Task Assignment */}
        <div className="card" style={{marginBottom:20,borderColor:'rgba(108,99,255,0.3)',background:'linear-gradient(135deg,var(--bg2),rgba(108,99,255,0.03))'}}>
          <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:16}}>
            <Target size={20} color="var(--accent)" />
            <div>
              <div style={{fontWeight:800,fontSize:17}}>Smart Task Assignment</div>
              <div className="text-muted text-sm">AI recommends best employee for any task based on skills, workload & performance</div>
            </div>
          </div>

          <div style={{display:'flex',gap:12,alignItems:'flex-end'}}>
            <div style={{flex:1}}>
              <label className="form-label">Select Unassigned Task</label>
              <select className="form-input" value={selectedTask}
                onChange={e => this.setState({ selectedTask: e.target.value, result: null })}>
                <option value="">Choose a task to analyze...</option>
                {tasks.map(t => (
                  <option key={t._id} value={t._id}>
                    [{t.priority.toUpperCase()}] {t.title}
                    {t.requiredSkills?.length > 0 ? ` — needs: ${t.requiredSkills.join(', ')}` : ''}
                  </option>
                ))}
              </select>
            </div>
            <button className="btn btn-primary" onClick={this.analyze} disabled={!selectedTask || loading} style={{flexShrink:0}}>
              {loading ? <><div className="spinner" />Analyzing...</> : <><Brain size={15} />Analyze</>}
            </button>
          </div>

          {tasks.length === 0 && (
            <div style={{marginTop:12,padding:'10px 14px',background:'rgba(255,215,64,0.08)',border:'1px solid rgba(255,215,64,0.2)',borderRadius:8,fontSize:13,color:'var(--yellow)'}}>
              <AlertTriangle size={13} style={{marginRight:6}} />
              No unassigned tasks found. Create tasks without an assignee to use this feature.
            </div>
          )}
        </div>

        {/* AI Results */}
        {result && (
          <div style={{marginBottom:20}}>
            <div style={{marginBottom:12,display:'flex',alignItems:'center',justifyContent:'space-between'}}>
              <div>
                <div style={{fontWeight:800,fontSize:16}}>
                  Results for: <span style={{color:'var(--accent)'}}>{result.task.title}</span>
                </div>
                <div className="text-muted text-sm" style={{marginTop:2}}>{result.analysisNote}</div>
              </div>
              {result.topPick && (
                <button className="btn btn-primary" onClick={this.assignTopPick}>
                  <CheckCircle size={14} /> Assign Top Pick
                </button>
              )}
            </div>

            <div style={{display:'grid',gap:10}}>
              {result.recommendations.map((rec, i) => (
                <div key={rec.employee._id} className="card" style={{
                  padding:'16px 20px',
                  borderColor: i === 0 ? 'rgba(108,99,255,0.4)' : 'var(--border)',
                  background: i === 0 ? 'linear-gradient(135deg,var(--bg2),rgba(108,99,255,0.05))' : 'var(--bg2)'
                }}>
                  <div className="flex-between">
                    <div style={{display:'flex',alignItems:'flex-start',gap:14,flex:1}}>
                      <div style={{
                        width:36,height:36,borderRadius:'50%',flexShrink:0,
                        background: i === 0 ? 'rgba(108,99,255,0.2)' : 'var(--bg3)',
                        display:'flex',alignItems:'center',justifyContent:'center',
                        border: i === 0 ? '1px solid rgba(108,99,255,0.4)' : '1px solid var(--border)'
                      }}>
                        {i === 0 ? <Zap size={16} color="var(--accent)" /> : <User size={14} color="var(--text-muted)" />}
                      </div>
                      <div style={{flex:1}}>
                        <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:4}}>
                          <span style={{fontWeight:700}}>{rec.employee.name}</span>
                          <span style={{fontSize:11,color:this.recColor(rec.recommendation),fontWeight:700,textTransform:'uppercase',letterSpacing:'0.5px'}}>
                            {rec.recommendation}
                          </span>
                          {i === 0 && <span className="ai-badge" style={{fontSize:10}}>TOP PICK</span>}
                        </div>
                        <div className="text-muted text-sm" style={{marginBottom:8}}>{rec.employee.role} • {rec.employee.department}</div>
                        <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
                          {rec.reasons.map((r, ri) => (
                            <span key={ri} style={{fontSize:11,background:'var(--bg3)',border:'1px solid var(--border)',borderRadius:6,padding:'2px 8px',color:'var(--text-muted)'}}>
                              {r}
                            </span>
                          ))}
                        </div>
                        {rec.breakdown.matchedSkills.length > 0 && (
                          <div style={{marginTop:8,display:'flex',gap:6,flexWrap:'wrap'}}>
                            {rec.breakdown.matchedSkills.map(s => (
                              <span key={s} style={{fontSize:11,background:'rgba(0,230,118,0.1)',border:'1px solid rgba(0,230,118,0.3)',borderRadius:6,padding:'2px 8px',color:'var(--green)'}}>✓ {s}</span>
                            ))}
                            {rec.breakdown.missingSkills.map(s => (
                              <span key={s} style={{fontSize:11,background:'rgba(255,107,107,0.1)',border:'1px solid rgba(255,107,107,0.3)',borderRadius:6,padding:'2px 8px',color:'var(--accent3)'}}>✗ {s}</span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    <div style={{textAlign:'right',marginLeft:16,flexShrink:0}}>
                      <div style={{fontSize:28,fontWeight:800,color:this.scoreColor(rec.matchScore)}}>{rec.matchScore}</div>
                      <div className="text-muted" style={{fontSize:10,textTransform:'uppercase',letterSpacing:'0.5px'}}>match score</div>
                      <div className="score-bar" style={{width:80,marginTop:4}}>
                        <div className="score-fill" style={{width:`${rec.matchScore}%`,background:this.scoreColor(rec.matchScore)}} />
                      </div>
                      <div style={{marginTop:8,fontSize:10,color:'var(--text-muted)',lineHeight:1.8}}>
                        <div>Skills: {rec.breakdown.skillMatch}/40</div>
                        <div>Workload: {rec.breakdown.workloadScore}/30</div>
                        <div>Productivity: {rec.breakdown.productivityContrib}/20</div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Productivity Score Recalculator */}
        <div className="card" style={{borderColor:'rgba(0,217,255,0.2)'}}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:12}}>
            <div style={{display:'flex',alignItems:'center',gap:10}}>
              <RefreshCw size={18} color="var(--accent2)" />
              <div>
                <div style={{fontWeight:700}}>Recalculate Productivity Scores</div>
                <div className="text-muted text-sm">Re-run AI scoring for all employees based on latest task data</div>
              </div>
            </div>
            <button className="btn btn-outline" onClick={this.recalculate} disabled={recalcLoading}>
              {recalcLoading ? <><div className="spinner" />Running...</> : <><RefreshCw size={13} />Recalculate All</>}
            </button>
          </div>

          {recalcResult && (
            <div style={{marginTop:16}}>
              <div style={{fontSize:12,fontWeight:700,textTransform:'uppercase',letterSpacing:'1px',color:'var(--text-muted)',marginBottom:10}}>Updated Scores</div>
              <div style={{display:'grid',grid:'auto-flow/repeat(auto-fill,minmax(200px,1fr))',gap:10}}>
                {recalcResult.map(emp => (
                  <div key={emp._id} style={{background:'var(--bg3)',border:'1px solid var(--border)',borderRadius:8,padding:'12px 14px'}}>
                    <div style={{fontWeight:600,fontSize:13,marginBottom:4}}>{emp.name}</div>
                    <div style={{display:'flex',alignItems:'center',gap:8}}>
                      <div style={{flex:1}}>
                        <div className="score-bar">
                          <div className="score-fill" style={{width:`${emp.productivityScore}%`,background:`linear-gradient(90deg,var(--accent),var(--accent2))`}} />
                        </div>
                      </div>
                      <span style={{fontWeight:800,fontSize:14,color:this.scoreColor(emp.productivityScore)}}>{emp.productivityScore}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }
}

export default AIInsights;