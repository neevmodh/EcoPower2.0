'use client';
import { useState, useEffect } from 'react';
import { Check, X, Zap, Sun, BatteryCharging, Shield, MapPin } from 'lucide-react';

export default function SubscriptionFlow({ userId, onComplete }) {
  const [step, setStep] = useState(1); // 1: Plans, 2: Location, 3: Confirm
  const [plans, setPlans] = useState([]);
  const [locations, setLocations] = useState([]);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [newLocation, setNewLocation] = useState({
    addressLine1: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'India',
    locationType: 'residential'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch plans
  useEffect(() => {
    fetchPlans();
    fetchLocations();
  }, []);

  const fetchPlans = async () => {
    try {
      const response = await fetch('/api/plans');
      const data = await response.json();
      setPlans(data);
    } catch (err) {
      console.error('Error fetching plans:', err);
    }
  };

  const fetchLocations = async () => {
    try {
      const response = await fetch(`/api/locations?userId=${userId}`);
      const data = await response.json();
      setLocations(data);
    } catch (err) {
      console.error('Error fetching locations:', err);
    }
  };

  const handleCreateLocation = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/locations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          ...newLocation
        })
      });

      if (!response.ok) throw new Error('Failed to create location');
      
      const data = await response.json();
      setSelectedLocation(data.locationId || data._id);
      setLocations([...locations, data]);
      setStep(3);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSubscription = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          planId: selectedPlan,
          locationId: selectedLocation,
          billingCycle: 'monthly'
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create subscription');
      }
      
      const data = await response.json();
      setError(null);
      if (onComplete) onComplete(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem' }}>
      {/* Progress Steps */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '3rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <StepIndicator number={1} label="Choose Plan" active={step === 1} completed={step > 1} />
          <div style={{ width: '60px', height: '2px', backgroundColor: step > 1 ? 'var(--primary-green)' : '#e2e8f0' }} />
          <StepIndicator number={2} label="Location" active={step === 2} completed={step > 2} />
          <div style={{ width: '60px', height: '2px', backgroundColor: step > 2 ? 'var(--primary-green)' : '#e2e8f0' }} />
          <StepIndicator number={3} label="Confirm" active={step === 3} completed={false} />
        </div>
      </div>

      {error && (
        <div style={{ 
          padding: '1rem', 
          backgroundColor: '#fee2e2', 
          color: '#dc2626', 
          borderRadius: '0.5rem', 
          marginBottom: '2rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <X size={20} />
          {error}
        </div>
      )}

      {/* Step 1: Plan Selection */}
      {step === 1 && (
        <div>
          <h2 style={{ fontSize: '2rem', fontWeight: 700, textAlign: 'center', marginBottom: '1rem' }}>
            Choose Your Energy Plan
          </h2>
          <p style={{ textAlign: 'center', color: '#64748b', marginBottom: '3rem' }}>
            Select the plan that best fits your energy needs
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
            {plans.map((plan) => (
              <PlanCard
                key={plan.planId}
                plan={plan}
                selected={selectedPlan === plan.planId}
                onSelect={() => setSelectedPlan(plan.planId)}
              />
            ))}
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', marginTop: '3rem' }}>
            <button
              onClick={() => setStep(2)}
              disabled={!selectedPlan}
              style={{
                padding: '1rem 3rem',
                backgroundColor: selectedPlan ? 'var(--primary-green)' : '#cbd5e1',
                color: 'white',
                border: 'none',
                borderRadius: '0.5rem',
                fontSize: '1.1rem',
                fontWeight: 600,
                cursor: selectedPlan ? 'pointer' : 'not-allowed',
                transition: 'all 0.2s'
              }}
            >
              Continue to Location
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Location Selection */}
      {step === 2 && (
        <div>
          <h2 style={{ fontSize: '2rem', fontWeight: 700, textAlign: 'center', marginBottom: '1rem' }}>
            Select Installation Location
          </h2>
          <p style={{ textAlign: 'center', color: '#64748b', marginBottom: '3rem' }}>
            Choose an existing location or add a new one
          </p>

          {locations.length > 0 && (
            <div style={{ marginBottom: '2rem' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem' }}>
                Existing Locations
              </h3>
              <div style={{ display: 'grid', gap: '1rem' }}>
                {locations.map((loc) => (
                  <LocationCard
                    key={loc._id || loc.locationId}
                    location={loc}
                    selected={selectedLocation === (loc._id || loc.locationId)}
                    onSelect={() => {
                      setSelectedLocation(loc._id || loc.locationId);
                      setStep(3);
                    }}
                  />
                ))}
              </div>
            </div>
          )}

          <div style={{ 
            backgroundColor: 'white', 
            borderRadius: '1rem', 
            padding: '2rem', 
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)' 
          }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1.5rem' }}>
              Add New Location
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <input
                type="text"
                placeholder="Address Line 1"
                value={newLocation.addressLine1}
                onChange={(e) => setNewLocation({ ...newLocation, addressLine1: e.target.value })}
                style={inputStyle}
              />
              <input
                type="text"
                placeholder="City"
                value={newLocation.city}
                onChange={(e) => setNewLocation({ ...newLocation, city: e.target.value })}
                style={inputStyle}
              />
              <input
                type="text"
                placeholder="State"
                value={newLocation.state}
                onChange={(e) => setNewLocation({ ...newLocation, state: e.target.value })}
                style={inputStyle}
              />
              <input
                type="text"
                placeholder="Postal Code"
                value={newLocation.postalCode}
                onChange={(e) => setNewLocation({ ...newLocation, postalCode: e.target.value })}
                style={inputStyle}
              />
              <select
                value={newLocation.locationType}
                onChange={(e) => setNewLocation({ ...newLocation, locationType: e.target.value })}
                style={inputStyle}
              >
                <option value="residential">Residential</option>
                <option value="commercial">Commercial</option>
                <option value="industrial">Industrial</option>
              </select>
            </div>
            <button
              onClick={handleCreateLocation}
              disabled={loading || !newLocation.addressLine1 || !newLocation.city}
              style={{
                marginTop: '1.5rem',
                padding: '0.75rem 2rem',
                backgroundColor: 'var(--primary-green)',
                color: 'white',
                border: 'none',
                borderRadius: '0.5rem',
                fontWeight: 600,
                cursor: 'pointer',
                opacity: loading ? 0.6 : 1
              }}
            >
              {loading ? 'Creating...' : 'Create Location & Continue'}
            </button>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', marginTop: '2rem' }}>
            <button
              onClick={() => setStep(1)}
              style={{
                padding: '0.75rem 2rem',
                backgroundColor: 'transparent',
                color: '#64748b',
                border: '1px solid #cbd5e1',
                borderRadius: '0.5rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Back to Plans
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Confirmation */}
      {step === 3 && (
        <div>
          <h2 style={{ fontSize: '2rem', fontWeight: 700, textAlign: 'center', marginBottom: '1rem' }}>
            Confirm Your Subscription
          </h2>
          <p style={{ textAlign: 'center', color: '#64748b', marginBottom: '3rem' }}>
            Review your selection before proceeding
          </p>

          <div style={{ 
            maxWidth: '600px', 
            margin: '0 auto', 
            backgroundColor: 'white', 
            borderRadius: '1rem', 
            padding: '2rem', 
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)' 
          }}>
            <div style={{ marginBottom: '2rem' }}>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '1rem' }}>
                Selected Plan
              </h3>
              {plans.find(p => p.planId === selectedPlan) && (
                <div style={{ padding: '1rem', backgroundColor: '#f8fafc', borderRadius: '0.5rem' }}>
                  <div style={{ fontWeight: 700, fontSize: '1.25rem', marginBottom: '0.5rem' }}>
                    {plans.find(p => p.planId === selectedPlan).name}
                  </div>
                  <div style={{ color: '#64748b' }}>
                    ₹{plans.find(p => p.planId === selectedPlan).basePrice}/month
                  </div>
                </div>
              )}
            </div>

            <div style={{ marginBottom: '2rem' }}>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '1rem' }}>
                Installation Location
              </h3>
              {locations.find(l => (l._id || l.locationId) === selectedLocation) && (
                <div style={{ padding: '1rem', backgroundColor: '#f8fafc', borderRadius: '0.5rem' }}>
                  <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>
                    {locations.find(l => (l._id || l.locationId) === selectedLocation).address_line1 || 
                     locations.find(l => (l._id || l.locationId) === selectedLocation).addressLine1}
                  </div>
                  <div style={{ color: '#64748b', fontSize: '0.875rem' }}>
                    {locations.find(l => (l._id || l.locationId) === selectedLocation).city}, {' '}
                    {locations.find(l => (l._id || l.locationId) === selectedLocation).state}
                  </div>
                </div>
              )}
            </div>

            <div style={{ 
              padding: '1rem', 
              backgroundColor: '#d1fae5', 
              borderRadius: '0.5rem', 
              marginBottom: '2rem' 
            }}>
              <div style={{ fontSize: '0.875rem', color: '#059669', marginBottom: '0.5rem' }}>
                First Invoice
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#059669' }}>
                ₹{plans.find(p => p.planId === selectedPlan)?.basePrice * 1.18 || 0}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#059669', marginTop: '0.25rem' }}>
                (Including 18% GST)
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem' }}>
              <button
                onClick={() => setStep(2)}
                style={{
                  flex: 1,
                  padding: '1rem',
                  backgroundColor: 'transparent',
                  color: '#64748b',
                  border: '1px solid #cbd5e1',
                  borderRadius: '0.5rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Back
              </button>
              <button
                onClick={handleCreateSubscription}
                disabled={loading}
                style={{
                  flex: 2,
                  padding: '1rem',
                  backgroundColor: 'var(--primary-green)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.5rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  opacity: loading ? 0.6 : 1
                }}
              >
                {loading ? 'Creating Subscription...' : 'Confirm & Subscribe'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Step Indicator Component
function StepIndicator({ number, label, active, completed }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
      <div style={{
        width: '50px',
        height: '50px',
        borderRadius: '50%',
        backgroundColor: completed ? 'var(--primary-green)' : active ? 'var(--primary-green)' : '#e2e8f0',
        color: completed || active ? 'white' : '#94a3b8',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 700,
        fontSize: '1.25rem',
        transition: 'all 0.3s'
      }}>
        {completed ? <Check size={24} /> : number}
      </div>
      <span style={{ 
        fontSize: '0.875rem', 
        fontWeight: 600, 
        color: active ? '#1e293b' : '#94a3b8' 
      }}>
        {label}
      </span>
    </div>
  );
}

// Plan Card Component
function PlanCard({ plan, selected, onSelect }) {
  const planIcons = {
    solar: Sun,
    battery: BatteryCharging,
    hybrid: Zap,
    grid_backup: Shield
  };

  const Icon = planIcons[plan.plan_type] || Zap;

  return (
    <div
      onClick={onSelect}
      style={{
        backgroundColor: 'white',
        borderRadius: '1rem',
        padding: '2rem',
        boxShadow: selected ? '0 0 0 3px var(--primary-green)' : '0 1px 3px rgba(0,0,0,0.1)',
        cursor: 'pointer',
        transition: 'all 0.2s',
        position: 'relative'
      }}
    >
      {selected && (
        <div style={{
          position: 'absolute',
          top: '1rem',
          right: '1rem',
          width: '30px',
          height: '30px',
          borderRadius: '50%',
          backgroundColor: 'var(--primary-green)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white'
        }}>
          <Check size={18} />
        </div>
      )}

      <div style={{
        width: '60px',
        height: '60px',
        borderRadius: '1rem',
        backgroundColor: '#d1fae5',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: '1.5rem'
      }}>
        <Icon size={32} color="var(--primary-green)" />
      </div>

      <h3 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem' }}>
        {plan.name}
      </h3>

      <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--primary-green)', marginBottom: '1rem' }}>
        ₹{plan.basePrice}
        <span style={{ fontSize: '1rem', fontWeight: 500, color: '#64748b' }}>/month</span>
      </div>

      <div style={{ color: '#64748b', marginBottom: '1.5rem', minHeight: '60px' }}>
        {plan.features && plan.features[0]}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {plan.includedSolarKw > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}>
            <Check size={16} color="var(--primary-green)" />
            <span>{plan.includedSolarKw} kW Solar Capacity</span>
          </div>
        )}
        {plan.includedBatteryKwh > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}>
            <Check size={16} color="var(--primary-green)" />
            <span>{plan.includedBatteryKwh} kWh Battery Storage</span>
          </div>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}>
          <Check size={16} color="var(--primary-green)" />
          <span>24/7 Monitoring & Support</span>
        </div>
      </div>
    </div>
  );
}

// Location Card Component
function LocationCard({ location, selected, onSelect }) {
  return (
    <div
      onClick={onSelect}
      style={{
        backgroundColor: 'white',
        borderRadius: '0.75rem',
        padding: '1.5rem',
        boxShadow: selected ? '0 0 0 2px var(--primary-green)' : '0 1px 3px rgba(0,0,0,0.1)',
        cursor: 'pointer',
        transition: 'all 0.2s',
        display: 'flex',
        alignItems: 'center',
        gap: '1rem'
      }}
    >
      <div style={{
        width: '50px',
        height: '50px',
        borderRadius: '0.75rem',
        backgroundColor: selected ? 'var(--primary-green)' : '#f1f5f9',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: selected ? 'white' : '#64748b'
      }}>
        <MapPin size={24} />
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>
          {location.address_line1 || location.addressLine1}
        </div>
        <div style={{ fontSize: '0.875rem', color: '#64748b' }}>
          {location.city}, {location.state} - {location.postal_code || location.postalCode}
        </div>
      </div>
      {selected && (
        <div style={{
          width: '30px',
          height: '30px',
          borderRadius: '50%',
          backgroundColor: 'var(--primary-green)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white'
        }}>
          <Check size={18} />
        </div>
      )}
    </div>
  );
}

const inputStyle = {
  padding: '0.75rem',
  border: '1px solid #cbd5e1',
  borderRadius: '0.5rem',
  fontSize: '1rem',
  width: '100%'
};
