import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, Activity, Users, Shield } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Home = () => {
  const { user } = useAuth();

  return (
    <div className="animate-fade-in">
      {/* Hero Section */}
      <section style={{ padding: '6rem 1.5rem', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '600px', height: '600px', background: 'radial-gradient(circle, rgba(47, 128, 237, 0.08) 0%, transparent 70%)', zIndex: 0, pointerEvents: 'none' }}></div>
        <div className="container" style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1.25rem', backgroundColor: 'rgba(255,255,255,0.2)', color: '#ffffff', borderRadius: '999px', fontSize: '0.875rem', fontWeight: '700', marginBottom: '2rem', border: '1px solid rgba(255,255,255,0.35)' }}>
            <Heart size={16} fill="#f5a0a8" stroke="#f5a0a8" />
            <span>JeevanSetu Platform 2.0 is Live</span>
          </div>

          <h1 style={{ fontSize: '4rem', marginBottom: '1.5rem', lineHeight: 1.1, color: '#6ee7b7', textShadow: '0 2px 8px rgba(0,0,0,0.15)' }}>
            Bridge the gap between <br />
            <span style={{ color: '#6ee7b7', WebkitTextFillColor: '#6ee7b7' }}>life and hope.</span>
          </h1>

          <p style={{ fontSize: '1.2rem', color: '#ffffff', maxWidth: '600px', margin: '0 auto 2.5rem', lineHeight: 1.8, textShadow: '0 1px 3px rgba(0,0,0,0.15)' }}>
            Join our secure, real-time organ donation platform. Whether you want to pledge an organ or are in critical need, JeevanSetu connects you directly with verified hospitals.
          </p>

          {!user ? (
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link to="/register" className="btn btn-hero-nav" style={{ padding: '1rem 2rem', fontSize: '1.05rem', fontWeight: 600, backgroundColor: '#0d2233', border: '1px solid rgba(110, 231, 183, 0.2)', color: '#ffffff' }}>Become a Donor</Link>
              <Link to="/register" className="btn btn-hero-nav" style={{ padding: '1rem 2rem', fontSize: '1.05rem', fontWeight: 600, backgroundColor: '#0d2233', border: '1px solid rgba(110, 231, 183, 0.2)', color: '#ffffff' }}>Request an Organ</Link>
            </div>
          ) : (
            <Link to={user.role === 'donor' ? '/dashboard/donor' : user.role === 'recipient' ? '/dashboard/recipient' : `/dashboard/${user.role}`} className="btn btn-hero-nav" style={{ padding: '1rem 2rem', fontSize: '1.05rem', fontWeight: 600, backgroundColor: '#0d2233', border: '1px solid rgba(110, 231, 183, 0.3)', color: '#6ee7b7' }}>
              Go to Dashboard
            </Link>
          )}
        </div>
      </section>

      {/* Features */}
      <section style={{ padding: '5rem 1.5rem', backgroundColor: 'transparent' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
            <h2 style={{ fontSize: '2.5rem', marginBottom: '1rem', color: '#6ee7b7', fontWeight: 800 }}>How JeevanSetu Works</h2>
            <p style={{ color: '#6ee7b7', fontSize: '1.05rem', fontWeight: 600 }}>Our platform ensures transparency, speed, and security at every step.</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
            {[
              { icon: <Activity size={32} color="var(--primary)" />, title: 'Real-time Matching', desc: 'Our algorithm instantly connects compatible donors and recipients based on medical criteria and urgency.', accent: 'var(--primary-light)' },
              { icon: <Shield size={32} color="var(--secondary)" />, title: 'Verified Network', desc: 'All hospitals and medical reports are strictly verified by our admins to prevent fraud and ensure safety.', accent: 'var(--secondary-light)' },
              { icon: <Users size={32} color="#0EA5C8" />, title: 'Direct Communication', desc: 'Once matched, coordinators and hospitals can communicate instantly via our secure chat system.', accent: 'var(--accent-light)' }
            ].map((feature, idx) => (
              <div key={idx} style={{ padding: '2.5rem 2rem', textAlign: 'center', background: '#0d2233', border: '1px solid rgba(110, 231, 183, 0.2)', borderRadius: '20px', boxShadow: 'var(--shadow-sm)', transition: 'transform 0.2s, box-shadow 0.2s' }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = 'var(--shadow-lg)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'var(--shadow-sm)'; }}
              >
                <div style={{ width: '72px', height: '72px', borderRadius: '20px', backgroundColor: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem', boxShadow: '0 4px 10px rgba(0,0,0,0.1)' }}>
                  {feature.icon}
                </div>
                <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem', color: '#ffffff', fontWeight: 700 }}>{feature.title}</h3>
                <p style={{ color: '#ffffff', lineHeight: 1.7, fontWeight: 500 }}>{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Banner */}
      <section style={{ padding: '4rem 1.5rem', backgroundColor: 'transparent' }}>
        <div className="container">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '2rem', textAlign: 'center' }}>
            {[
              { value: '10,000+', label: 'Lives Impacted' },
              { value: '500+', label: 'Verified Hospitals' },
              { value: '98%', label: 'Match Accuracy' },
              { value: '24/7', label: 'Platform Uptime' },
            ].map((stat, i) => (
              <div key={i}>
                <div style={{ fontSize: '2.5rem', fontWeight: 800, color: '#6ee7b7', fontFamily: 'var(--font-display)', marginBottom: '0.5rem' }}>{stat.value}</div>
                <div style={{ color: '#6ee7b7', fontSize: '0.95rem', fontWeight: 600 }}>{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
