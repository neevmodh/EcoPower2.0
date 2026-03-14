'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { UserCheck, UserX, Trash2, Plus, Search, Sparkles, Eye } from 'lucide-react';
import Modal from '@/components/Modal';
import AIAdvisor from '@/components/AIAdvisor';
import { groqChat } from '@/lib/groqClient';

const inputStyle = { padding: '0.75rem 1rem', borderRadius: 10, border: '1.5px solid #E2E8F0', outline: 'none', fontFamily: 'Inter, sans-serif', fontSize: '0.9rem', width: '100%', boxSizing: 'border-box', color: '#0F172A', background: '#F8FAFC' };
const btnPrimary = { padding: '0.7rem 1.4rem', background: '#22C55E', color: '#fff', border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: 700, fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: 6 };
const btnDanger = { padding: '0.4rem 0.9rem', background: '#FEF2F2', color: '#EF4444', border: '1px solid #FECACA', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: '0.8rem' };
const btnWarning = { padding: '0.4rem 0.9rem', background: '#FFFBEB', color: '#D97706', border: '1px solid #FDE68A', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: '0.8rem' };
const btnSuccess = { padding: '0.4rem 0.9rem', background: '#F0FDF4', color: '#16A34A', border: '1px solid #BBF7D0', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: '0.8rem' };

export default function UserManagement() {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');
  const [toast, setToast] = useState(null);
  const [addModal, setAddModal] = useState(false);
  const [viewModal, setViewModal] = useState(null);
  const [aiInsight, setAiInsight] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', password: '', role: 'Consumer', phone: '', companyName: '' });

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchUsers = async () => {
    try {
      const res = await fetch(`/api/users?userId=${user.userId}&role=${user.role}`);
      const data = await res.json();
      setUsers(Array.isArray(data) ? data : []);
    } catch { setUsers([]); } finally { setLoading(false); }
  };

  useEffect(() => { if (user) fetchUsers(); }, [user]);

  const updateStatus = async (id, newStatus) => {
    try {
      const res = await fetch(`/api/users/${id}/status`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: newStatus }) });
      if (res.ok) { fetchUsers(); showToast(`User ${newStatus.toLowerCase()} successfully`); }
      else showToast('Failed to update status', 'error');
    } catch { showToast('Network error', 'error'); }
  };

  const deleteUser = async (id) => {
    try {
      const res = await fetch(`/api/users/${id}`, { method: 'DELETE' });
      if (res.ok) { fetchUsers(); showToast('User deleted'); }
      else showToast('Failed to delete user', 'error');
    } catch { showToast('Network error', 'error'); }
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/users/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...formData, status: 'Active' }) });
      if (res.ok) {
        setAddModal(false);
        setFormData({ name: '', email: '', password: '', role: 'Consumer', phone: '', companyName: '' });
        fetchUsers();
        showToast('User created successfully');
      } else {
        const err = await res.json();
        showToast(err.message || 'Failed to create user', 'error');
      }
    } catch { showToast('Network error', 'error'); }
  };

  const getAIInsights = async () => {
    setAiLoading(true);
    try {
      const summary = { total: users.length, active: users.filter(u => u.status === 'Active').length, suspended: users.filter(u => u.status === 'Suspended').length, consumers: users.filter(u => u.role === 'Consumer').length, enterprises: users.filter(u => u.role === 'Enterprise').length };
      const reply = await groqChat({
        messages: [{ role: 'user', content: `Analyze this user base and give 3 actionable insights for growth and retention: ${JSON.stringify(summary)}` }],
        mode: 'analytics',
        context: `User stats: ${JSON.stringify(summary)}`
      });
      setAiInsight(reply || 'No insights available.');
    } catch (err) { setAiInsight(`Error: ${err.message}`); } finally { setAiLoading(false); }
  };

  const filtered = users.filter(u => {
    const matchSearch = u.name?.toLowerCase().includes(search.toLowerCase()) || u.email?.toLowerCase().includes(search.toLowerCase());
    const matchRole = roleFilter === 'All' || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  if (loading) return <div style={{ padding: '3rem', textAlign: 'center', color: '#64748B' }}>Loading users...</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', fontFamily: 'Inter, sans-serif' }}>
      {toast && (
        <div style={{ position: 'fixed', top: '1.5rem', right: '1.5rem', zIndex: 3000, padding: '0.875rem 1.5rem', borderRadius: 12, background: toast.type === 'error' ? '#EF4444' : '#22C55E', color: '#fff', fontWeight: 600, boxShadow: '0 8px 24px rgba(0,0,0,0.15)', fontSize: '0.875rem' }}>{toast.msg}</div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>User Management</h1>
          <p style={{ color: '#64748B', margin: '0.25rem 0 0 0', fontSize: '0.9rem' }}>{users.length} total accounts</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={getAIInsights} disabled={aiLoading} style={{ ...btnPrimary, background: '#7C3AED' }}>
            <Sparkles size={16} />{aiLoading ? 'Analyzing...' : 'AI Insights'}
          </button>
          <button onClick={() => setAddModal(true)} style={btnPrimary}>
            <Plus size={16} />Add User
          </button>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
        {[
          { label: 'Total Users', value: users.length, color: '#3B82F6' },
          { label: 'Active', value: users.filter(u => u.status === 'Active').length, color: '#22C55E' },
          { label: 'Suspended', value: users.filter(u => u.status === 'Suspended').length, color: '#EF4444' },
          { label: 'Enterprises', value: users.filter(u => u.role === 'Enterprise').length, color: '#8B5CF6' },
        ].map(s => (
          <div key={s.label} style={{ background: '#fff', padding: '1.25rem', borderRadius: 14, border: '1px solid #E2E8F0' }}>
            <div style={{ color: '#64748B', fontSize: '0.8rem', fontWeight: 600, marginBottom: 4 }}>{s.label}</div>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* AI Insight Panel */}
      {aiInsight && (
        <div style={{ background: 'linear-gradient(135deg,#F5F3FF,#EDE9FE)', border: '1px solid #DDD6FE', borderRadius: 14, padding: '1.25rem 1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <Sparkles size={16} color="#7C3AED" />
            <span style={{ fontWeight: 700, color: '#7C3AED', fontSize: '0.875rem' }}>AI User Insights</span>
          </div>
          <p style={{ margin: 0, color: '#374151', fontSize: '0.875rem', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{aiInsight}</p>
        </div>
      )}

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or email..." style={{ ...inputStyle, paddingLeft: '2.5rem' }} />
        </div>
        {['All', 'Consumer', 'Enterprise', 'Admin'].map(r => (
          <button key={r} onClick={() => setRoleFilter(r)} style={{ padding: '0.6rem 1.1rem', borderRadius: 8, border: '1.5px solid', borderColor: roleFilter === r ? '#22C55E' : '#E2E8F0', background: roleFilter === r ? '#F0FDF4' : '#fff', color: roleFilter === r ? '#16A34A' : '#64748B', fontWeight: 600, cursor: 'pointer', fontSize: '0.85rem' }}>{r}</button>
        ))}
      </div>

      {/* Table */}
      <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #E2E8F0', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
              {['User', 'Role', 'Contact', 'Status', 'Actions'].map(h => (
                <th key={h} style={{ padding: '1rem 1.25rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={5} style={{ padding: '3rem', textAlign: 'center', color: '#94A3B8' }}>No users found</td></tr>
            ) : filtered.map(u => (
              <tr key={u.userId} style={{ borderBottom: '1px solid #F1F5F9' }}>
                <td style={{ padding: '1rem 1.25rem' }}>
                  <div style={{ fontWeight: 700, color: '#0F172A', fontSize: '0.9rem' }}>{u.name}</div>
                  <div style={{ fontSize: '0.8rem', color: '#64748B' }}>{u.email}</div>
                </td>
                <td style={{ padding: '1rem 1.25rem' }}>
                  <span style={{ padding: '0.25rem 0.75rem', borderRadius: 20, fontSize: '0.75rem', fontWeight: 700, background: u.role === 'Admin' ? '#EDE9FE' : u.role === 'Enterprise' ? '#DBEAFE' : '#F0FDF4', color: u.role === 'Admin' ? '#7C3AED' : u.role === 'Enterprise' ? '#2563EB' : '#16A34A' }}>{u.role}</span>
                </td>
                <td style={{ padding: '1rem 1.25rem', fontSize: '0.85rem', color: '#64748B' }}>{u.companyName || u.phone || '—'}</td>
                <td style={{ padding: '1rem 1.25rem' }}>
                  <span style={{ padding: '0.25rem 0.75rem', borderRadius: 20, fontSize: '0.75rem', fontWeight: 700, background: u.status === 'Active' ? '#DCFCE7' : u.status === 'Pending' ? '#FEF3C7' : '#FEE2E2', color: u.status === 'Active' ? '#16A34A' : u.status === 'Pending' ? '#D97706' : '#EF4444' }}>{u.status}</span>
                </td>
                <td style={{ padding: '1rem 1.25rem' }}>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    <button onClick={() => setViewModal(u)} style={{ ...btnSuccess, background: '#EFF6FF', color: '#2563EB', borderColor: '#BFDBFE' }}><Eye size={13} /></button>
                    {u.status !== 'Active' && u.role !== 'Admin' && (
                      <button onClick={() => updateStatus(u.userId, 'Active')} style={btnSuccess}><UserCheck size={13} /> Activate</button>
                    )}
                    {u.status === 'Active' && u.role !== 'Admin' && (
                      <button onClick={() => updateStatus(u.userId, 'Suspended')} style={btnWarning}><UserX size={13} /> Suspend</button>
                    )}
                    {u.role !== 'Admin' && (
                      <button onClick={() => deleteUser(u.userId)} style={btnDanger}><Trash2 size={13} /></button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add User Modal */}
      <Modal open={addModal} onClose={() => setAddModal(false)} title="Add New User" width={520}>
        <form onSubmit={handleAddSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div><label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Full Name</label><input required type="text" placeholder="Rahul Sharma" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} style={inputStyle} /></div>
            <div><label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Email</label><input required type="email" placeholder="user@example.com" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} style={inputStyle} /></div>
            <div><label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Password</label><input required type="password" placeholder="Min 8 characters" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} style={inputStyle} /></div>
            <div><label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Role</label>
              <select value={formData.role} onChange={e => setFormData({ ...formData, role: e.target.value })} style={inputStyle}>
                <option value="Consumer">Consumer</option>
                <option value="Enterprise">Enterprise</option>
                <option value="Admin">Admin</option>
              </select>
            </div>
            <div><label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Phone</label><input type="text" placeholder="+91 98765 43210" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} style={inputStyle} /></div>
            {formData.role === 'Enterprise' && (
              <div><label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Company</label><input type="text" placeholder="Company Name" value={formData.companyName} onChange={e => setFormData({ ...formData, companyName: e.target.value })} style={inputStyle} /></div>
            )}
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
            <button type="button" onClick={() => setAddModal(false)} style={{ padding: '0.7rem 1.4rem', background: '#F1F5F9', color: '#374151', border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: 600 }}>Cancel</button>
            <button type="submit" style={btnPrimary}>Create User</button>
          </div>
        </form>
      </Modal>

      {/* View User Modal */}
      <Modal open={!!viewModal} onClose={() => setViewModal(null)} title="User Details" width={480}>
        {viewModal && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {[['Name', viewModal.name], ['Email', viewModal.email], ['Role', viewModal.role], ['Status', viewModal.status], ['Phone', viewModal.phone || '—'], ['Company', viewModal.companyName || '—'], ['User ID', viewModal.userId]].map(([k, v]) => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem 1rem', background: '#F8FAFC', borderRadius: 10 }}>
                <span style={{ fontSize: '0.85rem', color: '#64748B', fontWeight: 600 }}>{k}</span>
                <span style={{ fontSize: '0.85rem', color: '#0F172A', fontWeight: 700 }}>{v}</span>
              </div>
            ))}
          </div>
        )}
      </Modal>

      <AIAdvisor mode="admin" title="User Management AI" context={`Managing ${users.length} users: ${users.filter(u => u.status === 'Active').length} active, ${users.filter(u => u.role === 'Enterprise').length} enterprise`} />
    </div>
  );
}
