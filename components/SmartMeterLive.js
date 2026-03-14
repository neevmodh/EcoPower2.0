'use client';
import { useEffect, useState, useRef } from 'react';
import { Activity, Zap, TrendingUp, TrendingDown, Wifi, WifiOff, AlertTriangle } from 'lucide-react';

export default function SmartMeterLive({ locationId, userId }) {
  const [meterData, setMeterData] = useState({
    voltage: 230,
    current: 12.5,
    power: 2875,
    frequency: 50.0,
    powerFactor: 0.98,
    energy: 145.8,
    status: 'online',
    lastUpdate: new Date(),
    temperature: 42,
    signalStrength: 85
  });
  const [history, setHistory] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const wsRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Simulate WebSocket connection for real-time data
    const connectWebSocket = () => {
      // In production, use: ws://your-server/ws/meter/${locationId}
      // For demo, simulate with setInterval
      
      setIsConnected(true);
      
      const interval = setInterval(() => {
        // Simulate real-time meter readings
        const newData = {
          voltage: 230 + (Math.random() - 0.5) * 10,
          current: 12.5 + (Math.random() - 0.5) * 2,
          power: 2875 + (Math.random() - 0.5) * 500,
          frequency: 50.0 + (Math.random() - 0.5) * 0.2,
          powerFactor: 0.98 + (Math.random() - 0.5) * 0.04,
          energy: meterData.energy + (Math.random() * 0.1),
          status: Math.random() > 0.95 ? 'warning' : 'online',
          lastUpdate: new Date(),
          temperature: 42 + (Math.random() - 0.5) * 5,
          signalStrength: 85 + (Math.random() - 0.5) * 10
        };

        setMeterData(newData);

        // Add to history (keep last 20 readings)
        setHistory(prev => {
          const updated = [...prev, {
            timestamp: new Date(),
            power: newData.power,
            voltage: newData.voltage
          }];
          return updated.slice(-20);
        });

        // Check for alerts
        if (newData.voltage > 250 || newData.voltage < 210) {
          setAlerts(prev => [...prev, {
            id: Date.now(),
            type: 'voltage',
            message: `Voltage ${newData.voltage > 250 ? 'high' : 'low'}: ${newData.voltage.toFixed(1)}V`,
            severity: 'warning',
            timestamp: new Date()
          }].slice(-5));
        }

        if (newData.temperature > 50) {
          setAlerts(prev => [...prev, {
            id: Date.now(),
            type: 'temperature',
            message: `High temperature: ${newData.temperature.toFixed(1)}°C`,
            severity: 'critical',
            timestamp: new Date()
          }].slice(-5));
        }
      }, 2000); // Update every 2 seconds

      return () => clearInterval(interval);
    };

    const cleanup = connectWebSocket();
    return cleanup;
  }, [locationId]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'online': return '#10b981';
      case 'warning': return '#f59e0b';
      case 'offline': return '#ef4444';
      default: return '#64748b';
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Connection Status */}
      <div style={{
        padding: '1rem',
        background: isConnected ? '#f0fdf4' : '#fef2f2',
        borderRadius: '0.75rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        border: `2px solid ${isConnected ? '#10b981' : '#ef4444'}`
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {isConnected ? <Wifi size={24} color="#10b981" /> : <WifiOff size={24} color="#ef4444" />}
          <div>
            <div style={{ fontWeight: 700, color: isConnected ? '#166534' : '#991b1b' }}>
              {isConnected ? 'Live Connection Active' : 'Connection Lost'}
            </div>
            <div style={{ fontSize: '0.85rem', color: isConnected ? '#166534' : '#991b1b', opacity: 0.8 }}>
              Last update: {meterData.lastUpdate.toLocaleTimeString()}
            </div>
          </div>
        </div>
        <div style={{
          padding: '0.5rem 1rem',
          background: 'white',
          borderRadius: '0.5rem',
          fontWeight: 700,
          fontSize: '0.85rem',
          color: getStatusColor(meterData.status)
        }}>
          {meterData.status.toUpperCase()}
        </div>
      </div>

      {/* Real-time Metrics Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
        <LiveMetric
          label="Voltage"
          value={meterData.voltage.toFixed(1)}
          unit="V"
          icon={Activity}
          color="#3b82f6"
          status={meterData.voltage > 250 || meterData.voltage < 210 ? 'warning' : 'normal'}
        />
        <LiveMetric
          label="Current"
          value={meterData.current.toFixed(2)}
          unit="A"
          icon={Zap}
          color="#f59e0b"
          status="normal"
        />
        <LiveMetric
          label="Power"
          value={(meterData.power / 1000).toFixed(2)}
          unit="kW"
          icon={TrendingUp}
          color="#10b981"
          status="normal"
        />
        <LiveMetric
          label="Frequency"
          value={meterData.frequency.toFixed(2)}
          unit="Hz"
          icon={Activity}
          color="#8b5cf6"
          status={Math.abs(meterData.frequency - 50) > 0.5 ? 'warning' : 'normal'}
        />
      </div>

      {/* Additional Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
        <MetricCard label="Power Factor" value={meterData.powerFactor.toFixed(3)} color="#3b82f6" />
        <MetricCard label="Energy Today" value={`${meterData.energy.toFixed(1)} kWh`} color="#10b981" />
        <MetricCard label="Temperature" value={`${meterData.temperature.toFixed(1)}°C`} color={meterData.temperature > 50 ? '#ef4444' : '#f59e0b'} />
        <MetricCard label="Signal" value={`${meterData.signalStrength.toFixed(0)}%`} color="#8b5cf6" />
      </div>

      {/* Real-time Chart */}
      <div className="glass-card" style={{ padding: '1.5rem' }}>
        <div style={{ marginBottom: '1rem' }}>
          <h4 style={{ fontSize: '1rem', fontWeight: 700, margin: 0 }}>Real-time Power Consumption</h4>
          <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '0.25rem 0 0 0' }}>
            Last 40 seconds • Updates every 2s
          </p>
        </div>
        <div style={{
          display: 'flex',
          alignItems: 'flex-end',
          gap: '0.25rem',
          height: '150px',
          padding: '1rem',
          background: '#f8fafc',
          borderRadius: '0.75rem'
        }}>
          {history.map((point, i) => {
            const maxPower = Math.max(...history.map(h => h.power), 3000);
            const height = (point.power / maxPower) * 100;
            return (
              <div
                key={i}
                style={{
                  flex: 1,
                  height: `${height}%`,
                  background: 'linear-gradient(to top, #10b981, #34d399)',
                  borderRadius: '2px 2px 0 0',
                  minHeight: '5px',
                  transition: 'height 0.3s ease',
                  position: 'relative'
                }}
                title={`${point.power.toFixed(0)}W at ${point.timestamp.toLocaleTimeString()}`}
              />
            );
          })}
        </div>
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <AlertTriangle size={20} color="#f59e0b" />
            <h4 style={{ fontSize: '1rem', fontWeight: 700, margin: 0 }}>Recent Alerts</h4>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {alerts.map((alert) => (
              <div
                key={alert.id}
                style={{
                  padding: '0.75rem 1rem',
                  background: alert.severity === 'critical' ? '#fef2f2' : '#fef3c7',
                  border: `1px solid ${alert.severity === 'critical' ? '#ef4444' : '#f59e0b'}`,
                  borderRadius: '0.5rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div style={{ fontSize: '0.9rem', fontWeight: 600, color: alert.severity === 'critical' ? '#991b1b' : '#92400e' }}>
                  {alert.message}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                  {alert.timestamp.toLocaleTimeString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Meter Info */}
      <div style={{
        padding: '1rem',
        background: '#f8fafc',
        borderRadius: '0.75rem',
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '1rem',
        fontSize: '0.85rem'
      }}>
        <div>
          <div style={{ color: '#64748b', marginBottom: '0.25rem' }}>Meter ID</div>
          <div style={{ fontWeight: 700, fontFamily: 'monospace' }}>SM-{locationId}-001</div>
        </div>
        <div>
          <div style={{ color: '#64748b', marginBottom: '0.25rem' }}>Firmware</div>
          <div style={{ fontWeight: 700 }}>v2.4.1</div>
        </div>
        <div>
          <div style={{ color: '#64748b', marginBottom: '0.25rem' }}>Protocol</div>
          <div style={{ fontWeight: 700 }}>MQTT/TLS</div>
        </div>
      </div>
    </div>
  );
}

function LiveMetric({ label, value, unit, icon: Icon, color, status }) {
  return (
    <div style={{
      padding: '1.25rem',
      background: 'white',
      border: `2px solid ${status === 'warning' ? '#f59e0b' : '#e2e8f0'}`,
      borderRadius: '1rem',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {status === 'warning' && (
        <div style={{
          position: 'absolute',
          top: '0.5rem',
          right: '0.5rem'
        }}>
          <AlertTriangle size={16} color="#f59e0b" />
        </div>
      )}
      <div style={{
        width: '40px',
        height: '40px',
        borderRadius: '10px',
        background: `${color}15`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: '0.75rem'
      }}>
        <Icon size={20} color={color} />
      </div>
      <div style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '0.5rem', fontWeight: 600 }}>
        {label}
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.25rem' }}>
        <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#1e293b', lineHeight: 1 }}>
          {value}
        </div>
        <div style={{ fontSize: '0.9rem', color: '#64748b', fontWeight: 600 }}>
          {unit}
        </div>
      </div>
      <div style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: '3px',
        background: color,
        animation: 'pulse 2s ease-in-out infinite'
      }} />
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes pulse {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 1; }
        }
      `}} />
    </div>
  );
}

function MetricCard({ label, value, color }) {
  return (
    <div style={{
      padding: '1rem',
      background: 'white',
      border: '1px solid #e2e8f0',
      borderRadius: '0.75rem'
    }}>
      <div style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '0.5rem' }}>
        {label}
      </div>
      <div style={{ fontSize: '1.25rem', fontWeight: 800, color }}>
        {value}
      </div>
    </div>
  );
}
