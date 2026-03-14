'use client';
import { useState, useEffect } from 'react';
import { CreditCard, Lock, CheckCircle, Smartphone, Building2, Wallet, AlertCircle, Shield } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function RazorpayPayment({ invoiceId, amount, description, onSuccess, onCancel }) {
  const [step, setStep] = useState('method'); // method -> details -> processing -> success/failed
  const { user } = useAuth();
  const [method, setMethod] = useState('');
  const [paymentDetails, setPaymentDetails] = useState({
    cardNumber: '',
    cardName: '',
    expiryMonth: '',
    expiryYear: '',
    cvv: '',
    upiId: '',
    netbankingBank: '',
    walletProvider: ''
  });
  const [errors, setErrors] = useState({});
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);

  // Load Razorpay script
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => setRazorpayLoaded(true);
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const validateCard = () => {
    const newErrors = {};
    
    // Card number validation (16 digits)
    if (!/^\d{16}$/.test(paymentDetails.cardNumber.replace(/\s/g, ''))) {
      newErrors.cardNumber = 'Invalid card number';
    }
    
    // Card name validation
    if (!paymentDetails.cardName || paymentDetails.cardName.length < 3) {
      newErrors.cardName = 'Name is required';
    }
    
    // Expiry validation
    const currentYear = new Date().getFullYear() % 100;
    const currentMonth = new Date().getMonth() + 1;
    if (!paymentDetails.expiryMonth || !paymentDetails.expiryYear) {
      newErrors.expiry = 'Expiry date is required';
    } else if (parseInt(paymentDetails.expiryYear) < currentYear || 
               (parseInt(paymentDetails.expiryYear) === currentYear && parseInt(paymentDetails.expiryMonth) < currentMonth)) {
      newErrors.expiry = 'Card has expired';
    }
    
    // CVV validation (3-4 digits)
    if (!/^\d{3,4}$/.test(paymentDetails.cvv)) {
      newErrors.cvv = 'Invalid CVV';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateUPI = () => {
    const newErrors = {};
    if (!/^[\w.-]+@[\w.-]+$/.test(paymentDetails.upiId)) {
      newErrors.upiId = 'Invalid UPI ID (e.g., user@paytm)';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleProceed = () => {
    if (method === 'card' && !validateCard()) return;
    if (method === 'upi' && !validateUPI()) return;
    if (method === 'netbanking' && !paymentDetails.netbankingBank) {
      setErrors({ netbanking: 'Please select a bank' });
      return;
    }
    if (method === 'wallet' && !paymentDetails.walletProvider) {
      setErrors({ wallet: 'Please select a wallet' });
      return;
    }
    
    setStep('processing');
    processPayment();
  };

  const processPayment = async () => {
    try {
      // Step 1: Create order on backend
      const orderRes = await fetch('/api/payments/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: amount * 100, // Convert to paise
          currency: 'INR',
          receipt: `invoice_${invoiceId}`,
          notes: {
            invoiceId,
            userId: user.userId,
            description
          }
        })
      });

      if (!orderRes.ok) throw new Error('Failed to create order');
      const orderData = await orderRes.json();

      // Step 2: Initialize Razorpay
      if (razorpayLoaded && window.Razorpay) {
        const options = {
          key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_test_dummy_key', // Use env variable
          amount: amount * 100,
          currency: 'INR',
          name: 'EcoPower Energy Services',
          description: description || `Payment for Invoice #${invoiceId}`,
          image: '/logo.png',
          order_id: orderData.orderId,
          handler: async function (response) {
            // Step 3: Verify payment on backend
            const verifyRes = await fetch('/api/payments/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                invoiceId
              })
            });

            if (verifyRes.ok) {
              setStep('success');
              setTimeout(() => {
                if (onSuccess) onSuccess(response);
              }, 2000);
            } else {
              throw new Error('Payment verification failed');
            }
          },
          prefill: {
            name: user.name,
            email: user.email,
            contact: user.phone || '9999999999'
          },
          notes: {
            invoiceId,
            userId: user.userId
          },
          theme: {
            color: '#10b981'
          },
          method: {
            card: method === 'card',
            upi: method === 'upi',
            netbanking: method === 'netbanking',
            wallet: method === 'wallet'
          },
          modal: {
            ondismiss: function() {
              setStep('method');
              if (onCancel) onCancel();
            }
          }
        };

        const rzp = new window.Razorpay(options);
        rzp.on('payment.failed', function (response) {
          setStep('failed');
          setErrors({ payment: response.error.description });
        });
        rzp.open();
      } else {
        // Fallback: Simulate payment for demo
        await new Promise(res => setTimeout(res, 2000));
        
        // Mark invoice as paid
        const payRes = await fetch(`/api/invoices/${invoiceId}/pay`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            paymentMethod: method,
            amount,
            transactionId: `TXN${Date.now()}`
          })
        });

        if (payRes.ok) {
          setStep('success');
          setTimeout(() => {
            if (onSuccess) onSuccess({ demo: true });
          }, 2000);
        } else {
          throw new Error('Payment failed');
        }
      }
    } catch (err) {
      console.error('Payment error:', err);
      setStep('failed');
      setErrors({ payment: err.message || 'Payment processing failed' });
    }
  };

  const formatCardNumber = (value) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || '';
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    return parts.length ? parts.join(' ') : value;
  };

  return (
    <div style={{ backgroundColor: 'white', padding: '2rem', borderRadius: '1rem', border: '1px solid #e2e8f0', width: '100%', maxWidth: '500px', margin: '0 auto', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #10b981, #059669)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white'
          }}>
            <Lock size={32} />
          </div>
        </div>
        <h3 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem' }}>Secure Checkout</h3>
        <p style={{ color: '#64748b', fontSize: '0.9rem' }}>Invoice #{invoiceId}</p>
      </div>

      {/* Amount Display */}
      <div style={{
        padding: '1.5rem',
        background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)',
        borderRadius: '1rem',
        marginBottom: '2rem',
        textAlign: 'center'
      }}>
        <div style={{ fontSize: '0.85rem', color: '#166534', marginBottom: '0.5rem', fontWeight: 600 }}>
          AMOUNT TO PAY
        </div>
        <div style={{ fontSize: '2.5rem', fontWeight: 900, color: '#10b981' }}>
          ₹{amount.toLocaleString()}
        </div>
        {description && (
          <div style={{ fontSize: '0.85rem', color: '#166534', marginTop: '0.5rem' }}>
            {description}
          </div>
        )}
      </div>

      {step === 'method' && (
        <>
          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#64748b', marginBottom: '1rem' }}>
              SELECT PAYMENT METHOD
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <PaymentMethodButton
                icon={CreditCard}
                title="Credit / Debit Card"
                subtitle="Visa, MasterCard, RuPay, Amex"
                selected={method === 'card'}
                onClick={() => setMethod('card')}
              />
              <PaymentMethodButton
                icon={Smartphone}
                title="UPI"
                subtitle="GPay, PhonePe, Paytm, BHIM"
                selected={method === 'upi'}
                onClick={() => setMethod('upi')}
              />
              <PaymentMethodButton
                icon={Building2}
                title="Net Banking"
                subtitle="All major banks supported"
                selected={method === 'netbanking'}
                onClick={() => setMethod('netbanking')}
              />
              <PaymentMethodButton
                icon={Wallet}
                title="Wallets"
                subtitle="Paytm, PhonePe, Amazon Pay"
                selected={method === 'wallet'}
                onClick={() => setMethod('wallet')}
              />
            </div>
          </div>

          {/* Payment Details Form */}
          {method === 'card' && (
            <div style={{ marginBottom: '1.5rem', padding: '1.5rem', background: '#f8fafc', borderRadius: '1rem' }}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '0.5rem' }}>
                  Card Number
                </label>
                <input
                  type="text"
                  placeholder="1234 5678 9012 3456"
                  maxLength="19"
                  value={paymentDetails.cardNumber}
                  onChange={(e) => setPaymentDetails({...paymentDetails, cardNumber: formatCardNumber(e.target.value)})}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: `1px solid ${errors.cardNumber ? '#ef4444' : '#e2e8f0'}`,
                    borderRadius: '0.5rem',
                    fontSize: '1rem'
                  }}
                />
                {errors.cardNumber && <div style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.25rem' }}>{errors.cardNumber}</div>}
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '0.5rem' }}>
                  Cardholder Name
                </label>
                <input
                  type="text"
                  placeholder="JOHN DOE"
                  value={paymentDetails.cardName}
                  onChange={(e) => setPaymentDetails({...paymentDetails, cardName: e.target.value.toUpperCase()})}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: `1px solid ${errors.cardName ? '#ef4444' : '#e2e8f0'}`,
                    borderRadius: '0.5rem',
                    fontSize: '1rem'
                  }}
                />
                {errors.cardName && <div style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.25rem' }}>{errors.cardName}</div>}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '0.5rem' }}>
                    Expiry Date
                  </label>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <input
                      type="text"
                      placeholder="MM"
                      maxLength="2"
                      value={paymentDetails.expiryMonth}
                      onChange={(e) => setPaymentDetails({...paymentDetails, expiryMonth: e.target.value.replace(/\D/g, '')})}
                      style={{
                        flex: 1,
                        padding: '0.75rem',
                        border: `1px solid ${errors.expiry ? '#ef4444' : '#e2e8f0'}`,
                        borderRadius: '0.5rem',
                        fontSize: '1rem',
                        textAlign: 'center'
                      }}
                    />
                    <span style={{ display: 'flex', alignItems: 'center', fontSize: '1.5rem', fontWeight: 700, color: '#94a3b8' }}>/</span>
                    <input
                      type="text"
                      placeholder="YY"
                      maxLength="2"
                      value={paymentDetails.expiryYear}
                      onChange={(e) => setPaymentDetails({...paymentDetails, expiryYear: e.target.value.replace(/\D/g, '')})}
                      style={{
                        flex: 1,
                        padding: '0.75rem',
                        border: `1px solid ${errors.expiry ? '#ef4444' : '#e2e8f0'}`,
                        borderRadius: '0.5rem',
                        fontSize: '1rem',
                        textAlign: 'center'
                      }}
                    />
                  </div>
                  {errors.expiry && <div style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.25rem' }}>{errors.expiry}</div>}
                </div>

                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '0.5rem' }}>
                    CVV
                  </label>
                  <input
                    type="password"
                    placeholder="123"
                    maxLength="4"
                    value={paymentDetails.cvv}
                    onChange={(e) => setPaymentDetails({...paymentDetails, cvv: e.target.value.replace(/\D/g, '')})}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: `1px solid ${errors.cvv ? '#ef4444' : '#e2e8f0'}`,
                      borderRadius: '0.5rem',
                      fontSize: '1rem',
                      textAlign: 'center'
                    }}
                  />
                  {errors.cvv && <div style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.25rem' }}>{errors.cvv}</div>}
                </div>
              </div>
            </div>
          )}

          {method === 'upi' && (
            <div style={{ marginBottom: '1.5rem', padding: '1.5rem', background: '#f8fafc', borderRadius: '1rem' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '0.5rem' }}>
                UPI ID
              </label>
              <input
                type="text"
                placeholder="yourname@paytm"
                value={paymentDetails.upiId}
                onChange={(e) => setPaymentDetails({...paymentDetails, upiId: e.target.value.toLowerCase()})}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: `1px solid ${errors.upiId ? '#ef4444' : '#e2e8f0'}`,
                  borderRadius: '0.5rem',
                  fontSize: '1rem'
                }}
              />
              {errors.upiId && <div style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.25rem' }}>{errors.upiId}</div>}
            </div>
          )}

          {method === 'netbanking' && (
            <div style={{ marginBottom: '1.5rem', padding: '1.5rem', background: '#f8fafc', borderRadius: '1rem' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '0.5rem' }}>
                Select Bank
              </label>
              <select
                value={paymentDetails.netbankingBank}
                onChange={(e) => setPaymentDetails({...paymentDetails, netbankingBank: e.target.value})}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: `1px solid ${errors.netbanking ? '#ef4444' : '#e2e8f0'}`,
                  borderRadius: '0.5rem',
                  fontSize: '1rem'
                }}
              >
                <option value="">Choose your bank</option>
                <option value="HDFC">HDFC Bank</option>
                <option value="ICICI">ICICI Bank</option>
                <option value="SBI">State Bank of India</option>
                <option value="AXIS">Axis Bank</option>
                <option value="KOTAK">Kotak Mahindra Bank</option>
                <option value="PNB">Punjab National Bank</option>
              </select>
              {errors.netbanking && <div style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.25rem' }}>{errors.netbanking}</div>}
            </div>
          )}

          {method === 'wallet' && (
            <div style={{ marginBottom: '1.5rem', padding: '1.5rem', background: '#f8fafc', borderRadius: '1rem' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '0.5rem' }}>
                Select Wallet
              </label>
              <select
                value={paymentDetails.walletProvider}
                onChange={(e) => setPaymentDetails({...paymentDetails, walletProvider: e.target.value})}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: `1px solid ${errors.wallet ? '#ef4444' : '#e2e8f0'}`,
                  borderRadius: '0.5rem',
                  fontSize: '1rem'
                }}
              >
                <option value="">Choose wallet</option>
                <option value="paytm">Paytm</option>
                <option value="phonepe">PhonePe</option>
                <option value="amazonpay">Amazon Pay</option>
                <option value="mobikwik">Mobikwik</option>
              </select>
              {errors.wallet && <div style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.25rem' }}>{errors.wallet}</div>}
            </div>
          )}

          {/* Security Badge */}
          <div style={{
            padding: '1rem',
            background: '#f0fdf4',
            borderRadius: '0.75rem',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem'
          }}>
            <Shield size={24} color="#10b981" />
            <div style={{ fontSize: '0.85rem', color: '#166534' }}>
              <strong>100% Secure Payment</strong> - Your payment information is encrypted and secure
            </div>
          </div>

          <button
            disabled={!method}
            onClick={handleProceed}
            style={{
              width: '100%',
              padding: '1rem',
              backgroundColor: method ? 'linear-gradient(135deg, #10b981, #059669)' : '#cbd5e1',
              background: method ? 'linear-gradient(135deg, #10b981, #059669)' : '#cbd5e1',
              color: 'white',
              border: 'none',
              borderRadius: '0.75rem',
              fontSize: '1.1rem',
              fontWeight: 700,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '0.5rem',
              cursor: method ? 'pointer' : 'not-allowed',
              boxShadow: method ? '0 4px 12px rgba(16, 185, 129, 0.4)' : 'none'
            }}
          >
            <Lock size={20} /> Pay ₹{amount.toLocaleString()}
          </button>

          {onCancel && (
            <button
              onClick={onCancel}
              style={{
                width: '100%',
                padding: '0.75rem',
                backgroundColor: 'transparent',
                color: '#64748b',
                border: 'none',
                borderRadius: '0.5rem',
                fontSize: '0.9rem',
                fontWeight: 600,
                cursor: 'pointer',
                marginTop: '0.75rem'
              }}
            >
              Cancel
            </button>
          )}
        </>
      )}

      {step === 'processing' && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '3rem 0', gap: '1.5rem' }}>
          <div style={{
            width: '64px',
            height: '64px',
            border: '4px solid #e2e8f0',
            borderTopColor: '#10b981',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }} />
          <div style={{ fontWeight: 700, fontSize: '1.25rem', color: '#1e293b' }}>Processing Payment...</div>
          <div style={{ fontSize: '0.9rem', color: '#64748b', textAlign: 'center' }}>
            Please wait while we securely process your payment.<br />
            Do not close this window or press back button.
          </div>
          <style dangerouslySetInnerHTML={{__html: `@keyframes spin { 100% { transform: rotate(360deg); } }`}} />
        </div>
      )}

      {step === 'success' && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '3rem 0', gap: '1.5rem', textAlign: 'center' }}>
          <div style={{
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #10b981, #059669)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            animation: 'scaleIn 0.5s ease-out'
          }}>
            <CheckCircle size={48} color="white" />
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#10b981' }}>Payment Successful!</div>
          <div style={{ color: '#64748b', fontSize: '0.95rem' }}>
            Your payment of ₹{amount.toLocaleString()} has been processed successfully.
            <br />
            Invoice #{invoiceId} is now marked as paid.
          </div>
          <div style={{
            padding: '1rem',
            background: '#f0fdf4',
            borderRadius: '0.75rem',
            width: '100%',
            marginTop: '1rem'
          }}>
            <div style={{ fontSize: '0.85rem', color: '#166534', marginBottom: '0.5rem' }}>Transaction ID</div>
            <div style={{ fontFamily: 'monospace', fontWeight: 700, color: '#10b981' }}>TXN{Date.now()}</div>
          </div>
          <style dangerouslySetInnerHTML={{__html: `@keyframes scaleIn { 0% { transform: scale(0); } 100% { transform: scale(1); } }`}} />
        </div>
      )}

      {step === 'failed' && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '3rem 0', gap: '1.5rem', textAlign: 'center' }}>
          <AlertCircle size={64} color="#ef4444" />
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#ef4444' }}>Payment Failed</div>
          <div style={{ color: '#64748b', fontSize: '0.95rem' }}>
            {errors.payment || 'We could not process your payment. Please try again.'}
          </div>
          <button
            onClick={() => setStep('method')}
            style={{
              padding: '0.75rem 2rem',
              background: 'linear-gradient(135deg, #10b981, #059669)',
              color: 'white',
              border: 'none',
              borderRadius: '0.75rem',
              fontSize: '1rem',
              fontWeight: 700,
              cursor: 'pointer',
              marginTop: '1rem'
            }}
          >
            Try Again
          </button>
        </div>
      )}
    </div>
  );
}

function PaymentMethodButton({ icon: Icon, title, subtitle, selected, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
        padding: '1rem',
        borderRadius: '0.75rem',
        border: `2px solid ${selected ? '#10b981' : '#e2e8f0'}`,
        background: selected ? '#f0fdf4' : 'white',
        cursor: 'pointer',
        textAlign: 'left',
        transition: 'all 0.2s',
        position: 'relative'
      }}
    >
      <div style={{
        width: '48px',
        height: '48px',
        borderRadius: '12px',
        background: selected ? 'linear-gradient(135deg, #10b981, #059669)' : '#f1f5f9',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <Icon size={24} color={selected ? 'white' : '#64748b'} />
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 700, fontSize: '1rem', color: '#1e293b', marginBottom: '0.25rem' }}>{title}</div>
        <div style={{ fontSize: '0.85rem', color: '#64748b' }}>{subtitle}</div>
      </div>
      {selected && (
        <CheckCircle size={24} color="#10b981" />
      )}
    </button>
  );
}
