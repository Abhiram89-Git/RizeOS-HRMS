import React, { Component } from 'react';
import { API } from '../context/AuthContext';
import {
  connectWallet, getConnectedAccount, logTaskOnChain,
  logPayrollOnChain, logActivityOnChain, fetchOnChainLogs,
  shortAddress, isMetaMaskInstalled
} from '../utils/web3';

class Web3Page extends Component {
  constructor(props) {
    super(props);
    this.state = {
      wallet: null,
      connecting: false,
      tasks: [],
      employees: [],
      logs: [],
      logsLoading: false,
      txLoading: null, // 'task' | 'payroll' | 'activity' | null
      txHash: null,
      txError: null,
      // payroll form
      payrollEmp: '',
      payrollAmount: '',
      // activity form
      activityType: 'check-in',
      activityData: '',
      // tab
      activeTab: 'tasks'
    };
  }

  async componentDidMount() {
    const account = await getConnectedAccount();
    if (account) this.setState({ wallet: account });

    // Listen for account changes
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', (accounts) => {
        this.setState({ wallet: accounts[0] || null });
      });
    }

    Promise.all([
      API.get('/tasks?status=completed'),
      API.get('/employees')
    ]).then(([t, e]) => this.setState({ tasks: t.data, employees: e.data }))
      .catch(() => {});
  }

  connect = async () => {
    this.setState({ connecting: true, txError: null });
    try {
      const account = await connectWallet();
      this.setState({ wallet: account });
    } catch (err) {
      this.setState({ txError: err.message });
    } finally {
      this.setState({ connecting: false });
    }
  };

  logTask = async (task) => {
    this.setState({ txLoading: task._id, txHash: null, txError: null });
    try {
      const empId = task.assignedTo?._id || task.assignedTo || 'unknown';
      const hash = await logTaskOnChain(task._id, empId, task.title);
      // Save hash to backend
      await API.put(`/tasks/${task._id}`, { onChainHash: hash });
      this.setState(prev => ({
        tasks: prev.tasks.map(t => t._id === task._id ? { ...t, onChainHash: hash } : t),
        txHash: hash
      }));
    } catch (err) {
      this.setState({ txError: err.message || 'Transaction failed' });
    } finally {
      this.setState({ txLoading: null });
    }
  };

  logPayroll = async (e) => {
    e.preventDefault();
    const { payrollEmp, payrollAmount } = this.state;
    this.setState({ txLoading: 'payroll', txHash: null, txError: null });
    try {
      const hash = await logPayrollOnChain(payrollEmp, parseInt(payrollAmount) * 100, 'INR');
      this.setState({ txHash: hash, payrollEmp: '', payrollAmount: '' });
    } catch (err) {
      this.setState({ txError: err.message || 'Transaction failed' });
    } finally {
      this.setState({ txLoading: null });
    }
  };

  logActivity = async (e) => {
    e.preventDefault();
    const { activityType, activityData } = this.state;
    this.setState({ txLoading: 'activity', txHash: null, txError: null });
    try {
      // Create a simple hash from the activity data
      const encoder = new TextEncoder();
      const data = encoder.encode(activityData + Date.now());
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const activityHash = '0x' + hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

      const hash = await logActivityOnChain(activityType, activityHash);
      this.setState({ txHash: hash, activityData: '' });
    } catch (err) {
      this.setState({ txError: err.message || 'Transaction failed' });
    } finally {
      this.setState({ txLoading: null });
    }
  };

  fetchLogs = async () => {
    this.setState({ logsLoading: true });
    try {
      const logs = await fetchOnChainLogs();
      this.setState({ logs });
    } catch (err) {
      this.setState({ txError: 'Failed to fetch logs: ' + err.message });
    } finally {
      this.setState({ logsLoading: false });
    }
  };

  render() {
    const {
      wallet, connecting, tasks, employees, logs, logsLoading,
      txLoading, txHash, txError, payrollEmp, payrollAmount,
      activityType, activityData, activeTab
    } = this.state;

    const notInstalled = !isMetaMaskInstalled();

    return (
      <div>
        <div className="page-header">
          <div>
            <div className="page-title">Web3 Workforce Logging</div>
            <div className="page-subtitle">Log workforce events on Polygon Mumbai testnet</div>
          </div>
          <div className="ai-badge">⛓ Blockchain</div>
        </div>

        {/* Wallet Connection */}
        <div className="card" style={{marginBottom:20, borderColor: wallet ? 'rgba(0,230,118,0.3)' : 'rgba(108,99,255,0.3)'}}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
            <div style={{display:'flex',alignItems:'center',gap:14}}>
              <div style={{fontSize:32}}>🦊</div>
              <div>
                <div style={{fontWeight:800,fontSize:16}}>MetaMask Wallet</div>
                {wallet ? (
                  <div style={{display:'flex',alignItems:'center',gap:8,marginTop:4}}>
                    <div style={{width:8,height:8,borderRadius:'50%',background:'var(--green)'}} />
                    <span style={{color:'var(--green)',fontWeight:700,fontFamily:'monospace'}}>{shortAddress(wallet)}</span>
                    <span className="text-muted text-sm">Connected on Polygon Mumbai</span>
                  </div>
                ) : (
                  <div className="text-muted text-sm" style={{marginTop:4}}>
                    {notInstalled ? 'MetaMask not detected' : 'Not connected'}
                  </div>
                )}
              </div>
            </div>
            {!wallet && (
              <button className="btn btn-primary" onClick={this.connect} disabled={connecting || notInstalled}>
                {connecting ? <><div className="spinner" />Connecting...</> : '🔗 Connect MetaMask'}
              </button>
            )}
            {notInstalled && (
              <a href="https://metamask.io/download/" target="_blank" rel="noreferrer"
                className="btn btn-outline">Install MetaMask</a>
            )}
          </div>

          {wallet && (
            <div style={{marginTop:16,display:'flex',gap:12,flexWrap:'wrap'}}>
              <div style={{background:'var(--bg3)',border:'1px solid var(--border)',borderRadius:8,padding:'10px 16px',fontSize:12}}>
                <div className="text-muted" style={{marginBottom:2}}>Network</div>
                <div style={{fontWeight:700,color:'var(--accent)'}}>Polygon Mumbai</div>
              </div>
              <div style={{background:'var(--bg3)',border:'1px solid var(--border)',borderRadius:8,padding:'10px 16px',fontSize:12}}>
                <div className="text-muted" style={{marginBottom:2}}>Full Address</div>
                <div style={{fontWeight:600,fontFamily:'monospace',fontSize:11}}>{wallet}</div>
              </div>
              <a href={`https://mumbai.polygonscan.com/address/${wallet}`} target="_blank" rel="noreferrer"
                className="btn btn-outline btn-sm" style={{alignSelf:'center'}}>
                View on Explorer ↗
              </a>
            </div>
          )}
        </div>

        {/* Tx result banner */}
        {txHash && (
          <div style={{background:'rgba(0,230,118,0.08)',border:'1px solid rgba(0,230,118,0.3)',borderRadius:10,padding:'12px 16px',marginBottom:16,display:'flex',alignItems:'center',justifyContent:'space-between'}}>
            <div>
              <div style={{color:'var(--green)',fontWeight:700,marginBottom:4}}>✅ Transaction Confirmed!</div>
              <div style={{fontFamily:'monospace',fontSize:12,color:'var(--text-muted)'}}>{txHash}</div>
            </div>
            <a href={`https://mumbai.polygonscan.com/tx/${txHash}`} target="_blank" rel="noreferrer"
              className="btn btn-outline btn-sm">View Tx ↗</a>
          </div>
        )}

        {txError && (
          <div style={{background:'rgba(255,107,107,0.08)',border:'1px solid rgba(255,107,107,0.3)',borderRadius:10,padding:'12px 16px',marginBottom:16,color:'var(--accent3)',fontSize:14}}>
            ⚠️ {txError}
          </div>
        )}

        {/* Tabs */}
        <div style={{display:'flex',gap:8,marginBottom:20}}>
          {['tasks','payroll','activity','logs'].map(tab => (
            <button key={tab} onClick={() => this.setState({ activeTab: tab })}
              className={`btn btn-sm ${activeTab === tab ? 'btn-primary' : 'btn-outline'}`}>
              {tab === 'tasks' && '✅ Task Completion'}
              {tab === 'payroll' && '💸 Payroll Proof'}
              {tab === 'activity' && '📋 Activity Log'}
              {tab === 'logs' && '🔍 View On-Chain Logs'}
            </button>
          ))}
        </div>

        {/* Task Completion Tab */}
        {activeTab === 'tasks' && (
          <div className="card">
            <div style={{fontWeight:800,fontSize:16,marginBottom:4}}>Log Task Completions On-Chain</div>
            <div className="text-muted text-sm" style={{marginBottom:20}}>
              Records task completion as an immutable event on Polygon. Each log stores task ID, employee ID, title, and timestamp.
            </div>
            {tasks.length === 0 ? (
              <div className="empty-state"><div>No completed tasks found. Complete some tasks first.</div></div>
            ) : (
              <div style={{display:'grid',gap:10}}>
                {tasks.map(task => (
                  <div key={task._id} style={{
                    display:'flex',alignItems:'center',justifyContent:'space-between',
                    padding:'14px 16px',
                    background:'var(--bg3)',border:'1px solid var(--border)',borderRadius:10
                  }}>
                    <div>
                      <div style={{fontWeight:600,fontSize:14}}>{task.title}</div>
                      <div className="text-muted text-sm" style={{marginTop:2}}>
                        Assigned to: {task.assignedTo?.name || 'Unknown'} •
                        Completed: {task.completedAt ? new Date(task.completedAt).toLocaleDateString() : 'N/A'}
                      </div>
                      {task.onChainHash && (
                        <div style={{marginTop:6,display:'flex',alignItems:'center',gap:8}}>
                          <span style={{fontSize:11,color:'var(--green)',fontWeight:700}}>⛓ Logged on-chain</span>
                          <a href={`https://mumbai.polygonscan.com/tx/${task.onChainHash}`}
                            target="_blank" rel="noreferrer"
                            style={{fontSize:11,color:'var(--accent2)'}}>
                            {shortAddress(task.onChainHash)} ↗
                          </a>
                        </div>
                      )}
                    </div>
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => this.logTask(task)}
                      disabled={!wallet || txLoading === task._id || !!task.onChainHash}
                      style={{flexShrink:0, marginLeft:12}}
                    >
                      {txLoading === task._id ? <><div className="spinner" />Logging...</>
                        : task.onChainHash ? '✓ Logged'
                        : '⛓ Log On-Chain'}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Payroll Tab */}
        {activeTab === 'payroll' && (
          <div className="card">
            <div style={{fontWeight:800,fontSize:16,marginBottom:4}}>Log Payroll Proof On-Chain</div>
            <div className="text-muted text-sm" style={{marginBottom:20}}>
              Records a payroll disbursement as an immutable proof. Useful for audits, visa applications, and compliance.
            </div>
            <form onSubmit={this.logPayroll}>
              <div className="form-group">
                <label className="form-label">Select Employee</label>
                <select className="form-input" value={payrollEmp}
                  onChange={e => this.setState({ payrollEmp: e.target.value })} required>
                  <option value="">Choose employee...</option>
                  {employees.map(e => (
                    <option key={e._id} value={e._id}>{e.name} — {e.role}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Amount (₹)</label>
                <input className="form-input" type="number" placeholder="50000"
                  value={payrollAmount} onChange={e => this.setState({ payrollAmount: e.target.value })} required />
              </div>
              <button type="submit" className="btn btn-primary" disabled={!wallet || txLoading === 'payroll'}>
                {txLoading === 'payroll' ? <><div className="spinner" />Processing...</> : '💸 Log Payroll On-Chain'}
              </button>
            </form>
          </div>
        )}

        {/* Activity Tab */}
        {activeTab === 'activity' && (
          <div className="card">
            <div style={{fontWeight:800,fontSize:16,marginBottom:4}}>Log Workforce Activity</div>
            <div className="text-muted text-sm" style={{marginBottom:20}}>
              Hash and store any workforce event on-chain. The activity data is SHA-256 hashed before logging.
            </div>
            <form onSubmit={this.logActivity}>
              <div className="form-group">
                <label className="form-label">Activity Type</label>
                <select className="form-input" value={activityType}
                  onChange={e => this.setState({ activityType: e.target.value })}>
                  <option value="check-in">Check-in</option>
                  <option value="check-out">Check-out</option>
                  <option value="performance-review">Performance Review</option>
                  <option value="contract-signed">Contract Signed</option>
                  <option value="promotion">Promotion</option>
                  <option value="custom">Custom</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Activity Details</label>
                <textarea className="form-input" rows={3}
                  placeholder="Describe the activity (will be SHA-256 hashed before storing)"
                  value={activityData} onChange={e => this.setState({ activityData: e.target.value })} required />
              </div>
              <button type="submit" className="btn btn-primary" disabled={!wallet || txLoading === 'activity'}>
                {txLoading === 'activity' ? <><div className="spinner" />Hashing & Logging...</> : '📋 Log Activity On-Chain'}
              </button>
            </form>
          </div>
        )}

        {/* On-Chain Logs Tab */}
        {activeTab === 'logs' && (
          <div className="card">
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:16}}>
              <div>
                <div style={{fontWeight:800,fontSize:16}}>On-Chain Task Logs</div>
                <div className="text-muted text-sm">Fetched directly from the smart contract</div>
              </div>
              <button className="btn btn-outline" onClick={this.fetchLogs} disabled={!wallet || logsLoading}>
                {logsLoading ? <><div className="spinner" />Fetching...</> : '🔍 Fetch My Logs'}
              </button>
            </div>
            {logs.length === 0 ? (
              <div className="empty-state"><div>No on-chain logs yet. Connect wallet and fetch.</div></div>
            ) : (
              <div style={{display:'grid',gap:8}}>
                {logs.map((log, i) => (
                  <div key={i} style={{background:'var(--bg3)',border:'1px solid var(--border)',borderRadius:8,padding:'12px 16px'}}>
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
                      <div>
                        <div style={{fontWeight:600,fontSize:14}}>{log.taskTitle}</div>
                        <div className="text-muted text-sm" style={{marginTop:2,fontFamily:'monospace',fontSize:11}}>
                          Task: {log.taskId}
                        </div>
                        <div className="text-muted text-sm" style={{fontFamily:'monospace',fontSize:11}}>
                          Employee: {log.employeeId}
                        </div>
                      </div>
                      <div style={{textAlign:'right',fontSize:11,color:'var(--text-muted)'}}>
                        {new Date(Number(log.timestamp) * 1000).toLocaleString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {!wallet && (
          <div style={{marginTop:16,padding:'12px 16px',background:'rgba(255,215,64,0.06)',border:'1px solid rgba(255,215,64,0.2)',borderRadius:10,fontSize:13,color:'var(--yellow)',textAlign:'center'}}>
            ⚠️ Connect your MetaMask wallet to start logging workforce events on-chain
          </div>
        )}
      </div>
    );
  }
}

export default Web3Page;