import React, { useMemo, useEffect } from 'react';
import { Monitor } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, useMap, LayersControl } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import useTranslation from '../../../i18n/useTranslation';

// Fix Leaflet's default icon paths issue with Webpack/Vite (safe initialization)
if (L.Icon.Default.prototype._getIconUrl) {
  delete L.Icon.Default.prototype._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  });
}

const STATUS_COLORS = {
  Online: '#22c55e',
  Offline: '#ef4444',
  Maintenance: '#f59e0b',
  default: '#6b7280',
};

const getStatusLabels = (t) => ({
  Online: t('screens.status_online'),
  Offline: t('screens.status_offline'),
  Maintenance: t('screens.status_maintenance'),
});

// Yemen bounds
const YEMEN_CENTER = [15.5527, 48.5164];
const YEMEN_ZOOM = 6;

// Approximate governorate coordinates
const GOV_COORDS = {
  'صنعاء': [15.3694, 44.1910],
  'عدن': [12.7794, 45.0367],
  'تعز': [13.5788, 44.0209],
  'الحديدة': [14.7978, 42.9498],
  'حضرموت': [15.9316, 48.7822],
  'إب': [13.9716, 44.1760],
  'ذمار': [14.5437, 44.4091],
  'مأرب': [15.4680, 45.3244],
  'لحج': [13.0538, 44.8896],
  'أبين': [13.5605, 45.5673],
  'شبوة': [14.5460, 47.1060],
  'البيضاء': [14.0004, 45.5810],
  'الضالع': [13.6939, 44.7194],
  'ريمة': [14.5800, 43.7200],
  'المحويت': [15.4670, 43.5449],
  'عمران': [15.8856, 43.9418],
  'حجة': [15.6986, 43.5945],
  'صعدة': [16.9413, 43.7589],
  'الجوف': [16.2100, 45.5500],
  'سقطرى': [12.4634, 53.8236],
  'المهرة': [16.5233, 51.7762],
  'أرخبيل سقطرى': [12.4634, 53.8236],
};

// Component to handle map view updates smoothly
const MapUpdater = ({ view }) => {
  const map = useMap();
  useEffect(() => {
    map.flyTo(view.center, view.zoom, { duration: 1.2 });
  }, [map, view]);
  return null;
};

// Create custom icons 
const createCustomIcon = (status, selected = false) => {
  const color = STATUS_COLORS[status] || STATUS_COLORS.default;
  return L.divIcon({
    className: '',
    html: `
      <div style="
        width:${selected ? '44px' : '36px'}; 
        height:${selected ? '44px' : '36px'};
        background: ${color};
        border: 3px solid white;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        display:flex; align-items:center; justify-content:center;
        transition: all 0.3s ease;
        ${selected ? 'z-index: 1000;' : ''}
      ">
        <div style="
          transform: rotate(45deg);
          color: white;
          font-size: ${selected ? '14px' : '10px'};
          font-weight: bold;
        ">📺</div>
      </div>
    `,
    iconSize: selected ? [44, 44] : [36, 36],
    iconAnchor: selected ? [22, 44] : [18, 36],
    popupAnchor: [0, selected ? -44 : -36],
  });
};

const FallbackIcon = L.divIcon({
  className: '',
  html: `
    <div style="position:relative;">
      <div style="
        width:24px; height:24px;
        background: rgba(20,93,106,0.2);
        border-radius:50%;
        position:absolute;
        top:-18px; left:-12px;
        animation: ping 1.5s ease-in-out infinite;
      "></div>
      <div style="
        width:14px; height:14px;
        background: #145d6a;
        border: 2px solid white;
        border-radius:50%;
        position:absolute;
        top:-13px; left:-7px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      "></div>
    </div>
  `,
  iconSize: [0, 0],
  iconAnchor: [0, 0],
});

export default function ScreenMapView({
  screens = [],
  selectedGov,
  selectedRegion,
  selectedStreet,
  governorates = [],
  regions = [],
  streets = [],
}) {
  const { t } = useTranslation();
  
  const STATUS_LABELS = useMemo(() => getStatusLabels(t), [t]);

  const visibleScreens = useMemo(() => {
    if (!screens.length) return [];
    return screens.filter(s => {
      if (selectedStreet) return String(s.street_id) === String(selectedStreet);
      if (selectedRegion) return String(s.street?.region_id) === String(selectedRegion);
      if (selectedGov) return String(s.street?.region?.gov_id) === String(selectedGov);
      return true;
    });
  }, [screens, selectedGov, selectedRegion, selectedStreet]);

  const screensWithCoords = useMemo(() => {
    return visibleScreens.filter(s => s.latitude && s.longitude);
  }, [visibleScreens]);

  const mapView = useMemo(() => {
    let targetCenter = YEMEN_CENTER;
    let targetZoom = YEMEN_ZOOM;
    let bestCenter = null;

    if (selectedStreet) targetZoom = 16;
    else if (selectedRegion) targetZoom = 14;
    else if (selectedGov) targetZoom = 11;

    if (selectedStreet) {
      const street = streets.find(s => String(s.street_id) === String(selectedStreet));
      if (street && street.latitude && street.longitude) bestCenter = [parseFloat(street.latitude), parseFloat(street.longitude)];
    }
    if (selectedRegion && !bestCenter) {
      const region = regions.find(r => String(r.region_id) === String(selectedRegion));
      if (region && region.latitude && region.longitude) bestCenter = [parseFloat(region.latitude), parseFloat(region.longitude)];
    }
    if (selectedGov && !bestCenter) {
      const gov = governorates.find(g => String(g.gov_id) === String(selectedGov));
      if (gov && gov.latitude && gov.longitude) bestCenter = [parseFloat(gov.latitude), parseFloat(gov.longitude)];
      else if (gov && gov.name && GOV_COORDS[gov.name]) bestCenter = GOV_COORDS[gov.name];
    }

    if (bestCenter) {
      targetCenter = bestCenter;
    }

    return { center: targetCenter, zoom: targetZoom };
  }, [selectedGov, selectedRegion, selectedStreet, screensWithCoords, governorates, regions, streets]);

  return (
    <div className="relative w-full h-full rounded-2xl overflow-hidden z-[0]">
      <MapContainer
        center={YEMEN_CENTER}
        zoom={YEMEN_ZOOM}
        className="w-full h-full z-[0]"
        style={{ minHeight: '400px', height: '100%', width: '100%' }}
        zoomControl={false}
      >
        <LayersControl position="topright">
          <LayersControl.BaseLayer name={t('screens.satellite_map_with_names')} checked>
            <TileLayer
              attribution='&copy; Google Maps'
              url="https://mt1.google.com/vt/lyrs=y&hl=ar&x={x}&y={y}&z={z}"
              maxZoom={20}
            />
          </LayersControl.BaseLayer>
          <LayersControl.BaseLayer name={t('screens.street_map_light')}>
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
              maxZoom={19}
              subdomains="abcd"
            />
          </LayersControl.BaseLayer>
        </LayersControl>

        <MapUpdater view={mapView} />

        {screensWithCoords.map((screen) => {
          const statusLabel = STATUS_LABELS[screen.computed_status] || screen.computed_status;
          const color = STATUS_COLORS[screen.computed_status] || STATUS_COLORS.default;
          
          return (
            <Marker
              key={screen.screen_id || screen.id}
              position={[parseFloat(screen.latitude), parseFloat(screen.longitude)]}
              icon={createCustomIcon(screen.computed_status, false)}
            >
              <Popup className="screen-map-popup" maxWidth={260}>
                <div style={{ fontFamily: "'Cairo', sans-serif", direction: 'rtl', padding: '4px', textAlign: 'right' }}>
                  <div style={{ fontSize: '14px', fontWeight: 800, color: '#1a1a2e', marginBottom: '4px' }}>
                    {screen.screen_name}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: color, display: 'inline-block' }}></span>
                    <span style={{ fontSize: '12px', color, fontWeight: 700 }}>{statusLabel}</span>
                  </div>
                  {screen.street && (
                    <div style={{ fontSize: '11px', color: '#6b7280' }}>
                      {screen.street.name}
                      {screen.street.region ? ` — ${screen.street.region.name}` : ''}
                    </div>
                  )}
                  {screen.image_path && (
                    <img src={screen.image_path} alt={screen.screen_name} style={{ width: '100%', borderRadius: '8px', marginTop: '8px', maxHeight: '80px', objectFit: 'cover' }} />
                  )}
                </div>
              </Popup>
            </Marker>
          );
        })}

        {visibleScreens.length > 0 && screensWithCoords.length === 0 && !selectedStreet && (
          <Marker position={mapView.center} icon={FallbackIcon}>
            <Popup>
              <div style={{ direction: 'rtl', fontFamily: 'Cairo,sans-serif', fontSize: '13px', fontWeight: 700, textAlign: 'right' }}>
                {t('screens.screens_in_this_region').replace('{count}', visibleScreens.length)}
                <br />
                <span style={{ fontSize: '11px', color: '#6b7280' }}>{t('screens.gps_coordinates_undefined')}</span>
              </div>
            </Popup>
          </Marker>
        )}
      </MapContainer>

      {/* Legend */}
      <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-sm rounded-xl px-3 py-2 border border-gray-200 shadow-lg z-[400]">
        <p className="text-[9px] font-black text-gray-500 uppercase tracking-wider mb-1.5 text-right">حالة الشاشات</p>
        {Object.entries(STATUS_LABELS).map(([status, label]) => (
          <div key={status} className="flex items-center gap-1.5 mb-1" style={{direction: "rtl"}}>
            <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: STATUS_COLORS[status] }}></span>
            <span className="text-[10px] font-bold text-gray-700">{label}</span>
          </div>
        ))}
      </div>

      {/* Screen count badge */}
      {visibleScreens.length > 0 && (
        <div className="absolute top-4 right-4 bg-[#145d6a] text-white text-xs font-black px-3 py-1.5 rounded-full shadow-lg z-[400] flex flex-row-reverse items-center gap-1.5">
          <Monitor className="w-3 h-3" />
          {visibleScreens.length} شاشة
        </div>
      )}
    </div>
  );
}
