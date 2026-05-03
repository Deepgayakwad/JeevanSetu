import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  Activity, Search, AlertTriangle, FileText, Heart, MapPin,
  MessageSquare, Filter, X, Plus, Trash2, Clock, CheckCircle2, Trophy, Download
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

const ORGANS = ['kidney', 'liver', 'cornea', 'heart', 'lungs', 'pancreas'];
const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const URGENCY_LEVELS = ['normal', 'urgent', 'critical'];

const urgencyColor = (level) => {
  if (level === 'critical') return 'var(--secondary)';
  if (level === 'urgent') return '#f59e0b';
  return 'var(--accent)';
};

const statusBadge = (status) => {
  const map = {
    waiting:     { bg: 'var(--primary-light)',   color: 'var(--primary)',   label: 'Waiting' },
    matched:     { bg: 'var(--secondary-light)', color: 'var(--secondary)', label: 'Matched' },
    transplanted:{ bg: 'rgba(139,92,246,0.12)',  color: '#7C3AED',          label: 'Transplanted' },
    closed:      { bg: 'rgba(100,116,139,0.1)',  color: 'var(--text-muted)', label: 'Closed' },
  };
  return map[status] || map.waiting;
};

// ── Overlay Modal ─────────────────────────────────────────────────────────────
const Modal = ({ show, onClose, children }) => {
  if (!show) return null;
  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        backgroundColor: 'rgba(28, 28, 28, 0.45)', backdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        className="glass-panel"
        style={{
          width: '100%', maxWidth: '600px', padding: '2rem',
          maxHeight: '90vh', overflowY: 'auto',
          border: '1px solid var(--border-light)',
          animation: 'fadeIn 0.25s ease',
        }}
      >
        {children}
      </div>
    </div>
  );
};

const RecipientDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [requests, setRequests] = useState([]);
  const [availableDonors, setAvailableDonors] = useState([]);
  const [matchedVerifiedDonors, setMatchedVerifiedDonors] = useState([]);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);

  // Create-request modal
  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [formData, setFormData] = useState({
    organNeeded: '', bloodGroup: '', urgencyLevel: 'normal',
    hospital: '', city: '', state: '', doctorNote: '', additionalInfo: '',
  });

  // Search
  const [searchParams, setSearchParams] = useState({ organ: '', bloodGroup: '', city: '' });
  const [isSearching, setIsSearching] = useState(false);
  const [downloadingCardId, setDownloadingCardId] = useState(null);

  // ── Fetch ─────────────────────────────────────────────────────────────────
  const fetchRequests = async () => {
    try {
      const res = await api.get('/recipient/myrequests');
      setRequests(res.data);
    } catch (err) {
      console.error('Failed to fetch requests', err);
    }
  };

  const fetchDonors = async (params = {}) => {
    try {
      setIsSearching(true);
      const q = new URLSearchParams();
      if (params.organ) q.append('organ', params.organ);
      if (params.bloodGroup) q.append('bloodGroup', params.bloodGroup);
      if (params.city) q.append('city', params.city);
      const res = await api.get(`/donor/search?${q.toString()}`);
      setAvailableDonors(res.data);
    } catch (err) {
      console.error('Failed to fetch donors', err);
    } finally {
      setIsSearching(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await Promise.all([fetchRequests(), fetchDonors()]);
      api.get('/recipient/matching-donors').then(r => setMatchedVerifiedDonors(r.data)).catch(() => {});
      api.get('/match/mymatches').then(r => setMatches(r.data)).catch(() => {});
      setLoading(false);
    };
    init();
  }, []);

  // ── Create Request ────────────────────────────────────────────────────────
  const handleFormChange = (e) => setFormData(p => ({ ...p, [e.target.name]: e.target.value }));

  const handleCreateRequest = async (e) => {
    e.preventDefault();
    if (!formData.organNeeded || !formData.bloodGroup || !formData.hospital || !formData.city || !formData.state) {
      setFormError('Please fill all required fields.');
      return;
    }
    setIsSubmitting(true);
    setFormError('');
    try {
      await api.post('/recipient/request', formData);
      setShowModal(false);
      setFormData({ organNeeded: '', bloodGroup: '', urgencyLevel: 'normal', hospital: '', city: '', state: '', doctorNote: '', additionalInfo: '' });
      await fetchRequests();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to submit request.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteRequest = async (id) => {
    if (!window.confirm('Delete this request?')) return;
    try {
      await api.delete(`/recipient/request/${id}`);
      setRequests(prev => prev.filter(r => r._id !== id));
    } catch (err) {
      console.error('Failed to delete', err);
    }
  };

  // ── Search ────────────────────────────────────────────────────────────────
  const handleSearch = (e) => { e.preventDefault(); fetchDonors(searchParams); };
  const clearSearch = () => { setSearchParams({ organ: '', bloodGroup: '', city: '' }); fetchDonors({}); };

  // ── Message Donor ─────────────────────────────────────────────────────────
  const handleMessageDonor = (donorUser) => {
    navigate('/chat', { state: { newPartner: { _id: donorUser._id, name: donorUser.name, role: 'donor' } } });
  };

  // ── Download Donor Card ───────────────────────────────────────────────────
  const handleDownloadDonorCard = async (donorProfileId, donorName) => {
    setDownloadingCardId(donorProfileId);
    try {
      const response = await api.get(`/donor/${donorProfileId}/card`, { responseType: 'blob' });
      
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const downloadUrl = window.URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `DonorCard_${donorName?.replace(/\s+/g, '_') || 'JeevanSetu'}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (err) {
      console.error(err);
      alert('Failed to download donor card.');
    } finally {
      setDownloadingCardId(null);
    }
  };

  if (loading) return (
    <div className="container" style={{ padding: '3rem', textAlign: 'center' }}>
      <div style={{ color: 'var(--text-muted)' }}>Loading dashboard…</div>
    </div>
  );

  return (
    <div className="container animate-fade-in">
      {/* ── Header ── */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="page-title">Recipient Dashboard</h1>
          <p className="page-subtitle">Welcome, {user?.name}. Manage your organ requests.</p>
        </div>
        <button className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }} onClick={() => setShowModal(true)}>
          <Plus size={18} /> New Request
        </button>
      </div>

      {/* ── Stats ── */}
      <div className="dashboard-grid">
        <div className="stat-card glass-panel">
          <div className="stat-icon"><FileText size={24} /></div>
          <div className="stat-details"><h3>{requests.length}</h3><p>Total Requests</p></div>
        </div>
        <div className="stat-card glass-panel">
          <div className="stat-icon red"><AlertTriangle size={24} /></div>
          <div className="stat-details"><h3>{requests.filter(r => r.urgencyLevel === 'critical').length}</h3><p>Critical Requests</p></div>
        </div>
        <div className="stat-card glass-panel">
          <div className="stat-icon green"><Search size={24} /></div>
          <div className="stat-details"><h3>{availableDonors.length}</h3><p>Available Donors</p></div>
        </div>
      </div>
      <div style={{ marginTop: '2rem', display: 'grid', gap: '2rem' }}>

        {/* ── Auto-Matched Verified Donors ── */}
        {matchedVerifiedDonors.length > 0 && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#10b981' }}>
                <CheckCircle2 size={24} /> Verified Matches For Your Requests
              </h2>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.25rem' }}>
              {matchedVerifiedDonors.map(donor => (
                <div key={donor._id} className="glass-panel" style={{ padding: '1.5rem', position: 'relative', overflow: 'hidden' }}>
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: 'linear-gradient(90deg, var(--secondary), var(--primary))' }} />
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                    <div>
                      <h3 style={{ fontSize: '1.1rem', marginBottom: '0.25rem', color: '#e37c14' }}>{donor.user?.name}</h3>
                      <p style={{ color: 'green', fontSize: '0.85rem' }}>📍 {donor.city}, {donor.state}</p>
                    </div>
                    <span style={{ padding: '0.3rem 0.6rem', backgroundColor: 'var(--secondary-light)', color: 'var(--secondary)', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <CheckCircle2 size={12} /> Verified
                    </span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
                    <div style={{ backgroundColor: 'rgba(255,255,255,0.03)', padding: '0.75rem', borderRadius: '8px' }}>
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginBottom: '0.2rem' }}>Blood Group</p>
                      <p style={{ fontWeight: 700, color: 'red', fontSize: '1.1rem' }}>{donor.bloodGroup}</p>
                    </div>
                    <div style={{ backgroundColor: 'var(--bg-main)', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-light)' }}>
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginBottom: '0.2rem' }}>Age</p>
                      <p style={{ fontWeight: 600 }}>{donor.age} yrs</p>
                    </div>
                  </div>

                  <div style={{ marginBottom: '1.25rem' }}>
                    <p style={{ color: '#000000', fontSize: '0.75rem', marginBottom: '0.4rem' }}>Pledged Organs:</p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                      {donor.organs?.map(o => (
                        <span key={o} style={{ backgroundColor: '#e0ad7c', color: '#000000', padding: '0.25rem 0.6rem', borderRadius: '999px', fontSize: '0.75rem', textTransform: 'capitalize', fontWeight: 500 }}>
                          {o}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button onClick={() => handleMessageDonor(donor.user)} className="btn btn-primary" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem', padding: '0.6rem' }}>
                      <MessageSquare size={16} /> Contact
                    </button>
                    {donor.donorCardUrl && (
                      <button onClick={() => handleDownloadDonorCard(donor._id, donor.user?.name)} disabled={downloadingCardId === donor._id} className="btn btn-outline" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0.6rem 0.75rem' }} title="Download Donor Card">
                        <Download size={18} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── My Requests ── */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h2>Your Organ Requests</h2>
          </div>

          {requests.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {requests.map(req => {
                const badge = statusBadge(req.status);
                return (
                  <div key={req._id} className="glass-panel" style={{ padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                        <Heart size={18} color={urgencyColor(req.urgencyLevel)} />
                        <h3 style={{ textTransform: 'capitalize', fontSize: '1.1rem' }}>{req.organNeeded} Needed</h3>
                        <span style={{ padding: '0.2rem 0.6rem', borderRadius: '999px', fontSize: '0.72rem', fontWeight: 600, backgroundColor: `rgba(0,0,0,0.2)`, color: urgencyColor(req.urgencyLevel), border: `1px solid ${urgencyColor(req.urgencyLevel)}40`, textTransform: 'capitalize' }}>
                          {req.urgencyLevel}
                        </span>
                      </div>
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '0.25rem' }}>
                        🏥 {req.hospital} &nbsp;•&nbsp; 🩸 {req.bloodGroup} &nbsp;•&nbsp; 📍 {req.city}, {req.state}
                      </p>
                      {req.doctorNote && <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '0.25rem', fontStyle: 'italic' }}>"{req.doctorNote}"</p>}
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '0.5rem' }}>
                        <Clock size={12} style={{ display: 'inline', marginRight: '0.3rem' }} />
                        {new Date(req.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexShrink: 0 }}>
                      <span style={{ padding: '0.3rem 0.75rem', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 600, backgroundColor: badge.bg, color: badge.color }}>
                        {badge.label}
                      </span>
                      {req.status === 'waiting' && (
                        <button onClick={() => handleDeleteRequest(req._id)} className="btn-logout" style={{ padding: '0.4rem', color: 'var(--secondary)' }} title="Delete request">
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center' }}>
              <div style={{ width: '60px', height: '60px', backgroundColor: 'var(--primary-light)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem', color: 'var(--primary)' }}>
                <FileText size={28} />
              </div>
              <p style={{ color: 'white', marginBottom: '1.5rem' }}>You don't have any active organ requests yet.</p>
              <button className="btn btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }} onClick={() => setShowModal(true)}>
                <Plus size={18} /> Create Your First Request
              </button>
            </div>
          )}
        </div>

        {/* ── Available Donors + Search ── */}
        <div>
          <h2 style={{ marginBottom: '1rem' }}>Available Donors & Pledged Organs</h2>

          {/* Search Bar */}
          <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
            <form onSubmit={handleSearch} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', alignItems: 'end' }}>
              <div className="input-group" style={{ marginBottom: 0 }}>
                <label className="input-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><Heart size={14} /> Organ</label>
                <select name="organ" value={searchParams.organ} onChange={e => setSearchParams(p => ({ ...p, organ: e.target.value }))} className="input-field" style={{ appearance: 'none' }}>
                  <option value="">Any Organ</option>
                  {ORGANS.map(o => <option key={o} value={o} style={{ textTransform: 'capitalize' }}>{o.charAt(0).toUpperCase() + o.slice(1)}</option>)}
                </select>
              </div>
              <div className="input-group" style={{ marginBottom: 0 }}>
                <label className="input-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><Activity size={14} /> Blood Group</label>
                <select name="bloodGroup" value={searchParams.bloodGroup} onChange={e => setSearchParams(p => ({ ...p, bloodGroup: e.target.value }))} className="input-field" style={{ appearance: 'none' }}>
                  <option value="">Any Blood Group</option>
                  {BLOOD_GROUPS.map(bg => <option key={bg} value={bg}>{bg}</option>)}
                </select>
              </div>
              <div className="input-group" style={{ marginBottom: 0 }}>
                <label className="input-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><MapPin size={14} /> City</label>
                <input type="text" placeholder="e.g. Pune" value={searchParams.city} onChange={e => setSearchParams(p => ({ ...p, city: e.target.value }))} className="input-field" />
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', height: '46px' }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1, gap: '0.5rem' }} disabled={isSearching}>
                  <Search size={16} /> {isSearching ? '...' : 'Search'}
                </button>
                {(searchParams.organ || searchParams.bloodGroup || searchParams.city) && (
                  <button type="button" onClick={clearSearch} className="btn-logout" style={{ padding: '0 0.75rem', borderRadius: '10px' }} title="Clear">
                    <X size={18} />
                  </button>
                )}
              </div>
            </form>
          </div>

          {availableDonors.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
              {availableDonors.map(donor => (
                <div key={donor._id} className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                    <div>
                      <h3 style={{ fontSize: '1.1rem', marginBottom: '0.25rem', color: '#e37c14' }}>{donor.user?.name || 'Anonymous Donor'}</h3>
                      <p style={{ color: 'red', fontWeight: 700, marginBottom: '0.25rem' }}>Blood Group: {donor.bloodGroup}</p>
                      <p style={{ color: 'green', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        <MapPin size={13} /> {donor.city}, {donor.state}
                      </p>
                    </div>
                    <span style={{ padding: '0.25rem 0.6rem', borderRadius: '999px', fontSize: '0.7rem', fontWeight: 600, backgroundColor: 'var(--secondary-light)', color: 'var(--secondary)', border: '1px solid rgba(39,174,96,0.3)' }}>
                      <CheckCircle2 size={11} style={{ display: 'inline', marginRight: '0.25rem' }} />Active
                    </span>
                  </div>

                  <div style={{ marginBottom: '1.25rem' }}>
                    <p style={{ fontSize: '0.8rem', color: '#000000', marginBottom: '0.5rem' }}>Pledged Organs:</p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                      {donor.organs.map(organ => (
                        <span key={organ} style={{ backgroundColor: '#e0ad7c', border: 'none', color: '#000000', padding: '0.2rem 0.65rem', borderRadius: '999px', fontSize: '0.78rem', textTransform: 'capitalize', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                          <Heart size={11} /> {organ}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '0.75rem', marginTop: 'auto', width: '100%' }}>
                    {donor.user && (
                      <button
                        className="btn btn-donor-action"
                        style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', padding: '0.6rem', backgroundColor: '#e0ad7c', color: '#000000', border: 'none', fontWeight: 700 }}
                        onClick={() => handleMessageDonor(donor.user)}
                      >
                        <MessageSquare size={16} /> Message
                      </button>
                    )}
                    <button
                      className="btn btn-donor-action"
                      style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', padding: '0.6rem', backgroundColor: '#e0ad7c', color: '#000000', border: 'none', fontWeight: 700 }}
                      onClick={() => handleDownloadDonorCard(donor._id, donor.user?.name)}
                      disabled={downloadingCardId === donor._id}
                    >
                      <Download size={16} /> {downloadingCardId === donor._id ? '...' : 'Card'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center' }}>
              <Filter size={32} style={{ opacity: 0.3, marginBottom: '0.75rem' }} />
              <p style={{ color: 'var(--text-muted)' }}>No available donors found with those filters.</p>
              {(searchParams.organ || searchParams.bloodGroup || searchParams.city) && (
                <button className="btn btn-outline" style={{ marginTop: '1rem' }} onClick={clearSearch}>Clear Filters</button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Create Request Modal ── */}
      <Modal show={showModal} onClose={() => { setShowModal(false); setFormError(''); }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Plus size={22} color="var(--secondary)" /> New Organ Request
          </h2>
          <button onClick={() => { setShowModal(false); setFormError(''); }} className="btn-logout"><X size={22} /></button>
        </div>

        {formError && (
          <div style={{ padding: '0.875rem 1rem', backgroundColor: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '10px', marginBottom: '1rem', color: '#C0392B', fontSize: '0.875rem' }}>
            {formError}
          </div>
        )}

        <form onSubmit={handleCreateRequest}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="input-group">
              <label className="input-label">Organ Needed *</label>
              <select name="organNeeded" value={formData.organNeeded} onChange={handleFormChange} className="input-field" required style={{ appearance: 'none' }}>
                <option value="">Select Organ</option>
                {ORGANS.map(o => <option key={o} value={o} style={{ textTransform: 'capitalize' }}>{o.charAt(0).toUpperCase() + o.slice(1)}</option>)}
              </select>
            </div>
            <div className="input-group">
              <label className="input-label">Your Blood Group *</label>
              <select name="bloodGroup" value={formData.bloodGroup} onChange={handleFormChange} className="input-field" required style={{ appearance: 'none' }}>
                <option value="">Select</option>
                {BLOOD_GROUPS.map(bg => <option key={bg} value={bg}>{bg}</option>)}
              </select>
            </div>
            <div className="input-group" style={{ gridColumn: '1 / -1' }}>
              <label className="input-label">Urgency Level *</label>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                {URGENCY_LEVELS.map(level => (
                  <label key={level} style={{ flex: 1, padding: '0.75rem', borderRadius: '10px', cursor: 'pointer', textAlign: 'center', textTransform: 'capitalize', fontWeight: 600, fontSize: '0.875rem', border: `2px solid ${formData.urgencyLevel === level ? urgencyColor(level) : 'var(--border-color)'}`, backgroundColor: formData.urgencyLevel === level ? `${urgencyColor(level)}15` : 'transparent', color: formData.urgencyLevel === level ? urgencyColor(level) : 'var(--text-muted)', transition: 'all 0.2s' }}>
                    <input type="radio" name="urgencyLevel" value={level} checked={formData.urgencyLevel === level} onChange={handleFormChange} style={{ display: 'none' }} />
                    {level}
                  </label>
                ))}
              </div>
            </div>
            <div className="input-group" style={{ gridColumn: '1 / -1' }}>
              <label className="input-label">Hospital Name *</label>
              <input name="hospital" type="text" placeholder="e.g. Ruby Hall Clinic" value={formData.hospital} onChange={handleFormChange} className="input-field" required />
            </div>
            <div className="input-group">
              <label className="input-label">City *</label>
              <input name="city" type="text" placeholder="e.g. Pune" value={formData.city} onChange={handleFormChange} className="input-field" required />
            </div>
            <div className="input-group">
              <label className="input-label">State *</label>
              <input name="state" type="text" placeholder="e.g. Maharashtra" value={formData.state} onChange={handleFormChange} className="input-field" required />
            </div>
            <div className="input-group" style={{ gridColumn: '1 / -1' }}>
              <label className="input-label">Doctor's Note (optional)</label>
              <textarea name="doctorNote" rows={2} placeholder="Brief medical note from your doctor..." value={formData.doctorNote} onChange={handleFormChange} className="input-field" style={{ resize: 'vertical' }} />
            </div>
            <div className="input-group" style={{ gridColumn: '1 / -1' }}>
              <label className="input-label">Additional Information (optional)</label>
              <textarea name="additionalInfo" rows={2} placeholder="Any additional details..." value={formData.additionalInfo} onChange={handleFormChange} className="input-field" style={{ resize: 'vertical' }} />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
            <button type="submit" className="btn btn-secondary" style={{ flex: 1 }} disabled={isSubmitting}>
              {isSubmitting ? 'Submitting…' : '🚨 Submit Request'}
            </button>
            <button type="button" className="btn btn-outline" onClick={() => { setShowModal(false); setFormError(''); }}>Cancel</button>
          </div>
        </form>
      </Modal>

      {/* ── My Matches ── */}
      {matches.length > 0 && (
        <div style={{ marginTop: '2rem', marginBottom: '2rem' }}>
          <h2 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Trophy size={22} color="#f59e0b" /> My Organ Matches
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.25rem' }}>
            {matches.map(match => {
              const statusMap = {
                proposed:  { bg: 'var(--primary-light)',   color: 'var(--primary)',   label: 'Proposed' },
                confirmed: { bg: 'var(--secondary-light)', color: 'var(--secondary)', label: 'Confirmed 🎉' },
                completed: { bg: 'rgba(139,92,246,0.12)',  color: '#7C3AED',          label: 'Completed 💙' },
                cancelled: { bg: 'rgba(239,68,68,0.1)',    color: '#E03131',          label: 'Cancelled' },
              };
              const sc = statusMap[match.status] || statusMap.proposed;
              return (
                <div key={match._id} className="glass-panel" style={{ padding: '1.5rem', borderLeft: `3px solid ${sc.color}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Heart size={18} color="var(--secondary)" />
                      <h3 style={{ textTransform: 'capitalize', fontSize: '1.05rem' }}>{match.organ} Match</h3>
                    </div>
                    <span style={{ padding: '0.2rem 0.65rem', borderRadius: '999px', fontSize: '0.72rem', fontWeight: 600, backgroundColor: sc.bg, color: sc.color }}>{sc.label}</span>
                  </div>
                  <div style={{ display: 'grid', gap: '0.5rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                    <p>💔 Donor: <strong style={{ color: 'var(--text-main)' }}>{match.donor?.name}</strong></p>
                    <p><MapPin size={13} style={{ display: 'inline', marginRight: '0.25rem' }} />
                      Hospital: <strong style={{ color: 'var(--text-main)' }}>{match.hospital || 'TBD'}</strong>
                    </p>
                    <p><Clock size={13} style={{ display: 'inline', marginRight: '0.25rem' }} />
                      {new Date(match.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                  {match.notes && (
                    <p style={{ marginTop: '0.75rem', fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic', borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem' }}>
                      📋 {match.notes}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default RecipientDashboard;
