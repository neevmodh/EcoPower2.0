'use client';
import { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { TrendingUp, Activity, Zap, Users, DollarSign, BarChart3, Download, Sparkles, RefreshCw, Leaf, Cpu, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import AIAdvisor from '@/components/AIAdvisor';
import { groqChat } from '@/lib/groqClient';

// ── Reusable SVG Donut ──────────────────────────────────────────────────────
function DonutChart({ segments, size = 140, stroke = 22 }) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const total = segments.reduce((s, x) => s + x.value, 0) || 1;
  let offset = 0;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#F1F5F9" strokeWidth={stroke} />
      {segments.map((seg, i) => {
        const dash = (seg.value / total) * circ;
        const gap = circ - dash;
        const el = (
          <circle key={i} cx={size/2} cy={size/2} r={r} fill="none"
            stroke={seg.color} strokeWidth={stroke}
            strokeDasharray={`${dash} ${gap}`}
            strokeDashoffset={-offset}
            strokeLinecap="round"
            style={{ transition: 'stroke-dasharray 1s cubic-bezier(0.4,0,0.2,1)' }} />
        );
        offset += dash;
        return el;
      })}
    </svg>
  );
}

// ── Interactive Bar Chart ───────────────────────────────────────────────────
function BarChart({ data, height = 200, colorA = '#22C55E', colorB = '#FEF3C7', labelA = 'Paid', labelB = 'Pending' }) {
  const [hovered, setHovered] = useState(null);
  const max = Math.max(...data.map(d => (d.a || 0) + (d.b || 0)), 1);
  return (
    <div style={{ position: 'relative' }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height }}>
        {data.map((item, i) => {
          const aH = ((item.a || 0) / max) * (height - 32);
          const bH = ((item.b || 0) / max) * (height - 32);
          const isHov = hovered === i;
          return (
            <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, cursor: 'pointer' }}
              onMouseEnter={() => setHovered(i)} onMouseLeave={() => setHovered(null)}>
              {isHov && (
                <div style={{ position: 'absolute', bottom: height - 10, left: `${(i / data.length) * 100 + (50 / data.length)}%`, transform: 'translateX(-50%)', background: '#0F172A', color: '#fff', padding: '0.4rem 0.75rem', borderRadius: 8, fontSize: '0.72rem', fontWeight: 700, whiteSpace: 'nowrap', zIndex: 10, pointerEvents: 'none' }}>
                  {item.label}: ₹{((item.a || 0) + (item.b || 0)).toLocaleString()}
                </div>
              )}
              <div style={{ width: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', height: height - 32, gap: 1 }}>
                {bH > 0 && <div className="chart-bar" style={{ width: '100%', height: bH, background: isHov ? '#FDE68A' : colorB, borderRadius: aH === 0 ? '5px 5px 0 0' : 0, border: '1px solid #F59E0B40' }} />}
                {aH > 0 && <div className="chart-bar" style={{ width: '100%', height: aH, background: isHov ? '#16A34A' : `linear-gradient(to top, ${colorA}, #4ADE80)`, borderRadius: bH === 0 ? '5px 5px 0 0' : 0 }} />}
              </div>
              <div style={{ fontSize: '0.68rem', color: '#94A3B8', fontWeight: 600, textAlign: 'center' }}>{item.label}</div>
            </div>
          );
        })}
      </div>
      <div style={{ display: 'flex', gap: 16, marginTop: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.75rem', color: '#64748B' }}><div style={{ width: 10, height: 10, borderRadius: 2, background: colorA }} />{labelA}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.75rem', color: '#64748B' }}><div style={{ width: 10, height: 10, borderRadius: 2, background: '#F59E0B' }} />{labelB}</div>
      </div>
    </div>
  );
}

// ── Sparkline ───────────────────────────────────────────────────────────────
function Sparkline({ values, color = '#22C55E', width = 80, height = 32 }) {
  if (!values || values.length < 2) return null;
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const range = max - min || 1;
  const pts = values.map((v, i) => `${(i / (values.length - 1)) * width},${height - ((v - min) / range) * height}`).join(' ');
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ overflow: 'visible' }}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={(values.length - 1) / (values.length - 1) * width} cy={height - ((values[values.length - 1] - min) / range) * height} r={3} fill={color} />
    </svg>
  );
}

export default function AdminAnalytics() {
  const { user } = useAuth();
  const [invoices, setInvoices] = useState([]);
  const [users, setUsers] = useState([]);
  const [devices, setDevices] = useState([]);
  const [telemetry, setTelemetry] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30d');
  const [aiInsight, setAiInsight] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3500); };

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [uRes, dRes, tRes, iRes] = await Promise.all([
        fetch(`/api/users?role=admin`),
        fetch(`/api/devices?role=admin`),
        fetch(`/api/telemetry/dashboard?role=admin&range=${timeRange}`),
        fetch(`/api/invoices?role=admin`),
      ]);
      const [u, d, t, i] = await Promise.all([uRes.json(), dRes.json(), tRes.json(), iRes.json()]);
      setUsers(Array.isArray(u) ? u : []);
      setDevices(Array.isArray(d) ? d : []);
      setTelemetry(t);
      setInvoices(Array.isArray(i) ? i : []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchAll(); }, [timeRange]);

  // ── Derived metrics ──────────────────────────────────────────────────────
  const totalRevenue = invoices.filter(i => ['Paid','paid'].includes(i.status)).reduce((s, i) => s + (i.totalAmount || 0), 0);
  const pendingRevenue = invoices.filter(i => ['Pending','pending'].includes(i.status)).reduce((s, i) => s + (i.totalAmount || 0), 0);
  const overdueRevenue = invoices.filter(i => ['Overdue','overdue'].includes(i.status)).reduce((s, i) => s + (i.totalAmount || 0), 0);
  const activeUsers = users.filter(u => u.status === 'Active').length;
  const onlineDevices = devices.filter(d => d.status === 'Online').length;
  const totalGen = telemetry?.totals?.totalGenerated || 0;
  const totalCons = telemetry?.totals?.totalConsumed || 0;
  const efficiency = totalCons > 0 ? ((totalGen / totalCons) * 100).toFixed(1) : 0;
  const uptimePct = devices.length > 0 ? ((onlineDevices / devices.length) * 100).toFixed(1) : 0;
  const carbonOffset = (totalGen * 0.82).toFixed(0);
  const collectionRate = (totalRevenue + pendingRevenue + overdueRevenue) > 0
    ? ((totalRevenue / (totalRevenue + pendingRevenue + overdueRevenue)) * 100).toFixed(1) : 0;

  // ── Revenue trend (monthly) ──────────────────────────────────────────────
  const revenueTrend = (() => {
    const months = {};
    invoices.forEach(inv => {
      const key = inv.billingPeriod || 'Unknown';
      if (!months[key]) months[key] = { label: key.slice(0, 3), a: 0, b: 0 };
      if (['Paid','paid'].includes(inv.status)) months[key].a += inv.totalAmount || 0;
      else months[key].b += inv.totalAmount || 0;
    });
    return Object.values(months).slice(-7);
  })();

  // ── Sparkline data (last 7 months revenue) ───────────────────────────────
  const sparkData = revenueTrend.map(r => r.a);

  // ── Role distribution ────────────────────────────────────────────────────
  const roleDistribution = [
    { label: 'Consumers',   value: users.filter(u => ['Consumer','consumer'].includes(u.role)).length,     color: '#22C55E' },
    { label: 'Enterprises', value: users.filter(u => ['Enterprise','enterprise'].includes(u.role)).length, color: '#3B82F6' },
    { label: 'Admins',      value: users.filter(u => ['Admin','admin'].includes(u.role)).length,           color: '#8B5CF6' },
  ];

  // ── Device types ─────────────────────────────────────────────────────────
  const deviceTypes = [
    { label: 'Smart Meters',    value: devices.filter(d => d.type === 'Smart Meter').length,    color: '#22C55E' },
    { label: 'Solar Inverters', value: devices.filter(d => d.type === 'Solar Inverter').length, color: '#F59E0B' },
    { label: 'Battery Systems', value: devices.filter(d => d.type === 'Battery System').length, color: '#3B82F6' },
  ];

  // ── Invoice status donut ─────────────────────────────────────────────────
  const invoiceDonut = [
    { label: 'Paid',    value: invoices.filter(i => ['Paid','paid'].includes(i.status)).length,       color: '#22C55E' },
    { label: 'Pending', value: invoices.filter(i => ['Pending','pending'].includes(i.status)).length, color: '#F59E0B' },
    { label: 'Overdue', value: invoices.filter(i => ['Overdue','overdue'].includes(i.status)).length, color: '#EF4444' },
  ];

  const getAIInsights = async () => {
    setAiLoading(true);
    try {
      const reply = await groqChat({
        messages: [{ role: 'user', content: `Analyze EcoPower platform metrics and give 4 specific actionable insights:\n- Revenue Collected: ₹${totalRevenue.toLocaleString()}, Pending: ₹${pendingRevenue.toLocaleString()}, Overdue: ₹${overdueRevenue.toLocaleString()}\n- Collection Rate: ${collectionRate}%\n- Active Users: ${activeUsers}/${users.length}\n- Energy Generated: ${totalGen.toFixed(0)} kWh, Consumed: ${totalCons.toFixed(0)} kWh\n- Green Efficiency: ${efficiency}%, Device Uptime: ${uptimePct}%\n- Carbon Offset: ${carbonOffset} kg CO2\n- Time Range: ${timeRange}\nFocus on revenue recovery, efficiency improvements, and growth opportunities.` }],
        mode: 'analytics',
      });
      setAiInsight(reply || 'No insights available.');
    } catch (err) { setAiInsight(`Error: ${err.message}`); }
    finally { setAiLoading(false); }
  };

  const exportReport = () => {
    const rows = [
      ['EcoPower Analytics Report', `Generated: ${new Date().toLocaleString()}`],
      [''],
      ['Metric', 'Value'],
      ['Revenue Collected', `₹${totalRevenue.toLocaleString()}`],
      ['Pending Revenue', `₹${pendingRevenue.toLocaleString()}`],
      ['Overdue Revenue', `₹${overdueRevenue.toLocaleString()}`],
      ['Collection Rate', `${collectionRate}%`],
      ['Active Users', activeUsers],
      ['Total Users', users.length],
      ['Energy Generated', `${totalGen.toFixed(0)} kWh`],
      ['Energy Consumed', `${totalCons.toFixed(0)} kWh`],
      ['Green Efficiency', `${efficiency}%`],
      ['Device Uptime', `${uptimePct}%`],
      ['Carbon Offset', `${carbonOffset} kg CO2`],
      ['Online Devices', `${onlineDevices}/${devices.length}`],
    ];
    const csv = rows.map(r => r.join(',')).join('\n');
    const a = document.createElement('a');
    a.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv);
    a.download = `ecopower_analytics_${timeRange}_${Date.now()}.csv`;
    a.click();
    showToast('Report exported successfully');
  };

  if (loading) return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: '1.25rem' }}>
      {[...Array(10)].map((_, i) => <div key={i} className="skeleton" style={{ height: i < 5 ? 120 : 200 }} />)}
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {toast && (
        <div className="toast-enter" style={{ position: 'fixed', top: '1.5rem', right: '1.5rem', zIndex: 3000, padding: '0.875rem 1.5rem', borderRadius: 12, background: toast.type === 'error' ? '#EF4444' : '#22C55E', color: '#fff', fontWeight: 700, boxShadow: '0 8px 24px rgba(0,0,0,0.2)', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: 8 }}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.875rem', fontWeight: 900, color: '#0F172A', margin: 0, letterSpacing: '-0.03em' }}>Revenue & Performance Analytics</h1>
          <p style={{ color: '#64748B', margin: '0.25rem 0 0 0', fontSize: '0.875rem' }}>Platform-wide insights · Live data · {invoices.length} invoices tracked</p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: 3, background: '#F1F5F9', borderRadius: 10, padding: 3 }}>
            {['7d','30d','90d','1y'].map(r => (
              <button key={r} onClick={() => setTimeRange(r)} style={{ padding: '0.45rem 0.875rem', background: timeRange === r ? '#fff' : 'transparent', color: timeRange === r ? '#0F172A' : '#64748B', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 700, fontSize: '0.8rem', boxShadow: timeRange === r ? '0 1px 4px rgba(0,0,0,0.1)' : 'none', transition: 'all 0.15s' }}>{r.toUpperCase()}</button>
            ))}
          </div>
          <button onClick={getAIInsights} disabled={aiLoading} style={{ padding: '0.55rem 1.1rem', background: 'linear-gradient(135deg,#7C3AED,#6D28D9)', color: '#fff', border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: 700, fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: 6, opacity: aiLoading ? 0.7 : 1 }}>
            <Sparkles size={15} />{aiLoading ? 'Analyzing...' : 'AI Insights'}
          </button>
          <button onClick={fetchAll} style={{ padding: '0.55rem 0.875rem', background: '#F1F5F9', border: '1px solid #E2E8F0', borderRadius: 10, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, color: '#374151' }}>
            <RefreshCw size={15} />
          </button>
          <button onClick={exportReport} style={{ padding: '0.55rem 1.1rem', background: '#0F172A', color: '#fff', border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: 700, fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Download size={15} />Export CSV
          </button>
        </div>
      </div>

      {/* AI Insight Panel */}
      {aiInsight && (
        <div style={{ background: 'linear-gradient(135deg,#F5F3FF,#EDE9FE)', border: '1px solid #DDD6FE', borderRadius: 16, padding: '1.5rem' }} className="animate-fade-up">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg,#7C3AED,#6D28D9)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Sparkles size={16} color="#fff" />
            </div>
            <span style={{ fontWeight: 800, color: '#6D28D9', fontSize: '0.9rem' }}>Groq LLaMA 3.3 70B — AI Analytics Insights</span>
          </div>
          <p style={{ margin: 0, color: '#374151', fontSize: '0.875rem', lineHeight: 1.75, whiteSpace: 'pre-wrap' }}>{aiInsight}</p>
        </div>
      )}

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: '1.25rem' }} className="dashboard-grid-5">
        {[
          { title: 'Revenue Collected', value: `₹${(totalRevenue/1000).toFixed(1)}K`, sub: `₹${(pendingRevenue/1000).toFixed(1)}K pending`, icon: DollarSign, color: '#22C55E', trend: sparkData, up: true },
          { title: 'Active Users',      value: activeUsers,                             sub: `${users.length} total registered`,              icon: Users,       color: '#3B82F6', trend: null, up: true },
          { title: 'Green Efficiency',  value: `${efficiency}%`,                        sub: `${(totalGen/1000).toFixed(1)} MWh generated`,   icon: Zap,         color: '#F59E0B', trend: null, up: true },
          { title: 'Device Uptime',     value: `${uptimePct}%`,                         sub: `${onlineDevices}/${devices.length} online`,     icon: Activity,    color: '#8B5CF6', trend: null, up: Number(uptimePct) > 90 },
          { title: 'Carbon Offset',     value: `${(carbonOffset/1000).toFixed(2)}T`,    sub: 'CO₂ avoided this period',                       icon: Leaf,        color: '#10B981', trend: null, up: true },
        ].map((m, i) => (
          <div key={i} className="metric-tile stagger-item">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: `${m.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <m.icon size={22} color={m.color} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.72rem', fontWeight: 700, color: m.up ? '#16A34A' : '#DC2626', background: m.up ? '#F0FDF4' : '#FEF2F2', padding: '3px 8px', borderRadius: 20 }}>
                {m.up ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}{m.up ? '+' : '-'}
              </div>
            </div>
            <div>
              <div style={{ color: '#64748B', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 4 }}>{m.title}</div>
              <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#0F172A', letterSpacing: '-0.03em', lineHeight: 1 }}>{m.value}</div>
              <div style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: 4 }}>{m.sub}</div>
            </div>
            {m.trend && m.trend.length > 1 && (
              <div style={{ marginTop: 4 }}>
                <Sparkline values={m.trend} color={m.color} width={100} height={28} />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Revenue Trend + User Distribution */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }} className="dashboard-grid-2">
        <div className="glass-card" style={{ padding: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.75rem' }}>
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: 800, margin: 0, color: '#0F172A' }}>Revenue Trend</h3>
              <p style={{ fontSize: '0.78rem', color: '#64748B', margin: '0.25rem 0 0 0' }}>Monthly billing cycles · Paid vs Pending</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '0.35rem 0.875rem', background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 20 }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#22C55E', display: 'inline-block', animation: 'pulse-dot 2s infinite' }} />
              <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#16A34A' }}>LIVE</span>
            </div>
          </div>
          {revenueTrend.length === 0 ? (
            <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94A3B8', fontSize: '0.875rem' }}>No invoice data yet</div>
          ) : (
            <BarChart data={revenueTrend} height={220} />
          )}
        </div>

        <div className="glass-card" style={{ padding: '2rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 800, margin: '0 0 1.5rem 0', color: '#0F172A' }}>User Distribution</h3>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem', position: 'relative' }}>
            <DonutChart segments={roleDistribution} size={140} stroke={22} />
            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', textAlign: 'center' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#0F172A', lineHeight: 1 }}>{users.length}</div>
              <div style={{ fontSize: '0.65rem', color: '#94A3B8', fontWeight: 600 }}>USERS</div>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
            {roleDistribution.map(({ label, value, color }) => {
              const pct = users.length > 0 ? ((value / users.length) * 100).toFixed(0) : 0;
              return (
                <div key={label}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                      <div style={{ width: 10, height: 10, borderRadius: 3, background: color }} />
                      <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#374151' }}>{label}</span>
                    </div>
                    <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#0F172A' }}>{value}</span>
                  </div>
                  <div style={{ width: '100%', height: 6, background: '#F1F5F9', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 3, transition: 'width 0.8s cubic-bezier(0.4,0,0.2,1)' }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Energy + Devices + Invoice Donut */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1.5rem' }}>
        {/* Energy Overview */}
        <div className="glass-card" style={{ padding: '2rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 800, margin: '0 0 1.5rem 0', color: '#0F172A' }}>Energy Overview</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.125rem' }}>
            {[
              { label: 'Generated', value: totalGen > 1000 ? `${(totalGen/1000).toFixed(2)} MWh` : `${totalGen.toFixed(0)} kWh`, color: '#22C55E', pct: 100 },
              { label: 'Consumed',  value: totalCons > 1000 ? `${(totalCons/1000).toFixed(2)} MWh` : `${totalCons.toFixed(0)} kWh`, color: '#3B82F6', pct: totalGen > 0 ? Math.min(100,(totalCons/totalGen)*100) : 0 },
              { label: 'Exported',  value: `${Math.max(0,totalGen-totalCons).toFixed(0)} kWh`, color: '#F59E0B', pct: totalGen > 0 ? Math.max(0,((totalGen-totalCons)/totalGen)*100) : 0 },
              { label: 'CO₂ Saved', value: `${carbonOffset} kg`, color: '#10B981', pct: 75 },
            ].map(item => (
              <div key={item.label}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#374151' }}>{item.label}</span>
                  <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#0F172A' }}>{item.value}</span>
                </div>
                <div style={{ width: '100%', height: 7, background: '#F1F5F9', borderRadius: 4, overflow: 'hidden' }}>
                  <div style={{ width: `${Math.min(100,item.pct)}%`, height: '100%', background: item.color, borderRadius: 4, transition: 'width 1s' }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Device Fleet */}
        <div className="glass-card" style={{ padding: '2rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 800, margin: '0 0 1.5rem 0', color: '#0F172A' }}>Device Fleet</h3>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.25rem', position: 'relative' }}>
            <DonutChart segments={deviceTypes} size={120} stroke={18} />
            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', textAlign: 'center' }}>
              <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#0F172A', lineHeight: 1 }}>{devices.length}</div>
              <div style={{ fontSize: '0.6rem', color: '#94A3B8', fontWeight: 600 }}>DEVICES</div>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {deviceTypes.map(({ label, value, color }) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.625rem 0.875rem', background: '#F8FAFC', borderRadius: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 10, height: 10, borderRadius: 3, background: color }} />
                  <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#374151' }}>{label}</span>
                </div>
                <span style={{ fontSize: '0.875rem', fontWeight: 800, color: '#0F172A' }}>{value}</span>
              </div>
            ))}
            <div style={{ padding: '0.625rem 0.875rem', background: '#F0FDF4', borderRadius: 8, display: 'flex', justifyContent: 'space-between', border: '1px solid #BBF7D0' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#16A34A' }}>Uptime</span>
              <span style={{ fontSize: '0.875rem', fontWeight: 900, color: '#16A34A' }}>{uptimePct}%</span>
            </div>
          </div>
        </div>

        {/* Invoice Status */}
        <div className="glass-card" style={{ padding: '2rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 800, margin: '0 0 1.5rem 0', color: '#0F172A' }}>Invoice Status</h3>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.25rem', position: 'relative' }}>
            <DonutChart segments={invoiceDonut} size={120} stroke={18} />
            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', textAlign: 'center' }}>
              <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#0F172A', lineHeight: 1 }}>{invoices.length}</div>
              <div style={{ fontSize: '0.6rem', color: '#94A3B8', fontWeight: 600 }}>TOTAL</div>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {invoiceDonut.map(({ label, value, color }) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.625rem 0.875rem', background: '#F8FAFC', borderRadius: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 10, height: 10, borderRadius: 3, background: color }} />
                  <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#374151' }}>{label}</span>
                </div>
                <span style={{ fontSize: '0.875rem', fontWeight: 800, color }}>{value}</span>
              </div>
            ))}
            <div style={{ padding: '0.625rem 0.875rem', background: '#F0FDF4', borderRadius: 8, display: 'flex', justifyContent: 'space-between', border: '1px solid #BBF7D0' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#16A34A' }}>Collection Rate</span>
              <span style={{ fontSize: '0.875rem', fontWeight: 900, color: '#16A34A' }}>{collectionRate}%</span>
            </div>
          </div>
        </div>
      </div>

      <AIAdvisor mode="analytics" title="Analytics AI Advisor" context={`Revenue: ₹${totalRevenue.toLocaleString()}, Users: ${activeUsers}/${users.length}, Efficiency: ${efficiency}%, Uptime: ${uptimePct}%, Carbon: ${carbonOffset}kg CO2, Collection Rate: ${collectionRate}%`} />
    </div>
  );
}
