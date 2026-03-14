'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import Modal from '@/components/Modal';
import PaymentFlow from '@/components/PaymentFlow';
import AIAdvisor from '@/components/AIAdvisor';
import { downloadInvoicePDF, downloadAllInvoicesPDF } from '@/components/InvoicePDF';
import { FileText, CreditCard, TrendingDown, CheckCircle, Clock, AlertCircle, Download, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';

export default function EnterpriseBilling() {
  const { user } = useAuth();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);
  const [payInvoice, setPayInvoice] = useState(null);
  const [bulkModal, setBulkModal] = useState(false);
  const [bulkPaying, setBulkPaying] = useState(false);
  const [generating, setGenerating] = useState(false);

  const fetchInvoices = async () => {
    try {
      const res = await fetch(`/api/invoices?role=admin`);
      const data = await res.json();
      setInvoices(Array.isArray(data) ? data : []);
    } catch { setInvoices([]); } finally { setLoading(false); }
  };

  useEffect(() => { fetchInvoices(); }, []);

  const pending = invoices.filter(i => i.status === 'Pending');
  const paid = invoices.filter(i => i.status === 'Paid');
  const totalOutstanding = pending.reduce((s, i) => s + (i.totalAmount || 0), 0);
  const totalPaid = paid.reduce((s, i) => s + (i.totalAmount || 0), 0);

  const handleBulkPay = async () => {
    setBulkPaying(true);
    for (const inv of pending) {
      try { await fetch(`/api/invoices/${inv.invoiceId}/pay`, { method: 'PUT' }); } catch {}
    }
    setBulkPaying(false);
    setBulkModal(false);
    fetchInvoices();
  };

  const handleGenerate = async () => {
    setGenerating(true);
    try { await fetch('/api/invoices', { method: 'POST' }); fetchInvoices(); } catch {}
    setGenerating(false);
  };

  const statusIcon = (s) => s === 'Paid' ? <CheckCircle size={14} color="#22C55E" /> : s === 'Overdue' ? <AlertCircle size={14} color="#ef4444" /> : <Clock size={14} color="#f59e0b" />;
  const statusColor = (s) => s === 'Paid' ? '#22C55E' : s === 'Overdue' ? '#ef4444' : '#f59e0b';
  const statusBg = (s) => s === 'Paid' ? '#f0fdf4' : s === 'Overdue' ? '#fef2f2' : '#fefce8';

  // Chart data — monthly totals
  const months = ['Jan','Feb','Mar','Apr','May','Jun'];
  const chartData = months.map((m, i) => ({
    month: m,
    amount: 45000 + i * 8000 + (i % 2 === 0 ? 5000 : -2000)
  }));
  const maxAmt = Math.max(...chartData.map(d => d.amount));

  if (loading) return <div style={{ padding: '2rem', color: '#64748b' }}>Loading billing...</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, margin: 0 }}>Corporate Billing</h1>
          <p style={{ color: '#64748b', margin: '0.25rem 0 0 0' }}>Centralized invoice management for all enterprise sites</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button onClick={handleGenerate} disabled={generating}
            style={{ padding: '0.75rem 1.25rem', background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: 10, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.875rem' }}>
            <RefreshCw size={16} style={{ animation: generating ? 'spin 1s linear infinite' : 'none' }} />
            {generating ? 'Generating...' : 'Generate Invoices'}
          </button>
          {pending.length > 0 && (
            <button onClick={() => setBulkModal(true)}
              style={{ padding: '0.75rem 1.5rem', background: 'linear-gradient(135deg, #22C55E, #16a34a)', color: 'white', border: 'none', borderRadius: 10, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
              <CreditCard size={16} /> Bulk Pay All ({pending.length})
            </button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem' }}>
        {[
          { label: 'Total Invoices', value: invoices.length, icon: FileText, color: '#3b82f6' },
          { label: 'Outstanding', value: `₹${(totalOutstanding/1000).toFixed(1)}K`, icon: AlertCircle, color: '#f59e0b' },
          { label: 'Paid This Month', value: `₹${(totalPaid/1000).toFixed(1)}K`, icon: CheckCircle, color: '#22C55E' },
          { label: 'Avg Savings', value: '8.2%', icon: TrendingDown, color: '#8b5cf6' },
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

      {/* Billing Trend Chart */}
      <div className="glass-card" style={{ padding: '1.75rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h3 style={{ fontWeight: 700, margin: 0 }}>Monthly Billing Trend</h3>
          <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Last 6 months</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '1rem', height: 180 }}>
          {chartData.map((d, i) => (
            <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
              <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 600 }}>₹{(d.amount/1000).toFixed(0)}K</div>
              <div style={{ width: '100%', height: `${(d.amount / maxAmt) * 140}px`, background: i === chartData.length - 1 ? 'linear-gradient(to top, #22C55E, #4ade80)' : 'linear-gradient(to top, #3b82f6, #60a5fa)', borderRadius: '6px 6px 0 0', minHeight: 20 }} />
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569' }}>{d.month}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Invoice Table */}
      <div className="glass-card" style={{ padding: '1.75rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h3 style={{ fontWeight: 700, margin: 0 }}>All Invoices ({invoices.length})</h3>
          <button onClick={() => downloadAllInvoicesPDF(invoices, user?.name || user?.email || 'Enterprise Account')}
            style={{ padding: '0.5rem 1rem', background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: 8, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8rem' }}>
            <Download size={14} /> Export All
          </button>
        </div>

        {invoices.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
            <FileText size={48} style={{ marginBottom: '1rem', opacity: 0.4 }} />
            <p>No invoices yet. Click "Generate Invoices" to create billing for active subscriptions.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {/* Header row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr auto', gap: '1rem', padding: '0.75rem 1rem', background: '#f8fafc', borderRadius: 8, fontSize: '0.75rem', fontWeight: 700, color: '#64748b', letterSpacing: '0.04em' }}>
              <span>INVOICE ID</span><span>PERIOD</span><span>ENERGY</span><span>AMOUNT</span><span>STATUS</span><span>ACTIONS</span>
            </div>
            {invoices.map(inv => (
              <div key={inv.invoiceId}>
                <div onClick={() => setExpanded(expanded === inv.invoiceId ? null : inv.invoiceId)}
                  style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr auto', gap: '1rem', padding: '1rem', background: 'white', border: '1px solid #f1f5f9', borderRadius: 10, cursor: 'pointer', alignItems: 'center', transition: 'box-shadow 0.15s' }}>
                  <span style={{ fontFamily: 'monospace', fontSize: '0.8rem', fontWeight: 700, color: '#475569' }}>#{inv.invoiceId?.slice(-8).toUpperCase()}</span>
                  <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>{inv.billingPeriod}</span>
                  <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>{inv.energyUsedKwh?.toFixed(0)} kWh</span>
                  <span style={{ fontSize: '1rem', fontWeight: 800 }}>₹{inv.totalAmount?.toLocaleString()}</span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '0.3rem 0.75rem', borderRadius: 20, background: statusBg(inv.status), color: statusColor(inv.status), fontSize: '0.78rem', fontWeight: 700 }}>
                    {statusIcon(inv.status)} {inv.status}
                  </span>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    {inv.status !== 'Paid' && (
                      <button onClick={e => { e.stopPropagation(); setPayInvoice(inv); }}
                        style={{ padding: '0.4rem 0.875rem', background: 'linear-gradient(135deg, #22C55E, #16a34a)', color: 'white', border: 'none', borderRadius: 7, fontWeight: 700, cursor: 'pointer', fontSize: '0.8rem' }}>
                        Pay
                      </button>
                    )}
                    <button onClick={e => { e.stopPropagation(); downloadInvoicePDF(inv); }}
                      style={{ width: 32, height: 32, borderRadius: 7, background: '#f1f5f9', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
                      <Download size={14} />
                    </button>
                    {expanded === inv.invoiceId ? <ChevronUp size={16} color="#94a3b8" /> : <ChevronDown size={16} color="#94a3b8" />}
                  </div>
                </div>
                {expanded === inv.invoiceId && (
                  <div style={{ padding: '1.25rem 1.5rem', background: '#f8fafc', borderRadius: '0 0 10px 10px', border: '1px solid #f1f5f9', borderTop: 'none', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
                    {[
                      ['Base Amount', `₹${inv.baseAmount?.toLocaleString()}`],
                      ['GST (18%)', `₹${inv.tax?.toLocaleString()}`],
                      ['Discount', `₹${inv.discount || 0}`],
                      ['Due Date', new Date(inv.dueDate).toLocaleDateString('en-IN')],
                    ].map(([k, v]) => (
                      <div key={k}>
                        <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600, marginBottom: 4 }}>{k}</div>
                        <div style={{ fontWeight: 700, color: '#0f172a' }}>{v}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pay single invoice modal */}
      <Modal open={!!payInvoice} title={`Pay Invoice #${payInvoice?.invoiceId?.slice(-8).toUpperCase()}`} onClose={() => setPayInvoice(null)}>
        {payInvoice && (
          <PaymentFlow
            invoiceId={payInvoice.invoiceId}
            amount={payInvoice.totalAmount}
            onSuccess={() => { setPayInvoice(null); fetchInvoices(); }}
            onClose={() => setPayInvoice(null)}
          />
        )}
      </Modal>

      {/* Bulk pay confirmation */}
      <Modal open={bulkModal} title="Bulk Pay All Pending Invoices" onClose={() => setBulkModal(false)}>
          <div style={{ textAlign: 'center', padding: '1rem 0' }}>
            <AlertCircle size={48} color="#f59e0b" style={{ marginBottom: '1rem' }} />
            <p style={{ color: '#475569', marginBottom: '1.5rem' }}>
              You are about to pay <strong>{pending.length} invoices</strong> totalling <strong>₹{totalOutstanding.toLocaleString()}</strong>. This will mark all pending invoices as paid.
            </p>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button onClick={() => setBulkModal(false)} style={{ flex: 1, padding: '0.875rem', background: '#f1f5f9', border: 'none', borderRadius: 10, fontWeight: 700, cursor: 'pointer' }}>Cancel</button>
              <button onClick={handleBulkPay} disabled={bulkPaying}
                style={{ flex: 1, padding: '0.875rem', background: 'linear-gradient(135deg, #22C55E, #16a34a)', color: 'white', border: 'none', borderRadius: 10, fontWeight: 800, cursor: 'pointer' }}>
                {bulkPaying ? 'Processing...' : 'Confirm Bulk Pay'}
              </button>
            </div>
          </div>
        </Modal>

      <AIAdvisor />
      <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
