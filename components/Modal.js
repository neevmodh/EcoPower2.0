'use client';
import { useEffect } from 'react';
import { X } from 'lucide-react';

export default function Modal({ open, onClose, title, children, width = 560 }) {
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  if (!open) return null;

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(15,23,42,0.55)', backdropFilter: 'blur(4px)' }} onClick={onClose} />
      <div style={{ position: 'relative', background: '#fff', borderRadius: 20, width: '100%', maxWidth: width, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 32px 80px rgba(0,0,0,0.25)', border: '1px solid #E2E8F0', fontFamily: 'Inter, sans-serif' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.5rem 2rem', borderBottom: '1px solid #E2E8F0' }}>
          <h3 style={{ fontWeight: 800, fontSize: '1.125rem', color: '#0F172A', margin: 0, letterSpacing: '-0.02em' }}>{title}</h3>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 8, background: '#F1F5F9', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748B', transition: 'all 0.15s' }}
            onMouseEnter={e => { e.currentTarget.style.background = '#FEF2F2'; e.currentTarget.style.color = '#EF4444'; }}
            onMouseLeave={e => { e.currentTarget.style.background = '#F1F5F9'; e.currentTarget.style.color = '#64748B'; }}>
            <X size={16} />
          </button>
        </div>
        <div style={{ padding: '2rem' }}>{children}</div>
      </div>
    </div>
  );
}
