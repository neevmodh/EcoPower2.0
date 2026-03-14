'use client';
import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import 'leaflet/dist/leaflet.css';

const MapContainer = dynamic(() => import('react-leaflet').then(m => m.MapContainer), { ssr: false });
const TileLayer    = dynamic(() => import('react-leaflet').then(m => m.TileLayer),    { ssr: false });
const Marker       = dynamic(() => import('react-leaflet').then(m => m.Marker),       { ssr: false });
const Popup        = dynamic(() => import('react-leaflet').then(m => m.Popup),        { ssr: false });

// Color by location_type
const TYPE_COLORS = {
  residential: '#22C55E',
  commercial:  '#3B82F6',
  industrial:  '#F59E0B',
};

function makeIcon(L, color) {
  return L.divIcon({
    className: '',
    html: `<div style="
      width:28px;height:28px;border-radius:50% 50% 50% 0;
      background:${color};border:3px solid #fff;
      box-shadow:0 2px 8px rgba(0,0,0,0.35);
      transform:rotate(-45deg);
    "></div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 28],
    popupAnchor: [0, -30],
  });
}

export default function AhmedabadMap({ locations = [] }) {
  const [L, setL] = useState(null);

  useEffect(() => {
    import('leaflet').then(leaflet => {
      delete leaflet.Icon.Default.prototype._getIconUrl;
      leaflet.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
        iconUrl:       'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
        shadowUrl:     'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
      });
      setL(leaflet);
    });
  }, []);

  if (!L) {
    return (
      <div style={{ height: '100%', minHeight: 360, width: '100%', background: '#E2E8F0', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748B', fontWeight: 600 }}>
        Loading Map...
      </div>
    );
  }

  // Filter locations that have valid coordinates
  const validLocs = locations.filter(loc =>
    loc.coordinates?.lat && loc.coordinates?.lng &&
    !isNaN(loc.coordinates.lat) && !isNaN(loc.coordinates.lng)
  );

  // Compute center: average of all valid coords, or Ahmedabad default
  const center = validLocs.length > 0
    ? [
        validLocs.reduce((s, l) => s + l.coordinates.lat, 0) / validLocs.length,
        validLocs.reduce((s, l) => s + l.coordinates.lng, 0) / validLocs.length,
      ]
    : [23.0225, 72.5714];

  const zoom = validLocs.length > 1 ? 10 : 12;

  return (
    <div style={{ height: '100%', minHeight: 360, width: '100%', borderRadius: 12, overflow: 'hidden', border: '1px solid #E2E8F0', position: 'relative' }}>
      <MapContainer center={center} zoom={zoom} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {validLocs.map(loc => {
          const color = TYPE_COLORS[loc.location_type] || '#8B5CF6';
          const icon = makeIcon(L, color);
          return (
            <Marker
              key={loc.locationId || loc._id}
              position={[loc.coordinates.lat, loc.coordinates.lng]}
              icon={icon}
            >
              <Popup>
                <div style={{ fontFamily: 'Inter, sans-serif', minWidth: 160 }}>
                  <div style={{ fontWeight: 800, fontSize: '0.9rem', color: '#0F172A', marginBottom: 4 }}>
                    {loc.name || 'Location'}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#64748B', marginBottom: 2 }}>
                    {loc.address_line1 || loc.address}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#64748B', marginBottom: 6 }}>
                    {loc.city}, {loc.state}
                  </div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '2px 7px', borderRadius: 4, background: `${color}20`, color }}>
                      {(loc.location_type || 'unknown').toUpperCase()}
                    </span>
                    <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '2px 7px', borderRadius: 4, background: '#DCFCE7', color: '#16A34A' }}>
                      ACTIVE
                    </span>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      {/* Legend */}
      <div style={{ position: 'absolute', bottom: 12, left: 12, zIndex: 1000, background: 'rgba(255,255,255,0.95)', borderRadius: 10, padding: '8px 12px', boxShadow: '0 2px 8px rgba(0,0,0,0.15)', display: 'flex', gap: 12, fontSize: '0.72rem', fontWeight: 700 }}>
        {Object.entries(TYPE_COLORS).map(([type, color]) => (
          <div key={type} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: color }} />
            <span style={{ color: '#374151', textTransform: 'capitalize' }}>{type}</span>
          </div>
        ))}
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#8B5CF6' }} />
          <span style={{ color: '#374151' }}>Other</span>
        </div>
      </div>

      {validLocs.length === 0 && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(248,250,252,0.8)', zIndex: 999 }}>
          <div style={{ textAlign: 'center', color: '#64748B' }}>
            <div style={{ fontSize: '2rem', marginBottom: 8 }}>📍</div>
            <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>No locations with coordinates</div>
          </div>
        </div>
      )}
    </div>
  );
}
