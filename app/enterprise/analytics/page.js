'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import AIAdvisor from '@/components/AIAdvisor';
import { TrendingUp, Zap, AlertTriangle, Wrench, BarChart3, Brain, RefreshCw } from 'lucide-react';

export default function EnterpriseAnalytics() {
  const { user } = useAuth();
  const [telemetry, setTelemetry] = useState([]);
  const [range, setRange] = useState('30d');
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [implemented, setImplemented] = useState({});
  const [scheduled, setScheduled] = useState({});

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const res = await fetch(`/api/telemetry/dashboard?role=admin&range=${range}`);
        const data = await res.json();
        setTelemetry(Array.isArray(data.telemetry) ? data.telemetry : []);
      } catch (e) { setTelemetry([]); } finally { setLoading(false); }
    }
    load();
  }, [range]);

  const rangeLabels = {
    '7d': ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'],
    '30d': ['W1','W2','W3','W4','W5','W6','W7','W8'],
    '90d': ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep'],
    '1y': ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'],
  };
  const labels = rangeLabels[range] || rangeLabels['30d'];

  // Build chart data from telemetry or fallback to deterministic values
  const chartData = labels.map((label, i) => {
    const t = telemetry[i % telemetry.length];
    const base = t ? (t.solarGeneration || 0) : 0;
    const gen = base > 0 ? base * (0.7 + (i * 0.04) % 0.5) : 400 + (i * 83) % 600;
    const cons = base > 0 ? (t.consumption || 0) * (0.8 + (i * 0.03) % 0.4) : 500 + (i * 67) % 500;
    return { label, gen: Math.round(gen), cons: Math.round(cons) };
  });

  const maxVal = Math.max(...chartData.map(d => Math.max(d.gen, d.cons)), 1);
  const totalGen = chartData.reduce((s, d) => s + d.gen, 0);
  const totalCons = chartData.reduce((s, d) => s + d.cons, 0);
  const avgEff = totalCons > 0 ? Math.min(99, (totalGen / totalCons) * 100) : 0;

  const optimizations = [
    { title: 'Peak Load Shifting', impact: 'High', savings: 45000, desc: 'Shift 30% of manufacturing load to off-peak hours (10 PM - 6 AM).' },
    { title: 'Battery Storage Optimization', impact: 'Medium', savings: 28000, desc: 'Increase battery discharge during peak hours to maximize grid cost avoidance.' },
    { title: 'HVAC Schedule Adjustment', impact: 'Medium', savings: 22000, desc: 'Pre-cool facilities during solar peak hours to reduce evening grid consumption.' },
    { title: 'Power Factor Correction', impact: 'Low', savings: 12000, desc: 'Install capacitor banks to improve power factor and reduce penalty charges.' },
  ];

  const maintenance = [
    { site: 'Warehouse A', device: 'Inverter #3', issue: 'Efficiency Drop', severity: 'High', prediction: '72% probability of failure in 15 days' },
    { site: 'Manufacturing Unit', device: 'Solar Panel Array B', issue: 'Output Degradation', severity: 'Medium', prediction: 'Cleaning required — 8% efficiency loss' },
    { site: 'Office Complex', device: 'Battery Bank #2', issue: 'Capacity Decline', severity: 'Medium', prediction: 'Replace in 90 days' },
  ];

  const totalSavings = optimizations.reduce((s, o) => s + o.savings, 0);
  const impactColor = (i) => i === 'High' ? '#ef4444' : i === 'Medium' ? '#f59e0b' : '#22C55E';

  if (loading) return <div style={{ padding: '2rem', color: '#64748b' }}>Loading analytics...</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {toast && <div style={{ position: 'fixed', top: '1.5rem', right: '1.5rem', zIndex: 3000, padding: '0.875rem 1.5rem', borderRadius: 12, background: '#22C55E', color: '#fff', fontWeight: 700, boxShadow: '0 8px 24px rgba(0,0,0,0.15)', fontSize: '0.875rem' }}>{toast}</div>}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, margin: 0 }}>Advanced Analytics</h1>
          <p style={{ color: '#64748b', margin: '0.25rem 0 0 0' }}>AI-powered optimization, predictive maintenance, and energy forecasting</p>
        </div>
        <div style={{ display: 'flex', gap: 6, padding: '0.3rem', background: '#f1f5f9', borderRadius: 10 }}>
          {['7d','30d','90d','1y'].map(r => (
            <button key={r} onClick={() => setRange(r)}
              style={{ padding: '0.5rem 1rem', background: range === r ? 'white' : 'transparent', border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer', fontSize: '0.85rem', color: range === r ? '#0f172a' : '#64748b', boxShadow: range === r ? '0 1px 4px rgba(0,0,0,0.08)' : 'none' }}>
              {r.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem' }}>
        {[
          { label: 'Total Generation', value: (totalGen/1000).toFixed(1) + ' MWh', icon: Zap, color: '#f59e0b', trend: '+14%' },
          { label: 'Total Consumption', value: (totalCons/1000).toFixed(1) + ' MWh', icon: BarChart3, color: '#8b5cf6', trend: '-5%' },
          { label: 'Fleet Efficiency', value: avgEff.toFixed(1) + '%', icon: TrendingUp, color: '#22C55E', trend: '+3%' },
          { label: 'Potential Savings', value: '\u20b9' + (totalSavings/1000).toFixed(0) + 'K/mo', icon: Brain, color: '#3b82f6', trend: 'AI' },
        ].map((s, i) => (
          <div key={i} className="glass-card" style={{ padding: '1.5rem' }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: s.color + '15', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
              <s.icon size={22} color={s.color} />
            </div>
            <div style={{ color: '#64748b', fontSize: '0.8rem', fontWeight: 600, marginBottom: 4 }}>{s.label}</div>
            <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#0f172a', marginBottom: 4 }}>{s.value}</div>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: s.trend.includes('+') ? '#22C55E' : s.trend.includes('-') ? '#ef4444' : '#3b82f6' }}>{s.trend}</div>
          </div>
        ))}
      </div>

      {/* Generation vs Consumption Chart */}
      <div className="glass-card" style={{ padding: '1.75rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h3 style={{ fontWeight: 700, margin: 0 }}>Generation vs Consumption</h3>
          <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.8rem', fontWeight: 600 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ width: 12, height: 12, borderRadius: 3, background: '#22C55E', display: 'inline-block' }} />Generation</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ width: 12, height: 12, borderRadius: 3, background: '#3b82f6', display: 'inline-block' }} />Consumption</span>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.5rem', height: 200, padding: '0 0.5rem' }}>
          {chartData.map((d, i) => (
            <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              <div style={{ width: '100%', display: 'flex', gap: 2, alignItems: 'flex-end', height: 160 }}>
                <div style={{ flex: 1, height: (d.gen / maxVal * 150) + 'px', background: 'linear-gradient(to top, #22C55E, #4ade80)', borderRadius: '4px 4px 0 0', minHeight: 4 }} />
                <div style={{ flex: 1, height: (d.cons / maxVal * 150) + 'px', background: 'linear-gradient(to top, #3b82f6, #60a5fa)', borderRadius: '4px 4px 0 0', minHeight: 4 }} />
              </div>
              <div style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 600 }}>{d.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* AI Optimization */}
      <div style={{ padding: '2rem', background: 'linear-gradient(135deg, #4f46e5, #4338ca)', borderRadius: 16, color: 'white' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
            <Brain size={32} />
            <div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 900, margin: 0 }}>AI Energy Optimization</h2>
              <p style={{ opacity: 0.8, margin: 0, fontSize: '0.875rem' }}>Machine learning recommendations to reduce costs</p>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.8rem', opacity: 0.8 }}>POTENTIAL SAVINGS</div>
            <div style={{ fontSize: '2.25rem', fontWeight: 900 }}>\u20b9{(totalSavings/1000).toFixed(0)}K/mo</div>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
          {optimizations.map((opt, i) => (
            <div key={i} style={{ background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(10px)', padding: '1.25rem', borderRadius: 12, border: '1px solid rgba(255,255,255,0.15)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                <h4 style={{ fontSize: '1rem', fontWeight: 700, margin: 0 }}>{opt.title}</h4>
                <span style={{ padding: '0.2rem 0.6rem', borderRadius: 20, fontSize: '0.72rem', fontWeight: 700, background: impactColor(opt.impact) }}>{opt.impact}</span>
              </div>
              <p style={{ fontSize: '0.85rem', opacity: 0.85, marginBottom: '0.875rem' }}>{opt.desc}</p>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '1.1rem', fontWeight: 800 }}>\u20b9{opt.savings.toLocaleString()}/mo</span>
                <button style={{ padding: '0.4rem 1rem', background: 'white', color: '#4f46e5', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer' }}
                  onClick={() => { setImplemented(p => ({ ...p, [i]: true })); showToast(`"${opt.title}" queued for implementation`); }}>
                  {implemented[i] ? '✓ Queued' : 'Implement'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Predictive Maintenance */}
      <div className="glass-card" style={{ padding: '1.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
          <Wrench size={24} color="#f59e0b" />
          <h3 style={{ fontWeight: 700, margin: 0 }}>Predictive Maintenance Alerts</h3>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
          {maintenance.map((m, i) => (
            <div key={i} style={{ padding: '1.25rem', background: 'white', border: '2px solid ' + impactColor(m.severity) + '25', borderRadius: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem', marginBottom: '0.5rem' }}>
                  <AlertTriangle size={20} color={impactColor(m.severity)} />
                  <div>
                    <div style={{ fontWeight: 700 }}>{m.site} — {m.device}</div>
                    <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{m.issue}</div>
                  </div>
                  <span style={{ padding: '0.2rem 0.6rem', borderRadius: 20, fontSize: '0.72rem', fontWeight: 700, background: impactColor(m.severity) + '15', color: impactColor(m.severity) }}>{m.severity}</span>
                </div>
                <div style={{ fontSize: '0.85rem', color: '#475569' }}><strong>AI Prediction:</strong> {m.prediction}</div>
              </div>
              <button style={{ padding: '0.6rem 1.25rem', background: impactColor(m.severity), color: 'white', border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer', marginLeft: '1.5rem', fontSize: '0.85rem' }}
                onClick={() => { setScheduled(p => ({ ...p, [i]: true })); showToast(`Maintenance scheduled for ${m.site}`); }}>
                {scheduled[i] ? '✓ Scheduled' : 'Schedule'}
              </button>
            </div>
          ))}
        </div>
      </div>

      <AIAdvisor />
    </div>
  );
}
