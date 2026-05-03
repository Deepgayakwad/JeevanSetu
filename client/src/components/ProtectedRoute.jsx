import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <div className="loader">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect to their specific dashboard if they try to access an unauthorized route
    switch (user.role) {
      case 'donor': return <Navigate to="/dashboard/donor" replace />;
      case 'recipient': return <Navigate to="/dashboard/recipient" replace />;
      case 'hospital': return <Navigate to="/dashboard/hospital" replace />;
      case 'admin': return <Navigate to="/dashboard/admin" replace />;
      default: return <Navigate to="/" replace />;
    }
  }

  return <Outlet />;
};

export default ProtectedRoute;
