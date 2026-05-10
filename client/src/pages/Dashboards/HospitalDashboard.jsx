import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  Users, CheckCircle2, Clock, ShieldCheck, Heart, Activity,
  AlertTriangle, ChevronRight, Stethoscope, RefreshCw, X
} from 'lucide-react';
import api from '../../services/api';
import { ChromaGrid, ChromaCard } from '../../components/ChromaGrid';

const statusColors = {
  proposed:  { bg: 'var(--primary-light)',   color: 'var(--primary)'   },
  confirmed: { bg: 'var(--secondary-light)', color: 'var(--secondary)' },
  completed: { bg: 'rgba(139,92,246,0.12)', color: '#7C3AED'           },
  cancelled: { bg: 'rgba(239,68,68,0.1)',   color: '#E03131'           },
};

const Pill = ({ children, bg, color, style = {} }) => (
  <span style={{ padding: '0.2rem 0.65rem', borderRadius: '999px', fontSize: '0.72rem', fontWeight: 600, backgroundColor: bg, color, ...style }}>
    {children}
  </span>
);

const HospitalDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats]               = useState({ totalVerified: 0, totalPending: 0 });
  const [pendingDonors, setPendingDonors] = useState([]);
  const [recentMatches, setRecentMatches] = useState([]);
  const [loading, setLoading]           = useState(true);
  const [verifyLoading, setVerifyLoading] = useState('');
  const [matchStatusLoading, setMatchStatusLoading] = useState('');
  const [activeTab, setActiveTab]       = useState('pending');

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const res = await api.get('/hospital/dashboard');
      setStats(res.data.stats || {});
      setPendingDonors(res.data.pendingVerifications || []);
      setRecentMatches(res.data.recentMatches || []);
    } catch (err) { console.error('Failed to fetch hospital dashboard', err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchDashboard(); }, []);

  // ── Verify donor ────────────────────────────────────────────────────────────
  const handleVerify = async (donorProfileId) => {
    setVerifyLoading(donorProfileId);
    try {
      await api.patch(`/hospital/verify/${donorProfileId}`);
      setPendingDonors(prev => prev.filter(d => d._id !== donorProfileId));
      setStats(prev => ({ ...prev, totalVerified: prev.totalVerified + 1, totalPending: prev.totalPending - 1 }));
    } catch (err) { console.error('Verification failed', err); }
    finally { setVerifyLoading(''); }
  };

  const handleReject = async (donorProfileId) => {
    if (!window.confirm("Are you sure you want to reject this profile? The donor will be able to select a different hospital.")) return;
    setVerifyLoading(donorProfileId);
    try {
      await api.patch(`/hospital/reject/${donorProfileId}`);
      setPendingDonors(prev => prev.filter(d => d._id !== donorProfileId));
      setStats(prev => ({ ...prev, totalPending: prev.totalPending - 1 }));
    } catch (err) { console.error('Rejection failed', err); }
    finally { setVerifyLoading(''); }
  };

  // ── Update transplant status ────────────────────────────────────────────────
  const handleStatusChange = async (matchId, newStatus) => {
    setMatchStatusLoading(matchId);
    try {
      const res = await api.patch(`/hospital/transplant/${matchId}`, { status: newStatus });
      setRecentMatches(prev => prev.map(m => m._id === matchId ? { ...m, status: res.data.status } : m));
    } catch (err) { console.error('Status update failed', err); }
    finally { setMatchStatusLoading(''); }
  };

  const tabs = [
    { id: 'pending', label: `Pending Verifications (${pendingDonors.length})` },
    { id: 'matches', label: 'Recent Matches' },
  ];

  return (
    <div className="container animate-fade-in">
      {/* ── Header ── */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Stethoscope size={32} color="var(--primary)" /> Hospital Dashboard
          </h1>
          <p className="page-subtitle">Welcome, {user?.name}. Verify donors and manage transplant matches.</p>
        </div>
        <button onClick={fetchDashboard} className="btn btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }} disabled={loading}>
          <RefreshCw size={16} /> Refresh
        </button>
      </div>

      {/* ── Stats ── */}
      <div className="dashboard-grid">
        <div className="stat-card glass-panel">
          <div className="stat-icon green"><CheckCircle2 size={24} /></div>
          <div className="stat-details"><h3>{stats.totalVerified}</h3><p>Verified Donors</p></div>
        </div>
        <div className="stat-card glass-panel">
          <div className="stat-icon red"><Clock size={24} /></div>
          <div className="stat-details"><h3>{stats.totalPending}</h3><p>Pending Verification</p></div>
        </div>
        <div className="stat-card glass-panel">
          <div className="stat-icon"><Activity size={24} /></div>
          <div className="stat-details"><h3>{recentMatches.length}</h3><p>Active Matches</p></div>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div style={{ display: 'flex', gap: '0.5rem', margin: '2rem 0 1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '0.6rem 1.25rem', borderRadius: '8px 8px 0 0', border: 'none', cursor: 'pointer',
              backgroundColor: activeTab === tab.id ? 'var(--primary)' : 'transparent',
              color: activeTab === tab.id ? 'white' : 'var(--text-muted)',
              fontWeight: 600, fontSize: '0.9rem', transition: 'all 0.2s',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading…</div>
      ) : (
        <>
          {/* ══ Tab 1: Pending Verifications ════════════════════════════════ */}
          {activeTab === 'pending' && (
            <div>
              {pendingDonors.length === 0 ? (
                <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center' }}>
                  <CheckCircle2 size={40} style={{ color: 'var(--accent)', opacity: 0.4, marginBottom: '0.75rem' }} />
                  <p style={{ color: 'var(--text-muted)' }}>No pending donor verifications. All caught up! ✅</p>
                </div>
              ) : (
                <ChromaGrid columns={3}>
                  {pendingDonors.map(donor => (
                    <ChromaCard key={donor._id} borderColor="rgba(239, 68, 68, 0.5)" gradient="linear-gradient(145deg, rgba(239, 68, 68, 0.1), rgba(0,0,0,0.5))">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                        <div>
                          <h3 style={{ fontSize: '1.05rem', marginBottom: '0.25rem' }}>{donor.user?.name}</h3>
                          <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>{donor.user?.email}</p>
                          {donor.user?.phone && <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>📞 {donor.user.phone}</p>}
                        </div>
                        <Pill bg="rgba(239,68,68,0.1)" color="#E03131">Unverified</Pill>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem', fontSize: '0.85rem' }}>
                        <div>
                          <p style={{ color: 'var(--text-muted)', marginBottom: '0.15rem', fontSize: '0.75rem' }}>Blood Group</p>
                          <p style={{ fontWeight: 700, color: 'red' }}>{donor.bloodGroup}</p>
                        </div>
                        <div>
                          <p style={{ color: '#000000', marginBottom: '0.15rem', fontSize: '0.75rem' }}>Location</p>
                          <p style={{ fontWeight: 500, color: 'green' }}>{donor.city}, {donor.state}</p>
                        </div>
                        <div>
                          <p style={{ color: 'var(--text-muted)', marginBottom: '0.15rem', fontSize: '0.75rem' }}>Age</p>
                          <p>{donor.age} yrs</p>
                        </div>
                        <div>
                          <p style={{ color: 'var(--text-muted)', marginBottom: '0.15rem', fontSize: '0.75rem' }}>Submitted</p>
                          <p>{new Date(donor.createdAt).toLocaleDateString('en-IN')}</p>
                        </div>
                      </div>

                      <div style={{ marginBottom: '1rem' }}>
                        <p style={{ color: '#000000', fontSize: '0.75rem', marginBottom: '0.4rem' }}>Pledged Organs:</p>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                          {donor.organs?.map(o => (
                            <span key={o} style={{ backgroundColor: '#e0ad7c', border: 'none', color: '#000000', padding: '0.2rem 0.6rem', borderRadius: '999px', fontSize: '0.76rem', textTransform: 'capitalize', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                              <Heart size={10} /> {o}
                            </span>
                          ))}
                        </div>
                      </div>

                      {donor.medicalReport && (
                        <a href={donor.medicalReport} target="_blank" rel="noreferrer" className="btn btn-outline" style={{ fontSize: '0.8rem', padding: '0.4rem 0.875rem', marginBottom: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                          📄 View Medical Report
                        </a>
                      )}

                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                          onClick={() => handleReject(donor._id)}
                          disabled={verifyLoading === donor._id}
                          className="btn btn-outline"
                          style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem', color: '#ef4444', borderColor: '#ef4444' }}
                        >
                          <X size={16} />
                          Reject
                        </button>
                        <button
                          onClick={() => handleVerify(donor._id)}
                          disabled={verifyLoading === donor._id}
                          className="btn btn-primary"
                          style={{ flex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem' }}
                        >
                          <ShieldCheck size={16} />
                          {verifyLoading === donor._id ? 'Processing…' : 'Approve Profile'}
                        </button>
                      </div>
                    </ChromaCard>
                  ))}
                </ChromaGrid>
              )}
            </div>
          )}

          {/* ══ Tab 2: Recent Matches ════════════════════════════════════════ */}
          {activeTab === 'matches' && (
            <div>
              {recentMatches.length === 0 ? (
                <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center' }}>
                  <Activity size={40} style={{ opacity: 0.3, marginBottom: '0.75rem' }} />
                  <p style={{ color: 'var(--text-muted)' }}>No recent matches for this hospital yet.</p>
                </div>
              ) : (
                <div className="glass-panel" style={{ overflow: 'hidden' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                        {['Donor', 'Recipient', 'Organ', 'Status', 'Update Status'].map(h => (
                          <th key={h} style={{ padding: '0.875rem 1.25rem', textAlign: 'left', fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {recentMatches.map(match => {
                        const sc = statusColors[match.status] || statusColors.proposed;
                        return (
                          <tr key={match._id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                            <td style={{ padding: '1rem 1.25rem', fontWeight: 500 }}>{match.donor?.name}</td>
                            <td style={{ padding: '1rem 1.25rem', fontWeight: 500 }}>{match.recipient?.name}</td>
                            <td style={{ padding: '1rem 1.25rem', textTransform: 'capitalize', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                              <Heart size={14} color="var(--secondary)" /> {match.organ}
                            </td>
                            <td style={{ padding: '1rem 1.25rem' }}>
                              <Pill bg={sc.bg} color={sc.color} style={{ textTransform: 'capitalize' }}>{match.status}</Pill>
                            </td>
                            <td style={{ padding: '1rem 1.25rem' }}>
                              <select
                                className="input-field"
                                style={{ width: 'auto', appearance: 'none', padding: '0.35rem 0.75rem', fontSize: '0.82rem' }}
                                value={match.status}
                                onChange={e => handleStatusChange(match._id, e.target.value)}
                                disabled={matchStatusLoading === match._id || match.status === 'completed' || match.status === 'cancelled'}
                              >
                                {['proposed', 'confirmed', 'completed', 'cancelled'].map(s => (
                                  <option key={s} value={s} style={{ textTransform: 'capitalize' }}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                                ))}
                              </select>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default HospitalDashboard;
