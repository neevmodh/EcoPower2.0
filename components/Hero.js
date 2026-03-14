'use client';
export default function Hero({ onSubscribe }) {
  return (
    <section className="hero-section" id="home">
      <div className="container">
        <div className="hero-content">
          <div className="hero-text fade-in">
            <h1>Clean Energy, <span>Simplified.</span></h1>
            <p>Subscribe to solar power, battery backup, and smart energy management without owning or maintaining any equipment. No upfront costs, no technical hassles.</p>
            <div className="d-flex gap-2 mb-4">
              <button className="btn btn-primary btn-lg" onClick={onSubscribe}>
                <i className="fas fa-bolt"></i> Subscribe Now
              </button>
              <button className="btn btn-secondary btn-lg">
                <i className="fas fa-play-circle"></i> How It Works
              </button>
            </div>
            <div className="hero-stats">
              <div className="hero-stat fade-in delay-1">
                <div className="hero-stat-number">5,000+</div>
                <div className="hero-stat-label">Happy Customers</div>
              </div>
              <div className="hero-stat fade-in delay-2">
                <div className="hero-stat-number">25 MW</div>
                <div className="hero-stat-label">Clean Energy Generated</div>
              </div>
              <div className="hero-stat fade-in delay-3">
                <div className="hero-stat-number">500+</div>
                <div className="hero-stat-label">Tonnes CO₂ Saved</div>
              </div>
            </div>
          </div>
          <div className="hero-visual fade-in delay-3">
            <div className="energy-orb">
              <div className="orb-core">100% Green</div>
              <div className="energy-particle"></div>
              <div className="energy-particle"></div>
              <div className="energy-particle"></div>
              <div className="energy-particle"></div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
