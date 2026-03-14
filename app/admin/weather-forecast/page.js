'use client';
import { useState, useEffect } from 'react';
import { Sun, Cloud, CloudRain, Wind, Thermometer, Zap, RefreshCw, Sparkles, MapPin } from 'lucide-react';
import AIAdvisor from '@/components/AIAdvisor';
import { groqChat } from '@/lib/groqClient';

const LOCATIONS = ['Ahmedabad', 'Satellite', 'Vastrapur', 'Bodakdev', 'Navrangpura', 'Gandhinagar'];

const mockWeatherData = (location) => ({
  location,
  current: { temp: 32 + Math.floor(Math.random() * 8), humidity: 45 + Math.floor(Math.random() * 20), windSpeed: 12 + Math.floor(Math.random() * 10), condition: ['Sunny', 'Partly Cloudy', 'Clear'][Math.floor(Math.random() * 3)], uvIndex: 7 + Math.floor(Math.random() * 4), solarIrradiance: 850 + Math.floor(Math.random() * 200) },
  forecast: Array.from({ length: 7 }, (_, i) => ({ day: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i], high: 30 + Math.floor(Math.random() * 10), low: 22 + Math.floor(Math.random() * 6), condition: ['Sunny', 'Partly Cloudy', 'Cloudy', 'Rainy'][Math.floor(Math.random() * 4)], solarPotential: 60 + Math.floor(Math.random() * 40) })),
  solarPrediction: { today: 42 + Math.floor(Math.random() * 15), tomorrow: 38 + Math.floor(Math.random() * 20), weekTotal: 280 + Math.floor(Math.random() * 60) }
});

const WeatherIcon = ({ condition, size = 24 }) => {
  if (condition?.includes('Rain')) return <CloudRain size={size} color="#3B82F6" />;
  if (condition?.includes('Cloud')) return <Cloud size={size} color="#94A3B8" />;
  return <Sun size={size} color="#F59E0B" />;
};

export default function WeatherForecast() {
  const [location, setLocation] = useState('Ahmedabad');
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(true);
  const [aiPrediction, setAiPrediction] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchWeather = () => {
    setLoading(true);
    setTimeout(() => {
      setWeather(mockWeatherData(location));
      setLastUpdated(new Date());
      setLoading(false);
    }, 600);
  };

  useEffect(() => { fetchWeather(); }, [location]);

  const getAISolarPrediction = async () => {
    if (!weather) return;
    setAiLoading(true);
    try {
      const reply = await groqChat({
        messages: [{ role: 'user', content: `Based on this weather data for ${location}, provide a detailed solar energy generation forecast and optimization recommendations: Current temp: ${weather.current.temp}°C, Humidity: ${weather.current.humidity}%, Wind: ${weather.current.windSpeed} km/h, Solar Irradiance: ${weather.current.solarIrradiance} W/m², UV Index: ${weather.current.uvIndex}. 7-day forecast: ${JSON.stringify(weather.forecast)}. Predicted solar today: ${weather.solarPrediction.today} kWh. Give specific recommendations for maximizing solar yield.` }],
        mode: 'analytics',
        context: `Weather data for ${location} solar farm`
      });
      setAiPrediction(reply || 'Prediction unavailable.');
    } catch (err) { setAiPrediction(`Error: ${err.message}`); } finally { setAiLoading(false); }
  };

  if (loading) return <div style={{ padding: '3rem', textAlign: 'center', color: '#64748B' }}>Loading weather data...</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', fontFamily: 'Inter, sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>Weather & Solar Forecast</h1>
          <p style={{ color: '#64748B', margin: '0.25rem 0 0 0', fontSize: '0.9rem' }}>AI-powered solar generation predictions</p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '0.6rem 1rem', background: '#fff', border: '1.5px solid #E2E8F0', borderRadius: 10 }}>
            <MapPin size={16} color="#64748B" />
            <select value={location} onChange={e => setLocation(e.target.value)} style={{ border: 'none', outline: 'none', fontFamily: 'Inter, sans-serif', fontSize: '0.875rem', fontWeight: 600, color: '#0F172A', background: 'transparent', cursor: 'pointer' }}>
              {LOCATIONS.map(l => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>
          <button onClick={getAISolarPrediction} disabled={aiLoading} style={{ padding: '0.6rem 1.2rem', background: '#7C3AED', color: '#fff', border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: 700, fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: 6 }}><Sparkles size={16} />{aiLoading ? 'Predicting...' : 'AI Solar Prediction'}</button>
          <button onClick={fetchWeather} style={{ padding: '0.6rem 1.2rem', background: '#F1F5F9', color: '#374151', border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}><RefreshCw size={16} />Refresh</button>
        </div>
      </div>

      {lastUpdated && <div style={{ fontSize: '0.8rem', color: '#94A3B8' }}>Last updated: {lastUpdated.toLocaleTimeString()}</div>}

      {/* Current Conditions */}
      <div style={{ background: 'linear-gradient(135deg,#0F172A,#1E3A5F)', borderRadius: 20, padding: '2rem', color: '#fff' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <div>
            <div style={{ fontSize: '0.875rem', color: '#94A3B8', marginBottom: 4 }}>{location}, Gujarat</div>
            <div style={{ fontSize: '4rem', fontWeight: 900, lineHeight: 1 }}>{weather.current.temp}°C</div>
            <div style={{ fontSize: '1.1rem', color: '#CBD5E1', marginTop: 8 }}>{weather.current.condition}</div>
          </div>
          <WeatherIcon condition={weather.current.condition} size={80} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
          {[
            { label: 'Humidity', value: `${weather.current.humidity}%`, icon: '💧' },
            { label: 'Wind Speed', value: `${weather.current.windSpeed} km/h`, icon: '💨' },
            { label: 'UV Index', value: weather.current.uvIndex, icon: '☀️' },
            { label: 'Solar Irradiance', value: `${weather.current.solarIrradiance} W/m²`, icon: '⚡' },
          ].map(m => (
            <div key={m.label} style={{ padding: '1rem', background: 'rgba(255,255,255,0.1)', borderRadius: 12 }}>
              <div style={{ fontSize: '1.25rem', marginBottom: 4 }}>{m.icon}</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 800 }}>{m.value}</div>
              <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>{m.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Solar Prediction Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
        {[
          { label: "Today's Solar Yield", value: `${weather.solarPrediction.today} kWh`, color: '#F59E0B', icon: Sun },
          { label: "Tomorrow's Forecast", value: `${weather.solarPrediction.tomorrow} kWh`, color: '#22C55E', icon: Zap },
          { label: '7-Day Total', value: `${weather.solarPrediction.weekTotal} kWh`, color: '#3B82F6', icon: Thermometer },
        ].map(m => (
          <div key={m.label} style={{ background: '#fff', padding: '1.5rem', borderRadius: 14, border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: `${m.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><m.icon size={24} color={m.color} /></div>
            <div><div style={{ color: '#64748B', fontSize: '0.8rem', fontWeight: 600 }}>{m.label}</div><div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0F172A' }}>{m.value}</div></div>
          </div>
        ))}
      </div>

      {/* AI Prediction Panel */}
      {aiPrediction && (
        <div style={{ background: 'linear-gradient(135deg,#F5F3FF,#EDE9FE)', border: '1px solid #DDD6FE', borderRadius: 14, padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}><Sparkles size={18} color="#7C3AED" /><span style={{ fontWeight: 700, color: '#7C3AED' }}>AI Solar Generation Forecast</span></div>
          <p style={{ margin: 0, color: '#374151', fontSize: '0.875rem', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{aiPrediction}</p>
        </div>
      )}

      {/* 7-Day Forecast */}
      <div style={{ background: '#fff', padding: '2rem', borderRadius: 16, border: '1px solid #E2E8F0' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: '0 0 1.5rem 0', color: '#0F172A' }}>7-Day Solar Forecast</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.75rem' }}>
          {weather.forecast.map((day, i) => (
            <div key={i} style={{ textAlign: 'center', padding: '1rem 0.5rem', background: '#F8FAFC', borderRadius: 12 }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748B', marginBottom: 8 }}>{day.day}</div>
              <WeatherIcon condition={day.condition} size={24} />
              <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#0F172A', marginTop: 8 }}>{day.high}°</div>
              <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>{day.low}°</div>
              <div style={{ marginTop: 8, padding: '0.25rem 0.4rem', background: '#DCFCE7', borderRadius: 6, fontSize: '0.7rem', fontWeight: 700, color: '#16A34A' }}>{day.solarPotential}%</div>
            </div>
          ))}
        </div>
        <div style={{ marginTop: '1rem', fontSize: '0.75rem', color: '#94A3B8', textAlign: 'center' }}>Solar potential % indicates expected generation vs peak capacity</div>
      </div>

      <AIAdvisor mode="analytics" title="Weather AI Advisor" context={`Current: ${weather.current.temp}°C, ${weather.current.condition}, Solar Irradiance: ${weather.current.solarIrradiance} W/m² in ${location}`} />
    </div>
  );
}
