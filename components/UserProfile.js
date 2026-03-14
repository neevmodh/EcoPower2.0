'use client';
import { useState, useEffect } from 'react';
import { User, Mail, Phone, Building, MapPin, Shield, Key, Save, X } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function UserProfile({ isOpen, onClose }) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    companyName: '',
    address: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        companyName: user.companyName || '',
        address: user.address || '',
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    }
  }, [user]);

  const handleSave = async () => {
    setSaving(true);
    setMessage({ type: '', text: '' });

    try {
      const res = await fetch(`/api/users/${user.userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          phone: formData.phone,
          companyName: formData.companyName,
          address: formData.address
        })
      });

      if (res.ok) {
        setMessage({ type: 'success', text: 'Profile updated successfully!' });
        // Update local storage
        const updatedUser = { ...user, ...formData };
        localStorage.setItem('instinctUser', JSON.stringify(updatedUser));
        setTimeout(() => window.location.reload(), 1500);
      } else {
        setMessage({ type: 'error', text: 'Failed to update profile' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Error updating profile' });
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async () => {
    if (formData.newPassword !== formData.confirmPassword) {
      setMessage({ type: 'error', text: 'Passwords do not match' });
      return;
    }

    if (formData.newPassword.length < 6) {
      setMessage({ type: 'error', text: 'Password must be at least 6 characters' });
      return;
    }

    setSaving(true);
    setMessage({ type: '', text: '' });

    try {
      const res = await fetch(`/api/users/${user.userId}/password`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: formData.currentPassword,
          newPassword: formData.newPassword
        })
      });

      if (res.ok) {
        setMessage({ type: 'success', text: 'Password changed successfully!' });
        setFormData({ ...formData, currentPassword: '', newPassword: '', confirmPassword: '' });
      } else {
        setMessage({ type: 'error', text: 'Failed to change password' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Error changing password' });
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen || !user) return null;

  return (
    <>
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          zIndex: 9998,
          backdropFilter: 'blur(4px)'
        }}
      />
      <div style={{
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '90%',
        maxWidth: '700px',
        maxHeight: '90vh',
        background: 'white',
        borderRadius: '1rem',
        boxShadow: '0 25px 50px rgba(0,0,0,0.3)',
        zIndex: 9999,
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
          alignItems: 'center',
          background: 'linear-gradient(135deg, #4f46e5, #4338ca)',
          color: 'white'
        }}>
          <div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>User Profile</h2>
            <p style={{ fontSize: '0.9rem', opacity: 0.9, margin: '0.25rem 0 0 0' }}>
              Manage your account settings
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.2)',
              border: 'none',
              borderRadius: '50%',
              width: '36px',
              height: '36px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: 'white'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div style={{
          display: 'flex',
          gap: '0.5rem',
          padding: '1rem 1.5rem',
          borderBottom: '1px solid #e2e8f0',
          background: '#f8fafc'
        }}>
          <button
            onClick={() => setActiveTab('profile')}
            style={{
              padding: '0.5rem 1rem',
              background: activeTab === 'profile' ? 'white' : 'transparent',
              border: activeTab === 'profile' ? '1px solid #e2e8f0' : 'none',
              borderRadius: '0.5rem',
              cursor: 'pointer',
              fontWeight: 600,
              color: activeTab === 'profile' ? '#1e293b' : '#64748b',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            <User size={16} />
            Profile Info
          </button>
          <button
            onClick={() => setActiveTab('security')}
            style={{
              padding: '0.5rem 1rem',
              background: activeTab === 'security' ? 'white' : 'transparent',
              border: activeTab === 'security' ? '1px solid #e2e8f0' : 'none',
              borderRadius: '0.5rem',
              cursor: 'pointer',
              fontWeight: 600,
              color: activeTab === 'security' ? '#1e293b' : '#64748b',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            <Shield size={16} />
            Security
          </button>
        </div>

        {/* Content */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '1.5rem'
        }}>
          {message.text && (
            <div style={{
              padding: '1rem',
              borderRadius: '0.5rem',
              marginBottom: '1rem',
              background: message.type === 'success' ? '#d1fae5' : '#fee2e2',
              color: message.type === 'success' ? '#059669' : '#dc2626',
              fontWeight: 500
            }}>
              {message.text}
            </div>
          )}

          {activeTab === 'profile' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', fontWeight: 600, color: '#475569' }}>
                  <User size={16} />
                  Full Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #cbd5e1',
                    borderRadius: '0.5rem',
                    fontSize: '1rem',
                    outline: 'none'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', fontWeight: 600, color: '#475569' }}>
                  <Mail size={16} />
                  Email Address
                </label>
                <input
                  type="email"
                  value={formData.email}
                  disabled
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #cbd5e1',
                    borderRadius: '0.5rem',
                    fontSize: '1rem',
                    background: '#f1f5f9',
                    color: '#64748b'
                  }}
                />
                <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '0.25rem 0 0 0' }}>
                  Email cannot be changed
                </p>
              </div>

              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', fontWeight: 600, color: '#475569' }}>
                  <Phone size={16} />
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #cbd5e1',
                    borderRadius: '0.5rem',
                    fontSize: '1rem',
                    outline: 'none'
                  }}
                />
              </div>

              {user.role === 'Enterprise' && (
                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', fontWeight: 600, color: '#475569' }}>
                    <Building size={16} />
                    Company Name
                  </label>
                  <input
                    type="text"
                    value={formData.companyName}
                    onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #cbd5e1',
                      borderRadius: '0.5rem',
                      fontSize: '1rem',
                      outline: 'none'
                    }}
                  />
                </div>
              )}

              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', fontWeight: 600, color: '#475569' }}>
                  <MapPin size={16} />
                  Address
                </label>
                <textarea
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #cbd5e1',
                    borderRadius: '0.5rem',
                    fontSize: '1rem',
                    outline: 'none',
                    fontFamily: 'inherit',
                    resize: 'vertical'
                  }}
                />
              </div>

              <button
                onClick={handleSave}
                disabled={saving}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.5rem',
                  fontWeight: 600,
                  cursor: saving ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  opacity: saving ? 0.6 : 1
                }}
              >
                <Save size={18} />
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          )}

          {activeTab === 'security' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', fontWeight: 600, color: '#475569' }}>
                  <Key size={16} />
                  Current Password
                </label>
                <input
                  type="password"
                  value={formData.currentPassword}
                  onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #cbd5e1',
                    borderRadius: '0.5rem',
                    fontSize: '1rem',
                    outline: 'none'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', fontWeight: 600, color: '#475569' }}>
                  <Key size={16} />
                  New Password
                </label>
                <input
                  type="password"
                  value={formData.newPassword}
                  onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #cbd5e1',
                    borderRadius: '0.5rem',
                    fontSize: '1rem',
                    outline: 'none'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', fontWeight: 600, color: '#475569' }}>
                  <Key size={16} />
                  Confirm New Password
                </label>
                <input
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #cbd5e1',
                    borderRadius: '0.5rem',
                    fontSize: '1rem',
                    outline: 'none'
                  }}
                />
              </div>

              <button
                onClick={handlePasswordChange}
                disabled={saving}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: '#ef4444',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.5rem',
                  fontWeight: 600,
                  cursor: saving ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  opacity: saving ? 0.6 : 1
                }}
              >
                <Shield size={18} />
                {saving ? 'Updating...' : 'Change Password'}
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
