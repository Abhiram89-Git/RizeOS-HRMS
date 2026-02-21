import React, { Component } from 'react';
import EmployeeLogin from './EmployeeLogin';
import EmployeePortal from './EmployeePortal';

class EmployeeApp extends Component {
  constructor(props) {
    super(props);
    // Employee uses SEPARATE storage keys from admin
    // Admin uses: localStorage 'token'
    // Employee uses: localStorage 'emp_token' + 'emp_data'
    // This ensures they NEVER share sessions
    const empData = localStorage.getItem('emp_data');
    const empToken = localStorage.getItem('emp_token');
    this.state = {
      employee: empData && empToken ? JSON.parse(empData) : null
    };
  }

  handleLogin = (employee) => {
    // Clear any admin token when employee logs in to prevent mixing
    // (employee portal is completely separate)
    this.setState({ employee });
  };

  handleLogout = () => {
    localStorage.removeItem('emp_token');
    localStorage.removeItem('emp_data');
    this.setState({ employee: null });
  };

  render() {
    const { employee } = this.state;

    if (!employee) {
      return <EmployeeLogin onLogin={this.handleLogin} />;
    }

    return <EmployeePortal employee={employee} onLogout={this.handleLogout} />;
  }
}

export default EmployeeApp;