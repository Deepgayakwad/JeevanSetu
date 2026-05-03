import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';

const Layout = () => {
  return (
    <div className="app-container" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Navbar />
      <main className="main-content" style={{ flex: 1 }}>
        <Outlet />
      </main>
      <footer style={{ textAlign: 'center', padding: '1.5rem', backgroundColor: '#063a4f', color: '#f5a0a8', fontWeight: 600, fontSize: '0.95rem', letterSpacing: '0.02em', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
        Made By Dipak Gayakwad
      </footer>
    </div>
  );
};

export default Layout;
