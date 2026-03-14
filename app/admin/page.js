'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import AhmedabadMap from '@/components/AhmedabadMap';
import { Activity, Users, Zap, AlertTriangle, Sun, Leaf, Banknote, UserCheck, UserX, Sparkles, Plus } from 'lucide-react';
import Modal from '@/components/Modal';
import AIAdvisor from '@/components/AIAdvisor';
import { groqChat } from '@/lib/groqClient';

const inputStyle = { padding: '0.75rem 1rem', borderRadius: 10, border: '1.5px solid #E2E8F0', outline: 'none', fontFamily: 'Inter, sans-serif', fontSize: '0.9rem', width: '100%', boxSizing: 'border-box', color: '#0F172A', background: '#F8FAFC' };
const btnPrimary = { padding: '0.7rem 1.4rem', background: '#22C55E', color: '#fff', border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: 700, fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: 6 };

export default function AdminDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState({ locations: [], users: [], devices: [], tickets: [], telemetry: [], telemetryTotals: {}, invoices: [] });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [provisionModal, setProvisionModal] = useState(false);
  const [configModal, setConfigModal] = useState(null);
  const [planModal, setPlanModal] = useState(null);
  const [aiInsight, setAiInsight] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [provisionForm, setProvisionForm] = useState({ name: '', email: '', password: '', role: 'Consumer', phone: '' });
  const [provisioning, setProvisioning] = useState(false);

  const showToast = (msg, type = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000); };

  useEffect(() => {
    async function fetchData() {
      try {
        const [locRes, devRes, tktRes, teleRes, invRes, userRes] = await Promise.all([
          fetch(`/api/locations?role=admin`),
          fetch(`/api/devices?role=admin`),
          fetch(`/api/tickets?role=admin`),
          fetch(`/api/telemetry/dashboard?role=admin`),
          fetch(`/api/invoices?role=admin`),
          fetch(`/api/users?role=admin`)
        ]);
        const [locData, devData, tktData, teleData, invData, userData] = await Promise.all([locRes.json(), devRes.json(), tktRes.json(), teleRes.json(), invRes.json(), userRes.json()]);
        setData({ locations: Array.isArray(locData) ? locData : [], devices: Array.isArray(devData) ? devData : [], tickets: Array.isArray(tktData) ? tktData : [], telemetry: Array.isArray(teleData?.telemetry) ? teleData.telemetry : [], telemetryTotals: teleData?.totals || {}, invoices: Array.isArray(invData) ? invData : [], users: Array.isArray(userData) ? userData : [] });
      } catch (err) { console.error('Failed to load admin data', err); } finally { setLoading(false); }
    }
    fetchData();
  }, []);

  const updateUserStatus = async (userId, status) => {
    try {
      const res = await fetch(`/api/users/${userId}/status`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) });
      if (res.ok) {
        setData(prev => ({ ...prev, users: prev.users.map(u => u.userId === userId ? { ...u, status } : u) }));
        showToast(`User ${status.toLowerCase()} successfully`);
        setConfigModal(null);
      } else showToast('Failed to update user', 'error');
    } catch { showToast('Network error', 'error'); }
  };

  const handleProvision = async (e) => {
    e.preventDefault();
    setProvisioning(true);
    try {
      const res = await fetch('/api/users/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...provisionForm, status: 'Active' }) });
      if (res.ok) {
        const newUser = await res.json();
        setData(prev => ({ ...prev, users: [...prev.users, newUser] }));
        setProvisionModal(false);
        setProvisionForm({ name: '', email: '', password: '', role: 'Consumer', phone: '' });
        showToast('Account provisioned successfully');
      } else { const err = await res.json(); showToast(err.message || 'Failed to provision account', 'error'); }
    } catch { showToast('Network error', 'error'); } finally { setProvisioning(false); }
  };

  const getAIInsights = async () => {
    setAiLoading(true);
    setAiInsight('');
    try {
      const summary = {
        users: data.users.length,
        activeUsers: data.users.filter(u => u.status === 'Active').length,
        devices: data.devices.length,
        onlineDevices: data.devices.filter(d => d.status === 'Online').length,
        openTickets: data.tickets.filter(t => t.status !== 'Resolved').length,
        revenue: data.invoices.filter(i => i.status === 'Paid').reduce((s, i) => s + i.totalAmount, 0)
      };
      const reply = await groqChat({
        messages: [{ role: 'user', content: `Provide a platform health summary and 3 priority actions for the EcoPower admin: ${JSON.stringify(summary)}` }],
        mode: 'admin'
      });
      setAiInsight(reply || 'No insights available.');
    } catch (err) { setAiInsight(`Error: ${err.message}`); } finally { setAiLoading(false); }
  };

  if (loading) return <div style={{ padding: '3rem', textAlign: 'center', color: '#64748B', fontFamily: 'Inter, sans-serif' }}>Loading Command Center...</div>;

  const totalGen = data.telemetryTotals?.totalGenerated || 0;
  const totalCons = data.telemetryTotals?.totalConsumed || 0;
  const totalRev = data.invoices.filter(i => i.status === 'Paid' || i.status === 'paid').reduce((s, i) => s + i.totalAmount, 0);
  const carbonOffset = (totalGen * 0.82).toFixed(1);
  const greenPct = totalCons > 0 ? ((totalGen / totalCons) * 100).toFixed(1) : 0;

  const TabBtn = ({ id, label }) => (
    <button onClick={() => setActiveTab(id)} style={{ padding: '0.5rem 1.1rem', borderRadius: 8, border: 'none', background: activeTab === id ? '#fff' : 'transparent', color: activeTab === id ? '#0F172A' : '#64748B', fontWeight: 700, cursor: 'pointer', fontSize: '0.875rem', boxShadow: activeTab === id ? '0 1px 4px rgba(0,0,0,0.1)' : 'none', fontFamily: 'Inter, sans-serif' }}>{label}</button>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', fontFamily: 'Inter, sans-serif' }}>
      {toast && <div style={{ position: 'fixed', top: '1.5rem', right: '1.5rem', zIndex: 3000, padding: '0.875rem 1.5rem', borderRadius: 12, background: toast.type === 'error' ? '#EF4444' : '#22C55E', color: '#fff', fontWeight: 600, boxShadow: '0 8px 24px rgba(0,0,0,0.15)', fontSize: '0.875rem' }}>{toast.msg}</div>}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 900, color: '#0F172A', margin: 0, letterSpacing: '-0.03em' }}>Platform Command Center</h1>
          <p style={{ color: '#64748B', margin: '0.25rem 0 0 0', fontSize: '0.95rem' }}>Global system overview and administrative controls</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={getAIInsights} disabled={aiLoading} style={{ ...btnPrimary, background: '#7C3AED' }}><Sparkles size={16} />{aiLoading ? 'Analyzing...' : 'AI Insights'}</button>
          <div style={{ display: 'flex', gap: 4, background: '#F1F5F9', borderRadius: 10, padding: 4 }}>
            <TabBtn id="overview" label="Overview" />
            <TabBtn id="users" label="Users" />
            <TabBtn id="plans" label="Plans" />
            <TabBtn id="health" label="Health" />
          </div>
        </div>
      </div>

      {aiInsight && (
        <div style={{ background: 'linear-gradient(135deg,#F5F3FF,#EDE9FE)', border: '1px solid #DDD6FE', borderRadius: 14, padding: '1.25rem 1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}><Sparkles size={16} color="#7C3AED" /><span style={{ fontWeight: 700, color: '#7C3AED', fontSize: '0.875rem' }}>AI Platform Insights</span></div>
          <p style={{ margin: 0, color: '#374151', fontSize: '0.875rem', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{aiInsight}</p>
        </div>
      )}

      {activeTab === 'overview' && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '1.25rem' }}>
            {[
              { title: 'Active Accounts', value: data.users.length, icon: Users, color: '#3B82F6', trend: '+2 today' },
              { title: 'System Generation', value: totalGen > 1000 ? `${(totalGen/1000).toFixed(1)} MWh` : `${totalGen.toFixed(0)} kWh`, icon: Zap, color: '#22C55E', trend: 'Optimal' },
              { title: 'Green Efficiency', value: `${greenPct}%`, icon: Sun, color: '#22C55E', trend: 'Target Hit' },
              { title: 'Carbon Offset', value: `${carbonOffset} kg`, icon: Leaf, color: '#22C55E', trend: '+124kg' },
              { title: 'Platform Revenue', value: `₹${totalRev.toLocaleString()}`, icon: Banknote, color: '#8B5CF6', trend: '+₹42k' },
            ].map(s => (
              <div key={s.title} style={{ background: '#fff', padding: '1.5rem', borderRadius: 14, border: '1px solid #E2E8F0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: `${s.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><s.icon size={20} color={s.color} /></div>
                  <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#22C55E', background: '#DCFCE7', padding: '2px 8px', borderRadius: 10 }}>{s.trend}</span>
                </div>
                <div style={{ color: '#64748B', fontSize: '0.75rem', fontWeight: 600, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.title}</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0F172A' }}>{s.value}</div>
              </div>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '1.5rem', minHeight: 480 }}>
            <div style={{ background: '#fff', padding: '1.5rem', borderRadius: 16, border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0, color: '#0F172A' }}>Gujarat Network Deployment</h3>
                <span style={{ fontSize: '0.75rem', color: '#64748B' }}>Real-time Node Status</span>
              </div>
              <div style={{ flex: 1, borderRadius: 12, overflow: 'hidden', border: '1px solid #E2E8F0' }}>
                <AhmedabadMap locations={data.locations} />
              </div>
            </div>
            <div style={{ background: '#fff', padding: '1.5rem', borderRadius: 16, border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0, color: '#0F172A' }}>Hardware Fleet Health</h3>
                <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#22C55E', background: '#DCFCE7', padding: '3px 8px', borderRadius: 6 }}>ALL SYSTEMS GO</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', overflowY: 'auto', flex: 1 }}>
                {data.devices.slice(0, 8).map(dev => (
                  <div key={dev.deviceId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.875rem 1rem', background: '#F8FAFC', borderRadius: 10, border: '1px solid #E2E8F0' }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#0F172A' }}>{dev.deviceId}</div>
                      <div style={{ fontSize: '0.75rem', color: '#64748B' }}>{dev.type} · {dev.firmware_version || 'v2.1'}</div>
                    </div>
                    <span style={{ fontSize: '0.65rem', fontWeight: 800, padding: '3px 8px', borderRadius: 6, background: dev.status === 'Online' ? '#DCFCE7' : '#FEE2E2', color: dev.status === 'Online' ? '#16A34A' : '#EF4444' }}>{dev.status.toUpperCase()}</span>
                  </div>
                ))}
                {data.devices.length === 0 && <div style={{ padding: '2rem', textAlign: 'center', color: '#94A3B8' }}>No devices found</div>}
              </div>
            </div>
          </div>
        </>
      )}

      {activeTab === 'users' && (
        <div style={{ background: '#fff', padding: '2rem', borderRadius: 16, border: '1px solid #E2E8F0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: '#0F172A' }}>Global Registry</h2>
              <p style={{ color: '#64748B', margin: '0.25rem 0 0 0', fontSize: '0.875rem' }}>Accounts, permissions, and organizational hierarchy</p>
            </div>
            <button onClick={() => setProvisionModal(true)} style={btnPrimary}><Plus size={16} />Provision New Account</button>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #E2E8F0' }}>
                  {['Identity', 'Authorization', 'Status', 'Operations'].map(h => (
                    <th key={h} style={{ padding: '1rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.users.slice(0, 12).map(u => (
                  <tr key={u._id || u.userId} style={{ borderBottom: '1px solid #F1F5F9' }}>
                    <td style={{ padding: '1rem' }}>
                      <div style={{ fontWeight: 700, color: '#0F172A', fontSize: '0.9rem' }}>{u.name}</div>
                      <div style={{ fontSize: '0.8rem', color: '#64748B' }}>{u.email}</div>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <span style={{ fontSize: '0.7rem', fontWeight: 800, padding: '3px 8px', background: u.role === 'Admin' ? '#EDE9FE' : u.role === 'Enterprise' ? '#DBEAFE' : '#DCFCE7', color: u.role === 'Admin' ? '#7C3AED' : u.role === 'Enterprise' ? '#2563EB' : '#16A34A', borderRadius: 6 }}>{u.role.toUpperCase()}</span>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem', fontWeight: 600, color: u.status === 'Active' ? '#22C55E' : '#EF4444' }}>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: u.status === 'Active' ? '#22C55E' : '#EF4444' }} />{u.status || 'Active'}
                      </div>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button onClick={() => setConfigModal(u)} style={{ padding: '0.4rem 0.9rem', background: '#EFF6FF', color: '#2563EB', border: '1px solid #BFDBFE', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: '0.8rem' }}>Config</button>
                        {u.role !== 'Admin' && (
                          <button onClick={() => updateUserStatus(u.userId, u.status === 'Active' ? 'Suspended' : 'Active')} style={{ padding: '0.4rem 0.9rem', background: u.status === 'Active' ? '#FEF2F2' : '#F0FDF4', color: u.status === 'Active' ? '#EF4444' : '#16A34A', border: `1px solid ${u.status === 'Active' ? '#FECACA' : '#BBF7D0'}`, borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: '0.8rem' }}>
                            {u.status === 'Active' ? 'Suspend' : 'Activate'}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {data.users.length === 0 && <tr><td colSpan={4} style={{ padding: '3rem', textAlign: 'center', color: '#94A3B8' }}>No users found</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'plans' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem' }}>
          {[
            { name: 'Solar Basic', price: '1499', cap: '3kW', color: '#64748B', features: ['Smart Meter', 'Mobile App Access', 'Basic Analytics'] },
            { name: 'Solar Premium', price: '2999', cap: '5kW', color: '#22C55E', features: ['Smart Meter', 'Battery Backup', 'AI Advisor', '5kW Inverter'] },
            { name: 'Solar Pro', price: '4999', cap: '10kW', color: '#3B82F6', features: ['Industrial Meter', '10kWh Battery', '24/7 Support', '10kW Inverter'] }
          ].map(p => (
            <div key={p.name} style={{ background: '#fff', padding: '2rem', borderRadius: 16, border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: '#0F172A' }}>{p.name}</h3>
                <span style={{ fontSize: '0.7rem', fontWeight: 800, padding: '3px 8px', borderRadius: 6, background: '#DCFCE7', color: '#16A34A' }}>ACTIVE</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                <span style={{ fontSize: '2.25rem', fontWeight: 900, color: '#0F172A' }}>₹{p.price}</span>
                <span style={{ color: '#64748B', fontWeight: 600 }}>/ month</span>
              </div>
              <div style={{ padding: '0.75rem', background: '#F8FAFC', borderRadius: 8, fontSize: '0.85rem', fontWeight: 700, textAlign: 'center', color: '#374151' }}>Capacity: {p.cap}</div>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.6rem', flex: 1 }}>
                {p.features.map(f => <li key={f} style={{ fontSize: '0.875rem', color: '#64748B' }}>• {f}</li>)}
              </ul>
              <button onClick={() => setPlanModal(p)} style={{ width: '100%', padding: '0.875rem', borderRadius: 10, border: '1.5px solid #E2E8F0', background: '#fff', fontWeight: 700, cursor: 'pointer', color: '#374151', fontSize: '0.875rem', transition: 'all 0.2s' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#22C55E'; e.currentTarget.style.color = '#16A34A'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = '#E2E8F0'; e.currentTarget.style.color = '#374151'; }}>
                Update Parameters
              </button>
            </div>
          ))}
          <div onClick={() => setPlanModal({ name: '', price: '', cap: '', features: [], isNew: true })} style={{ border: '2px dashed #E2E8F0', borderRadius: 16, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', padding: '2rem', gap: '1rem', minHeight: 200 }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#22C55E'; e.currentTarget.style.background = '#F0FDF4'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = '#E2E8F0'; e.currentTarget.style.background = 'transparent'; }}>
            <div style={{ width: 48, height: 48, borderRadius: '50%', border: '2px dashed #CBD5E1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', color: '#94A3B8' }}>+</div>
            <span style={{ color: '#64748B', fontWeight: 700 }}>Architect New Energy Plan</span>
          </div>
        </div>
      )}

      {activeTab === 'health' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
          <div style={{ background: '#fff', padding: '2rem', borderRadius: 16, border: '1px solid #E2E8F0' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: '0 0 2rem 0', color: '#0F172A' }}>Network Latency & Uptime</h3>
            <div style={{ textAlign: 'center', padding: '2rem 0' }}>
              <div style={{ fontSize: '4rem', fontWeight: 900, color: '#22C55E', letterSpacing: '-0.05em' }}>99.99%</div>
              <div style={{ color: '#64748B', fontWeight: 600, letterSpacing: '0.05em', fontSize: '0.875rem' }}>GLOBAL SYSTEM AVAILABILITY</div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem', background: '#F8FAFC', borderRadius: 10, marginTop: '1rem' }}>
              <span style={{ fontSize: '0.8rem', color: '#374151' }}><strong>Last Outage:</strong> None (30d)</span>
              <span style={{ fontSize: '0.8rem', color: '#374151' }}><strong>Avg Ping:</strong> 42ms</span>
            </div>
          </div>
          <div style={{ background: '#fff', padding: '2rem', borderRadius: 16, border: '1px solid #E2E8F0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0, color: '#0F172A' }}>Threat Intelligence</h3>
              <span style={{ fontSize: '0.7rem', fontWeight: 800, padding: '3px 8px', background: '#DCFCE7', color: '#16A34A', borderRadius: 6 }}>SECURE</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {[
                { icon: '🔒', title: 'Real-time Firewall Active', desc: 'Filtering 2.4k requests/sec. No malicious patterns in Ahmedabad Grid Zone.', color: '#F0FDF4', border: '#BBF7D0' },
                { icon: '⛓️', title: 'Blockchain Ledger Audit', desc: 'All 142k energy transactions verified against smart contract protocols. 100% integrity.', color: '#F8FAFC', border: '#E2E8F0' },
                { icon: '🛡️', title: 'SSL/TLS Encryption', desc: 'All API endpoints secured with TLS 1.3. Certificate valid until Dec 2026.', color: '#F8FAFC', border: '#E2E8F0' },
              ].map(item => (
                <div key={item.title} style={{ padding: '1rem', background: item.color, border: `1px solid ${item.border}`, borderRadius: 10, display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                  <span style={{ fontSize: '1.25rem' }}>{item.icon}</span>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.875rem', color: '#0F172A', marginBottom: 2 }}>{item.title}</div>
                    <div style={{ fontSize: '0.8rem', color: '#64748B' }}>{item.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Provision Modal */}
      <Modal open={provisionModal} onClose={() => setProvisionModal(false)} title="Provision New Account" width={520}>
        <form onSubmit={handleProvision} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div><label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Full Name</label><input required type="text" placeholder="Rahul Sharma" value={provisionForm.name} onChange={e => setProvisionForm({ ...provisionForm, name: e.target.value })} style={inputStyle} /></div>
            <div><label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Email</label><input required type="email" placeholder="user@example.com" value={provisionForm.email} onChange={e => setProvisionForm({ ...provisionForm, email: e.target.value })} style={inputStyle} /></div>
            <div><label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Password</label><input required type="password" placeholder="Min 8 characters" value={provisionForm.password} onChange={e => setProvisionForm({ ...provisionForm, password: e.target.value })} style={inputStyle} /></div>
            <div><label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Role</label>
              <select value={provisionForm.role} onChange={e => setProvisionForm({ ...provisionForm, role: e.target.value })} style={inputStyle}>
                <option value="Consumer">Consumer</option>
                <option value="Enterprise">Enterprise</option>
                <option value="Admin">Admin</option>
              </select>
            </div>
            <div style={{ gridColumn: 'span 2' }}><label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Phone</label><input type="text" placeholder="+91 98765 43210" value={provisionForm.phone} onChange={e => setProvisionForm({ ...provisionForm, phone: e.target.value })} style={inputStyle} /></div>
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
            <button type="button" onClick={() => setProvisionModal(false)} style={{ padding: '0.7rem 1.4rem', background: '#F1F5F9', color: '#374151', border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: 600 }}>Cancel</button>
            <button type="submit" disabled={provisioning} style={btnPrimary}>{provisioning ? 'Provisioning...' : 'Provision Account'}</button>
          </div>
        </form>
      </Modal>

      {/* Config User Modal */}
      <Modal open={!!configModal} onClose={() => setConfigModal(null)} title={`Configure: ${configModal?.name}`} width={460}>
        {configModal && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {[['Name', configModal.name], ['Email', configModal.email], ['Role', configModal.role], ['Status', configModal.status || 'Active'], ['User ID', configModal.userId]].map(([k, v]) => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem 1rem', background: '#F8FAFC', borderRadius: 10 }}>
                <span style={{ fontSize: '0.85rem', color: '#64748B', fontWeight: 600 }}>{k}</span>
                <span style={{ fontSize: '0.85rem', color: '#0F172A', fontWeight: 700 }}>{v}</span>
              </div>
            ))}
            {configModal.role !== 'Admin' && (
              <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                <button onClick={() => updateUserStatus(configModal.userId, 'Active')} style={{ flex: 1, padding: '0.75rem', background: '#F0FDF4', color: '#16A34A', border: '1px solid #BBF7D0', borderRadius: 10, cursor: 'pointer', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}><UserCheck size={16} />Activate</button>
                <button onClick={() => updateUserStatus(configModal.userId, 'Suspended')} style={{ flex: 1, padding: '0.75rem', background: '#FEF2F2', color: '#EF4444', border: '1px solid #FECACA', borderRadius: 10, cursor: 'pointer', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}><UserX size={16} />Suspend</button>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Plan Modal */}
      <Modal open={!!planModal} onClose={() => setPlanModal(null)} title={planModal?.isNew ? 'Architect New Energy Plan' : `Update: ${planModal?.name}`} width={480}>
        {planModal && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {planModal.isNew ? (
              <p style={{ margin: 0, color: '#374151', fontSize: '0.875rem', lineHeight: 1.6 }}>To create a new plan with full configuration, go to <strong>Energy Plans</strong> in the sidebar for the complete plan management interface.</p>
            ) : (
              <>
                <p style={{ margin: 0, color: '#374151', fontSize: '0.875rem', lineHeight: 1.6 }}>Update parameters for <strong>{planModal.name}</strong>. For full plan editing, use the dedicated Energy Plans page.</p>
                {[['Plan Name', planModal.name], ['Monthly Price', `₹${planModal.price}`], ['Capacity', planModal.cap]].map(([k, v]) => (
                  <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem 1rem', background: '#F8FAFC', borderRadius: 10 }}>
                    <span style={{ fontSize: '0.85rem', color: '#64748B', fontWeight: 600 }}>{k}</span>
                    <span style={{ fontSize: '0.85rem', color: '#0F172A', fontWeight: 700 }}>{v}</span>
                  </div>
                ))}
              </>
            )}
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
              <button onClick={() => setPlanModal(null)} style={{ padding: '0.7rem 1.4rem', background: '#F1F5F9', color: '#374151', border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: 600 }}>Close</button>
              <a href="/admin/plans" style={{ ...btnPrimary, textDecoration: 'none' }}>Go to Plans Manager</a>
            </div>
          </div>
        )}
      </Modal>

      <AIAdvisor mode="admin" title="Platform AI Advisor" context={`Platform: ${data.users.length} users, ${data.devices.length} devices, ${data.tickets.filter(t => t.status !== 'Resolved').length} open tickets, Revenue: ₹${totalRev.toLocaleString()}`} />
    </div>
  );
}
