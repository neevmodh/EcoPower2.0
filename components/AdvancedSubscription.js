'use client';
import { useState, useEffect } from 'react';
import { Check, X, Zap, Battery, Sun, Shield, TrendingUp, Star, Award } from 'lucide-react';

export default function AdvancedSubscription({ userId, currentPlan, onSubscribe }) {
  const [plans, setPlans] = useState([]);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [billingCycle, setBillingCycle] = useState('monthly'); // monthly or annual
  const [addons, setAddons] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      const res = await fetch('/api/plans');
      const data = await res.json();
      
      // Enhanced plans with detailed features
      const enhancedPlans = [
        {
          id: 'basic',
          name: 'Solar Starter',
          tagline: 'Perfect for small homes',
          monthlyPrice: 2999,
          annualPrice: 29990,
          discount: 17,
          solarCapacity: 3,
          batteryCapacity: 5,
          features: [
            { name: 'Real-time monitoring', included: true },
            { name: 'Mobile app access', included: true },
            { name: 'Basic analytics', included: true },
            { name: 'Email support', included: true },
            { name: 'Smart meter', included: true },
            { name: 'Grid backup', included: true },
            { name: 'AI optimization', included: false },
            { name: 'Priority support', included: false },
            { name: 'Advanced analytics', included: false },
            { name: 'P2P trading', included: false }
          ],
          popular: false,
          color: '#3b82f6'
        },
        {
          id: 'pro',
          name: 'Solar Pro',
          tagline: 'Most popular choice',
          monthlyPrice: 4999,
          annualPrice: 49990,
          discount: 17,
          solarCapacity: 5,
          batteryCapacity: 10,
          features: [
            { name: 'Real-time monitoring', included: true },
            { name: 'Mobile app access', included: true },
            { name: 'Advanced analytics', included: true },
            { name: 'Priority support', included: true },
            { name: 'Smart meter', included: true },
            { name: 'Grid backup', included: true },
            { name: 'AI optimization', included: true },
            { name: 'P2P trading', included: true },
            { name: 'Weather forecasting', included: true },
            { name: 'EV charging integration', included: false }
          ],
          popular: true,
          color: '#10b981'
        },
        {
          id: 'premium',
          name: 'Solar Premium',
          tagline: 'Maximum power & features',
          monthlyPrice: 7999,
          annualPrice: 79990,
          discount: 17,
          solarCapacity: 10,
          batteryCapacity: 20,
          features: [
            { name: 'Real-time monitoring', included: true },
            { name: 'Mobile app access', included: true },
            { name: 'Advanced analytics', included: true },
            { name: '24/7 Priority support', included: true },
            { name: 'Smart meter', included: true },
            { name: 'Grid backup', included: true },
            { name: 'AI optimization', included: true },
            { name: 'P2P trading', included: true },
            { name: 'Weather forecasting', included: true },
            { name: 'EV charging integration', included: true },
            { name: 'Dedicated account manager', included: true },
            { name: 'Custom integrations', included: true }
          ],
          popular: false,
          color: '#8b5cf6'
        }
      ];

      setPlans(enhancedPlans);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  const availableAddons = [
    {
      id: 'extra-solar',
      name: 'Extra Solar Capacity',
      description: '+2 kW solar panels',
      monthlyPrice: 500,
      annualPrice: 5000,
      icon: Sun
    },
    {
      id: 'extra-battery',
      name: 'Extra Battery Storage',
      description: '+5 kWh battery capacity',
      monthlyPrice: 800,
      annualPrice: 8000,
      icon: Battery
    },
    {
      id: 'ev-charger',
      name: 'EV Charger Installation',
      description: '7.2 kW home charger',
      monthlyPrice: 1200,
      annualPrice: 12000,
      icon: Zap
    },
    {
      id: 'extended-warranty',
      name: 'Extended Warranty',
      description: '10-year comprehensive coverage',
      monthlyPrice: 300,
      annualPrice: 3000,
      icon: Shield
    }
  ];

  const calculateTotal = () => {
    if (!selectedPlan) return 0;
    
    const planPrice = billingCycle === 'monthly' ? selectedPlan.monthlyPrice : selectedPlan.annualPrice;
    const addonsPrice = addons.reduce((sum, addonId) => {
      const addon = availableAddons.find(a => a.id === addonId);
      return sum + (billingCycle === 'monthly' ? addon.monthlyPrice : addon.annualPrice);
    }, 0);
    
    return planPrice + addonsPrice;
  };

  const calculateSavings = () => {
    if (!selectedPlan || billingCycle === 'monthly') return 0;
    
    const monthlyTotal = selectedPlan.monthlyPrice * 12 + addons.reduce((sum, addonId) => {
      const addon = availableAddons.find(a => a.id === addonId);
      return sum + (addon.monthlyPrice * 12);
    }, 0);
    
    return monthlyTotal - calculateTotal();
  };

  if (loading) return <div>Loading plans...</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Billing Cycle Toggle */}
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem' }}>
        <span style={{ fontSize: '1rem', fontWeight: 600, color: billingCycle === 'monthly' ? '#1e293b' : '#94a3b8' }}>
          Monthly
        </span>
        <button
          onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'annual' : 'monthly')}
          style={{
            width: '60px',
            height: '32px',
            borderRadius: '16px',
            background: billingCycle === 'annual' ? 'linear-gradient(135deg, #10b981, #059669)' : '#cbd5e1',
            border: 'none',
            cursor: 'pointer',
            position: 'relative',
            transition: 'all 0.3s'
          }}
        >
          <div style={{
            width: '24px',
            height: '24px',
            borderRadius: '50%',
            background: 'white',
            position: 'absolute',
            top: '4px',
            left: billingCycle === 'annual' ? '32px' : '4px',
            transition: 'all 0.3s',
            boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
          }} />
        </button>
        <span style={{ fontSize: '1rem', fontWeight: 600, color: billingCycle === 'annual' ? '#1e293b' : '#94a3b8' }}>
          Annual
        </span>
        {billingCycle === 'annual' && (
          <span style={{
            padding: '0.25rem 0.75rem',
            background: '#dcfce7',
            color: '#166534',
            borderRadius: '0.5rem',
            fontSize: '0.85rem',
            fontWeight: 700
          }}>
            Save 17%
          </span>
        )}
      </div>

      {/* Plans Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem' }}>
        {plans.map((plan) => {
          const price = billingCycle === 'monthly' ? plan.monthlyPrice : plan.annualPrice;
          const isSelected = selectedPlan?.id === plan.id;
          
          return (
            <div
              key={plan.id}
              onClick={() => setSelectedPlan(plan)}
              style={{
                padding: '2rem',
                background: isSelected ? 'linear-gradient(135deg, #f0fdf4, #dcfce7)' : 'white',
                border: `3px solid ${isSelected ? plan.color : '#e2e8f0'}`,
                borderRadius: '1.5rem',
                cursor: 'pointer',
                position: 'relative',
                transition: 'all 0.3s',
                transform: isSelected ? 'scale(1.02)' : 'scale(1)'
              }}
            >
              {plan.popular && (
                <div style={{
                  position: 'absolute',
                  top: '-12px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  padding: '0.5rem 1.5rem',
                  background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                  color: 'white',
                  borderRadius: '1rem',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  boxShadow: '0 4px 12px rgba(245, 158, 11, 0.4)'
                }}>
                  <Star size={16} fill="white" />
                  MOST POPULAR
                </div>
              )}

              <div style={{ textAlign: 'center', marginBottom: '2rem', marginTop: plan.popular ? '1rem' : 0 }}>
                <div style={{ fontSize: '1.5rem', fontWeight: 900, color: plan.color, marginBottom: '0.5rem' }}>
                  {plan.name}
                </div>
                <div style={{ fontSize: '0.9rem', color: '#64748b', marginBottom: '1.5rem' }}>
                  {plan.tagline}
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: '0.25rem', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.9rem', color: '#64748b' }}>₹</span>
                  <span style={{ fontSize: '3rem', fontWeight: 900, color: '#1e293b', lineHeight: 1 }}>
                    {(price / (billingCycle === 'monthly' ? 1 : 12)).toLocaleString()}
                  </span>
                  <span style={{ fontSize: '0.9rem', color: '#64748b' }}>/mo</span>
                </div>
                {billingCycle === 'annual' && (
                  <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
                    ₹{price.toLocaleString()} billed annually
                  </div>
                )}
              </div>

              <div style={{
                padding: '1rem',
                background: 'rgba(255,255,255,0.5)',
                borderRadius: '1rem',
                marginBottom: '1.5rem'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                  <span style={{ fontSize: '0.85rem', color: '#64748b' }}>Solar Capacity</span>
                  <span style={{ fontWeight: 700, color: plan.color }}>{plan.solarCapacity} kW</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.85rem', color: '#64748b' }}>Battery Storage</span>
                  <span style={{ fontWeight: 700, color: plan.color }}>{plan.batteryCapacity} kWh</span>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
                {plan.features.map((feature, i) => (
                  <div key={i} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    fontSize: '0.9rem',
                    color: feature.included ? '#1e293b' : '#94a3b8'
                  }}>
                    {feature.included ? (
                      <Check size={18} color={plan.color} strokeWidth={3} />
                    ) : (
                      <X size={18} color="#cbd5e1" strokeWidth={2} />
                    )}
                    <span style={{ textDecoration: feature.included ? 'none' : 'line-through' }}>
                      {feature.name}
                    </span>
                  </div>
                ))}
              </div>

              <button
                style={{
                  width: '100%',
                  padding: '1rem',
                  background: isSelected ? `linear-gradient(135deg, ${plan.color}, ${plan.color}dd)` : '#f1f5f9',
                  color: isSelected ? 'white' : '#64748b',
                  border: 'none',
                  borderRadius: '0.75rem',
                  fontSize: '1rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.3s'
                }}
              >
                {isSelected ? 'Selected' : 'Select Plan'}
              </button>
            </div>
          );
        })}
      </div>

      {/* Add-ons */}
      {selectedPlan && (
        <div className="glass-card" style={{ padding: '2rem' }}>
          <h3 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1.5rem' }}>
            Enhance Your Plan
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
            {availableAddons.map((addon) => {
              const isSelected = addons.includes(addon.id);
              const Icon = addon.icon;
              const price = billingCycle === 'monthly' ? addon.monthlyPrice : addon.annualPrice;
              
              return (
                <div
                  key={addon.id}
                  onClick={() => {
                    if (isSelected) {
                      setAddons(addons.filter(id => id !== addon.id));
                    } else {
                      setAddons([...addons, addon.id]);
                    }
                  }}
                  style={{
                    padding: '1.5rem',
                    background: isSelected ? '#f0fdf4' : 'white',
                    border: `2px solid ${isSelected ? '#10b981' : '#e2e8f0'}`,
                    borderRadius: '1rem',
                    cursor: 'pointer',
                    transition: 'all 0.3s'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
                    <div style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '12px',
                      background: isSelected ? 'linear-gradient(135deg, #10b981, #059669)' : '#f1f5f9',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <Icon size={24} color={isSelected ? 'white' : '#64748b'} />
                    </div>
                    {isSelected && <Check size={24} color="#10b981" strokeWidth={3} />}
                  </div>
                  <div style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: '0.5rem' }}>
                    {addon.name}
                  </div>
                  <div style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '1rem' }}>
                    {addon.description}
                  </div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#10b981' }}>
                    +₹{(price / (billingCycle === 'monthly' ? 1 : 12)).toLocaleString()}/mo
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Summary & Checkout */}
      {selectedPlan && (
        <div style={{
          position: 'sticky',
          bottom: '2rem',
          padding: '2rem',
          background: 'linear-gradient(135deg, #1e293b, #0f172a)',
          color: 'white',
          borderRadius: '1.5rem',
          boxShadow: '0 20px 40px rgba(0,0,0,0.3)'
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1rem' }}>
                Your Selected Plan: {selectedPlan.name}
              </div>
              <div style={{ display: 'flex', gap: '2rem', fontSize: '0.9rem', opacity: 0.9 }}>
                <div>
                  <div style={{ marginBottom: '0.25rem' }}>Solar: {selectedPlan.solarCapacity} kW</div>
                  <div>Battery: {selectedPlan.batteryCapacity} kWh</div>
                </div>
                {addons.length > 0 && (
                  <div>
                    <div style={{ marginBottom: '0.25rem' }}>Add-ons: {addons.length}</div>
                    <div>Billing: {billingCycle === 'monthly' ? 'Monthly' : 'Annual'}</div>
                  </div>
                )}
              </div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.9rem', opacity: 0.9, marginBottom: '0.5rem' }}>
                Total {billingCycle === 'monthly' ? 'per month' : 'per year'}
              </div>
              <div style={{ fontSize: '3rem', fontWeight: 900, lineHeight: 1, marginBottom: '0.5rem' }}>
                ₹{calculateTotal().toLocaleString()}
              </div>
              {billingCycle === 'annual' && calculateSavings() > 0 && (
                <div style={{
                  padding: '0.5rem 1rem',
                  background: 'rgba(16, 185, 129, 0.2)',
                  borderRadius: '0.5rem',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  color: '#10b981',
                  display: 'inline-block'
                }}>
                  Save ₹{calculateSavings().toLocaleString()} annually
                </div>
              )}
            </div>
          </div>

          <button
            onClick={() => onSubscribe && onSubscribe(selectedPlan, addons, billingCycle)}
            style={{
              width: '100%',
              padding: '1.25rem',
              background: 'linear-gradient(135deg, #10b981, #059669)',
              color: 'white',
              border: 'none',
              borderRadius: '0.75rem',
              fontSize: '1.1rem',
              fontWeight: 700,
              cursor: 'pointer',
              marginTop: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.75rem',
              boxShadow: '0 8px 24px rgba(16, 185, 129, 0.4)'
            }}
          >
            <Award size={24} />
            Subscribe Now
          </button>
        </div>
      )}
    </div>
  );
}
