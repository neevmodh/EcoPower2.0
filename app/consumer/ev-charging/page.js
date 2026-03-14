'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Car, MapPin, Zap, Battery, TrendingUp, Plus, Trash2, Play, Square, Calendar, CheckCircle, AlertCircle } from 'lucide-react';
import AIAdvisor from '@/components/AIAdvisor';
import Modal from '@/components/Modal';

export default function EVChargingIntegration() {
  const { user } = useAuth();
  const [vehicles, setVehicles] = useState([
    { id: 'V001', name: 'Tata Nexon EV', model: '2024', battery: 85, range: 312, status: 'charging', chargingRate: 7.2, timeRemaining: '1h 25m', color: '#10b981' },
    { id: 'V002', name: 'MG ZS EV', model: '2023', battery: 45, range: 165, status: 'idle', chargingRate: 0, timeRemaining: null, color: '#3b82f6' },
  ]);
  const [sessions, setSessions] = useState([
    { id: 'S001', vehicle: 'Tata Nexon EV', date: '2026-03-14', startTime: '08:30', endTime: '10:45', energy: 28.5, cost: 199.5, source: 'Solar', savings: 28.5 },
    { id: 'S002', vehicle: 'MG ZS EV', date: '2026-03-13', startTime: '19:00', endTime: '22:30', energy: 35.2, cost: 281.6, source: 'Grid', savings: 0 },
    { id: 'S003', vehicle: 'Tata Nexon EV', date: '2026-03-12', startTime: '07:15', endTime: '09:00', energy: 22.8, cost: 159.6, source: 'Solar', savings: 22.8 },
  ]);
  const [toast, setToast] = useState(null);
  const [addVehicleModal, setAddVehicleModal] = useState(false);
  const [deleteVehicleModal, setDeleteVehicleModal] = useState(null);
  const [scheduleModal, setScheduleModal] = useState(null);
  const [vehicleForm, setVehicleForm] = useState({ name: '', model: '', battery: '100', range: '' });
  const [formErrors, setFormErrors] = useState({});
  const [scheduleForm, setScheduleForm] = useState({ time: '', targetBattery: '80', source: 'solar' });

  const showToast = (msg, type = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 4000); };

  // Simulate live battery update for charging vehicles
  useEffect(() => {
    const interval = setInterval(() => {
      setVehicles(prev => prev.map(v =>
        v.status === 'charging' ? { ...v, battery: Math.min(100, v.battery + 0.1), range: Math.min(v.range + 0.3, 500) } : v
      ));
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const nearbyStations = [
    { id: 1, name: 'EcoPower Hub - Satellite', distance: '1.2 km', available: 3, total: 4, price: 8, fastCharge: true, solar: true, lat: 23.0225, lng: 72.5714 },
    { id: 2, name: 'ChargeZone - Vastrapur', distance: '2.5 km', available: 2, total: 3, price: 9, fastCharge: true, solar: false, lat: 23.0395, lng: 72.5290 },
    { id: 3, name: 'GreenCharge - Bodakdev', distance: '3.1 km', available: 0, total: 5, price: 7.5, fastCharge: false, solar: true, lat: 23.0469, lng: 72.5070 },
  ];

  const totalEnergy = sessions.reduce((s, x) => s + x.energy, 0);
  const totalSolar = sessions.filter(s => s.source === 'Solar').reduce((s, x) => s + x.energy, 0);
  const totalSavings = sessions.reduce((s, x) => s + x.savings, 0);
  const solarPct = totalEnergy > 0 ? ((totalSolar / totalEnergy) * 100).toFixed(0) : 0;

  // Session energy chart (last 7 sessions)
  const chartSessions = sessions.slice(0, 7);
  const maxEnergy = Math.max(...chartSessions.map(s => s.energy), 1);

  const handleStartCharging = (id) => {
    setVehicles(prev => prev.map(v => v.id === id ? { ...v, status: 'charging', chargingRate: 7.2, timeRemaining: '2h 10m' } : v));
    showToast('Charging started!');
  };

  const handleStopCharging = (id) => {
    const v = vehicles.find(x => x.id === id);
    const newSession = { id: `S${Date.now()}`, vehicle: v.name, date: new Date().toISOString().slice(0,10), startTime: '—', endTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), energy: parseFloat((v.chargingRate * 0.5).toFixed(1)), cost: parseFloat((v.chargingRate * 0.5 * 7).toFixed(1)), source: 'Solar', savings: parseFloat((v.chargingRate * 0.5).toFixed(1)) };
    setSessions(prev => [newSession, ...prev]);
    setVehicles(prev => prev.map(x => x.id === id ? { ...x, status: 'idle', chargingRate: 0, timeRemaining: null } : x));
    showToast('Charging stopped. Session saved.');
  };

  const validateVehicle = () => {
    const e = {};
    if (!vehicleForm.name.trim()) e.name = 'Vehicle name required';
    if (!vehicleForm.range || parseFloat(vehicleForm.range) <= 0) e.range = 'Enter valid range';
    setFormErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleAddVehicle = () => {
    if (!validateVehicle()) return;
    const colors = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b'];
    const newV = { id: `V${Date.now()}`, name: vehicleForm.name, model: vehicleForm.model || 'Unknown', battery: parseInt(vehicleForm.battery), range: parseFloat(vehicleForm.range), status: 'idle', chargingRate: 0, timeRemaining: null, color: colors[vehicles.length % colors.length] };
    setVehicles(prev => [...prev, newV]);
    setVehicleForm({ name: '', model: '', battery: '100', range: '' });
    setAddVehicleModal(false);
    showToast('Vehicle added!');
  };

  const handleDeleteVehicle = (id) => {
    setVehicles(prev => prev.filter(v => v.id !== id));
    setDeleteVehicleModal(null);
    showToast('Vehicle removed.');
  };

  const handleSchedule = () => {
    setScheduleModal(null);
    showToast(`Charging scheduled for ${scheduleForm.time} using ${scheduleForm.source} power.`);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {toast && (
        <div style={{ padding: '1rem 1.5rem', background: toast.type === 'error' ? '#FEF2F2' : '#F0FDF4', border: `1px solid ${toast.type === 'error' ? '#FECACA' : '#BBF7D0'}`, borderRadius: 12, display: 'flex', alignItems: 'center', gap: 10, color: toast.type === 'error' ? '#DC2626' : '#16A34A', fontWeight: 600 }}>
          {toast.type === 'error' ? <AlertCircle size={18} /> : <CheckCircle size={18} />} {toast.msg}
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 900, margin: 0, letterSpacing: '-0.03em' }}>EV Charging</h1>
          <p style={{ color: '#64748b', margin: '0.4rem 0 0 0' }}>Smart charging powered by your solar energy</p>
        </div>
        <button onClick={() => setAddVehicleModal(true)}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '0.75rem 1.5rem', background: 'linear-gradient(135deg, #22C55E, #16a34a)', color: 'white', border: 'none', borderRadius: 12, fontWeight: 700, cursor: 'pointer' }}>
          <Plus size={18} /> Add Vehicle
        </button>
      </div>

      {/* KPI Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.25rem' }}>
        <StatCard title="Total Sessions" value={sessions.length} icon={Zap} color="#3b82f6" />
        <StatCard title="Energy Charged" value={`${totalEnergy.toFixed(1)} kWh`} icon={Battery} color="#f59e0b" />
        <StatCard title="Solar Share" value={`${solarPct}%`} icon={TrendingUp} color="#10b981" trend={`${totalSolar.toFixed(1)} kWh solar`} />
        <StatCard title="Total Savings" value={`₹${totalSavings.toFixed(0)}`} icon={TrendingUp} color="#8b5cf6" />
      </div>

      {/* Session Energy Chart */}
      <div className="glass-card" style={{ padding: '2rem' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1.5rem' }}>Charging Session History (Energy)</h3>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 120 }}>
          {chartSessions.map((s, i) => (
            <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              <div style={{ fontSize: '0.65rem', fontWeight: 700, color: s.source === 'Solar' ? '#10b981' : '#64748b' }}>{s.energy}</div>
              <div title={`${s.energy} kWh · ${s.source}`} style={{ width: '100%', height: `${(s.energy / maxEnergy) * 90 + 10}px`, background: s.source === 'Solar' ? 'linear-gradient(to top, #22C55E, #4ade80)' : 'linear-gradient(to top, #94a3b8, #cbd5e1)', borderRadius: '4px 4px 0 0' }} />
              <div style={{ fontSize: '0.6rem', color: '#94a3b8', textAlign: 'center' }}>{s.date.slice(5)}</div>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem', marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><div style={{ width: 12, height: 12, borderRadius: 3, background: '#22C55E' }} /><span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#374151' }}>Solar</span></div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><div style={{ width: 12, height: 12, borderRadius: 3, background: '#94a3b8' }} /><span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#374151' }}>Grid</span></div>
        </div>
      </div>

      {/* My Vehicles */}
      <div className="glass-card" style={{ padding: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0 }}>My Electric Vehicles</h3>
          <span style={{ fontSize: '0.8rem', color: '#64748b' }}>{vehicles.length} registered</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.25rem' }}>
          {vehicles.map(v => (
            <div key={v.id} style={{ padding: '1.75rem', background: v.status === 'charging' ? 'linear-gradient(135deg, #10b981, #059669)' : '#f8fafc', color: v.status === 'charging' ? 'white' : '#1e293b', borderRadius: 14, border: v.status === 'charging' ? 'none' : '2px solid #e2e8f0', position: 'relative' }}>
              {v.status === 'charging' && (
                <div style={{ position: 'absolute', top: '1rem', right: '1rem', display: 'flex', alignItems: 'center', gap: 6, padding: '4px 10px', background: 'rgba(255,255,255,0.2)', borderRadius: 20, fontSize: '0.75rem', fontWeight: 700 }}>
                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'white', animation: 'pulse 2s infinite', display: 'inline-block' }} /> CHARGING
                </div>
              )}
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                <div style={{ width: 56, height: 56, borderRadius: '50%', background: v.status === 'charging' ? 'rgba(255,255,255,0.2)' : `${v.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Car size={28} color={v.status === 'charging' ? 'white' : v.color} />
                </div>
                <div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 800 }}>{v.name}</div>
                  <div style={{ fontSize: '0.8rem', opacity: 0.75 }}>{v.model}</div>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
                <div>
                  <div style={{ fontSize: '0.78rem', opacity: 0.75, marginBottom: 4 }}>Battery</div>
                  <div style={{ fontSize: '1.75rem', fontWeight: 900 }}>{v.battery.toFixed(0)}%</div>
                  <div style={{ height: 6, background: v.status === 'charging' ? 'rgba(255,255,255,0.2)' : '#e2e8f0', borderRadius: 3, overflow: 'hidden', marginTop: 4 }}>
                    <div style={{ height: '100%', width: `${v.battery}%`, background: v.status === 'charging' ? 'white' : v.color, borderRadius: 3, transition: 'width 0.5s ease' }} />
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.78rem', opacity: 0.75, marginBottom: 4 }}>Range</div>
                  <div style={{ fontSize: '1.75rem', fontWeight: 900 }}>{v.range.toFixed(0)}</div>
                  <div style={{ fontSize: '0.75rem', opacity: 0.75 }}>km</div>
                </div>
              </div>
              {v.status === 'charging' && (
                <div style={{ padding: '0.875rem', background: 'rgba(255,255,255,0.15)', borderRadius: 10, marginBottom: '1rem', display: 'flex', justifyContent: 'space-between' }}>
                  <div><div style={{ fontSize: '0.75rem', opacity: 0.8 }}>Rate</div><div style={{ fontWeight: 700 }}>{v.chargingRate} kW</div></div>
                  <div><div style={{ fontSize: '0.75rem', opacity: 0.8 }}>ETA</div><div style={{ fontWeight: 700 }}>{v.timeRemaining}</div></div>
                </div>
              )}
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                {v.status === 'charging' ? (
                  <button onClick={() => handleStopCharging(v.id)} style={{ flex: 1, padding: '0.7rem', background: 'white', color: '#10b981', border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                    <Square size={15} /> Stop
                  </button>
                ) : (
                  <>
                    <button onClick={() => handleStartCharging(v.id)} style={{ flex: 1, padding: '0.7rem', background: 'linear-gradient(135deg, #22C55E, #16a34a)', color: 'white', border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                      <Play size={15} /> Start
                    </button>
                    <button onClick={() => setScheduleModal(v)} style={{ padding: '0.7rem 0.875rem', background: '#f1f5f9', border: 'none', borderRadius: 8, cursor: 'pointer', color: '#475569' }}>
                      <Calendar size={16} />
                    </button>
                    <button onClick={() => setDeleteVehicleModal(v.id)} style={{ padding: '0.7rem 0.875rem', background: '#fee2e2', border: 'none', borderRadius: 8, cursor: 'pointer', color: '#dc2626' }}>
                      <Trash2 size={16} />
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Nearby Stations */}
      <div className="glass-card" style={{ padding: '2rem' }}>
        <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '1.5rem' }}>Nearby Charging Stations</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {nearbyStations.map(s => (
            <div key={s.id} style={{ padding: '1.25rem 1.5rem', background: '#f8fafc', borderRadius: 12, border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1 }}>
                <div style={{ width: 44, height: 44, borderRadius: 10, background: '#dbeafe', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <MapPin size={22} color="#3b82f6" />
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: 4 }}>{s.name}</div>
                  <div style={{ display: 'flex', gap: '1rem', fontSize: '0.8rem', color: '#64748b', alignItems: 'center', flexWrap: 'wrap' }}>
                    <span>{s.distance}</span>
                    <span style={{ fontWeight: 700, color: s.available > 0 ? '#10b981' : '#ef4444' }}>{s.available}/{s.total} ports</span>
                    <span>₹{s.price}/kWh</span>
                    {s.solar && <span style={{ padding: '2px 8px', background: '#dcfce7', color: '#16a34a', borderRadius: 20, fontWeight: 700 }}>Solar</span>}
                    {s.fastCharge && <span style={{ padding: '2px 8px', background: '#dbeafe', color: '#2563eb', borderRadius: 20, fontWeight: 700 }}>Fast</span>}
                  </div>
                </div>
              </div>
              <button disabled={s.available === 0}
                onClick={() => s.available > 0 && window.open(`https://www.google.com/maps/dir/?api=1&destination=${s.lat},${s.lng}`, '_blank')}
                style={{ padding: '0.65rem 1.25rem', background: s.available > 0 ? 'linear-gradient(135deg, #3b82f6, #2563eb)' : '#f1f5f9', color: s.available > 0 ? 'white' : '#94a3b8', border: 'none', borderRadius: 8, fontWeight: 700, cursor: s.available > 0 ? 'pointer' : 'not-allowed', fontSize: '0.875rem', marginLeft: '1rem' }}>
                {s.available > 0 ? 'Navigate' : 'Full'}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Session History Table */}
      <div className="glass-card" style={{ padding: '2rem' }}>
        <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '1.5rem' }}>Charging Session Log</h3>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #e2e8f0' }}>
                {['VEHICLE','DATE','TIME','ENERGY','SOURCE','COST','SAVINGS'].map(h => (
                  <th key={h} style={{ padding: '0.875rem 1rem', textAlign: 'left', color: '#64748b', fontWeight: 600, fontSize: '0.78rem' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sessions.map(s => (
                <tr key={s.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '0.875rem 1rem', fontWeight: 600, fontSize: '0.875rem' }}>{s.vehicle}</td>
                  <td style={{ padding: '0.875rem 1rem', fontSize: '0.8rem', color: '#64748b' }}>{s.date}</td>
                  <td style={{ padding: '0.875rem 1rem', fontSize: '0.8rem', color: '#64748b' }}>{s.startTime} – {s.endTime}</td>
                  <td style={{ padding: '0.875rem 1rem', fontWeight: 700 }}>{s.energy} kWh</td>
                  <td style={{ padding: '0.875rem 1rem' }}>
                    <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 700, background: s.source === 'Solar' ? '#dcfce7' : '#f1f5f9', color: s.source === 'Solar' ? '#16a34a' : '#64748b' }}>{s.source}</span>
                  </td>
                  <td style={{ padding: '0.875rem 1rem', fontWeight: 700 }}>₹{s.cost}</td>
                  <td style={{ padding: '0.875rem 1rem', fontWeight: 800, color: s.savings > 0 ? '#10b981' : '#94a3b8' }}>{s.savings > 0 ? `+₹${s.savings}` : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Vehicle Modal */}
      <Modal open={addVehicleModal} onClose={() => setAddVehicleModal(false)} title="Add Electric Vehicle">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {[
            { label: 'Vehicle Name', key: 'name', placeholder: 'e.g. Tata Nexon EV', error: formErrors.name },
            { label: 'Model Year', key: 'model', placeholder: 'e.g. 2024' },
            { label: 'Battery Capacity (%)', key: 'battery', placeholder: '100', type: 'number' },
            { label: 'Range (km)', key: 'range', placeholder: 'e.g. 312', error: formErrors.range, type: 'number' },
          ].map(f => (
            <div key={f.key}>
              <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#374151', display: 'block', marginBottom: 6 }}>{f.label}</label>
              <input type={f.type || 'text'} value={vehicleForm[f.key]} onChange={e => setVehicleForm(p => ({ ...p, [f.key]: e.target.value }))} placeholder={f.placeholder}
                style={{ width: '100%', padding: '0.75rem', border: `1.5px solid ${f.error ? '#ef4444' : '#e2e8f0'}`, borderRadius: 10, fontSize: '0.95rem', boxSizing: 'border-box' }} />
              {f.error && <div style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: 4 }}>{f.error}</div>}
            </div>
          ))}
          <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
            <button onClick={() => setAddVehicleModal(false)} style={{ flex: 1, padding: '0.75rem', background: '#f1f5f9', border: 'none', borderRadius: 10, fontWeight: 600, cursor: 'pointer', color: '#64748b' }}>Cancel</button>
            <button onClick={handleAddVehicle} style={{ flex: 1, padding: '0.75rem', background: 'linear-gradient(135deg, #22C55E, #16a34a)', color: 'white', border: 'none', borderRadius: 10, fontWeight: 700, cursor: 'pointer' }}>Add Vehicle</button>
          </div>
        </div>
      </Modal>

      {/* Delete Vehicle Modal */}
      <Modal open={!!deleteVehicleModal} onClose={() => setDeleteVehicleModal(null)} title="Remove Vehicle">
        <p style={{ color: '#64748b', marginBottom: '1.5rem' }}>Are you sure you want to remove this vehicle from your account?</p>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button onClick={() => handleDeleteVehicle(deleteVehicleModal)} style={{ flex: 1, padding: '0.75rem', background: '#ef4444', color: 'white', border: 'none', borderRadius: 10, fontWeight: 700, cursor: 'pointer' }}>Remove</button>
          <button onClick={() => setDeleteVehicleModal(null)} style={{ flex: 1, padding: '0.75rem', background: '#f1f5f9', border: 'none', borderRadius: 10, fontWeight: 600, cursor: 'pointer', color: '#64748b' }}>Cancel</button>
        </div>
      </Modal>

      {/* Schedule Modal */}
      <Modal open={!!scheduleModal} onClose={() => setScheduleModal(null)} title={`Schedule Charging — ${scheduleModal?.name}`}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#374151', display: 'block', marginBottom: 6 }}>Start Time</label>
            <input type="time" value={scheduleForm.time} onChange={e => setScheduleForm(f => ({ ...f, time: e.target.value }))}
              style={{ width: '100%', padding: '0.75rem', border: '1.5px solid #e2e8f0', borderRadius: 10, fontSize: '1rem', boxSizing: 'border-box' }} />
          </div>
          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#374151', display: 'block', marginBottom: 6 }}>Target Battery (%)</label>
            <input type="number" min="10" max="100" value={scheduleForm.targetBattery} onChange={e => setScheduleForm(f => ({ ...f, targetBattery: e.target.value }))}
              style={{ width: '100%', padding: '0.75rem', border: '1.5px solid #e2e8f0', borderRadius: 10, fontSize: '1rem', boxSizing: 'border-box' }} />
          </div>
          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#374151', display: 'block', marginBottom: 8 }}>Preferred Source</label>
            <div style={{ display: 'flex', gap: 8 }}>
              {[['solar','Solar Only'],['grid','Grid Only'],['any','Any Available']].map(([v, l]) => (
                <button key={v} onClick={() => setScheduleForm(f => ({ ...f, source: v }))}
                  style={{ flex: 1, padding: '0.65rem', border: `1.5px solid ${scheduleForm.source === v ? '#22C55E' : '#e2e8f0'}`, borderRadius: 8, background: scheduleForm.source === v ? '#f0fdf4' : 'white', color: scheduleForm.source === v ? '#16a34a' : '#64748b', fontWeight: 600, cursor: 'pointer', fontSize: '0.8rem' }}>{l}</button>
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
            <button onClick={() => setScheduleModal(null)} style={{ flex: 1, padding: '0.75rem', background: '#f1f5f9', border: 'none', borderRadius: 10, fontWeight: 600, cursor: 'pointer', color: '#64748b' }}>Cancel</button>
            <button onClick={handleSchedule} style={{ flex: 1, padding: '0.75rem', background: 'linear-gradient(135deg, #22C55E, #16a34a)', color: 'white', border: 'none', borderRadius: 10, fontWeight: 700, cursor: 'pointer' }}>Schedule</button>
          </div>
        </div>
      </Modal>

      <AIAdvisor mode="consumer" />
    </div>
  );
}

function StatCard({ title, value, icon: Icon, color, trend }) {
  return (
    <div className="glass-card" style={{ padding: '1.5rem' }}>
      <div style={{ width: 44, height: 44, borderRadius: 10, background: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
        <Icon size={22} color={color} />
      </div>
      <div style={{ color: '#64748b', fontSize: '0.82rem', fontWeight: 600, marginBottom: 4 }}>{title}</div>
      <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#1e293b' }}>{value}</div>
      {trend && <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#10b981', marginTop: 4 }}>{trend}</div>}
    </div>
  );
}
