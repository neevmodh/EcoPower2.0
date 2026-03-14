'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import AIAdvisor from '@/components/AIAdvisor';
import Modal from '@/components/Modal';
import PaymentFlow from '@/components/PaymentFlow';
import { downloadInvoicePDF, downloadAllInvoicesPDF } from '@/components/InvoicePDF';
import { FileText, CheckCircle, AlertCircle, Clock, Download, TrendingUp, BarChart2 } from 'lucide-react';

export default function ConsumerBilling() {
  const { user } = useAuth();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [payModal, setPayModal] = useState(null);
  const [toast, setToast] = useState(null);
  const [filter, setFilter] = useState('all');
  const [expandedId, setExpandedId] = useState(null);

  const showToast = (msg, type = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 4000); };

  const fetchInvoices = async (u) => {
    if (!u?.userId) { setLoading(false); return; }
    try {
      const res = await fetch(`/api/invoices?userId=${u.userId}&role=${u.role}`);
      const data = await res.json();
      setInvoices(Array.isArray(data) ? data : []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchInvoices(user); }, [user]);

  const downloadInvoice = (inv) => downloadInvoicePDF(inv);

  if (loading) return <div style={{ padding: '2rem', color: '#64748b' }}>Loading Billing...</div>;

  const totalPaid = invoices.filter(i => i.status === 'Paid').reduce((s, i) => s + (i.totalAmount || 0), 0);
  const totalPending = invoices.filter(i => i.status !== 'Paid').reduce((s, i) => s + (i.totalAmount || 0), 0);
  const totalOverdue = invoices.filter(i => i.status === 'Overdue').reduce((s, i) => s + (i.totalAmount || 0), 0);
  const avgMonthly = invoices.length > 0 ? (invoices.reduce((s, i) => s + (i.totalAmount || 0), 0) / invoices.length).toFixed(0) : 0;

  // Monthly trend for mini chart
  const monthlyTrend = invoices.slice(-6).map(inv => ({ label: inv.billingPeriod?.slice(0,3) || '?', value: inv.totalAmount || 0 }));
  const maxTrend = Math.max(...monthlyTrend.map(m => m.value), 1);

  const filtered = filter === 'all' ? invoices : invoices.filter(i => i.status.toLowerCase() === filter);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {toast && (
        <div style={{ padding: '1rem 1.5rem', background: toast.type === 'error' ? '#FEF2F2' : '#F0FDF4', border: `1px solid ${toast.type === 'error' ? '#FECACA' : '#BBF7D0'}`, borderRadius: 12, display: 'flex', alignItems: 'center', gap: 10, color: toast.type === 'error' ? '#DC2626' : '#16A34A', fontWeight: 600 }}>
          {toast.type === 'error' ? <AlertCircle size={18} /> : <CheckCircle size={18} />} {toast.msg}
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 900, margin: 0, letterSpacing: '-0.03em' }}>Billing & Payments</h1>
          <p style={{ color: '#64748b', margin: '0.4rem 0 0 0' }}>Manage invoices, track payments, download receipts</p>
        </div>
        <button onClick={() => downloadAllInvoicesPDF(invoices, user?.name || user?.email || 'Consumer Account')}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '0.65rem 1.25rem', background: '#1e293b', color: 'white', border: 'none', borderRadius: 10, fontWeight: 700, cursor: 'pointer', fontSize: '0.875rem' }}>
          <Download size={15} /> Export All
        </button>
      </div>

      {/* Summary Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.25rem' }}>
        <StatCard title="Total Paid" value={`₹${totalPaid.toLocaleString()}`} icon={CheckCircle} color="#10b981" sub={`${invoices.filter(i=>i.status==='Paid').length} invoices`} />
        <StatCard title="Pending" value={`₹${totalPending.toLocaleString()}`} icon={Clock} color="#f59e0b" sub={`${invoices.filter(i=>i.status!=='Paid').length} invoices`} />
        <StatCard title="Overdue" value={`₹${totalOverdue.toLocaleString()}`} icon={AlertCircle} color="#ef4444" sub={`${invoices.filter(i=>i.status==='Overdue').length} invoices`} />
        <StatCard title="Avg Monthly" value={`₹${avgMonthly}`} icon={TrendingUp} color="#6366f1" sub="Per billing period" />
      </div>

      {/* Monthly Trend Mini Chart */}
      {monthlyTrend.length > 0 && (
        <div className="glass-card" style={{ padding: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>Billing Trend</h3>
              <p style={{ color: '#64748b', margin: '0.3rem 0 0 0', fontSize: '0.8rem' }}>Last {monthlyTrend.length} billing periods</p>
            </div>
            <BarChart2 size={20} color="#6366f1" />
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '1rem', height: '120px' }}>
            {monthlyTrend.map((m, i) => (
              <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, height: '100%', justifyContent: 'flex-end' }}>
                <div style={{ fontSize: '0.65rem', fontWeight: 700, color: '#64748b' }}>₹{(m.value/1000).toFixed(1)}k</div>
                <div style={{ width: '100%', height: `${Math.max((m.value/maxTrend)*90, 8)}px`, background: 'linear-gradient(to top, #6366f1, #818cf8)', borderRadius: '4px 4px 0 0', minHeight: 8 }} />
                <div style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 600 }}>{m.label}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Invoice List */}
      <div className="glass-card" style={{ padding: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0 }}>Invoice History</h3>
          <div style={{ display: 'flex', gap: 6, background: '#f1f5f9', borderRadius: 10, padding: 4 }}>
            {[['all','All'],['paid','Paid'],['pending','Pending'],['overdue','Overdue']].map(([v, l]) => (
              <button key={v} onClick={() => setFilter(v)}
                style={{ padding: '0.4rem 1rem', borderRadius: 8, border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.8rem', background: filter === v ? '#22C55E' : 'transparent', color: filter === v ? 'white' : '#64748b' }}>
                {l}
              </button>
            ))}
          </div>
        </div>

        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>No invoices found</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
            {filtered.map(inv => {
              const isPaid = inv.status === 'Paid';
              const isOverdue = inv.status === 'Overdue';
              const statusColor = isPaid ? '#10b981' : isOverdue ? '#ef4444' : '#f59e0b';
              const StatusIcon = isPaid ? CheckCircle : isOverdue ? AlertCircle : Clock;
              const isExpanded = expandedId === inv.invoiceId;
              return (
                <div key={inv.invoiceId} style={{ borderRadius: 12, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.25rem 1.5rem', background: '#f8fafc', cursor: 'pointer', gap: '1rem' }}
                    onClick={() => setExpandedId(isExpanded ? null : inv.invoiceId)}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1 }}>
                      <div style={{ width: 44, height: 44, borderRadius: 10, background: `${statusColor}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <FileText size={20} color={statusColor} />
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#0f172a' }}>{inv.billingPeriod || 'Invoice'}</div>
                        <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                          {inv.energyUsedKwh} kWh · Due: {inv.dueDate ? new Date(inv.dueDate).toLocaleDateString() : 'N/A'}
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '1.1rem', fontWeight: 900, color: '#0f172a' }}>₹{(inv.totalAmount || 0).toLocaleString()}</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'flex-end', color: statusColor, fontSize: '0.72rem', fontWeight: 700 }}>
                          <StatusIcon size={11} /> {inv.status}
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button onClick={e => { e.stopPropagation(); downloadInvoice(inv); }}
                          style={{ width: 34, height: 34, borderRadius: 8, background: '#f1f5f9', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
                          <Download size={15} />
                        </button>
                        {!isPaid && (
                          <button onClick={e => { e.stopPropagation(); setPayModal(inv); }}
                            style={{ padding: '0.45rem 1.1rem', background: '#22C55E', color: 'white', border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer', fontSize: '0.82rem' }}>
                            Pay Now
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                  {isExpanded && (
                    <div style={{ padding: '1.25rem 1.5rem', background: 'white', borderTop: '1px solid #e2e8f0' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
                        {[
                          { label: 'Base Amount', value: `₹${inv.baseAmount}` },
                          { label: 'GST (18%)', value: `₹${inv.tax?.toFixed(2)}` },
                          { label: 'Energy Used', value: `${inv.energyUsedKwh} kWh` },
                          { label: 'Total Due', value: `₹${inv.totalAmount?.toLocaleString()}`, bold: true },
                        ].map((d, i) => (
                          <div key={i} style={{ padding: '0.875rem', background: '#f8fafc', borderRadius: 8 }}>
                            <div style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 600, marginBottom: 4 }}>{d.label}</div>
                            <div style={{ fontWeight: d.bold ? 900 : 700, color: d.bold ? '#10b981' : '#0f172a', fontSize: d.bold ? '1.1rem' : '0.95rem' }}>{d.value}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Payment Modal */}
      <Modal open={!!payModal} onClose={() => setPayModal(null)} title="Pay Invoice">
        {payModal && (
          <PaymentFlow
            invoiceId={payModal.invoiceId}
            amount={payModal.totalAmount}
            onSuccess={(txnId) => {
              setPayModal(null);
              fetchInvoices(user);
              showToast(`Payment successful! TXN: ${txnId}`);
            }}
            onClose={() => setPayModal(null)}
          />
        )}
      </Modal>

      <AIAdvisor mode="consumer" />
    </div>
  );
}

function StatCard({ title, value, icon: Icon, color, sub }) {
  return (
    <div className="metric-tile">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
        <div style={{ width: 42, height: 42, borderRadius: 10, background: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={20} color={color} />
        </div>
      </div>
      <div style={{ color: '#64748b', fontSize: '0.82rem', fontWeight: 600, marginBottom: 4 }}>{title}</div>
      <div style={{ fontSize: '1.65rem', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.02em' }}>{value}</div>
      <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: 4 }}>{sub}</div>
    </div>
  );
}
