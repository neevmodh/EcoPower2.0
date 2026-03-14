'use client';
export default function Carbon() {
  return (
    <section className="carbon-section" id="analytics">
      <div className="container">
        <div className="section-header">
          <div>
            <h2 className="section-title">Carbon Impact</h2>
            <p className="section-subtitle">Track your contribution to a cleaner planet</p>
          </div>
        </div>
        <div className="carbon-grid">
          <div className="carbon-visual">
            <div className="tree-visual">
              <div className="tree-canopy"></div>
              <div className="tree-trunk"></div>
            </div>
          </div>
          <div className="carbon-stats">
            {[
              { icon: 'fa-cloud', value: '2.1 Tonnes', label: 'Total CO₂ Offset' },
              { icon: 'fa-tree', value: '35 Trees', label: 'Equivalent Trees Planted' },
              { icon: 'fa-car', value: '8,400 km', label: 'Car Emissions Avoided' },
              { icon: 'fa-home', value: '4.2 Months', label: 'Average Home Powered' },
            ].map((s, i) => (
              <div className="carbon-stat" key={i}>
                <div className="carbon-icon"><i className={`fas ${s.icon}`}></i></div>
                <div className="carbon-info">
                  <div className="carbon-value">{s.value}</div>
                  <div className="carbon-label">{s.label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
