import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Activity, Heart, ShieldCheck, Clock, X, Edit2, Download, Trophy, MapPin, AlertTriangle } from 'lucide-react';
import api from '../../services/api';

const DonorDashboard = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showProfileForm, setShowProfileForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isDownloadingCard, setIsDownloadingCard] = useState(false);
  const [cardMsg, setCardMsg] = useState('');
  const [matches, setMatches] = useState([]);
  const [hospitals, setHospitals] = useState([]);
  const [selectedHospital, setSelectedHospital] = useState('');
  const [isRequestingVerif, setIsRequestingVerif] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    age: '',
    bloodGroup: '',
    city: '',
    state: '',
    organs: [],
    medicalReport: null
  });

  const availableOrgans = ["kidney", "liver", "cornea", "heart", "lungs", "pancreas"];
  const bloodGroups = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await api.get('/donor/profile');
      setProfile(res.data);
    } catch (err) {
      console.error('Failed to fetch donor profile', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
    api.get('/match/mymatches').then(r => setMatches(r.data)).catch(() => {});
    api.get('/hospital/list').then(r => setHospitals(r.data)).catch(err => console.error('Failed to load hospitals', err));
  }, []);

  const handleDownloadCard = async () => {
    setIsDownloadingCard(true);
    setCardMsg('');
    try {
      const response = await api.get('/donor/card', { responseType: 'blob' });
      
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const downloadUrl = window.URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `DonorCard_${user?.name?.replace(/\s+/g, '_') || 'JeevanSetu'}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(downloadUrl);
      
      setCardMsg('✅ Card downloaded successfully!');
    } catch (err) {
      console.error(err);
      setCardMsg('Failed to download card.');
    } finally {
      setIsDownloadingCard(false);
      setTimeout(() => setCardMsg(''), 4000);
    }
  };

  const handleEditClick = () => {
    if (profile) {
      setFormData({
        age: profile.age,
        bloodGroup: profile.bloodGroup,
        city: profile.city,
        state: profile.state,
        organs: profile.organs || [],
        medicalReport: null // Need to upload a new one or keep existing backend logic
      });
    }
    setShowProfileForm(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleOrganToggle = (organ) => {
    setFormData(prev => {
      const currentOrgans = [...prev.organs];
      if (currentOrgans.includes(organ)) {
        return { ...prev, organs: currentOrgans.filter(o => o !== organ) };
      } else {
        return { ...prev, organs: [...currentOrgans, organ] };
      }
    });
  };

  const handleFileChange = (e) => {
    setFormData(prev => ({ ...prev, medicalReport: e.target.files[0] }));
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const data = new FormData();
      data.append('age', formData.age);
      data.append('bloodGroup', formData.bloodGroup);
      data.append('city', formData.city);
      data.append('state', formData.state);
      
      // Append each organ
      formData.organs.forEach(organ => {
        data.append('organs', organ);
      });

      if (formData.medicalReport) {
        data.append('medicalReport', formData.medicalReport);
      }

      if (profile) {
        // Update existing profile
        await api.put('/donor/profile', data, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      } else {
        // Create new profile
        await api.post('/donor/profile', data, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }
      
      setShowProfileForm(false);
      await fetchProfile(); // Refresh profile
    } catch (err) {
      console.error(err);
      setErrorMsg(err.response?.data?.message || 'Failed to save profile. Please make sure all required fields are filled.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleWithdrawPledge = async () => {
    if (!window.confirm("Are you sure you want to withdraw your organ pledge? This will delete your donor profile and cannot be undone.")) return;

    try {
      await api.delete('/donor/profile');
      setProfile(null);
      setFormData({
        age: '', bloodGroup: '', city: '', state: '', organs: [], medicalReport: null
      });
      alert('Your pledge has been successfully withdrawn.');
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Failed to withdraw pledge.');
    }
  };

  const handleRequestVerification = async () => {
    if (!selectedHospital) return alert("Please select a hospital first.");
    setIsRequestingVerif(true);
    try {
      await api.patch(`/donor/request-verification/${selectedHospital}`);
      alert("Verification request sent successfully!");
      await fetchProfile();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Failed to send verification request.");
    } finally {
      setIsRequestingVerif(false);
    }
  };

  if (loading) return <div className="container" style={{ padding: '2rem' }}>Loading dashboard...</div>;

  return (
    <div className="container animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">Donor Dashboard</h1>
        <p className="page-subtitle">Welcome back, {user?.name}. Your pledges save lives.</p>
      </div>

      <div className="dashboard-grid">
        <div className="stat-card glass-panel" style={{ background: '#0d2233', border: '1px solid rgba(110,231,183,0.15)' }}>
          <div className="stat-icon red">
            <Heart size={24} />
          </div>
          <div className="stat-details">
            <h3>{profile?.organs?.length || 0}</h3>
            <p>Organs Pledged</p>
          </div>
        </div>

        <div className="stat-card glass-panel" style={{ background: '#0d2233', border: '1px solid rgba(110,231,183,0.15)' }}>
          <div className="stat-icon green">
            <ShieldCheck size={24} />
          </div>
          <div className="stat-details">
            <h3 style={{ textTransform: 'capitalize' }}>{profile?.status || 'Active'}</h3>
            <p>Profile Status</p>
          </div>
        </div>

        <div className="stat-card glass-panel" style={{ background: '#0d2233', border: '1px solid rgba(110,231,183,0.15)' }}>
          <div className="stat-icon">
            <Clock size={24} />
          </div>
          <div className="stat-details">
            <h3>{profile ? new Date(profile.pledgeDate).toLocaleDateString() : 'N/A'}</h3>
            <p>Pledge Date</p>
          </div>
        </div>
      </div>

      <div style={{ marginTop: '2rem' }}>
        <div className="glass-panel" style={{ padding: '1.5rem', position: 'relative', background: '#0d2233', border: '1px solid rgba(110,231,183,0.15)' }}>
          
          {showProfileForm && (
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'var(--bg-secondary)', borderRadius: '16px', zIndex: 10, padding: '2rem', overflowY: 'auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2>{profile ? 'Edit Your Donor Profile' : 'Complete Your Donor Profile'}</h2>
                <button onClick={() => setShowProfileForm(false)} className="btn-logout">
                  <X size={24} />
                </button>
              </div>
              
              {errorMsg && (
                <div style={{ padding: '0.875rem 1rem', backgroundColor: 'rgba(239,68,68,0.08)', color: '#C0392B', borderRadius: '10px', marginBottom: '1rem', border: '1px solid rgba(239,68,68,0.2)', fontSize: '0.9rem' }}>
                  {errorMsg}
                </div>
              )}

              <form onSubmit={handleProfileSubmit}>
                
                {/* User Info (Read Only) */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="input-group">
                    <label className="input-label">Full Name</label>
                    <input type="text" className="input-field" value={user?.name || ''} disabled style={{ backgroundColor: '#f8fafc', color: 'var(--text-muted)', cursor: 'not-allowed', borderColor: 'var(--border-light)' }} />
                  </div>
                  <div className="input-group">
                    <label className="input-label">Email Address</label>
                    <input type="email" className="input-field" value={user?.email || ''} disabled style={{ backgroundColor: '#f8fafc', color: 'var(--text-muted)', cursor: 'not-allowed', borderColor: 'var(--border-light)' }} />
                  </div>
                </div>
                <div className="input-group">
                  <label className="input-label">Phone Number</label>
                  <input type="text" className="input-field" value={user?.phone || 'Not provided'} disabled style={{ backgroundColor: '#f8fafc', color: 'var(--text-muted)', cursor: 'not-allowed', borderColor: 'var(--border-light)' }} />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="input-group">
                    <label className="input-label">Age</label>
                    <input type="number" name="age" value={formData.age} onChange={handleInputChange} className="input-field" required min="18" max="100" />
                  </div>
                  <div className="input-group">
                    <label className="input-label">Blood Group</label>
                    <select name="bloodGroup" value={formData.bloodGroup} onChange={handleInputChange} className="input-field" required style={{ appearance: 'none' }}>
                      <option value="">Select Blood Group</option>
                      {bloodGroups.map(bg => <option key={bg} value={bg}>{bg}</option>)}
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="input-group">
                    <label className="input-label">City</label>
                    <input type="text" name="city" value={formData.city} onChange={handleInputChange} className="input-field" required />
                  </div>
                  <div className="input-group">
                    <label className="input-label">State</label>
                    <input type="text" name="state" value={formData.state} onChange={handleInputChange} className="input-field" required />
                  </div>
                </div>

                <div className="input-group">
                  <label className="input-label">Select Organs to Pledge</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginTop: '0.5rem' }}>
                    {availableOrgans.map(organ => (
                      <label key={organ} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', padding: '0.5rem 1rem', backgroundColor: formData.organs.includes(organ) ? 'var(--primary-light)' : '#ffffff', borderRadius: '10px', border: `1.5px solid ${formData.organs.includes(organ) ? 'var(--primary)' : 'var(--border-light)'}`, textTransform: 'capitalize', transition: 'all 0.2s', color: formData.organs.includes(organ) ? 'var(--primary)' : 'var(--text-muted)', fontWeight: formData.organs.includes(organ) ? 600 : 400 }}>
                        <input 
                          type="checkbox" 
                          checked={formData.organs.includes(organ)} 
                          onChange={() => handleOrganToggle(organ)}
                          style={{ display: 'none' }}
                        />
                        <div style={{ width: '15px', height: '15px', borderRadius: '4px', border: '2px solid var(--primary)', backgroundColor: formData.organs.includes(organ) ? 'var(--primary)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.2s' }}>
                          {formData.organs.includes(organ) && <div style={{ width: '7px', height: '7px', backgroundColor: '#ffffff', borderRadius: '2px' }}></div>}
                        </div>
                        {organ}
                      </label>
                    ))}
                  </div>
                </div>

                <div className="input-group">
                  <label className="input-label">Medical Report (Optional PDF/Image)</label>
                  <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={handleFileChange} className="input-field" style={{ padding: '0.5rem' }} />
                </div>

                <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem' }}>
                  <button type="submit" className="btn btn-primary" disabled={isSubmitting || formData.organs.length === 0}>
                    {isSubmitting ? 'Saving...' : 'Save Profile'}
                  </button>
                  <button type="button" className="btn btn-outline" onClick={() => setShowProfileForm(false)}>Cancel</button>
                </div>
              </form>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h2>Your Profile Information</h2>
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              {profile && (
                <>
                  {cardMsg && <span style={{ fontSize: '0.8rem', color: 'var(--accent)' }}>{cardMsg}</span>}
                  <button
                    onClick={handleDownloadCard}
                    className="btn btn-outline"
                    style={{ padding: '0.5rem 1rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}
                    disabled={isDownloadingCard}
                  >
                    <Download size={16} /> {isDownloadingCard ? 'Generating…' : 'Donor Card'}
                  </button>
                </>
              )}
              {profile && !profile.isVerified && (
                <button onClick={handleWithdrawPledge} className="btn-logout" style={{ padding: '0.5rem 1rem', display: 'flex', gap: '0.5rem', alignItems: 'center', backgroundColor: 'rgba(239, 68, 68, 0.08)', color: '#E03131', border: '1px solid rgba(239,68,68,0.25)', borderRadius: '8px', fontWeight: 600, fontSize: '0.85rem' }}>
                  <X size={16} /> Withdraw Pledge
                </button>
              )}
              {profile && !showProfileForm && (
                <button onClick={handleEditClick} className="btn btn-outline" style={{ padding: '0.5rem 1rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <Edit2 size={16} /> Edit Profile
                </button>
              )}
            </div>
          </div>

          {profile ? (
            <div style={{ marginTop: '1rem', display: 'grid', gap: '1.5rem', gridTemplateColumns: '1fr 1fr' }}>
              <div>
                <p className="input-label">Full Name</p>
                <p style={{ fontSize: '1.125rem', fontWeight: '500' }}>{profile.user?.name || user?.name}</p>
              </div>
              <div>
                <p className="input-label">Email Address</p>
                <p style={{ fontSize: '1.125rem', fontWeight: '500' }}>{profile.user?.email || user?.email}</p>
              </div>
              <div>
                <p className="input-label">Phone Number</p>
                <p style={{ fontSize: '1.125rem', fontWeight: '500' }}>{profile.user?.phone || user?.phone || 'Not provided'}</p>
              </div>
              <div>
                <p className="input-label">Address (City, State)</p>
                <p style={{ fontSize: '1.125rem', fontWeight: '500', color: 'green' }}>{profile.city}, {profile.state}</p>
              </div>
              <div>
                <p className="input-label">Blood Group</p>
                <p style={{ fontSize: '1.25rem', fontWeight: '600', color: 'red' }}>{profile.bloodGroup}</p>
              </div>
              <div>
                <p className="input-label">Age</p>
                <p style={{ fontSize: '1.125rem', fontWeight: '500' }}>{profile.age} years old</p>
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <p className="input-label">Verification Status</p>
                <span className={`badge ${profile.isVerified ? 'green' : 'red'}`} style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}>
                  {profile.isVerified ? 'Verified' : 'Pending Verification'}
                </span>
              </div>
              
              <div style={{ gridColumn: '1 / -1', marginTop: '0.5rem' }}>
                <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>Pledged Organs</h3>
                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                  {profile.organs.map(organ => (
                    <div key={organ} style={{ 
                      backgroundColor: '#e0ad7c', 
                      border: 'none',
                      color: '#000000', 
                      padding: '0.45rem 1rem', 
                      borderRadius: '10px', 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '0.5rem',
                      textTransform: 'capitalize',
                      fontWeight: '600',
                      fontSize: '0.875rem'
                    }}>
                      <Heart size={14} color="#000000" fill="#000000" />
                      {organ}
                    </div>
                  ))}
                </div>
              </div>
              
              <div style={{ gridColumn: '1 / -1', padding: '1.25rem', backgroundColor: '#0d2233', borderRadius: '12px', border: '1px solid rgba(110,231,183,0.15)' }}>
                  <p className="input-label" style={{ marginBottom: '0.25rem' }}>Verification Status</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
                    {profile.isVerified ? (
                      <>
                        <ShieldCheck size={20} color="var(--secondary)" />
                        <span style={{ fontWeight: 600, color: 'var(--secondary)' }}>Verified by {profile.verifiedByHospital?.name || "Hospital"}</span>
                      </>
                    ) : profile.verificationRequestedFrom ? (
                      <>
                        <Clock size={20} color="#f59e0b" />
                        <span style={{ fontWeight: 600, color: '#f59e0b' }}>Verification pending with Hospital</span>
                      </>
                    ) : (
                      <>
                        <AlertTriangle size={20} color="#ef4444" />
                        <span style={{ fontWeight: 600, color: '#ef4444' }}>Unverified</span>
                      </>
                    )}
                  </div>
                  
                  {/* Hospital Selection for Verification */}
                  {!profile.isVerified && !profile.verificationRequestedFrom && (
                    <div style={{ marginTop: '1rem', padding: '1.25rem', backgroundColor: 'var(--primary-light)', borderRadius: '12px', border: '1px solid rgba(47, 128, 237, 0.2)' }}>
                      <p style={{ fontSize: '0.85rem', marginBottom: '0.75rem', color: 'var(--text-muted)' }}>
                        To become an active donor, you must send your profile to a hospital for verification.
                      </p>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <select 
                          className="input-field" 
                          value={selectedHospital} 
                          onChange={(e) => setSelectedHospital(e.target.value)}
                          style={{ appearance: 'none', backgroundColor: '#ffffff' }}
                        >
                          <option value="">Select a Hospital</option>
                          {hospitals.map(h => {
                            const locationStr = [h.city, h.state].filter(Boolean).join(', ');
                            return (
                              <option key={h._id} value={h._id}>
                                {h.name} {locationStr ? `(${locationStr})` : ''}
                              </option>
                            );
                          })}
                        </select>
                        <button 
                          onClick={handleRequestVerification} 
                          disabled={!selectedHospital || isRequestingVerif}
                          className="btn btn-primary"
                          style={{ whiteSpace: 'nowrap' }}
                        >
                          {isRequestingVerif ? 'Sending...' : 'Send Request'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>

              {profile.medicalReport && (
                <div style={{ gridColumn: '1 / -1', marginTop: '1rem' }}>
                  <a href={profile.medicalReport} target="_blank" rel="noreferrer" className="btn btn-outline">
                    View Uploaded Medical Report
                  </a>
                </div>
              )}
            </div>
          ) : (
            <div style={{ marginTop: '1rem', textAlign: 'center', padding: '3rem 0' }}>
              <div style={{ width: '72px', height: '72px', backgroundColor: 'var(--primary-light)', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem', color: 'var(--primary)', border: '1px solid var(--border-color)' }}>
                <Activity size={32} />
              </div>
              <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', fontSize: '1.1rem' }}>You haven't completed your donor profile yet.</p>
              <button className="btn btn-primary" onClick={() => setShowProfileForm(true)}>Complete Profile</button>
            </div>
          )}
        </div>
      </div>

      {/* ── My Matches ── */}
      {matches.length > 0 && (
        <div style={{ marginTop: '2rem' }}>
          <h2 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Trophy size={22} color="#f59e0b" /> My Organ Matches
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.25rem' }}>
            {matches.map(match => {
              const statusMap = {
                proposed:  { bg: 'var(--primary-light)',   color: 'var(--primary)',   label: 'Proposed' },
                confirmed: { bg: 'var(--secondary-light)', color: 'var(--secondary)', label: 'Confirmed' },
                completed: { bg: 'rgba(139,92,246,0.12)',  color: '#7C3AED',          label: 'Completed' },
                cancelled: { bg: 'rgba(239,68,68,0.1)',    color: '#E03131',          label: 'Cancelled' },
              };
              const sc = statusMap[match.status] || statusMap.proposed;
              return (
                <div key={match._id} className="glass-panel" style={{ padding: '1.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Heart size={18} color="var(--secondary)" />
                      <h3 style={{ textTransform: 'capitalize', fontSize: '1.05rem' }}>{match.organ} Match</h3>
                    </div>
                    <span style={{ padding: '0.2rem 0.65rem', borderRadius: '999px', fontSize: '0.72rem', fontWeight: 600, backgroundColor: sc.bg, color: sc.color }}>{sc.label}</span>
                  </div>
                  <div style={{ display: 'grid', gap: '0.5rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                    <p>👤 Recipient: <strong style={{ color: 'var(--text-main)' }}>{match.recipient?.name}</strong></p>
                    <p><MapPin size={13} style={{ display: 'inline', marginRight: '0.25rem' }} />
                      Hospital: <strong style={{ color: 'var(--text-main)' }}>{match.hospital || 'TBD'}</strong>
                    </p>
                    <p><Clock size={13} style={{ display: 'inline', marginRight: '0.25rem' }} />
                      {new Date(match.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                  {match.notes && <p style={{ marginTop: '0.75rem', fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic', borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem' }}>📋 {match.notes}</p>}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default DonorDashboard;

