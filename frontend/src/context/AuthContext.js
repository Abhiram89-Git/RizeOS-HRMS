import React, { Component, createContext, useContext } from 'react';
import axios from 'axios';

const API = axios.create({ baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api' });

API.interceptors.request.use(cfg => {
  const token = localStorage.getItem('token');
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

const AuthContext = createContext(null);

class AuthProvider extends Component {
  constructor(props) {
    super(props);
    this.state = { org: null, loading: true };
  }

  componentDidMount() {
    const token = localStorage.getItem('token');
    if (token) {
      API.get('/auth/me')
        .then(r => this.setState({ org: r.data.org, loading: false }))
        .catch(() => {
          localStorage.removeItem('token');
          this.setState({ loading: false });
        });
    } else {
      this.setState({ loading: false });
    }
  }

  login = async (email, password) => {
    const { data } = await API.post('/auth/login', { email, password });
    localStorage.setItem('token', data.token);
    this.setState({ org: data.org });
    return data;
  };

  register = async (form) => {
    const { data } = await API.post('/auth/register', form);
    localStorage.setItem('token', data.token);
    this.setState({ org: data.org });
    return data;
  };

  logout = () => {
    localStorage.removeItem('token');
    this.setState({ org: null });
  };

  render() {
    const { org, loading } = this.state;
    return (
      <AuthContext.Provider value={{ org, loading, login: this.login, register: this.register, logout: this.logout }}>
        {this.props.children}
      </AuthContext.Provider>
    );
  }
}

// Hook for any functional components (App.js PrivateRoute/PublicRoute)
const useAuth = () => useContext(AuthContext);

export { AuthContext, AuthProvider, useAuth, API };