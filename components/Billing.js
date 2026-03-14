'use client';
export default function Billing() {
  return (
    <section className="billing-section" id="billing">
      <div className="container">
        <div className="section-header">
          <div>
            <h2 className="section-title">Billing & Payments</h2>
            <p className="section-subtitle">Transparent billing with detailed breakdown of your energy services</p>
          </div>
          <button className="btn btn-outline"><i className="fas fa-history"></i> View All Invoices</button>
        </div>
        <div className="billing-grid">
          <div className="invoice-card fade-in">
            <div className="invoice-header">
              <div>
                <h3 className="invoice-title">Current Bill</h3>
                <p className="text-light">Due Date: Apr 10, 2026</p>
              </div>
              <div className="invoice-amount">₹ 2,999.00</div>
            </div>
            <div className="invoice-details">
              <div className="invoice-detail"><span className="detail-label">Billing Period</span><span className="detail-value">Mar 1 - Mar 31, 2026</span></div>
              <div className="invoice-detail"><span className="detail-label">Plan</span><span className="detail-value">Solar Premium</span></div>
              <div className="invoice-detail"><span className="detail-label">Energy Consumed</span><span className="detail-value">456 kWh</span></div>
              <div className="invoice-detail"><span className="detail-label">Energy Generated</span><span className="detail-value">389 kWh</span></div>
            </div>
            <div className="invoice-items">
              <div className="invoice-item"><span className="item-label">Base Subscription (Solar Premium)</span><span className="item-value">₹ 2,999.00</span></div>
              <div className="invoice-item"><span className="item-label">Grid Usage Charges (67 kWh)</span><span className="item-value">₹ 536.00</span></div>
              <div className="invoice-item"><span className="item-label">Solar Credits (-389 kWh)</span><span className="item-value" style={{ color: 'var(--success)' }}>- ₹ 1,556.00</span></div>
              <div className="invoice-item"><span className="item-label">Maintenance Fee</span><span className="item-value">₹ 199.00</span></div>
              <div className="invoice-item"><span className="item-label">GST (18%)</span><span className="item-value">₹ 392.04</span></div>
            </div>
            <div className="invoice-total"><span>Total Amount</span><span>₹ 2,570.04</span></div>
            <button className="btn btn-primary w-100 mt-3"><i className="fas fa-credit-card"></i> Pay Now</button>
          </div>
          <div className="payment-summary">
            <h3 style={{ marginBottom: '1.5rem' }}>Payment Methods</h3>
            <div className="payment-methods-grid">
              {[{ icon: 'fa-credit-card', name: 'Card' }, { icon: 'fa-university', name: 'Net Banking' }, { icon: 'fa-qrcode', name: 'UPI' }, { icon: 'fa-wallet', name: 'Wallet' }].map((m, i) => (
                <div className="payment-method" key={i}>
                  <div className="payment-icon"><i className={`fas ${m.icon}`}></i></div>
                  <div className="payment-name">{m.name}</div>
                </div>
              ))}
            </div>
            <div style={{ padding: '1.5rem', backgroundColor: 'var(--light-green)', borderRadius: 'var(--border-radius)', marginTop: '1rem' }}>
              <h4 style={{ color: 'var(--dark-green)', marginBottom: '0.5rem' }}>💰 You saved ₹ 1,556</h4>
              <p className="text-light" style={{ fontSize: '0.9rem', marginBottom: 0 }}>Your solar generation offset 389 kWh of grid consumption this month.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
