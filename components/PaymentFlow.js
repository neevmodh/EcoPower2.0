'use client';
import { useState } from 'react';
import { CreditCard, Smartphone, Building2, Wallet, Lock, CheckCircle, AlertCircle, Shield, ArrowLeft, Loader } from 'lucide-react';

// Multi-step realistic payment flow: method → details → otp → processing → success/fail
export default function PaymentFlow({ invoiceId, amount, onSuccess, onClose }) {
  const [step, setStep] = useState('method'); // method | details | otp | processing | success | failed
  const [method, setMethod] = useState('');
  const [form, setForm] = useState({ cardNumber: '', cardName: '', expiry: '', cvv: '', upiId: '', bank: '', wallet: '' });
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [errors, setErrors] = useState({});
  const [txnId] = useState(`TXN${Date.now()}${Math.random().toString(36).slice(2,6).toUpperCase()}`);
  const [failReason, setFailReason] = useState('');

  const fmtCard = v => v.replace(/\D/g,'').slice(0,16).replace(/(.{4})/g,'$1 ').trim();

  const validate = () => {
    const e = {};
    if (method === 'card') {
      if (form.cardNumber.replace(/\s/g,'').length < 16) e.cardNumber = 'Enter valid 16-digit card number';
      if (!form.cardName.trim()) e.cardName = 'Cardholder name required';
      if (!/^\d{2}\/\d{2}$/.test(form.expiry)) e.expiry = 'Format: MM/YY';
      if (!/^\d{3,4}$/.test(form.cvv)) e.cvv = 'Invalid CVV';
    }
    if (method === 'upi') {
      if (!/^[\w.\-]+@[\w]+$/.test(form.upiId)) e.upiId = 'Invalid UPI ID (e.g. name@paytm)';
    }
    if (method === 'netbanking' && !form.bank) e.bank = 'Select a bank';
    if (method === 'wallet' && !form.wallet) e.wallet = 'Select a wallet';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleProceed = () => {
    if (!validate()) return;
    setStep('otp');
  };

  const handleOtpChange = (i, val) => {
    if (!/^\d?$/.test(val)) return;
    const next = [...otp]; next[i] = val;
    setOtp(next);
    if (val && i < 5) document.getElementById(`otp-${i+1}`)?.focus();
  };

  const handleVerifyOtp = async () => {
    const code = otp.join('');
    if (code.length < 6) { setErrors({ otp: 'Enter 6-digit OTP' }); return; }
    setStep('processing');
    await new Promise(r => setTimeout(r, 800));
    try {
      // Only call real API for valid MongoDB ObjectIds (24 hex chars)
      const isRealInvoice = /^[a-f0-9]{24}$/i.test(invoiceId);
      let ok = true;
      if (isRealInvoice) {
        const res = await fetch(`/api/invoices/${invoiceId}/pay`, { method: 'PUT', headers: { 'Content-Type': 'application/json' } });
        ok = res.ok;
      }
      if (ok) { setStep('success'); setTimeout(() => onSuccess && onSuccess(txnId), 2500); }
      else { setFailReason('Bank declined the transaction. Please try another method.'); setStep('failed'); }
    } catch { setFailReason('Network error. Please check your connection.'); setStep('failed'); }
  };

  const BANKS = ['HDFC Bank','ICICI Bank','State Bank of India','Axis Bank','Kotak Mahindra','Punjab National Bank','Bank of Baroda','Canara Bank'];
  const WALLETS = ['Paytm','PhonePe','Amazon Pay','Mobikwik','Freecharge'];

  return (
    <div style={{ width: '100%', maxWidth: 480, margin: '0 auto' }}>
      {/* Amount Banner */}
      <div style={{ background: 'linear-gradient(135deg, #0f172a, #1e293b)', borderRadius: 16, padding: '1.5rem', marginBottom: '1.5rem', textAlign: 'center', color: 'white' }}>
        <div style={{ fontSize: '0.8rem', opacity: 0.7, marginBottom: 4, letterSpacing: '0.08em' }}>AMOUNT DUE</div>
        <div style={{ fontSize: '2.5rem', fontWeight: 900 }}>₹{amount?.toLocaleString()}</div>
        <div style={{ fontSize: '0.78rem', opacity: 0.6, marginTop: 4, fontFamily: 'monospace' }}>Invoice #{invoiceId?.slice(-8).toUpperCase()}</div>
      </div>

      {/* Step: Method Selection */}
      {step === 'method' && (
        <div>
          <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#94a3b8', letterSpacing: '0.06em', marginBottom: '1rem' }}>CHOOSE PAYMENT METHOD</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
            {[
              { id: 'card', icon: CreditCard, title: 'Credit / Debit Card', sub: 'Visa, Mastercard, RuPay, Amex' },
              { id: 'upi', icon: Smartphone, title: 'UPI', sub: 'GPay, PhonePe, Paytm, BHIM' },
              { id: 'netbanking', icon: Building2, title: 'Net Banking', sub: 'All major Indian banks' },
              { id: 'wallet', icon: Wallet, title: 'Wallets', sub: 'Paytm, PhonePe, Amazon Pay' },
            ].map(m => (
              <button key={m.id} onClick={() => setMethod(m.id)}
                style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem 1.25rem', borderRadius: 12, border: `2px solid ${method === m.id ? '#22C55E' : '#e2e8f0'}`, background: method === m.id ? '#f0fdf4' : 'white', cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s' }}>
                <div style={{ width: 44, height: 44, borderRadius: 10, background: method === m.id ? '#22C55E' : '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <m.icon size={22} color={method === m.id ? 'white' : '#64748b'} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.9375rem' }}>{m.title}</div>
                  <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{m.sub}</div>
                </div>
                {method === m.id && <CheckCircle size={20} color="#22C55E" />}
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0.875rem 1rem', background: '#f0fdf4', borderRadius: 10, marginBottom: '1.5rem' }}>
            <Shield size={16} color="#16a34a" />
            <span style={{ fontSize: '0.8rem', color: '#166534', fontWeight: 600 }}>256-bit SSL encrypted · PCI DSS compliant · RBI approved</span>
          </div>
          <button onClick={() => method && setStep('details')} disabled={!method}
            style={{ width: '100%', padding: '1rem', background: method ? 'linear-gradient(135deg, #22C55E, #16a34a)' : '#e2e8f0', color: method ? 'white' : '#94a3b8', border: 'none', borderRadius: 12, fontWeight: 800, fontSize: '1rem', cursor: method ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <Lock size={18} /> Continue to Pay ₹{amount?.toLocaleString()}
          </button>
        </div>
      )}

      {/* Step: Payment Details */}
      {step === 'details' && (
        <div>
          <button onClick={() => setStep('method')} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontWeight: 600, marginBottom: '1.25rem', fontSize: '0.875rem' }}>
            <ArrowLeft size={16} /> Back
          </button>

          {method === 'card' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#374151', display: 'block', marginBottom: 6 }}>Card Number</label>
                <input value={form.cardNumber} onChange={e => setForm(f => ({ ...f, cardNumber: fmtCard(e.target.value) }))} placeholder="1234 5678 9012 3456" maxLength={19}
                  style={{ width: '100%', padding: '0.875rem', border: `1.5px solid ${errors.cardNumber ? '#ef4444' : '#e2e8f0'}`, borderRadius: 10, fontSize: '1.05rem', letterSpacing: '0.05em', boxSizing: 'border-box' }} />
                {errors.cardNumber && <div style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: 4 }}>{errors.cardNumber}</div>}
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#374151', display: 'block', marginBottom: 6 }}>Cardholder Name</label>
                <input value={form.cardName} onChange={e => setForm(f => ({ ...f, cardName: e.target.value.toUpperCase() }))} placeholder="AS ON CARD"
                  style={{ width: '100%', padding: '0.875rem', border: `1.5px solid ${errors.cardName ? '#ef4444' : '#e2e8f0'}`, borderRadius: 10, fontSize: '1rem', boxSizing: 'border-box' }} />
                {errors.cardName && <div style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: 4 }}>{errors.cardName}</div>}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#374151', display: 'block', marginBottom: 6 }}>Expiry (MM/YY)</label>
                  <input value={form.expiry} onChange={e => { let v = e.target.value.replace(/\D/g,'').slice(0,4); if(v.length>2) v=v.slice(0,2)+'/'+v.slice(2); setForm(f=>({...f,expiry:v})); }} placeholder="MM/YY" maxLength={5}
                    style={{ width: '100%', padding: '0.875rem', border: `1.5px solid ${errors.expiry ? '#ef4444' : '#e2e8f0'}`, borderRadius: 10, fontSize: '1rem', textAlign: 'center', boxSizing: 'border-box' }} />
                  {errors.expiry && <div style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: 4 }}>{errors.expiry}</div>}
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#374151', display: 'block', marginBottom: 6 }}>CVV</label>
                  <input type="password" value={form.cvv} onChange={e => setForm(f => ({ ...f, cvv: e.target.value.replace(/\D/g,'').slice(0,4) }))} placeholder="•••"
                    style={{ width: '100%', padding: '0.875rem', border: `1.5px solid ${errors.cvv ? '#ef4444' : '#e2e8f0'}`, borderRadius: 10, fontSize: '1.25rem', textAlign: 'center', boxSizing: 'border-box' }} />
                  {errors.cvv && <div style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: 4 }}>{errors.cvv}</div>}
                </div>
              </div>
            </div>
          )}

          {method === 'upi' && (
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#374151', display: 'block', marginBottom: 6 }}>UPI ID</label>
              <input value={form.upiId} onChange={e => setForm(f => ({ ...f, upiId: e.target.value.toLowerCase() }))} placeholder="yourname@paytm"
                style={{ width: '100%', padding: '0.875rem', border: `1.5px solid ${errors.upiId ? '#ef4444' : '#e2e8f0'}`, borderRadius: 10, fontSize: '1rem', boxSizing: 'border-box' }} />
              {errors.upiId && <div style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: 4 }}>{errors.upiId}</div>}
              <div style={{ display: 'flex', gap: 8, marginTop: '1rem', flexWrap: 'wrap' }}>
                {['@paytm','@ybl','@okaxis','@oksbi','@ibl'].map(s => (
                  <button key={s} onClick={() => setForm(f => ({ ...f, upiId: f.upiId.split('@')[0] + s }))}
                    style={{ padding: '0.35rem 0.875rem', background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: 20, fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer', color: '#475569' }}>{s}</button>
                ))}
              </div>
            </div>
          )}

          {method === 'netbanking' && (
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#374151', display: 'block', marginBottom: 8 }}>Select Bank</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {BANKS.map(b => (
                  <button key={b} onClick={() => setForm(f => ({ ...f, bank: b }))}
                    style={{ padding: '0.75rem', border: `1.5px solid ${form.bank === b ? '#22C55E' : '#e2e8f0'}`, borderRadius: 10, background: form.bank === b ? '#f0fdf4' : 'white', cursor: 'pointer', fontWeight: 600, fontSize: '0.8rem', color: form.bank === b ? '#16a34a' : '#374151', textAlign: 'left' }}>
                    {b}
                  </button>
                ))}
              </div>
              {errors.bank && <div style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: 4 }}>{errors.bank}</div>}
            </div>
          )}

          {method === 'wallet' && (
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#374151', display: 'block', marginBottom: 8 }}>Select Wallet</label>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {WALLETS.map(w => (
                  <button key={w} onClick={() => setForm(f => ({ ...f, wallet: w }))}
                    style={{ padding: '0.75rem 1.25rem', border: `1.5px solid ${form.wallet === w ? '#22C55E' : '#e2e8f0'}`, borderRadius: 10, background: form.wallet === w ? '#f0fdf4' : 'white', cursor: 'pointer', fontWeight: 700, fontSize: '0.875rem', color: form.wallet === w ? '#16a34a' : '#374151' }}>
                    {w}
                  </button>
                ))}
              </div>
              {errors.wallet && <div style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: 4 }}>{errors.wallet}</div>}
            </div>
          )}

          <button onClick={handleProceed}
            style={{ width: '100%', padding: '1rem', background: 'linear-gradient(135deg, #22C55E, #16a34a)', color: 'white', border: 'none', borderRadius: 12, fontWeight: 800, fontSize: '1rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <Lock size={18} /> Proceed to Verify
          </button>
        </div>
      )}

      {/* Step: OTP */}
      {step === 'otp' && (
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#f0fdf4', border: '2px solid #bbf7d0', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem' }}>
            <Smartphone size={28} color="#16a34a" />
          </div>
          <div style={{ fontWeight: 800, fontSize: '1.25rem', marginBottom: 6 }}>OTP Verification</div>
          <p style={{ color: '#64748b', fontSize: '0.875rem', marginBottom: '1.75rem' }}>
            A 6-digit OTP has been sent to your registered mobile number. Enter any 6 digits to proceed (demo mode).
          </p>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginBottom: '1.5rem' }}>
            {otp.map((d, i) => (
              <input key={i} id={`otp-${i}`} value={d} onChange={e => handleOtpChange(i, e.target.value)} maxLength={1}
                style={{ width: 48, height: 56, textAlign: 'center', fontSize: '1.5rem', fontWeight: 800, border: `2px solid ${d ? '#22C55E' : '#e2e8f0'}`, borderRadius: 10, outline: 'none', background: d ? '#f0fdf4' : 'white' }} />
            ))}
          </div>
          {errors.otp && <div style={{ color: '#ef4444', fontSize: '0.8rem', marginBottom: '1rem' }}>{errors.otp}</div>}
          <button onClick={handleVerifyOtp}
            style={{ width: '100%', padding: '1rem', background: 'linear-gradient(135deg, #22C55E, #16a34a)', color: 'white', border: 'none', borderRadius: 12, fontWeight: 800, fontSize: '1rem', cursor: 'pointer' }}>
            Verify & Pay ₹{amount?.toLocaleString()}
          </button>
          <button onClick={() => setStep('details')} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', marginTop: '1rem', fontWeight: 600, fontSize: '0.875rem' }}>
            ← Back
          </button>
        </div>
      )}

      {/* Step: Processing */}
      {step === 'processing' && (
        <div style={{ textAlign: 'center', padding: '2rem 0' }}>
          <div style={{ width: 72, height: 72, border: '5px solid #e2e8f0', borderTopColor: '#22C55E', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 1.5rem' }} />
          <div style={{ fontWeight: 800, fontSize: '1.25rem', marginBottom: 8 }}>Processing Payment</div>
          <div style={{ color: '#64748b', fontSize: '0.875rem', lineHeight: 1.6 }}>
            Authenticating with bank...<br />
            Please do not close this window.
          </div>
          <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
        </div>
      )}

      {/* Step: Success */}
      {step === 'success' && (
        <div style={{ textAlign: 'center', padding: '1.5rem 0' }}>
          <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'linear-gradient(135deg, #22C55E, #16a34a)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem', boxShadow: '0 8px 24px rgba(34,197,94,0.4)' }}>
            <CheckCircle size={44} color="white" />
          </div>
          <div style={{ fontWeight: 900, fontSize: '1.5rem', color: '#16a34a', marginBottom: 8 }}>Payment Successful!</div>
          <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '1.5rem' }}>Your payment of ₹{amount?.toLocaleString()} has been processed.</p>
          <div style={{ padding: '1.25rem', background: '#f0fdf4', borderRadius: 12, border: '1px solid #bbf7d0', textAlign: 'left', marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Transaction ID</span>
              <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#16a34a', fontSize: '0.85rem' }}>{txnId}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Method</span>
              <span style={{ fontWeight: 700, fontSize: '0.85rem', textTransform: 'capitalize' }}>{method}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Status</span>
              <span style={{ fontWeight: 700, color: '#16a34a', fontSize: '0.85rem' }}>PAID</span>
            </div>
          </div>
          <button onClick={async () => {
            const { downloadInvoicePDF } = await import('@/components/InvoicePDF');
            await downloadInvoicePDF({
              invoiceId,
              billingPeriod: new Date().toLocaleString('default', { month: 'short', year: 'numeric' }),
              energyUsedKwh: 0,
              baseAmount: Math.round(amount / 1.18),
              tax: Math.round(amount - amount / 1.18),
              discount: 0,
              totalAmount: amount,
              dueDate: new Date(),
              status: 'Paid',
            });
          }} style={{ width: '100%', padding: '0.875rem', background: '#f0fdf4', border: '1.5px solid #bbf7d0', borderRadius: 12, fontWeight: 700, cursor: 'pointer', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontSize: '0.9rem' }}>
            ↓ Download Receipt PDF
          </button>
        </div>
      )}

      {/* Step: Failed */}
      {step === 'failed' && (
        <div style={{ textAlign: 'center', padding: '1.5rem 0' }}>
          <AlertCircle size={72} color="#ef4444" style={{ margin: '0 auto 1.25rem', display: 'block' }} />
          <div style={{ fontWeight: 900, fontSize: '1.5rem', color: '#ef4444', marginBottom: 8 }}>Payment Failed</div>
          <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '1.5rem' }}>{failReason || 'Transaction could not be completed.'}</p>
          <button onClick={() => { setStep('method'); setOtp(['','','','','','']); setErrors({}); }}
            style={{ width: '100%', padding: '1rem', background: 'linear-gradient(135deg, #22C55E, #16a34a)', color: 'white', border: 'none', borderRadius: 12, fontWeight: 800, cursor: 'pointer' }}>
            Try Again
          </button>
        </div>
      )}
    </div>
  );
}
