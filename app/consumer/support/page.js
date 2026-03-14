'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { HeadphonesIcon, Plus, Clock, CheckCircle2, AlertCircle, Zap, MessageSquare, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import AIAdvisor from '@/components/AIAdvisor';
import Modal from '@/components/Modal';

const STATUS_COLORS = {
  'Open':        { color: '#F97316', bg: '#FFF7ED', border: '#FED7AA' },
  'In Progress': { color: '#38BDF8', bg: '#F0F9FF', border: '#BAE6FD' },
  'Resolved':    { color: '#22C55E', bg: '#F0FDF4', border: '#BBF7D0' },
  'Closed':      { color: '#94A3B8', bg: '#F8FAFC', border: '#E2E8F0' },
};
const PRIORITY_COLORS = {
  'High':   { color: '#EF4444', bg: '#FEF2F2' },
  'Medium': { color: '#F97316', bg: '#FFF7ED' },
  'Low':    { color: '#22C55E', bg: '#F0FDF4' },
};

export default function ConsumerSupport() {
  const { user } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ subject: '', category: 'Device Issue', priority: 'medium', description: '' });
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState(null);
  const [activeTab, setActiveTab] = useState('all');
  const [expandedId, setExpandedId] = useState(null);
  const [deleteModal, setDeleteModal] = useState(null);
  const [statusModal, setStatusModal] = useState(null);

  const showToast = (msg, type = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 4000); };

  const fetchTickets = async () => {
    try {
      const res = await fetch(`/api/tickets?userId=${user.userId}&role=consumer`);
      const data = await res.json();
      setTickets(Array.isArray(data) ? data : []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { if (user) fetchTickets(); }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch('/api/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user.userId, subject: form.subject, description: form.description, category: form.category, issue_type: form.category.toLowerCase().replace(/ /g, '_'), priority: form.priority }),
      });
      if (!res.ok) throw new Error('Failed');
      await fetchTickets();
      setForm({ subject: '', category: 'Device Issue', priority: 'medium', description: '' });
      setShowForm(false);
      showToast('Ticket submitted! Our team will respond within 24 hours.');
    } catch { showToast('Failed to submit ticket.', 'error'); }
    finally { setSubmitting(false); }
  };

  const handleUpdateStatus = async (ticketId, newStatus) => {
    try {
      const res = await fetch(`/api/tickets/${ticketId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error('Failed');
      await fetchTickets();
      setStatusModal(null);
      showToast(`Ticket marked as ${newStatus}`);
    } catch { showToast('Failed to update status.', 'error'); }
  };

  const handleDelete = async (ticketId) => {
    try {
      const res = await fetch(`/api/tickets/${ticketId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed');
      await fetchTickets();
      setDeleteModal(null);
      showToast('Ticket deleted.');
    } catch { showToast('Failed to delete ticket.', 'error'); }
  };

  const filtered = activeTab === 'all' ? tickets : tickets.filter(t => t.status.toLowerCase().replace(' ', '-') === activeTab);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {toast && (
        <div style={{ padding: '1rem 1.5rem', background: toast.type === 'error' ? '#FEF2F2' : '#F0FDF4', border: `1px solid ${toast.type === 'error' ? '#FECACA' : '#BBF7D0'}`, borderRadius: 12, display: 'flex', alignItems: 'center', gap: 10, color: toast.type === 'error' ? '#DC2626' : '#16A34A', fontWeight: 600 }}>
          {toast.type === 'error' ? <AlertCircle size={20} /> : <CheckCircle2 size={20} />} {toast.msg}
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 900, color: '#0F172A', margin: 0, letterSpacing: '-0.03em' }}>Support Center</h1>
          <p style={{ color: '#64748B', margin: '0.5rem 0 0 0' }}>Raise tickets, track issues, and get help</p>
        </div>
        <button onClick={() => setShowForm(!showForm)}
          style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0.75rem 1.5rem', background: '#22C55E', color: '#fff', border: 'none', borderRadius: 12, fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 14px rgba(34,197,94,0.35)' }}>
          <Plus size={18} /> New Ticket
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '1.25rem' }}>
        {[
          { label: 'Total', value: tickets.length, color: '#38BDF8', bg: '#F0F9FF', border: '#BAE6FD', icon: <HeadphonesIcon size={20} /> },
          { label: 'Open', value: tickets.filter(t => t.status === 'Open').length, color: '#F97316', bg: '#FFF7ED', border: '#FED7AA', icon: <AlertCircle size={20} /> },
          { label: 'In Progress', value: tickets.filter(t => t.status === 'In Progress').length, color: '#38BDF8', bg: '#F0F9FF', border: '#BAE6FD', icon: <Clock size={20} /> },
          { label: 'Resolved', value: tickets.filter(t => t.status === 'Resolved').length, color: '#22C55E', bg: '#F0FDF4', border: '#BBF7D0', icon: <CheckCircle2 size={20} /> },
        ].map((s, i) => (
          <div key={i} className="metric-tile" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontSize: '0.78rem', color: '#94A3B8', fontWeight: 600, marginBottom: 6 }}>{s.label}</div>
                <div style={{ fontSize: '2.25rem', fontWeight: 900, color: s.color, lineHeight: 1 }}>{s.value}</div>
              </div>
              <div style={{ width: 42, height: 42, background: s.bg, border: `1px solid ${s.border}`, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', color: s.color }}>{s.icon}</div>
            </div>
          </div>
        ))}
      </div>

      {/* New Ticket Form */}
      {showForm && (
        <div className="glass-card" style={{ padding: '2rem' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0F172A', marginBottom: '1.5rem' }}>Raise a New Support Ticket</h3>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ fontSize: '0.875rem', fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>Subject *</label>
                <input className="input-field" required value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} placeholder="Briefly describe your issue" />
              </div>
              <div>
                <label style={{ fontSize: '0.875rem', fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>Category</label>
                <select className="input-field" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                  {['Device Issue','Billing','Connectivity','Outage Report','Meter Reading','General Query'].map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: '0.875rem', fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>Priority</label>
                <select className="input-field" value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })}>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ fontSize: '0.875rem', fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>Description *</label>
                <textarea className="input-field" required rows={4} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Describe your issue in detail..." style={{ resize: 'vertical' }} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button type="submit" disabled={submitting} style={{ padding: '0.75rem 2rem', background: '#22C55E', color: '#fff', border: 'none', borderRadius: 10, fontWeight: 700, cursor: 'pointer', opacity: submitting ? 0.7 : 1 }}>
                {submitting ? 'Submitting...' : 'Submit Ticket'}
              </button>
              <button type="button" onClick={() => setShowForm(false)} style={{ padding: '0.75rem 2rem', background: 'transparent', color: '#64748B', border: '1.5px solid #E2E8F0', borderRadius: 10, fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Quick Actions */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '1.25rem' }}>
        {[
          { icon: <Zap size={20} color="#EF4444" />, title: 'Report Outage', bg: '#FEF2F2', border: '#FECACA', cat: 'Outage Report' },
          { icon: <MessageSquare size={20} color="#8B5CF6" />, title: 'Billing Query', bg: '#F5F3FF', border: '#DDD6FE', cat: 'Billing' },
          { icon: <HeadphonesIcon size={20} color="#38BDF8" />, title: 'Device Issue', bg: '#F0F9FF', border: '#BAE6FD', cat: 'Device Issue' },
        ].map((a, i) => (
          <button key={i} onClick={() => { setForm(f => ({ ...f, category: a.cat })); setShowForm(true); }}
            style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '1.25rem 1.5rem', background: a.bg, border: `1px solid ${a.border}`, borderRadius: 14, cursor: 'pointer', textAlign: 'left', fontFamily: 'Inter, sans-serif' }}>
            <div style={{ width: 42, height: 42, background: '#fff', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>{a.icon}</div>
            <span style={{ fontWeight: 700, color: '#0F172A', fontSize: '0.9375rem' }}>{a.title}</span>
          </button>
        ))}
      </div>

      {/* Tickets List */}
      <div className="glass-card" style={{ padding: '1.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>My Tickets</h3>
          <div style={{ display: 'flex', gap: 6, background: '#F1F5F9', borderRadius: '2rem', padding: 4 }}>
            {[['all','All'],['open','Open'],['in-progress','In Progress'],['resolved','Resolved']].map(([val, label]) => (
              <button key={val} onClick={() => setActiveTab(val)}
                style={{ padding: '0.4rem 1rem', borderRadius: '2rem', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.8rem', background: activeTab === val ? '#22C55E' : 'transparent', color: activeTab === val ? '#fff' : '#64748B' }}>
                {label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#94A3B8' }}>Loading tickets...</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#94A3B8' }}>
            <HeadphonesIcon size={40} style={{ marginBottom: '1rem', opacity: 0.4 }} />
            <div style={{ fontWeight: 600 }}>No tickets found</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
            {filtered.map((t, i) => {
              const sc = STATUS_COLORS[t.status] || STATUS_COLORS['Open'];
              const pc = PRIORITY_COLORS[t.priority] || PRIORITY_COLORS['Medium'];
              const isExpanded = expandedId === t.ticketId;
              return (
                <div key={t.ticketId || i} style={{ background: '#F8FAFC', borderRadius: 12, border: '1px solid #E2E8F0', overflow: 'hidden' }}>
                  <div style={{ padding: '1.25rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', cursor: 'pointer' }}
                    onClick={() => setExpandedId(isExpanded ? null : t.ticketId)}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#94A3B8', fontFamily: 'monospace' }}>{t.ticketId?.slice(-8).toUpperCase()}</span>
                        <span style={{ fontSize: '0.72rem', fontWeight: 700, color: pc.color, background: pc.bg, padding: '2px 8px', borderRadius: 4 }}>{t.priority}</span>
                      </div>
                      <div style={{ fontWeight: 700, color: '#0F172A', fontSize: '0.9375rem', marginBottom: 2 }}>{t.subject}</div>
                      <div style={{ fontSize: '0.78rem', color: '#94A3B8' }}>{t.issueType} · {new Date(t.createdAt).toLocaleDateString()}</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: '0.78rem', fontWeight: 700, color: sc.color, background: sc.bg, border: `1px solid ${sc.border}`, padding: '0.3rem 0.875rem', borderRadius: '2rem' }}>{t.status}</span>
                      {isExpanded ? <ChevronUp size={16} color="#94A3B8" /> : <ChevronDown size={16} color="#94A3B8" />}
                    </div>
                  </div>

                  {isExpanded && (
                    <div style={{ padding: '1.25rem 1.5rem', borderTop: '1px solid #E2E8F0', background: 'white' }}>
                      <p style={{ color: '#374151', fontSize: '0.9rem', marginBottom: '1.5rem', lineHeight: 1.6 }}>
                        {t.description || 'No description provided.'}
                      </p>
                      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                        {t.status !== 'Resolved' && t.status !== 'Closed' && (
                          <button onClick={() => setStatusModal(t)}
                            style={{ padding: '0.5rem 1.25rem', background: '#F0FDF4', color: '#16A34A', border: '1px solid #BBF7D0', borderRadius: 8, fontWeight: 700, cursor: 'pointer', fontSize: '0.875rem' }}>
                            Mark Resolved
                          </button>
                        )}
                        {t.status === 'Open' && (
                          <button onClick={() => handleUpdateStatus(t.ticketId, 'In Progress')}
                            style={{ padding: '0.5rem 1.25rem', background: '#F0F9FF', color: '#0284C7', border: '1px solid #BAE6FD', borderRadius: 8, fontWeight: 700, cursor: 'pointer', fontSize: '0.875rem' }}>
                            Mark In Progress
                          </button>
                        )}
                        <button onClick={() => setDeleteModal(t)}
                          style={{ padding: '0.5rem 1.25rem', background: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA', borderRadius: 8, fontWeight: 700, cursor: 'pointer', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                          <Trash2 size={14} /> Delete
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Status Update Modal */}
      <Modal isOpen={!!statusModal} onClose={() => setStatusModal(null)} title="Mark as Resolved">
        <p style={{ color: '#64748b', marginBottom: '1.5rem' }}>Are you sure you want to mark this ticket as resolved?</p>
        <p style={{ fontWeight: 700, color: '#0F172A', marginBottom: '1.5rem' }}>{statusModal?.subject}</p>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button onClick={() => handleUpdateStatus(statusModal?.ticketId, 'Resolved')}
            style={{ flex: 1, padding: '0.75rem', background: '#22C55E', color: 'white', border: 'none', borderRadius: 10, fontWeight: 700, cursor: 'pointer' }}>
            Yes, Resolve
          </button>
          <button onClick={() => setStatusModal(null)}
            style={{ flex: 1, padding: '0.75rem', background: '#f1f5f9', color: '#64748b', border: 'none', borderRadius: 10, fontWeight: 600, cursor: 'pointer' }}>
            Cancel
          </button>
        </div>
      </Modal>

      {/* Delete Modal */}
      <Modal isOpen={!!deleteModal} onClose={() => setDeleteModal(null)} title="Delete Ticket">
        <p style={{ color: '#64748b', marginBottom: '1.5rem' }}>This action cannot be undone. The ticket will be permanently deleted.</p>
        <p style={{ fontWeight: 700, color: '#0F172A', marginBottom: '1.5rem' }}>{deleteModal?.subject}</p>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button onClick={() => handleDelete(deleteModal?.ticketId)}
            style={{ flex: 1, padding: '0.75rem', background: '#ef4444', color: 'white', border: 'none', borderRadius: 10, fontWeight: 700, cursor: 'pointer' }}>
            Delete
          </button>
          <button onClick={() => setDeleteModal(null)}
            style={{ flex: 1, padding: '0.75rem', background: '#f1f5f9', color: '#64748b', border: 'none', borderRadius: 10, fontWeight: 600, cursor: 'pointer' }}>
            Cancel
          </button>
        </div>
      </Modal>

      <AIAdvisor mode="support" />
    </div>
  );
}
