'use client';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import {
  Check, TrendingUp, CreditCard, AlertCircle, PauseCircle, XCircle,
  PlayCircle, Plus, Trash2, Eye, Zap, Battery, Shield, Bell,
  Download, ArrowRight, CheckCircle, RefreshCw, FileText, Sparkles,
  ArrowUpRight, ArrowDownRight, Activity
} from 'lucide-react';
import AIAdvisor from '@/components/AIAdvisor';
import Modal from '@/components/Modal';
import PaymentFlow from '@/components/PaymentFlow';

const STEPS = ['Select Plan', 'Confirm', 'Invoice', 'Payment', 'Success'];

function FeatureRow({ icon: Icon, label }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.82rem', color: '#374151' }}>
      <Icon size={14} color="#22C55E" />{label}
    </div>
  );
}

// Pay-As-You-Use plan (synthetic, not from DB)
const PAYG_PLAN = {
  planId: 'payg',
  name: 'Pay As You Use',
  description: 'No fixed monthly fee. Pay only for the energy you consume.',
  targetAudience: 'Consumer',
  basePrice: 0,
  ratePerKwh: 6.5,
  maxKwh: 9999,
  includedSolarKw: 0,
  includedBatteryKwh: 0,
  batteryIncluded: false,
  isPayg: true,
};

export default function SubscriptionManagement() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const [subscription, setSubscription] = useState(null);
  const [plans, setPlans] = useState([]);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  // Wizard
  const [wizardStep, setWizardStep] = useState(0);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [pendingInvoice, setPendingInvoice] = useState(null);
  const [wizardLoading, setWizardLoading] = useState(false);

  // Upgrade
  const [upgradeModal, setUpgradeModal] = useState(false);
  const [previewPlan, setPreviewPlan] = useState(null); // plan being previewed for upgrade
  const [upgradeLoading, setUpgradeLoading] = useState(false);

  // Other actions
  const [cancelModal, setCancelModal] = useState(false);
  const [pauseModal, setPauseModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Usage tracker for PAYG
  const [paygUsage, setPaygUsage] = useState(0);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchData = async () => {
    if (!user?.userId) return;
    try {
      const [subRes, plansRes, locRes] = await Promise.all([
        fetch(`/api/subscriptions?userId=${user.userId}`),
        fetch('/api/plans'),
        fetch(`/api/locations?userId=${user.userId}&role=${user.role}`),
      ]);
      const [subData, plansData, locData] = await Promise.all([
        subRes.json(), plansRes.json(), locRes.json()
      ]);
      const subs = subData.subscriptions || (Array.isArray(subData) ? subData : []);
      setSubscription(subs[0] || null);
      const dbPlans = Array.isArray(plansData) ? plansData.filter(p => p.targetAudience !== 'Enterprise') : [];
      setPlans([...dbPlans, PAYG_PLAN]);
      setLocations(Array.isArray(locData) ? locData : []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, [user]);

  // Auto-select PAYG if ?plan=payg in URL
  useEffect(() => {
    if (searchParams?.get('plan') === 'payg' && plans.length > 0) {
      const payg = plans.find(p => p.isPayg);
      if (payg) { setSelectedPlan(payg); setWizardStep(1); }
    }
  }, [plans, searchParams]);

  // ── WIZARD: Confirm plan → create subscription + invoice ─────────────────
  const handleConfirmPlan = async () => {
    if (!selectedPlan) return;
    setWizardLoading(true);
    try {
      if (selectedPlan.isPayg) {
        // PAYG: no subscription needed, just show a mock invoice
        setPendingInvoice({
          invoiceId: `payg-${Date.now()}`,
          amount: 0,
          planName: 'Pay As You Use',
          base: 0, tax: 0, total: 0,
          maxKwh: 9999,
          isPayg: true,
        });
        setWizardStep(3);
        setWizardLoading(false);
        return;
      }
      const locationId = selectedLocation || locations[0]?.locationId || locations[0]?._id?.toString();
      if (!locationId) { showToast('No location found.', 'error'); setWizardLoading(false); return; }

      const res = await fetch('/api/subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.userId, planId: selectedPlan.planId, locationId, billingCycle: 'monthly' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create subscription');

      const base = selectedPlan.basePrice;
      const tax = +(base * 0.18).toFixed(2);
      const total = +(base + tax).toFixed(2);
      setPendingInvoice({ invoiceId: data.invoiceId, amount: total, planName: selectedPlan.name, base, tax, total, maxKwh: selectedPlan.maxKwh });
      setWizardStep(3);
    } catch (err) {
      showToast(err.message || 'Failed to create subscription', 'error');
    } finally { setWizardLoading(false); }
  };

  const handlePaymentSuccess = async () => {
    setWizardStep(5);
    await fetchData();
  };

  // ── UPGRADE ───────────────────────────────────────────────────────────────
  const handleUpgrade = async (newPlanId) => {
    setUpgradeLoading(true);
    try {
      const res = await fetch(`/api/subscriptions/${subscription.subscriptionId}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId: newPlanId }),
      });
      if (!res.ok) throw new Error();
      await fetchData();
      setUpgradeModal(false);
      setPreviewPlan(null);
      showToast('Plan changed successfully!');
    } catch { showToast('Failed to change plan', 'error'); }
    finally { setUpgradeLoading(false); }
  };

  // ── CANCEL ────────────────────────────────────────────────────────────────
  const handleCancel = async () => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/subscriptions/${subscription.subscriptionId}/cancel`, {
        method: 'DELETE', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: cancelReason }),
      });
      if (!res.ok) throw new Error();
      await fetchData(); setCancelModal(false); showToast('Subscription cancelled.');
    } catch { showToast('Failed to cancel', 'error'); }
    finally { setActionLoading(false); }
  };

  // ── PAUSE / RESUME ────────────────────────────────────────────────────────
  const handlePause = async () => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/subscriptions/${subscription.subscriptionId}/pause`, { method: 'POST' });
      if (!res.ok) throw new Error();
      await fetchData(); setPauseModal(false); showToast('Subscription paused.');
    } catch { showToast('Failed to pause', 'error'); }
    finally { setActionLoading(false); }
  };

  const handleResume = async () => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/subscriptions/${subscription.subscriptionId}/resume`, { method: 'POST' });
      if (!res.ok) throw new Error();
      await fetchData(); showToast('Subscription resumed!');
    } catch { showToast('Failed to resume', 'error'); }
    finally { setActionLoading(false); }
  };

  const downloadInvoice = (inv) => {
    const lines = [
      'ECOPOWER ENERGY SERVICES', '========================',
      `Invoice ID   : INV-${(inv.invoiceId || '').slice(-6).toUpperCase()}`,
      `Plan         : ${inv.planName || 'Solar Plan'}`,
      inv.isPayg ? 'Type         : Pay As You Use (₹6.5/kWh)' : `Energy Limit : ${inv.maxKwh || 0} kWh`,
      `Base Amount  : ₹${inv.base || 0}`,
      `GST (18%)    : ₹${inv.tax || 0}`,
      `Total        : ₹${inv.total || 0}`,
      `Status       : ${inv.isPayg ? 'Activation Free' : 'Payment Pending'}`,
      `Generated    : ${new Date().toLocaleDateString()}`,
    ];
    const a = document.createElement('a');
    a.href = 'data:text/plain,' + encodeURIComponent(lines.join('\n'));
    a.download = `ecopower-invoice-${Date.now()}.txt`;
    a.click();
  };

  if (loading) return <div style={{ padding: '2rem', color: '#64748b' }}>Loading...</div>;

  const currentPlan = subscription?.plan
    ? { name: subscription.plan.name, basePrice: subscription.plan.pricePerMonth, includedSolarKw: subscription.plan.solarCapacityKw }
    : plans.find(p => p.planId === subscription?.planId);

  const statusColor = { active: '#10b981', paused: '#f59e0b', cancelled: '#ef4444' }[subscription?.status] || '#64748b';
  const statusBg   = { active: '#dcfce7', paused: '#fef3c7', cancelled: '#fee2e2' }[subscription?.status] || '#f1f5f9';

  // Price diff for upgrade preview
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
          <h1 style={{ fontSize: '2rem', fontWeight: 900, margin: 0, letterSpacing: '-0.03em' }}>Subscription Management</h1>
          <p style={{ color: '#64748b', margin: '0.4rem 0 0 0' }}>Manage your energy plan, billing, and payments</p>
        </div>
        {!subscription && wizardStep === 0 && (
          <button onClick={() => setWizardStep(1)}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '0.75rem 1.5rem', background: 'linear-gradient(135deg, #22C55E, #16a34a)', color: 'white', border: 'none', borderRadius: 12, fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 12px rgba(34,197,94,0.35)' }}>
            <Plus size={18} /> Subscribe Now
          </button>
        )}
      </div>

      {/* ── WIZARD ─────────────────────────────────────────────────────────── */}
      {wizardStep > 0 && (
        <div className="glass-card" style={{ padding: '2rem' }}>
          {/* Progress */}
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '2rem' }}>
            {STEPS.map((s, i) => {
              const n = i + 1; const done = wizardStep > n; const active = wizardStep === n;
              return (
                <div key={s} style={{ display: 'flex', alignItems: 'center', flex: i < STEPS.length - 1 ? 1 : 'none' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                    <div style={{ width: 36, height: 36, borderRadius: '50%', background: done ? '#22C55E' : active ? '#0f172a' : '#e2e8f0', color: done || active ? 'white' : '#94a3b8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.875rem' }}>
                      {done ? <Check size={18} /> : n}
                    </div>
                    <span style={{ fontSize: '0.7rem', fontWeight: 600, color: active ? '#0f172a' : done ? '#22C55E' : '#94a3b8', whiteSpace: 'nowrap' }}>{s}</span>
                  </div>
                  {i < STEPS.length - 1 && <div style={{ flex: 1, height: 2, background: done ? '#22C55E' : '#e2e8f0', margin: '0 8px', marginBottom: 20 }} />}
                </div>
              );
            })}
          </div>

          {/* Step 1: Select Plan */}
          {wizardStep === 1 && (
            <div>
              <h3 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: '1.5rem' }}>Choose Your Energy Plan</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}>
                {plans.map(plan => {
                  const isSelected = selectedPlan?.planId === plan.planId;
                  const tax = plan.isPayg ? 0 : +(plan.basePrice * 0.18).toFixed(2);
                  const total = plan.isPayg ? 0 : +(plan.basePrice + tax).toFixed(2);
                  const popular = !plan.isPayg && plan.basePrice > 2000 && plan.basePrice < 5000;
                  return (
                    <div key={plan.planId} onClick={() => setSelectedPlan(plan)}
                      style={{ padding: '1.75rem', borderRadius: 14, border: `2px solid ${isSelected ? '#22C55E' : plan.isPayg ? '#8B5CF6' : '#e2e8f0'}`, background: isSelected ? '#f0fdf4' : plan.isPayg ? '#faf5ff' : 'white', cursor: 'pointer', position: 'relative', transition: 'all 0.2s', boxShadow: isSelected ? '0 0 0 4px rgba(34,197,94,0.15)' : 'none' }}>
                      {popular && <div style={{ position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)', background: '#f59e0b', color: 'white', fontSize: '0.7rem', fontWeight: 800, padding: '3px 12px', borderRadius: 20, whiteSpace: 'nowrap' }}>MOST POPULAR</div>}
                      {plan.isPayg && <div style={{ position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)', background: '#8B5CF6', color: 'white', fontSize: '0.7rem', fontWeight: 800, padding: '3px 12px', borderRadius: 20, whiteSpace: 'nowrap' }}>FLEXIBLE</div>}
                      {isSelected && <div style={{ position: 'absolute', top: 12, right: 12 }}><CheckCircle size={22} color="#22C55E" /></div>}
                      <div style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: 4 }}>{plan.name}</div>
                      {plan.isPayg ? (
                        <div style={{ marginBottom: '1rem' }}>
                          <div style={{ fontSize: '2rem', fontWeight: 900, color: '#8B5CF6' }}>₹{plan.ratePerKwh}<span style={{ fontSize: '0.85rem', fontWeight: 500, color: '#64748b' }}>/kWh</span></div>
                          <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: 2 }}>No fixed monthly fee</div>
                        </div>
                      ) : (
                        <div style={{ fontSize: '2rem', fontWeight: 900, color: '#10b981', marginBottom: '1rem' }}>
                          ₹{plan.basePrice}<span style={{ fontSize: '0.85rem', fontWeight: 500, color: '#64748b' }}>/mo</span>
                        </div>
                      )}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.25rem' }}>
                        {plan.isPayg ? (
                          <>
                            <FeatureRow icon={Activity} label="Pay only what you use" />
                            <FeatureRow icon={Zap} label="₹6.5 per kWh consumed" />
                            <FeatureRow icon={Shield} label="No lock-in period" />
                            <FeatureRow icon={Bell} label="Real-time usage alerts" />
                          </>
                        ) : (
                          <>
                            <FeatureRow icon={Zap} label={`${plan.includedSolarKw} kW Solar Capacity`} />
                            <FeatureRow icon={Battery} label={`${plan.maxKwh || 0} kWh Energy Limit`} />
                            <FeatureRow icon={Shield} label="24/7 Monitoring" />
                            <FeatureRow icon={Bell} label="Smart Alerts" />
                          </>
                        )}
                      </div>
                      {!plan.isPayg && (
                        <div style={{ padding: '0.75rem', background: '#f8fafc', borderRadius: 8, fontSize: '0.78rem', color: '#64748b' }}>
                          Total with GST: <span style={{ fontWeight: 800, color: '#0f172a' }}>₹{total}/mo</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              {locations.length > 1 && (
                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#374151', display: 'block', marginBottom: 8 }}>Installation Location</label>
                  <select value={selectedLocation || ''} onChange={e => setSelectedLocation(e.target.value)}
                    style={{ width: '100%', padding: '0.75rem', border: '1.5px solid #e2e8f0', borderRadius: 10, fontSize: '0.9rem' }}>
                    {locations.map(l => <option key={l.locationId || l._id} value={l.locationId || l._id}>{l.name || l.address_line1 || 'Location'}</option>)}
                  </select>
                </div>
              )}
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button onClick={() => { setWizardStep(0); setSelectedPlan(null); }}
                  style={{ flex: 1, padding: '0.875rem', background: '#f1f5f9', border: 'none', borderRadius: 10, fontWeight: 600, cursor: 'pointer', color: '#64748b' }}>Cancel</button>
                <button onClick={() => selectedPlan && setWizardStep(2)} disabled={!selectedPlan}
                  style={{ flex: 2, padding: '0.875rem', background: selectedPlan ? 'linear-gradient(135deg, #22C55E, #16a34a)' : '#e2e8f0', color: selectedPlan ? 'white' : '#94a3b8', border: 'none', borderRadius: 10, fontWeight: 700, cursor: selectedPlan ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                  Continue <ArrowRight size={16} />
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Confirm */}
          {wizardStep === 2 && selectedPlan && (
            <div>
              <h3 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: '1.5rem' }}>Confirm Your Plan</h3>
              <div style={{ padding: '2rem', background: selectedPlan.isPayg ? 'linear-gradient(135deg, #4C1D95, #6D28D9)' : 'linear-gradient(135deg, #0f172a, #1e293b)', borderRadius: 14, color: 'white', marginBottom: '1.5rem' }}>
                <div style={{ fontSize: '0.8rem', opacity: 0.6, marginBottom: 6, letterSpacing: '0.08em' }}>SELECTED PLAN</div>
                <div style={{ fontSize: '2rem', fontWeight: 900, marginBottom: '1.5rem' }}>{selectedPlan.name}</div>
                {selectedPlan.isPayg ? (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem', marginBottom: '1.5rem' }}>
                    <div><div style={{ fontSize: '0.75rem', opacity: 0.6, marginBottom: 4 }}>Rate</div><div style={{ fontSize: '1.5rem', fontWeight: 900 }}>₹6.5/kWh</div></div>
                    <div><div style={{ fontSize: '0.75rem', opacity: 0.6, marginBottom: 4 }}>Fixed Fee</div><div style={{ fontSize: '1.5rem', fontWeight: 900 }}>₹0</div></div>
                    <div><div style={{ fontSize: '0.75rem', opacity: 0.6, marginBottom: 4 }}>Lock-in</div><div style={{ fontSize: '1.5rem', fontWeight: 900 }}>None</div></div>
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem', marginBottom: '1.5rem' }}>
                    <div><div style={{ fontSize: '0.75rem', opacity: 0.6, marginBottom: 4 }}>Monthly Price</div><div style={{ fontSize: '1.5rem', fontWeight: 900 }}>₹{selectedPlan.basePrice}</div></div>
                    <div><div style={{ fontSize: '0.75rem', opacity: 0.6, marginBottom: 4 }}>Solar Capacity</div><div style={{ fontSize: '1.5rem', fontWeight: 900 }}>{selectedPlan.includedSolarKw} kW</div></div>
                    <div><div style={{ fontSize: '0.75rem', opacity: 0.6, marginBottom: 4 }}>Energy Limit</div><div style={{ fontSize: '1.5rem', fontWeight: 900 }}>{selectedPlan.maxKwh} kWh</div></div>
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button onClick={() => setWizardStep(1)} style={{ flex: 1, padding: '0.875rem', background: '#f1f5f9', border: 'none', borderRadius: 10, fontWeight: 600, cursor: 'pointer', color: '#64748b' }}>Back</button>
                <button onClick={handleConfirmPlan} disabled={wizardLoading}
                  style={{ flex: 2, padding: '0.875rem', background: 'linear-gradient(135deg, #22C55E, #16a34a)', color: 'white', border: 'none', borderRadius: 10, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, opacity: wizardLoading ? 0.7 : 1 }}>
                  {wizardLoading ? <><RefreshCw size={16} style={{ animation: 'spin 1s linear infinite' }} /> Creating...</> : <>Confirm Plan <ArrowRight size={16} /></>}
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Invoice */}
          {wizardStep === 3 && pendingInvoice && (
            <div>
              <h3 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: '1.5rem' }}>Your Invoice</h3>
              <div style={{ padding: '2rem', background: '#f8fafc', borderRadius: 14, border: '1px solid #e2e8f0', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                  <div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>EcoPower Energy Services</div>
                    <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: 2 }}>Invoice generated automatically</div>
                  </div>
                  <div style={{ padding: '4px 12px', background: pendingInvoice.isPayg ? '#EDE9FE' : '#fef3c7', color: pendingInvoice.isPayg ? '#7C3AED' : '#d97706', borderRadius: 20, fontSize: '0.75rem', fontWeight: 800 }}>
                    {pendingInvoice.isPayg ? 'ACTIVATION FREE' : 'PAYMENT PENDING'}
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.875rem', marginBottom: '1.5rem' }}>
                  {[
                    { label: 'Invoice ID', value: `INV-${(pendingInvoice.invoiceId || '').slice(-6).toUpperCase()}` },
                    { label: 'Plan', value: pendingInvoice.planName },
                    { label: 'Billing Period', value: new Date().toLocaleString('default', { month: 'long', year: 'numeric' }) },
                    { label: 'Due Date', value: pendingInvoice.isPayg ? 'End of month' : new Date(Date.now() + 15 * 86400000).toLocaleDateString() },
                  ].map(r => (
                    <div key={r.label} style={{ padding: '0.75rem', background: 'white', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                      <div style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 600, marginBottom: 3 }}>{r.label}</div>
                      <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.9rem' }}>{r.value}</div>
                    </div>
                  ))}
                </div>
                {pendingInvoice.isPayg ? (
                  <div style={{ padding: '1rem', background: '#EDE9FE', borderRadius: 10, border: '1px solid #DDD6FE', textAlign: 'center' }}>
                    <div style={{ fontWeight: 800, color: '#6D28D9', fontSize: '1rem' }}>Pay As You Use — ₹6.5/kWh</div>
                    <div style={{ fontSize: '0.8rem', color: '#7C3AED', marginTop: 4 }}>You will be billed at the end of each month based on actual consumption</div>
                  </div>
                ) : (
                  <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '1.25rem' }}>
                    {[{ label: 'Base Amount', value: `₹${pendingInvoice.base}` }, { label: 'GST (18%)', value: `₹${pendingInvoice.tax}` }].map(r => (
                      <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: '0.9rem' }}>
                        <span style={{ color: '#64748b' }}>{r.label}</span><span style={{ fontWeight: 700 }}>{r.value}</span>
                      </div>
                    ))}
                    <div style={{ height: 1, background: '#e2e8f0', margin: '0.75rem 0' }} />
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 800, fontSize: '1rem' }}>Total Due</span>
                      <span style={{ fontSize: '1.5rem', fontWeight: 900, color: '#10b981' }}>₹{pendingInvoice.total}</span>
                    </div>
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button onClick={() => downloadInvoice(pendingInvoice)}
                  style={{ flex: 1, padding: '0.875rem', background: '#f1f5f9', border: 'none', borderRadius: 10, fontWeight: 600, cursor: 'pointer', color: '#374151', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                  <Download size={16} /> Download
                </button>
                <button onClick={() => pendingInvoice.isPayg ? setWizardStep(5) : setWizardStep(4)}
                  style={{ flex: 2, padding: '0.875rem', background: 'linear-gradient(135deg, #22C55E, #16a34a)', color: 'white', border: 'none', borderRadius: 10, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                  {pendingInvoice.isPayg ? <>Activate Plan <ArrowRight size={16} /></> : <>Pay ₹{pendingInvoice.total} <ArrowRight size={16} /></>}
                </button>
              </div>
            </div>
          )}

          {/* Step 4: Payment */}
          {wizardStep === 4 && pendingInvoice && (
            <div>
              <h3 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: '1.5rem' }}>Complete Payment</h3>
              <PaymentFlow invoiceId={pendingInvoice.invoiceId} amount={pendingInvoice.total} onSuccess={handlePaymentSuccess} onClose={() => setWizardStep(3)} />
            </div>
          )}

          {/* Step 5: Success */}
          {wizardStep === 5 && (
            <div style={{ textAlign: 'center', padding: '2rem 0' }}>
              <div style={{ width: 88, height: 88, borderRadius: '50%', background: 'linear-gradient(135deg, #22C55E, #16a34a)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem', boxShadow: '0 8px 32px rgba(34,197,94,0.4)' }}>
                <CheckCircle size={48} color="white" />
              </div>
              <h2 style={{ fontSize: '1.75rem', fontWeight: 900, color: '#16a34a', marginBottom: 8 }}>
                {pendingInvoice?.isPayg ? 'Plan Activated!' : 'Payment Successful!'}
              </h2>
              <p style={{ color: '#64748b', marginBottom: '1.5rem', fontSize: '1rem' }}>
                {pendingInvoice?.isPayg ? 'Pay As You Use plan is now active. You will be billed monthly.' : `₹${pendingInvoice?.total} paid for ${pendingInvoice?.planName}`}
              </p>
              <div style={{ display: 'flex', gap: '0.875rem', justifyContent: 'center' }}>
                <button onClick={() => downloadInvoice(pendingInvoice)}
                  style={{ padding: '0.75rem 1.5rem', background: '#f1f5f9', border: 'none', borderRadius: 10, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, color: '#374151' }}>
                  <FileText size={16} /> Download Invoice
                </button>
                <button onClick={() => { setWizardStep(0); setSelectedPlan(null); setPendingInvoice(null); fetchData(); }}
                  style={{ padding: '0.75rem 1.5rem', background: 'linear-gradient(135deg, #22C55E, #16a34a)', color: 'white', border: 'none', borderRadius: 10, fontWeight: 700, cursor: 'pointer' }}>
                  Go to Dashboard
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── ACTIVE SUBSCRIPTION CARD ─────────────────────────────────────────── */}
      {subscription && currentPlan && wizardStep === 0 && (
        <div className="glass-card" style={{ padding: '2rem', background: 'linear-gradient(135deg, #0f172a, #1e293b)', color: 'white' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
            <div>
              <div style={{ fontSize: '0.8rem', opacity: 0.6, marginBottom: 6, letterSpacing: '0.08em' }}>CURRENT PLAN</div>
              <h2 style={{ fontSize: '2.25rem', fontWeight: 900, margin: 0 }}>{currentPlan.name}</h2>
            </div>
            <span style={{ padding: '0.4rem 1rem', background: statusBg, color: statusColor, borderRadius: 20, fontSize: '0.8rem', fontWeight: 800 }}>
              {subscription.status?.toUpperCase()}
            </span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '2rem', marginBottom: '2rem' }}>
            <div><div style={{ fontSize: '0.8rem', opacity: 0.6, marginBottom: 4 }}>Monthly Cost</div><div style={{ fontSize: '2rem', fontWeight: 900 }}>₹{currentPlan.basePrice || '6.5/kWh'}</div></div>
            <div><div style={{ fontSize: '0.8rem', opacity: 0.6, marginBottom: 4 }}>Solar Capacity</div><div style={{ fontSize: '2rem', fontWeight: 900 }}>{currentPlan.includedSolarKw || 0} kW</div></div>
            <div><div style={{ fontSize: '0.8rem', opacity: 0.6, marginBottom: 4 }}>Next Billing</div><div style={{ fontSize: '1.25rem', fontWeight: 900 }}>{new Date(Date.now() + 30 * 86400000).toLocaleDateString()}</div></div>
          </div>
          <div style={{ display: 'flex', gap: '0.875rem', paddingTop: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.1)', flexWrap: 'wrap' }}>
            {subscription.status === 'active' && (
              <>
                <button onClick={() => setUpgradeModal(true)}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '0.7rem 1.25rem', background: '#22C55E', color: 'white', border: 'none', borderRadius: 10, fontWeight: 700, cursor: 'pointer', fontSize: '0.875rem' }}>
                  <TrendingUp size={16} /> Change Plan
                </button>
                <button onClick={() => setPauseModal(true)}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '0.7rem 1.25rem', background: 'rgba(255,255,255,0.1)', color: 'white', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 10, fontWeight: 700, cursor: 'pointer', fontSize: '0.875rem' }}>
                  <PauseCircle size={16} /> Pause
                </button>
                <button onClick={() => setCancelModal(true)}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '0.7rem 1.25rem', background: 'rgba(239,68,68,0.15)', color: '#fca5a5', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10, fontWeight: 700, cursor: 'pointer', fontSize: '0.875rem' }}>
                  <XCircle size={16} /> Cancel
                </button>
              </>
            )}
            {subscription.status === 'paused' && (
              <button onClick={handleResume} disabled={actionLoading}
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '0.7rem 1.25rem', background: '#22C55E', color: 'white', border: 'none', borderRadius: 10, fontWeight: 700, cursor: 'pointer', fontSize: '0.875rem', opacity: actionLoading ? 0.7 : 1 }}>
                <PlayCircle size={16} /> {actionLoading ? 'Resuming...' : 'Resume Plan'}
              </button>
            )}
          </div>
        </div>
      )}

      {/* No subscription state */}
      {!subscription && wizardStep === 0 && (
        <div style={{ textAlign: 'center', padding: '4rem 2rem', background: 'white', borderRadius: 16, border: '2px dashed #e2e8f0' }}>
          <div style={{ width: 72, height: 72, borderRadius: '50%', background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
            <Zap size={32} color="#22C55E" />
          </div>
          <h3 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: 8 }}>No Active Subscription</h3>
          <p style={{ color: '#64748b', marginBottom: '2rem' }}>Choose a plan to start your clean energy journey</p>
          <button onClick={() => setWizardStep(1)}
            style={{ padding: '0.875rem 2rem', background: 'linear-gradient(135deg, #22C55E, #16a34a)', color: 'white', border: 'none', borderRadius: 12, fontWeight: 700, cursor: 'pointer', fontSize: '1rem', boxShadow: '0 4px 12px rgba(34,197,94,0.35)' }}>
            Browse Plans
          </button>
        </div>
      )}

      {/* ── UPGRADE MODAL with Plan Preview + Price Diff ─────────────────────── */}
      <Modal open={upgradeModal} onClose={() => { setUpgradeModal(false); setPreviewPlan(null); }} title="Change Plan" width={860}>
        <div style={{ display: 'grid', gridTemplateColumns: previewPlan ? '1fr 1fr' : '1fr', gap: '1.5rem' }}>
          {/* Plan list */}
          <div>
            <p style={{ color: '#64748b', fontSize: '0.875rem', marginBottom: '1rem' }}>Select a plan to preview changes</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {plans.map(plan => {
                const isCurrent = plan.planId === subscription?.planId;
                const isPreview = previewPlan?.planId === plan.planId;
                const diff = plan.isPayg ? null : plan.basePrice - currentPrice;
                return (
                  <div key={plan.planId} onClick={() => !isCurrent && setPreviewPlan(plan)}
                    style={{ padding: '1rem 1.25rem', borderRadius: 12, border: `2px solid ${isPreview ? '#22C55E' : isCurrent ? '#3B82F6' : '#e2e8f0'}`, background: isPreview ? '#f0fdf4' : isCurrent ? '#EFF6FF' : 'white', cursor: isCurrent ? 'default' : 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', transition: 'all 0.15s' }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#0f172a' }}>{plan.name}</div>
                      <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: 2 }}>
                        {plan.isPayg ? '₹6.5/kWh · No fixed fee' : `₹${plan.basePrice}/mo · ${plan.includedSolarKw} kW`}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      {isCurrent && <span style={{ fontSize: '0.7rem', fontWeight: 800, background: '#DBEAFE', color: '#2563EB', padding: '2px 8px', borderRadius: 10 }}>CURRENT</span>}
                      {!isCurrent && !plan.isPayg && diff !== null && (
                        <span style={{ fontSize: '0.75rem', fontWeight: 800, color: diff > 0 ? '#DC2626' : '#16A34A', display: 'flex', alignItems: 'center', gap: 2 }}>
                          {diff > 0 ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
                          {diff > 0 ? '+' : ''}₹{diff}/mo
                        </span>
                      )}
                      {isPreview && <CheckCircle size={18} color="#22C55E" />}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Preview panel */}
          {previewPlan && (
            <div style={{ background: '#f8fafc', borderRadius: 14, padding: '1.5rem', border: '1px solid #e2e8f0' }}>
              <div style={{ fontWeight: 800, fontSize: '1rem', marginBottom: '1.25rem', color: '#0f172a' }}>Plan Preview</div>

              {/* Current vs New */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1.25rem' }}>
                <div style={{ padding: '1rem', background: 'white', borderRadius: 10, border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 600, marginBottom: 4 }}>CURRENT</div>
                  <div style={{ fontWeight: 800, color: '#0f172a' }}>{currentPlan?.name || 'None'}</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#64748b', marginTop: 4 }}>₹{currentPrice}/mo</div>
                </div>
                <div style={{ padding: '1rem', background: '#f0fdf4', borderRadius: 10, border: '2px solid #22C55E' }}>
                  <div style={{ fontSize: '0.7rem', color: '#16a34a', fontWeight: 600, marginBottom: 4 }}>NEW</div>
                  <div style={{ fontWeight: 800, color: '#0f172a' }}>{previewPlan.name}</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#16a34a', marginTop: 4 }}>
                    {previewPlan.isPayg ? '₹6.5/kWh' : `₹${previewPrice}/mo`}
                  </div>
                </div>
              </div>

              {/* Price difference */}
              {!previewPlan.isPayg && (
                <div style={{ padding: '1rem', background: priceDiff > 0 ? '#FEF2F2' : '#F0FDF4', borderRadius: 10, border: `1px solid ${priceDiff > 0 ? '#FECACA' : '#BBF7D0'}`, marginBottom: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 700, color: '#374151', fontSize: '0.875rem' }}>Monthly difference</span>
                  <span style={{ fontWeight: 900, fontSize: '1.25rem', color: priceDiff > 0 ? '#DC2626' : '#16A34A', display: 'flex', alignItems: 'center', gap: 4 }}>
                    {priceDiff > 0 ? <ArrowUpRight size={18} /> : <ArrowDownRight size={18} />}
                    {priceDiff > 0 ? '+' : ''}₹{priceDiff}/mo
                  </span>
                </div>
              )}

              {/* Features */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.5rem' }}>
                {previewPlan.isPayg ? (
                  <>
                    <FeatureRow icon={Activity} label="Pay only for what you use" />
                    <FeatureRow icon={Zap} label="₹6.5 per kWh consumed" />
                    <FeatureRow icon={Shield} label="No lock-in period" />
                  </>
                ) : (
                  <>
                    <FeatureRow icon={Zap} label={`${previewPlan.includedSolarKw} kW Solar Capacity`} />
                    <FeatureRow icon={Battery} label={`${previewPlan.maxKwh} kWh Energy Limit`} />
                    <FeatureRow icon={Shield} label="24/7 Monitoring" />
                  </>
                )}
              </div>

              <button onClick={() => handleUpgrade(previewPlan.planId)} disabled={upgradeLoading || previewPlan.isPayg}
                style={{ width: '100%', padding: '0.875rem', background: previewPlan.isPayg ? '#e2e8f0' : 'linear-gradient(135deg, #22C55E, #16a34a)', color: previewPlan.isPayg ? '#94a3b8' : 'white', border: 'none', borderRadius: 10, fontWeight: 700, cursor: previewPlan.isPayg ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, opacity: upgradeLoading ? 0.7 : 1 }}>
                {upgradeLoading ? <><RefreshCw size={16} style={{ animation: 'spin 1s linear infinite' }} /> Switching...</> : previewPlan.isPayg ? 'Contact support to switch to PAYG' : `Switch to ${previewPlan.name}`}
              </button>
            </div>
          )}
        </div>
      </Modal>

      {/* Pause Modal */}
      <Modal open={pauseModal} onClose={() => setPauseModal(false)} title="Pause Subscription" width={440}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ padding: '1rem', background: '#FEF3C7', borderRadius: 10, border: '1px solid #FDE68A', display: 'flex', gap: 10 }}>
            <AlertCircle size={18} color="#D97706" style={{ flexShrink: 0, marginTop: 2 }} />
            <div style={{ fontSize: '0.875rem', color: '#92400E' }}>Your subscription will be paused. You can resume it anytime. Billing will stop during the pause period.</div>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={() => setPauseModal(false)} style={{ flex: 1, padding: '0.75rem', background: '#f1f5f9', border: 'none', borderRadius: 10, fontWeight: 600, cursor: 'pointer', color: '#374151' }}>Cancel</button>
            <button onClick={handlePause} disabled={actionLoading}
              style={{ flex: 1, padding: '0.75rem', background: '#F59E0B', color: 'white', border: 'none', borderRadius: 10, fontWeight: 700, cursor: 'pointer', opacity: actionLoading ? 0.7 : 1 }}>
              {actionLoading ? 'Pausing...' : 'Pause Subscription'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Cancel Modal */}
      <Modal open={cancelModal} onClose={() => setCancelModal(false)} title="Cancel Subscription" width={440}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ padding: '1rem', background: '#FEF2F2', borderRadius: 10, border: '1px solid #FECACA', display: 'flex', gap: 10 }}>
            <AlertCircle size={18} color="#DC2626" style={{ flexShrink: 0, marginTop: 2 }} />
            <div style={{ fontSize: '0.875rem', color: '#991B1B' }}>This action is permanent. Your subscription will be cancelled at the end of the current billing period.</div>
          </div>
          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#374151', display: 'block', marginBottom: 6 }}>Reason for cancellation (optional)</label>
            <textarea value={cancelReason} onChange={e => setCancelReason(e.target.value)} placeholder="Tell us why you're leaving..."
              style={{ width: '100%', padding: '0.75rem', border: '1.5px solid #e2e8f0', borderRadius: 10, fontSize: '0.875rem', resize: 'vertical', minHeight: 80, boxSizing: 'border-box', fontFamily: 'Inter, sans-serif' }} />
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={() => setCancelModal(false)} style={{ flex: 1, padding: '0.75rem', background: '#f1f5f9', border: 'none', borderRadius: 10, fontWeight: 600, cursor: 'pointer', color: '#374151' }}>Keep Plan</button>
            <button onClick={handleCancel} disabled={actionLoading}
              style={{ flex: 1, padding: '0.75rem', background: '#EF4444', color: 'white', border: 'none', borderRadius: 10, fontWeight: 700, cursor: 'pointer', opacity: actionLoading ? 0.7 : 1 }}>
              {actionLoading ? 'Cancelling...' : 'Cancel Subscription'}
            </button>
          </div>
        </div>
      </Modal>

      <AIAdvisor mode="consumer" context={`Plan: ${currentPlan?.name || 'None'}, Status: ${subscription?.status || 'No subscription'}`} />
    </div>
  );
}
