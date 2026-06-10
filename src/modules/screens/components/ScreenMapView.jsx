import React, { useEffect, useRef, useMemo } from 'react';
import { MapPin, Monitor, Wifi, WifiOff, Wrench } from 'lucide-react';

// Leaflet CSS is loaded via index.html or index.css
// We use dynamic import to avoid SSR issues
let L;

const STATUS_COLORS = {
  Online: '#22c55e',
  Offline: '#ef4444',
  Maintenance: '#f59e0b',
  default: '#6b7280',
};

const STATUS_LABELS = {
  Online: 'متصل',
  Offline: 'غير متصل',
  Maintenance: 'صيانة',
};

// Yemen bounds
const YEMEN_CENTER = [15.5527, 48.5164];
const YEMEN_ZOOM = 6;

// Approximate governorate coordinates (centers)
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

const ScreenMapView = ({
  screens = [],
  selectedGov,
  selectedRegion,
  selectedStreet,
  governorates = [],
  regions = [],
  streets = [],
  onMapReady,
}) => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersLayerRef = useRef(null);
  const tileLayerRef = useRef(null);
  const initAttemptedRef = useRef(false);

  // Filter screens based on selection
  const visibleScreens = useMemo(() => {
    if (!screens.length) return [];
    return screens.filter(s => {
      if (selectedStreet) return String(s.street_id) === String(selectedStreet);
      if (selectedRegion) return String(s.street?.region_id) === String(selectedRegion);
      if (selectedGov) return String(s.street?.region?.gov_id) === String(selectedGov);
      return true;
    });
  }, [screens, selectedGov, selectedRegion, selectedStreet]);

  // Determine map center and zoom
  const mapView = useMemo(() => {
    let targetCenter = YEMEN_CENTER;
    let targetZoom = YEMEN_ZOOM;

    const screensWithCoords = visibleScreens.filter(s => s.latitude && s.longitude);
    let bestCenter = null;

    // 1. حساب مستوى التقريب بناءً على ما قام بفتحه المستخدم
    if (selectedStreet) targetZoom = 16;
    else if (selectedRegion) targetZoom = 14;
    else if (selectedGov) targetZoom = 11;

    // 2. البحث عن أدق نقطة جغرافية متوفرة تباعاً: شارع ← منطقة ← محافظة
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

    // 3. اعتماد الاحداثيات: اذا وجدت نقطة نعتمدها، وإلا نبحث في الشاشات
    if (bestCenter) {
      targetCenter = bestCenter;
    } else if (screensWithCoords.length > 0) {
      const avg = screensWithCoords.reduce(
        (acc, s) => ({ lat: acc.lat + parseFloat(s.latitude), lng: acc.lng + parseFloat(s.longitude) }),
        { lat: 0, lng: 0 }
      );
      targetCenter = [avg.lat / screensWithCoords.length, avg.lng / screensWithCoords.length];
    }

    return { center: targetCenter, zoom: targetZoom };
  }, [selectedGov, selectedRegion, selectedStreet, visibleScreens, governorates, regions, streets]);

  // Initialize map
  useEffect(() => {
    if (!mapRef.current || initAttemptedRef.current) return;
    initAttemptedRef.current = true;

    const initMap = async () => {
      try {
        const leaflet = await import('leaflet');
        L = leaflet.default;

        // Fix marker icons
        delete L.Icon.Default.prototype._getIconUrl;
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
          iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
          shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
        });

        if (mapInstanceRef.current) return;

        const map = L.map(mapRef.current, {
          center: YEMEN_CENTER,
          zoom: YEMEN_ZOOM,
          zoomControl: false,      // إخفاء أزرار التقريب
          dragging: false,         // منع سحب الخريطة بالماوس
          touchZoom: false,        // منع التقريب بلمس الشاشة
          doubleClickZoom: false,  // منع التقريب بالنقر المزدوج
          scrollWheelZoom: false,  // منع التقريب بالبكرة
          boxZoom: false,
          keyboard: false,
          attributionControl: true,
        });

        // Warm beige tile layer matching the design
        tileLayerRef.current = L.tileLayer(
          'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
          {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
            subdomains: 'abcd',
            maxZoom: 19,
          }
        ).addTo(map);

        markersLayerRef.current = L.layerGroup().addTo(map);
        mapInstanceRef.current = map;

        if (onMapReady) onMapReady(map);
      } catch (err) {
        console.error('Leaflet init error:', err);
      }
    };

    initMap();

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        initAttemptedRef.current = false;
      }
    };
  }, []);

  // Update markers when screens or selection changes
  useEffect(() => {
    if (!mapInstanceRef.current || !markersLayerRef.current || !L) return;

    markersLayerRef.current.clearLayers();

    const screensWithCoords = visibleScreens.filter(s => s.latitude && s.longitude);

    if (screensWithCoords.length > 0) {
      screensWithCoords.forEach(screen => {
        const color = STATUS_COLORS[screen.status] || STATUS_COLORS.default;
        const lat = parseFloat(screen.latitude);
        const lng = parseFloat(screen.longitude);

        const icon = L.divIcon({
          className: '',
          html: `
            <div style="
              width:36px; height:36px;
              background: ${color};
              border: 3px solid white;
              border-radius: 50% 50% 50% 0;
              transform: rotate(-45deg);
              box-shadow: 0 4px 12px rgba(0,0,0,0.3);
              display:flex; align-items:center; justify-content:center;
            ">
              <div style="
                transform: rotate(45deg);
                color: white;
                font-size: 10px;
                font-weight: bold;
              ">📺</div>
            </div>
          `,
          iconSize: [36, 36],
          iconAnchor: [18, 36],
          popupAnchor: [0, -36],
        });

        const statusLabel = STATUS_LABELS[screen.status] || screen.status;
        const popup = L.popup({ maxWidth: 260, className: 'screen-map-popup' }).setContent(`
          <div style="font-family: 'Cairo', sans-serif; direction: rtl; padding: 4px;">
            <div style="font-size:14px; font-weight:800; color:#1a1a2e; margin-bottom:4px;">${screen.screen_name}</div>
            <div style="display:flex; align-items:center; gap:6px; margin-bottom:4px;">
              <span style="width:8px;height:8px;border-radius:50%;background:${color};display:inline-block;flex-shrink:0;"></span>
              <span style="font-size:12px; color:${color}; font-weight:700;">${statusLabel}</span>
            </div>
            ${screen.street ? `<div style="font-size:11px; color:#6b7280;">${screen.street.name}${screen.street.region ? ' — ' + screen.street.region.name : ''}</div>` : ''}
            ${screen.image_path ? `<img src="${screen.image_path}" style="width:100%; border-radius:8px; margin-top:8px; max-height:80px; object-fit:cover;" />` : ''}
          </div>
        `);

        L.marker([lat, lng], { icon }).bindPopup(popup).addTo(markersLayerRef.current);
      });
    } else if (visibleScreens.length > 0 && !selectedStreet) {
      // Fallback: show placeholder pin when screens exist but have no GPS coords
      const icon = L.divIcon({
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
      L.marker(mapView.center, { icon })
        .bindPopup(`<div style="direction:rtl;font-family:Cairo,sans-serif;font-size:13px;font-weight:700;">${visibleScreens.length} شاشة في هذه المنطقة<br/><span style="font-size:11px;color:#6b7280;">إحداثيات GPS غير محددة</span></div>`)
        .addTo(markersLayerRef.current);
    }

    // Fly to new view
    mapInstanceRef.current.flyTo(mapView.center, mapView.zoom, { duration: 1.2 });

  }, [visibleScreens, mapView, selectedStreet]);

  return (
    <div className="relative w-full h-full rounded-2xl overflow-hidden">
      <div ref={mapRef} className="w-full h-full" style={{ minHeight: '400px' }} />
      
      {/* Legend */}
      <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-sm rounded-xl px-3 py-2 border border-gray-200 shadow-lg z-[1000]">
        <p className="text-[9px] font-black text-gray-500 uppercase tracking-wider mb-1.5">حالة الشاشات</p>
        {Object.entries(STATUS_LABELS).map(([status, label]) => (
          <div key={status} className="flex items-center gap-1.5 mb-1">
            <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: STATUS_COLORS[status] }}></span>
            <span className="text-[10px] font-bold text-gray-700">{label}</span>
          </div>
        ))}
      </div>

      {/* Screen count badge */}
      {visibleScreens.length > 0 && (
        <div className="absolute top-4 right-4 bg-[#145d6a] text-white text-xs font-black px-3 py-1.5 rounded-full shadow-lg z-[1000] flex items-center gap-1.5">
          <Monitor className="w-3 h-3" />
          {visibleScreens.length} شاشة
        </div>
      )}
    </div>
  );
};

export default ScreenMapView;
