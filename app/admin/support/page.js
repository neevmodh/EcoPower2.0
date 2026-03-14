'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { AlertCircle, Wrench, CheckCircle, Sparkles, Send, Loader, RefreshCw, Plus, X } from 'lucide-react';
import AIAdvisor from '@/components/AIAdvisor';
import Modal from '@/components/Modal';
import { groqChat } from '@/lib/groqClient';

const STATUS_COLORS = {
  'Open':        { color: '#EF4444', bg: '#FEF2F2', border: '#FECACA' },
  'In Progress': { color: '#F97316', bg: '#FFF7ED', border: '#FED7AA' },
  'Resolved':    { color: '#22C55E', bg: '#F0FDF4', border: '#BBF7D0' },
  'Closed':      { color: '#94A3B8', bg: '#F8FAFC', border: '#E2E8F0' },
};
const PRIORITY_COLORS = { 'Critical': '#7C3AED', 'High': '#EF4444', 'Medium': '#F97316', 'Low': '#22C55E' };

const inputStyle = { padding: '0.75rem 1rem', borderRadius: 10, border: '1.5px solid #E2E8F0', outline: 'none', fontFamily: 'Inter, sans-serif', fontSize: '0.875rem', width: '100%', boxSizing: 'border-box', color: '#0F172A', background: '#F8FAFC' };

export default function SupportQueue() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [aiModal, setAiModal] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [replying, setReplying] = useState(false);
  const [toast, setToast] = useState('');
  const [createModal, setCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({ user_id: '', subject: '', description: '', category: 'technical', priority: 'medium' });
  const [creating, setCreating] = useState(false);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const fetchTickets = async () => {
    try {
      const [tRes, uRes] = await Promise.all([
        fetch(`/api/tickets?userId=${user.userId}&role=${user.role}`),
        fetch(`/api/users?role=${user.role}`),
      ]);
      const [tData, uData] = await Promise.all([tRes.json(), uRes.json()]);
      setTickets(Array.isArray(tData) ? tData : []);
      setUsers(Array.isArray(uData) ? uData : []);
    } catch { setTickets([]); }
    finally { setLoading(false); }
  };

  useEffect(() => { if (user) fetchTickets(); }, [user]);

  const handleAction = async (id, action) => {
    const statusMap = { Assign: 'In Progress', Resolve: 'Resolved', Close: 'Closed' };
    try {
      const res = await fetch(`/api/tickets/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: statusMap[action] }),
      });
      if (res.ok) {
        showToast(`Ticket ${action === 'Assign' ? 'assigned' : action === 'Resolve' ? 'resolved' : 'closed'} successfully`);
        fetchTickets();
        if (selectedTicket?.ticketId === id) setSelectedTicket(prev => ({ ...prev, status: statusMap[action] }));
      }
    } catch { showToast('Action failed'); }
  };

  const analyzeWithAI = async (ticket) => {
    setAiModal(true);
    setAiAnalysis('');
    setAiLoading(true);
    try {
      const res = await fetch('/api/groq/analyze-ticket', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticket }),
      });
      const data = await res.json();
      setAiAnalysis(data.analysis || 'Analysis unavailable.');
    } catch {
      // fallback to groqClient
      try {
        const reply = await groqChat({
          messages: [{ role: 'user', content: `Analyze this support ticket: ${JSON.stringify(ticket)}. Provide root cause, resolution steps, estimated time, and priority justification.` }],
          mode: 'support',
          context: `Ticket: ${JSON.stringify(ticket)}`,
        });
        setAiAnalysis(reply);
      } catch (e) { setAiAnalysis(`AI unavailable: ${e.message}`); }
    } finally { setAiLoading(false); }
  };

  const generateAIReply = async () => {
    if (!selectedTicket) return;
    setReplying(true);
    try {
      const reply = await groqChat({
        messages: [{ role: 'user', content: `Write a professional, empathetic customer reply (under 100 words) for this support ticket: Subject: ${selectedTicket.subject || selectedTicket.issueType}, Description: ${selectedTicket.description}` }],
        mode: 'support',
        context: `Ticket: ${JSON.stringify(selectedTicket)}`,
      });
      setReplyText(reply);
    } catch { setReplyText('Thank you for contacting EcoPower support. We have received your ticket and our team is working on resolving your issue. We will update you within 24 hours.'); }
    finally { setReplying(false); }
  };

  const sendReply = async () => {
    if (!replyText.trim() || !selectedTicket) return;
    setReplying(true);
    await new Promise(r => setTimeout(r, 600));
    showToast('Reply sent to customer successfully');
    setReplyText('');
    setReplying(false);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setCreating(true);
    try {
      const res = await fetch('/api/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(createForm),
      });
      if (res.ok) {
        showToast('Ticket created successfully');
        setCreateModal(false);
        setCreateForm({ user_id: '', subject: '', description: '', category: 'technical', priority: 'medium' });
        fetchTickets();
      } else {
        const err = await res.json();
        showToast(err.error || 'Failed to create ticket');
      }
    } catch { showToast('Network error'); }
    finally { setCreating(false); }
  };

  const ticketsArr = Array.isArray(tickets) ? tickets : [];
  const filtered = filter === 'all' ? ticketsArr : ticketsArr.filter(t => {
    if (filter === 'in-progress') return t.status === 'In Progress';
    return t.status.toLowerCase() === filter;
  });

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300, gap: 12, color: '#64748B', fontFamily: 'Inter, sans-serif' }}>
      <Loader size={24} />
      <span style={{ fontWeight: 600 }}>Loading Support Queue...</span>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', fontFamily: 'Inter, sans-serif' }}>
      {toast && (
        <div style={{ position: 'fixed', top: '5rem', right: '2rem', zIndex: 3000, padding: '0.875rem 1.5rem', background: '#0F172A', color: '#4ADE80', borderRadius: 12, fontWeight: 600, fontSize: '0.875rem', boxShadow: '0 8px 24px rgba(0,0,0,0.2)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <CheckCircle size={16} /> {toast}
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 900, color: '#0F172A', margin: 0, letterSpacing: '-0.03em' }}>Support Queue</h1>
          <p style={{ color: '#64748B', margin: '0.5rem 0 0 0' }}>Manage customer tickets with AI-powered resolution assistance</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={fetchTickets} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '0.625rem 1.25rem', background: '#F1F5F9', border: '1px solid #E2E8F0', borderRadius: 10, fontWeight: 600, fontSize: '0.875rem', color: '#374151', cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>
            <RefreshCw size={15} /> Refresh
          </button>
          <button onClick={() => setCreateModal(true)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '0.625rem 1.25rem', background: '#22C55E', border: 'none', borderRadius: 10, fontWeight: 700, fontSize: '0.875rem', color: '#fff', cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>
            <Plus size={15} /> New Ticket
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '1.25rem' }}>
        {[
          { label: 'Total Tickets',  value: ticketsArr.length,                                                                    color: '#38BDF8', icon: <AlertCircle size={22} /> },
          { label: 'Open',           value: ticketsArr.filter(t => t.status === 'Open').length,                                   color: '#EF4444', icon: <AlertCircle size={22} /> },
          { label: 'In Progress',    value: ticketsArr.filter(t => t.status === 'In Progress').length,                            color: '#F97316', icon: <Wrench size={22} /> },
          { label: 'Resolved',       value: ticketsArr.filter(t => t.status === 'Resolved' || t.status === 'Closed').length,      color: '#22C55E', icon: <CheckCircle size={22} /> },
        ].map((s, i) => (
          <div key={i} style={{ background: '#fff', padding: '1.5rem', borderRadius: 14, border: '1px solid #E2E8F0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontSize: '0.78rem', color: '#94A3B8', fontWeight: 600, marginBottom: 8 }}>{s.label}</div>
                <div style={{ fontSize: '2.5rem', fontWeight: 900, color: s.color, letterSpacing: '-0.04em', lineHeight: 1 }}>{s.value}</div>
              </div>
              <div style={{ width: 44, height: 44, background: `${s.color}15`, border: `1px solid ${s.color}30`, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', color: s.color }}>{s.icon}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: selectedTicket ? '1fr 420px' : '1fr', gap: '1.5rem' }}>
        <div style={{ background: '#fff', padding: '1.75rem', borderRadius: 16, border: '1px solid #E2E8F0' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
            <h3 style={{ fontWeight: 800, color: '#0F172A', margin: 0, fontSize: '1.0625rem' }}>All Tickets ({ticketsArr.length})</h3>
            <div style={{ display: 'flex', gap: 6, background: '#F1F5F9', borderRadius: '2rem', padding: 4 }}>
              {[['all','All'],['open','Open'],['in-progress','In Progress'],['resolved','Resolved']].map(([val, label]) => (
                <button key={val} onClick={() => setFilter(val)} style={{ padding: '0.375rem 0.875rem', borderRadius: '2rem', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.8rem', fontFamily: 'Inter, sans-serif', background: filter === val ? '#22C55E' : 'transparent', color: filter === val ? '#fff' : '#64748B' }}>{label}</button>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {filtered.length === 0 ? (
              <div style={{ padding: '3rem', textAlign: 'center', color: '#94A3B8' }}>
                <AlertCircle size={40} style={{ marginBottom: '1rem', opacity: 0.4 }} />
                <div style={{ fontWeight: 600 }}>No tickets found</div>
                <div style={{ fontSize: '0.875rem', marginTop: 8 }}>
                  {ticketsArr.length === 0 ? 'Run the seed script or create a ticket to get started.' : 'Try a different filter.'}
                </div>
              </div>
            ) : filtered.map(t => {
              const sc = STATUS_COLORS[t.status] || STATUS_COLORS['Open'];
              const isSelected = selectedTicket?.ticketId === t.ticketId;
              return (
                <div key={t.ticketId} onClick={() => setSelectedTicket(isSelected ? null : t)}
                  style={{ padding: '1.25rem 1.5rem', background: isSelected ? '#F0FDF4' : '#F8FAFC', borderRadius: 14, border: `1px solid ${isSelected ? '#BBF7D0' : '#E2E8F0'}`, cursor: 'pointer', transition: 'all 0.2s' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                        <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#94A3B8', fontFamily: 'monospace' }}>{t.ticketId?.slice(-8)}</span>
                        <span style={{ fontSize: '0.72rem', fontWeight: 700, color: PRIORITY_COLORS[t.priority] || '#64748B', background: `${PRIORITY_COLORS[t.priority] || '#64748B'}15`, padding: '2px 7px', borderRadius: 4 }}>{t.priority}</span>
                      </div>
                      <div style={{ fontWeight: 700, color: '#0F172A', fontSize: '0.9375rem', marginBottom: 4 }}>{t.subject || t.issueType || 'Support Request'}</div>
                      <div style={{ fontSize: '0.8rem', color: '#64748B', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 400 }}>{t.description}</div>
                      <div style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: 6 }}>{t.createdAt ? new Date(t.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'N/A'}</div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
                      <span style={{ fontSize: '0.78rem', fontWeight: 700, color: sc.color, background: sc.bg, border: `1px solid ${sc.border}`, padding: '0.3rem 0.875rem', borderRadius: '2rem' }}>{t.status}</span>
                      <div style={{ display: 'flex', gap: 6 }}>
                        {t.status === 'Open' && (
                          <button onClick={e => { e.stopPropagation(); handleAction(t.ticketId, 'Assign'); }} style={{ padding: '0.35rem 0.75rem', background: '#EEF2FF', color: '#4338CA', border: 'none', borderRadius: 7, cursor: 'pointer', fontSize: '0.75rem', fontWeight: 700, fontFamily: 'Inter, sans-serif' }}>Assign</button>
                        )}
                        {t.status === 'In Progress' && (
                          <button onClick={e => { e.stopPropagation(); handleAction(t.ticketId, 'Resolve'); }} style={{ padding: '0.35rem 0.75rem', background: '#F0FDF4', color: '#16A34A', border: 'none', borderRadius: 7, cursor: 'pointer', fontSize: '0.75rem', fontWeight: 700, fontFamily: 'Inter, sans-serif' }}>Resolve</button>
                        )}
                        <button onClick={e => { e.stopPropagation(); setSelectedTicket(t); analyzeWithAI(t); }} style={{ padding: '0.35rem 0.75rem', background: '#F5F3FF', color: '#7C3AED', border: '1px solid #DDD6FE', borderRadius: 7, cursor: 'pointer', fontSize: '0.75rem', fontWeight: 700, fontFamily: 'Inter, sans-serif', display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Sparkles size={12} /> AI
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {selectedTicket && (
          <div style={{ background: '#fff', padding: '1.75rem', borderRadius: 16, border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#94A3B8', fontFamily: 'monospace', marginBottom: 4 }}>#{selectedTicket.ticketId?.slice(-8)}</div>
                <h3 style={{ fontWeight: 800, color: '#0F172A', margin: 0, fontSize: '1rem' }}>{selectedTicket.subject || selectedTicket.issueType}</h3>
              </div>
              <button onClick={() => setSelectedTicket(null)} style={{ background: '#F1F5F9', border: 'none', borderRadius: 8, padding: '6px 8px', cursor: 'pointer', color: '#64748B', fontFamily: 'Inter, sans-serif' }}><X size={16} /></button>
            </div>

            <div style={{ padding: '1rem', background: '#F8FAFC', borderRadius: 12, border: '1px solid #E2E8F0' }}>
              <div style={{ fontSize: '0.78rem', fontWeight: 600, color: '#94A3B8', marginBottom: 6 }}>DESCRIPTION</div>
              <p style={{ fontSize: '0.875rem', color: '#374151', margin: 0, lineHeight: 1.7 }}>{selectedTicket.description || 'No description provided.'}</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              {[
                { label: 'Status',   value: selectedTicket.status,   color: STATUS_COLORS[selectedTicket.status]?.color || '#64748B' },
                { label: 'Priority', value: selectedTicket.priority, color: PRIORITY_COLORS[selectedTicket.priority] || '#64748B' },
                { label: 'Category', value: selectedTicket.issueType || 'N/A', color: '#374151' },
                { label: 'Created',  value: selectedTicket.createdAt ? new Date(selectedTicket.createdAt).toLocaleDateString('en-IN') : 'N/A', color: '#374151' },
              ].map((item, i) => (
                <div key={i} style={{ padding: '0.875rem', background: '#F8FAFC', borderRadius: 10, border: '1px solid #E2E8F0' }}>
                  <div style={{ fontSize: '0.72rem', color: '#94A3B8', fontWeight: 600, marginBottom: 4 }}>{item.label}</div>
                  <div style={{ fontWeight: 800, color: item.color, fontSize: '0.85rem' }}>{item.value}</div>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
              {selectedTicket.status === 'Open' && (
                <button onClick={() => handleAction(selectedTicket.ticketId, 'Assign')} style={{ padding: '0.75rem', background: '#4338CA', color: '#fff', border: 'none', borderRadius: 10, fontWeight: 700, cursor: 'pointer', fontFamily: 'Inter, sans-serif', fontSize: '0.875rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                  <Wrench size={16} /> Assign to Technician
                </button>
              )}
              {selectedTicket.status === 'In Progress' && (
                <button onClick={() => handleAction(selectedTicket.ticketId, 'Resolve')} style={{ padding: '0.75rem', background: '#22C55E', color: '#fff', border: 'none', borderRadius: 10, fontWeight: 700, cursor: 'pointer', fontFamily: 'Inter, sans-serif', fontSize: '0.875rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                  <CheckCircle size={16} /> Mark as Resolved
                </button>
              )}
              {selectedTicket.status === 'Resolved' && (
                <button onClick={() => handleAction(selectedTicket.ticketId, 'Close')} style={{ padding: '0.75rem', background: '#64748B', color: '#fff', border: 'none', borderRadius: 10, fontWeight: 700, cursor: 'pointer', fontFamily: 'Inter, sans-serif', fontSize: '0.875rem' }}>
                  Close Ticket
                </button>
              )}
              <button onClick={() => analyzeWithAI(selectedTicket)} style={{ padding: '0.75rem', background: 'linear-gradient(135deg,#7C3AED,#6D28D9)', color: '#fff', border: 'none', borderRadius: 10, fontWeight: 700, cursor: 'pointer', fontFamily: 'Inter, sans-serif', fontSize: '0.875rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                <Sparkles size={16} /> AI Analyze & Suggest Fix
              </button>
            </div>

            <div>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#374151', marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Reply to Customer</span>
                <button onClick={generateAIReply} disabled={replying} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '0.3rem 0.75rem', background: '#F5F3FF', border: '1px solid #DDD6FE', borderRadius: 6, fontSize: '0.72rem', fontWeight: 700, color: '#7C3AED', cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>
                  <Sparkles size={11} /> AI Draft
                </button>
              </div>
              <textarea value={replyText} onChange={e => setReplyText(e.target.value)} rows={4} placeholder="Type your reply to the customer..."
                style={{ ...inputStyle, resize: 'vertical' }}
                onFocus={e => e.target.style.borderColor = '#22C55E'}
                onBlur={e => e.target.style.borderColor = '#E2E8F0'} />
              <button onClick={sendReply} disabled={!replyText.trim() || replying}
                style={{ marginTop: 8, width: '100%', padding: '0.75rem', background: replyText.trim() ? '#0F172A' : '#E2E8F0', color: replyText.trim() ? '#fff' : '#94A3B8', border: 'none', borderRadius: 10, fontWeight: 700, cursor: replyText.trim() ? 'pointer' : 'not-allowed', fontFamily: 'Inter, sans-serif', fontSize: '0.875rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                {replying ? <><Loader size={14} /> Sending...</> : <><Send size={14} /> Send Reply</>}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* AI Analysis Modal */}
      <Modal open={aiModal} onClose={() => setAiModal(false)} title="AI Ticket Analysis" width={600}>
        {aiLoading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, padding: '2rem' }}>
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'linear-gradient(135deg,#7C3AED,#6D28D9)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Sparkles size={28} color="#fff" /></div>
            <div style={{ fontWeight: 700, color: '#0F172A' }}>Analyzing with Groq LLaMA 3.3 70B...</div>
          </div>
        ) : (
          <div>
            <div style={{ padding: '1rem', background: 'linear-gradient(135deg,#F5F3FF,#EDE9FE)', border: '1px solid #DDD6FE', borderRadius: 12, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: 10 }}>
              <Sparkles size={18} color="#7C3AED" />
              <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#7C3AED' }}>AI Analysis Complete — Groq LLaMA 3.3 70B</span>
            </div>
            <div style={{ fontSize: '0.9rem', color: '#374151', lineHeight: 1.8, whiteSpace: 'pre-wrap', background: '#F8FAFC', padding: '1.25rem', borderRadius: 12, border: '1px solid #E2E8F0', maxHeight: 400, overflowY: 'auto' }}>
              {aiAnalysis}
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem' }}>
              <button onClick={() => { setReplyText(aiAnalysis.split('\n').slice(0, 4).join(' ')); setAiModal(false); }}
                style={{ flex: 1, padding: '0.75rem', background: '#22C55E', color: '#fff', border: 'none', borderRadius: 10, fontWeight: 700, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>
                Use as Reply Draft
              </button>
              <button onClick={() => setAiModal(false)} style={{ padding: '0.75rem 1.5rem', background: '#F1F5F9', color: '#374151', border: 'none', borderRadius: 10, fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>Close</button>
            </div>
          </div>
        )}
      </Modal>

      {/* Create Ticket Modal */}
      <Modal open={createModal} onClose={() => setCreateModal(false)} title="Create New Support Ticket" width={520}>
        <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Customer</label>
            <select required value={createForm.user_id} onChange={e => setCreateForm({ ...createForm, user_id: e.target.value })} style={inputStyle}>
              <option value="">Select customer...</option>
              {users.filter(u => u.role !== 'Admin' && u.role !== 'admin').map(u => (
                <option key={u.userId || u._id} value={u.userId || u._id}>{u.name} ({u.email})</option>
              ))}
            </select>
          </div>
          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Subject</label>
            <input required type="text" placeholder="Brief description of the issue" value={createForm.subject} onChange={e => setCreateForm({ ...createForm, subject: e.target.value })} style={inputStyle} />
          </div>
          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Description</label>
            <textarea required rows={3} placeholder="Detailed description..." value={createForm.description} onChange={e => setCreateForm({ ...createForm, description: e.target.value })} style={{ ...inputStyle, resize: 'vertical' }} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Category</label>
              <select value={createForm.category} onChange={e => setCreateForm({ ...createForm, category: e.target.value })} style={inputStyle}>
                <option value="technical">Technical</option>
                <option value="billing">Billing</option>
                <option value="device">Device</option>
                <option value="account">Account</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Priority</label>
              <select value={createForm.priority} onChange={e => setCreateForm({ ...createForm, priority: e.target.value })} style={inputStyle}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
            <button type="button" onClick={() => setCreateModal(false)} style={{ padding: '0.7rem 1.4rem', background: '#F1F5F9', color: '#374151', border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: 600, fontFamily: 'Inter, sans-serif' }}>Cancel</button>
            <button type="submit" disabled={creating} style={{ padding: '0.7rem 1.4rem', background: '#22C55E', color: '#fff', border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: 700, fontFamily: 'Inter, sans-serif', display: 'flex', alignItems: 'center', gap: 6 }}>
              {creating ? <><Loader size={14} /> Creating...</> : <><Plus size={14} /> Create Ticket</>}
            </button>
          </div>
        </form>
      </Modal>

      <AIAdvisor mode="support" title="Support AI Assistant"
        context={selectedTicket ? `Current ticket: ${JSON.stringify(selectedTicket)}` : 'Admin support queue management'}
        initialMessage="Hi! I'm your Support AI. Select a ticket and I'll help you resolve it, or ask me anything about support procedures." />
    </div>
  );
}
