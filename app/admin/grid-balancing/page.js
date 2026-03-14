'use client';
import { useEffect, useState, useRef } from 'react';
import { Activity, Zap, TrendingUp, TrendingDown, AlertTriangle, CheckCircle, RefreshCw, Sparkles } from 'lucide-react';
import AIAdvisor from '@/components/AIAdvisor';
import { groqChat, groqGridRec } from '@/lib/groqClient';

const INITIAL_GRID = {
  realtime: { totalLoad: 2450, totalGeneration: 2380, gridImport: 70, frequency: 50.02, voltage: 415, powerFactor: 0.98, status: 'Stable' },
  zones: [
    { id: 1, name: 'Satellite Zone', load: 650, generation: 580, balance: -70, status: 'Deficit', action: 'Import' },
    { id: 2, name: 'Vastrapur Zone', load: 520, generation: 620, balance: 100, status: 'Surplus', action: 'Export' },
    { id: 3, name: 'Bodakdev Zone', load: 680, generation: 650, balance: -30, status: 'Deficit', action: 'Import' },
    { id: 4, name: 'Navrangpura Zone', load: 600, generation: 530, balance: -70, status: 'Deficit', action: 'Import' }
  ],
  recommendations: [
    { id: 1, priority: 'High', action: 'Shift 50 kW from Vastrapur to Satellite', impact: 'Reduce grid import by 50 kW', savings: '₹360/hour', implemented: false },
    { id: 2, priority: 'Medium', action: 'Activate battery discharge in Bodakdev', impact: 'Cover 30 kW deficit locally', savings: '₹216/hour', implemented: false },
    { id: 3, priority: 'Medium', action: 'Schedule EV charging in Vastrapur during surplus', impact: 'Utilize 40 kW excess solar', savings: '₹288/hour', implemented: false },
    { id: 4, priority: 'Low', action: 'Pre-cool buildings in high-load zones', impact: 'Shift 20 kW to off-peak', savings: '₹144/hour', implemented: false }
  ],
  history: [
    { time: '10:00', load: 2200, generation: 2150, balance: -50, action: 'Grid Import' },
    { time: '10:15', load: 2300, generation: 2280, balance: -20, action: 'Battery Discharge' },
    { time: '10:30', load: 2400, generation: 2350, balance: -50, action: 'Load Shift' },
    { time: '10:45', load: 2450, generation: 2380, balance: -70, action: 'Grid Import' }
  ]
};

export default function SmartGridBalancing() {
  const [grid, setGrid] = useState(INITIAL_GRID);
  const [implementing, setImplementing] = useState({});
  const [zoneAction, setZoneAction] = useState({});
  const [aiRecs, setAiRecs] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [liveMode, setLiveMode] = useState(true);
  const intervalRef = useRef(null);

  const showToast = (msg, type = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000); };

  // Live grid simulation
  useEffect(() => {
    if (liveMode) {
      intervalRef.current = setInterval(() => {
        setGrid(prev => ({
          ...prev,
          realtime: {
            ...prev.realtime,
            totalLoad: prev.realtime.totalLoad + Math.floor((Math.random() - 0.5) * 40),
            totalGeneration: prev.realtime.totalGeneration + Math.floor((Math.random() - 0.5) * 30),
            frequency: (50 + (Math.random() - 0.5) * 0.1).toFixed(2),
            gridImport: Math.max(0, prev.realtime.gridImport + Math.floor((Math.random() - 0.5) * 20)),
          }
        }));
      }, 3000);
    }
    return () => clearInterval(intervalRef.current);
  }, [liveMode]);

  const implementRecommendation = async (rec) => {
    setImplementing(prev => ({ ...prev, [rec.id]: true }));
    try {
      await groqGridRec({ ...grid.realtime, recommendation: rec.action });
      await new Promise(r => setTimeout(r, 1200));
      setGrid(prev => ({
        ...prev,
        recommendations: prev.recommendations.map(r => r.id === rec.id ? { ...r, implemented: true } : r),
        history: [...prev.history.slice(-9), { time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }), load: prev.realtime.totalLoad, generation: prev.realtime.totalGeneration, balance: prev.realtime.totalGeneration - prev.realtime.totalLoad, action: rec.action.slice(0, 20) }]
      }));
      showToast(`Implemented: ${rec.action.slice(0, 40)}...`);
    } catch { showToast('Failed to implement recommendation', 'error'); } finally { setImplementing(prev => ({ ...prev, [rec.id]: false })); }
  };

  const handleZoneAction = async (zone) => {
    setZoneAction(prev => ({ ...prev, [zone.id]: true }));
    try {
      await new Promise(r => setTimeout(r, 800));
      const actionLabel = zone.status === 'Surplus' ? 'Export Energy' : 'Request Import';
      setGrid(prev => ({
        ...prev,
        zones: prev.zones.map(z => z.id === zone.id ? { ...z, balance: z.status === 'Surplus' ? z.balance - 20 : z.balance + 20 } : z),
        history: [...prev.history.slice(-9), { time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }), load: prev.realtime.totalLoad, generation: prev.realtime.totalGeneration, balance: prev.realtime.totalGeneration - prev.realtime.totalLoad, action: `${actionLabel}: ${zone.name}` }]
      }));
      showToast(`${zone.status === 'Surplus' ? 'Energy export' : 'Import request'} initiated for ${zone.name}`);
    } catch { showToast('Zone action failed', 'error'); } finally { setZoneAction(prev => ({ ...prev, [zone.id]: false })); }
  };

  const getAIRecommendations = async () => {
    setAiLoading(true);
    try {
      const recs = await groqGridRec({ ...grid.realtime, zones: grid.zones });
      setAiRecs(recs || 'No recommendations available.');
    } catch (err) { setAiRecs(`Error: ${err.message}`); } finally { setAiLoading(false); }
  };

  const balancePct = ((grid.realtime.totalGeneration / Math.max(grid.realtime.totalLoad, 1)) * 100).toFixed(1);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', fontFamily: 'Inter, sans-serif' }}>
      {toast && <div style={{ position: 'fixed', top: '1.5rem', right: '1.5rem', zIndex: 3000, padding: '0.875rem 1.5rem', borderRadius: 12, background: toast.type === 'error' ? '#EF4444' : '#22C55E', color: '#fff', fontWeight: 600, boxShadow: '0 8px 24px rgba(0,0,0,0.15)', fontSize: '0.875rem' }}>{toast.msg}</div>}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>Smart Grid Load Balancing</h1>
          <p style={{ color: '#64748B', margin: '0.25rem 0 0 0', fontSize: '0.9rem' }}>AI-powered real-time grid optimization</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={getAIRecommendations} disabled={aiLoading} style={{ padding: '0.6rem 1.2rem', background: '#7C3AED', color: '#fff', border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: 700, fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: 6 }}><Sparkles size={16} />{aiLoading ? 'Analyzing...' : 'Get AI Recs'}</button>
          <button onClick={() => setLiveMode(!liveMode)} style={{ padding: '0.6rem 1.2rem', background: liveMode ? '#DCFCE7' : '#F1F5F9', color: liveMode ? '#16A34A' : '#374151', border: `1.5px solid ${liveMode ? '#BBF7D0' : '#E2E8F0'}`, borderRadius: 10, cursor: 'pointer', fontWeight: 700, fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: liveMode ? '#22C55E' : '#94A3B8' }} />{liveMode ? 'Live' : 'Paused'}
          </button>
        </div>
      </div>

      {/* Real-time Status */}
      <div style={{ background: 'linear-gradient(135deg,#1E3A5F,#0F172A)', borderRadius: 20, padding: '2rem', color: '#fff' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <div>
            <div style={{ fontSize: '0.875rem', color: '#94A3B8', marginBottom: 4 }}>GRID STATUS</div>
            <div style={{ fontSize: '2.5rem', fontWeight: 900 }}>{grid.realtime.status}</div>
          </div>
          <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Activity size={36} /></div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
          {[['Total Load', `${grid.realtime.totalLoad} kW`], ['Generation', `${grid.realtime.totalGeneration} kW`], ['Grid Import', `${grid.realtime.gridImport} kW`], ['Frequency', `${grid.realtime.frequency} Hz`], ['Voltage', `${grid.realtime.voltage} V`], ['Power Factor', grid.realtime.powerFactor]].map(([label, value]) => (
            <div key={label} style={{ padding: '1rem', background: 'rgba(255,255,255,0.1)', borderRadius: 12 }}>
              <div style={{ fontSize: '0.75rem', color: '#94A3B8', marginBottom: 4 }}>{label}</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 800 }}>{value}</div>
            </div>
          ))}
        </div>
        <div style={{ padding: '1.25rem', background: 'rgba(255,255,255,0.1)', borderRadius: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}><span>Grid Balance</span><span style={{ fontWeight: 900 }}>{balancePct}%</span></div>
          <div style={{ height: 10, background: 'rgba(255,255,255,0.2)', borderRadius: 5, overflow: 'hidden' }}>
            <div style={{ width: `${Math.min(balancePct, 100)}%`, height: '100%', background: parseFloat(balancePct) >= 95 ? '#22C55E' : '#F59E0B', borderRadius: 5, transition: 'width 0.5s' }} />
          </div>
        </div>
      </div>

      {/* AI Recommendations Panel */}
      {aiRecs && (
        <div style={{ background: 'linear-gradient(135deg,#F5F3FF,#EDE9FE)', border: '1px solid #DDD6FE', borderRadius: 14, padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}><Sparkles size={18} color="#7C3AED" /><span style={{ fontWeight: 700, color: '#7C3AED' }}>AI Grid Optimization Recommendations</span></div>
          <p style={{ margin: 0, color: '#374151', fontSize: '0.875rem', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{aiRecs}</p>
        </div>
      )}

      {/* Zone Distribution */}
      <div style={{ background: '#fff', padding: '2rem', borderRadius: 16, border: '1px solid #E2E8F0' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: '0 0 1.5rem 0', color: '#0F172A' }}>Zone-wise Load Distribution</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.5rem' }}>
          {grid.zones.map(zone => (
            <div key={zone.id} style={{ padding: '1.5rem', background: '#F8FAFC', border: `2px solid ${zone.status === 'Surplus' ? '#22C55E' : '#EF4444'}`, borderRadius: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
                <div>
                  <div style={{ fontWeight: 800, fontSize: '1rem', color: '#0F172A', marginBottom: 2 }}>{zone.name}</div>
                  <div style={{ fontSize: '0.8rem', color: '#64748B' }}>Action: {zone.action}</div>
                </div>
                <span style={{ padding: '0.3rem 0.8rem', borderRadius: 20, fontSize: '0.75rem', fontWeight: 700, background: zone.status === 'Surplus' ? '#DCFCE7' : '#FEE2E2', color: zone.status === 'Surplus' ? '#16A34A' : '#EF4444' }}>{zone.status}</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.25rem' }}>
                {[['Load', zone.load, '#EF4444'], ['Generation', zone.generation, '#22C55E'], ['Balance', Math.abs(zone.balance), zone.balance >= 0 ? '#22C55E' : '#EF4444']].map(([label, val, color]) => (
                  <div key={label}>
                    <div style={{ fontSize: '0.8rem', color: '#64748B', marginBottom: 2 }}>{label}</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 900, color, display: 'flex', alignItems: 'center', gap: 4 }}>
                      {label === 'Balance' && (zone.balance >= 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />)}{val}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: '#94A3B8' }}>kW</div>
                  </div>
                ))}
              </div>
              <button onClick={() => handleZoneAction(zone)} disabled={zoneAction[zone.id]} style={{ width: '100%', padding: '0.75rem', background: zoneAction[zone.id] ? '#E2E8F0' : zone.status === 'Surplus' ? 'linear-gradient(135deg,#22C55E,#16A34A)' : 'linear-gradient(135deg,#EF4444,#DC2626)', color: '#fff', border: 'none', borderRadius: 10, fontWeight: 700, cursor: zoneAction[zone.id] ? 'not-allowed' : 'pointer', fontSize: '0.875rem' }}>
                {zoneAction[zone.id] ? 'Processing...' : zone.status === 'Surplus' ? '⚡ Export Energy' : '📥 Request Import'}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Recommendations */}
      <div style={{ background: '#fff', padding: '2rem', borderRadius: 16, border: '1px solid #E2E8F0' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: '0 0 1.5rem 0', color: '#0F172A' }}>AI Load Balancing Recommendations</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {grid.recommendations.map(rec => (
            <div key={rec.id} style={{ padding: '1.5rem', background: rec.implemented ? '#F0FDF4' : '#F8FAFC', border: `2px solid ${rec.implemented ? '#BBF7D0' : rec.priority === 'High' ? '#FECACA' : rec.priority === 'Medium' ? '#FDE68A' : '#E2E8F0'}`, borderRadius: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  {rec.implemented ? <CheckCircle size={20} color="#22C55E" /> : <AlertTriangle size={20} color={rec.priority === 'High' ? '#EF4444' : '#F59E0B'} />}
                  <span style={{ padding: '0.2rem 0.7rem', borderRadius: 20, fontSize: '0.7rem', fontWeight: 700, background: rec.priority === 'High' ? '#FEE2E2' : rec.priority === 'Medium' ? '#FEF3C7' : '#DCFCE7', color: rec.priority === 'High' ? '#EF4444' : rec.priority === 'Medium' ? '#D97706' : '#16A34A' }}>{rec.priority} Priority</span>
                  {rec.implemented && <span style={{ fontSize: '0.75rem', color: '#16A34A', fontWeight: 700 }}>✓ Implemented</span>}
                </div>
                <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#0F172A', marginBottom: 4 }}>{rec.action}</div>
                <div style={{ fontSize: '0.85rem', color: '#64748B', marginBottom: 2 }}>Impact: {rec.impact}</div>
                <div style={{ fontSize: '0.85rem', color: '#22C55E', fontWeight: 700 }}>Savings: {rec.savings}</div>
              </div>
              {!rec.implemented && (
                <button onClick={() => implementRecommendation(rec)} disabled={implementing[rec.id]} style={{ padding: '0.75rem 1.5rem', background: implementing[rec.id] ? '#E2E8F0' : 'linear-gradient(135deg,#3B82F6,#2563EB)', color: '#fff', border: 'none', borderRadius: 10, fontWeight: 700, cursor: implementing[rec.id] ? 'not-allowed' : 'pointer', fontSize: '0.875rem', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 6 }}>
                  {implementing[rec.id] ? <><RefreshCw size={14} />Implementing...</> : '⚡ Implement'}
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* History */}
      <div style={{ background: '#fff', padding: '2rem', borderRadius: 16, border: '1px solid #E2E8F0' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: '0 0 1.5rem 0', color: '#0F172A' }}>Load Balancing History</h3>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '1.5rem', height: 200, padding: '1rem', background: '#F8FAFC', borderRadius: 12 }}>
          {grid.history.map((point, i) => {
            const maxVal = Math.max(...grid.history.map(p => Math.max(p.load, p.generation)));
            return (
              <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 700, color: point.balance >= 0 ? '#22C55E' : '#EF4444' }}>{point.balance >= 0 ? '+' : ''}{point.balance} kW</div>
                <div style={{ display: 'flex', gap: 4, alignItems: 'flex-end', height: '100%' }}>
                  <div style={{ width: 24, height: `${(point.load / maxVal) * 100}%`, background: 'linear-gradient(to top,#EF4444,#F87171)', borderRadius: '4px 4px 0 0', minHeight: 16 }} />
                  <div style={{ width: 24, height: `${(point.generation / maxVal) * 100}%`, background: 'linear-gradient(to top,#22C55E,#4ADE80)', borderRadius: '4px 4px 0 0', minHeight: 16 }} />
                </div>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#374151' }}>{point.time}</div>
                <div style={{ fontSize: '0.65rem', color: '#94A3B8', textAlign: 'center', maxWidth: 60, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{point.action}</div>
              </div>
            );
          })}
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem', marginTop: '1rem' }}>
          {[['Load', '#EF4444'], ['Generation', '#22C55E']].map(([label, color]) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 14, height: 14, background: color, borderRadius: 3 }} />
              <span style={{ fontSize: '0.85rem', color: '#64748B' }}>{label}</span>
            </div>
          ))}
        </div>
      </div>

      <AIAdvisor mode="grid" title="Grid Optimization AI" context={`Grid: ${grid.realtime.totalLoad} kW load, ${grid.realtime.totalGeneration} kW generation, ${grid.realtime.gridImport} kW import, Status: ${grid.realtime.status}`} />
    </div>
  );
}
