import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import LightRays from './LightRays';

const Layout = () => {
  return (
    <div className="app-container" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', position: 'relative' }}>
      <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: -1 }}>
        <LightRays
          raysOrigin="top-center"
          raysColor="#ffffff"
          raysSpeed={1}
          lightSpread={0.5}
          rayLength={3}
          followMouse={true}
          mouseInfluence={0.1}
          noiseAmount={0}
          distortion={0}
          className="custom-rays"
          pulsating={false}
          fadeDistance={1}
          saturation={1}
        />
      </div>
      <Navbar />
      <main className="main-content" style={{ flex: 1 }}>
        <Outlet />
      </main>
      <footer style={{ textAlign: 'center', padding: '1.5rem', backgroundColor: 'transparent', color: '#f5a0a8', fontWeight: 600, fontSize: '0.95rem', letterSpacing: '0.02em', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
        © {new Date().getFullYear()} JeevanSetu. All rights reserved. | Made By Dipak Gayakwad
      </footer>
    </div>
  );
};

export default Layout;
