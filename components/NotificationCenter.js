'use client';
import { useState, useEffect } from 'react';
import { Bell, X, Check, AlertCircle, Info, CheckCircle, Zap } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function NotificationCenter() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (user) {
      fetchNotifications();
      // Poll for new notifications every 30 seconds
      const interval = setInterval(fetchNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const fetchNotifications = async () => {
    try {
      const res = await fetch(`/api/notifications?userId=${user.userId}&role=${user.role?.toLowerCase() || 'consumer'}`);
      const data = await res.json();
      const notifs = Array.isArray(data) ? data : [];
      setNotifications(notifs);
      setUnreadCount(notifs.filter(n => !n.read).length);
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      await fetch(`/api/notifications/${notificationId}/read`, { method: 'PUT' });
      setNotifications(prev => 
        prev.map(n => n._id === notificationId ? { ...n, read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Failed to mark as read:', err);
    }
  };

  const markAllAsRead = async () => {
    try {
      await fetch(`/api/notifications/mark-all-read?userId=${user.userId}`, { method: 'PUT' });
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
  };

  const deleteNotification = async (notificationId) => {
    try {
      await fetch(`/api/notifications/${notificationId}`, { method: 'DELETE' });
      setNotifications(prev => prev.filter(n => n._id !== notificationId));
      fetchNotifications();
    } catch (err) {
      console.error('Failed to delete notification:', err);
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case 'alert': return <AlertCircle size={20} color="#ef4444" />;
      case 'success': return <CheckCircle size={20} color="#10b981" />;
      case 'info': return <Info size={20} color="#3b82f6" />;
      case 'energy': return <Zap size={20} color="#f59e0b" />;
      default: return <Bell size={20} color="#64748b" />;
    }
  };

  const getTimeAgo = (date) => {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  if (!user) return null;

  return (
    <>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        style={{
          position: 'relative',
          width: '40px',
          height: '40px',
          borderRadius: '50%',
          border: 'none',
          background: 'white',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          transition: 'all 0.2s'
        }}
      >
        <Bell size={20} color="#1e293b" />
        {unreadCount > 0 && (
          <span style={{
            position: 'absolute',
            top: '-4px',
            right: '-4px',
            background: '#ef4444',
            color: 'white',
            borderRadius: '50%',
            width: '20px',
            height: '20px',
            fontSize: '0.7rem',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '2px solid white'
          }}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div 
            onClick={() => setIsOpen(false)}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 999
            }}
          />
          <div style={{
            position: 'absolute',
            top: '60px',
            right: '20px',
            width: '400px',
            maxHeight: '600px',
            background: 'white',
            borderRadius: '1rem',
            boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
            zIndex: 1000,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }}>
            {/* Header */}
            <div style={{
              padding: '1.5rem',
              borderBottom: '1px solid #e2e8f0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>Notifications</h3>
                <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '0.25rem 0 0 0' }}>
                  {unreadCount} unread
                </p>
              </div>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  style={{
                    padding: '0.5rem 1rem',
                    background: '#f1f5f9',
                    border: 'none',
                    borderRadius: '0.5rem',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    color: '#475569',
                    cursor: 'pointer'
                  }}
                >
                  Mark all read
                </button>
              )}
            </div>

            {/* Notifications List */}
            <div style={{
              flex: 1,
              overflowY: 'auto',
              maxHeight: '500px'
            }}>
              {notifications.length === 0 ? (
                <div style={{
                  padding: '3rem',
                  textAlign: 'center',
                  color: '#94a3b8'
                }}>
                  <Bell size={48} style={{ opacity: 0.3, marginBottom: '1rem' }} />
                  <p>No notifications yet</p>
                </div>
              ) : (
                notifications.map((notif) => (
                  <div
                    key={notif._id}
                    onClick={() => !notif.read && markAsRead(notif._id)}
                    style={{
                      padding: '1rem 1.5rem',
                      borderBottom: '1px solid #f1f5f9',
                      background: notif.read ? 'white' : '#f8fafc',
                      cursor: 'pointer',
                      transition: 'background 0.2s',
                      position: 'relative'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#f1f5f9'}
                    onMouseLeave={(e) => e.currentTarget.style.background = notif.read ? 'white' : '#f8fafc'}
                  >
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                      <div style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        background: notif.type === 'alert' ? '#fee2e2' : notif.type === 'success' ? '#d1fae5' : notif.type === 'energy' ? '#fef3c7' : '#dbeafe',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}>
                        {getIcon(notif.type)}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'flex-start',
                          marginBottom: '0.25rem'
                        }}>
                          <h4 style={{
                            fontSize: '0.9rem',
                            fontWeight: 600,
                            margin: 0,
                            color: '#1e293b'
                          }}>
                            {notif.title}
                          </h4>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteNotification(notif._id);
                            }}
                            style={{
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer',
                              padding: '0.25rem',
                              color: '#94a3b8'
                            }}
                          >
                            <X size={16} />
                          </button>
                        </div>
                        <p style={{
                          fontSize: '0.85rem',
                          color: '#64748b',
                          margin: '0 0 0.5rem 0',
                          lineHeight: 1.4
                        }}>
                          {notif.message}
                        </p>
                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}>
                          <span style={{
                            fontSize: '0.75rem',
                            color: '#94a3b8'
                          }}>
                            {getTimeAgo(notif.createdAt)}
                          </span>
                          {!notif.read && (
                            <div style={{
                              width: '8px',
                              height: '8px',
                              borderRadius: '50%',
                              background: '#3b82f6'
                            }} />
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
}
