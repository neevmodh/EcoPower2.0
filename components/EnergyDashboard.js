'use client';
import { useState, useEffect } from 'react';
import { Line, Doughnut } from 'react-chartjs-2';
import { 
  Zap, Sun, BatteryCharging, TrendingUp, TrendingDown, 
  Activity, Leaf, DollarSign, AlertCircle 
} from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function EnergyDashboard({ userId, locationId }) {
  const [telemetryData, setTelemetryData] = useState(null);
  const [historicalData, setHistoricalData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  // Fetch latest telemetry data
  const fetchTelemetryData = async () => {
    try {
      const response = await fetch(`/api/telemetry/latest?locationId=${locationId}`);
      if (!response.ok) throw new Error('Failed to fetch telemetry data');
      const data = await response.json();
      setTelemetryData(data);
      setLastUpdate(new Date());
      setError(null);
    } catch (err) {
      console.error('Telemetry fetch error:', err);
      setError(err.message);
    }
  };

  // Fetch historical data for charts
  const fetchHistoricalData = async () => {
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setHours(startDate.getHours() - 24); // Last 24 hours

      const response = await fetch(
        `/api/telemetry/history?locationId=${locationId}&startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`
      );
      if (!response.ok) throw new Error('Failed to fetch historical data');
      const data = await response.json();
      setHistoricalData(data.readings || []);
    } catch (err) {
      console.error('Historical data fetch error:', err);
    }
  };

  // Initial load
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchTelemetryData(), fetchHistoricalData()]);
      setLoading(false);
    };
    loadData();
  }, [locationId]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchTelemetryData();
    }, 30000);

    return () => clearInterval(interval);
  }, [locationId]);

  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <div className="spinner" style={{ 
          width: '50px', 
          height: '50px', 
          border: '4px solid #e2e8f0', 
          borderTop: '4px solid var(--primary-green)', 
          borderRadius: '50%', 
          animation: 'spin 1s linear infinite',
          margin: '0 auto'
        }} />
        <p style={{ marginTop: '1rem', color: '#64748b' }}>Loading energy data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: '#ef4444' }}>
        <AlertCircle size={48} style={{ margin: '0 auto 1rem' }} />
        <p>Error loading dashboard: {error}</p>
        <button 
          onClick={() => window.location.reload()}
          style={{
            marginTop: '1rem',
            padding: '0.75rem 1.5rem',
            backgroundColor: 'var(--primary-green)',
            color: 'white',
            border: 'none',
            borderRadius: '0.5rem',
            cursor: 'pointer'
          }}
        >
          Retry
        </button>
      </div>
    );
  }

  // Prepare chart data
  const timeLabels = historicalData.map(d => 
    new Date(d.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
  );

  const energyChartData = {
    labels: timeLabels,
    datasets: [
      {
        label: 'Solar Generated (kWh)',
        data: historicalData.map(d => d.energy_generated_kwh),
        borderColor: '#f59e0b',
        backgroundColor: 'rgba(245, 158, 11, 0.1)',
        fill: true,
        tension: 0.4
      },
      {
        label: 'Consumed (kWh)',
        data: historicalData.map(d => d.energy_consumed_kwh),
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        fill: true,
        tension: 0.4
      },
      {
        label: 'Grid Usage (kWh)',
        data: historicalData.map(d => d.grid_usage_kwh),
        borderColor: '#8b5cf6',
        backgroundColor: 'rgba(139, 92, 246, 0.1)',
        fill: true,
        tension: 0.4
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Energy Flow - Last 24 Hours'
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Energy (kWh)'
        }
      }
    }
  };

  // Current metrics
  const currentGeneration = telemetryData?.energy_generated_kwh || 0;
  const currentConsumption = telemetryData?.energy_consumed_kwh || 0;
  const currentGridUsage = telemetryData?.grid_usage_kwh || 0;
  const batterySoc = telemetryData?.battery_soc || 0;

  // Calculate daily totals
  const dailyGeneration = historicalData.reduce((sum, d) => sum + d.energy_generated_kwh, 0);
  const dailyConsumption = historicalData.reduce((sum, d) => sum + d.energy_consumed_kwh, 0);
  const dailySavings = (dailyGeneration * 8).toFixed(2); // Assuming ₹8/kWh

  return (
    <div style={{ padding: '2rem', backgroundColor: '#f8fafc', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 700, color: '#1e293b', marginBottom: '0.5rem' }}>
          Energy Dashboard
        </h1>
        <p style={{ color: '#64748b' }}>
          Last updated: {lastUpdate.toLocaleTimeString()}
          <span style={{ 
            marginLeft: '1rem', 
            padding: '0.25rem 0.75rem', 
            backgroundColor: '#d1fae5', 
            color: '#059669', 
            borderRadius: '1rem', 
            fontSize: '0.875rem',
            fontWeight: 600
          }}>
            Live
          </span>
        </p>
      </div>

      {/* Current Metrics Cards */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
        gap: '1.5rem', 
        marginBottom: '2rem' 
      }}>
        {/* Solar Generation */}
        <MetricCard
          icon={<Sun size={32} />}
          title="Solar Generation"
          value={`${currentGeneration.toFixed(2)} kW`}
          subtitle={`${dailyGeneration.toFixed(1)} kWh today`}
          color="#f59e0b"
          trend="up"
        />

        {/* Consumption */}
        <MetricCard
          icon={<Zap size={32} />}
          title="Current Usage"
          value={`${currentConsumption.toFixed(2)} kW`}
          subtitle={`${dailyConsumption.toFixed(1)} kWh today`}
          color="#3b82f6"
        />

        {/* Battery */}
        <MetricCard
          icon={<BatteryCharging size={32} />}
          title="Battery Status"
          value={`${batterySoc}%`}
          subtitle={batterySoc > 80 ? 'Fully charged' : batterySoc > 20 ? 'Good' : 'Low'}
          color="#10b981"
          progress={batterySoc}
        />

        {/* Savings */}
        <MetricCard
          icon={<DollarSign size={32} />}
          title="Today's Savings"
          value={`₹${dailySavings}`}
          subtitle="vs grid-only power"
          color="#059669"
          trend="up"
        />
      </div>

      {/* Energy Flow Chart */}
      <div style={{ 
        backgroundColor: 'white', 
        borderRadius: '1rem', 
        padding: '1.5rem', 
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        marginBottom: '2rem'
      }}>
        <div style={{ height: '400px' }}>
          <Line data={energyChartData} options={chartOptions} />
        </div>
      </div>

      {/* Additional Info */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
        gap: '1.5rem' 
      }}>
        {/* Carbon Impact */}
        <div style={{ 
          backgroundColor: 'white', 
          borderRadius: '1rem', 
          padding: '1.5rem', 
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
            <div style={{ 
              width: '3rem', 
              height: '3rem', 
              backgroundColor: '#d1fae5', 
              borderRadius: '0.75rem', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center' 
            }}>
              <Leaf size={24} color="#059669" />
            </div>
            <div>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#1e293b' }}>
                Carbon Offset
              </h3>
              <p style={{ fontSize: '0.875rem', color: '#64748b' }}>Environmental impact</p>
            </div>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 700, color: '#059669', marginBottom: '0.5rem' }}>
            {(dailyGeneration * 0.7).toFixed(1)} kg
          </div>
          <p style={{ fontSize: '0.875rem', color: '#64748b' }}>
            CO₂ saved today • Equivalent to {Math.floor(dailyGeneration * 0.7 / 21)} trees
          </p>
        </div>

        {/* System Status */}
        <div style={{ 
          backgroundColor: 'white', 
          borderRadius: '1rem', 
          padding: '1.5rem', 
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
            <div style={{ 
              width: '3rem', 
              height: '3rem', 
              backgroundColor: '#dbeafe', 
              borderRadius: '0.75rem', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center' 
            }}>
              <Activity size={24} color="#3b82f6" />
            </div>
            <div>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#1e293b' }}>
                System Status
              </h3>
              <p style={{ fontSize: '0.875rem', color: '#64748b' }}>All systems operational</p>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <StatusItem label="Solar Panels" status="online" />
            <StatusItem label="Battery System" status="online" />
            <StatusItem label="Grid Connection" status="online" />
            <StatusItem label="Smart Meter" status="online" />
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

// Metric Card Component
function MetricCard({ icon, title, value, subtitle, color, trend, progress }) {
  return (
    <div style={{ 
      backgroundColor: 'white', 
      borderRadius: '1rem', 
      padding: '1.5rem', 
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      position: 'relative',
      overflow: 'hidden'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
        <div style={{ 
          width: '3rem', 
          height: '3rem', 
          backgroundColor: `${color}15`, 
          borderRadius: '0.75rem', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          color: color
        }}>
          {icon}
        </div>
        {trend && (
          <div style={{ color: trend === 'up' ? '#10b981' : '#ef4444' }}>
            {trend === 'up' ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
          </div>
        )}
      </div>
      <h3 style={{ fontSize: '0.875rem', fontWeight: 500, color: '#64748b', marginBottom: '0.5rem' }}>
        {title}
      </h3>
      <div style={{ fontSize: '1.875rem', fontWeight: 700, color: '#1e293b', marginBottom: '0.25rem' }}>
        {value}
      </div>
      <p style={{ fontSize: '0.875rem', color: '#64748b' }}>
        {subtitle}
      </p>
      {progress !== undefined && (
        <div style={{ 
          marginTop: '1rem', 
          height: '4px', 
          backgroundColor: '#e2e8f0', 
          borderRadius: '2px',
          overflow: 'hidden'
        }}>
          <div style={{ 
            height: '100%', 
            width: `${progress}%`, 
            backgroundColor: color,
            transition: 'width 0.3s ease'
          }} />
        </div>
      )}
    </div>
  );
}

// Status Item Component
function StatusItem({ label, status }) {
  const statusColors = {
    online: { bg: '#d1fae5', text: '#059669', label: 'Online' },
    offline: { bg: '#fee2e2', text: '#dc2626', label: 'Offline' },
    warning: { bg: '#fef3c7', text: '#d97706', label: 'Warning' }
  };

  const statusStyle = statusColors[status] || statusColors.online;

  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span style={{ fontSize: '0.875rem', color: '#475569' }}>{label}</span>
      <span style={{ 
        padding: '0.25rem 0.75rem', 
        backgroundColor: statusStyle.bg, 
        color: statusStyle.text, 
        borderRadius: '1rem', 
        fontSize: '0.75rem',
        fontWeight: 600
      }}>
        {statusStyle.label}
      </span>
    </div>
  );
}
