import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from '../../context/AuthContext';
import { Send, User, MessageSquare, Heart, ArrowLeft } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../../services/api';

const SOCKET_URL =
  import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

const buildRoom = (id1, id2) =>
  [id1.toString(), id2.toString()].sort().join('_');

const ChatRoom = () => {
  const { user } = useAuth();
  const location = useLocation();   // ✅ React Router's useLocation — NOT window.location
  const navigate = useNavigate();

  const [socket, setSocket] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [selectedPartner, setSelectedPartner] = useState(null);
  const [currentRoom, setCurrentRoom] = useState('');
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [typingUser, setTypingUser] = useState('');
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const inputRef = useRef(null);

  // ── Fetch all conversations ─────────────────────────────────────────────────
  const fetchConversations = async () => {
    try {
      const res = await api.get('/chat/conversations');
      setConversations(res.data);
    } catch (err) {
      console.error('Failed to fetch conversations', err);
    }
  };

  useEffect(() => {
    fetchConversations();
  }, []);

  // ── Handle partner passed via navigation state (from "Message Donor" btn) ──
  useEffect(() => {
    if (!location.state?.newPartner || !user) return;

    const newPartner = location.state.newPartner;
    const room = buildRoom(user._id, newPartner._id);

    const existing = conversations.find(
      (c) => c.partner._id === newPartner._id
    );

    if (existing) {
      setSelectedPartner(existing.partner);
      setCurrentRoom(existing.room);
    } else {
      const tempConv = {
        partner: newPartner,
        lastMessage: 'Start the conversation…',
        room,
        unreadCount: 0,
      };
      setConversations((prev) =>
        prev.some((c) => c.partner._id === newPartner._id)
          ? prev
          : [tempConv, ...prev]
      );
      setSelectedPartner(newPartner);
      setCurrentRoom(room);
    }

    // Clear navigation state so a refresh doesn't re-trigger this
    window.history.replaceState({}, document.title);
  }, [location.state, user]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Fetch chat history whenever partner changes ─────────────────────────────
  useEffect(() => {
    if (!selectedPartner) return;
    setMessages([]);
    setLoadingHistory(true);
    api
      .get(`/chat/${selectedPartner._id}`)
      .then((res) => setMessages(res.data))
      .catch((err) => console.error('Failed to fetch chat history', err))
      .finally(() => setLoadingHistory(false));
  }, [selectedPartner]);

  // ── Socket.io connection ────────────────────────────────────────────────────
  useEffect(() => {
    if (!user) return;
    const newSocket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
    });
    setSocket(newSocket);
    newSocket.emit('join', user._id); // personal notification room

    return () => newSocket.disconnect();
  }, [user]);

  // ── Join room + listen for events ──────────────────────────────────────────
  useEffect(() => {
    if (!socket || !currentRoom) return;

    socket.emit('chat:join', currentRoom);

    const handleNewMessage = (msg) => {
      if (msg.room !== currentRoom) return;
      setMessages((prev) => {
        if (prev.some((m) => m._id === msg._id)) return prev; // dedup
        return [...prev, msg];
      });
      fetchConversations(); // refresh sidebar last-message preview
    };

    const handleTyping = ({ userName }) => {
      if (userName !== user?.name) {
        setTypingUser(userName);
        setIsTyping(true);
      }
    };

    const handleStopTyping = () => {
      setIsTyping(false);
      setTypingUser('');
    };

    socket.on('chat:message', handleNewMessage);
    socket.on('chat:typing', handleTyping);
    socket.on('chat:stopTyping', handleStopTyping);

    return () => {
      socket.off('chat:message', handleNewMessage);
      socket.off('chat:typing', handleTyping);
      socket.off('chat:stopTyping', handleStopTyping);
    };
  }, [socket, currentRoom, user]);

  // ── Auto-scroll ─────────────────────────────────────────────────────────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // ── Focus input when partner changes ───────────────────────────────────────
  useEffect(() => {
    if (selectedPartner) inputRef.current?.focus();
  }, [selectedPartner]);

  const selectConversation = (conv) => {
    setSelectedPartner(conv.partner);
    setCurrentRoom(conv.room);
  };

  // ── Send message ────────────────────────────────────────────────────────────
  const handleSendMessage = async (e) => {
    e?.preventDefault();
    const text = newMessage.trim();
    if (!text || !selectedPartner || isSending) return;

    setIsSending(true);
    setNewMessage('');
    socket?.emit('chat:stopTyping', { room: currentRoom });
    clearTimeout(typingTimeoutRef.current);

    try {
      await api.post('/chat/send', {
        receiverId: selectedPartner._id,
        message: text,
      });
      // Backend emits 'chat:message' via Socket → our listener appends it
    } catch (err) {
      console.error('Failed to send message', err);
      setNewMessage(text); // restore on error
    } finally {
      setIsSending(false);
    }
  };

  // ── Typing indicator ────────────────────────────────────────────────────────
  const handleTypingChange = (e) => {
    setNewMessage(e.target.value);
    if (!socket || !currentRoom) return;

    if (e.target.value.length > 0) {
      socket.emit('chat:typing', { room: currentRoom, userName: user.name });
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        socket.emit('chat:stopTyping', { room: currentRoom });
      }, 2000);
    } else {
      socket.emit('chat:stopTyping', { room: currentRoom });
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // ── Helpers ─────────────────────────────────────────────────────────────────
  const avatarStyle = (role) => ({
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    backgroundColor:
      role === 'donor' ? 'rgba(239,68,68,0.15)' : 'rgba(59,130,246,0.15)',
    color: role === 'donor' ? 'var(--secondary)' : 'var(--primary)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  });

  const rolePill = (role) => (
    <span
      style={{
        padding: '0.15rem 0.6rem',
        borderRadius: '999px',
        fontSize: '0.7rem',
        fontWeight: 600,
        textTransform: 'capitalize',
        backgroundColor:
          role === 'donor'
            ? 'rgba(239,68,68,0.15)'
            : 'rgba(59,130,246,0.15)',
        color: role === 'donor' ? 'var(--secondary)' : 'var(--primary)',
        border: `1px solid ${
          role === 'donor'
            ? 'rgba(239,68,68,0.3)'
            : 'rgba(59,130,246,0.3)'
        }`,
      }}
    >
      {role}
    </span>
  );

  // ═══════════════════════════════════════════════════════════════════════════
  return (
    <div
      className="container animate-fade-in"
      style={{
        maxWidth: '1100px',
        height: 'calc(100vh - 120px)',
        display: 'flex',
        gap: '1.5rem',
        padding: '1rem 1.5rem',
      }}
    >
      {/* ── Sidebar ─────────────────────────────────────────────────────────── */}
      <div
        className="glass-panel"
        style={{
          width: '300px',
          minWidth: '260px',
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          overflow: 'hidden',
          background: '#0d2233',
          border: '1px solid rgba(110,231,183,0.15)',
        }}
      >
        {/* Sidebar header */}
        <div
          style={{
            padding: '1.25rem 1.5rem',
            borderBottom: '1px solid var(--border-color)',
          }}
        >
          <h2
            style={{
              fontSize: '1.1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              color: '#ffffff',
            }}
          >
            <MessageSquare size={20} /> Messages
          </h2>
          <p
            style={{
              fontSize: '0.75rem',
              color: 'rgba(255,255,255,0.7)',
              marginTop: '0.25rem',
            }}
          >
            {conversations.length} conversation
            {conversations.length !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Conversation list */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '0.75rem' }}>
          {conversations.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                marginTop: '3rem',
                color: 'var(--text-muted)',
              }}
            >
              <MessageSquare
                size={32}
                style={{ opacity: 0.3, marginBottom: '0.75rem' }}
              />
              <p style={{ fontSize: '0.85rem' }}>No conversations yet.</p>
              <p style={{ fontSize: '0.75rem', marginTop: '0.25rem' }}>
                Go to the Recipient Dashboard and click "Message Donor" to
                start!
              </p>
            </div>
          ) : (
            conversations.map((conv, idx) => {
              const isActive =
                selectedPartner?._id === conv.partner._id;
              return (
                <div
                  key={conv.partner._id || idx}
                  onClick={() => selectConversation(conv)}
                  style={{
                    padding: '0.875rem 1rem',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    backgroundColor: isActive
                      ? 'rgba(59,130,246,0.1)'
                      : 'transparent',
                    border: `1px solid ${
                      isActive
                        ? 'rgba(59,130,246,0.3)'
                        : 'transparent'
                    }`,
                    marginBottom: '0.4rem',
                    display: 'flex',
                    gap: '0.75rem',
                    alignItems: 'center',
                    transition: 'all 0.2s',
                  }}
                >
                  <div style={avatarStyle(conv.partner.role)}>
                    {conv.partner.role === 'donor' ? (
                      <Heart size={18} />
                    ) : (
                      <User size={18} />
                    )}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        marginBottom: '0.15rem',
                      }}
                    >
                      <h4
                        style={{
                          margin: 0,
                          fontSize: '0.9rem',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          color: '#ffffff',
                        }}
                      >
                        {conv.partner.name}
                      </h4>
                      {conv.unreadCount > 0 && (
                        <span
                          style={{
                            backgroundColor: 'var(--secondary)',
                            color: 'white',
                            fontSize: '0.65rem',
                            padding: '0.1rem 0.4rem',
                            borderRadius: '10px',
                            flexShrink: 0,
                          }}
                        >
                          {conv.unreadCount}
                        </span>
                      )}
                    </div>
                    <p
                      style={{
                        margin: 0,
                        fontSize: '0.75rem',
                        color: 'rgba(255,255,255,0.7)',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {conv.lastMessage}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ── Main Chat Area ───────────────────────────────────────────────────── */}
      <div
        className="glass-panel"
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          overflow: 'hidden',
          background: '#0d2233',
          border: '1px solid rgba(110,231,183,0.15)',
        }}
      >
        {!selectedPartner ? (
          /* Empty state */
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-muted)',
            }}
          >
            <div
              style={{
                width: '80px',
                height: '80px',
                borderRadius: '50%',
                backgroundColor: 'rgba(59,130,246,0.08)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '1.5rem',
              }}
            >
              <MessageSquare size={36} style={{ opacity: 0.4 }} />
            </div>
            <h3 style={{ marginBottom: '0.5rem' }}>
              No conversation selected
            </h3>
            <p
              style={{
                fontSize: '0.875rem',
                textAlign: 'center',
                maxWidth: '280px',
              }}
            >
              Pick a conversation from the sidebar, or go back and click
              "Message Donor".
            </p>
            <button
              className="btn btn-outline"
              style={{
                marginTop: '1.5rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}
              onClick={() => navigate(-1)}
            >
              <ArrowLeft size={16} /> Go Back
            </button>
          </div>
        ) : (
          <>
            {/* Chat header */}
            <div
              style={{
                padding: '1rem 1.5rem',
                borderBottom: '1px solid var(--border-color)',
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
              }}
            >
              <button
                onClick={() => setSelectedPartner(null)}
                className="btn-logout"
                style={{ padding: '0.4rem' }}
                title="Back to list"
              >
                <ArrowLeft size={20} />
              </button>

              <div
                style={{
                  ...avatarStyle(selectedPartner.role),
                  width: '44px',
                  height: '44px',
                }}
              >
                {selectedPartner.role === 'donor' ? (
                  <Heart size={22} />
                ) : (
                  <User size={22} />
                )}
              </div>

              <div style={{ flex: 1 }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    marginBottom: '0.15rem',
                  }}
                >
                  <h2 style={{ fontSize: '1.05rem', margin: 0, color: '#ffffff' }}>
                    {selectedPartner.name}
                  </h2>
                  {rolePill(selectedPartner.role)}
                </div>
                <p
                  style={{
                    color: 'var(--text-muted)',
                    fontSize: '0.75rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    margin: 0,
                  }}
                >
                  <span
                    style={{
                      width: '7px',
                      height: '7px',
                      borderRadius: '50%',
                      backgroundColor: 'var(--accent)',
                      display: 'inline-block',
                    }}
                  />
                  Online
                </p>
              </div>
            </div>

            {/* Messages area */}
            <div
              style={{
                flex: 1,
                overflowY: 'auto',
                padding: '1.5rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem',
              }}
            >
              {loadingHistory ? (
                <div
                  style={{
                    margin: 'auto',
                    color: 'var(--text-muted)',
                    textAlign: 'center',
                  }}
                >
                  Loading messages…
                </div>
              ) : messages.length === 0 ? (
                <div
                  style={{
                    margin: 'auto',
                    textAlign: 'center',
                    color: 'var(--text-muted)',
                  }}
                >
                  <Heart
                    size={32}
                    style={{ opacity: 0.3, marginBottom: '0.5rem' }}
                  />
                  <p>No messages yet.</p>
                  <p style={{ fontSize: '0.875rem' }}>
                    Say hello and start the conversation! 👋
                  </p>
                </div>
              ) : (
                messages.map((msg, idx) => {
                  const senderId =
                    typeof msg.sender === 'object'
                      ? msg.sender._id
                      : msg.sender;
                  const isMe = senderId === user?._id;
                  const senderName =
                    typeof msg.sender === 'object'
                      ? msg.sender.name
                      : selectedPartner.name;
                  const time = new Date(
                    msg.createdAt
                  ).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  });

                  return (
                    <div
                      key={msg._id || idx}
                      style={{
                        alignSelf: isMe ? 'flex-end' : 'flex-start',
                        maxWidth: '72%',
                      }}
                    >
                      {!isMe && (
                        <p
                          style={{
                            fontSize: '0.72rem',
                            color: 'rgba(255,255,255,0.8)',
                            marginBottom: '0.2rem',
                            marginLeft: '0.5rem',
                            fontWeight: 600,
                          }}
                        >
                          {senderName}
                        </p>
                      )}
                      <div
                        style={{
                          padding: '0.65rem 1rem',
                          borderRadius: '16px',
                          background: isMe
                            ? 'linear-gradient(135deg, #2F80ED, #56CCF2)'
                            : '#1F3B4D',
                          color: 'white',
                          borderBottomRightRadius: isMe ? '4px' : '16px',
                          borderBottomLeftRadius: !isMe
                            ? '4px'
                            : '16px',
                          lineHeight: 1.5,
                          wordBreak: 'break-word',
                        }}
                      >
                        {msg.message}
                      </div>
                      <p
                        style={{
                          fontSize: '0.68rem',
                          color: 'var(--text-muted)',
                          marginTop: '0.2rem',
                          textAlign: isMe ? 'right' : 'left',
                          paddingInline: '0.5rem',
                        }}
                      >
                        {time}
                      </p>
                    </div>
                  );
                })
              )}

              {/* Typing indicator */}
              {isTyping && (
                <div
                  style={{
                    alignSelf: 'flex-start',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    color: 'var(--text-muted)',
                    fontSize: '0.82rem',
                    fontStyle: 'italic',
                    marginLeft: '0.5rem',
                  }}
                >
                  <div style={{ display: 'flex', gap: '3px' }}>
                    {[0, 0.2, 0.4].map((delay, i) => (
                      <span
                        key={i}
                        style={{
                          width: '6px',
                          height: '6px',
                          borderRadius: '50%',
                          backgroundColor: 'var(--text-muted)',
                          animation: `fadeIn 1s infinite alternate ${delay}s`,
                        }}
                      />
                    ))}
                  </div>
                  {typingUser} is typing…
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input bar */}
            <div
              style={{
                padding: '1rem 1.5rem',
                borderTop: '1px solid var(--border-color)',
              }}
            >
              <form
                onSubmit={handleSendMessage}
                style={{
                  display: 'flex',
                  gap: '0.75rem',
                  alignItems: 'center',
                }}
              >
                <input
                  ref={inputRef}
                  type="text"
                  className="input-field"
                  placeholder={`Message ${selectedPartner.name}…`}
                  style={{ flex: 1, backgroundColor: '#0d2233', color: '#ffffff', border: '1px solid rgba(110, 231, 183, 0.2)' }}
                  value={newMessage}
                  onChange={handleTypingChange}
                  onKeyDown={handleKeyDown}
                />
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{
                    padding: 0,
                    width: '46px',
                    height: '46px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '50%',
                    flexShrink: 0,
                  }}
                  disabled={!newMessage.trim() || isSending}
                >
                  <Send size={18} />
                </button>
              </form>
              <p
                style={{
                  fontSize: '0.7rem',
                  color: 'var(--text-muted)',
                  marginTop: '0.4rem',
                  textAlign: 'right',
                }}
              >
                Press Enter to send
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ChatRoom;
