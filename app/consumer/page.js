'use client';
import { useEffect, useState, useCallback } from 'react';
import { Sun, Battery, Activity, Banknote, Leaf, Zap, TrendingUp, TrendingDown, RefreshCw, Cpu } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import AIAdvisor from '@/components/AIAdvisor';
import Modal from '@/components/Modal';

export default function ConsumerDashboard() {
  const { user } = useAuth();
  const [telemetry, setTelemetry] = useState([]);
  const [carbon, setCarbon] = useState({ total_carbon_saved_kg: 0, total_trees_equivalent: 0 });
  const [invoices, setInvoices] = useState([]);
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('energy');
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [reportModal, setReportModal] = useState(false);

  const fetchAll = useCallback(async () => {
    if (!user?.userId) return;
    try {
      const [teleRes, carbonRes, invRes, devRes] = await Promise.all([
        fetch(`/api/telemetry/dashboard?userId=${user.userId}&role=${user.role}`),
        fetch(`/api/carbon?userId=${user.userId}&role=${user.role}`),
        fetch(`/api/invoices?userId=${user.userId}&role=${user.role}`),
        fetch(`/api/devices?userId=${user.userId}&role=${user.role}`),
      ]);
      const [teleData, carbonData, invData, devData] = await Promise.all([
        teleRes.json(), carbonRes.json(), invRes.json(), devRes.json()
      ]);
      setTelemetry(Array.isArray(teleData.telemetry) ? teleData.telemetry : []);
      setCarbon(carbonData || { total_carbon_saved_kg: 0, total_trees_equivalent: 0 });
      setInvoices(Array.isArray(invData) ? invData : []);
      setDevices(Array.isArray(devData) ? devData : []);
      setLastRefresh(new Date());
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, [user]);

  useEffect(() => { fetchAll(); }, [fetchAll]);
  useEffect(() => {
    const interval = setInterval(fetchAll, 30000);
    return () => clearInterval(interval);
  }, [fetchAll]);

  if (loading) return <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>Loading dashboard...</div>;

  const latest = telemetry.length > 0 ? telemetry[telemetry.length - 1] : {};
  const currentSoc = Math.round(latest.batteryStateOfCharge ?? 72);
  const currentSolar = latest.solarGeneration ?? 0;
  const currentConsumption = latest.consumption ?? 0;
  const totalGen = telemetry.reduce((s, t) => s + (t.solarGeneration || 0), 0);
  const totalCons = telemetry.reduce((s, t) => s + (t.consumption || 0), 0);
  const totalGrid = telemetry.reduce((s, t) => s + (t.gridImport || 0), 0);
  const savings = (totalGen * 8).toFixed(0);
  const solarPct = totalCons > 0 ? ((totalGen / totalCons) * 100).toFixed(1) : '0.0';

  // Hourly chart data from last 24 readings
  const hourly = telemetry.slice(-24).map((t, i) => ({
    hour: new Date(t.timestamp).getHours() + ':00',
    solar: t.solarGeneration || 0,
    consumption: t.consumption || 0,
    battery: t.batteryStateOfCharge || 0,
  }));
  const maxHourly = Math.max(...hourly.map(h => Math.max(h.solar, h.consumption)), 1);

  const pendingInvoices = invoices.filter(i => i.status !== 'Paid');
  const totalPaid = invoices.filter(i => i.status === 'Paid').reduce((s, i) => s + (i.totalAmount || 0), 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', padding: '1rem 0' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 style={{ fontSize: '2.25rem', fontWeight: 900, margin: 0, letterSpacing: '-0.03em' }}>Welcome back, {user.name?.split(' ')[0]}</h1>
          <p style={{ color: 'var(--text-muted)', margin: '0.4rem 0 0 0' }}>
            Last updated: {lastRefresh.toLocaleTimeString()} · Auto-refreshes every 30s
          </p>
        </div>
        <button onClick={fetchAll} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '0.6rem 1.2rem', background: 'white', border: '1.5px solid var(--border-medium)', borderRadius: 10, fontWeight: 600, cursor: 'pointer', color: '#475569', fontSize: '0.875rem' }}>
          <RefreshCw size={15} /> Refresh
        </button>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem' }}>
        <KpiCard title="Solar Generated" value={`${totalGen.toFixed(1)} kWh`} sub={`Now: ${currentSolar.toFixed(2)} kW`} icon={Sun} color="#f59e0b" trend="+12%" up />
        <KpiCard title="Total Consumed" value={`${totalCons.toFixed(1)} kWh`} sub={`Now: ${currentConsumption.toFixed(2)} kW`} icon={Activity} color="#3b82f6" trend="-5%" />
        <KpiCard title="Battery Level" value={`${currentSoc}%`} sub={currentSoc > 50 ? 'Healthy' : 'Low — consider charging'} icon={Battery} color={currentSoc > 50 ? '#10b981' : '#ef4444'} />
        <KpiCard title="Savings" value={`₹${savings}`} sub={`Solar share: ${solarPct}%`} icon={Banknote} color="#10b981" trend="+₹450" up />
      </div>

      {/* PAYG Quick Start Banner */}
      {!invoices.some(i => i.status === 'Paid') && (
        <div style={{ padding: '1.25rem 1.75rem', background: 'linear-gradient(135deg, #4C1D95, #6D28D9)', borderRadius: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'white' }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: '1rem', marginBottom: 4 }}>⚡ Try Pay As You Use</div>
            <div style={{ fontSize: '0.82rem', opacity: 0.85 }}>No fixed fee. Pay only ₹6.5/kWh for what you consume. No lock-in.</div>
          </div>
          <a href="/consumer/subscription?plan=payg" style={{ padding: '0.65rem 1.5rem', background: 'white', color: '#6D28D9', borderRadius: 10, fontWeight: 800, fontSize: '0.875rem', textDecoration: 'none', whiteSpace: 'nowrap', flexShrink: 0 }}>
            Activate PAYG →
          </a>
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', background: 'rgba(226,232,240,0.5)', borderRadius: 12, padding: '0.35rem', alignSelf: 'flex-start' }}>
        {[['energy','Energy Flow'],['hourly','Hourly Chart'],['devices','Devices'],['sustainability','Impact'],['billing','Billing']].map(([id, label]) => (
          <button key={id} onClick={() => setActiveTab(id)}
            style={{ padding: '0.5rem 1.1rem', borderRadius: 8, border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.875rem', background: activeTab === id ? '#22C55E' : 'transparent', color: activeTab === id ? 'white' : '#64748b', transition: 'all 0.15s' }}>
            {label}
          </button>
        ))}
      </div>

      {/* Energy Flow Tab */}
      {activeTab === 'energy' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: '1.5rem' }}>
          <div className="glass-card" style={{ padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0 }}>Live Energy Flow</h3>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8rem', color: '#22C55E', fontWeight: 700 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#22C55E', display: 'inline-block', animation: 'pulse 2s infinite' }} /> LIVE
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-around', gap: '1rem' }}>
              <FlowNode icon={Sun} label="SOLAR" value={`${currentSolar.toFixed(2)} kW`} color="#f59e0b" />
              <FlowArrow color="#f59e0b" />
              <FlowNode icon={Cpu} label="INVERTER" value="Active" color="#6366f1" size={110} />
              <FlowArrow color="#3b82f6" reverse />
              <BatteryNode soc={currentSoc} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '2rem' }}>
              <FlowArrow color="#10b981" vertical />
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '0.5rem' }}>
              <FlowNode icon={Zap} label="HOME" value={`${currentConsumption.toFixed(2)} kW`} color="#10b981" />
            </div>
          </div>

          <div className="glass-card" style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>Live Metrics</h3>
            {[
              { label: 'Grid Import', value: `${(latest.gridImport || 0).toFixed(2)} kW`, color: '#ef4444' },
              { label: 'Grid Export', value: `${(latest.gridExport || 0).toFixed(2)} kW`, color: '#10b981' },
              { label: 'Battery SoC', value: `${currentSoc}%`, color: '#3b82f6' },
              { label: 'Solar Efficiency', value: `${solarPct}%`, color: '#f59e0b' },
              { label: 'Net Savings Today', value: `₹${(currentSolar * 8).toFixed(0)}`, color: '#10b981' },
            ].map((m, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.875rem 1rem', background: '#f8fafc', borderRadius: 10, border: '1px solid #e2e8f0' }}>
                <span style={{ fontSize: '0.875rem', color: '#64748b', fontWeight: 600 }}>{m.label}</span>
                <span style={{ fontSize: '1.1rem', fontWeight: 800, color: m.color }}>{m.value}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Hourly Chart Tab */}
      {activeTab === 'hourly' && (
        <div className="glass-card" style={{ padding: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>24-Hour Energy Chart</h3>
              <p style={{ color: '#64748b', margin: '0.4rem 0 0 0', fontSize: '0.875rem' }}>Real telemetry — solar vs consumption per hour</p>
            </div>
          </div>
          {hourly.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>No hourly data available</div>
          ) : (
            <>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: '4px', height: '240px', padding: '0 0.5rem' }}>
                {hourly.map((h, i) => (
                  <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, height: '100%', justifyContent: 'flex-end' }}>
                    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 1, justifyContent: 'flex-end' }}>
                      <div title={`Solar: ${h.solar.toFixed(1)}`} style={{ width: '100%', height: `${Math.max((h.solar / maxHourly) * 180, 3)}px`, background: 'linear-gradient(to top, #f59e0b, #fbbf24)', borderRadius: '3px 3px 0 0', minHeight: 3 }} />
                      <div title={`Consumption: ${h.consumption.toFixed(1)}`} style={{ width: '100%', height: `${Math.max((h.consumption / maxHourly) * 180, 3)}px`, background: 'linear-gradient(to top, #3b82f6, #60a5fa)', borderRadius: '0 0 3px 3px', minHeight: 3 }} />
                    </div>
                    {i % 4 === 0 && <div style={{ fontSize: '0.6rem', color: '#94a3b8', marginTop: 4, whiteSpace: 'nowrap' }}>{h.hour}</div>}
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem', marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid #e2e8f0' }}>
                <Legend color="#f59e0b" label="Solar Generated" />
                <Legend color="#3b82f6" label="Consumption" />
              </div>
            </>
          )}
        </div>
      )}

      {/* Devices Tab */}
      {activeTab === 'devices' && (
        <div className="glass-card" style={{ padding: '2rem' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.5rem' }}>Connected Devices</h3>
          {devices.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>No devices found</div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.25rem' }}>
              {devices.map((d, i) => (
                <div key={i} style={{ padding: '1.5rem', background: '#f8fafc', borderRadius: 12, border: `2px solid ${d.status === 'active' ? '#bbf7d0' : '#fecaca'}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                    <div style={{ width: 44, height: 44, borderRadius: 10, background: d.status === 'active' ? '#dcfce7' : '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Cpu size={22} color={d.status === 'active' ? '#16a34a' : '#dc2626'} />
                    </div>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: d.status === 'active' ? '#dcfce7' : '#fee2e2', color: d.status === 'active' ? '#16a34a' : '#dc2626' }}>
                      {d.status?.toUpperCase()}
                    </span>
                  </div>
                  <div style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: 4 }}>{d.device_type || 'Device'}</div>
                  <div style={{ fontSize: '0.78rem', color: '#64748b', fontFamily: 'monospace' }}>{d.device_serial}</div>
                  <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: 4 }}>FW: {d.firmware_version || 'N/A'}</div>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: 4 }}>
                    Last seen: {d.last_seen ? new Date(d.last_seen).toLocaleDateString() : 'Unknown'}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Sustainability Tab */}
      {activeTab === 'sustainability' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem' }}>
            <ImpactCard label="CO₂ Prevented" value={carbon.total_carbon_saved_kg?.toFixed(1)} unit="kg" color="#10b981" desc="Carbon emissions avoided by your solar system" />
            <ImpactCard label="Trees Equivalent" value={carbon.total_trees_equivalent} unit="trees" color="#22C55E" desc="Equivalent carbon absorption of a small forest" />
            <ImpactCard label="Solar Share" value={solarPct} unit="%" color="#3b82f6" desc="Percentage of consumption from renewable sources" />
          </div>
          <div className="glass-card" style={{ padding: '2rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1.5rem' }}>Sustainability Progress</h3>
            {[
              { label: 'Carbon Reduction Goal', current: Math.min(carbon.total_carbon_saved_kg, 500), max: 500, color: '#10b981' },
              { label: 'Solar Self-Sufficiency', current: parseFloat(solarPct), max: 100, color: '#f59e0b' },
              { label: 'Green Energy Streak', current: 18, max: 30, color: '#6366f1', suffix: ' days' },
            ].map((p, i) => (
              <div key={i} style={{ marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#374151' }}>{p.label}</span>
                  <span style={{ fontSize: '0.875rem', fontWeight: 700, color: p.color }}>{p.current.toFixed(0)}{p.suffix || ''} / {p.max}{p.suffix || ''}</span>
                </div>
                <div style={{ height: 10, background: '#e2e8f0', borderRadius: 5, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${Math.min((p.current / p.max) * 100, 100)}%`, background: p.color, borderRadius: 5, transition: 'width 1s ease' }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Billing Tab */}
      {activeTab === 'billing' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '1.5rem' }}>
          <div className="glass-card" style={{ padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0 }}>Invoice History</h3>
              <span style={{ fontSize: '0.8rem', color: '#64748b' }}>{invoices.length} invoices</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
              {invoices.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>No invoices found</div>
              ) : invoices.slice(0, 8).map(inv => (
                <div key={inv.invoiceId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.25rem', background: '#f8fafc', borderRadius: 10, border: '1px solid #e2e8f0' }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{inv.billingPeriod || 'Invoice'}</div>
                    <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Due: {inv.dueDate ? new Date(inv.dueDate).toLocaleDateString() : 'N/A'}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 800 }}>₹{(inv.totalAmount || 0).toLocaleString()}</div>
                    <div style={{ fontSize: '0.7rem', fontWeight: 700, color: inv.status === 'Paid' ? '#16a34a' : '#d97706' }}>{inv.status?.toUpperCase()}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div className="glass-card" style={{ padding: '1.75rem', background: 'linear-gradient(135deg, #10b981, #059669)', color: 'white' }}>
              <div style={{ fontSize: '0.85rem', opacity: 0.85, marginBottom: 6 }}>Total Paid (All Time)</div>
              <div style={{ fontSize: '2.5rem', fontWeight: 900 }}>₹{totalPaid.toLocaleString()}</div>
              <div style={{ fontSize: '0.8rem', opacity: 0.8, marginTop: 6 }}>{invoices.filter(i => i.status === 'Paid').length} invoices paid</div>
            </div>
            <div className="glass-card" style={{ padding: '1.75rem', background: pendingInvoices.length > 0 ? '#fff7ed' : '#f0fdf4', border: `1px solid ${pendingInvoices.length > 0 ? '#fed7aa' : '#bbf7d0'}` }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#64748b', marginBottom: 6 }}>Pending Amount</div>
              <div style={{ fontSize: '2rem', fontWeight: 900, color: pendingInvoices.length > 0 ? '#d97706' : '#16a34a' }}>
                ₹{pendingInvoices.reduce((s, i) => s + (i.totalAmount || 0), 0).toLocaleString()}
              </div>
              <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: 6 }}>{pendingInvoices.length} pending invoices</div>
            </div>
            <button onClick={() => setReportModal(true)} style={{ padding: '1rem', background: '#1e293b', color: 'white', border: 'none', borderRadius: 12, fontWeight: 700, cursor: 'pointer', fontSize: '0.9rem' }}>
              Download Full Report
            </button>
          </div>
        </div>
      )}

      <Modal open={reportModal} onClose={() => setReportModal(false)} title="Download Report">
        <p style={{ color: '#64748b', marginBottom: '1.5rem' }}>Your energy report is being generated. It will include all telemetry, billing, and sustainability data.</p>
        <button onClick={() => setReportModal(false)} style={{ padding: '0.75rem 2rem', background: '#22C55E', color: 'white', border: 'none', borderRadius: 10, fontWeight: 700, cursor: 'pointer' }}>
          Download PDF
        </button>
      </Modal>

      <AIAdvisor mode="consumer" />
    </div>
  );
}

function KpiCard({ title, value, sub, icon: Icon, color, trend, up }) {
  return (
    <div className="metric-tile">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
        <div style={{ width: 42, height: 42, borderRadius: 10, background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={20} color={color} />
        </div>
        {trend && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: '0.75rem', fontWeight: 700, color: up ? '#16a34a' : '#dc2626', background: up ? '#dcfce7' : '#fee2e2', padding: '2px 8px', borderRadius: 20 }}>
            {up ? <TrendingUp size={12} /> : <TrendingDown size={12} />} {trend}
          </div>
        )}
      </div>
      <div style={{ color: 'var(--text-muted)', fontSize: '0.82rem', fontWeight: 600, marginBottom: 4 }}>{title}</div>
      <div style={{ fontSize: '1.65rem', fontWeight: 900, color: 'var(--text-main)', letterSpacing: '-0.02em' }}>{value}</div>
      <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: 4 }}>{sub}</div>
    </div>
  );
}

function FlowNode({ icon: Icon, label, value, color, size = 88 }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
      <div style={{ width: size, height: size, borderRadius: '50%', background: `${color}12`, border: `2px solid ${color}`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 0 20px ${color}30` }}>
        <Icon size={size * 0.38} color={color} />
      </div>
      <span style={{ fontWeight: 700, fontSize: '0.8rem', color: '#374151' }}>{label}</span>
      <span style={{ fontWeight: 800, fontSize: '0.9rem', color }}>{value}</span>
    </div>
  );
}

function BatteryNode({ soc }) {
  const color = soc > 50 ? '#3b82f6' : soc > 20 ? '#f59e0b' : '#ef4444';
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
      <div style={{ width: 72, height: 100, borderRadius: 10, border: `3px solid #cbd5e1`, position: 'relative', background: '#f8fafc', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -8, left: '50%', transform: 'translateX(-50%)', width: 24, height: 8, background: '#cbd5e1', borderRadius: '4px 4px 0 0' }} />
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: `${soc}%`, background: `linear-gradient(to top, ${color}, ${color}99)`, transition: 'height 1s ease' }} />
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '1rem', color: soc > 30 ? 'white' : color }}>{soc}%</div>
      </div>
      <span style={{ fontWeight: 700, fontSize: '0.8rem', color: '#374151' }}>BATTERY</span>
    </div>
  );
}

function FlowArrow({ color, reverse, vertical }) {
  if (vertical) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
      {[0,1,2].map(i => <div key={i} style={{ width: 3, height: 12, background: color, borderRadius: 2, opacity: 0.4 + i * 0.3 }} />)}
    </div>
  );
  return (
    <div style={{ flex: 1, height: 4, background: `linear-gradient(${reverse ? '270deg' : '90deg'}, transparent, ${color}, transparent)`, borderRadius: 2, position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: 0, left: '-100%', width: '100%', height: '100%', background: `linear-gradient(90deg, transparent, white, transparent)`, animation: 'energy-flow 1.5s infinite linear' }} />
      <style>{`@keyframes energy-flow { 0%{transform:translateX(0)} 100%{transform:translateX(200%)} }`}</style>
    </div>
  );
}

function ImpactCard({ label, value, unit, color, desc }) {
  return (
    <div className="glass-card" style={{ padding: '2rem', textAlign: 'center' }}>
      <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#94a3b8', letterSpacing: '0.05em', marginBottom: '1rem', textTransform: 'uppercase' }}>{label}</div>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: 4, marginBottom: '0.75rem' }}>
        <span style={{ fontSize: '3rem', fontWeight: 900, color }}>{value}</span>
        <span style={{ fontSize: '1.1rem', fontWeight: 600, color: '#94a3b8' }}>{unit}</span>
      </div>
      <p style={{ fontSize: '0.8rem', color: '#64748b', margin: 0 }}>{desc}</p>
    </div>
  );
}

function Legend({ color, label }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <div style={{ width: 14, height: 14, borderRadius: 3, background: color }} />
      <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#374151' }}>{label}</span>
    </div>
  );
}
