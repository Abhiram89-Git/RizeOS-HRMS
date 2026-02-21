import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Zap, AlertCircle } from 'lucide-react';

class Register extends Component {
  static contextType = AuthContext;

  constructor(props) {
    super(props);
    this.state = {
      name: '', email: '', password: '', industry: '', size: '1-10',
      error: '', loading: false
    };
  }

  handleSubmit = async (e) => {
    e.preventDefault();
    this.setState({ error: '', loading: true });
    try {
      const { name, email, password, industry, size } = this.state;
      await this.context.register({ name, email, password, industry, size });
    } catch (err) {
      this.setState({ error: err.response?.data?.message || 'Registration failed' });
    } finally {
      this.setState({ loading: false });
    }
  };

  render() {
    const { name, email, password, industry, size, error, loading } = this.state;
    return (
      <div className="auth-page">
        <div className="auth-card">
          <div style={{marginBottom:28, textAlign:'center'}}>
            <div style={{display:'inline-flex',alignItems:'center',gap:8,marginBottom:8}}>
              <Zap size={24} color="var(--accent)" />
              <span style={{fontSize:20, fontWeight:800}}>RizeOS <span style={{color:'var(--accent)'}}>HRMS</span></span>
            </div>
            <h1 style={{fontSize:26, fontWeight:800, marginBottom:4}}>Create Organization</h1>
            <p className="text-muted text-sm">Set up your workforce intelligence platform</p>
          </div>

          {error && (
            <div style={{display:'flex',gap:8,alignItems:'center',background:'rgba(255,107,107,0.1)',border:'1px solid rgba(255,107,107,0.3)',borderRadius:8,padding:'10px 14px',marginBottom:16,fontSize:14,color:'var(--accent3)'}}>
              <AlertCircle size={15} /> {error}
            </div>
          )}

          <form onSubmit={this.handleSubmit}>
            <div className="form-group">
              <label className="form-label">Organization Name</label>
              <input className="form-input" placeholder="Acme Corp" value={name}
                onChange={e => this.setState({ name: e.target.value })} required />
            </div>
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Industry</label>
                <input className="form-input" placeholder="Technology" value={industry}
                  onChange={e => this.setState({ industry: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Company Size</label>
                <select className="form-input" value={size} onChange={e => this.setState({ size: e.target.value })}>
                  {['1-10','11-50','51-200','201-500','500+'].map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Work Email</label>
              <input className="form-input" type="email" placeholder="admin@company.com" value={email}
                onChange={e => this.setState({ email: e.target.value })} required />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input className="form-input" type="password" placeholder="Min 8 characters" value={password}
                onChange={e => this.setState({ password: e.target.value })} minLength={8} required />
            </div>
            <button className="btn btn-primary" style={{width:'100%', marginTop:8, justifyContent:'center'}} disabled={loading}>
              {loading ? <><div className="spinner" /> Creating...</> : 'Create Organization'}
            </button>
          </form>

          <p style={{textAlign:'center', marginTop:20, fontSize:13, color:'var(--text-muted)'}}>
            Already registered? <Link to="/login" style={{color:'var(--accent)', fontWeight:700}}>Sign in</Link>
          </p>
        </div>
      </div>
    );
  }
}

export default Register;