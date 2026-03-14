'use client';
export default function Plans({ onSelectPlan }) {
  const plans = [
    { name: 'Solar Basic', desc: 'For small homes & apartments', price: '₹ 1,499', features: ['5 kW Solar Power','Basic Monitoring','5 kWh Battery Backup','Grid Synchronization'], excluded: ['Priority Support','Smart Load Management'], popular: false },
    { name: 'Solar Premium', desc: 'For homes & small businesses', price: '₹ 2,999', features: ['10 kW Solar Power','Advanced Monitoring','10 kWh Battery Backup','Grid Synchronization','Priority Support'], excluded: ['Smart Load Management'], popular: true },
    { name: 'Solar Pro', desc: 'For large homes & businesses', price: '₹ 4,999', features: ['15 kW Solar Power','Premium Monitoring','20 kWh Battery Backup','Grid Synchronization','24/7 Priority Support','Smart Load Management'], excluded: [], popular: false },
  ];

  return (
    <section className="plans-section" id="subscription">
      <div className="container">
        <div className="section-header">
          <div>
            <h2 className="section-title">Energy Service Plans</h2>
            <p className="section-subtitle">Choose the perfect plan for your needs. No upfront costs, cancel anytime.</p>
          </div>
        </div>

        <div className="plans-grid">
          {plans.map((p, i) => (
            <div className={`plan-card fade-in ${p.popular ? 'popular' : ''} delay-${i + 1}`} key={i}>
              {p.popular && <div className="popular-badge">MOST POPULAR</div>}
              <div className="plan-header">
                <h3 className="plan-name">{p.name}</h3>
                <p className="plan-description">{p.desc}</p>
                <div className="plan-price">{p.price}<span>/month</span></div>
              </div>
              <div className="plan-features">
                {p.features.map((f, j) => (
                  <div className="plan-feature" key={j}>
                    <i className="fas fa-check feature-icon"></i>
                    <div className="feature-included">{f}</div>
                  </div>
                ))}
                {p.excluded.map((f, j) => (
                  <div className="plan-feature" key={`ex-${j}`}>
                    <i className="fas fa-times feature-icon" style={{ color: 'var(--text-light)' }}></i>
                    <div className="feature-excluded">{f}</div>
                  </div>
                ))}
              </div>
              <button className={`btn ${p.popular ? 'btn-primary' : 'btn-secondary'} w-100`} onClick={() => onSelectPlan(p.name)}>Select Plan</button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
