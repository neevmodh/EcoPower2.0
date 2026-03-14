'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Plus, Edit2, Trash2, Zap, Battery } from 'lucide-react';
import Modal from '@/components/Modal';
import AIAdvisor from '@/components/AIAdvisor';

const inputStyle = { padding: '0.75rem 1rem', borderRadius: 10, border: '1.5px solid #E2E8F0', outline: 'none', fontFamily: 'Inter, sans-serif', fontSize: '0.9rem', width: '100%', boxSizing: 'border-box', color: '#0F172A', background: '#F8FAFC' };
const btnPrimary = { padding: '0.7rem 1.4rem', background: '#22C55E', color: '#fff', border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: 700, fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: 6 };

const emptyForm = { planId: '', name: '', description: '', targetAudience: 'Consumer', basePrice: '', includedSolarKw: '', includedBatteryKwh: '' };

export default function PlansManagement() {
  const { user } = useAuth();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createModal, setCreateModal] = useState(false);
  const [editModal, setEditModal] = useState(null);
  const [deleteModal, setDeleteModal] = useState(null);
  const [formData, setFormData] = useState(emptyForm);
  const [toast, setToast] = useState(null);
  const [saving, setSaving] = useState(false);

  const showToast = (msg, type = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000); };

  const fetchPlans = async () => {
    try {
      const res = await fetch('/api/plans');
      const data = await res.json();
      setPlans(Array.isArray(data) ? data : []);
    } catch { setPlans([]); } finally { setLoading(false); }
  };

  useEffect(() => { if (user) fetchPlans(); }, [user]);

  const handleCreate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/plans', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...formData, basePrice: Number(formData.basePrice), includedSolarKw: Number(formData.includedSolarKw), includedBatteryKwh: Number(formData.includedBatteryKwh) }) });
      if (res.ok) { setCreateModal(false); setFormData(emptyForm); fetchPlans(); showToast('Plan created successfully'); }
      else { const err = await res.json(); showToast(err.message || 'Failed to create plan', 'error'); }
    } catch { showToast('Network error', 'error'); } finally { setSaving(false); }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(`/api/plans/${editModal.planId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...formData, basePrice: Number(formData.basePrice), includedSolarKw: Number(formData.includedSolarKw), includedBatteryKwh: Number(formData.includedBatteryKwh) }) });
      if (res.ok) { setEditModal(null); setFormData(emptyForm); fetchPlans(); showToast('Plan updated successfully'); }
      else showToast('Failed to update plan', 'error');
    } catch { showToast('Network error', 'error'); } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    try {
      const res = await fetch(`/api/plans/${deleteModal.planId}`, { method: 'DELETE' });
      if (res.ok) { setDeleteModal(null); fetchPlans(); showToast('Plan deleted'); }
      else showToast('Failed to delete plan', 'error');
    } catch { showToast('Network error', 'error'); }
  };

  const openEdit = (plan) => {
    setFormData({ planId: plan.planId, name: plan.name, description: plan.description || '', targetAudience: plan.targetAudience, basePrice: plan.basePrice, includedSolarKw: plan.includedSolarKw, includedBatteryKwh: plan.includedBatteryKwh });
    setEditModal(plan);
  };

  const PlanForm = ({ onSubmit, submitLabel }) => (
    <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <div><label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Plan ID</label><input required type="text" placeholder="PLAN-C-03" value={formData.planId} onChange={e => setFormData({ ...formData, planId: e.target.value })} style={inputStyle} disabled={!!editModal} /></div>
        <div><label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Plan Name</label><input required type="text" placeholder="Solar Premium" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} style={inputStyle} /></div>
        <div><label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Target Audience</label>
          <select value={formData.targetAudience} onChange={e => setFormData({ ...formData, targetAudience: e.target.value })} style={inputStyle}>
            <option value="Consumer">Consumer</option>
            <option value="Enterprise">Enterprise</option>
          </select>
        </div>
        <div><label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Monthly Price (₹)</label><input required type="number" placeholder="2999" value={formData.basePrice} onChange={e => setFormData({ ...formData, basePrice: e.target.value })} style={inputStyle} /></div>
        <div><label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Solar Capacity (kW)</label><input required type="number" placeholder="10" value={formData.includedSolarKw} onChange={e => setFormData({ ...formData, includedSolarKw: e.target.value })} style={inputStyle} /></div>
        <div><label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Battery Storage (kWh)</label><input required type="number" placeholder="15" value={formData.includedBatteryKwh} onChange={e => setFormData({ ...formData, includedBatteryKwh: e.target.value })} style={inputStyle} /></div>
      </div>
      <div><label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Description</label><input type="text" placeholder="Plan description..." value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} style={inputStyle} /></div>
      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
        <button type="button" onClick={() => { setCreateModal(false); setEditModal(null); setFormData(emptyForm); }} style={{ padding: '0.7rem 1.4rem', background: '#F1F5F9', color: '#374151', border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: 600 }}>Cancel</button>
        <button type="submit" disabled={saving} style={btnPrimary}>{saving ? 'Saving...' : submitLabel}</button>
      </div>
    </form>
  );

  if (loading) return <div style={{ padding: '3rem', textAlign: 'center', color: '#64748B' }}>Loading plans...</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', fontFamily: 'Inter, sans-serif' }}>
      {toast && <div style={{ position: 'fixed', top: '1.5rem', right: '1.5rem', zIndex: 3000, padding: '0.875rem 1.5rem', borderRadius: 12, background: toast.type === 'error' ? '#EF4444' : '#22C55E', color: '#fff', fontWeight: 600, boxShadow: '0 8px 24px rgba(0,0,0,0.15)', fontSize: '0.875rem' }}>{toast.msg}</div>}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>Energy Plan Management</h1>
          <p style={{ color: '#64748B', margin: '0.25rem 0 0 0', fontSize: '0.9rem' }}>{plans.length} active plans</p>
        </div>
        <button onClick={() => { setFormData(emptyForm); setCreateModal(true); }} style={btnPrimary}><Plus size={16} />New Plan</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
        {/* PAYG System Plan (read-only) */}
        <div style={{ background: '#fff', border: '2px solid #8B5CF6', borderRadius: 16, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '1.5rem', background: 'linear-gradient(135deg,#EDE9FE,#DDD6FE)', borderBottom: '1px solid #E2E8F0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#7C3AED', textTransform: 'uppercase', letterSpacing: '0.05em' }}>SYSTEM PLAN</span>
              <span style={{ fontSize: '0.65rem', fontWeight: 800, background: '#7C3AED', color: 'white', padding: '2px 8px', borderRadius: 10 }}>BUILT-IN</span>
            </div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0F172A', margin: '0 0 4px 0' }}>Pay As You Use</h3>
            <div style={{ fontSize: '2rem', fontWeight: 900, color: '#7C3AED' }}>₹6.5<span style={{ fontSize: '0.9rem', color: '#64748B', fontWeight: 400 }}>/kWh</span></div>
          </div>
          <div style={{ padding: '1.25rem', flex: 1 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ fontSize: '0.875rem', color: '#374151' }}>✓ No fixed monthly fee</div>
              <div style={{ fontSize: '0.875rem', color: '#374151' }}>✓ Pay only for energy consumed</div>
              <div style={{ fontSize: '0.875rem', color: '#374151' }}>✓ No lock-in period</div>
              <div style={{ fontSize: '0.875rem', color: '#374151' }}>✓ Real-time usage tracking</div>
            </div>
          </div>
          <div style={{ padding: '1rem', borderTop: '1px solid #F1F5F9', textAlign: 'center' }}>
            <span style={{ fontSize: '0.75rem', color: '#94A3B8', fontWeight: 600 }}>System-managed · Cannot be deleted</span>
          </div>
        </div>

        {plans.map(plan => (
          <div key={plan.planId} style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 16, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '1.5rem', background: plan.targetAudience === 'Enterprise' ? 'linear-gradient(135deg,#EDE9FE,#DDD6FE)' : 'linear-gradient(135deg,#DCFCE7,#BBF7D0)', borderBottom: '1px solid #E2E8F0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ fontSize: '0.7rem', fontWeight: 800, color: plan.targetAudience === 'Enterprise' ? '#7C3AED' : '#16A34A', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{plan.targetAudience}</span>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button onClick={() => openEdit(plan)} style={{ padding: '0.3rem 0.6rem', background: '#fff', border: '1px solid #E2E8F0', borderRadius: 6, cursor: 'pointer', color: '#374151' }}><Edit2 size={13} /></button>
                  <button onClick={() => setDeleteModal(plan)} style={{ padding: '0.3rem 0.6rem', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 6, cursor: 'pointer', color: '#EF4444' }}><Trash2 size={13} /></button>
                </div>
              </div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0F172A', margin: '0 0 4px 0' }}>{plan.name}</h3>
              <div style={{ fontSize: '2rem', fontWeight: 900, color: plan.targetAudience === 'Enterprise' ? '#7C3AED' : '#16A34A' }}>₹{plan.basePrice?.toLocaleString()}<span style={{ fontSize: '0.9rem', color: '#64748B', fontWeight: 400 }}>/mo</span></div>
            </div>
            <div style={{ padding: '1.25rem', flex: 1 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.875rem', color: '#374151' }}><Zap size={15} color="#F59E0B" />{plan.includedSolarKw} kW Solar Array</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.875rem', color: '#374151' }}><Battery size={15} color="#3B82F6" />{plan.includedBatteryKwh} kWh Battery Storage</div>
                {plan.features?.map((f, i) => <div key={i} style={{ fontSize: '0.875rem', color: '#64748B' }}>✓ {f}</div>)}
              </div>
            </div>
            <div style={{ padding: '1rem', borderTop: '1px solid #F1F5F9', textAlign: 'center' }}>
              <span style={{ fontSize: '0.75rem', color: '#94A3B8', fontWeight: 600 }}>ID: {plan.planId}</span>
            </div>
          </div>
        ))}

        {/* Create New Card */}
        <div onClick={() => { setFormData(emptyForm); setCreateModal(true); }} style={{ border: '2px dashed #E2E8F0', borderRadius: 16, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', padding: '3rem', gap: '1rem', minHeight: 200, transition: 'all 0.2s' }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = '#22C55E'; e.currentTarget.style.background = '#F0FDF4'; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = '#E2E8F0'; e.currentTarget.style.background = 'transparent'; }}>
          <div style={{ width: 48, height: 48, borderRadius: '50%', border: '2px dashed #CBD5E1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Plus size={20} color="#94A3B8" /></div>
          <span style={{ color: '#64748B', fontWeight: 700, fontSize: '0.9rem' }}>Architect New Energy Plan</span>
        </div>
      </div>

      <Modal open={createModal} onClose={() => { setCreateModal(false); setFormData(emptyForm); }} title="Create New Plan" width={560}>
        <PlanForm onSubmit={handleCreate} submitLabel="Create Plan" />
      </Modal>

      <Modal open={!!editModal} onClose={() => { setEditModal(null); setFormData(emptyForm); }} title={`Edit Plan: ${editModal?.name}`} width={560}>
        <PlanForm onSubmit={handleUpdate} submitLabel="Update Plan" />
      </Modal>

      <Modal open={!!deleteModal} onClose={() => setDeleteModal(null)} title="Delete Plan" width={420}>
        {deleteModal && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <p style={{ margin: 0, color: '#374151', lineHeight: 1.6 }}>Are you sure you want to delete <strong>{deleteModal.name}</strong>? This action cannot be undone and may affect active subscriptions.</p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setDeleteModal(null)} style={{ padding: '0.7rem 1.4rem', background: '#F1F5F9', color: '#374151', border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: 600 }}>Cancel</button>
              <button onClick={handleDelete} style={{ padding: '0.7rem 1.4rem', background: '#EF4444', color: '#fff', border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: 700 }}>Delete Plan</button>
            </div>
          </div>
        )}
      </Modal>

      <AIAdvisor mode="admin" title="Plans AI Advisor" context={`Managing ${plans.length} energy plans. Consumer plans: ${plans.filter(p => p.targetAudience === 'Consumer').length}, Enterprise: ${plans.filter(p => p.targetAudience === 'Enterprise').length}`} />
    </div>
  );
}
