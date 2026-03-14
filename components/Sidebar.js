'use client';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Users, Zap, FileText, HeadphonesIcon,
  Settings, LogOut, Map, Activity, BarChart3, Cpu, Cloud,
  GitBranch, Sliders, Leaf, CreditCard, ShoppingCart, Car,
  ChevronRight, Globe
} from 'lucide-react';

const LINKS = {
  Admin: [
    { label:'Dashboard',        path:'/admin',                    icon:LayoutDashboard },
    { label:'Users & Tenants',  path:'/admin/users',              icon:Users },
    { label:'Devices',          path:'/admin/devices',            icon:Cpu },
    { label:'Energy Plans',     path:'/admin/plans',              icon:Sliders },
    { label:'Revenue',          path:'/admin/billing',            icon:CreditCard },
    { label:'Support Queue',    path:'/admin/support',            icon:HeadphonesIcon },
    { label:'Analytics',        path:'/admin/analytics',          icon:BarChart3 },
    { label:'Firmware',         path:'/admin/firmware',           icon:Settings },
    { label:'Weather Forecast', path:'/admin/weather-forecast',   icon:Cloud },
    { label:'Blockchain',       path:'/admin/blockchain',         icon:GitBranch },
    { label:'Grid Balancing',   path:'/admin/grid-balancing',     icon:Activity },
  ],
  Enterprise: [
    { label:'Fleet Dashboard',  path:'/enterprise',               icon:LayoutDashboard },
    { label:'Multi-Site',       path:'/enterprise/sites',         icon:Map },
    { label:'Team',             path:'/enterprise/team',          icon:Users },
    { label:'Analytics',        path:'/enterprise/analytics',     icon:BarChart3 },
    { label:'Sustainability',   path:'/enterprise/sustainability', icon:Leaf },
    { label:'Subscription',     path:'/enterprise/subscription',  icon:ShoppingCart },
    { label:'Billing',          path:'/enterprise/billing',       icon:FileText },
  ],
  Consumer: [
    { label:'Dashboard',        path:'/consumer',                 icon:LayoutDashboard },
    { label:'Analytics',        path:'/consumer/analytics',       icon:BarChart3 },
    { label:'Subscription',     path:'/consumer/subscription',    icon:ShoppingCart },
    { label:'Billing',          path:'/consumer/billing',         icon:CreditCard },
    { label:'P2P Trading',      path:'/consumer/trading',         icon:Zap },
    { label:'EV Charging',      path:'/consumer/ev-charging',     icon:Car },
    { label:'DISCOM / Grid',    path:'/consumer/discom',          icon:Globe },
    { label:'Support',          path:'/consumer/support',         icon:HeadphonesIcon },
  ],
};

const ROLE_META = {
  Admin:      { color:'#8B5CF6', bg:'rgba(139,92,246,0.12)', label:'Administrator' },
  Enterprise: { color:'#38BDF8', bg:'rgba(56,189,248,0.12)', label:'Enterprise' },
  Consumer:   { color:'#22C55E', bg:'rgba(34,197,94,0.12)',  label:'Consumer' },
};

export default function Sidebar({ role }) {
  const { user, logout, getInitials } = useAuth();
  const pathname = usePathname();
  if (!user) return null;

  const links = LINKS[role] || [];
  const meta  = ROLE_META[role] || ROLE_META.Consumer;

  return (
    <aside style={{ width:256, minWidth:256, background:'#0A0F1E', display:'flex', flexDirection:'column', height:'100vh', position:'sticky', top:0, borderRight:'1px solid #1E293B', fontFamily:'Inter, sans-serif' }}>

      {/* Brand */}
      <div style={{ padding:'1.5rem 1.25rem 1.25rem', borderBottom:'1px solid #1E293B' }}>
        <div style={{ display:'flex', alignItems:'center', gap:10, fontWeight:900, fontSize:'1.2rem', color:'#F1F5F9', letterSpacing:'-0.03em', marginBottom:'0.875rem' }}>
          <div style={{ width:34, height:34, background:'linear-gradient(135deg,#22C55E,#16A34A)', borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 4px 12px rgba(34,197,94,0.4)', flexShrink:0 }}>
            <Zap size={18} color="#fff" strokeWidth={2.5} />
          </div>
          EcoPower
        </div>
        <div style={{ display:'inline-flex', alignItems:'center', gap:5, padding:'0.3rem 0.75rem', background:meta.bg, border:`1px solid ${meta.color}25`, borderRadius:6, fontSize:'0.72rem', fontWeight:700, color:meta.color, letterSpacing:'0.03em' }}>
          {meta.label}
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex:1, padding:'1rem 0.75rem', display:'flex', flexDirection:'column', gap:2, overflowY:'auto' }}>
        {links.map((link, i) => {
          const Icon = link.icon;
          const active = pathname === link.path;
          return (
            <Link key={i} href={link.path} className={`sidebar-link${active ? ' active' : ''}`}
              style={{ position:'relative' }}>
              <Icon size={16} strokeWidth={active ? 2.5 : 2} style={{ flexShrink:0 }} />
              <span style={{ flex:1 }}>{link.label}</span>
              {active && <ChevronRight size={13} style={{ color:'#4ADE80', opacity:0.7 }} />}
            </Link>
          );
        })}
      </nav>

      {/* User footer */}
      <div style={{ padding:'1rem 0.75rem', borderTop:'1px solid #1E293B' }}>
        <div style={{ display:'flex', alignItems:'center', gap:10, padding:'0.75rem', background:'#1E293B', borderRadius:12, marginBottom:'0.625rem', border:'1px solid #334155' }}>
          <div style={{ width:34, height:34, borderRadius:'50%', background:meta.bg, color:meta.color, display:'flex', alignItems:'center', justifyContent:'center', fontWeight:800, fontSize:'0.8rem', border:`1.5px solid ${meta.color}40`, flexShrink:0 }}>
            {getInitials()}
          </div>
          <div style={{ flex:1, overflow:'hidden' }}>
            <div style={{ fontWeight:700, fontSize:'0.8125rem', color:'#E2E8F0', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{user.name}</div>
            <div style={{ fontSize:'0.7rem', color:'#475569', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{user.email}</div>
          </div>
        </div>
        <button onClick={logout} style={{ width:'100%', padding:'0.5625rem', display:'flex', alignItems:'center', justifyContent:'center', gap:6, background:'transparent', border:'1px solid #1E293B', color:'#475569', borderRadius:9, cursor:'pointer', fontSize:'0.8125rem', fontWeight:600, transition:'all 0.2s', fontFamily:'Inter, sans-serif' }}
          onMouseEnter={e => { e.currentTarget.style.borderColor='rgba(239,68,68,0.4)'; e.currentTarget.style.color='#EF4444'; e.currentTarget.style.background='rgba(239,68,68,0.05)'; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor='#1E293B'; e.currentTarget.style.color='#475569'; e.currentTarget.style.background='transparent'; }}>
          <LogOut size={14} /> Sign Out
        </button>
      </div>
    </aside>
  );
}
