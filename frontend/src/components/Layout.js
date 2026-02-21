import React, { Component } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { LayoutDashboard, Users, CheckSquare, Brain, LogOut, Zap, Link, Shield } from 'lucide-react';

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/admin', label: 'Admin Panel', icon: Shield },
  { path: '/employees', label: 'Employees', icon: Users },
  { path: '/tasks', label: 'Tasks', icon: CheckSquare },
  { path: '/ai', label: 'AI Insights', icon: Brain },
  { path: '/web3', label: 'Web3 Logging', icon: Link },
];

function LayoutWrapper(props) {
  const navigate = useNavigate();
  const location = useLocation();
  return <LayoutClass {...props} navigate={navigate} location={location} />;
}

class LayoutClass extends Component {
  static contextType = AuthContext;

  render() {
    const { navigate, location } = this.props;
    const { org, logout } = this.context;

    return (
      <div className="layout">
        <aside className="sidebar">
          <div className="sidebar-logo">
            <Zap size={16} style={{ color: 'var(--accent)', display: 'inline', marginRight: 6 }} />
            Rize<span>OS</span> HRMS
          </div>
          <nav className="sidebar-nav">
            {navItems.map(({ path, label, icon: Icon }) => (
              <div key={path}
                className={`nav-item ${location.pathname === path ? 'active' : ''}`}
                onClick={() => navigate(path)}>
                <Icon size={16} />
                {label}
              </div>
            ))}
          </nav>
          <div className="sidebar-footer">
            <div style={{ fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>{org?.name}</div>
            <div style={{ marginBottom: 4, fontSize: 11 }}>{org?.email}</div>
            <div style={{ marginBottom: 12 }}>
              <span style={{ fontSize: 10, background: 'rgba(108,99,255,0.15)', color: 'var(--accent)', padding: '2px 8px', borderRadius: 10, fontWeight: 700 }}>
                ADMIN
              </span>
            </div>
            <button className="btn btn-outline btn-sm" style={{ width: '100%' }} onClick={logout}>
              <LogOut size={13} /> Logout
            </button>
          </div>
        </aside>
        <main className="main-content">
          <Outlet />
        </main>
      </div>
    );
  }
}

export default LayoutWrapper;