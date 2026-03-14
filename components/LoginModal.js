'use client';
import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';

export default function LoginModal({ isOpen, onClose }) {
  const { login } = useAuth();
  const [email, setEmail] = useState('admin@instinct.com');
  const [password, setPassword] = useState('admin@123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await login(email, password);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className={`modal-overlay ${isOpen ? 'active' : ''}`} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: '420px' }}>
        <div className="modal-header">
          <h3 className="modal-title">Sign In to EcoPower</h3>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>
        <div className="modal-body">
          <p className="text-light text-center mb-4">Enter your credentials to access your Instinct database account.</p>
          {error && <div style={{ padding: '0.75rem', backgroundColor: 'rgba(239,68,68,0.1)', color: 'var(--warning)', borderRadius: 'var(--border-radius)', marginBottom: '1rem', fontSize: '0.9rem' }}>{error}</div>}
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input type="email" className="form-control" value={email} onChange={e => setEmail(e.target.value)} required />
            </div>
            <div className="form-group mb-4">
              <label className="form-label">Password</label>
              <input type="password" className="form-control" value={password} onChange={e => setPassword(e.target.value)} required />
            </div>
            <button type="submit" className="btn btn-primary w-100 btn-lg" disabled={loading}>
              {loading ? <><i className="fas fa-spinner fa-spin"></i> Authenticating...</> : <><i className="fas fa-sign-in-alt"></i> Sign In</>}
            </button>
          </form>
          <div className="text-center mt-4 text-sm text-light">
            <p style={{ marginBottom: '0.5rem' }}>Demo Accounts:</p>
            <p style={{ marginBottom: '0.25rem' }}><b>Admin:</b> admin@instinct.com</p>
            <p style={{ marginBottom: '0.25rem' }}><b>Enterprise:</b> vikram@techpark.in</p>
            <p style={{ marginBottom: 0 }}><b>Consumer:</b> rahul.sharma@gmail.com</p>
          </div>
        </div>
      </div>
    </div>
  );
}
