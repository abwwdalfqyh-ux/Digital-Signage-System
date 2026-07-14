import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { MapPin } from 'lucide-react';

// Fix leaflet icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

const MapEvents = ({ onLocationSelect }) => {
  useMapEvents({
    click(e) {
      onLocationSelect(e.latlng);
    }
  });
  return null;
};

const LocationPickerMap = ({ onSelect, initialLat, initialLng, onClose }) => {
  const defaultCenter = [15.3694, 44.1910]; // Sana'a default
  const [position, setPosition] = useState(
    (initialLat && initialLng) ? { lat: initialLat, lng: initialLng } : null
  );

  const handleSelect = () => {
    if (position) {
      onSelect(position.lat, position.lng);
    }
  };

  return (
    <div style={{ position: 'relative', width: '100%', height: '400px', borderRadius: '12px', overflow: 'hidden' }}>
      <MapContainer
        center={position ? [position.lat, position.lng] : defaultCenter}
        zoom={position ? 15 : 12}
        style={{ width: '100%', height: '100%' }}
      >
        <TileLayer
          url="https://mt1.google.com/vt/lyrs=y&hl=ar&x={x}&y={y}&z={z}"
          attribution='&copy; <a href="https://www.google.com/intl/ar/help/terms_maps/">Google Maps</a>'
          maxZoom={20}
        />
        <MapEvents onLocationSelect={setPosition} />
        {position && <Marker position={[position.lat, position.lng]} />}
      </MapContainer>
      
      {/* Overlay UI */}
      <div style={{
        position: 'absolute', bottom: 20, left: 20, right: 20, zIndex: 1000,
        display: 'flex', flexDirection: 'column', gap: '12px', direction: 'rtl'
      }}>
        {/* Info Box */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.95)', backdropFilter: 'blur(10px)',
          padding: '12px 20px', borderRadius: '12px', border: '1px solid #c3c6d7',
          boxShadow: '0 8px 24px rgba(0,0,0,0.08)', display: 'flex', alignItems: 'center', gap: '10px'
        }}>
          <div style={{ width: 32, height: 32, borderRadius: '8px', background: '#e9edff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <MapPin style={{ color: '#004ac6', width: 18, height: 18 }} />
          </div>
          <span style={{ fontSize: '13px', fontWeight: 700, color: '#141b2b', lineHeight: '1.4' }}>
            {position ? `خط الطول: ${position.lng.toFixed(5)} | خط العرض: ${position.lat.toFixed(5)}` : 'قم بالنقر على الخريطة لتحديد موقع الشاشة بدقة'}
          </span>
        </div>
        
        {/* Actions Box */}
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            type="button"
            onClick={handleSelect}
            disabled={!position}
            style={{
              flex: 1, background: position ? 'linear-gradient(135deg, #004ac6 0%, #2563eb 100%)' : '#c3c6d7',
              color: 'white', border: 'none', padding: '12px 24px', borderRadius: '10px',
              fontSize: '14px', fontWeight: 700, cursor: position ? 'pointer' : 'not-allowed',
              boxShadow: position ? '0 4px 16px rgba(0,74,198,0.30)' : 'none',
              transition: 'all 0.2s'
            }}
          >
            اعتماد الموقع
          </button>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              style={{
                background: '#f1f3ff', color: '#434655', border: 'none',
                padding: '12px 24px', borderRadius: '10px', fontSize: '14px', fontWeight: 700,
                cursor: 'pointer', transition: 'background 0.2s'
              }}
              onMouseEnter={e => e.target.style.background = '#e9edff'}
              onMouseLeave={e => e.target.style.background = '#f1f3ff'}
            >
              إلغاء
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default LocationPickerMap;
