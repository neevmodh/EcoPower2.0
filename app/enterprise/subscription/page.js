'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Check, Building2, Zap, Battery, Shield, Users, BarChart3, Globe, Plus, RefreshCw,
  CheckCircle, AlertCircle, ArrowRight, Download, FileText, PauseCircle, XCircle, Activity } from 'lucide-react';
import AIAdvisor from '@/components/AIAdvisor';
import Modal from '@/components/Modal';
import PaymentFlow from '@/components/PaymentFlow';

const ENTERPRISE_PLANS = [
  {
    planId: 'ent-starter', name: 'Enterprise Starter', basePrice: 15000, ratePerKwh: 5.5,
    maxKwh: 5000, maxSites: 3, maxUsers: 10, includedSolarKw: 50,
    features: ['3 Sites', '10 Team Members', '50 kW Solar', 'Basic Analytics', 'Email Support'],
    color: '#3b82f6',
  },
  {
    planId: 'ent-growth', name: 'Enterprise Growth', basePrice: 35000, ratePerKwh: 5.0,
    maxKwh: 15000, maxSites: 10, maxUsers: 50, includedSolarKw: 150,
    features: ['10 Sites', '50 Team Members', '150 kW Solar', 'Advanced Analytics', 'Priority Support', 'API Access'],
    color: '#22C55E', popular: true,
  },
  {
    planId: 'ent-scale', name: 'Enterprise Scale', basePrice: 75000, ratePerKwh: 4.5,
    maxKwh: 50000, maxSites: 999, maxUsers: 999, includedSolarKw: 500,
    features: ['Unlimited Sites', 'Unlimited Users', '500 kW Solar', 'Custom Analytics', 'Dedicated Manager', 'SLA 99.9%', 'White-label'],
    color: '#8b5cf6',
  },
];

export default function EnterpriseSubscription() {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [wizardStep, setWizardStep] = useState(0); // 0=view, 1=select, 2=confirm, 3=pay, 4=success
  const [pendingInvoice, setPendingInvoice] = useState(null);
  const [upgradeModal, setUpgradeModal] = useState(false);
  const [previewPlan, setPreviewPlan] = useState(null);
  const [cancelModal, setCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [wizardLoading, setWizardLoading] = useState(false);

  const showToast = (msg, type = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 4000); };

  const fetchData = async () => {
    if (!user?.userId) return;
    try {
      const res = await fetch(`/api/subscriptions?userId=${user.userId}`);
      const data = await res.json();
      const subs = data.subscriptions || (Array.isArray(data) ? data : []);
      setSubscription(subs[0] || null);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, [user]);

  const handleConfirmPlan = async () => {
    if (!selectedPlan) return;
    setWizardLoading(true);
    try {
      const base = selectedPlan.basePrice;
      const tax = +(base * 0.18).toFixed(2);
      const total = +(base + tax).toFixed(2);
      setPendingInvoice({ invoiceId: `ENT-${Date.now()}`, planName: selectedPlan.name, base, tax, total, maxSites: selectedPlan.maxSites, maxUsers: selectedPlan.maxUsers });
      setWizardStep(3);
    } catch (err) { showToast('Failed', 'error'); }
    finally { setWizardLoading(false); }
  };

  const handlePaySuccess = async () => {
    setWizardStep(4);
    await fetchData();
  };

  const handleUpgrade = async (plan) => {
    setActionLoading(true);
    try {
      if (subscription?.subscriptionId) {
        await fetch(`/api/subscriptions/${subscription.subscriptionId}`, {
          method: 'PUT', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ planId: plan.planId }),
        });
      }
      await fetchData();
      setUpgradeModal(false); setPreviewPlan(null);
      showToast('Plan updated successfully!');
    } catch { showToast('Failed to update plan', 'error'); }
    finally { setActionLoading(false); }
  };

  const handleCancel = async () => {
    setActionLoading(true);
    try {
      if (subscription?.subscriptionId) {
        await fetch(`/api/subscriptions/${subscription.subscriptionId}/cancel`, {
          method: 'DELETE', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ reason: cancelReason }),
        });
      }
      await fetchData(); setCancelModal(false); showToast('Subscription cancelled.');
    } catch { showToast('Failed to cancel', 'error'); }
    finally { setActionLoading(false); }
  };

  const downloadInvoice = (inv) => {
    const lines = ['ECOPOWER ENTERPRISE SERVICES', '============================',
      `Invoice ID   : ${inv.invoiceId}`, `Plan         : ${inv.planName}`,
      `Base Amount  : ₹${inv.base}`, `GST (18%)    : ₹${inv.tax}`, `Total        : ₹${inv.total}`,
      `Generated    : ${new Date().toLocaleDateString()}`,
    ];
    const a = document.createElement('a');
    a.href = 'data:text/plain,' + encodeURIComponent(lines.join('\n'));
    a.download = `ecopower-enterprise-invoice-${Date.now()}.txt`;
    a.click();
  };

  if (loading) return <div style={{ padding: '2rem', color: '#64748b' }}>Loading...</div>;

  const currentPlan = ENTERPRISE_PLANS.find(p => p.planId === subscription?.planId) || (subscription ? ENTERPRISE_PLANS[1] : null);
  const statusColor = { active: '#10b981', paused: '#f59e0b', cancelled: '#ef4444' }[subscription?.status] || '#64748b';
  const statusBg = { active: '#dcfce7', paused: '#fef3c7', cancelled: '#fee2e2' }[subscription?.status] || '#f1f5f9';
  const currentPrice = currentPlan?.basePrice || 0;
  const previewPrice = previewPlan?.basePrice || 0;
  const priceDiff = previewPrice - currentPrice;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
      {toast && (
        <div style={{ padding: '1rem 1.5rem', background: toast.type === 'error' ? '#FEF2F2' : '#F0FDF4', border: `1px solid ${toast.type === 'error' ? '#FECACA' : '#BBF7D0'}`, borderRadius: 12, display: 'flex', alignItems: 'center', gap: 10, color: toast.type === 'error' ? '#DC2626' : '#16A34A', fontWeight: 600 }}>
          {toast.type === 'error' ? <AlertCircle size={18} /> : <CheckCircle size={18} />} {toast.msg}
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 900, margin: 0, letterSpacing: '-0.03em' }}>Enterprise Subscription</h1>
          <p style={{ color: '#64748b', margin: '0.4rem 0 0 0' }}>Manage your enterprise energy plan and billing</p>
        </div>
        {!subscription && wizardStep === 0 && (
          <button onClick={() => setWizardStep(1)}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '0.75rem 1.5rem', background: 'linear-gradient(135deg, #22C55E, #16a34a)', color: 'white', border: 'none', borderRadius: 12, fontWeight: 700, cursor: 'pointer' }}>
            <Plus size={18} /> Subscribe Now
          </button>
        )}
      </div>

      {/* Active Subscription Card */}
      {subscription && currentPlan && wizardStep === 0 && (
        <div className="glass-card" style={{ padding: '2rem', background: 'linear-gradient(135deg, #0f172a, #1e293b)', color: 'white' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
            <div>
              <div style={{ fontSize: '0.8rem', opacity: 0.6, marginBottom: 6, letterSpacing: '0.08em' }}>CURRENT ENTERPRISE PLAN</div>
              <h2 style={{ fontSize: '2.25rem', fontWeight: 900, margin: 0 }}>{currentPlan.name}</h2>
            </div>
            <span style={{ padding: '0.4rem 1rem', background: statusBg, color: statusColor, borderRadius: 20, fontSize: '0.8rem', fontWeight: 800 }}>
              {subscription.status?.toUpperCase()}
            </span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem', marginBottom: '2rem' }}>
            {[
              { label: 'Monthly Cost', value: `₹${currentPlan.basePrice.toLocaleString()}` },
              { label: 'Max Sites', value: currentPlan.maxSites === 999 ? 'Unlimited' : currentPlan.maxSites },
              { label: 'Team Members', value: currentPlan.maxUsers === 999 ? 'Unlimited' : currentPlan.maxUsers },
              { label: 'Solar Capacity', value: `${currentPlan.includedSolarKw} kW` },
            ].map(m => (
              <div key={m.label}>
                <div style={{ fontSize: '0.8rem', opacity: 0.6, marginBottom: 4 }}>{m.label}</div>
                <div style={{ fontSize: '1.75rem', fontWeight: 900 }}>{m.value}</div>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: '0.875rem', paddingTop: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
            <button onClick={() => setUpgradeModal(true)}
              style={{ padding: '0.75rem 1.5rem', background: '#22C55E', color: 'white', border: 'none', borderRadius: 10, fontWeight: 700, cursor: 'pointer' }}>
              Change Plan
            </button>
            <button onClick={() => setCancelModal(true)}
              style={{ padding: '0.75rem 1.5rem', background: 'rgba(239,68,68,0.15)', color: '#fca5a5', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10, fontWeight: 700, cursor: 'pointer' }}>
              Cancel Subscription
            </button>
          </div>
        </div>
      )}

      {/* No subscription — show plans */}
      {!subscription && wizardStep === 0 && (
        <div className="glass-card" style={{ padding: '2rem' }}>
          <h3 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: '1.5rem' }}>Choose Your Enterprise Plan</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem' }}>
            {ENTERPRISE_PLANS.map(plan => (
              <div key={plan.planId} style={{ padding: '2rem', borderRadius: 14, border: `2px solid ${plan.popular ? plan.color : '#e2e8f0'}`, position: 'relative', background: plan.popular ? '#f0fdf4' : 'white' }}>
                {plan.popular && <div style={{ position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)', background: '#22C55E', color: 'white', fontSize: '0.7rem', fontWeight: 800, padding: '3px 12px', borderRadius: 20 }}>MOST POPULAR</div>}
                <div style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: 8 }}>{plan.name}</div>
                <div style={{ fontSize: '2rem', fontWeight: 900, color: plan.color, marginBottom: '1.25rem' }}>
                  ₹{plan.basePrice.toLocaleString()}<span style={{ fontSize: '0.85rem', fontWeight: 500, color: '#64748b' }}>/mo</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.5rem' }}>
                  {plan.features.map(f => (
                    <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.82rem', color: '#374151' }}>
                      <Check size={14} color="#22C55E" />{f}
                    </div>
                  ))}
                </div>
                <button onClick={() => { setSelectedPlan(plan); setWizardStep(2); }}
                  style={{ width: '100%', padding: '0.75rem', background: `linear-gradient(135deg, ${plan.color}, ${plan.color}cc)`, color: 'white', border: 'none', borderRadius: 10, fontWeight: 700, cursor: 'pointer' }}>
                  Select Plan
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Wizard: Confirm */}
      {wizardStep === 2 && selectedPlan && (
        <div className="glass-card" style={{ padding: '2rem' }}>
          <h3 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: '1.5rem' }}>Confirm Enterprise Plan</h3>
          <div style={{ padding: '2rem', background: 'linear-gradient(135deg, #0f172a, #1e293b)', borderRadius: 14, color: 'white', marginBottom: '1.5rem' }}>
            <div style={{ fontSize: '0.8rem', opacity: 0.6, marginBottom: 6 }}>SELECTED PLAN</div>
            <div style={{ fontSize: '2rem', fontWeight: 900, marginBottom: '1.5rem' }}>{selectedPlan.name}</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem' }}>
              {[
                { label: 'Monthly', value: `₹${selectedPlan.basePrice.toLocaleString()}` },
                { label: 'Sites', value: selectedPlan.maxSites === 999 ? '∞' : selectedPlan.maxSites },
                { label: 'Users', value: selectedPlan.maxUsers === 999 ? '∞' : selectedPlan.maxUsers },
                { label: 'Solar', value: `${selectedPlan.includedSolarKw} kW` },
              ].map(m => (
                <div key={m.label}><div style={{ fontSize: '0.75rem', opacity: 0.6, marginBottom: 4 }}>{m.label}</div><div style={{ fontSize: '1.5rem', fontWeight: 900 }}>{m.value}</div></div>
              ))}
            </div>
          </div>
          <div style={{ padding: '1.25rem', background: '#f8fafc', borderRadius: 12, border: '1px solid #e2e8f0', marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}><span style={{ color: '#64748b' }}>Base Amount</span><span style={{ fontWeight: 700 }}>₹{selectedPlan.basePrice.toLocaleString()}</span></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}><span style={{ color: '#64748b' }}>GST (18%)</span><span style={{ fontWeight: 700 }}>₹{(selectedPlan.basePrice * 0.18).toFixed(0)}</span></div>
            <div style={{ height: 1, background: '#e2e8f0', margin: '0.75rem 0' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ fontWeight: 800 }}>Total Due</span><span style={{ fontSize: '1.5rem', fontWeight: 900, color: '#10b981' }}>₹{(selectedPlan.basePrice * 1.18).toFixed(0)}</span></div>
          </div>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button onClick={() => setWizardStep(0)} style={{ flex: 1, padding: '0.875rem', background: '#f1f5f9', border: 'none', borderRadius: 10, fontWeight: 600, cursor: 'pointer', color: '#64748b' }}>Back</button>
            <button onClick={handleConfirmPlan} disabled={wizardLoading}
              style={{ flex: 2, padding: '0.875rem', background: 'linear-gradient(135deg, #22C55E, #16a34a)', color: 'white', border: 'none', borderRadius: 10, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              {wizardLoading ? <><RefreshCw size={16} style={{ animation: 'spin 1s linear infinite' }} /> Processing...</> : <>Proceed to Payment <ArrowRight size={16} /></>}
            </button>
          </div>
        </div>
      )}

      {/* Wizard: Payment */}
      {wizardStep === 3 && pendingInvoice && (
        <div className="glass-card" style={{ padding: '2rem' }}>
          <h3 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: '1.5rem' }}>Complete Payment</h3>
          <PaymentFlow invoiceId={pendingInvoice.invoiceId} amount={pendingInvoice.total} onSuccess={handlePaySuccess} onClose={() => setWizardStep(2)} />
        </div>
      )}

      {/* Wizard: Success */}
      {wizardStep === 4 && (
        <div className="glass-card" style={{ padding: '3rem', textAlign: 'center' }}>
          <div style={{ width: 88, height: 88, borderRadius: '50%', background: 'linear-gradient(135deg, #22C55E, #16a34a)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem', boxShadow: '0 8px 32px rgba(34,197,94,0.4)' }}>
            <CheckCircle size={48} color="white" />
          </div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 900, color: '#16a34a', marginBottom: 8 }}>Enterprise Plan Activated!</h2>
          <p style={{ color: '#64748b', marginBottom: '1.5rem' }}>₹{pendingInvoice?.total} paid for {pendingInvoice?.planName}</p>
          <div style={{ display: 'flex', gap: '0.875rem', justifyContent: 'center' }}>
            <button onClick={() => downloadInvoice(pendingInvoice)}
              style={{ padding: '0.75rem 1.5rem', background: '#f1f5f9', border: 'none', borderRadius: 10, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, color: '#374151' }}>
              <FileText size={16} /> Download Invoice
            </button>
            <button onClick={() => { setWizardStep(0); fetchData(); }}
              style={{ padding: '0.75rem 1.5rem', background: 'linear-gradient(135deg, #22C55E, #16a34a)', color: 'white', border: 'none', borderRadius: 10, fontWeight: 700, cursor: 'pointer' }}>
              Go to Dashboard
            </button>
          </div>
        </div>
      )}

      {/* Change Plan Modal */}
      <Modal open={upgradeModal} onClose={() => { setUpgradeModal(false); setPreviewPlan(null); }} title="Change Enterprise Plan">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {ENTERPRISE_PLANS.map(plan => {
            const diff = plan.basePrice - currentPrice;
            const isCurrentPlan = plan.planId === currentPlan?.planId;
            return (
              <div key={plan.planId} onClick={() => !isCurrentPlan && setPreviewPlan(plan)}
                style={{ padding: '1.25rem', borderRadius: 12, border: `2px solid ${previewPlan?.planId === plan.planId ? '#22C55E' : isCurrentPlan ? '#e2e8f0' : '#e2e8f0'}`, background: previewPlan?.planId === plan.planId ? '#f0fdf4' : isCurrentPlan ? '#f8fafc' : 'white', cursor: isCurrentPlan ? 'default' : 'pointer', opacity: isCurrentPlan ? 0.6 : 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: 700 }}>{plan.name} {isCurrentPlan && <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>(current)</span>}</div>
                    <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: 2 }}>{plan.maxSites === 999 ? 'Unlimited' : plan.maxSites} sites · {plan.maxUsers === 999 ? 'Unlimited' : plan.maxUsers} users</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 800, fontSize: '1.1rem' }}>₹{plan.basePrice.toLocaleString()}/mo</div>
                    {!isCurrentPlan && <div style={{ fontSize: '0.78rem', fontWeight: 700, color: diff > 0 ? '#ef4444' : '#10b981' }}>{diff > 0 ? `+₹${diff.toLocaleString()}` : `-₹${Math.abs(diff).toLocaleString()}`}/mo</div>}
                  </div>
                </div>
              </div>
            );
          })}
          <button onClick={() => previewPlan && handleUpgrade(previewPlan)} disabled={!previewPlan || actionLoading}
            style={{ padding: '0.875rem', background: previewPlan ? 'linear-gradient(135deg, #22C55E, #16a34a)' : '#e2e8f0', color: previewPlan ? 'white' : '#94a3b8', border: 'none', borderRadius: 10, fontWeight: 700, cursor: previewPlan ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            {actionLoading ? <><RefreshCw size={16} style={{ animation: 'spin 1s linear infinite' }} /> Updating...</> : 'Confirm Plan Change'}
          </button>
        </div>
      </Modal>

      {/* Cancel Modal */}
      <Modal open={cancelModal} onClose={() => setCancelModal(false)} title="Cancel Subscription">
        <p style={{ color: '#64748b', marginBottom: '1rem' }}>Are you sure? Your enterprise access will end at the current billing period.</p>
        <textarea value={cancelReason} onChange={e => setCancelReason(e.target.value)} placeholder="Reason for cancellation (optional)"
          style={{ width: '100%', padding: '0.75rem', border: '1.5px solid #e2e8f0', borderRadius: 10, fontSize: '0.9rem', minHeight: 80, resize: 'vertical', boxSizing: 'border-box', marginBottom: '1rem' }} />
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button onClick={handleCancel} disabled={actionLoading}
            style={{ flex: 1, padding: '0.75rem', background: '#ef4444', color: 'white', border: 'none', borderRadius: 10, fontWeight: 700, cursor: 'pointer' }}>
            {actionLoading ? 'Cancelling...' : 'Cancel Subscription'}
          </button>
          <button onClick={() => setCancelModal(false)} style={{ flex: 1, padding: '0.75rem', background: '#f1f5f9', border: 'none', borderRadius: 10, fontWeight: 600, cursor: 'pointer', color: '#64748b' }}>Keep Plan</button>
        </div>
      </Modal>

      <AIAdvisor mode="enterprise" />
    </div>
  );
}
