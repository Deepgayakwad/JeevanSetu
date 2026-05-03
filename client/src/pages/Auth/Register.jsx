import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Heart, Mail, Lock, User, AlertCircle, Phone } from 'lucide-react';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    role: 'donor'
  });
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg('');
    
    const result = await register(formData);
    
    if (result.success) {
      navigate('/');
    } else {
      setErrorMsg(result.message);
    }
    
    setIsLoading(false);
  };

  const roleConfig = {
    donor:     { label: 'Donor',     color: 'var(--secondary)', bg: 'var(--secondary-light)' },
    recipient: { label: 'Recipient', color: 'var(--primary)',   bg: 'var(--primary-light)' },
    hospital:  { label: 'Hospital',  color: '#0EA5C8',          bg: 'var(--accent-light)' },
  };

  return (
    <div className="auth-container">
      <div className="auth-card animate-fade-in" style={{ maxWidth: '560px' }}>
        <div className="logo-area">
          <div style={{ width: '64px', height: '64px', borderRadius: '18px', background: 'linear-gradient(135deg, var(--primary-light), var(--secondary-light))', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem', border: '1px solid var(--border-color)' }}>
            <Heart size={32} color="var(--secondary)" fill="var(--secondary)" />
          </div>
          <h2>Join JeevanSetu</h2>
          <p>Create an account to save lives or request a transplant</p>
        </div>

        {errorMsg && (
          <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.08)', color: '#C0392B', padding: '0.875rem 1rem', borderRadius: '10px', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', border: '1px solid rgba(239,68,68,0.2)', fontSize: '0.9rem' }}>
            <AlertCircle size={18} />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label className="input-label">I am a...</label>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              {['donor', 'recipient', 'hospital'].map((roleOpt) => {
                const cfg = roleConfig[roleOpt];
                const isSelected = formData.role === roleOpt;
                return (
                  <label key={roleOpt} style={{
                    display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer',
                    padding: '0.75rem', flex: 1, textTransform: 'capitalize', fontWeight: 600,
                    borderRadius: '10px', fontSize: '0.875rem', transition: 'all 0.2s',
                    backgroundColor: isSelected ? cfg.bg : '#ffffff',
                    border: `1.5px solid ${isSelected ? cfg.color : 'var(--border-light)'}`,
                    color: isSelected ? cfg.color : 'var(--text-muted)',
                    boxShadow: isSelected ? `0 2px 8px ${cfg.bg}` : 'none',
                  }}>
                    <input 
                      type="radio" 
                      name="role" 
                      value={roleOpt} 
                      checked={isSelected}
                      onChange={handleChange}
                      style={{ display: 'none' }}
                    />
                    <div style={{ width: '14px', height: '14px', borderRadius: '50%', border: `2px solid ${cfg.color}`, backgroundColor: isSelected ? cfg.color : 'transparent', flexShrink: 0, transition: 'all 0.2s' }}></div>
                    {roleOpt}
                  </label>
                );
              })}
            </div>
          </div>

          <div className="input-group">
            <label className="input-label">Full Name / Hospital Name</label>
            <div style={{ position: 'relative' }}>
              <User size={17} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input 
                type="text" 
                name="name"
                className="input-field" 
                style={{ paddingLeft: '2.75rem' }}
                placeholder="Enter your name"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1rem' }}>
            <div className="input-group" style={{ flex: 1 }}>
              <label className="input-label">Email Address</label>
              <div style={{ position: 'relative' }}>
                <Mail size={17} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input 
                  type="email" 
                  name="email"
                  className="input-field" 
                  style={{ paddingLeft: '2.75rem' }}
                  placeholder="Email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="input-group" style={{ flex: 1 }}>
              <label className="input-label">Phone Number</label>
              <div style={{ position: 'relative' }}>
                <Phone size={17} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input 
                  type="text" 
                  name="phone"
                  className="input-field" 
                  style={{ paddingLeft: '2.75rem' }}
                  placeholder="Phone"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>
          </div>

          <div className="input-group">
            <label className="input-label">Password</label>
            <div style={{ position: 'relative' }}>
              <Lock size={17} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input 
                type="password" 
                name="password"
                className="input-field" 
                style={{ paddingLeft: '2.75rem' }}
                placeholder="Create a strong password"
                value={formData.password}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1.25rem', padding: '0.85rem' }} disabled={isLoading}>
            {isLoading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        <div className="auth-footer" style={{ marginTop: '1.5rem' }}>
          Already have an account? <Link to="/login" style={{ fontWeight: 600 }}>Login here</Link>
        </div>
      </div>
    </div>
  );
};

export default Register;
