'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import Modal from '@/components/Modal';
import AIAdvisor from '@/components/AIAdvisor';
import { Users, UserPlus, Shield, Mail, Phone, Building2, CheckCircle, XCircle, Edit2, Trash2, Search } from 'lucide-react';

const ROLES = ['Admin', 'Manager', 'Analyst', 'Technician'];
const DEPTS = ['Operations', 'Energy Management', 'Analytics', 'Maintenance', 'Finance', 'IT'];
const ROLE_COLORS = { Admin: '#ef4444', Manager: '#3b82f6', Analyst: '#8b5cf6', Technician: '#22C55E' };
const ROLE_PERMS = {
  Admin: ['Full System Access', 'Manage Team', 'Manage Billing', 'View All Sites', 'Export Data'],
  Manager: ['View All Sites', 'View Reports', 'Manage Alerts', 'Export Data'],
  Analyst: ['View Reports', 'Export Data', 'View Analytics'],
  Technician: ['View Assigned Sites', 'Update Device Status', 'View Maintenance Logs'],
};

const SEED = [
  { id: 1, name: 'Vikram Patel', email: 'vikram@techcorp.in', phone: '+91 98765 43210', role: 'Admin', department: 'Operations', status: 'Active', lastLogin: '2 hours ago' },
  { id: 2, name: 'Priya Sharma', email: 'priya.sharma@techcorp.in', phone: '+91 98765 43211', role: 'Manager', department: 'Energy Management', status: 'Active', lastLogin: '5 hours ago' },
  { id: 3, name: 'Rajesh Kumar', email: 'rajesh.k@techcorp.in', phone: '+91 98765 43212', role: 'Analyst', department: 'Analytics', status: 'Active', lastLogin: '1 day ago' },
  { id: 4, name: 'Anita Desai', email: 'anita.d@techcorp.in', phone: '+91 98765 43213', role: 'Technician', department: 'Maintenance', status: 'Inactive', lastLogin: '3 days ago' },
];

const EMPTY_FORM = { name: '', email: '', phone: '', role: '', department: '' };

export default function TeamManagement() {
  const { user } = useAuth();
  const [members, setMembers] = useState(SEED);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(null); // null | 'add' | 'edit' | 'delete'
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});

  const filtered = members.filter(m =>
    m.name.toLowerCase().includes(search.toLowerCase()) ||
    m.email.toLowerCase().includes(search.toLowerCase()) ||
    m.department.toLowerCase().includes(search.toLowerCase())
  );

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Name required';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Valid email required';
    if (!form.role) e.role = 'Role required';
    if (!form.department) e.department = 'Department required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const openAdd = () => { setForm(EMPTY_FORM); setErrors({}); setModal('add'); };
  const openEdit = (m) => { setSelected(m); setForm({ name: m.name, email: m.email, phone: m.phone, role: m.role, department: m.department }); setErrors({}); setModal('edit'); };
  const openDelete = (m) => { setSelected(m); setModal('delete'); };

  const handleSave = () => {
    if (!validate()) return;
    if (modal === 'add') {
      setMembers(prev => [...prev, { ...form, id: Date.now(), status: 'Active', lastLogin: 'Just now' }]);
    } else {
      setMembers(prev => prev.map(m => m.id === selected.id ? { ...m, ...form } : m));
    }
    setModal(null);
  };

  const handleDelete = () => {
    setMembers(prev => prev.filter(m => m.id !== selected.id));
    setModal(null);
  };

  const toggleStatus = (id) => {
    setMembers(prev => prev.map(m => m.id === id ? { ...m, status: m.status === 'Active' ? 'Inactive' : 'Active' } : m));
  };

  const active = members.filter(m => m.status === 'Active').length;
  const depts = [...new Set(members.map(m => m.department))].length;

  const inp = (field, placeholder, type = 'text') => (
    <div>
      <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#374151', display: 'block', marginBottom: 5 }}>{placeholder}</label>
      <input type={type} value={form[field]} onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))} placeholder={placeholder}
        style={{ width: '100%', padding: '0.75rem', border: `1.5px solid ${errors[field] ? '#ef4444' : '#e2e8f0'}`, borderRadius: 8, fontSize: '0.9rem', boxSizing: 'border-box' }} />
      {errors[field] && <div style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: 3 }}>{errors[field]}</div>}
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, margin: 0 }}>Team Management</h1>
          <p style={{ color: '#64748b', margin: '0.25rem 0 0 0' }}>Manage multi-user access and role-based permissions</p>
        </div>
        <button onClick={openAdd}
          style={{ padding: '0.75rem 1.5rem', background: 'linear-gradient(135deg, #22C55E, #16a34a)', color: 'white', border: 'none', borderRadius: 10, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
          <UserPlus size={18} /> Add Member
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem' }}>
        {[
          { label: 'Total Members', value: members.length, icon: Users, color: '#3b82f6' },
          { label: 'Active Users', value: active, icon: CheckCircle, color: '#22C55E' },
          { label: 'Departments', value: depts, icon: Building2, color: '#8b5cf6' },
          { label: 'Roles Defined', value: ROLES.length, icon: Shield, color: '#f59e0b' },
        ].map((s, i) => (
          <div key={i} className="glass-card" style={{ padding: '1.5rem' }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: `${s.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
              <s.icon size={22} color={s.color} />
            </div>
            <div style={{ color: '#64748b', fontSize: '0.8rem', fontWeight: 600, marginBottom: 4 }}>{s.label}</div>
            <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#0f172a' }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Search + Table */}
      <div className="glass-card" style={{ padding: '1.75rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h3 style={{ fontWeight: 700, margin: 0 }}>Team Members ({filtered.length})</h3>
          <div style={{ position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search members..."
              style={{ paddingLeft: 34, paddingRight: 12, paddingTop: 8, paddingBottom: 8, border: '1.5px solid #e2e8f0', borderRadius: 8, fontSize: '0.875rem', width: 220 }} />
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #f1f5f9' }}>
                {['MEMBER', 'ROLE', 'DEPARTMENT', 'STATUS', 'LAST LOGIN', 'ACTIONS'].map(h => (
                  <th key={h} style={{ padding: '0.875rem 1rem', color: '#64748b', fontWeight: 700, fontSize: '0.75rem', textAlign: 'left', letterSpacing: '0.04em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(m => (
                <tr key={m.id} style={{ borderBottom: '1px solid #f8fafc' }}>
                  <td style={{ padding: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
                      <div style={{ width: 42, height: 42, borderRadius: '50%', background: `${ROLE_COLORS[m.role]}20`, color: ROLE_COLORS[m.role], display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.875rem', flexShrink: 0 }}>
                        {m.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '0.9375rem' }}>{m.name}</div>
                        <div style={{ fontSize: '0.8rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: 4 }}><Mail size={11} />{m.email}</div>
                        {m.phone && <div style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 4 }}><Phone size={11} />{m.phone}</div>}
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <span style={{ padding: '0.3rem 0.875rem', borderRadius: 20, fontSize: '0.78rem', fontWeight: 700, background: `${ROLE_COLORS[m.role]}15`, color: ROLE_COLORS[m.role] }}>{m.role}</span>
                  </td>
                  <td style={{ padding: '1rem', fontWeight: 600, fontSize: '0.875rem' }}>{m.department}</td>
                  <td style={{ padding: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: m.status === 'Active' ? '#22C55E' : '#94a3b8' }}>
                      {m.status === 'Active' ? <CheckCircle size={15} /> : <XCircle size={15} />}
                      <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{m.status}</span>
                    </div>
                  </td>
                  <td style={{ padding: '1rem', fontSize: '0.85rem', color: '#64748b' }}>{m.lastLogin}</td>
                  <td style={{ padding: '1rem' }}>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button onClick={() => openEdit(m)} style={{ padding: '0.4rem 0.75rem', background: '#f1f5f9', border: 'none', borderRadius: 7, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.8rem', fontWeight: 600 }}>
                        <Edit2 size={13} /> Edit
                      </button>
                      <button onClick={() => toggleStatus(m.id)}
                        style={{ padding: '0.4rem 0.75rem', background: m.status === 'Active' ? '#fef3c7' : '#f0fdf4', border: 'none', borderRadius: 7, cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600, color: m.status === 'Active' ? '#d97706' : '#16a34a' }}>
                        {m.status === 'Active' ? 'Suspend' : 'Activate'}
                      </button>
                      <button onClick={() => openDelete(m)} style={{ padding: '0.4rem 0.75rem', background: '#fef2f2', border: 'none', borderRadius: 7, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.8rem', fontWeight: 600, color: '#ef4444' }}>
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

      {/* Role Permissions */}
      <div className="glass-card" style={{ padding: '1.75rem' }}>
        <h3 style={{ fontWeight: 700, margin: '0 0 1.5rem 0' }}>Role-Based Permissions</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
          {ROLES.map(role => (
            <div key={role} style={{ padding: '1.25rem', border: `2px solid ${ROLE_COLORS[role]}25`, borderRadius: 12, background: 'white' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '1rem' }}>
                <Shield size={18} color={ROLE_COLORS[role]} />
                <span style={{ fontWeight: 800, color: ROLE_COLORS[role] }}>{role}</span>
                <span style={{ marginLeft: 'auto', fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8' }}>{members.filter(m => m.role === role).length} users</span>
              </div>
              {ROLE_PERMS[role].map((p, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8rem', color: '#475569', marginBottom: 5 }}>
                  <CheckCircle size={13} color={ROLE_COLORS[role]} />{p}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Add/Edit Modal */}
      {(modal === 'add' || modal === 'edit') && (
        <Modal title={modal === 'add' ? 'Add Team Member' : 'Edit Team Member'} onClose={() => setModal(null)}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {inp('name', 'Full Name')}
            {inp('email', 'Email Address', 'email')}
            {inp('phone', 'Phone Number', 'tel')}
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#374151', display: 'block', marginBottom: 5 }}>Role</label>
              <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
                style={{ width: '100%', padding: '0.75rem', border: `1.5px solid ${errors.role ? '#ef4444' : '#e2e8f0'}`, borderRadius: 8, fontSize: '0.9rem' }}>
                <option value="">Select Role</option>
                {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
              {errors.role && <div style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: 3 }}>{errors.role}</div>}
            </div>
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#374151', display: 'block', marginBottom: 5 }}>Department</label>
              <select value={form.department} onChange={e => setForm(f => ({ ...f, department: e.target.value }))}
                style={{ width: '100%', padding: '0.75rem', border: `1.5px solid ${errors.department ? '#ef4444' : '#e2e8f0'}`, borderRadius: 8, fontSize: '0.9rem' }}>
                <option value="">Select Department</option>
                {DEPTS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
              {errors.department && <div style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: 3 }}>{errors.department}</div>}
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
              <button onClick={() => setModal(null)} style={{ flex: 1, padding: '0.875rem', background: '#f1f5f9', border: 'none', borderRadius: 10, fontWeight: 700, cursor: 'pointer' }}>Cancel</button>
              <button onClick={handleSave} style={{ flex: 1, padding: '0.875rem', background: 'linear-gradient(135deg, #22C55E, #16a34a)', color: 'white', border: 'none', borderRadius: 10, fontWeight: 800, cursor: 'pointer' }}>
                {modal === 'add' ? 'Add Member' : 'Save Changes'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Delete Confirm */}
      {modal === 'delete' && (
        <Modal title="Remove Team Member" onClose={() => setModal(null)}>
          <div style={{ textAlign: 'center', padding: '0.5rem 0' }}>
            <Trash2 size={48} color="#ef4444" style={{ marginBottom: '1rem' }} />
            <p style={{ color: '#475569', marginBottom: '1.5rem' }}>Remove <strong>{selected?.name}</strong> from the team? This action cannot be undone.</p>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button onClick={() => setModal(null)} style={{ flex: 1, padding: '0.875rem', background: '#f1f5f9', border: 'none', borderRadius: 10, fontWeight: 700, cursor: 'pointer' }}>Cancel</button>
              <button onClick={handleDelete} style={{ flex: 1, padding: '0.875rem', background: '#ef4444', color: 'white', border: 'none', borderRadius: 10, fontWeight: 800, cursor: 'pointer' }}>Remove</button>
            </div>
          </div>
        </Modal>
      )}

      <AIAdvisor />
    </div>
  );
}
