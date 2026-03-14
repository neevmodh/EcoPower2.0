'use client';
import { useState, useEffect, useRef } from 'react';
import { CheckCircle2, Clock, Zap, TrendingUp, FileText, RefreshCw, ArrowUpRight, Download } from 'lucide-react';
import AIAdvisor from '@/components/AIAdvisor';

const STEPS = [
  { id: 1, label: 'Application Submitted',    date: '2026-01-15', done: true,  desc: 'Net-metering application submitted to DISCOM portal' },
  { id: 2, label: 'Technical Inspection',     date: '2026-01-22', done: true,  desc: 'DISCOM engineer inspected solar installation at site' },
  { id: 3, label: 'Meter Installation',       date: '2026-02-05', done: true,  desc: 'Bi-directional net meter installed by DISCOM team' },
  { id: 4, label: 'Grid Synchronization',     date: '2026-02-18', done: true,  desc: 'Solar system synchronized with DISCOM grid successfully' },
  { id: 5, label: 'Approval Certificate',     date: '2026-03-01', done: true,  desc: 'Net-metering approval certificate issued by DISCOM' },
  { id: 6, label: 'Billing Integration',      date: 'Pending',    done: false, desc: 'DISCOM billing sync for feed-in tariff credits pending' },
];

export default function DiscomIntegration() {
  const [gridData, setGridData] = useState({ export: 12.4, import: 2.1, voltage: 231.4, frequency: 49.98, pf: 0.97 });
  const [earnings] = useState({ today: 148.8, month: 3720, total: 18600 });
  // Rolling chart data: last 20 readings
  const [chartHistory, setChartHistory] = useState(() =>
    Array.from({ length: 20 }, (_, i) => ({ t: i, voltage: 231 + Math.random() * 2, frequency: 49.95 + Math.random() * 0.08, export: 10 + Math.random() * 4 }))
  );

  const handleDownloadCertificate = () => {
    const content = `EcoPower Net-Metering Certificate\n\nCertificate No: DISCOM/NM/2026/MH-4821\nValid Until: December 2028\nStatus: APPROVED\n\nInstallation Details:\n- Solar Capacity: 10 kW\n- Meter Type: Bi-directional\n- Grid Sync Date: 2026-02-18\n\nThis certificate confirms that the solar installation has been approved for net-metering by DISCOM.`;
    const blob = new Blob([content], { type: 'text/plain' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'NetMetering_Certificate_DISCOM.txt'; a.click();
  };

  useEffect(() => {
    const t = setInterval(() => {
      setGridData(g => {
        const next = {
          export:    +(Math.max(8, Math.min(18, g.export + (Math.random() - 0.5) * 0.5))).toFixed(1),
          import:    +(Math.max(0, Math.min(5, g.import + (Math.random() - 0.5) * 0.2))).toFixed(1),
          voltage:   +(Math.max(228, Math.min(235, g.voltage + (Math.random() - 0.5) * 0.3))).toFixed(1),
          frequency: +(Math.max(49.9, Math.min(50.1, g.frequency + (Math.random() - 0.5) * 0.02))).toFixed(2),
          pf:        +(Math.max(0.95, Math.min(1.0, g.pf + (Math.random() - 0.5) * 0.005))).toFixed(2),
        };
        setChartHistory(prev => [...prev.slice(-19), { t: Date.now(), voltage: parseFloat(next.voltage), frequency: parseFloat(next.frequency), export: parseFloat(next.export) }]);
        return next;
      });
    }, 2000);
    return () => clearInterval(t);
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 900, color: '#0F172A', margin: 0, letterSpacing: '-0.03em' }}>DISCOM Integration</h1>
          <p style={{ color: '#64748B', margin: '0.5rem 0 0 0', fontSize: '1rem' }}>Net-metering status, grid synchronization, and feed-in tariff earnings</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0.5rem 1.25rem', background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: '2rem' }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#22C55E', display: 'inline-block', animation: 'pulse-dot 2s infinite' }} />
          <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#16A34A' }}>Grid Connected</span>
        </div>
      </div>

      {/* Approval Status Banner */}
      <div style={{ padding: '1.5rem 2rem', background: 'linear-gradient(135deg,#F0FDF4,#ECFDF5)', border: '1px solid #BBF7D0', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 48, height: 48, background: '#22C55E', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 14px rgba(34,197,94,0.35)' }}>
            <CheckCircle2 size={26} color="#fff" />
          </div>
          <div>
            <div style={{ fontWeight: 800, color: '#0F172A', fontSize: '1.125rem' }}>Net-Metering Approved</div>
            <div style={{ fontSize: '0.875rem', color: '#64748B' }}>Certificate No: DISCOM/NM/2026/MH-4821 · Valid until Dec 2028</div>
          </div>
        </div>
        <button onClick={handleDownloadCertificate} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '0.625rem 1.25rem', background: '#fff', border: '1px solid #BBF7D0', borderRadius: 10, fontWeight: 600, fontSize: '0.875rem', color: '#16A34A', cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>
          <Download size={16} /> Download Certificate
        </button>
      </div>

      {/* Live Grid Metrics */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '1.25rem' }}>
          <h2 style={{ fontSize: '1.125rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>Live Grid Parameters</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '0.25rem 0.75rem', background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: '2rem' }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22C55E', display: 'inline-block', animation: 'pulse-dot 2s infinite' }} />
            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#16A34A' }}>LIVE</span>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: '1.25rem' }}>
          {[
            { label: 'Grid Export',  value: `${gridData.export} kW`,  color: '#22C55E', bg: '#F0FDF4', border: '#BBF7D0', icon: <ArrowUpRight size={20} /> },
            { label: 'Grid Import',  value: `${gridData.import} kW`,  color: '#38BDF8', bg: '#F0F9FF', border: '#BAE6FD', icon: <Zap size={20} /> },
            { label: 'Voltage',      value: `${gridData.voltage} V`,  color: '#FACC15', bg: '#FEFCE8', border: '#FEF08A', icon: <Zap size={20} /> },
            { label: 'Frequency',    value: `${gridData.frequency} Hz`, color: '#8B5CF6', bg: '#F5F3FF', border: '#DDD6FE', icon: <RefreshCw size={20} /> },
            { label: 'Power Factor', value: gridData.pf,               color: '#F97316', bg: '#FFF7ED', border: '#FED7AA', icon: <TrendingUp size={20} /> },
          ].map((m, i) => (
            <div key={i} className="metric-tile" style={{ padding: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                <span style={{ fontSize: '0.78rem', color: '#94A3B8', fontWeight: 600 }}>{m.label}</span>
                <div style={{ width: 34, height: 34, background: m.bg, border: `1px solid ${m.border}`, borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', color: m.color }}>{m.icon}</div>
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 900, color: m.color, letterSpacing: '-0.03em' }}>{m.value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Feed-in Tariff Earnings */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        <div className="glass-card" style={{ padding: '2rem' }}>
          <h3 style={{ fontSize: '1.125rem', fontWeight: 800, color: '#0F172A', marginBottom: '1.5rem' }}>Feed-in Tariff Earnings</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {[
              { label: 'Today\'s Earnings',  value: `₹${earnings.today}`,   sub: `${gridData.export} kW × ₹12/kWh`,  color: '#22C55E' },
              { label: 'This Month',         value: `₹${earnings.month.toLocaleString()}`,  sub: '310 kWh exported',              color: '#38BDF8' },
              { label: 'Total Earned',       value: `₹${earnings.total.toLocaleString()}`, sub: 'Since net-metering activation',  color: '#8B5CF6' },
            ].map((e, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.25rem', background: '#F8FAFC', borderRadius: 12, border: '1px solid #E2E8F0' }}>
                <div>
                  <div style={{ fontSize: '0.8rem', color: '#94A3B8', fontWeight: 600, marginBottom: 4 }}>{e.label}</div>
                  <div style={{ fontSize: '0.8rem', color: '#64748B' }}>{e.sub}</div>
                </div>
                <div style={{ fontSize: '1.5rem', fontWeight: 900, color: e.color }}>{e.value}</div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: '1.25rem', padding: '0.875rem 1.25rem', background: '#FEFCE8', border: '1px solid #FEF08A', borderRadius: 10, fontSize: '0.8125rem', color: '#92400E', fontWeight: 500 }}>
            ⚡ Feed-in tariff rate: ₹12/kWh · Credited to your next bill automatically
          </div>
        </div>

        <div className="glass-card" style={{ padding: '2rem' }}>
          <h3 style={{ fontSize: '1.125rem', fontWeight: 800, color: '#0F172A', marginBottom: '1.5rem' }}>Load Management</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {[
              { label: 'Peak Load Limit',    value: '10 kW',   status: 'Within Limit', ok: true },
              { label: 'Current Load',       value: `${gridData.import} kW`, status: 'Normal',       ok: true },
              { label: 'Grid Stability',     value: '99.8%',   status: 'Excellent',    ok: true },
              { label: 'Demand Response',    value: 'Active',  status: 'Enrolled',     ok: true },
              { label: 'Load Shedding Risk', value: 'Low',     status: 'Safe',         ok: true },
            ].map((r, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 1rem', background: '#F8FAFC', borderRadius: 10, border: '1px solid #E2E8F0' }}>
                <span style={{ fontSize: '0.875rem', color: '#374151', fontWeight: 500 }}>{r.label}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: '0.875rem', fontWeight: 700, color: '#0F172A' }}>{r.value}</span>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: r.ok ? '#16A34A' : '#DC2626', background: r.ok ? '#F0FDF4' : '#FEF2F2', padding: '2px 8px', borderRadius: 4 }}>{r.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Live Grid Chart */}
      <div className="glass-card" style={{ padding: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>Live Grid Parameters Chart</h3>
            <p style={{ color: '#64748b', margin: '0.3rem 0 0 0', fontSize: '0.85rem' }}>Voltage, frequency, and export — last 20 readings</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '0.25rem 0.75rem', background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: '2rem' }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22C55E', display: 'inline-block', animation: 'pulse-dot 2s infinite' }} />
            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#16A34A' }}>LIVE</span>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 140 }}>
          {chartHistory.map((pt, i) => {
            const vH = ((pt.voltage - 228) / 7) * 100;
            const fH = ((pt.frequency - 49.9) / 0.2) * 100;
            const eH = ((pt.export - 8) / 10) * 100;
            return (
              <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1, height: '100%', justifyContent: 'flex-end' }}>
                <div style={{ width: '100%', display: 'flex', gap: 1, justifyContent: 'flex-end', flexDirection: 'column' }}>
                  <div title={`Voltage: ${pt.voltage}V`} style={{ width: '100%', height: `${Math.max(vH, 3)}px`, background: '#FACC15', borderRadius: '2px 2px 0 0', opacity: 0.85 }} />
                  <div title={`Freq: ${pt.frequency}Hz`} style={{ width: '100%', height: `${Math.max(fH, 3)}px`, background: '#8B5CF6', borderRadius: '2px 2px 0 0', opacity: 0.85 }} />
                  <div title={`Export: ${pt.export}kW`} style={{ width: '100%', height: `${Math.max(eH, 3)}px`, background: '#22C55E', borderRadius: '2px 2px 0 0', opacity: 0.85 }} />
                </div>
              </div>
            );
          })}
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem', marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #e2e8f0' }}>
          {[['#FACC15','Voltage (V)'],['#8B5CF6','Frequency (Hz)'],['#22C55E','Export (kW)']].map(([c, l]) => (
            <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 12, height: 12, borderRadius: 3, background: c }} />
              <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#374151' }}>{l}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Approval Workflow Timeline */}
      <div className="glass-card" style={{ padding: '2rem' }}>
        <h3 style={{ fontSize: '1.125rem', fontWeight: 800, color: '#0F172A', marginBottom: '2rem' }}>Net-Metering Approval Workflow</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {STEPS.map((step, i) => (
            <div key={i} style={{ display: 'flex', gap: '1.5rem', paddingBottom: i < STEPS.length - 1 ? '1.75rem' : 0, position: 'relative' }}>
              {i < STEPS.length - 1 && (
                <div style={{ position: 'absolute', left: 19, top: 40, bottom: 0, width: 2, background: step.done ? '#BBF7D0' : '#E2E8F0' }} />
              )}
              <div style={{ width: 40, height: 40, borderRadius: '50%', background: step.done ? '#22C55E' : '#F1F5F9', border: `2px solid ${step.done ? '#22C55E' : '#E2E8F0'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, zIndex: 1 }}>
                {step.done ? <CheckCircle2 size={20} color="#fff" /> : <Clock size={18} color="#94A3B8" />}
              </div>
              <div style={{ flex: 1, paddingTop: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                  <span style={{ fontWeight: 700, color: step.done ? '#0F172A' : '#94A3B8', fontSize: '0.9375rem' }}>{step.label}</span>
                  <span style={{ fontSize: '0.75rem', color: step.done ? '#22C55E' : '#94A3B8', fontWeight: 600 }}>{step.date}</span>
                </div>
                <p style={{ fontSize: '0.85rem', color: '#64748B', margin: 0 }}>{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
      <AIAdvisor mode="consumer" />
    </div>
  );
}
