'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Sun, Activity, TrendingUp, TrendingDown, Zap, Download, Sparkles, RefreshCw, Leaf, Battery } from 'lucide-react';
import AIAdvisor from '@/components/AIAdvisor';
import { groqChat } from '@/lib/groqClient';

// ── SVG Gauge ───────────────────────────────────────────────────────────────
function Gauge({ value, max = 100, color = '#22C55E', size = 120 }) {
  const r = 46; const circ = Math.PI * r; // half circle
  const pct = Math.min(value / max, 1);
  const dash = pct * circ;
  return (
    <svg width={size} height={size / 2 + 16} viewBox="0 0 100 58">
      <path d="M 8 50 A 42 42 0 0 1 92 50" fill="none" stroke="#F1F5F9" strokeWidth={10} strokeLinecap="round" />
      <path d="M 8 50 A 42 42 0 0 1 92 50" fill="none" stroke={color} strokeWidth={10} strokeLinecap="round"
        strokeDasharray={`${pct * 131.9} 131.9`} style={{ transition: 'stroke-dasharray 1.2s cubic-bezier(0.4,0,0.2,1)' }} />
      <text x="50" y="48" textAnchor="middle" fontSize="14" fontWeight="900" fill="#0F172A">{value}%</text>
      <text x="50" y="58" textAnchor="middle" fontSize="7" fill="#94A3B8" fontWeight="600">EFFICIENCY</text>
    </svg>
  );
}

// ── Multi-series Bar/Line Chart ─────────────────────────────────────────────
function EnergyChart({ data, type = 'bar', height = 200 }) {
  const [hovered, setHovered] = useState(null);
  if (!data || data.length === 0) return <div style={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94A3B8', fontSize: '0.875rem' }}>No data available</div>;
  const maxVal = Math.max(...data.map(d => Math.max(d.solar || 0, d.consumption || 0)), 1);

  if (type === 'line') {
    const w = 100 / (data.length - 1 || 1);
    const solarPts = data.map((d, i) => `${i * w},${height - 32 - ((d.solar || 0) / maxVal) * (height - 48)}`).join(' ');
    const consPts  = data.map((d, i) => `${i * w},${height - 32 - ((d.consumption || 0) / maxVal) * (height - 48)}`).join(' ');
    return (
      <div style={{ position: 'relative' }}>
        <svg width="100%" height={height} viewBox={`0 0 100 ${height}`} preserveAspectRatio="none" style={{ overflow: 'visible' }}>
          <polyline points={solarPts} fill="none" stroke="#FACC15" strokeWidth="0.8" strokeLinecap="round" strokeLinejoin="round" />
          <polyline points={consPts}  fill="none" stroke="#22C55E" strokeWidth="0.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <div style={{ display: 'flex', gap: 16, marginTop: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.75rem', color: '#64748B' }}><div style={{ width: 12, height: 3, background: '#FACC15', borderRadius: 2 }} />Solar</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.75rem', color: '#64748B' }}><div style={{ width: 12, height: 3, background: '#22C55E', borderRadius: 2 }} />Consumption</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ position: 'relative' }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: height - 24 }}>
        {data.map((item, i) => {
          const sH = ((item.solar || 0) / maxVal) * (height - 48);
          const cH = ((item.consumption || 0) / maxVal) * (height - 48);
          const isHov = hovered === i;
          return (
            <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, cursor: 'pointer', position: 'relative' }}
              onMouseEnter={() => setHovered(i)} onMouseLeave={() => setHovered(null)}>
              {isHov && (
                <div style={{ position: 'absolute', bottom: '100%', left: '50%', transform: 'translateX(-50%)', background: '#0F172A', color: '#fff', padding: '0.35rem 0.625rem', borderRadius: 7, fontSize: '0.68rem', fontWeight: 700, whiteSpace: 'nowrap', zIndex: 10, marginBottom: 4 }}>
                  ☀ {(item.solar||0).toFixed(1)} · ⚡ {(item.consumption||0).toFixed(1)} kWh
                </div>
              )}
              <div style={{ width: '100%', display: 'flex', gap: 1, alignItems: 'flex-end', height: height - 48 }}>
                <div className="chart-bar" style={{ flex: 1, height: Math.max(sH, 2), background: isHov ? '#EAB308' : 'linear-gradient(to top,#FACC15,#FDE68A)', borderRadius: '3px 3px 0 0' }} />
                <div className="chart-bar" style={{ flex: 1, height: Math.max(cH, 2), background: isHov ? '#16A34A' : 'linear-gradient(to top,#22C55E,#4ADE80)', borderRadius: '3px 3px 0 0' }} />
              </div>
              <div style={{ fontSize: '0.6rem', color: '#94A3B8', fontWeight: 600, textAlign: 'center', lineHeight: 1.2 }}>{item.label}</div>
            </div>
          );
        })}
      </div>
      <div style={{ display: 'flex', gap: 16, marginTop: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.75rem', color: '#64748B' }}><div style={{ width: 10, height: 10, borderRadius: 2, background: '#FACC15' }} />Solar</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.75rem', color: '#64748B' }}><div style={{ width: 10, height: 10, borderRadius: 2, background: '#22C55E' }} />Consumption</div>
      </div>
    </div>
  );
}

export default function EnergyAnalytics() {
  const { user } = useAuth();
  const [telemetry, setTelemetry] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('daily');
  const [chartType, setChartType] = useState('bar');
  const [timeRange, setTimeRange] = useState('30d');
  const [aiInsight, setAiInsight] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

  const fetchData = () => {
    if (!user?.userId) return;
    setLoading(true);
    fetch(`/api/telemetry/dashboard?userId=${user.userId}&role=${user.role}&range=${timeRange}`)
      .then(r => r.json())
      .then(d => setTelemetry(Array.isArray(d.telemetry) ? d.telemetry : []))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, [user, timeRange]);

  // ── Aggregations ──────────────────────────────────────────────────────────
  const totalSolar = telemetry.reduce((s, t) => s + (t.solarGeneration || 0), 0);
  const totalGrid  = telemetry.reduce((s, t) => s + (t.gridImport || 0), 0);
  const totalExport = telemetry.reduce((s, t) => s + (t.gridExport || 0), 0);
  const totalCons  = telemetry.reduce((s, t) => s + (t.consumption || 0), 0);
  const solarPct   = totalCons > 0 ? ((totalSolar / totalCons) * 100).toFixed(1) : '0.0';
  const effScore   = Math.min(100, Math.round((totalSolar / Math.max(totalCons, 1)) * 100));
  const carbonSaved = (totalSolar * 0.82).toFixed(1);
  const moneySaved  = (totalSolar * 7.5).toFixed(0); // ₹7.5/kWh avg grid rate

  // ── Hourly (last 24) ──────────────────────────────────────────────────────
  const hourly = telemetry.slice(-24).map(t => ({
    label: new Date(t.timestamp).getHours() + 'h',
    solar: +(t.solarGeneration || 0).toFixed(2),
    consumption: +(t.consumption || 0).toFixed(2),
    battery: t.batteryStateOfCharge || 0,
  }));

  // ── Daily ─────────────────────────────────────────────────────────────────
  const dayNames = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  const dayMap = {};
  telemetry.forEach(t => {
    const d = dayNames[new Date(t.timestamp).getDay()];
    if (!dayMap[d]) dayMap[d] = { label: d, solar: 0, consumption: 0, grid: 0 };
    dayMap[d].solar += t.solarGeneration || 0;
    dayMap[d].consumption += t.consumption || 0;
    dayMap[d].grid += t.gridImport || 0;
  });
  const daily = Object.values(dayMap);

  // ── Monthly projection ────────────────────────────────────────────────────
  const months = ['Oct','Nov','Dec','Jan','Feb','Mar'];
  const monthlyProjection = months.map((m, i) => ({
    label: m,
    solar: Math.round(totalSolar * (0.7 + i * 0.06)),
    consumption: Math.round(totalCons * (0.75 + i * 0.04)),
  }));

  const chartData = view === 'hourly' ? hourly : view === 'daily' ? daily : monthlyProjection;

  const getAIInsights = async () => {
    setAiLoading(true);
    try {
      const reply = await groqChat({
        messages: [{ role: 'user', content: `Analyze my home energy data and give 3 specific tips to reduce costs:\n- Solar Generated: ${totalSolar.toFixed(1)} kWh\n- Total Consumed: ${totalCons.toFixed(1)} kWh\n- Grid Import: ${totalGrid.toFixed(1)} kWh\n- Grid Export: ${totalExport.toFixed(1)} kWh\n- Solar Coverage: ${solarPct}%\n- Efficiency Score: ${effScore}%\n- Carbon Saved: ${carbonSaved} kg\n- Money Saved: ₹${moneySaved}` }],
        mode: 'analytics',
      });
      setAiInsight(reply || 'No insights available.');
    } catch (err) { setAiInsight(`Error: ${err.message}`); }
    finally { setAiLoading(false); }
  };

  const exportCSV = () => {
    const rows = [
      ['EcoPower Energy Analytics Report'],
      ['Generated:', new Date().toLocaleString()],
      [''],
      ['Metric', 'Value'],
      ['Total Solar Generated', `${totalSolar.toFixed(1)} kWh`],
      ['Total Consumed', `${totalCons.toFixed(1)} kWh`],
      ['Grid Import', `${totalGrid.toFixed(1)} kWh`],
      ['Grid Export', `${totalExport.toFixed(1)} kWh`],
      ['Solar Coverage', `${solarPct}%`],
      ['Efficiency Score', `${effScore}%`],
      ['Carbon Saved', `${carbonSaved} kg CO2`],
      ['Money Saved', `₹${moneySaved}`],
    ];
    const a = document.createElement('a');
    a.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(rows.map(r => r.join(',')).join('\n'));
    a.download = `energy_analytics_${Date.now()}.csv`;
    a.click();
    showToast('Report downloaded');
  };

  if (loading) return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '1.25rem' }}>
      {[...Array(8)].map((_, i) => <div key={i} className="skeleton" style={{ height: i < 4 ? 110 : 220 }} />)}
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {toast && <div className="toast-enter" style={{ position: 'fixed', top: '1.5rem', right: '1.5rem', zIndex: 3000, padding: '0.875rem 1.5rem', borderRadius: 12, background: '#22C55E', color: '#fff', fontWeight: 700, boxShadow: '0 8px 24px rgba(0,0,0,0.2)', fontSize: '0.875rem' }}>{toast}</div>}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.875rem', fontWeight: 900, margin: 0, letterSpacing: '-0.03em' }}>Energy Analytics</h1>
          <p style={{ color: '#64748b', margin: '0.25rem 0 0 0', fontSize: '0.875rem' }}>Real-time insights from your solar & consumption data</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <div style={{ display: 'flex', gap: 3, background: '#F1F5F9', borderRadius: 10, padding: 3 }}>
            {['7d','30d','90d','1y'].map(r => (
              <button key={r} onClick={() => setTimeRange(r)} style={{ padding: '0.45rem 0.875rem', background: timeRange === r ? '#fff' : 'transparent', color: timeRange === r ? '#0F172A' : '#64748B', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 700, fontSize: '0.8rem', boxShadow: timeRange === r ? '0 1px 4px rgba(0,0,0,0.1)' : 'none', transition: 'all 0.15s' }}>{r.toUpperCase()}</button>
            ))}
          </div>
          <button onClick={getAIInsights} disabled={aiLoading} style={{ padding: '0.55rem 1.1rem', background: 'linear-gradient(135deg,#7C3AED,#6D28D9)', color: '#fff', border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: 700, fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: 6, opacity: aiLoading ? 0.7 : 1 }}>
            <Sparkles size={15} />{aiLoading ? 'Analyzing...' : 'AI Tips'}
          </button>
          <button onClick={fetchData} style={{ padding: '0.55rem 0.875rem', background: '#F1F5F9', border: '1px solid #E2E8F0', borderRadius: 10, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, color: '#374151' }}>
            <RefreshCw size={15} />
          </button>
          <button onClick={exportCSV} style={{ padding: '0.55rem 1.1rem', background: '#0F172A', color: '#fff', border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: 700, fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Download size={15} />Export
          </button>
        </div>
      </div>

      {/* AI Insight */}
      {aiInsight && (
        <div style={{ background: 'linear-gradient(135deg,#F5F3FF,#EDE9FE)', border: '1px solid #DDD6FE', borderRadius: 16, padding: '1.5rem' }} className="animate-fade-up">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg,#7C3AED,#6D28D9)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Sparkles size={16} color="#fff" />
            </div>
            <span style={{ fontWeight: 800, color: '#6D28D9', fontSize: '0.9rem' }}>AI Energy Tips — Groq LLaMA 3.3 70B</span>
          </div>
          <p style={{ margin: 0, color: '#374151', fontSize: '0.875rem', lineHeight: 1.75, whiteSpace: 'pre-wrap' }}>{aiInsight}</p>
        </div>
      )}

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '1.25rem' }} className="dashboard-grid-4">
        {[
          { title: 'Solar Generated', value: `${totalSolar.toFixed(1)} kWh`, sub: `${solarPct}% of consumption`, icon: Sun, color: '#FACC15', trend: '+12%', up: true },
          { title: 'Total Consumed',  value: `${totalCons.toFixed(1)} kWh`,  sub: `${totalGrid.toFixed(1)} kWh from grid`, icon: Zap, color: '#22C55E', trend: '-8%', up: false },
          { title: 'Carbon Saved',    value: `${carbonSaved} kg`,             sub: 'CO₂ avoided',                icon: Leaf,     color: '#10B981', trend: '+22%', up: true },
          { title: 'Money Saved',     value: `₹${Number(moneySaved).toLocaleString()}`, sub: 'vs full grid cost', icon: TrendingUp, color: '#8B5CF6', trend: '+15%', up: true },
        ].map((m, i) => (
          <div key={i} className="metric-tile stagger-item">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: `${m.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <m.icon size={22} color={m.color} />
              </div>
              <span style={{ fontSize: '0.72rem', fontWeight: 700, color: m.up ? '#16A34A' : '#DC2626', background: m.up ? '#F0FDF4' : '#FEF2F2', padding: '3px 8px', borderRadius: 20 }}>
                {m.trend}
              </span>
            </div>
            <div>
              <div style={{ color: '#64748B', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 4 }}>{m.title}</div>
              <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#0F172A', letterSpacing: '-0.03em', lineHeight: 1 }}>{m.value}</div>
              <div style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: 4 }}>{m.sub}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Main Chart + Efficiency Gauge */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
        <div className="glass-card" style={{ padding: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: 8 }}>
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: 800, margin: 0 }}>Energy Generation vs Consumption</h3>
              <p style={{ fontSize: '0.78rem', color: '#64748B', margin: '0.25rem 0 0 0' }}>Solar output vs actual usage</p>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <div style={{ display: 'flex', gap: 3, background: '#F1F5F9', borderRadius: 8, padding: 3 }}>
                {['hourly','daily','monthly'].map(v => (
                  <button key={v} onClick={() => setView(v)} style={{ padding: '0.35rem 0.75rem', background: view === v ? '#fff' : 'transparent', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600, fontSize: '0.75rem', color: view === v ? '#0F172A' : '#64748B', boxShadow: view === v ? '0 1px 3px rgba(0,0,0,0.1)' : 'none', textTransform: 'capitalize' }}>{v}</button>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 3, background: '#F1F5F9', borderRadius: 8, padding: 3 }}>
                {[['bar','Bar'],['line','Line']].map(([v,l]) => (
                  <button key={v} onClick={() => setChartType(v)} style={{ padding: '0.35rem 0.75rem', background: chartType === v ? '#fff' : 'transparent', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600, fontSize: '0.75rem', color: chartType === v ? '#0F172A' : '#64748B', boxShadow: chartType === v ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' }}>{l}</button>
                ))}
              </div>
            </div>
          </div>
          <EnergyChart data={chartData} type={chartType} height={220} />
        </div>

        <div className="glass-card" style={{ padding: '2rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 800, margin: '0 0 1.5rem 0' }}>Efficiency Score</h3>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
            <Gauge value={effScore} color={effScore > 70 ? '#22C55E' : effScore > 40 ? '#F59E0B' : '#EF4444'} size={160} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
            {[
              { label: 'Solar Coverage', value: `${solarPct}%`, color: '#FACC15', pct: Number(solarPct) },
              { label: 'Grid Export',    value: `${totalExport.toFixed(1)} kWh`, color: '#38BDF8', pct: totalSolar > 0 ? (totalExport/totalSolar)*100 : 0 },
              { label: 'Self-Sufficiency', value: `${Math.min(100, effScore)}%`, color: '#22C55E', pct: Math.min(100, effScore) },
            ].map(item => (
              <div key={item.label}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#374151' }}>{item.label}</span>
                  <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#0F172A' }}>{item.value}</span>
                </div>
                <div style={{ height: 6, background: '#F1F5F9', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ width: `${Math.min(100, item.pct)}%`, height: '100%', background: item.color, borderRadius: 3, transition: 'width 1s' }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Cost Analysis + 12-month projection */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        <div className="glass-card" style={{ padding: '2rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 800, margin: '0 0 1.5rem 0' }}>Cost Breakdown</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {[
              { label: 'Grid Cost (without solar)', value: `₹${(totalCons * 7.5).toFixed(0)}`, color: '#EF4444', sub: `${totalCons.toFixed(1)} kWh × ₹7.5` },
              { label: 'Actual Bill (with solar)',   value: `₹${(totalGrid * 7.5).toFixed(0)}`,  color: '#22C55E', sub: `${totalGrid.toFixed(1)} kWh × ₹7.5` },
              { label: 'Total Savings',              value: `₹${moneySaved}`,                    color: '#8B5CF6', sub: `${solarPct}% reduction` },
              { label: 'Grid Export Earnings',       value: `₹${(totalExport * 3.5).toFixed(0)}`, color: '#38BDF8', sub: `${totalExport.toFixed(1)} kWh × ₹3.5` },
            ].map((item, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.875rem 1rem', background: '#F8FAFC', borderRadius: 10, border: `1px solid ${item.color}20` }}>
                <div>
                  <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#374151' }}>{item.label}</div>
                  <div style={{ fontSize: '0.72rem', color: '#94A3B8', marginTop: 2 }}>{item.sub}</div>
                </div>
                <div style={{ fontSize: '1.1rem', fontWeight: 900, color: item.color }}>{item.value}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-card" style={{ padding: '2rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 800, margin: '0 0 1.5rem 0' }}>6-Month Projection</h3>
          <EnergyChart data={monthlyProjection} type="bar" height={200} />
          <div style={{ marginTop: '1rem', padding: '0.875rem', background: 'linear-gradient(135deg,#F0FDF4,#DCFCE7)', borderRadius: 10, border: '1px solid #BBF7D0' }}>
            <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#16A34A', marginBottom: 4 }}>Projected Annual Savings</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#16A34A' }}>₹{(Number(moneySaved) * 12).toLocaleString()}</div>
            <div style={{ fontSize: '0.72rem', color: '#4ADE80', marginTop: 2 }}>Based on current generation rate</div>
          </div>
        </div>
      </div>

      <AIAdvisor mode="consumer" context={`Solar: ${totalSolar.toFixed(1)} kWh, Consumed: ${totalCons.toFixed(1)} kWh, Efficiency: ${effScore}%, Savings: ₹${moneySaved}`} />
    </div>
  );
}
