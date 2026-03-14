'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Upload, Download, CheckCircle, AlertTriangle, Clock, Cpu, RefreshCw } from 'lucide-react';
import Modal from '@/components/Modal';
import AIAdvisor from '@/components/AIAdvisor';

const LATEST = 'v3.2.1';
const VERSIONS = [
  { version: 'v3.2.1', releaseDate: '2026-03-10', status: 'Latest', features: ['Enhanced security', 'Battery optimization', 'Bug fixes'] },
  { version: 'v3.1.5', releaseDate: '2026-02-15', status: 'Stable', features: ['Performance improvements', 'UI updates'] },
  { version: 'v3.0.2', releaseDate: '2026-01-20', status: 'Legacy', features: ['Initial release'] }
];

export default function FirmwareManagement() {
  const { user } = useAuth();
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState({});
  const [progress, setProgress] = useState({});
  const [bulkModal, setBulkModal] = useState(false);
  const [bulkRunning, setBulkRunning] = useState(false);
  const [bulkProgress, setBulkProgress] = useState(0);
  const [bulkTotal, setBulkTotal] = useState(0);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3500); };

  const fetchDevices = async () => {
    try {
      const res = await fetch(`/api/devices?userId=${user.userId}&role=${user.role}`);
      const data = await res.json();
      setDevices(Array.isArray(data) ? data : []);
    } catch { setDevices([]); } finally { setLoading(false); }
  };

  useEffect(() => { if (user) fetchDevices(); }, [user]);

  const updateFirmware = async (deviceId) => {
    setUpdating(prev => ({ ...prev, [deviceId]: true }));
    setProgress(prev => ({ ...prev, [deviceId]: 0 }));

    // Simulate OTA progress
    for (let p = 0; p <= 100; p += 20) {
      await new Promise(r => setTimeout(r, 300));
      setProgress(prev => ({ ...prev, [deviceId]: p }));
    }

    // Optimistically update local state
    setDevices(prev => prev.map(d => d.deviceId === deviceId ? { ...d, firmware_version: LATEST } : d));
    setUpdating(prev => ({ ...prev, [deviceId]: false }));
    setProgress(prev => { const n = { ...prev }; delete n[deviceId]; return n; });
    showToast(`Device ${deviceId} updated to ${LATEST}`);
  };

  const bulkUpdate = async () => {
    const outdated = devices.filter(d => (d.firmware_version || 'v3.0.2') !== LATEST);
    if (outdated.length === 0) { showToast('All devices are up to date'); setBulkModal(false); return; }
    setBulkRunning(true);
    setBulkTotal(outdated.length);
    setBulkProgress(0);

    for (let i = 0; i < outdated.length; i++) {
      const d = outdated[i];
      setUpdating(prev => ({ ...prev, [d.deviceId]: true }));
      await new Promise(r => setTimeout(r, 1500));
      setDevices(prev => prev.map(dev => dev.deviceId === d.deviceId ? { ...dev, firmware_version: LATEST } : dev));
      setUpdating(prev => ({ ...prev, [d.deviceId]: false }));
      setBulkProgress(i + 1);
    }

    setBulkRunning(false);
    setBulkModal(false);
    showToast(`Successfully updated ${outdated.length} devices to ${LATEST}`);
  };

  const outdatedDevices = devices.filter(d => (d.firmware_version || 'v3.0.2') !== LATEST);
  const versionCounts = {};
  devices.forEach(d => { const v = d.firmware_version || 'v3.0.2'; versionCounts[v] = (versionCounts[v] || 0) + 1; });

  if (loading) return <div style={{ padding: '3rem', textAlign: 'center', color: '#64748B' }}>Loading firmware data...</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', fontFamily: 'Inter, sans-serif' }}>
      {toast && <div style={{ position: 'fixed', top: '1.5rem', right: '1.5rem', zIndex: 3000, padding: '0.875rem 1.5rem', borderRadius: 12, background: toast.type === 'error' ? '#EF4444' : '#22C55E', color: '#fff', fontWeight: 600, boxShadow: '0 8px 24px rgba(0,0,0,0.15)', fontSize: '0.875rem' }}>{toast.msg}</div>}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>Device Firmware Management</h1>
          <p style={{ color: '#64748B', margin: '0.25rem 0 0 0', fontSize: '0.9rem' }}>OTA updates and version control</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={fetchDevices} style={{ padding: '0.7rem 1.2rem', background: '#F1F5F9', color: '#374151', border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}><RefreshCw size={16} />Refresh</button>
          <button onClick={() => setBulkModal(true)} disabled={outdatedDevices.length === 0} style={{ padding: '0.7rem 1.4rem', background: outdatedDevices.length === 0 ? '#E2E8F0' : '#4F46E5', color: '#fff', border: 'none', borderRadius: 10, cursor: outdatedDevices.length === 0 ? 'not-allowed' : 'pointer', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Upload size={16} />Bulk Update All ({outdatedDevices.length})
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
        {[
          { label: 'Total Devices', value: devices.length, color: '#3B82F6', icon: Cpu },
          { label: 'Up to Date', value: devices.length - outdatedDevices.length, color: '#22C55E', icon: CheckCircle },
          { label: 'Needs Update', value: outdatedDevices.length, color: '#F59E0B', icon: AlertTriangle },
          { label: 'Latest Version', value: LATEST, color: '#8B5CF6', icon: Download },
        ].map(m => (
          <div key={m.label} style={{ background: '#fff', padding: '1.5rem', borderRadius: 14, border: '1px solid #E2E8F0' }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: `${m.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}><m.icon size={22} color={m.color} /></div>
            <div style={{ color: '#64748B', fontSize: '0.8rem', fontWeight: 600, marginBottom: 4 }}>{m.label}</div>
            <div style={{ fontSize: m.label === 'Latest Version' ? '1.25rem' : '1.75rem', fontWeight: 800, color: '#0F172A' }}>{m.value}</div>
          </div>
        ))}
      </div>

      <div style={{ background: '#fff', padding: '2rem', borderRadius: 16, border: '1px solid #E2E8F0' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: '0 0 1.5rem 0', color: '#0F172A' }}>Available Firmware Versions</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem' }}>
          {VERSIONS.map(fw => (
            <div key={fw.version} style={{ padding: '1.5rem', background: fw.status === 'Latest' ? 'linear-gradient(135deg,#4F46E5,#4338CA)' : '#fff', color: fw.status === 'Latest' ? '#fff' : '#0F172A', border: fw.status === 'Latest' ? 'none' : '1px solid #E2E8F0', borderRadius: 14, position: 'relative' }}>
              {fw.status === 'Latest' && <div style={{ position: 'absolute', top: '1rem', right: '1rem', padding: '0.2rem 0.6rem', background: 'rgba(255,255,255,0.2)', borderRadius: 6, fontSize: '0.7rem', fontWeight: 700 }}>LATEST</div>}
              <div style={{ fontSize: '1.5rem', fontWeight: 900, marginBottom: 4 }}>{fw.version}</div>
              <div style={{ fontSize: '0.8rem', opacity: 0.8, marginBottom: '1rem' }}>Released: {new Date(fw.releaseDate).toLocaleDateString()}</div>
              <div style={{ marginBottom: '1rem' }}>
                <div style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: 6 }}>{versionCounts[fw.version] || 0} devices</div>
                <div style={{ width: '100%', height: 6, background: fw.status === 'Latest' ? 'rgba(255,255,255,0.2)' : '#F1F5F9', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ width: devices.length > 0 ? `${((versionCounts[fw.version] || 0) / devices.length) * 100}%` : '0%', height: '100%', background: fw.status === 'Latest' ? '#fff' : '#4F46E5', borderRadius: 3 }} />
                </div>
              </div>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '0.8rem', opacity: 0.9 }}>
                {fw.features.map((f, i) => <li key={i} style={{ marginBottom: 4 }}>• {f}</li>)}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <div style={{ background: '#fff', padding: '2rem', borderRadius: 16, border: '1px solid #E2E8F0' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: '0 0 1.5rem 0', color: '#0F172A' }}>Device Firmware Status</h3>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #E2E8F0' }}>
                {['Device ID', 'Type', 'Current Version', 'Status', 'Last Update', 'Actions'].map(h => (
                  <th key={h} style={{ padding: '1rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {devices.map(device => {
                const currentVersion = device.firmware_version || 'v3.0.2';
                const isLatest = currentVersion === LATEST;
                const isUpdating = updating[device.deviceId];
                const prog = progress[device.deviceId];

                return (
                  <tr key={device.deviceId} style={{ borderBottom: '1px solid #F1F5F9' }}>
                    <td style={{ padding: '1rem', fontWeight: 700, color: '#0F172A', fontSize: '0.875rem' }}>{device.deviceId}</td>
                    <td style={{ padding: '1rem', color: '#64748B', fontSize: '0.85rem' }}>{device.type}</td>
                    <td style={{ padding: '1rem' }}>
                      <span style={{ padding: '0.25rem 0.75rem', borderRadius: 20, fontSize: '0.8rem', fontWeight: 700, background: isLatest ? '#DCFCE7' : '#FEF3C7', color: isLatest ? '#16A34A' : '#D97706' }}>{currentVersion}</span>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      {isUpdating ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#4F46E5', fontSize: '0.85rem', fontWeight: 600 }}><Clock size={14} />Updating... {prog}%</div>
                          <div style={{ width: 120, height: 6, background: '#E2E8F0', borderRadius: 3, overflow: 'hidden' }}>
                            <div style={{ width: `${prog}%`, height: '100%', background: '#4F46E5', borderRadius: 3, transition: 'width 0.3s' }} />
                          </div>
                        </div>
                      ) : isLatest ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#22C55E', fontSize: '0.85rem', fontWeight: 600 }}><CheckCircle size={14} />Up to date</div>
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#F59E0B', fontSize: '0.85rem', fontWeight: 600 }}><AlertTriangle size={14} />Update available</div>
                      )}
                    </td>
                    <td style={{ padding: '1rem', color: '#64748B', fontSize: '0.85rem' }}>{new Date(device.lastPing).toLocaleDateString()}</td>
                    <td style={{ padding: '1rem' }}>
                      {!isLatest && !isUpdating && (
                        <button onClick={() => updateFirmware(device.deviceId)} style={{ padding: '0.4rem 0.9rem', background: '#4F46E5', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: 4 }}><Upload size={13} />Update</button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <Modal open={bulkModal} onClose={() => !bulkRunning && setBulkModal(false)} title="Bulk Firmware Update" width={480}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {!bulkRunning ? (
            <>
              <p style={{ margin: 0, color: '#374151', lineHeight: 1.6 }}>This will update <strong>{outdatedDevices.length} devices</strong> to firmware <strong>{LATEST}</strong>. The process runs sequentially and may take a few minutes.</p>
              <div style={{ padding: '1rem', background: '#FEF3C7', border: '1px solid #FDE68A', borderRadius: 10, fontSize: '0.875rem', color: '#92400E' }}>⚠️ Devices will briefly go offline during the update process.</div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button onClick={() => setBulkModal(false)} style={{ padding: '0.7rem 1.4rem', background: '#F1F5F9', color: '#374151', border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: 600 }}>Cancel</button>
                <button onClick={bulkUpdate} style={{ padding: '0.7rem 1.4rem', background: '#4F46E5', color: '#fff', border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}><Upload size={16} />Start Update</button>
              </div>
            </>
          ) : (
            <div style={{ textAlign: 'center', padding: '1rem' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#4F46E5', marginBottom: 8 }}>{bulkProgress} / {bulkTotal}</div>
              <div style={{ color: '#64748B', marginBottom: '1.5rem', fontSize: '0.875rem' }}>Updating devices...</div>
              <div style={{ width: '100%', height: 10, background: '#E2E8F0', borderRadius: 5, overflow: 'hidden' }}>
                <div style={{ width: `${(bulkProgress / bulkTotal) * 100}%`, height: '100%', background: 'linear-gradient(90deg,#4F46E5,#7C3AED)', borderRadius: 5, transition: 'width 0.5s' }} />
              </div>
            </div>
          )}
        </div>
      </Modal>

      <AIAdvisor mode="device" title="Firmware AI Advisor" context={`${outdatedDevices.length} devices need firmware update to ${LATEST}. Total fleet: ${devices.length} devices.`} />
    </div>
  );
}
