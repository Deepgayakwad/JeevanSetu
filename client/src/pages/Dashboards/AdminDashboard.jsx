import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  Users, Heart, Activity, CheckCircle2, Clock, Ban, Trash2,
  ShieldCheck, Search, ChevronLeft, ChevronRight, BarChart3,
  UserCheck, AlertTriangle, Stethoscope
} from 'lucide-react';
import api from '../../services/api';

const roleBadge = (role) => {
  const map = {
    donor:     { bg: 'rgba(39,174,96,0.12)',    color: '#27AE60',   label: 'Donor' },
    recipient: { bg: 'rgba(47,128,237,0.12)',   color: '#2F80ED',   label: 'Recipient' },
    hospital:  { bg: 'rgba(86,204,242,0.15)',   color: '#0EA5C8',   label: 'Hospital' },
    admin:     { bg: 'rgba(139,92,246,0.12)',   color: '#7C3AED',   label: 'Admin' },
  };
  return map[role] || map.donor;
};

const Pill = ({ children, bg, color }) => (
  <span style={{ padding: '0.2rem 0.65rem', borderRadius: '999px', fontSize: '0.72rem', fontWeight: 600, backgroundColor: bg, color }}>
    {children}
  </span>
);

const AdminDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [roleFilter, setRoleFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [banLoading, setBanLoading] = useState('');
  const [deleteLoading, setDeleteLoading] = useState('');
  const [activeTab, setActiveTab] = useState('overview');

  // ── Fetch stats ─────────────────────────────────────────────────────────────
  const fetchStats = async () => {
    try {
      setLoadingStats(true);
      const res = await api.get('/admin/stats');
      setStats(res.data);
    } catch (err) { console.error('Failed to fetch stats', err); }
    finally { setLoadingStats(false); }
  };

  // ── Fetch users ─────────────────────────────────────────────────────────────
  const fetchUsers = async (page = 1) => {
    try {
      setLoadingUsers(true);
      const q = new URLSearchParams({ page, limit: 10 });
      if (roleFilter) q.append('role', roleFilter);
      if (searchQuery) q.append('search', searchQuery);
      const res = await api.get(`/admin/users?${q}`);
      setUsers(res.data.users);
      setPagination(res.data.pagination);
    } catch (err) { console.error('Failed to fetch users', err); }
    finally { setLoadingUsers(false); }
  };

  useEffect(() => { fetchStats(); }, []);
  useEffect(() => { fetchUsers(1); }, [roleFilter]);

  // ── Ban / Unban ─────────────────────────────────────────────────────────────
  const handleBan = async (userId) => {
    setBanLoading(userId);
    try {
      const res = await api.patch(`/admin/ban/${userId}`);
      setUsers(prev => prev.map(u => u._id === userId ? { ...u, isVerified: res.data.isVerified } : u));
    } catch (err) { console.error(err); }
    finally { setBanLoading(''); }
  };

  // ── Delete user ─────────────────────────────────────────────────────────────
  const handleDelete = async (userId, name) => {
    if (!window.confirm(`Permanently delete "${name}" and all their data? This cannot be undone.`)) return;
    setDeleteLoading(userId);
    try {
      await api.delete(`/admin/user/${userId}`);
      setUsers(prev => prev.filter(u => u._id !== userId));
      setPagination(prev => ({ ...prev, total: prev.total - 1 }));
    } catch (err) { console.error(err); }
    finally { setDeleteLoading(''); }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchUsers(1);
  };

  // ── Stat cards ──────────────────────────────────────────────────────────────
  const statCards = stats ? [
    { icon: <Users size={24} />,      label: 'Total Users',      value: stats.totalUsers,      cls: '' },
    { icon: <Heart size={24} />,       label: 'Donors',           value: stats.totalDonors,     cls: 'red' },
    { icon: <Activity size={24} />,    label: 'Recipients',       value: stats.totalRecipients, cls: '' },
    { icon: <Stethoscope size={24} />, label: 'Hospitals',        value: stats.totalHospitals,  cls: 'purple' },
    { icon: <CheckCircle2 size={24} />,label: 'Completed Matches',value: stats.completedMatches,cls: 'green' },
    { icon: <Clock size={24} />,       label: 'Pending Requests', value: stats.pendingRequests, cls: 'red' },
    { icon: <UserCheck size={24} />,   label: 'Verified Donors',  value: stats.verifiedDonors,  cls: 'green' },
    { icon: <BarChart3 size={24} />,   label: 'Total Matches',    value: stats.totalMatches,    cls: '' },
  ] : [];

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'users',    label: 'User Management' },
  ];

  return (
    <div className="container animate-fade-in">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <ShieldCheck size={32} color="var(--accent)" /> Admin Dashboard
          </h1>
          <p className="page-subtitle">Platform control centre — Manage users, verify donors, monitor stats.</p>
        </div>
        <Pill bg="rgba(139,92,246,0.12)" color="#7C3AED">Admin</Pill>
      </div>

      {/* ── Tabs ── */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => { setActiveTab(tab.id); if (tab.id === 'users') fetchUsers(1); }}
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

      {/* ══ TAB 1: Overview ══════════════════════════════════════════════════ */}
      {activeTab === 'overview' && (
        <>
          {loadingStats ? (
            <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '3rem' }}>Loading stats…</p>
          ) : (
            <>
              {/* Stat grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
                {statCards.map((s, i) => (
                  <div key={i} className="stat-card glass-panel">
                    <div className={`stat-icon ${s.cls}`}>{s.icon}</div>
                    <div className="stat-details"><h3>{s.value}</h3><p>{s.label}</p></div>
                  </div>
                ))}
              </div>

              {/* Monthly match trend */}
              {stats?.monthlyMatches?.length > 0 && (
                <div className="glass-panel" style={{ padding: '1.5rem' }}>
                  <h2 style={{ marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <BarChart3 size={20} /> Match Trend — Last 6 Months
                  </h2>
                  <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.75rem', height: '100px' }}>
                    {stats.monthlyMatches.map((m, i) => {
                      const max = Math.max(...stats.monthlyMatches.map(x => x.count), 1);
                      const height = Math.max((m.count / max) * 100, 6);
                      const months = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                      return (
                        <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem' }}>
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{m.count}</span>
                          <div style={{ width: '100%', height: `${height}%`, backgroundColor: 'var(--primary)', borderRadius: '6px 6px 0 0', opacity: 0.8, transition: 'height 0.5s' }} />
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{months[m._id.month]}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* ══ TAB 2: User Management ══════════════════════════════════════════ */}
      {activeTab === 'users' && (
        <div>
          {/* Search + Filter bar */}
          <div className="glass-panel" style={{ padding: '1.25rem 1.5rem', marginBottom: '1.5rem' }}>
            <form onSubmit={handleSearch} style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
                <Search size={16} style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  className="input-field"
                  placeholder="Search by name or email…"
                  style={{ paddingLeft: '2.5rem' }}
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                />
              </div>
              <select
                className="input-field"
                style={{ width: '160px', appearance: 'none' }}
                value={roleFilter}
                onChange={e => setRoleFilter(e.target.value)}
              >
                <option value="">All Roles</option>
                <option value="donor">Donor</option>
                <option value="recipient">Recipient</option>
                <option value="hospital">Hospital</option>
                <option value="admin">Admin</option>
              </select>
              <button type="submit" className="btn btn-primary" style={{ whiteSpace: 'nowrap' }}>
                <Search size={16} style={{ marginRight: '0.4rem' }} /> Search
              </button>
            </form>
          </div>

          {/* Users table */}
          {loadingUsers ? (
            <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '3rem' }}>Loading users…</p>
          ) : (
            <>
              <div className="glass-panel" style={{ overflow: 'hidden' }}>
                <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between' }}>
                  <h3 style={{ fontSize: '0.95rem' }}>Users ({pagination.total})</h3>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Page {pagination.page} of {pagination.pages}</span>
                </div>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                        {['Name', 'Email', 'Role', 'Status', 'Joined', 'Actions'].map(h => (
                          <th key={h} style={{ padding: '0.875rem 1.25rem', textAlign: 'left', fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {users.map(u => {
                        const rb = roleBadge(u.role);
                        return (
                          <tr key={u._id} style={{ borderBottom: '1px solid var(--border-color)', transition: 'background 0.15s' }}
                            onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(47,128,237,0.03)'}
                            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                          >
                            <td style={{ padding: '1rem 1.25rem' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <div style={{ width: '34px', height: '34px', borderRadius: '50%', backgroundColor: rb.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: rb.color, flexShrink: 0 }}>
                                  <Users size={16} />
                                </div>
                                <span style={{ fontWeight: 500, fontSize: '0.9rem' }}>{u.name}</span>
                              </div>
                            </td>
                            <td style={{ padding: '1rem 1.25rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>{u.email}</td>
                            <td style={{ padding: '1rem 1.25rem' }}>
                              <Pill bg={rb.bg} color={rb.color}>{rb.label}</Pill>
                            </td>
                            <td style={{ padding: '1rem 1.25rem' }}>
                              {u.isVerified
                                ? <Pill bg="var(--secondary-light)" color="var(--secondary)">Active</Pill>
                                : <Pill bg="rgba(239,68,68,0.1)" color="#E03131">Banned</Pill>}
                            </td>
                            <td style={{ padding: '1rem 1.25rem', color: 'var(--text-muted)', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                              {new Date(u.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </td>
                            <td style={{ padding: '1rem 1.25rem' }}>
                              {u.role !== 'admin' && (
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                  <button
                                    onClick={() => handleBan(u._id)}
                                    disabled={banLoading === u._id}
                                    className="btn btn-outline"
                                    style={{ padding: '0.35rem 0.75rem', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                                    title={u.isVerified ? 'Ban user' : 'Unban user'}
                                  >
                                    <Ban size={13} /> {banLoading === u._id ? '…' : u.isVerified ? 'Ban' : 'Unban'}
                                  </button>
                                  <button
                                    onClick={() => handleDelete(u._id, u.name)}
                                    disabled={deleteLoading === u._id}
                                    className="btn-logout"
                                    style={{ padding: '0.35rem 0.5rem', color: '#E03131', border: '1px solid rgba(239,68,68,0.25)', borderRadius: '6px' }}
                                    title="Delete user permanently"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </div>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  {users.length === 0 && (
                    <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                      <AlertTriangle size={28} style={{ opacity: 0.3, marginBottom: '0.5rem' }} />
                      <p>No users found.</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Pagination */}
              {pagination.pages > 1 && (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.75rem', marginTop: '1.5rem' }}>
                  <button
                    onClick={() => fetchUsers(pagination.page - 1)}
                    disabled={pagination.page === 1}
                    className="btn btn-outline"
                    style={{ padding: '0.5rem 0.875rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                  >
                    <ChevronLeft size={16} /> Prev
                  </button>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Page {pagination.page} / {pagination.pages}</span>
                  <button
                    onClick={() => fetchUsers(pagination.page + 1)}
                    disabled={pagination.page === pagination.pages}
                    className="btn btn-outline"
                    style={{ padding: '0.5rem 0.875rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                  >
                    Next <ChevronRight size={16} />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
