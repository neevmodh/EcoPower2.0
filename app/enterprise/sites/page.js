'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import Modal from '@/components/Modal';
import AIAdvisor from '@/components/AIAdvisor';
import { MapPin, Zap, Activity, CheckCircle, AlertTriangle, Edit2, Trash2, Plus, Search, TrendingUp } from 'lucide-react';

const SITE_TYPES = ['Manufacturing', 'Warehouse', 'Office', 'R&D', 'Data Center', 'Retail'];
const EMPTY_FORM = { name: '', area: '', site_type: '', capacity_kw: '', address: '' };

export default function MultiSiteMonitoring() {
  const { user } = useAuth();
  const [sites, setSites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [search, setSearch] = useState('');

  const fetchSites = async () => {
    try {
      const res = await fetch('/api/locations?userId=' + user.userId + '&role=' + user.role);
      const data = await res.json();
      const locs = Array.isArray(data) ? data : [];
      const enriched = locs.map((loc, i) => ({
        ...loc,
        generation: 200 + (i * 73) % 400,
        consumption: 300 + (i * 97) % 350,
        peakDemand: 50 + (i * 31) % 120,
        efficiency: 88 + (i % 10),
        monthlyCost: 30000 + (i * 7000) % 40000,
        status: i % 7 === 0 ? 'alert' : 'operational',
        site_type: SITE_TYPES[i % SITE_TYPES.length],
      }));
      setSites(enriched);
      if (enriched.length > 0) setSelected(enriched[0]);
    } catch (e) { setSites([]); } finally { setLoading(false); }
  };

  useEffect(() => { fetchSites(); }, [user]);

  const filtered = sites.filter(s =>
    (s.name || '').toLowerCase().includes(search.toLowerCase()) ||
    (s.area || '').toLowerCase().includes(search.toLowerCase())
  );

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Site name required';
    if (!form.area.trim()) e.area = 'Area required';
    if (!form.site_type) e.site_type = 'Type required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const openAdd = () => { setForm(EMPTY_FORM); setErrors({}); setModal('add'); };
  const openEdit = (s) => { setForm({ name: s.name || '', area: s.area || '', site_type: s.site_type || '', capacity_kw: s.capacity_kw || '', address: s.address_line1 || '' }); setSelected(s); setErrors({}); setModal('edit'); };
  const openDelete = (s) => { setSelected(s); setModal('delete'); };

  const handleSave = () => {
    if (!validate()) return;
    if (modal === 'add') {
      const newSite = { ...form, locationId: 'local-' + Date.now(), generation: 250, consumption: 320, peakDemand: 80, efficiency: 91, monthlyCost: 35000, status: 'operational' };
      setSites(prev => [...prev, newSite]);
    } else {
      setSites(prev => prev.map(s => s.locationId === selected.locationId ? { ...s, ...form } : s));
    }
    setModal(null);
  };

  const handleDelete = () => {
    setSites(prev => prev.filter(s => s.locationId !== selected.locationId));
    setModal(null);
  };

  const totalGen = sites.reduce((s, x) => s + x.generation, 0);
  const totalCons = sites.reduce((s, x) => s + x.consumption, 0);
  const totalCost = sites.reduce((s, x) => s + x.monthlyCost, 0);
  const avgEff = sites.length ? sites.reduce((s, x) => s + x.efficiency, 0) / sites.length : 0;
  const alerts = sites.filter(s => s.status === 'alert').length;
  const maxCons = Math.max(...sites.map(s => s.consumption), 1);

  const inp = (field, placeholder, type) => (
    <div>
      <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#374151', display: 'block', marginBottom: 5 }}>{placeholder}</label>
      <input type={type || 'text'} value={form[field]} onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))} placeholder={placeholder}
        style={{ width: '100%', padding: '0.75rem', border: '1.5px solid ' + (errors[field] ? '#ef4444' : '#e2e8f0'), borderRadius: 8, fontSize: '0.9rem', boxSizing: 'border-box' }} />
      {errors[field] && <div style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: 3 }}>{errors[field]}</div>}
    </div>
  );

  if (loading) return <div style={{ padding: '2rem', color: '#64748b' }}>Loading sites...</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, margin: 0 }}>Multi-Site Monitoring</h1>
          <p style={{ color: '#64748b', margin: '0.25rem 0 0 0' }}>Real-time monitoring across {sites.length} facilities</p>
        </div>
        <button onClick={openAdd} style={{ padding: '0.75rem 1.5rem', background: 'linear-gradient(135deg, #22C55E, #16a34a)', color: 'white', border: 'none', borderRadius: 10, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
          <Plus size={18} /> Add Site
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '1.25rem' }}>
        {[
          { label: 'Total Sites', value: sites.length, sub: alerts + ' alerts', color: '#3b82f6', icon: MapPin },
          { label: 'Fleet Generation', value: (totalGen/1000).toFixed(1) + ' MWh', sub: '+12% vs last month', color: '#f59e0b', icon: Zap },
          { label: 'Fleet Consumption', value: (totalCons/1000).toFixed(1) + ' MWh', sub: '-5% optimized', color: '#8b5cf6', icon: Activity },
          { label: 'Monthly Cost', value: '\u20b9' + (totalCost/1000).toFixed(0) + 'K', sub: '-8% savings', color: '#22C55E', icon: TrendingUp },
          { label: 'Avg Efficiency', value: avgEff.toFixed(1) + '%', sub: '+3% improved', color: '#10b981', icon: CheckCircle },
        ].map((s, i) => (
          <div key={i} className="glass-card" style={{ padding: '1.25rem' }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: s.color + '15', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.875rem' }}>
              <s.icon size={20} color={s.color} />
            </div>
            <div style={{ color: '#64748b', fontSize: '0.75rem', fontWeight: 600, marginBottom: 3 }}>{s.label}</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#0f172a', marginBottom: 2 }}>{s.value}</div>
            <div style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 600 }}>{s.sub}</div>
          </div>
        ))}
      </div>

      <div className="glass-card" style={{ padding: '1.75rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h3 style={{ fontWeight: 700, margin: 0 }}>Load Distribution by Site</h3>
          <span style={{ fontSize: '0.8rem', color: '#64748b' }}>kWh consumption</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.75rem', height: 160 }}>
          {sites.slice(0, 10).map((s, i) => (
            <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, cursor: 'pointer' }} onClick={() => setSelected(s)}>
              <div style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: 600 }}>{s.consumption.toFixed(0)}</div>
              <div style={{ width: '100%', height: ((s.consumption / maxCons) * 120) + 'px', background: s.status === 'alert' ? 'linear-gradient(to top, #f59e0b, #fbbf24)' : selected && selected.locationId === s.locationId ? 'linear-gradient(to top, #22C55E, #4ade80)' : 'linear-gradient(to top, #3b82f6, #60a5fa)', borderRadius: '5px 5px 0 0', minHeight: 16, transition: 'all 0.2s' }} />
              <div style={{ fontSize: '0.65rem', color: '#94a3b8', fontWeight: 600, textAlign: 'center', maxWidth: 60, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{(s.name || '').split(' ')[0]}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="glass-card" style={{ padding: '1.75rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h3 style={{ fontWeight: 700, margin: 0 }}>All Sites</h3>
          <div style={{ position: 'relative' }}>
            <Search size={15} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search sites..."
              style={{ paddingLeft: 32, paddingRight: 12, paddingTop: 7, paddingBottom: 7, border: '1.5px solid #e2e8f0', borderRadius: 8, fontSize: '0.875rem', width: 200 }} />
          </div>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #f1f5f9' }}>
                {['SITE', 'TYPE', 'GENERATION', 'CONSUMPTION', 'EFFICIENCY', 'COST/MO', 'STATUS', 'ACTIONS'].map(h => (
                  <th key={h} style={{ padding: '0.75rem 1rem', color: '#64748b', fontWeight: 700, fontSize: '0.72rem', textAlign: 'left', letterSpacing: '0.04em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(s => (
                <tr key={s.locationId} onClick={() => setSelected(s)}
                  style={{ borderBottom: '1px solid #f8fafc', cursor: 'pointer', background: selected && selected.locationId === s.locationId ? '#f0fdf4' : 'white', transition: 'background 0.15s' }}>
                  <td style={{ padding: '0.875rem 1rem' }}>
                    <div style={{ fontWeight: 700 }}>{s.name}</div>
                    <div style={{ fontSize: '0.78rem', color: '#64748b' }}>{s.area || s.city}</div>
                  </td>
                  <td style={{ padding: '0.875rem 1rem' }}>
                    <span style={{ padding: '0.25rem 0.75rem', borderRadius: 20, fontSize: '0.75rem', fontWeight: 600, background: '#f1f5f9', color: '#475569' }}>{s.site_type}</span>
                  </td>
                  <td style={{ padding: '0.875rem 1rem', fontWeight: 600, fontSize: '0.875rem' }}>{s.generation.toFixed(0)} kWh</td>
                  <td style={{ padding: '0.875rem 1rem', fontWeight: 600, fontSize: '0.875rem' }}>{s.consumption.toFixed(0)} kWh</td>
                  <td style={{ padding: '0.875rem 1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{ flex: 1, height: 6, background: '#f1f5f9', borderRadius: 3, overflow: 'hidden' }}>
                        <div style={{ width: s.efficiency + '%', height: '100%', background: s.efficiency > 90 ? '#22C55E' : s.efficiency > 80 ? '#f59e0b' : '#ef4444', borderRadius: 3 }} />
                      </div>
                      <span style={{ fontSize: '0.8rem', fontWeight: 700 }}>{s.efficiency}%</span>
                    </div>
                  </td>
                  <td style={{ padding: '0.875rem 1rem', fontWeight: 700 }}>\u20b9{(s.monthlyCost/1000).toFixed(1)}K</td>
                  <td style={{ padding: '0.875rem 1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: s.status === 'operational' ? '#22C55E' : '#f59e0b' }}>
                      {s.status === 'operational' ? <CheckCircle size={14} /> : <AlertTriangle size={14} />}
                      <span style={{ fontSize: '0.8rem', fontWeight: 600, textTransform: 'capitalize' }}>{s.status}</span>
                    </div>
                  </td>
                  <td style={{ padding: '0.875rem 1rem' }}>
                    <div style={{ display: 'flex', gap: 5 }}>
                      <button onClick={e => { e.stopPropagation(); openEdit(s); }} style={{ padding: '0.35rem 0.75rem', background: '#f1f5f9', border: 'none', borderRadius: 6, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.78rem', fontWeight: 600 }}>
                        <Edit2 size={12} /> Edit
                      </button>
                      <button onClick={e => { e.stopPropagation(); openDelete(s); }} style={{ padding: '0.35rem 0.6rem', background: '#fef2f2', border: 'none', borderRadius: 6, cursor: 'pointer', color: '#ef4444' }}>
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selected && (
        <div style={{ padding: '2rem', background: 'linear-gradient(135deg, #0f172a, #1e293b)', borderRadius: 16, color: 'white' }}>
          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{ fontSize: '0.75rem', opacity: 0.6, letterSpacing: '0.08em', marginBottom: 4 }}>SELECTED SITE</div>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 900, margin: 0 }}>{selected.name}</h2>
            <p style={{ opacity: 0.7, margin: '0.25rem 0 0 0', fontSize: '0.9rem' }}>{selected.area || selected.city} \u2022 {selected.site_type}</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem' }}>
            {[['Generation', selected.generation.toFixed(0) + ' kWh'], ['Consumption', selected.consumption.toFixed(0) + ' kWh'], ['Peak Demand', selected.peakDemand.toFixed(0) + ' kW'], ['Daily Cost', '\u20b9' + (selected.monthlyCost / 30).toFixed(0)]].map(([k, v]) => (
              <div key={k}>
                <div style={{ fontSize: '0.8rem', opacity: 0.6, marginBottom: 4 }}>{k}</div>
                <div style={{ fontSize: '1.75rem', fontWeight: 900 }}>{v}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {(modal === 'add' || modal === 'edit') && (
        <Modal title={modal === 'add' ? 'Add New Site' : 'Edit Site'} onClose={() => setModal(null)}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {inp('name', 'Site Name')}
            {inp('area', 'Area / Locality')}
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#374151', display: 'block', marginBottom: 5 }}>Site Type</label>
              <select value={form.site_type} onChange={e => setForm(f => ({ ...f, site_type: e.target.value }))}
                style={{ width: '100%', padding: '0.75rem', border: '1.5px solid ' + (errors.site_type ? '#ef4444' : '#e2e8f0'), borderRadius: 8, fontSize: '0.9rem' }}>
                <option value="">Select Type</option>
                {SITE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              {errors.site_type && <div style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: 3 }}>{errors.site_type}</div>}
            </div>
            {inp('capacity_kw', 'Solar Capacity (kW)', 'number')}
            {inp('address', 'Address')}
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
              <button onClick={() => setModal(null)} style={{ flex: 1, padding: '0.875rem', background: '#f1f5f9', border: 'none', borderRadius: 10, fontWeight: 700, cursor: 'pointer' }}>Cancel</button>
              <button onClick={handleSave} style={{ flex: 1, padding: '0.875rem', background: 'linear-gradient(135deg, #22C55E, #16a34a)', color: 'white', border: 'none', borderRadius: 10, fontWeight: 800, cursor: 'pointer' }}>
                {modal === 'add' ? 'Add Site' : 'Save Changes'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {modal === 'delete' && (
        <Modal title="Remove Site" onClose={() => setModal(null)}>
          <div style={{ textAlign: 'center', padding: '0.5rem 0' }}>
            <Trash2 size={48} color="#ef4444" style={{ marginBottom: '1rem' }} />
            <p style={{ color: '#475569', marginBottom: '1.5rem' }}>Remove <strong>{selected && selected.name}</strong>? All associated data will be archived.</p>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button onClick={() => setModal(null)} style={{ flex: 1, padding: '0.875rem', background: '#f1f5f9', border: 'none', borderRadius: 10, fontWeight: 700, cursor: 'pointer' }}>Cancel</button>
              <button onClick={handleDelete} style={{ flex: 1, padding: '0.875rem', background: '#ef4444', color: 'white', border: 'none', borderRadius: 10, fontWeight: 800, cursor: 'pointer' }}>Remove Site</button>
            </div>
          </div>
        </Modal>
      )}

      <AIAdvisor />
    </div>
  );
}
