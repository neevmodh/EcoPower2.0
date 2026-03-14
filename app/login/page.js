'use client';
import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Lock, Mail, ArrowRight, Zap, Leaf, Sun, Battery, CheckCircle2, Sparkles, Shield, Globe, TrendingUp } from 'lucide-react';
import Link from 'next/link';

export default function LoginPage() {
  const { login, loading } = useAuth();
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]       = useState('');

  if (loading) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await login(email, password);
    } catch (err) {
      setError(err.message || 'Invalid credentials. Please try again.');
      setSubmitting(false);
    }
  };

  const demos = [
    { label: 'Admin',      email: 'admin@ecopower.com',    color: '#8B5CF6', bg: 'rgba(139,92,246,0.08)', border: 'rgba(139,92,246,0.2)', desc: 'Full platform control & analytics' },
    { label: 'Enterprise', email: 'vikram@techcorp.in',     color: '#38BDF8', bg: 'rgba(56,189,248,0.08)',  border: 'rgba(56,189,248,0.2)',  desc: 'Multi-site energy management' },
    { label: 'Consumer',   email: 'rahul.sharma@gmail.com', color: '#22C55E', bg: 'rgba(34,197,94,0.08)',   border: 'rgba(34,197,94,0.2)',   desc: 'Home solar & energy dashboard' },
  ];

  const inputBase = {
    width: '100%', padding: '1rem 1.125rem 1rem 3rem',
    border: '1.5px solid #E2E8F0', borderRadius: 14,
    fontSize: '1rem', color: '#0F172A', background: '#F8FAFC',
    outline: 'none', fontFamily: 'Inter, sans-serif', transition: 'all 0.2s',
  };

  const features = [
    { icon: <Sun size={20} color="#FACC15" />,    text: 'Real-time solar & grid monitoring',       bg: '#FEFCE8', border: '#FEF08A' },
    { icon: <Battery size={20} color="#22C55E" />, text: 'Smart battery management & optimization', bg: '#F0FDF4', border: '#BBF7D0' },
    { icon: <TrendingUp size={20} color="#38BDF8" />, text: 'AI-powered energy savings advisor',    bg: '#F0F9FF', border: '#BAE6FD' },
    { icon: <Leaf size={20} color="#16A34A" />,   text: 'Carbon footprint tracking & ESG reports', bg: '#F0FDF4', border: '#BBF7D0' },
    { icon: <Globe size={20} color="#8B5CF6" />,  text: 'DISCOM integration & net-metering',       bg: '#F5F3FF', border: '#DDD6FE' },
    { icon: <Shield size={20} color="#F97316" />, text: 'Bank-grade security & data privacy',      bg: '#FFF7ED', border: '#FED7AA' },
  ];

  return (
    <div style={{ minHeight: '100vh', display: 'flex', fontFamily: 'Inter, sans-serif', background: '#F8FAFC' }}>

      {/* Left branding panel */}
      <div style={{ flex: 1, background: 'linear-gradient(150deg,#F0FDF4 0%,#ECFDF5 50%,#F0F9FF 100%)', display: 'flex', flexDirection: 'column', padding: '3.5rem', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '-12%', right: '-8%', width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle,rgba(34,197,94,0.10) 0%,transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '-10%', left: '-8%', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle,rgba(56,189,248,0.08) 0%,transparent 70%)', pointerEvents: 'none' }} />

        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 12, fontWeight: 900, fontSize: '1.5rem', color: '#0F172A', textDecoration: 'none', letterSpacing: '-0.04em', width: 'fit-content', position: 'relative', zIndex: 1 }}>
          <div style={{ width: 44, height: 44, background: 'linear-gradient(135deg,#22C55E,#16A34A)', borderRadius: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 6px 18px rgba(34,197,94,0.45)' }}>
            <Zap size={22} color="#fff" strokeWidth={2.5} />
          </div>
          EcoPower
        </Link>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', maxWidth: 520, position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '0.5rem 1.125rem', background: '#fff', border: '1px solid #BBF7D0', borderRadius: '2rem', color: '#16A34A', fontSize: '0.875rem', fontWeight: 600, marginBottom: '2rem', width: 'fit-content', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
            <Sparkles size={14} /> India's #1 Energy-as-a-Service Platform
          </div>
          <h1 style={{ fontSize: 'clamp(2.25rem,4vw,3.5rem)', fontWeight: 900, color: '#0F172A', lineHeight: 1.05, marginBottom: '1.5rem', letterSpacing: '-0.05em' }}>
            Smart Energy for a{' '}
            <span style={{ background: 'linear-gradient(135deg,#22C55E,#16A34A)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Greener Future
            </span>
          </h1>
          <p style={{ color: '#64748B', lineHeight: 1.85, marginBottom: '2.75rem', fontSize: '1.0625rem' }}>
            Monitor solar generation, track energy usage, and reduce electricity costs — all from one powerful dashboard.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.875rem' }}>
            {features.map((f, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0.875rem 1.125rem', background: '#fff', border: `1px solid ${f.border}`, borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.04)', transition: 'all 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.transform = 'translateX(4px)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'translateX(0)'}>
                <div style={{ width: 36, height: 36, background: f.bg, borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{f.icon}</div>
                <span style={{ fontSize: '0.8375rem', color: '#374151', fontWeight: 500, lineHeight: 1.4 }}>{f.text}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', gap: '3rem', paddingTop: '2.25rem', borderTop: '1px solid #BBF7D0', position: 'relative', zIndex: 1 }}>
          {[['5,000+', 'Customers'], ['25 MW', 'Generated'], ['500+', 'Tonnes CO₂']].map(([v, l], i) => (
            <div key={i}>
              <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#22C55E', letterSpacing: '-0.04em' }}>{v}</div>
              <div style={{ fontSize: '0.8125rem', color: '#94A3B8', fontWeight: 500, marginTop: 3 }}>{l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Right form panel */}
      <div style={{ width: 540, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '3.5rem', background: '#fff', boxShadow: '-8px 0 48px rgba(0,0,0,0.07)', overflowY: 'auto' }}>
        <div style={{ marginBottom: '2.75rem' }}>
          <h2 style={{ fontSize: '2.25rem', fontWeight: 900, color: '#0F172A', marginBottom: '0.625rem', letterSpacing: '-0.04em' }}>Welcome back</h2>
          <p style={{ color: '#64748B', fontSize: '1rem' }}>Sign in to your EcoPower account</p>
        </div>

        {error && (
          <div style={{ padding: '1rem 1.25rem', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 12, color: '#DC2626', fontSize: '0.9rem', marginBottom: '1.75rem', display: 'flex', alignItems: 'center', gap: 9 }}>
            <span style={{ fontSize: '1.125rem' }}>⚠</span> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ position: 'relative' }}>
            <Mail size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8', pointerEvents: 'none' }} />
            <input type="email" placeholder="Email address" value={email} onChange={e => setEmail(e.target.value)} required style={inputBase}
              onFocus={e => { e.target.style.borderColor = '#22C55E'; e.target.style.boxShadow = '0 0 0 3px rgba(34,197,94,0.12)'; e.target.style.background = '#fff'; }}
              onBlur={e => { e.target.style.borderColor = '#E2E8F0'; e.target.style.boxShadow = 'none'; e.target.style.background = '#F8FAFC'; }} />
          </div>
          <div style={{ position: 'relative' }}>
            <Lock size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8', pointerEvents: 'none' }} />
            <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required style={inputBase}
              onFocus={e => { e.target.style.borderColor = '#22C55E'; e.target.style.boxShadow = '0 0 0 3px rgba(34,197,94,0.12)'; e.target.style.background = '#fff'; }}
              onBlur={e => { e.target.style.borderColor = '#E2E8F0'; e.target.style.boxShadow = 'none'; e.target.style.background = '#F8FAFC'; }} />
          </div>
          <button type="submit" disabled={submitting}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9, padding: '1.0625rem', background: submitting ? '#86EFAC' : '#22C55E', color: '#fff', border: 'none', borderRadius: 14, fontWeight: 800, fontSize: '1.0625rem', cursor: submitting ? 'not-allowed' : 'pointer', boxShadow: '0 8px 24px rgba(34,197,94,0.38)', transition: 'all 0.25s', fontFamily: 'Inter, sans-serif', letterSpacing: '-0.01em' }}
            onMouseEnter={e => { if (!submitting) { e.currentTarget.style.background = '#16A34A'; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 12px 32px rgba(34,197,94,0.48)'; } }}
            onMouseLeave={e => { if (!submitting) { e.currentTarget.style.background = '#22C55E'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(34,197,94,0.38)'; } }}>
            {submitting ? 'Signing in…' : <><span>Sign In to Dashboard</span><ArrowRight size={20} /></>}
          </button>
        </form>

        {/* Demo accounts */}
        <div style={{ marginTop: '2.25rem', padding: '1.75rem', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 18 }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '1.125rem' }}>Quick Demo Access</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {demos.map((d, i) => (
              <button key={i} type="button" onClick={() => { setEmail(d.email); setPassword('password123'); }}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.875rem 1.125rem', background: d.bg, border: `1px solid ${d.border}`, borderRadius: 12, cursor: 'pointer', transition: 'all 0.2s', fontFamily: 'Inter, sans-serif' }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateX(5px)'; e.currentTarget.style.boxShadow = `0 6px 16px ${d.color}20`; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateX(0)'; e.currentTarget.style.boxShadow = 'none'; }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: `${d.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontSize: '0.875rem', fontWeight: 900, color: d.color }}>{d.label[0]}</span>
                  </div>
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontSize: '0.875rem', fontWeight: 800, color: d.color }}>{d.label}</div>
                    <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>{d.desc}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <CheckCircle2 size={14} color={d.color} />
                  <span style={{ fontSize: '0.72rem', color: '#94A3B8', fontFamily: 'monospace' }}>{d.email}</span>
                </div>
              </button>
            ))}
          </div>
          <p style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: '1rem', textAlign: 'center' }}>
            All demo accounts use password: <strong style={{ color: '#374151' }}>password123</strong>
          </p>
        </div>

        <p style={{ textAlign: 'center', marginTop: '2.25rem', fontSize: '0.8rem', color: '#94A3B8' }}>
          © 2026 EcoPower Energy-as-a-Service
        </p>
      </div>
    </div>
  );
}
