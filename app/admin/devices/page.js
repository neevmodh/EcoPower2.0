'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Zap, Activity, AlertTriangle, CheckCircle, Search, Sparkles, Eye, ToggleLeft, ToggleRight } from 'lucide-react';
import Modal from '@/components/Modal';
import AIAdvisor from '@/components/AIAdvisor';
import { groqChat } from '@/lib/groqClient';

const inputStyle = { padding: '0.75rem 1rem', borderRadius: 10, border: '1.5px solid #E2E8F0', outline: 'none', fontFamily: 'Inter, sans-serif', fontSize: '0.9rem', width: '100%', boxSizing: 'border-box', color: '#0F172A', background: '#F8FAFC' };
const btnPrimary = { padding: '0.7rem 1.4rem', background: '#22C55E', color: '#fff', border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: 700, fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: 6 };

export default function DeviceManagement() {
  const { user } = useAuth();
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [viewDevice, setViewDevice] = useState(null);
  const [diagDevice, setDiagDevice] = useState(null);
  const [diagResult, setDiagResult] = useState('');
  const [diagLoading, setDiagLoading] = useState(false);
  const [toggling, setToggling] = useState({});
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000); };

  const fetchDevices = async () => {
    try {
      const res = await fetch(`/api/devices?userId=${user.userId}&role=${user.role}`);
      const data = await res.json();
      setDevices(Array.isArray(data) ? data : []);
    } catch { setDevices([]); } finally { setLoading(false); }
  };

  useEffect(() => { if (user) fetchDevices(); }, [user]);

  const toggleStatus = async (id, currentStatus) => {
    setToggling(prev => ({ ...prev, [id]: true }));
    try {
      const res = await fetch(`/api/devices/${id}/toggle`, { method: 'POST' });
      if (res.ok) { fetchDevices(); showToast(`Device ${currentStatus === 'Online' ? 'disabled' : 'enabled'}`); }
      else showToast('Failed to toggle device', 'error');
    } catch { showToast('Network error', 'error'); } finally { setToggling(prev => ({ ...prev, [id]: false })); }
  };

  const runDiagnostics = async (device) => {
    setDiagDevice(device);
    setDiagResult('');
    setDiagLoading(true);
    try {
      const reply = await groqChat({
        messages: [{ role: 'user', content: `Run a diagnostic analysis for this IoT device and provide: 1) Health assessment, 2) Potential issues, 3) Recommended actions. Device: ${JSON.stringify({ id: device.deviceId, type: device.type, status: device.status, firmware: device.firmware_version || 'v3.0.2', lastPing: device.lastPing })}` }],
        mode: 'device',
        context: `Device ${device.deviceId} (${device.type}) is ${device.status}`
      });
      setDiagResult(reply || 'Diagnostics unavailable.');
    } catch (err) { setDiagResult(`Diagnostics error: ${err.message}`); } finally { setDiagLoading(false); }
  };

  const deviceTypes = ['All', ...new Set(devices.map(d => d.type).filter(Boolean))];
  const filtered = devices.filter(d => {
    const matchSearch = d.deviceId?.toLowerCase().includes(search.toLowerCase()) || d.locationId?.toLowerCase().includes(search.toLowerCase());
    const matchType = typeFilter === 'All' || d.type === typeFilter;
    return matchSearch && matchType;
  });

  if (loading) return <div style={{ padding: '3rem', textAlign: 'center', color: '#64748B' }}>Loading devices...</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', fontFamily: 'Inter, sans-serif' }}>
      {toast && <div style={{ position: 'fixed', top: '1.5rem', right: '1.5rem', zIndex: 3000, padding: '0.875rem 1.5rem', borderRadius: 12, background: toast.type === 'error' ? '#EF4444' : '#22C55E', color: '#fff', fontWeight: 600, boxShadow: '0 8px 24px rgba(0,0,0,0.15)', fontSize: '0.875rem' }}>{toast.msg}</div>}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>IoT & Smart Meter Fleet</h1>
          <p style={{ color: '#64748B', margin: '0.25rem 0 0 0', fontSize: '0.9rem' }}>{devices.length} devices registered</p>
        </div>
        <button onClick={fetchDevices} style={btnPrimary}><Activity size={16} />Refresh</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
        {[
          { label: 'Total Devices', value: devices.length, color: '#3B82F6', icon: Zap },
          { label: 'Online', value: devices.filter(d => d.status === 'Online').length, color: '#22C55E', icon: CheckCircle },
          { label: 'Offline / Fault', value: devices.filter(d => d.status !== 'Online').length, color: '#EF4444', icon: AlertTriangle },
          { label: 'Smart Meters', value: devices.filter(d => d.type === 'Smart Meter').length, color: '#F59E0B', icon: Activity },
        ].map(m => (
          <div key={m.label} style={{ background: '#fff', padding: '1.25rem', borderRadius: 14, border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: `${m.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><m.icon size={22} color={m.color} /></div>
            <div><div style={{ color: '#64748B', fontSize: '0.8rem', fontWeight: 600 }}>{m.label}</div><div style={{ fontSize: '1.75rem', fontWeight: 800, color: m.color }}>{m.value}</div></div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by device ID or location..." style={{ ...inputStyle, paddingLeft: '2.5rem' }} />
        </div>
        {deviceTypes.map(t => (
          <button key={t} onClick={() => setTypeFilter(t)} style={{ padding: '0.6rem 1rem', borderRadius: 8, border: '1.5px solid', borderColor: typeFilter === t ? '#22C55E' : '#E2E8F0', background: typeFilter === t ? '#F0FDF4' : '#fff', color: typeFilter === t ? '#16A34A' : '#64748B', fontWeight: 600, cursor: 'pointer', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>{t}</button>
        ))}
      </div>

      <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #E2E8F0', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
              {['Device ID', 'Type', 'Location', 'Status', 'Firmware', 'Last Ping', 'Actions'].map(h => (
                <th key={h} style={{ padding: '1rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={7} style={{ padding: '3rem', textAlign: 'center', color: '#94A3B8' }}>No devices found</td></tr>
            ) : filtered.map(d => (
              <tr key={d.deviceId} style={{ borderBottom: '1px solid #F1F5F9' }}>
                <td style={{ padding: '1rem', fontWeight: 700, color: '#0F172A', fontSize: '0.875rem' }}>{d.deviceId}</td>
                <td style={{ padding: '1rem', color: '#64748B', fontSize: '0.85rem' }}>{d.type}</td>
                <td style={{ padding: '1rem', color: '#64748B', fontSize: '0.85rem' }}>{d.locationId}</td>
                <td style={{ padding: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: d.status === 'Online' ? '#22C55E' : d.status === 'Fault' ? '#EF4444' : '#94A3B8' }} />
                    <span style={{ fontSize: '0.85rem', fontWeight: 600, color: d.status === 'Online' ? '#16A34A' : d.status === 'Fault' ? '#EF4444' : '#64748B' }}>{d.status}</span>
                  </div>
                </td>
                <td style={{ padding: '1rem' }}>
                  <span style={{ padding: '0.2rem 0.6rem', borderRadius: 6, fontSize: '0.75rem', fontWeight: 600, background: '#F1F5F9', color: '#374151' }}>{d.firmware_version || 'v3.0.2'}</span>
                </td>
                <td style={{ padding: '1rem', fontSize: '0.8rem', color: '#64748B' }}>{new Date(d.lastPing).toLocaleString()}</td>
                <td style={{ padding: '1rem' }}>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button onClick={() => setViewDevice(d)} style={{ padding: '0.4rem 0.7rem', background: '#EFF6FF', color: '#2563EB', border: '1px solid #BFDBFE', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: 4 }}><Eye size={13} /></button>
                    <button onClick={() => runDiagnostics(d)} style={{ padding: '0.4rem 0.7rem', background: '#F5F3FF', color: '#7C3AED', border: '1px solid #DDD6FE', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: 4 }}><Sparkles size={13} />Diag</button>
                    <button onClick={() => toggleStatus(d.deviceId, d.status)} disabled={toggling[d.deviceId]} style={{ padding: '0.4rem 0.7rem', background: d.status === 'Online' ? '#FEF2F2' : '#F0FDF4', color: d.status === 'Online' ? '#EF4444' : '#16A34A', border: `1px solid ${d.status === 'Online' ? '#FECACA' : '#BBF7D0'}`, borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: 4 }}>
                      {toggling[d.deviceId] ? '...' : d.status === 'Online' ? <><ToggleRight size={13} />Disable</> : <><ToggleLeft size={13} />Enable</>}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* View Device Modal */}
      <Modal open={!!viewDevice} onClose={() => setViewDevice(null)} title={`Device: ${viewDevice?.deviceId}`} width={480}>
        {viewDevice && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
            {[['Device ID', viewDevice.deviceId], ['Type', viewDevice.type], ['Location', viewDevice.locationId], ['Status', viewDevice.status], ['Firmware', viewDevice.firmware_version || 'v3.0.2'], ['Last Ping', new Date(viewDevice.lastPing).toLocaleString()], ['Serial', viewDevice.serialNumber || '—']].map(([k, v]) => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem 1rem', background: '#F8FAFC', borderRadius: 10 }}>
                <span style={{ fontSize: '0.85rem', color: '#64748B', fontWeight: 600 }}>{k}</span>
                <span style={{ fontSize: '0.85rem', color: '#0F172A', fontWeight: 700 }}>{v}</span>
              </div>
            ))}
          </div>
        )}
      </Modal>

      {/* AI Diagnostics Modal */}
      <Modal open={!!diagDevice} onClose={() => { setDiagDevice(null); setDiagResult(''); }} title={`AI Diagnostics: ${diagDevice?.deviceId}`} width={560}>
        {diagDevice && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ padding: '1rem', background: '#F8FAFC', borderRadius: 10, fontSize: '0.85rem', color: '#374151' }}>
              <strong>{diagDevice.type}</strong> · {diagDevice.status} · {diagDevice.firmware_version || 'v3.0.2'}
            </div>
            {diagLoading ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: '#7C3AED' }}>
                <Sparkles size={24} style={{ marginBottom: 8 }} />
                <div style={{ fontWeight: 600 }}>Running AI diagnostics...</div>
              </div>
            ) : diagResult ? (
              <div style={{ padding: '1.25rem', background: 'linear-gradient(135deg,#F5F3FF,#EDE9FE)', border: '1px solid #DDD6FE', borderRadius: 12, fontSize: '0.875rem', color: '#374151', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{diagResult}</div>
            ) : null}
          </div>
        )}
      </Modal>

      <AIAdvisor mode="device" title="Device Diagnostics AI" context={`Fleet: ${devices.length} devices, ${devices.filter(d => d.status === 'Online').length} online, ${devices.filter(d => d.status !== 'Online').length} offline/fault`} />
    </div>
  );
}
