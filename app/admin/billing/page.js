'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { FileText, Banknote, Clock, Download, RefreshCw, Sparkles, CheckCircle } from 'lucide-react';
import Modal from '@/components/Modal';
import AIAdvisor from '@/components/AIAdvisor';
import { groqChat } from '@/lib/groqClient';

const btnPrimary = { padding: '0.7rem 1.4rem', background: '#22C55E', color: '#fff', border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: 700, fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: 6 };

export default function BillingManagement() {
  const { user } = useAuth();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState([]);
  const [viewInvoice, setViewInvoice] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [toast, setToast] = useState(null);
  const [aiInsight, setAiInsight] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('All');

  const showToast = (msg, type = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000); };

  const fetchInvoices = async () => {
    try {
      const res = await fetch(`/api/invoices?role=admin`);
      const data = await res.json();
      setInvoices(Array.isArray(data) ? data : []);
    } catch { setInvoices([]); } finally { setLoading(false); }
  };

  useEffect(() => { fetchInvoices(); }, []);

  const generateCycle = async () => {
    setGenerating(true);
    try {
      const res = await fetch('/api/invoices', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: user.userId, role: user.role, generateAll: true }) });
      if (res.ok) { fetchInvoices(); showToast('New billing cycle generated successfully'); }
      else showToast('Generation failed — check server logs', 'error');
    } catch { showToast('Network error', 'error'); } finally { setGenerating(false); }
  };

  const markPaid = async (invoiceId) => {
    try {
      const res = await fetch(`/api/invoices/${invoiceId}/pay`, { method: 'PUT', headers: { 'Content-Type': 'application/json' } });
      if (res.ok) { fetchInvoices(); showToast('Invoice marked as paid'); }
      else showToast('Failed to update invoice', 'error');
    } catch { showToast('Network error', 'error'); }
  };

  const exportSelected = () => {
    if (selected.length === 0) { showToast('Select invoices to export', 'error'); return; }
    const toExport = invoices.filter(inv => selected.includes(inv.invoiceId));
    const csv = ['Invoice ID,Location,Period Start,Period End,Amount,Status', ...toExport.map(inv => `${inv.invoiceId},${inv.locationId},${new Date(inv.billingPeriodStart).toLocaleDateString()},${new Date(inv.billingPeriodEnd).toLocaleDateString()},${inv.totalAmount},${inv.status}`)].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `invoices_export_${Date.now()}.csv`; a.click();
    URL.revokeObjectURL(url);
    showToast(`Exported ${selected.length} invoices`);
  };

  const getAIInsights = async () => {
    setAiLoading(true);
    try {
      const totalRev = invoices.filter(i => i.status === 'Paid').reduce((s, i) => s + i.totalAmount, 0);
      const pending = invoices.filter(i => i.status !== 'Paid').reduce((s, i) => s + i.totalAmount, 0);
      const overdue = invoices.filter(i => i.status === 'Overdue').length;
      const reply = await groqChat({
        messages: [{ role: 'user', content: `Analyze this billing data and give revenue optimization recommendations: Total Revenue: ₹${totalRev}, Pending: ₹${pending}, Overdue invoices: ${overdue}, Total invoices: ${invoices.length}` }],
        mode: 'analytics'
      });
      setAiInsight(reply || 'No insights available.');
    } catch (err) { setAiInsight(`Error: ${err.message}`); } finally { setAiLoading(false); }
  };

  const toggleSelect = (id) => setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  const toggleAll = () => setSelected(selected.length === filtered.length ? [] : filtered.map(i => i.invoiceId));

  const filtered = invoices.filter(i => statusFilter === 'All' || i.status === statusFilter);
  const totalRevenue = invoices.filter(i => i.status === 'Paid').reduce((s, i) => s + i.totalAmount, 0);
  const pendingRevenue = invoices.filter(i => i.status !== 'Paid').reduce((s, i) => s + i.totalAmount, 0);

  if (loading) return <div style={{ padding: '3rem', textAlign: 'center', color: '#64748B' }}>Loading financials...</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', fontFamily: 'Inter, sans-serif' }}>
      {toast && <div style={{ position: 'fixed', top: '1.5rem', right: '1.5rem', zIndex: 3000, padding: '0.875rem 1.5rem', borderRadius: 12, background: toast.type === 'error' ? '#EF4444' : '#22C55E', color: '#fff', fontWeight: 600, boxShadow: '0 8px 24px rgba(0,0,0,0.15)', fontSize: '0.875rem' }}>{toast.msg}</div>}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>Billing & Financial Ledger</h1>
          <p style={{ color: '#64748B', margin: '0.25rem 0 0 0', fontSize: '0.9rem' }}>{invoices.length} total invoices</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={getAIInsights} disabled={aiLoading} style={{ ...btnPrimary, background: '#7C3AED' }}><Sparkles size={16} />{aiLoading ? 'Analyzing...' : 'AI Analysis'}</button>
          <button onClick={exportSelected} style={{ ...btnPrimary, background: '#0F172A' }}><Download size={16} />Export ({selected.length})</button>
          <button onClick={generateCycle} disabled={generating} style={btnPrimary}><RefreshCw size={16} />{generating ? 'Generating...' : 'Generate Cycle'}</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
        {[
          { label: 'Revenue Captured', value: `₹${totalRevenue.toLocaleString()}`, icon: Banknote, color: '#22C55E' },
          { label: 'Pending Receivable', value: `₹${pendingRevenue.toLocaleString()}`, icon: Clock, color: '#F59E0B' },
          { label: 'Total Invoices', value: invoices.length, icon: FileText, color: '#3B82F6' },
        ].map(m => (
          <div key={m.label} style={{ background: '#fff', padding: '1.5rem', borderRadius: 14, border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: `${m.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><m.icon size={24} color={m.color} /></div>
            <div><div style={{ color: '#64748B', fontSize: '0.8rem', fontWeight: 600 }}>{m.label}</div><div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0F172A' }}>{m.value}</div></div>
          </div>
        ))}
      </div>

      {aiInsight && (
        <div style={{ background: 'linear-gradient(135deg,#F5F3FF,#EDE9FE)', border: '1px solid #DDD6FE', borderRadius: 14, padding: '1.25rem 1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}><Sparkles size={16} color="#7C3AED" /><span style={{ fontWeight: 700, color: '#7C3AED', fontSize: '0.875rem' }}>AI Revenue Analysis</span></div>
          <p style={{ margin: 0, color: '#374151', fontSize: '0.875rem', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{aiInsight}</p>
        </div>
      )}

      <div style={{ display: 'flex', gap: 8 }}>
        {['All', 'Paid', 'Pending', 'Overdue'].map(s => (
          <button key={s} onClick={() => setStatusFilter(s)} style={{ padding: '0.5rem 1rem', borderRadius: 8, border: '1.5px solid', borderColor: statusFilter === s ? '#22C55E' : '#E2E8F0', background: statusFilter === s ? '#F0FDF4' : '#fff', color: statusFilter === s ? '#16A34A' : '#64748B', fontWeight: 600, cursor: 'pointer', fontSize: '0.85rem' }}>{s}</button>
        ))}
      </div>

      <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #E2E8F0', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
              <th style={{ padding: '1rem', width: 40 }}><input type="checkbox" checked={selected.length === filtered.length && filtered.length > 0} onChange={toggleAll} /></th>
              {['Invoice ID', 'Location', 'Period', 'Amount', 'Status', 'Actions'].map(h => (
                <th key={h} style={{ padding: '1rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={7} style={{ padding: '3rem', textAlign: 'center', color: '#94A3B8' }}>No invoices found</td></tr>
            ) : filtered.map(inv => (
              <tr key={inv.invoiceId} style={{ borderBottom: '1px solid #F1F5F9' }}>
                <td style={{ padding: '1rem' }}><input type="checkbox" checked={selected.includes(inv.invoiceId)} onChange={() => toggleSelect(inv.invoiceId)} /></td>
                <td style={{ padding: '1rem', fontWeight: 700, color: '#0F172A', fontSize: '0.875rem' }}>{inv.invoiceId}</td>
                <td style={{ padding: '1rem', color: '#64748B', fontSize: '0.85rem' }}>{inv.locationId}</td>
                <td style={{ padding: '1rem', color: '#64748B', fontSize: '0.85rem' }}>{new Date(inv.billingPeriodStart).toLocaleDateString()} – {new Date(inv.billingPeriodEnd).toLocaleDateString()}</td>
                <td style={{ padding: '1rem', fontWeight: 800, color: '#0F172A' }}>₹{inv.totalAmount?.toLocaleString()}</td>
                <td style={{ padding: '1rem' }}>
                  <span style={{ padding: '0.25rem 0.75rem', borderRadius: 20, fontSize: '0.75rem', fontWeight: 700, background: inv.status === 'Paid' ? '#DCFCE7' : inv.status === 'Overdue' ? '#FEE2E2' : '#FEF3C7', color: inv.status === 'Paid' ? '#16A34A' : inv.status === 'Overdue' ? '#EF4444' : '#D97706' }}>{inv.status}</span>
                </td>
                <td style={{ padding: '1rem' }}>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button onClick={() => setViewInvoice(inv)} style={{ padding: '0.4rem 0.8rem', background: '#EFF6FF', color: '#2563EB', border: '1px solid #BFDBFE', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: '0.8rem' }}>View</button>
                    {inv.status !== 'Paid' && (
                      <button onClick={() => markPaid(inv.invoiceId)} style={{ padding: '0.4rem 0.8rem', background: '#F0FDF4', color: '#16A34A', border: '1px solid #BBF7D0', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: 4 }}><CheckCircle size={13} />Mark Paid</button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={!!viewInvoice} onClose={() => setViewInvoice(null)} title={`Invoice ${viewInvoice?.invoiceId}`} width={500}>
        {viewInvoice && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
            {[['Invoice ID', viewInvoice.invoiceId], ['Location', viewInvoice.locationId], ['Period Start', new Date(viewInvoice.billingPeriodStart).toLocaleDateString()], ['Period End', new Date(viewInvoice.billingPeriodEnd).toLocaleDateString()], ['Total Amount', `₹${viewInvoice.totalAmount?.toLocaleString()}`], ['Status', viewInvoice.status], ['Units Consumed', `${viewInvoice.unitsConsumed || '—'} kWh`], ['Units Generated', `${viewInvoice.unitsGenerated || '—'} kWh`]].map(([k, v]) => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem 1rem', background: '#F8FAFC', borderRadius: 10 }}>
                <span style={{ fontSize: '0.85rem', color: '#64748B', fontWeight: 600 }}>{k}</span>
                <span style={{ fontSize: '0.85rem', color: '#0F172A', fontWeight: 700 }}>{v}</span>
              </div>
            ))}
            {viewInvoice.status !== 'Paid' && (
              <button onClick={() => { markPaid(viewInvoice.invoiceId); setViewInvoice(null); }} style={{ ...btnPrimary, justifyContent: 'center', marginTop: 8, width: '100%' }}><CheckCircle size={16} />Mark as Paid</button>
            )}
          </div>
        )}
      </Modal>

      <AIAdvisor mode="analytics" title="Billing AI Advisor" context={`Revenue: ₹${totalRevenue.toLocaleString()}, Pending: ₹${pendingRevenue.toLocaleString()}, ${invoices.filter(i => i.status === 'Overdue').length} overdue invoices`} />
    </div>
  );
}
