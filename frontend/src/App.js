import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Employees from './pages/Employees';
import Tasks from './pages/Tasks';
import AIInsights from './pages/AIInsights';
import Web3Page from './pages/Web3Page';
import AdminPanel from './pages/AdminPanel';
import EmployeeApp from './pages/EmployeeApp';
import './index.css';

// Admin/Org protected route — only org login can access
function AdminRoute({ children }) {
  const { org, loading } = useAuth();
  if (loading) return (
    <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100vh'}}>
      <div className="spinner" />
    </div>
  );
  // If logged in as employee (emp_token exists but no org), block access
  if (!org) return <Navigate to="/login" replace />;
  return children;
}

function PublicRoute({ children }) {
  const { org, loading } = useAuth();
  if (loading) return null;
  return org ? <Navigate to="/dashboard" replace /> : children;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          {/* ── Public routes ── */}
          <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
          <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />

          {/* ── Employee Portal (completely separate, no admin access) ── */}
          <Route path="/employee/*" element={<EmployeeApp />} />

          {/* ── Admin / Org routes — protected, employees cannot access ── */}
          <Route path="/" element={<AdminRoute><Layout /></AdminRoute>}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="admin" element={<AdminPanel />} />
            <Route path="emp