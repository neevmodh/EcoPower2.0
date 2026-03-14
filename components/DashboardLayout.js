'use client';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Sidebar from '@/components/Sidebar';
import NotificationCenter from '@/components/NotificationCenter';
import UserProfile from '@/components/UserProfile';
import { Zap, ChevronDown, Search } from 'lucide-react';

const ROLE_META = {
  Admin:      { color:'#8B5CF6', bg:'rgba(139,92,246,0.1)', border:'rgba(139,92,246,0.2)', label:'Administrator',  title:'Admin Command Center',    sub:'System-wide control and monitoring' },
  Enterprise: { color:'#38BDF8', bg:'rgba(56,189,248,0.1)', border:'rgba(56,189,248,0.2)', label:'Enterprise',     title:'Enterprise Dashboard',    sub:'Multi-site energy management' },
  Consumer:   { color:'#22C55E', bg:'rgba(34,197,94,0.1)',  border:'rgba(34,197,94,0.2)',  label:'Consumer',       title:'Home Energy Dashboard',   sub:'Monitor and optimize your energy usage' },
};

export default function DashboardLayout({ children, role, requiredRole }) {
  const { user, loading, logout, getInitials } = useAuth();
  const router = useRouter();
  const [showProfile, setShowProfile] = useState(false);

  useEffect(() => {
    if (!loading) {
      if (!user) { router.push('/login'); return; }
      if (requiredRole && user.role !== requiredRole) {
        router.push(user.role === 'Admin' ? '/admin' : user.role === 'Enterprise' ? '/enterprise' : '/consumer');
      }
    }
  }, [user, loading, router, requiredRole]);

  if (loading || !user || (requiredRole && user.role !== requiredRole)) {
    return (
      <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#F8FAFC', fontFamily:'Inter, sans-serif' }}>
        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:16 }}>
          <div style={{ width:48, height:48, background:'linear-gradient(135deg,#22C55E,#16A34A)', borderRadius:14, display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 8px 24px rgba(34,197,94,0.35)', animation:'pulse-dot 1.5s infinite' }}>
            <Zap size={24} color="#fff" strokeWidth={2.5} />
          </div>
          <span style={{ color:'#94A3B8', fontSize:'0.9rem', fontWeight:500 }}>Loading EcoPower…</span>
        </div>
      </div>
    );
  }

  const meta = ROLE_META[role] || ROLE_META.Consumer;

  return (
    <div style={{ display:'flex', minHeight:'100vh', background:'#F8FAFC', fontFamily:'Inter, sans-serif' }}>
      <Sidebar role={role} />

      <div style={{ flex:1, display:'flex', flexDirection:'column', minWidth:0 }}>
        {/* ── Top Header ── */}
        <header style={{ height:64, background:'#fff', borderBottom:'1px solid #E2E8F0', display:'flex', alignItems:'center', padding:'0 2rem', justifyContent:'space-between', position:'sticky', top:0, zIndex:100, boxShadow:'0 1px 6px rgba(0,0,0,0.04)' }}>
          <div>
            <h2 style={{ fontSize:'1.0625rem', fontWeight:800, color:'#0F172A', margin:0, lineHeight:1.3, letterSpacing:'-0.02em' }}>{meta.title}</h2>
            <p style={{ fontSize:'0.775rem', color:'#94A3B8', margin:0, fontWeight:500 }}>{meta.sub}</p>
          </div>

          <div style={{ display:'flex', alignItems:'center', gap:'0.875rem' }}>
            {/* Live indicator */}
            <div style={{ display:'flex', alignItems:'center', gap:5, padding:'0.35rem 0.875rem', background:'#F0FDF4', border:'1px solid #BBF7D0', borderRadius:'2rem' }}>
              <span style={{ width:6, height:6, borderRadius:'50%', background:'#22C55E', display:'inline-block', animation:'pulse-dot 2s infinite' }} />
              <span style={{ fontSize:'0.72rem', fontWeight:700, color:'#16A34A' }}>LIVE</span>
            </div>

            <NotificationCenter />

            <div style={{ width:1, height:32, background:'#E2E8F0' }} />

            {/* User button */}
            <button onClick={() => setShowProfile(true)} style={{ display:'flex', alignItems:'center', gap:9, padding:'0.4375rem 0.875rem', background:'#F8FAFC', border:'1px solid #E2E8F0', borderRadius:10, cursor:'pointer', transition:'all 0.2s', fontFamily:'Inter, sans-serif' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor='#CBD5E1'; e.currentTarget.style.background='#F1F5F9'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor='#E2E8F0'; e.currentTarget.style.background='#F8FAFC'; }}>
              <div style={{ width:30, height:30, borderRadius:'50%', background:meta.bg, color:meta.color, display:'flex', alignItems:'center', justifyContent:'center', fontWeight:800, fontSize:'0.75rem', border:`1.5px solid ${meta.border}`, flexShrink:0 }}>
                {getInitials()}
              </div>
              <div style={{ textAlign:'left' }}>
                <div style={{ fontWeight:700, fontSize:'0.8125rem', color:'#0F172A', lineHeight:1.2, letterSpacing:'-0.01em' }}>{user.name}</div>
                <div style={{ fontSize:'0.68rem', color:'#94A3B8', fontWeight:500 }}>{meta.label}</div>
              </div>
              <ChevronDown size={13} color="#94A3B8" />
            </button>
          </div>
        </header>

        {/* ── Page content ── */}
        <main style={{ flex:1, padding:'2rem', overflowY:'auto' }}>
          {children}
        </main>
      </div>

      <UserProfile isOpen={showProfile} onClose={() => setShowProfile(false)} />
    </div>
  );
}
