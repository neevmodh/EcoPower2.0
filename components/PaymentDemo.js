'use client';
import { useState } from 'react';
import { CreditCard, Lock, CheckCircle, Smartphone } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function PaymentDemo({ invoiceId, amount, onSuccess }) {
  const [step, setStep] = useState('method'); // method -> processing -> success
  const { user } = useAuth();
  const [method, setMethod] = useState('');

  const handlePay = async () => {
    setStep('processing');
    
    // Simulate API delay
    await new Promise(res => setTimeout(res, 2000));
    
    // Call real backend API to mark invoice as paid
    try {
      const res = await fetch(`/api/invoices/${invoiceId}/pay`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' }
      });
      if (!res.ok) throw new Error("Payment failed");
      
      setStep('success');
      setTimeout(() => {
        if (onSuccess) onSuccess();
      }, 2000); // Wait 2s then close/refresh
    } catch (err) {
      console.error(err);
      alert("Payment failed");
      setStep('method'); // Revert
    }
  };

  return (
    <div style={{ backgroundColor: 'white', padding: '2rem', borderRadius: '1rem', border: '1px solid #e2e8f0', width: '100%', maxWidth: '400px', margin: '0 auto', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}>
      {step === 'method' && (
        <>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.5rem', textAlign: 'center' }}>Checkout</h3>
          <p style={{ color: '#64748b', fontSize: '0.9rem', textAlign: 'center', marginBottom: '1.5rem' }}>Invoice #{invoiceId}</p>
          
          <div style={{ fontSize: '2rem', fontWeight: 700, textAlign: 'center', marginBottom: '2rem', color: '#1e293b' }}>
            ₹ {amount.toLocaleString()}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
            <button 
              onClick={() => setMethod('card')}
              style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', borderRadius: '0.5rem', border: `2px solid ${method === 'card' ? 'var(--primary-green)' : '#e2e8f0'}`, background: 'transparent', cursor: 'pointer', textAlign: 'left' }}
            >
              <CreditCard size={24} color={method === 'card' ? 'var(--primary-green)' : '#64748b'} />
              <div>
                <div style={{ fontWeight: 600 }}>Credit / Debit Card</div>
                <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Visa, MasterCard, RuPay</div>
              </div>
            </button>

            <button 
              onClick={() => setMethod('upi')}
              style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', borderRadius: '0.5rem', border: `2px solid ${method === 'upi' ? 'var(--primary-green)' : '#e2e8f0'}`, background: 'transparent', cursor: 'pointer', textAlign: 'left' }}
            >
              <Smartphone size={24} color={method === 'upi' ? 'var(--primary-green)' : '#64748b'} />
              <div>
                <div style={{ fontWeight: 600 }}>UPI Quick Pay</div>
                <div style={{ fontSize: '0.8rem', color: '#64748b' }}>GPay, PhonePe, Paytm</div>
              </div>
            </button>
          </div>

          <button 
            disabled={!method}
            onClick={handlePay}
            style={{ width: '100%', padding: '1rem', backgroundColor: method ? 'var(--primary-green)' : '#cbd5e1', color: 'white', border: 'none', borderRadius: '0.5rem', fontSize: '1rem', fontWeight: 600, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', cursor: method ? 'pointer' : 'not-allowed' }}
          >
            <Lock size={16} /> Pay Securely
          </button>
        </>
      )}

      {step === 'processing' && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '2rem 0', gap: '1.5rem' }}>
          <div style={{ width: '50px', height: '50px', border: '4px solid #e2e8f0', borderTopColor: 'var(--primary-green)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
          <div style={{ fontWeight: 600, color: '#1e293b' }}>Processing your payment...</div>
          <div style={{ fontSize: '0.85rem', color: '#64748b' }}>Please do not close this window.</div>
          <style dangerouslySetInnerHTML={{__html: `@keyframes spin { 100% { transform: rotate(360deg); } }`}} />
        </div>
      )}

      {step === 'success' && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '2rem 0', gap: '1rem', textAlign: 'center' }}>
          <CheckCircle size={64} color="#10b981" />
          <div style={{ fontSize: '1.25rem', fontWeight: 600, color: '#10b981' }}>Payment Successful!</div>
          <div style={{ color: '#64748b', fontSize: '0.9rem' }}>Invoice #{invoiceId} has been marked as Paid in the database.</div>
        </div>
      )}
    </div>
  );
}
