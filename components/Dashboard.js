'use client';
import { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { fetchDashboard } from '@/lib/api';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, ArcElement, Filler, Legend, Tooltip } from 'chart.js';
import { Line, Doughnut } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, ArcElement, Filler, Legend, Tooltip);

export default function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [stats, setStats] = useState({ gen: '0.0', cons: '0.0', savings: '0', carbon: '0' });

  useEffect(() => {
    if (!user) return;
    fetchDashboard(user.id).then(d => {
      setData(d);
      const telemetry = d.todayTelemetry || [];
      let totalGen = 0, totalCons = 0;
      telemetry.forEach(t => { totalGen += t.generationKwh || 0; totalCons += t.consumptionKwh || 0; });
      setStats({
        gen: totalGen.toFixed(1),
        cons: totalCons.toFixed(1),
        savings: (totalGen * 8).toFixed(0),
        carbon: (totalGen * 0.4).toFixed(0),
      });
    }).catch(console.error);
  }, [user]);

  const lineData = {
    labels: ['12 AM','4 AM','8 AM','12 PM','4 PM','8 PM','12 AM'],
    datasets: [
      { label: 'Solar Generation', data: [0,0,15,42,38,8,0], borderColor: '#10b981', backgroundColor: 'rgba(16,185,129,0.1)', borderWidth: 3, fill: true, tension: 0.4, pointRadius: 4 },
      { label: 'Consumption', data: [8,6,10,12,18,22,10], borderColor: '#3b82f6', backgroundColor: 'rgba(59,130,246,0.1)', borderWidth: 3, fill: true, tension: 0.4, pointRadius: 4 },
      { label: 'Grid Import', data: [8,6,5,2,1,14,10], borderColor: '#f59e0b', backgroundColor: 'rgba(245,158,11,0.1)', borderWidth: 3, fill: true, tension: 0.4, pointRadius: 4 },
    ],
  };

  const doughnutData = {
    labels: ['Solar','Grid','Battery'],
    datasets: [{ data: [65,25,10], backgroundColor: ['#10b981','#3b82f6','#8b5cf6'], borderWidth: 0 }],
  };

  const devices = data?.devices || [
    { type: 'Solar Inverter', deviceId: 'INV-1', location: 'Roof', status: 'Online', capacity: 10 },
    { type: 'Battery', deviceId: 'BAT-1', location: 'Basement', status: 'Online', capacity: 10 },
    { type: 'Smart Meter', deviceId: 'MET-1', location: 'Main Entrance', status: 'Online', capacity: 50 },
  ];

  const statCards = [
    { icon: 'fa-sun', value: `${stats.gen} kWh`, label: 'Solar Generation Today', trend: '+12%', up: true, pct: 85, target: '50 kWh' },
    { icon: 'fa-plug', value: `${stats.cons} kWh`, label: 'Energy Consumption Today', trend: '-8%', up: false, pct: 65, target: '35 kWh' },
    { icon: 'fa-piggy-bank', value: `₹ ${stats.savings}`, label: 'Monthly Savings', trend: '+15%', up: true, pct: 72, target: '₹ 4,500' },
    { icon: 'fa-leaf', value: `${stats.carbon} kg`, label: 'CO₂ Saved This Month', trend: '+22%', up: true, pct: 60, target: '300 kg' },
  ];

  const deviceIcons = { 'Solar Inverter': 'fa-solar-panel', 'Battery': 'fa-car-battery', 'Smart Meter': 'fa-tachometer-alt', 'EV Charger': 'fa-charging-station' };

  return (
    <section className="dashboard-section" id="dashboard">
      <div className="container">
        <div className="section-header">
          <div>
            <h2 className="section-title">Energy Dashboard</h2>
            <p className="section-subtitle">Monitor your energy consumption, savings, and carbon impact in real-time</p>
          </div>
          <div className="d-flex gap-2">
            <button className="btn btn-outline"><i className="fas fa-sync-alt"></i> Refresh</button>
            <button className="btn btn-outline"><i className="fas fa-download"></i> Export</button>
          </div>
        </div>

        <div className="dashboard-grid">
          {statCards.map((c, i) => (
            <div className={`stat-card fade-in ${i > 0 ? `delay-${i}` : ''}`} key={i}>
              <div className="stat-card-header">
                <div className="stat-icon"><i className={`fas ${c.icon}`}></i></div>
                <div className={`stat-trend ${c.up ? 'trend-up' : 'trend-down'}`}>
                  <i className={`fas fa-arrow-${c.up ? 'up' : 'down'}`}></i>
                  <span>{c.trend}</span>
                </div>
              </div>
              <div className="stat-value">{c.value}</div>
              <div className="stat-label">{c.label}</div>
              <div className="stat-progress">
                <div className="progress-bar"><div className="progress-fill" style={{ width: `${c.pct}%` }}></div></div>
                <div className="progress-info"><span>Target: {c.target}</span><span>{c.pct}%</span></div>
              </div>
            </div>
          ))}
        </div>

        <div className="charts-row">
          <div className="chart-card">
            <div className="chart-header">
              <h3 className="chart-title">Energy Flow Analysis</h3>
              <select className="form-select btn-sm" style={{ width: 'auto' }}>
                <option>Last 24 hours</option><option>Last 7 days</option><option>This month</option>
              </select>
            </div>
            <div className="chart-container">
              <Line data={lineData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'top', labels: { usePointStyle: true } } }, scales: { y: { beginAtZero: true, title: { display: true, text: 'kWh' } } } }} />
            </div>
          </div>
          <div className="chart-card">
            <div className="chart-header">
              <h3 className="chart-title">Energy Sources</h3>
              <select className="form-select btn-sm" style={{ width: 'auto' }}>
                <option>Today</option><option>This Week</option><option>This Month</option>
              </select>
            </div>
            <div className="chart-container">
              <Doughnut data={doughnutData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } }} />
            </div>
          </div>
        </div>

        <div style={{ marginTop: '1.5rem' }}>
          <div className="d-flex justify-between align-center mb-3">
            <h3 className="section-title" style={{ fontSize: '1.5rem' }}>Connected Devices</h3>
            <button className="btn btn-outline btn-sm"><i className="fas fa-cog"></i> Manage Devices</button>
          </div>
          <div className="devices-grid">
            {devices.map((d, i) => (
              <div className="device-card" key={i}>
                <div className="device-header">
                  <div className="device-icon"><i className={`fas ${deviceIcons[d.type] || 'fa-microchip'}`}></i></div>
                  <div className={`device-status ${d.status === 'Online' ? 'status-online' : 'status-offline'}`}>{d.status}</div>
                </div>
                <div className="device-name">{d.type}</div>
                <div className="device-location">{d.location}</div>
                <div className="device-stats">
                  <div className="device-stat">
                    <div className="device-stat-value">{d.capacity} kW</div>
                    <div className="device-stat-label">Capacity</div>
                  </div>
                  <div className="device-stat">
                    <div className="device-stat-value">{d.status === 'Online' ? '98%' : '--'}</div>
                    <div className="device-stat-label">Efficiency</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
