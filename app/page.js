'use client';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  Zap, ArrowRight, Sun, Battery, Activity, TrendingUp,
  Shield, Users, BarChart3, Leaf, CheckCircle2, Star,
  Cpu, CreditCard, ChevronRight, Play, Sparkles, Lock,
  Globe, Wind, Wifi, Award, Clock, Phone
} from 'lucide-react';

function Counter({ end, suffix = '', prefix = '', duration = 2400 }) {
  const [val, setVal] = useState(0);
  const ref = useRef(null);
  const started = useRef(false);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting || started.current) return;
      started.current = true;
      obs.disconnect();
      const startTime = performance.now();
      const tick = (now) => {
        const progress = Math.min((now - startTime) / duration, 1);
        const ease = 1 - Math.pow(1 - progress, 3);
        setVal(Math.floor(ease * end));
        if (progress < 1) requestAnimationFrame(tick);
        else setVal(end);
      };
      requestAnimationFrame(tick);
    }, { threshold: 0.3 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [end, duration]);
  return <span ref={ref}>{prefix}{val.toLocaleString()}{suffix}</span>;
}

function LiveEnergyFlow() {
  const [active, setActive] = useState(0);
  const [watts, setWatts] = useState({ solar: 8.4, battery: 87, home: 4.6, grid: 1.2 });
  const [time, setTime] = useState('');

  useEffect(() => {
    setTime(new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    const t1 = setInterval(() => setActive(a => (a + 1) % 4), 900);
    const t2 = setInterval(() => {
      setWatts(w => ({
        solar:   +(Math.max(6, Math.min(12, w.solar + (Math.random() - 0.5) * 0.4))).toFixed(1),
        battery: Math.min(100, Math.max(60, Math.round(w.battery + (Math.random() - 0.4) * 1.2))),
        home:    +(Math.max(3, Math.min(7, w.home + (Math.random() - 0.5) * 0.3))).toFixed(1),
        grid:    +(Math.max(0.2, Math.min(3, w.grid + (Math.random() - 0.5) * 0.2))).toFixed(1),
      }));
      setTime(new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    }, 1800);
    return () => { clearInterval(t1); clearInterval(t2); };
  }, []);

  const nodes = [
    { key: 'solar',   emoji: '☀',  label: 'Solar Panels',    value: `${watts.solar} kW`,  color: '#FACC15', glow: 'rgba(250,204,21,0.18)',  border: '#FEF08A', bg: '#FEFCE8' },
    { key: 'battery', emoji: '🔋', label: 'Battery Storage', value: `${watts.battery}%`,  color: '#22C55E', glow: 'rgba(34,197,94,0.18)',   border: '#BBF7D0', bg: '#F0FDF4' },
    { key: 'home',    emoji: '🏠', label: 'Home Usage',      value: `${watts.home} kW`,   color: '#38BDF8', glow: 'rgba(56,189,248,0.18)',  border: '#BAE6FD', bg: '#F0F9FF' },
    { key: 'grid',    emoji: '⚡', label: 'Grid Export',     value: `${watts.grid} kW`,   color: '#8B5CF6', glow: 'rgba(139,92,246,0.18)',  border: '#DDD6FE', bg: '#F5F3FF' },
  ];

  return (
    <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 24, padding: '2rem', boxShadow: '0 12px 48px rgba(0,0,0,0.10)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
        <div>
          <div style={{ fontWeight: 900, fontSize: '1.125rem', color: '#0F172A', letterSpacing: '-0.02em' }}>Live Energy Flow</div>
          <div style={{ fontSize: '0.8rem', color: '#94A3B8', marginTop: 3 }}>Updated {time}</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '0.4rem 1rem', background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: '2rem' }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#22C55E', display: 'inline-block', animation: 'pulse-dot 2s infinite' }} />
          <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#16A34A', letterSpacing: '0.05em' }}>LIVE</span>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
        {nodes.map((n, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, transition: 'transform 0.3s', transform: active === i ? 'scale(1.1)' : 'scale(1)' }}>
              <div style={{ width: 80, height: 80, borderRadius: 22, background: active === i ? n.glow : n.bg, border: `2px solid ${active === i ? n.color : n.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.25rem', boxShadow: active === i ? `0 0 32px ${n.color}60` : '0 2px 8px rgba(0,0,0,0.06)', transition: 'all 0.3s' }}>
                {n.emoji}
              </div>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#374151', textAlign: 'center', lineHeight: 1.3 }}>{n.label}</span>
              <span style={{ fontSize: '0.875rem', fontWeight: 900, color: n.color }}>{n.value}</span>
            </div>
            {i < nodes.length - 1 && (
              <div style={{ width: 56, height: 32, position: 'relative', overflow: 'hidden', margin: '0 4px', marginBottom: 36 }}>
                <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: 2, background: '#E2E8F0', transform: 'translateY(-50%)' }} />
                <div style={{ position: 'absolute', top: '50%', left: 0, width: 22, height: 2, background: `linear-gradient(90deg,transparent,${nodes[i].color})`, transform: 'translateY(-50%)', animation: 'flow-right 1.2s ease-in-out infinite', animationDelay: `${i * 0.3}s` }} />
                <ChevronRight size={14} style={{ position: 'absolute', right: 4, top: '50%', transform: 'translateY(-50%)', color: nodes[i].color }} />
              </div>
            )}
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10 }}>
        {[
          { label: 'Generated Today', value: '41.8 kWh', color: '#FACC15', bg: '#FEFCE8' },
          { label: 'Consumed Today',  value: '29.6 kWh', color: '#22C55E', bg: '#F0FDF4' },
          { label: 'Grid Exported',   value: '12.2 kWh', color: '#38BDF8', bg: '#F0F9FF' },
          { label: 'CO₂ Saved',       value: '18.4 kg',  color: '#8B5CF6', bg: '#F5F3FF' },
        ].map((s, i) => (
          <div key={i} style={{ background: s.bg, borderRadius: 12, padding: '0.875rem', textAlign: 'center', border: `1px solid ${s.color}30` }}>
            <div style={{ fontSize: '1.05rem', fontWeight: 900, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: '0.7rem', color: '#94A3B8', marginTop: 3, fontWeight: 600 }}>{s.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function DashboardMock() {
  const bars = [3, 5, 4, 7, 6, 8, 5, 4, 6, 9, 7, 5, 8, 6, 4, 7, 8, 5, 6, 7];
  return (
    <div style={{ background: '#0A0F1E', borderRadius: 24, overflow: 'hidden', boxShadow: '0 32px 80px rgba(0,0,0,0.30)', border: '1px solid #1E293B' }}>
      <div style={{ background: '#0F172A', padding: '1rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #1E293B' }}>
        <div style={{ display: 'flex', gap: 7 }}>
          {['#EF4444', '#FACC15', '#22C55E'].map((c, i) => <div key={i} style={{ width: 12, height: 12, borderRadius: '50%', background: c }} />)}
        </div>
        <span style={{ color: '#475569', fontSize: '0.8rem', fontWeight: 600 }}>EcoPower Dashboard — Rahul Sharma</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#22C55E', display: 'inline-block', animation: 'pulse-dot 2s infinite' }} />
          <span style={{ fontSize: '0.72rem', color: '#4ADE80', fontWeight: 700 }}>LIVE</span>
        </div>
      </div>
      <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.125rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10 }}>
          {[
            { label: 'Solar Today',    value: '41.8 kWh', change: '+12%', color: '#FACC15', pct: 86 },
            { label: 'Consumption',    value: '29.6 kWh', change: '-8%',  color: '#22C55E', pct: 64 },
            { label: 'Monthly Saving', value: '₹3,286',   change: '+15%', color: '#38BDF8', pct: 72 },
            { label: 'CO₂ Saved',      value: '184 kg',   change: '+22%', color: '#8B5CF6', pct: 62 },
          ].map((m, i) => (
            <div key={i} style={{ background: '#1E293B', borderRadius: 12, padding: '1rem', border: '1px solid #334155' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                <span style={{ fontSize: '0.7rem', color: '#64748B', fontWeight: 600 }}>{m.label}</span>
                <span style={{ fontSize: '0.65rem', fontWeight: 700, color: m.change.startsWith('+') ? '#4ADE80' : '#F87171', background: m.change.startsWith('+') ? 'rgba(74,222,128,0.1)' : 'rgba(248,113,113,0.1)', padding: '2px 6px', borderRadius: 4 }}>{m.change}</span>
              </div>
              <div style={{ fontSize: '1.1rem', fontWeight: 900, color: '#F1F5F9', marginBottom: 8 }}>{m.value}</div>
              <div style={{ height: 3, background: '#334155', borderRadius: 2 }}>
                <div style={{ height: '100%', width: `${m.pct}%`, background: m.color, borderRadius: 2 }} />
              </div>
            </div>
          ))}
        </div>
        <div style={{ background: '#1E293B', borderRadius: 14, padding: '1.125rem', border: '1px solid #334155' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#CBD5E1' }}>Energy Generation — Last 20 Hours</span>
            <span style={{ fontSize: '0.72rem', color: '#4ADE80', fontWeight: 700 }}>↑ 12% vs yesterday</span>
          </div>
          <div style={{ display: 'flex', gap: 4, alignItems: 'flex-end', height: 64 }}>
            {bars.map((v, i) => (
              <div key={i} style={{ flex: 1, height: `${(v / 9) * 100}%`, background: i === 9 ? '#22C55E' : `rgba(34,197,94,${0.2 + (v / 9) * 0.55})`, borderRadius: '3px 3px 0 0', transition: 'all 0.3s' }} />
            ))}
          </div>
        </div>
        <div style={{ background: '#1E293B', borderRadius: 14, padding: '1.125rem', border: '1px solid #334155' }}>
          <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#CBD5E1', marginBottom: '0.875rem' }}>Connected Devices</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
            {[
              { name: 'Solar Inverter',  loc: 'Roof South',    val: '4.2 kW',   online: true },
              { name: 'Battery Bank',    loc: 'Basement',      val: '87% SOC',  online: true },
              { name: 'Smart Meter',     loc: 'Main Entrance', val: '28.3 kWh', online: true },
              { name: 'Weather Station', loc: 'Roof',          val: '--',       online: false },
            ].map((d, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 7, height: 7, borderRadius: '50%', background: d.online ? '#22C55E' : '#EF4444', flexShrink: 0, animation: d.online ? 'pulse-dot 2s infinite' : 'none' }} />
                  <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#E2E8F0' }}>{d.name}</span>
                  <span style={{ fontSize: '0.7rem', color: '#475569' }}>{d.loc}</span>
                </div>
                <span style={{ fontSize: '0.78rem', fontWeight: 700, color: d.online ? '#4ADE80' : '#64748B' }}>{d.val}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function HomePage() {
  const [scrolled, setScrolled] = useState(false);
  const [billingAnnual, setBillingAnnual] = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 60);
    window.addEventListener('scroll', fn, { passive: true });
    return () => window.removeEventListener('scroll', fn);
  }, []);

  const plans = [
    { name: 'Solar Basic',   price: billingAnnual ? '₹1,199' : '₹1,499', cap: '5 kW',  popular: false, sub: 'For small homes & apartments',
      features: ['5 kW Solar Power', 'Basic Monitoring', '5 kWh Battery Backup', 'Grid Synchronization', 'Email Support'] },
    { name: 'Solar Premium', price: billingAnnual ? '₹2,399' : '₹2,999', cap: '10 kW', popular: true,  sub: 'For homes & small businesses',
      features: ['10 kW Solar Power', 'Advanced Monitoring', '10 kWh Battery Backup', 'Grid Synchronization', 'Priority Support', 'Smart Load Management', 'AI Energy Advisor'] },
    { name: 'Solar Pro',     price: billingAnnual ? '₹3,999' : '₹4,999', cap: '15 kW', popular: false, sub: 'For large homes & businesses',
      features: ['15 kW Solar Power', 'Premium Monitoring', '20 kWh Battery Backup', 'Grid Synchronization', '24/7 Priority Support', 'Smart Load Management', 'AI Energy Advisor', 'ESG Reporting'] },
  ];

  return (
    <div style={{ background: '#F8FAFC', color: '#1E293B', fontFamily: 'Inter, sans-serif', overflowX: 'hidden' }}>

      {/* NAVBAR */}
      <nav style={{ position: 'fixed', top: 0, width: '100%', zIndex: 300, background: scrolled ? 'rgba(255,255,255,0.98)' : 'rgba(255,255,255,0.92)', backdropFilter: 'blur(20px)', borderBottom: `1px solid ${scrolled ? '#E2E8F0' : 'transparent'}`, transition: 'all 0.3s ease', boxShadow: scrolled ? '0 2px 20px rgba(0,0,0,0.07)' : 'none' }}>
        <div style={{ maxWidth: 1400, margin: '0 auto', padding: '0 3rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 76 }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 12, fontWeight: 900, fontSize: '1.5rem', color: '#0F172A', textDecoration: 'none', letterSpacing: '-0.04em' }}>
            <div style={{ width: 42, height: 42, background: 'linear-gradient(135deg,#22C55E,#16A34A)', borderRadius: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 6px 18px rgba(34,197,94,0.45)' }}>
              <Zap size={22} color="#fff" strokeWidth={2.5} />
            </div>
            EcoPower
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: '2.75rem' }}>
            {['Features', 'How It Works', 'Pricing', 'About'].map(l => (
              <a key={l} href={`#${l.toLowerCase().replace(/ /g, '-')}`}
                style={{ fontSize: '0.9375rem', fontWeight: 500, color: '#64748B', textDecoration: 'none', transition: 'color 0.2s' }}
                onMouseEnter={e => e.target.style.color = '#22C55E'}
                onMouseLeave={e => e.target.style.color = '#64748B'}>{l}</a>
            ))}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <Link href="/login" style={{ fontSize: '0.9375rem', fontWeight: 600, color: '#374151', textDecoration: 'none', padding: '0.5625rem 1.125rem', borderRadius: 10, transition: 'all 0.2s' }}
              onMouseEnter={e => { e.currentTarget.style.background = '#F1F5F9'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}>Login</Link>
            <Link href="/login" style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '0.6875rem 1.625rem', background: '#22C55E', color: '#fff', borderRadius: 11, fontSize: '0.9375rem', fontWeight: 700, textDecoration: 'none', boxShadow: '0 4px 16px rgba(34,197,94,0.38)', transition: 'all 0.2s', letterSpacing: '-0.01em' }}
              onMouseEnter={e => { e.currentTarget.style.background = '#16A34A'; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(34,197,94,0.48)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = '#22C55E'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(34,197,94,0.38)'; }}>
              Get Started <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', paddingTop: 76, background: 'linear-gradient(150deg, #F0FDF4 0%, #F8FAFC 40%, #EFF6FF 100%)', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '-8%', right: '-4%', width: 700, height: 700, borderRadius: '50%', background: 'radial-gradient(circle, rgba(34,197,94,0.09) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '-8%', left: '-4%', width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(56,189,248,0.07) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: '30%', left: '40%', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(250,204,21,0.05) 0%, transparent 70%)', pointerEvents: 'none' }} />

        <div style={{ maxWidth: 1400, margin: '0 auto', padding: '6rem 3rem', display: 'grid', gridTemplateColumns: '1fr 1.1fr', gap: '5rem', alignItems: 'center', width: '100%' }}>
          <div>
            <div className="section-label" style={{ marginBottom: '1.75rem', fontSize: '0.875rem' }}>
              <Sparkles size={15} /> India's #1 Energy-as-a-Service Platform
            </div>
            <h1 style={{ fontSize: 'clamp(3rem, 5.5vw, 5rem)', fontWeight: 900, color: '#0F172A', lineHeight: 1.0, marginBottom: '1.75rem', letterSpacing: '-0.05em' }}>
              Clean Energy,{' '}
              <span style={{ background: 'linear-gradient(135deg,#22C55E 0%,#16A34A 50%,#15803D 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                Simplified.
              </span>
            </h1>
            <p style={{ fontSize: '1.25rem', color: '#64748B', lineHeight: 1.85, marginBottom: '2.75rem', maxWidth: 540 }}>
              Subscribe to solar power, battery backup, and smart energy management without owning or maintaining any equipment. Zero upfront costs, zero technical hassles.
            </p>

            <div style={{ display: 'flex', gap: '1.125rem', marginBottom: '3.5rem', flexWrap: 'wrap' }}>
              <Link href="/login" style={{ display: 'inline-flex', alignItems: 'center', gap: 9, padding: '1.125rem 2.5rem', background: '#22C55E', color: '#fff', borderRadius: 14, fontWeight: 800, fontSize: '1.125rem', textDecoration: 'none', boxShadow: '0 10px 32px rgba(34,197,94,0.42)', transition: 'all 0.25s', letterSpacing: '-0.02em' }}
                onMouseEnter={e => { e.currentTarget.style.background = '#16A34A'; e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 16px 44px rgba(34,197,94,0.52)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = '#22C55E'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 10px 32px rgba(34,197,94,0.42)'; }}>
                Subscribe Now <ArrowRight size={20} />
              </Link>
              <a href="#how-it-works" style={{ display: 'inline-flex', alignItems: 'center', gap: 9, padding: '1.125rem 2.5rem', background: '#fff', color: '#374151', borderRadius: 14, fontWeight: 700, fontSize: '1.125rem', textDecoration: 'none', border: '2px solid #E2E8F0', transition: 'all 0.25s', boxShadow: '0 4px 12px rgba(0,0,0,0.06)' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#22C55E'; e.currentTarget.style.color = '#22C55E'; e.currentTarget.style.transform = 'translateY(-3px)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = '#E2E8F0'; e.currentTarget.style.color = '#374151'; e.currentTarget.style.transform = 'translateY(0)'; }}>
                <Play size={18} fill="currentColor" /> Watch Demo
              </a>
            </div>

            <div style={{ display: 'flex', gap: '0.875rem', marginBottom: '3rem', flexWrap: 'wrap' }}>
              {[
                { icon: <Shield size={15} />, text: '100% Green Energy' },
                { icon: <Lock size={15} />,   text: 'Bank-grade Security' },
                { icon: <Zap size={15} />,    text: 'Zero Upfront Cost' },
                { icon: <Clock size={15} />,  text: 'Subscribe in 5 min' },
              ].map((b, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '0.5rem 1rem', background: '#fff', border: '1px solid #E2E8F0', borderRadius: '2rem', fontSize: '0.8125rem', fontWeight: 600, color: '#374151', boxShadow: '0 2px 6px rgba(0,0,0,0.04)' }}>
                  <span style={{ color: '#22C55E' }}>{b.icon}</span> {b.text}
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: '3rem', paddingTop: '2.25rem', borderTop: '1px solid #E2E8F0' }}>
              {[['5,000+', 'Happy Customers'], ['25 MW', 'Clean Energy'], ['500+', 'Tonnes CO₂ Saved']].map(([v, l], i) => (
                <div key={i}>
                  <div style={{ fontSize: '2rem', fontWeight: 900, color: '#22C55E', letterSpacing: '-0.04em' }}>{v}</div>
                  <div style={{ fontSize: '0.8125rem', color: '#94A3B8', fontWeight: 500, marginTop: 4 }}>{l}</div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
            <LiveEnergyFlow />
            <DashboardMock />
          </div>
        </div>
      </section>

      {/* STATS BAND */}
      <section style={{ background: '#0F172A', padding: '4rem 3rem' }}>
        <div style={{ maxWidth: 1400, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '2rem' }}>
          {[
            { icon: <Sun size={32} />,      label: 'Solar Capacity',   value: 25,   suffix: ' MW',  color: '#FACC15' },
            { icon: <Users size={32} />,    label: 'Active Customers', value: 5000, suffix: '+',    color: '#22C55E' },
            { icon: <Leaf size={32} />,     label: 'CO₂ Reduced',      value: 500,  suffix: '+ T',  color: '#4ADE80' },
            { icon: <Activity size={32} />, label: 'Uptime SLA',       value: 99,   suffix: '.9%',  color: '#38BDF8' },
          ].map((s, i) => (
            <div key={i} style={{ textAlign: 'center', padding: '2rem 1.5rem' }}>
              <div style={{ color: s.color, display: 'flex', justifyContent: 'center', marginBottom: '1rem', opacity: 0.9 }}>{s.icon}</div>
              <div style={{ fontSize: '3rem', fontWeight: 900, color: '#F1F5F9', letterSpacing: '-0.05em', lineHeight: 1 }}>
                <Counter end={s.value} suffix={s.suffix} />
              </div>
              <div style={{ fontSize: '0.9375rem', color: '#64748B', marginTop: 8, fontWeight: 500 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how-it-works" style={{ padding: '9rem 3rem', background: '#fff' }}>
        <div style={{ maxWidth: 1400, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '5.5rem' }}>
            <div className="section-label" style={{ marginBottom: '1.5rem' }}><Activity size={15} /> Simple Process</div>
            <h2 style={{ fontSize: 'clamp(2.25rem,4vw,3.5rem)', fontWeight: 900, color: '#0F172A', marginBottom: '1.25rem', letterSpacing: '-0.04em' }}>How It Works</h2>
            <p style={{ color: '#64748B', maxWidth: 560, margin: '0 auto', fontSize: '1.125rem', lineHeight: 1.8 }}>Get started with clean energy in 4 simple steps — no technical knowledge required.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '2.5rem', position: 'relative' }}>
            <div style={{ position: 'absolute', top: 60, left: '12.5%', right: '12.5%', height: 2, background: 'linear-gradient(90deg,#22C55E,#38BDF8,#8B5CF6,#FACC15)', opacity: 0.25, zIndex: 0 }} />
            {[
              { n: '01', icon: <BarChart3 size={32} color="#22C55E" />, title: 'Choose a Plan',       desc: 'Select a solar or energy service plan that fits your needs and budget. Monthly, annual, or pay-as-you-go.', color: '#22C55E', bg: '#F0FDF4', border: '#BBF7D0' },
              { n: '02', icon: <Cpu size={32} color="#38BDF8" />,       title: 'Connect Smart Meter', desc: 'IoT smart meters are installed to track real-time energy usage automatically with zero effort from you.', color: '#38BDF8', bg: '#F0F9FF', border: '#BAE6FD' },
              { n: '03', icon: <TrendingUp size={32} color="#8B5CF6" />, title: 'Monitor Energy',     desc: 'View consumption, savings, and carbon impact on your live dashboard 24/7 from any device.', color: '#8B5CF6', bg: '#F5F3FF', border: '#DDD6FE' },
              { n: '04', icon: <CreditCard size={32} color="#FACC15" />, title: 'Pay Monthly',        desc: 'Simple subscription billing with transparent pricing, Razorpay integration, and no hidden charges.', color: '#FACC15', bg: '#FEFCE8', border: '#FEF08A' },
            ].map((s, i) => (
              <div key={i} style={{ background: '#fff', border: `1px solid ${s.border}`, borderRadius: 24, padding: '2.75rem 2.25rem', position: 'relative', zIndex: 1, transition: 'all 0.3s ease', cursor: 'default', boxShadow: '0 4px 16px rgba(0,0,0,0.05)' }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-8px)'; e.currentTarget.style.boxShadow = `0 20px 48px ${s.color}22`; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.05)'; }}>
                <div style={{ position: 'absolute', top: '1.75rem', right: '2rem', fontSize: '3.5rem', fontWeight: 900, color: `${s.color}12`, lineHeight: 1, letterSpacing: '-0.05em' }}>{s.n}</div>
                <div style={{ width: 68, height: 68, background: s.bg, borderRadius: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.75rem', border: `1px solid ${s.border}`, boxShadow: `0 6px 16px ${s.color}22` }}>{s.icon}</div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0F172A', marginBottom: '0.875rem', letterSpacing: '-0.025em' }}>{s.title}</h3>
                <p style={{ fontSize: '0.9375rem', color: '#64748B', lineHeight: 1.75 }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" style={{ padding: '9rem 3rem', background: '#F8FAFC' }}>
        <div style={{ maxWidth: 1400, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '5.5rem' }}>
            <div className="section-label" style={{ marginBottom: '1.5rem' }}><Star size={15} /> Platform Features</div>
            <h2 style={{ fontSize: 'clamp(2.25rem,4vw,3.5rem)', fontWeight: 900, color: '#0F172A', marginBottom: '1.25rem', letterSpacing: '-0.04em' }}>Everything You Need</h2>
            <p style={{ color: '#64748B', maxWidth: 580, margin: '0 auto', fontSize: '1.125rem', lineHeight: 1.8 }}>Comprehensive energy management with real-time monitoring, AI insights, and seamless billing.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '2.25rem' }}>
            {[
              { icon: <Sun size={32} />,        title: 'Real-Time Monitoring',   desc: 'Track solar generation and consumption live with second-by-second updates, instant alerts, and historical trends.',          color: '#FACC15', bg: '#FEFCE8', border: '#FEF08A' },
              { icon: <TrendingUp size={32} />,  title: 'Smart Analytics',        desc: 'AI-powered insights on daily, weekly, and monthly energy consumption patterns with predictive forecasting.',              color: '#22C55E', bg: '#F0FDF4', border: '#BBF7D0' },
              { icon: <CreditCard size={32} />,  title: 'Transparent Billing',    desc: 'Clear monthly invoices with Razorpay integration, UPI/card/netbanking support, auto-pay, and flexible payment options.', color: '#8B5CF6', bg: '#F5F3FF', border: '#DDD6FE' },
              { icon: <Cpu size={32} />,         title: 'IoT Integration',        desc: 'Connect smart meters and energy devices seamlessly via our secure IoT platform with 99.9% uptime guarantee.',           color: '#38BDF8', bg: '#F0F9FF', border: '#BAE6FD' },
              { icon: <Zap size={32} />,         title: 'AI Energy Advisor',      desc: 'Get personalized tips to reduce electricity costs and optimize usage based on your unique consumption patterns.',         color: '#F97316', bg: '#FFF7ED', border: '#FED7AA' },
              { icon: <Leaf size={32} />,        title: 'Carbon Tracker',         desc: 'Monitor your CO₂ savings and contribution to a greener planet with detailed ESG reporting and sustainability scores.',    color: '#16A34A', bg: '#F0FDF4', border: '#BBF7D0' },
              { icon: <Globe size={32} />,       title: 'DISCOM Integration',     desc: 'Simulated DISCOM workflows for net-metering approval, grid synchronization, billing sync, and load management.',         color: '#0EA5E9', bg: '#F0F9FF', border: '#BAE6FD' },
              { icon: <Wind size={32} />,        title: 'P2P Energy Trading',     desc: 'Trade surplus solar energy with neighbors on our peer-to-peer marketplace and earn credits on your bill.',               color: '#EC4899', bg: '#FDF2F8', border: '#FBCFE8' },
              { icon: <Award size={32} />,       title: 'Multi-Site Management',  desc: 'Enterprise-grade multi-site dashboard for managing energy across multiple locations with unified reporting.',             color: '#6366F1', bg: '#EEF2FF', border: '#C7D2FE' },
            ].map((f, i) => (
              <div key={i} style={{ background: '#fff', border: `1px solid ${f.border}`, borderRadius: 24, padding: '2.75rem 2.25rem', transition: 'all 0.3s ease', cursor: 'default', boxShadow: '0 4px 16px rgba(0,0,0,0.05)' }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-8px)'; e.currentTarget.style.boxShadow = `0 20px 48px ${f.color}22`; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.05)'; }}>
                <div style={{ width: 68, height: 68, background: f.bg, borderRadius: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.75rem', color: f.color, border: `1px solid ${f.border}`, boxShadow: `0 6px 16px ${f.color}22` }}>{f.icon}</div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0F172A', marginBottom: '0.875rem', letterSpacing: '-0.025em' }}>{f.title}</h3>
                <p style={{ fontSize: '0.9375rem', color: '#64748B', lineHeight: 1.75 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" style={{ padding: '9rem 3rem', background: '#fff' }}>
        <div style={{ maxWidth: 1400, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '5.5rem' }}>
            <div className="section-label" style={{ marginBottom: '1.5rem' }}><CreditCard size={15} /> Energy Service Plans</div>
            <h2 style={{ fontSize: 'clamp(2.25rem,4vw,3.5rem)', fontWeight: 900, color: '#0F172A', marginBottom: '1.25rem', letterSpacing: '-0.04em' }}>Choose the Perfect Plan</h2>
            <p style={{ color: '#64748B', fontSize: '1.125rem', marginBottom: '2.5rem' }}>No upfront costs. Cancel anytime. Start saving from day one.</p>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 0, background: '#F1F5F9', borderRadius: '2rem', padding: 4, border: '1px solid #E2E8F0' }}>
              {['Monthly', 'Annual (20% off)'].map((label, i) => (
                <button key={i} onClick={() => setBillingAnnual(i === 1)}
                  style={{ padding: '0.625rem 1.5rem', borderRadius: '2rem', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '0.9rem', fontFamily: 'Inter, sans-serif', transition: 'all 0.2s', background: (i === 1) === billingAnnual ? '#22C55E' : 'transparent', color: (i === 1) === billingAnnual ? '#fff' : '#64748B', boxShadow: (i === 1) === billingAnnual ? '0 3px 10px rgba(34,197,94,0.35)' : 'none' }}>
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '2.5rem', maxWidth: 1200, margin: '0 auto' }}>
            {plans.map((p, i) => (
              <div key={i} style={{ background: p.popular ? '#0F172A' : '#F8FAFC', border: `${p.popular ? '2px' : '1px'} solid ${p.popular ? '#22C55E' : '#E2E8F0'}`, borderRadius: 28, padding: '3rem 2.5rem', position: 'relative', transition: 'all 0.3s ease', boxShadow: p.popular ? '0 32px 80px rgba(34,197,94,0.22)' : '0 4px 16px rgba(0,0,0,0.05)' }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-8px)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; }}>
                {p.popular && (
                  <div style={{ position: 'absolute', top: -18, left: '50%', transform: 'translateX(-50%)', padding: '0.5rem 1.75rem', background: 'linear-gradient(135deg,#22C55E,#16A34A)', borderRadius: '2rem', fontSize: '0.78rem', fontWeight: 800, color: '#fff', whiteSpace: 'nowrap', boxShadow: '0 6px 18px rgba(34,197,94,0.45)', letterSpacing: '0.06em' }}>
                    ✦ MOST POPULAR
                  </div>
                )}
                <div style={{ marginBottom: '0.625rem', fontWeight: 900, fontSize: '1.375rem', color: p.popular ? '#F1F5F9' : '#0F172A', letterSpacing: '-0.025em' }}>{p.name}</div>
                <div style={{ fontSize: '0.9rem', color: p.popular ? '#64748B' : '#94A3B8', marginBottom: '2rem' }}>{p.sub}</div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '3.5rem', fontWeight: 900, color: '#22C55E', letterSpacing: '-0.05em', lineHeight: 1 }}>{p.price}</span>
                </div>
                <div style={{ fontSize: '0.9rem', color: p.popular ? '#475569' : '#94A3B8', marginBottom: '2.25rem' }}>/month · {p.cap} Solar</div>
                <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2.5rem' }}>
                  {p.features.map((f, j) => (
                    <li key={j} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.9375rem', color: p.popular ? '#CBD5E1' : '#374151' }}>
                      <CheckCircle2 size={18} color="#22C55E" strokeWidth={2.5} style={{ flexShrink: 0 }} /> {f}
                    </li>
                  ))}
                </ul>
                <Link href="/login" style={{ display: 'block', textAlign: 'center', padding: '1.0625rem', background: p.popular ? '#22C55E' : '#fff', color: p.popular ? '#fff' : '#374151', border: p.popular ? 'none' : '2px solid #E2E8F0', borderRadius: 14, fontWeight: 800, fontSize: '1rem', textDecoration: 'none', transition: 'all 0.25s', boxShadow: p.popular ? '0 8px 24px rgba(34,197,94,0.42)' : 'none', letterSpacing: '-0.01em' }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; if (p.popular) e.currentTarget.style.background = '#16A34A'; else e.currentTarget.style.borderColor = '#22C55E'; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; if (p.popular) e.currentTarget.style.background = '#22C55E'; else e.currentTarget.style.borderColor = '#E2E8F0'; }}>
                  Select Plan
                </Link>
              </div>
            ))}
          </div>
          <div style={{ textAlign: 'center', marginTop: '3rem' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '0.875rem 2rem', background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 12, fontSize: '0.9rem', color: '#16A34A', fontWeight: 600 }}>
              <Zap size={16} /> Also available: Pay-as-you-go at ₹8/kWh — no monthly commitment
            </div>
          </div>
        </div>
      </section>

      {/* SUSTAINABILITY */}
      <section style={{ padding: '9rem 3rem', background: 'linear-gradient(150deg,#F0FDF4 0%,#ECFDF5 60%,#F0F9FF 100%)' }}>
        <div style={{ maxWidth: 1400, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '5.5rem' }}>
            <div className="section-label" style={{ marginBottom: '1.5rem' }}><Leaf size={15} /> Environmental Impact</div>
            <h2 style={{ fontSize: 'clamp(2.25rem,4vw,3.5rem)', fontWeight: 900, color: '#0F172A', marginBottom: '1.25rem', letterSpacing: '-0.04em' }}>Our Sustainability Impact</h2>
            <p style={{ color: '#64748B', fontSize: '1.125rem', maxWidth: 540, margin: '0 auto', lineHeight: 1.8 }}>Together, we're building a cleaner, greener future — one kilowatt at a time.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '2.25rem' }}>
            {[
              { icon: '🌳', label: 'Trees Equivalent',    value: 1240, suffix: '',    color: '#22C55E', sub: 'trees planted this month',    bg: '#F0FDF4', border: '#BBF7D0' },
              { icon: '🚗', label: 'Car Emissions Offset', value: 1240, suffix: ' km', color: '#38BDF8', sub: 'car emissions offset monthly', bg: '#F0F9FF', border: '#BAE6FD' },
              { icon: '🏠', label: 'Homes Powered',        value: 500,  suffix: '+',   color: '#FACC15', sub: 'homes powered by clean energy', bg: '#FEFCE8', border: '#FEF08A' },
              { icon: '🌱', label: 'Carbon Neutral',       value: 500,  suffix: '+ T', color: '#16A34A', sub: 'tonnes CO₂ saved in total',    bg: '#F0FDF4', border: '#BBF7D0' },
            ].map((s, i) => (
              <div key={i} style={{ background: '#fff', borderRadius: 28, padding: '3rem 2rem', boxShadow: '0 6px 24px rgba(0,0,0,0.07)', border: `1px solid ${s.border}`, textAlign: 'center', transition: 'all 0.3s ease' }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-8px)'; e.currentTarget.style.boxShadow = `0 20px 48px ${s.color}22`; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 6px 24px rgba(0,0,0,0.07)'; }}>
                <div style={{ fontSize: '3.5rem', marginBottom: '1.25rem' }}>{s.icon}</div>
                <div style={{ fontSize: '3rem', fontWeight: 900, color: s.color, marginBottom: '0.625rem', letterSpacing: '-0.05em', lineHeight: 1 }}>
                  <Counter end={s.value} suffix={s.suffix} />
                </div>
                <div style={{ fontSize: '1rem', fontWeight: 700, color: '#374151', marginBottom: '0.5rem' }}>{s.label}</div>
                <div style={{ fontSize: '0.85rem', color: '#94A3B8' }}>{s.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section style={{ padding: '9rem 3rem', background: '#fff' }}>
        <div style={{ maxWidth: 1400, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '5.5rem' }}>
            <div className="section-label" style={{ marginBottom: '1.5rem' }}><Star size={15} /> Customer Stories</div>
            <h2 style={{ fontSize: 'clamp(2.25rem,4vw,3.5rem)', fontWeight: 900, color: '#0F172A', letterSpacing: '-0.04em' }}>What Our Customers Say</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '2.25rem' }}>
            {[
              { quote: 'This platform helped our housing society reduce electricity costs by 30%. The real-time dashboard is incredibly intuitive and the support team is excellent.', name: 'Rajesh Kumar', role: 'Housing Society Manager', company: 'Mumbai', avatar: 'RK', color: '#22C55E' },
              { quote: 'Real-time monitoring makes energy management extremely simple. The AI advisor has saved us thousands every month and the carbon tracking is a great bonus.', name: 'Priya Sharma', role: 'Factory Energy Manager', company: 'Pune', avatar: 'PS', color: '#38BDF8' },
              { quote: 'Switching to EcoPower was the best decision for our business. The multi-site dashboard gives us complete visibility across all our locations instantly.', name: 'Vikram Mehta', role: 'Operations Director', company: 'TechCorp Industries', avatar: 'VM', color: '#8B5CF6' },
            ].map((t, i) => (
              <div key={i} style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 28, padding: '3rem', transition: 'all 0.3s ease', boxShadow: '0 4px 16px rgba(0,0,0,0.05)' }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-6px)'; e.currentTarget.style.boxShadow = '0 16px 40px rgba(0,0,0,0.10)'; e.currentTarget.style.borderColor = '#BBF7D0'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.05)'; e.currentTarget.style.borderColor = '#E2E8F0'; }}>
                <div style={{ display: 'flex', gap: 3, marginBottom: '1.75rem' }}>
                  {[...Array(5)].map((_, j) => <Star key={j} size={20} fill="#FACC15" color="#FACC15" />)}
                </div>
                <p style={{ fontSize: '1.0625rem', color: '#374151', lineHeight: 1.85, marginBottom: '2.25rem', fontStyle: 'italic' }}>"{t.quote}"</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{ width: 50, height: 50, borderRadius: '50%', background: `${t.color}20`, color: t.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '0.9375rem', border: `2px solid ${t.color}40`, flexShrink: 0 }}>{t.avatar}</div>
                  <div>
                    <div style={{ fontWeight: 800, color: '#0F172A', fontSize: '1rem' }}>{t.name}</div>
                    <div style={{ fontSize: '0.85rem', color: '#94A3B8' }}>{t.role} · {t.company}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: '9rem 3rem', background: '#0F172A', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '-20%', left: '-5%', width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle,rgba(34,197,94,0.13) 0%,transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '-20%', right: '-5%', width: 700, height: 700, borderRadius: '50%', background: 'radial-gradient(circle,rgba(56,189,248,0.09) 0%,transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ maxWidth: 900, margin: '0 auto', textAlign: 'center', position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '0.5rem 1.25rem', background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: '2rem', color: '#4ADE80', fontSize: '0.875rem', fontWeight: 600, marginBottom: '2rem' }}>
            <Sparkles size={15} /> Join 5,000+ happy customers
          </div>
          <h2 style={{ fontSize: 'clamp(2.5rem,5.5vw,4rem)', fontWeight: 900, color: '#F1F5F9', marginBottom: '1.5rem', lineHeight: 1.05, letterSpacing: '-0.05em' }}>
            Start Your Clean Energy<br />Journey Today
          </h2>
          <p style={{ color: '#64748B', fontSize: '1.25rem', marginBottom: '3rem', lineHeight: 1.8 }}>
            Subscribe to solar power, reduce your bills, and help the planet — all with zero upfront investment.
          </p>
          <div style={{ display: 'flex', gap: '1.25rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/login" style={{ display: 'inline-flex', alignItems: 'center', gap: 9, padding: '1.125rem 2.75rem', background: '#22C55E', color: '#fff', borderRadius: 14, fontWeight: 800, fontSize: '1.125rem', textDecoration: 'none', boxShadow: '0 10px 32px rgba(34,197,94,0.42)', transition: 'all 0.25s', letterSpacing: '-0.02em' }}
              onMouseEnter={e => { e.currentTarget.style.background = '#16A34A'; e.currentTarget.style.transform = 'translateY(-4px)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = '#22C55E'; e.currentTarget.style.transform = 'translateY(0)'; }}>
              Get Started Free <ArrowRight size={20} />
            </Link>
            <Link href="/login" style={{ display: 'inline-flex', alignItems: 'center', gap: 9, padding: '1.125rem 2.75rem', background: 'rgba(255,255,255,0.07)', color: '#CBD5E1', borderRadius: 14, fontWeight: 700, fontSize: '1.125rem', textDecoration: 'none', border: '2px solid rgba(255,255,255,0.12)', transition: 'all 0.25s' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.12)'; e.currentTarget.style.transform = 'translateY(-3px)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; e.currentTarget.style.transform = 'translateY(0)'; }}>
              <Phone size={18} /> Book a Demo
            </Link>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ background: '#0A0F1E', color: '#64748B', padding: '6rem 3rem 3rem', borderTop: '1px solid #1E293B' }}>
        <div style={{ maxWidth: 1400, margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '2.5fr 1fr 1fr 1fr', gap: '5rem', marginBottom: '5rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontWeight: 900, fontSize: '1.5rem', color: '#F1F5F9', marginBottom: '1.5rem', letterSpacing: '-0.04em' }}>
                <div style={{ width: 40, height: 40, background: 'linear-gradient(135deg,#22C55E,#16A34A)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 14px rgba(34,197,94,0.38)' }}>
                  <Zap size={20} color="#fff" strokeWidth={2.5} />
                </div>
                EcoPower
              </div>
              <p style={{ fontSize: '0.9375rem', lineHeight: 1.85, maxWidth: 320, color: '#475569' }}>Making clean energy accessible and affordable through the Energy-as-a-Service model. Join the renewable revolution today.</p>
              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.75rem', flexWrap: 'wrap' }}>
                {['🌱 100% Green', '⚡ Zero Upfront', '🔒 Secure', '🏆 Award Winning'].map((b, i) => (
                  <span key={i} style={{ fontSize: '0.78rem', fontWeight: 600, color: '#4ADE80', background: 'rgba(34,197,94,0.08)', padding: '0.35rem 0.875rem', borderRadius: '2rem', border: '1px solid rgba(34,197,94,0.15)' }}>{b}</span>
                ))}
              </div>
            </div>
            {[
              { title: 'Services', links: ['Solar Power', 'Battery Backup', 'Smart Load Management', 'Energy Monitoring', 'Grid Synchronization', 'EV Charging'] },
              { title: 'Company',  links: ['About Us', 'Careers', 'Partners', 'Blog', 'Press', 'Sustainability Report'] },
              { title: 'Contact',  links: ['support@ecopower.com', '+91 1800-123-4567', 'Mumbai, India', '24/7 Support Available'] },
            ].map((col, i) => (
              <div key={i}>
                <div style={{ fontWeight: 800, color: '#CBD5E1', fontSize: '1rem', marginBottom: '1.5rem', letterSpacing: '-0.01em' }}>{col.title}</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {col.links.map((l, j) => (
                    <a key={j} href="#" style={{ fontSize: '0.9rem', color: '#475569', textDecoration: 'none', transition: 'color 0.2s' }}
                      onMouseEnter={e => e.target.style.color = '#22C55E'}
                      onMouseLeave={e => e.target.style.color = '#475569'}>{l}</a>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div style={{ borderTop: '1px solid #1E293B', paddingTop: '2.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <span style={{ fontSize: '0.9rem', color: '#334155' }}>© 2026 EcoPower Energy-as-a-Service Platform. All rights reserved.</span>
            <div style={{ display: 'flex', gap: '2.25rem' }}>
              {['Privacy Policy', 'Terms of Service', 'Cookie Policy'].map(l => (
                <a key={l} href="#" style={{ fontSize: '0.9rem', color: '#334155', textDecoration: 'none', transition: 'color 0.2s' }}
                  onMouseEnter={e => e.target.style.color = '#22C55E'}
                  onMouseLeave={e => e.target.style.color = '#334155'}>{l}</a>
              ))}
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
}
