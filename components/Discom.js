'use client';
import { useEffect, useRef } from 'react';

export default function Discom() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const container = canvasRef.current;
    if (!container) return;
    container.innerHTML = '';
    const nodes = [
      { x: 20, y: 15 }, { x: 50, y: 10 }, { x: 80, y: 20 },
      { x: 15, y: 50 }, { x: 45, y: 45 }, { x: 75, y: 55 },
      { x: 25, y: 80 }, { x: 55, y: 75 }, { x: 85, y: 85 },
    ];
    nodes.forEach(n => {
      const dot = document.createElement('div');
      dot.className = 'grid-node';
      dot.style.left = `${n.x}%`;
      dot.style.top = `${n.y}%`;
      dot.style.animation = `pulse 2s ease-in-out infinite ${Math.random() * 2}s`;
      container.appendChild(dot);
    });
  }, []);

  return (
    <section className="discom-section" id="discom">
      <div className="container">
        <div className="section-header">
          <div>
            <h2 className="section-title">DISCOM Integration</h2>
            <p className="section-subtitle">Seamless integration with distribution companies for grid synchronization and net metering</p>
          </div>
        </div>
        <div className="discom-grid">
          <div>
            <div className="grid-visual" ref={canvasRef}></div>
          </div>
          <div>
            <h3 style={{ marginBottom: '1rem' }}>Grid Synchronization Status</h3>
            <p className="text-light">Your solar system is synchronized with the local DISCOM grid. Net metering is active and all excess energy is being exported to the grid.</p>
            <div className="discom-stats">
              {[
                { value: '99.8%', label: 'Grid Sync Uptime' },
                { value: '389 kWh', label: 'Net Export (Month)' },
                { value: 'Active', label: 'Net Metering Status' },
                { value: '₹ 1,556', label: 'Grid Credits Earned' },
              ].map((s, i) => (
                <div className="discom-stat" key={i}>
                  <div className="discom-stat-value">{s.value}</div>
                  <div className="discom-stat-label">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <style>{`@keyframes pulse { 0%,100% { opacity:1; transform:scale(1); } 50% { opacity:0.5; transform:scale(1.5); } }`}</style>
    </section>
  );
}
