'use client';
import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Zap, TrendingUp, Users, DollarSign, ArrowRightLeft, Plus, X, CheckCircle, AlertCircle } from 'lucide-react';
import AIAdvisor from '@/components/AIAdvisor';
import Modal from '@/components/Modal';
import PaymentFlow from '@/components/PaymentFlow';

export default function P2PEnergyTrading() {
  const { user } = useAuth();
  const [listings, setListings] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [wallet, setWallet] = useState(1250.50);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [createModal, setCreateModal] = useState(false);
  const [buyModal, setBuyModal] = useState(null); // offer object
  const [payModal, setPayModal] = useState(null); // { invoiceId, amount, offer }
  const [cancelModal, setCancelModal] = useState(null); // listing id
  const [sellerModal, setSellerModal] = useState(null); // offer object for seller info
  const [form, setForm] = useState({ energy: '', price: '', duration: '24' });
  const [formErrors, setFormErrors] = useState({});
  const [buyQty, setBuyQty] = useState('');

  const showToast = (msg, type = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 4000); };

  // Seed state with realistic data
  useEffect(() => {
    setListings([
      { id: 'L001', energy: 50, price: 6.5, status: 'active', buyers: 3, created: new Date(Date.now() - 7200000), total: 325 },
      { id: 'L002', energy: 30, price: 6.8, status: 'sold', buyers: 1, created: new Date(Date.now() - 86400000), total: 204 },
    ]);
    setTransactions([
      { id: 'T001', type: 'Sold', party: 'Amit Shah', energy: 30, price: 6.8, total: 204, date: '2026-03-13', status: 'Completed' },
      { id: 'T002', type: 'Bought', party: 'Neha Gupta', energy: 25, price: 6.5, total: 162.5, date: '2026-03-12', status: 'Completed' },
      { id: 'T003', type: 'Sold', party: 'Karan Mehta', energy: 40, price: 6.7, total: 268, date: '2026-03-11', status: 'Completed' },
    ]);
  }, [user]);

  const availableOffers = [
    { id: 'O001', seller: 'Priya Sharma', location: 'Satellite', energy: 75, price: 6.2, distance: '2.3 km', rating: 4.8, available: true },
    { id: 'O002', seller: 'Rajesh Kumar', location: 'Vastrapur', energy: 100, price: 6.4, distance: '3.1 km', rating: 4.9, available: true },
    { id: 'O003', seller: 'Anita Desai', location: 'Bodakdev', energy: 45, price: 6.0, distance: '1.8 km', rating: 4.7, available: true },
    { id: 'O004', seller: 'Vikram Patel', location: 'Navrangpura', energy: 60, price: 6.3, distance: '2.7 km', rating: 4.6, available: false },
  ];

  // Price trend data (last 7 days)
  const priceTrend = [6.1, 6.3, 6.0, 6.5, 6.4, 6.2, 6.5];
  const maxPrice = Math.max(...priceTrend);
  const minPrice = Math.min(...priceTrend);

  const validateCreate = () => {
    const e = {};
    if (!form.energy || parseFloat(form.energy) <= 0) e.energy = 'Enter valid energy amount';
    if (!form.price || parseFloat(form.price) <= 0) e.price = 'Enter valid price';
    if (parseFloat(form.price) > 10) e.price = 'Max price is ₹10/kWh';
    setFormErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleCreate = () => {
    if (!validateCreate()) return;
    const newListing = {
      id: `L${Date.now()}`, energy: parseFloat(form.energy), price: parseFloat(form.price),
      status: 'active', buyers: 0, created: new Date(), total: parseFloat(form.energy) * parseFloat(form.price),
    };
    setListings(prev => [newListing, ...prev]);
    setForm({ energy: '', price: '', duration: '24' });
    setCreateModal(false);
    showToast('Listing created successfully!');
  };

  const handleCancel = (id) => {
    setListings(prev => prev.map(l => l.id === id ? { ...l, status: 'cancelled' } : l));
    setCancelModal(null);
    showToast('Listing cancelled.');
  };

  const handleBuyInitiate = (offer) => {
    if (!buyQty || parseFloat(buyQty) <= 0 || parseFloat(buyQty) > offer.energy) {
      showToast('Enter valid quantity', 'error'); return;
    }
    const amount = parseFloat(buyQty) * offer.price;
    // Use a fake invoiceId for demo — real app would create a trade order
    setBuyModal(null);
    setPayModal({ invoiceId: `TRADE-${Date.now()}`, amount: Math.round(amount), offer, qty: parseFloat(buyQty) });
    setBuyQty('');
  };

  const handlePaySuccess = (txnId) => {
    const { offer, qty, amount } = payModal;
    const newTx = { id: `T${Date.now()}`, type: 'Bought', party: offer.seller, energy: qty, price: offer.price, total: amount, date: new Date().toISOString().slice(0,10), status: 'Completed' };
    setTransactions(prev => [newTx, ...prev]);
    setWallet(w => w - amount);
    setPayModal(null);
    showToast(`Bought ${qty} kWh from ${offer.seller}!`);
  };

  const totalEarnings = transactions.filter(t => t.type === 'Sold').reduce((s, t) => s + t.total, 0);
  const activeListings = listings.filter(l => l.status === 'active').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {toast && (
        <div style={{ padding: '1rem 1.5rem', background: toast.type === 'error' ? '#FEF2F2' : '#F0FDF4', border: `1px solid ${toast.type === 'error' ? '#FECACA' : '#BBF7D0'}`, borderRadius: 12, display: 'flex', alignItems: 'center', gap: 10, color: toast.type === 'error' ? '#DC2626' : '#16A34A', fontWeight: 600 }}>
          {toast.type === 'error' ? <AlertCircle size={18} /> : <CheckCircle size={18} />} {toast.msg}
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 900, margin: 0, letterSpacing: '-0.03em' }}>P2P Energy Trading</h1>
          <p style={{ color: '#64748b', margin: '0.4rem 0 0 0' }}>Buy and sell excess solar energy with your neighbors</p>
        </div>
        <button onClick={() => setCreateModal(true)}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '0.75rem 1.5rem', background: 'linear-gradient(135deg, #22C55E, #16a34a)', color: 'white', border: 'none', borderRadius: 12, fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 12px rgba(34,197,94,0.35)' }}>
          <Plus size={18} /> Sell Energy
        </button>
      </div>

      {/* KPI Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.25rem' }}>
        <StatCard title="Wallet Balance" value={`₹${wallet.toFixed(2)}`} icon={DollarSign} color="#10b981" />
        <StatCard title="Total Earnings" value={`₹${totalEarnings.toFixed(0)}`} icon={TrendingUp} color="#3b82f6" trend="+₹204 this week" />
        <StatCard title="Active Listings" value={activeListings} icon={Zap} color="#f59e0b" />
        <StatCard title="Transactions" value={transactions.length} icon={ArrowRightLeft} color="#8b5cf6" />
      </div>

      {/* Price Trend Chart */}
      <div className="glass-card" style={{ padding: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>Market Price Trend (7 Days)</h3>
            <p style={{ color: '#64748b', margin: '0.3rem 0 0 0', fontSize: '0.85rem' }}>Average P2P energy price per kWh</p>
          </div>
          <div style={{ padding: '0.4rem 1rem', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 20, fontSize: '0.8rem', fontWeight: 700, color: '#16a34a' }}>
            Current: ₹{priceTrend[priceTrend.length - 1]}/kWh
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 120, padding: '0 0.5rem' }}>
          {priceTrend.map((p, i) => {
            const days = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
            const h = ((p - minPrice + 0.5) / (maxPrice - minPrice + 1)) * 90 + 20;
            return (
              <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#10b981' }}>₹{p}</div>
                <div title={`₹${p}/kWh`} style={{ width: '100%', height: `${h}px`, background: i === priceTrend.length - 1 ? 'linear-gradient(to top, #22C55E, #4ade80)' : 'linear-gradient(to top, #3b82f6, #60a5fa)', borderRadius: '4px 4px 0 0', transition: 'height 0.5s ease' }} />
                <div style={{ fontSize: '0.65rem', color: '#94a3b8' }}>{days[i]}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* My Listings */}
      <div className="glass-card" style={{ padding: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0 }}>My Energy Listings</h3>
          <span style={{ fontSize: '0.8rem', color: '#64748b' }}>{listings.length} total</span>
        </div>
        {listings.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>No listings yet. Start selling your excess solar energy!</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.25rem' }}>
            {listings.map(l => (
              <div key={l.id} style={{ padding: '1.5rem', background: '#f8fafc', borderRadius: 12, border: `2px solid ${l.status === 'active' ? '#bbf7d0' : l.status === 'sold' ? '#bfdbfe' : '#fecaca'}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                  <div>
                    <div style={{ fontSize: '2rem', fontWeight: 900, color: '#1e293b' }}>{l.energy} kWh</div>
                    <div style={{ fontSize: '0.8rem', color: '#64748b' }}>@ ₹{l.price}/kWh · Est. ₹{l.total.toFixed(0)}</div>
                  </div>
                  <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: '0.72rem', fontWeight: 800, background: l.status === 'active' ? '#dcfce7' : l.status === 'sold' ? '#dbeafe' : '#fee2e2', color: l.status === 'active' ? '#16a34a' : l.status === 'sold' ? '#2563eb' : '#dc2626' }}>
                    {l.status.toUpperCase()}
                  </span>
                </div>
                <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginBottom: '1rem' }}>
                  {l.buyers} interested · Listed {new Date(l.created).toLocaleTimeString()}
                </div>
                {l.status === 'active' && (
                  <button onClick={() => setCancelModal(l.id)}
                    style={{ width: '100%', padding: '0.6rem', background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer', fontSize: '0.85rem' }}>
                    Cancel Listing
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Available Offers */}
      <div className="glass-card" style={{ padding: '2rem' }}>
        <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '1.5rem' }}>Available Energy Offers</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.25rem' }}>
          {availableOffers.map(offer => (
            <div key={offer.id} style={{ padding: '1.5rem', background: '#f8fafc', borderRadius: 12, border: `2px solid ${offer.available ? '#e2e8f0' : '#f1f5f9'}`, opacity: offer.available ? 1 : 0.6 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '1rem' }}>{offer.seller}</div>
                  <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{offer.location} · {offer.distance}</div>
                  <div style={{ fontSize: '0.78rem', color: '#f59e0b', marginTop: 2 }}>⭐ {offer.rating}</div>
                </div>
                <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'linear-gradient(135deg, #22C55E, #16a34a)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.85rem' }}>
                  {offer.seller.split(' ').map(n => n[0]).join('')}
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                <div><div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#1e293b' }}>{offer.energy} kWh</div><div style={{ fontSize: '0.78rem', color: '#64748b' }}>Available</div></div>
                <div style={{ textAlign: 'right' }}><div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#10b981' }}>₹{offer.price}</div><div style={{ fontSize: '0.78rem', color: '#64748b' }}>per kWh</div></div>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button onClick={() => { if (offer.available) { setBuyModal(offer); setBuyQty(''); } }}
                  disabled={!offer.available}
                  style={{ flex: 1, padding: '0.7rem', background: offer.available ? 'linear-gradient(135deg, #22C55E, #16a34a)' : '#e2e8f0', color: offer.available ? 'white' : '#94a3b8', border: 'none', borderRadius: 8, fontWeight: 700, cursor: offer.available ? 'pointer' : 'not-allowed', fontSize: '0.875rem' }}>
                  {offer.available ? 'Buy Now' : 'Unavailable'}
                </button>
                <button style={{ padding: '0.7rem 1rem', background: '#f1f5f9', border: 'none', borderRadius: 8, cursor: 'pointer', color: '#475569' }}
                  onClick={() => setSellerModal(offer)}>
                  <Users size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Transaction History */}
      <div className="glass-card" style={{ padding: '2rem' }}>
        <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '1.5rem' }}>Transaction History</h3>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #e2e8f0' }}>
                {['TYPE','PARTY','ENERGY','PRICE','TOTAL','DATE','STATUS'].map(h => (
                  <th key={h} style={{ padding: '0.875rem 1rem', textAlign: 'left', color: '#64748b', fontWeight: 600, fontSize: '0.8rem' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {transactions.map(tx => (
                <tr key={tx.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '0.875rem 1rem' }}>
                    <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: '0.78rem', fontWeight: 700, background: tx.type === 'Sold' ? '#dcfce7' : '#dbeafe', color: tx.type === 'Sold' ? '#16a34a' : '#2563eb' }}>{tx.type}</span>
                  </td>
                  <td style={{ padding: '0.875rem 1rem', fontWeight: 600, fontSize: '0.875rem' }}>{tx.party}</td>
                  <td style={{ padding: '0.875rem 1rem', fontWeight: 700 }}>{tx.energy} kWh</td>
                  <td style={{ padding: '0.875rem 1rem', fontSize: '0.875rem' }}>₹{tx.price}/kWh</td>
                  <td style={{ padding: '0.875rem 1rem', fontWeight: 800, color: tx.type === 'Sold' ? '#10b981' : '#3b82f6' }}>{tx.type === 'Sold' ? '+' : '-'}₹{tx.total}</td>
                  <td style={{ padding: '0.875rem 1rem', fontSize: '0.8rem', color: '#64748b' }}>{tx.date}</td>
                  <td style={{ padding: '0.875rem 1rem', fontSize: '0.78rem', fontWeight: 700, color: '#10b981' }}>{tx.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Listing Modal */}
      <Modal open={createModal} onClose={() => setCreateModal(false)} title="Create Energy Listing">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#374151', display: 'block', marginBottom: 6 }}>Energy Amount (kWh)</label>
            <input type="number" value={form.energy} onChange={e => setForm(f => ({ ...f, energy: e.target.value }))} placeholder="e.g. 50"
              style={{ width: '100%', padding: '0.75rem', border: `1.5px solid ${formErrors.energy ? '#ef4444' : '#e2e8f0'}`, borderRadius: 10, fontSize: '1rem', boxSizing: 'border-box' }} />
            {formErrors.energy && <div style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: 4 }}>{formErrors.energy}</div>}
          </div>
          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#374151', display: 'block', marginBottom: 6 }}>Price per kWh (₹)</label>
            <input type="number" step="0.1" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} placeholder="e.g. 6.5"
              style={{ width: '100%', padding: '0.75rem', border: `1.5px solid ${formErrors.price ? '#ef4444' : '#e2e8f0'}`, borderRadius: 10, fontSize: '1rem', boxSizing: 'border-box' }} />
            {formErrors.price && <div style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: 4 }}>{formErrors.price}</div>}
          </div>
          {form.energy && form.price && (
            <div style={{ padding: '1rem', background: '#f0fdf4', borderRadius: 10, border: '1px solid #bbf7d0' }}>
              <div style={{ fontSize: '0.8rem', color: '#166534', marginBottom: 4 }}>Estimated Earnings</div>
              <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#10b981' }}>₹{(form.energy * form.price).toFixed(2)}</div>
            </div>
          )}
          <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
            <button onClick={() => setCreateModal(false)} style={{ flex: 1, padding: '0.75rem', background: '#f1f5f9', border: 'none', borderRadius: 10, fontWeight: 600, cursor: 'pointer', color: '#64748b' }}>Cancel</button>
            <button onClick={handleCreate} style={{ flex: 1, padding: '0.75rem', background: 'linear-gradient(135deg, #22C55E, #16a34a)', color: 'white', border: 'none', borderRadius: 10, fontWeight: 700, cursor: 'pointer' }}>Create Listing</button>
          </div>
        </div>
      </Modal>

      {/* Cancel Listing Modal */}
      <Modal open={!!cancelModal} onClose={() => setCancelModal(null)} title="Cancel Listing">
        <p style={{ color: '#64748b', marginBottom: '1.5rem' }}>Are you sure you want to cancel this listing? This action cannot be undone.</p>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button onClick={() => handleCancel(cancelModal)} style={{ flex: 1, padding: '0.75rem', background: '#ef4444', color: 'white', border: 'none', borderRadius: 10, fontWeight: 700, cursor: 'pointer' }}>Yes, Cancel</button>
          <button onClick={() => setCancelModal(null)} style={{ flex: 1, padding: '0.75rem', background: '#f1f5f9', border: 'none', borderRadius: 10, fontWeight: 600, cursor: 'pointer', color: '#64748b' }}>Keep Listing</button>
        </div>
      </Modal>

      {/* Buy Modal */}
      <Modal open={!!buyModal} onClose={() => setBuyModal(null)} title={`Buy from ${buyModal?.seller}`}>
        {buyModal && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: 10, border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: '0.85rem', color: '#64748b' }}>Seller</span><span style={{ fontWeight: 700 }}>{buyModal.seller}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: '0.85rem', color: '#64748b' }}>Available</span><span style={{ fontWeight: 700 }}>{buyModal.energy} kWh</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.85rem', color: '#64748b' }}>Rate</span><span style={{ fontWeight: 700, color: '#10b981' }}>₹{buyModal.price}/kWh</span>
              </div>
            </div>
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#374151', display: 'block', marginBottom: 6 }}>Quantity (kWh)</label>
              <input type="number" value={buyQty} onChange={e => setBuyQty(e.target.value)} placeholder={`Max ${buyModal.energy} kWh`} max={buyModal.energy}
                style={{ width: '100%', padding: '0.75rem', border: '1.5px solid #e2e8f0', borderRadius: 10, fontSize: '1rem', boxSizing: 'border-box' }} />
            </div>
            {buyQty && parseFloat(buyQty) > 0 && (
              <div style={{ padding: '1rem', background: '#f0fdf4', borderRadius: 10, border: '1px solid #bbf7d0' }}>
                <div style={{ fontSize: '0.8rem', color: '#166534', marginBottom: 4 }}>Total Cost</div>
                <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#10b981' }}>₹{(buyQty * buyModal.price).toFixed(2)}</div>
              </div>
            )}
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button onClick={() => setBuyModal(null)} style={{ flex: 1, padding: '0.75rem', background: '#f1f5f9', border: 'none', borderRadius: 10, fontWeight: 600, cursor: 'pointer', color: '#64748b' }}>Cancel</button>
              <button onClick={() => handleBuyInitiate(buyModal)} style={{ flex: 1, padding: '0.75rem', background: 'linear-gradient(135deg, #22C55E, #16a34a)', color: 'white', border: 'none', borderRadius: 10, fontWeight: 700, cursor: 'pointer' }}>Proceed to Pay</button>
            </div>
          </div>
        )}
      </Modal>

      {/* Payment Modal */}
      <Modal open={!!payModal} onClose={() => setPayModal(null)} title="Complete Payment">
        {payModal && (
          <PaymentFlow invoiceId={payModal.invoiceId} amount={payModal.amount} onSuccess={handlePaySuccess} onClose={() => setPayModal(null)} />
        )}
      </Modal>

      {/* Seller Info Modal */}
      <Modal open={!!sellerModal} onClose={() => setSellerModal(null)} title="Seller Profile">
        {sellerModal && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', background: '#f8fafc', borderRadius: 12 }}>
              <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'linear-gradient(135deg, #22C55E, #16a34a)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '1.1rem' }}>
                {sellerModal.seller.split(' ').map(n => n[0]).join('')}
              </div>
              <div>
                <div style={{ fontWeight: 800, fontSize: '1.1rem' }}>{sellerModal.seller}</div>
                <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{sellerModal.location} · {sellerModal.distance}</div>
                <div style={{ fontSize: '0.8rem', color: '#f59e0b', marginTop: 2 }}>⭐ {sellerModal.rating} rating</div>
              </div>
            </div>
            {[
              { label: 'Available Energy', value: `${sellerModal.energy} kWh` },
              { label: 'Price per kWh', value: `₹${sellerModal.price}` },
              { label: 'Distance', value: sellerModal.distance },
              { label: 'Status', value: sellerModal.available ? 'Available Now' : 'Unavailable' },
            ].map(r => (
              <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem 1rem', background: '#f8fafc', borderRadius: 8 }}>
                <span style={{ fontSize: '0.875rem', color: '#64748b' }}>{r.label}</span>
                <span style={{ fontWeight: 700, color: '#1e293b' }}>{r.value}</span>
              </div>
            ))}
            <button onClick={() => { setSellerModal(null); if (sellerModal.available) { setBuyModal(sellerModal); setBuyQty(''); } }}
              disabled={!sellerModal.available}
              style={{ padding: '0.875rem', background: sellerModal.available ? 'linear-gradient(135deg, #22C55E, #16a34a)' : '#e2e8f0', color: sellerModal.available ? 'white' : '#94a3b8', border: 'none', borderRadius: 10, fontWeight: 700, cursor: sellerModal.available ? 'pointer' : 'not-allowed' }}>
              {sellerModal.available ? 'Buy Energy from this Seller' : 'Currently Unavailable'}
            </button>
          </div>
        )}
      </Modal>

      <AIAdvisor mode="consumer" />
    </div>
  );
}

function StatCard({ title, value, icon: Icon, color, trend }) {
  return (
    <div className="glass-card" style={{ padding: '1.5rem' }}>
      <div style={{ width: 44, height: 44, borderRadius: 10, background: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
        <Icon size={22} color={color} />
      </div>
      <div style={{ color: '#64748b', fontSize: '0.82rem', fontWeight: 600, marginBottom: 4 }}>{title}</div>
      <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#1e293b' }}>{value}</div>
      {trend && <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#10b981', marginTop: 4 }}>{trend}</div>}
    </div>
  );
}
