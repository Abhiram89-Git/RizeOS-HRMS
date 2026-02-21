import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Zap, Mail, Lock, AlertCircle } from 'lucide-react';

class Login extends Component {
  static contextType = AuthContext;

  constructor(props) {
    super(props);
    this.state = { email: '', password: '', error: '', loading: false };
  }

  handleSubmit = async (e) => {
    e.preventDefault();
    this.setState({ error: '', loading: true });
    try {
      await this.context.login(this.state.email, this.state.password);
    } catch (err) {
      this.setState({ error: err.response?.data?.message || 'Login failed' });
    } finally {
      this.setState({ loading: false });
    }
  };

  render() {
    const { email, password, error, loading } = this.state;
    return (
      <div className="auth-page">
        <div className="auth-card">
          <div style={{marginBottom:32, textAlign:'center'}}>
            <div style={{display:'inline-flex',alignItems:'center',gap:8,marginBottom:8}}>
              <Zap size={24} color="var(--accent)" />
              <span style={{fontSize:20, fontWeight:800}}>RizeOS <span style={{color:'var(--accent)'}}>HRMS</span></span>
            </div>
            <h1 style={{fontSize:28, fontWeight:800, marginBottom:6}}>Welcome back</h1>
            <p className="text-muted text-sm">Sign in to your organization</p>
          </div>

          {error && (
            <div style={{display:'flex',gap:8,alignItems:'center',background:'rgba(255,107,107,0.1)',border:'1px solid rgba(255,107,107,0.3)',borderRadius:8,padding:'10px 14px',marginBottom:16,fontSize:14,color:'var(--accent3)'}}>
              <AlertCircle size={15} /> {error}
            </div>
          )}

          <form onSubmit={this.handleSubmit}>
            <div className="form-group">
              <label className="form-label"><Mail size={11} style={{marginRight:4}} />Email</label>
              <input className="form-input" type="email" placeholder="org@company.com"
                value={email} onChange={e => this.setState({ email: e.target.value })} required />
            </div>
            <div className="form-group">
              <label className="form-label"><Lock size={11} style={{marginRight:4}} />Password</label>
              <input className="form-input" type="password" placeholder="••••••••"
                value={password} onChange={e => this.setState({ password: e.target.value })} required />
            </div>
            <button className="btn btn-primary" style={{width:'100%', marginTop:8, justifyContent:'center'}} disabled={loading}>
              {loading ? <><div className="spinner" /> Signing in...</> : 'Sign In'}
            </button>
          </form>

          <p style={{textAlign:'center', marginTop:20, fontSize:13, color:'var(--text-muted)'}}>
            New organization? <Link to="/register" style={{color:'var(--accent)', fontWeight:700}}>Register here</Link>
          </p>
        </div>
      </div>
    );
  }
}

export default Login;