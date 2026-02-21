import React, { Component } from 'react';
import { Zap, AlertCircle, Mail, Lock } from 'lucide-react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

class EmployeeLogin extends Component {
  constructor(props) {
    super(props);
    this.state = { email: '', password: '', error: '', loading: false };
  }

  handleSubmit = async (e) => {
    e.preventDefault();
    this.setState({ error: '', loading: true });
    try {
      const { data } = await axios.post(`${API_URL}/employee-auth/login`, {
        email: this.state.email,
        password: this.state.password
      });
      localStorage.setItem('emp_token', data.token);
      localStorage.setItem('emp_data', JSON.stringify(data.employee));
      this.props.onLogin(data.employee);
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
          <div style={{ marginBottom: 28, textAlign: 'center' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <Zap size={24} color="var(--accent)" />
              <span style={{ fontSize: 20, fontWeight: 800 }}>RizeOS <span style={{ color: 'var(--accent)' }}>HRMS</span></span>
            </div>
            <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 4 }}>Employee Portal</h1>
            <p className="text-muted text-sm">Sign in with your work email and password</p>
          </div>

          {error && (
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', background: 'rgba(255,107,107,0.1)', border: '1px solid rgba(255,107,107,0.3)', borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 14, color: 'var(--accent3)' }}>
              <AlertCircle size={15} /> {error}
            </div>
          )}

          <form onSubmit={this.handleSubmit}>
            <div className="form-group">
              <label className="form-label"><Mail size={11} style={{ marginRight: 4 }} />Work Email</label>
              <input className="form-input" type="email" placeholder="you@company.com"
                value={email} onChange={e => this.setState({ email: e.target.value })} required />
            </div>
            <div className="form-group">
              <label className="form-label"><Lock size={11} style={{ marginRight: 4 }} />Password</label>
              <input className="form-input" type="password" placeholder="••••••••"
                value={password} onChange={e => this.setState({ password: e.target.value })} required />
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                Password is set by your admin
              </div>
            </div>
            <button className="btn btn-primary" style={{ width: '100%', marginTop: 8, justifyContent: 'center' }} disabled={loading}>
              {loading ? <><div className="spinner" /> Signing in...</> : 'Sign In'}
            </button>
          </form>

          <div style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: 'var(--text-muted)' }}>
            Are you an admin? <a href="/login" style={{ color: 'var(--accent)', fontWeight: 700 }}>Admin Login</a>
          </div>
        </div>
      </div>
    );
  }
}

export default EmployeeLogin;