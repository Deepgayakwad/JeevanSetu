import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import './index.css';
import './App.css';

// Components
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import Home from './pages/Home';
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';
import DonorDashboard from './pages/Dashboards/DonorDashboard';
import RecipientDashboard from './pages/Dashboards/RecipientDashboard';
import HospitalDashboard from './pages/Dashboards/HospitalDashboard';
import AdminDashboard from './pages/Dashboards/AdminDashboard';
import ChatRoom from './pages/Chat/ChatRoom';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Layout />}>
            {/* Public Routes */}
            <Route index element={<Home />} />
            <Route path="login" element={<Login />} />
            <Route path="register" element={<Register />} />
            
            {/* Protected Routes */}
            <Route element={<ProtectedRoute />}>
              <Route path="chat" element={<ChatRoom />} />
            </Route>

            {/* Role Specific Routes */}
            <Route element={<ProtectedRoute allowedRoles={['donor']} />}>
              <Route path="dashboard/donor" element={<DonorDashboard />} />
            </Route>
            
            <Route element={<ProtectedRoute allowedRoles={['recipient']} />}>
              <Route path="dashboard/recipient" element={<RecipientDashboard />} />
            </Route>
            
            <Route element={<ProtectedRoute allowedRoles={['hospital']} />}>
              <Route path="dashboard/hospital" element={<HospitalDashboard />} />
            </Route>

            <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
              <Route path="dashboard/admin" element={<AdminDashboard />} />
            </Route>
            
            {/* Catch All */}
            <Route path="*" element={<div className="container" style={{ textAlign: 'center', padding: '4rem 0' }}><h2>404 - Page Not Found</h2></div>} />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
