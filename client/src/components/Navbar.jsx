import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { io } from 'socket.io-client';
import { Heart, User, LogOut, MessageSquare, Activity, Bell, X, CheckCheck, Clock } from 'lucide-react';
import './Navbar.css';
import api from '../services/api';

const SOCKET_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loadingNotifs, setLoadingNotifs] = useState(false);
  const dropdownRef = useRef(null);

  // ── Fetch notifications ─────────────────────────────────────────────────────
  const fetchNotifications = async () => {
    if (!user) return;
    try {
      setLoadingNotifs(true);
      const res = await api.get('/notifications');
      setNotifications(res.data.notifications || []);
      setUnreadCount(res.data.unreadCount || 0);
    } catch (err) {
      console.error('Failed to fetch notifications', err);
    } finally {
      setLoadingNotifs(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [user]);

  // ── Real-time socket notifications ─────────────────────────────────────────
  useEffect(() => {
    if (!user) return;
    const socket = io(SOCKET_URL, { transports: ['websocket', 'polling'] });
    socket.emit('join', user._id);
    socket.on('notification', (notif) => {
      setNotifications(prev => [notif, ...prev].slice(0, 20));
      setUnreadCount(prev => prev + 1);
    });
    return () => socket.disconnect();
  }, [user]);

  // ── Close dropdown on outside click ────────────────────────────────────────
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleMarkAllRead = async () => {
    try {
      await api.patch('/notifications/readall');
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) { console.error(err); }
  };

  const handleMarkRead = async (id) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) { console.error(err); }
  };

  const handleDeleteNotif = async (e, id) => {
    e.stopPropagation();
    try {
      await api.delete(`/notifications/${id}`);
      const wasUnread = notifications.find(n => n._id === id)?.isRead === false;
      setNotifications(prev => prev.filter(n => n._id !== id));
      if (wasUnread) setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) { console.error(err); }
  };

  const handleLogout = () => { logout(); navigate('/login'); };

  const getDashboardLink = () => {
    if (!user) return '/login';
    const routes = { donor: '/dashboard/donor', recipient: '/dashboard/recipient', hospital: '/dashboard/hospital', admin: '/dashboard/admin' };
    return routes[user.role] || '/';
  };

  const typeIcon = (type) => {
    const icons = { match: '🎉', verify: '✅', sos: '🚨', chat: '💬', info: 'ℹ️' };
    return icons[type] || '🔔';
  };

  const timeAgo = (dateStr) => {
    const diff = (Date.now() - new Date(dateStr)) / 1000;
    if (diff < 60) return 'just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  return (
    <nav className="navbar glass-panel">
      <div className="navbar-container">
        <Link to="/" className="navbar-logo">
          <Heart className="logo-icon" size={28} fill="#db834d" color="#db834d" />
          <span style={{ color: '#db834d' }}>JeevanSetu</span>
        </Link>

        <div className="navbar-links">
          {user ? (
            <>
              <Link to={getDashboardLink()} className="nav-item">
                <Activity size={20} />
                <span>Dashboard</span>
              </Link>
              <Link to="/chat" className="nav-item">
                <MessageSquare size={20} />
                <span>Messages</span>
              </Link>

              {/* ── Notification Bell ── */}
              <div ref={dropdownRef} style={{ position: 'relative' }}>
                <button
                  className="nav-item"
                  onClick={() => { setShowDropdown(p => !p); if (!showDropdown) fetchNotifications(); }}
                  style={{ position: 'relative', background: 'none', border: 'none', cursor: 'pointer', color: showDropdown ? 'var(--primary)' : undefined }}
                  title="Notifications"
                >
                  <Bell size={20} />
                  <span>Alerts</span>
                  {unreadCount > 0 && (
                    <span style={{
                      position: 'absolute', top: '2px', right: '2px',
                      backgroundColor: 'var(--secondary)', color: 'white',
                      fontSize: '0.6rem', fontWeight: 700,
                      width: '16px', height: '16px', borderRadius: '50%',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      animation: 'pulse 2s infinite',
                    }}>
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>

                {/* Dropdown */}
                {showDropdown && (
                  <div style={{
                    position: 'absolute', top: 'calc(100% + 10px)', right: 0,
                    width: '360px', maxHeight: '420px',
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '16px',
                    boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
                    zIndex: 200,
                    display: 'flex', flexDirection: 'column',
                    overflow: 'hidden',
                    animation: 'fadeIn 0.2s ease',
                  }}>
                    {/* Header */}
                    <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <h3 style={{ fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Bell size={16} /> Notifications {unreadCount > 0 && <span style={{ backgroundColor: 'var(--secondary)', color: 'white', fontSize: '0.65rem', padding: '0.1rem 0.4rem', borderRadius: '999px' }}>{unreadCount}</span>}
                      </h3>
                      {unreadCount > 0 && (
                        <button onClick={handleMarkAllRead} style={{ background: 'none', border: 'none', color: 'var(--primary)', fontSize: '0.75rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <CheckCheck size={13} /> Mark all read
                        </button>
                      )}
                    </div>

                    {/* List */}
                    <div style={{ overflowY: 'auto', flex: 1 }}>
                      {loadingNotifs ? (
                        <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>Loading…</div>
                      ) : notifications.length === 0 ? (
                        <div style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                          <Bell size={28} style={{ opacity: 0.3, marginBottom: '0.5rem' }} />
                          <p style={{ fontSize: '0.875rem' }}>No notifications yet.</p>
                        </div>
                      ) : (
                        notifications.map(notif => (
                          <div
                            key={notif._id}
                            onClick={() => !notif.isRead && handleMarkRead(notif._id)}
                            style={{
                              padding: '0.875rem 1.25rem',
                              borderBottom: '1px solid var(--border-color)',
                              cursor: notif.isRead ? 'default' : 'pointer',
                              backgroundColor: notif.isRead ? 'transparent' : 'rgba(59,130,246,0.05)',
                              display: 'flex', gap: '0.75rem', alignItems: 'flex-start',
                              transition: 'background 0.2s',
                              position: 'relative',
                            }}
                          >
                            <span style={{ fontSize: '1.25rem', flexShrink: 0 }}>{typeIcon(notif.type)}</span>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <p style={{ fontWeight: notif.isRead ? 400 : 600, fontSize: '0.85rem', marginBottom: '0.2rem' }}>{notif.title}</p>
                              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>{notif.message}</p>
                              <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.3rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                <Clock size={11} /> {timeAgo(notif.createdAt)}
                              </p>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem', flexShrink: 0 }}>
                              {!notif.isRead && <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--primary)', display: 'inline-block' }} />}
                              <button onClick={(e) => handleDeleteNotif(e, notif._id)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.15rem' }} title="Dismiss">
                                <X size={13} />
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* User profile */}
              <div className="user-profile">
                <div className="avatar"><User size={20} /></div>
                <span className="user-name">{user.name}</span>
                <span className="user-role badge">{user.role}</span>
              </div>
              <button onClick={handleLogout} className="btn-logout"><LogOut size={20} /></button>
            </>
          ) : (
            <>
              <Link to="/login" className="nav-link">Login</Link>
              <Link to="/register" className="btn btn-primary">Register</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
