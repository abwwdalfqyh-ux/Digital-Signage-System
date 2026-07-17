import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { motion, AnimatePresence } from 'framer-motion';
import {
    MapPin, ChevronLeft, Monitor, Activity, Globe,
    Map as MapIcon, Navigation, Wrench, WifiOff, PowerOff, CheckCircle2, X, Loader2
} from 'lucide-react';
import axiosClient from '../../core/api/axiosClient';
import { ENDPOINTS } from '../../core/api/endpoints';
import useTranslation from '../../i18n/useTranslation';

/* ─────────────────────────────────────────────────────────────
   FIX: Leaflet icon 404 in Vite
───────────────────────────────────────────────────────────── */
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

/* ─────────────────────────────────────────────────────────────
   DESIGN TOKENS
───────────────────────────────────────────────────────────── */
const T = {
    primary:    '#2563eb',
    online:     '#16a34a',
    onlineL:    '#dcfce7',
    broken:     '#dc2626',
    brokenL:    '#fee2e2',
    maint:      '#d97706',
    maintL:     '#fef3c7',
    disc:       '#6b7280',
    discL:      '#f3f4f6',
    bg:         '#ffffff',
    border:     '#e2e8f0',
    text:       '#0f172a',
    muted:      '#64748b',
    surface:    '#f8fafc',
};

/* ─────────────────────────────────────────────────────────────
   STATUS CONFIG  (4 states)
───────────────────────────────────────────────────────────── */
const STATUS = {
    online:       { color: T.online, light: T.onlineL, label: 'متصلة' },
    broken:       { color: T.broken, light: T.brokenL, label: 'عطل' },
    maintenance:  { color: T.maint,  light: T.maintL,  label: 'صيانة' },
    disconnected: { color: T.disc,   light: T.discL,   label: 'مفصولة' },
};

const deriveStatus = (screen) => {
    if (!screen) return 'disconnected';
    if (screen.status === 'maintenance') return 'maintenance';
    const now = Date.now();
    const hb = screen.last_heartbeat ? new Date(screen.last_heartbeat).getTime() : null;
    const mins = hb ? (now - hb) / 60000 : Infinity;
    if (screen.is_online === true || screen.is_online === 1 || screen.status === 'active' || screen.status === 'online') return 'online';
    if (mins < 15) return 'broken';
    return 'disconnected';
};

/* ─────────────────────────────────────────────────────────────
   GOVERNANCE BOUNDING BOXES — Yemen governorates
   Format: [southLat, westLng, northLat, eastLng]
───────────────────────────────────────────────────────────── */
const GOV_BOUNDS = {
    'صنعاء':    [15.1, 44.0, 15.7, 44.6],
    'عدن':      [12.6, 44.8, 13.0, 45.3],
    'تعز':      [13.3, 43.7, 14.1, 44.4],
    'مأرب':     [14.8, 44.8, 16.2, 46.2],
    'حضرموت':   [13.9, 47.0, 18.0, 52.0],
    'إب':       [13.6, 43.9, 14.3, 44.5],
    'الحديدة':  [13.9, 42.5, 15.6, 43.7],
    'ذمار':     [14.2, 43.8, 14.9, 44.7],
    'صعدة':     [16.4, 43.3, 18.0, 44.8],
    'حجة':      [15.0, 42.8, 16.4, 43.6],
    'المحويت':  [15.2, 43.3, 15.8, 43.9],
    'ريمة':     [14.5, 43.3, 15.1, 43.9],
    'البيضاء':  [13.5, 44.9, 14.6, 46.0],
    'الجوف':    [16.0, 44.4, 17.5, 46.0],
    'شبوة':     [13.5, 46.0, 16.0, 49.5],
    'لحج':      [12.8, 44.3, 13.6, 45.5],
    'أبين':     [13.0, 45.0, 14.0, 46.5],
    'المهرة':   [16.0, 51.5, 18.0, 53.0],
    'سقطرى':   [12.1, 53.0, 12.8, 54.5],
};

/* Default center per governorate name (fallback) */
const govCenter = (name) => {
    const b = GOV_BOUNDS[name];
    if (!b) return [15.5, 48.0];
    return [(b[0] + b[2]) / 2, (b[1] + b[3]) / 2];
};

/* ─────────────────────────────────────────────────────────────
   ICON BUILDERS
───────────────────────────────────────────────────────────── */


const makeScreenIcon = (status) => {
    const cfg = STATUS[status] || STATUS.disconnected;
    const s = 44;
    const inner = status === 'maintenance'
        ? `<text x="${s/2}" y="${s/2+5}" text-anchor="middle" font-size="13" fill="white">🔧</text>`
        : status === 'disconnected'
        ? `<line x1="${s*0.3}" y1="${s*0.3}" x2="${s*0.7}" y2="${s*0.7}" stroke="white" stroke-width="2.5" stroke-linecap="round"/>
           <line x1="${s*0.7}" y1="${s*0.3}" x2="${s*0.3}" y2="${s*0.7}" stroke="white" stroke-width="2.5" stroke-linecap="round"/>`
        : `<circle cx="${s/2}" cy="${s/2}" r="${s*0.18}" fill="white" opacity="0.9"/>`;

    const pulse = (status === 'online' || status === 'broken')
        ? `<circle cx="${s/2}" cy="${s/2}" r="${s*0.38}" fill="${cfg.color}" opacity="0"
               style="animation: ddPulse${status === 'broken' ? 'Fast' : 'Slow'} ${status === 'broken' ? '0.9s' : '2s'} ease-out infinite;"/>`
        : '';

    const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 ${s} ${s}">
        <style>
            @keyframes ddPulseSlow{0%{r:${s*0.38};opacity:.45}70%{r:${s*0.75};opacity:0}100%{r:${s*0.38};opacity:0}}
            @keyframes ddPulseFast{0%{r:${s*0.38};opacity:.65}45%{r:${s*0.72};opacity:0}100%{r:${s*0.38};opacity:0}}
        </style>
        ${pulse}
        <circle cx="${s/2}" cy="${s/2}" r="${s*0.38}" fill="${cfg.color}" stroke="white" stroke-width="2.5"
            style="filter:drop-shadow(0 2px 5px ${cfg.color}88);"/>
        ${inner}
    </svg>`;
    return L.divIcon({ html: svg, className: '', iconSize: [s, s], iconAnchor: [s/2, s/2], popupAnchor: [0, -s/2] });
};

const makeUserIcon = () => {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 36 36">
        <circle cx="18" cy="18" r="14" fill="${T.primary}" stroke="white" stroke-width="3" style="filter: drop-shadow(0 0 6px ${T.primary});"/>
        <circle cx="18" cy="18" r="5" fill="white" />
    </svg>`;
    return L.divIcon({ html: svg, className: '', iconSize: [36, 36], iconAnchor: [18, 18], popupAnchor: [0, -18] });
};

/* ─────────────────────────────────────────────────────────────
   MAP CONTROLLER — handles flyTo / fitBounds imperatively
───────────────────────────────────────────────────────────── */
const MapController = ({ target }) => {
    const map = useMap();
    useEffect(() => {
        if (!target) return;
        if (target.bounds) {
            map.flyToBounds(target.bounds, { duration: 1.0, padding: [50, 50], maxZoom: 13 });
        } else if (target.center) {
            map.flyTo(target.center, target.zoom ?? 11, { duration: 1.0 });
        }
    }, [target, map]);
    return null;
};

/* ─────────────────────────────────────────────────────────────
   STATUS SUMMARY MINI-ROW
───────────────────────────────────────────────────────────── */
const StatusRow = ({ screens }) => {
    const { t } = useTranslation();
    const counts = { online: 0, broken: 0, maintenance: 0, disconnected: 0 };
    screens.forEach(s => { const st = deriveStatus(s); counts[st] = (counts[st] || 0) + 1; });
    return (
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '6px' }}>
            {Object.entries(STATUS).map(([key, cfg]) => counts[key] > 0 && (
                <span key={key} style={{
                    display: 'inline-flex', alignItems: 'center', gap: '4px',
                    padding: '3px 9px', borderRadius: 99,
                    background: cfg.light, color: cfg.color,
                    fontSize: '11px', fontWeight: 700,
                }}>
                    <span style={{ width: 7, height: 7, borderRadius: '50%', background: cfg.color }} />
                    {t('dashboard.status_' + key)}: {counts[key]}
                </span>
            ))}
        </div>
    );
};

/* ─────────────────────────────────────────────────────────────
   BREADCRUMB
───────────────────────────────────────────────────────────── */
const Breadcrumb = ({ crumbs, onNavigate }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap', padding: '10px 14px', background: T.surface, borderBottom: `1px solid ${T.border}` }}>
        {crumbs.map((c, i) => (
            <React.Fragment key={i}>
                {i > 0 && <ChevronLeft style={{ width: 12, height: 12, color: T.muted, flexShrink: 0 }} />}
                <button
                    onClick={() => onNavigate(i)}
                    style={{
                        background: 'none', border: 'none', cursor: i === crumbs.length - 1 ? 'default' : 'pointer',
                        fontSize: '12px', fontWeight: i === crumbs.length - 1 ? 800 : 600,
                        color: i === crumbs.length - 1 ? T.text : T.primary,
                        padding: '2px 4px', borderRadius: '6px',
                        textDecoration: i < crumbs.length - 1 ? 'underline' : 'none',
                    }}
                >{c.label}</button>
            </React.Fragment>
        ))}
    </div>
);

/* ─────────────────────────────────────────────────────────────
   SCREEN INFO CARD (shown in right panel)
───────────────────────────────────────────────────────────── */
const ScreenCard = ({ screen }) => {
    const { t } = useTranslation();
    const st = deriveStatus(screen);
    const cfg = STATUS[st];
    const hb = screen.last_heartbeat ? new Date(screen.last_heartbeat) : null;
    const mins = hb ? Math.round((Date.now() - hb.getTime()) / 60000) : null;
    const lastSeen = mins === null ? t('dashboard.last_seen_unknown') : mins < 1 ? t('dashboard.last_seen_now') : mins < 60 ? t('dashboard.last_seen_mins', { mins }) : t('dashboard.last_seen_hours', { hours: Math.round(mins / 60) });

    return (
        <div style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            padding: '10px 12px', borderRadius: '10px',
            background: T.bg, border: `1px solid ${T.border}`,
            marginBottom: '6px', cursor: 'default',
        }}>
            <div style={{ width: 32, height: 32, borderRadius: '8px', background: cfg.light, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Monitor style={{ width: 15, height: 15, color: cfg.color }} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ margin: 0, fontSize: '12px', fontWeight: 700, color: T.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{screen.name}</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
                    <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: '4px',
                        fontSize: '10px', fontWeight: 700, color: cfg.color,
                    }}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: cfg.color }} />
                        {t('dashboard.status_' + st)}
                    </span>
                    <span style={{ fontSize: '9px', color: T.muted }}>• {lastSeen}</span>
                </div>
            </div>
            
            {/* Navigation Button for Technicians (Native) */}
            <button 
                onClick={() => window.startAppTracking && window.startAppTracking(screen)}
                title={t('dashboard.track_route_title')}
                style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    width: 32, height: 32, borderRadius: '8px', flexShrink: 0, cursor: 'pointer',
                    background: (st === 'broken' || st === 'maintenance') ? T.primary : T.surface,
                    color: (st === 'broken' || st === 'maintenance') ? '#fff' : T.primary,
                    border: `1px solid ${(st === 'broken' || st === 'maintenance') ? 'transparent' : T.border}`,
                    boxShadow: (st === 'broken' || st === 'maintenance') ? '0 2px 6px rgba(37,99,235,0.3)' : 'none',
                }}
            >
                <Navigation style={{ width: 14, height: 14 }} />
            </button>
        </div>
    );
};

/* ═══════════════════════════════════════════════════════════════
   MAIN COMPONENT: DrillDownMap
═══════════════════════════════════════════════════════════════ */
const DrillDownMap = ({ allScreens = [], onStartMaintenance }) => {
    const { t } = useTranslation();
    /* Levels: 'country' | 'gov' | 'region' | 'street' */
    const [level, setLevel] = useState('country');
    const [govs, setGovs] = useState([]);
    const [regions, setRegions] = useState([]);
    const [streets, setStreets] = useState([]);
    const [selectedGov, setSelectedGov] = useState(null);
    const [selectedRegion, setSelectedRegion] = useState(null);
    const [selectedStreet, setSelectedStreet] = useState(null);
    const [mapTarget, setMapTarget] = useState(null);
    const [loading, setLoading] = useState(true);
    const [routeState, setRouteState] = useState(null);
    const [trackingState, setTrackingState] = useState({ loading: false, screenId: null });

    /* Normalize database screens to ensure they have lat/lng or filter them out if missing */
    const normalizedScreens = allScreens.map(scr => ({
        ...scr,
        lat: scr.latitude ?? scr.lat ?? null,
        lng: scr.longitude ?? scr.lng ?? null,
    })).filter(scr => scr.lat && scr.lng);

    /* Use API data directly */
    const screens = normalizedScreens;

    /* Load governorates */
    useEffect(() => {
        const load = async () => {
            try {
                const r = await axiosClient.get(ENDPOINTS.LOOKUPS.GOVERNORATES);
                const data = Array.isArray(r.data) ? r.data : [];
                
                const enriched = data.map(g => {
                    return { ...g, lat: g.latitude ?? g.lat ?? null, lng: g.longitude ?? g.lng ?? null };
                });
                setGovs(enriched);
            } catch {
                setGovs([]);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    /* Load regions when gov selected */
    useEffect(() => {
        if (!selectedGov) return;
        const load = async () => {
            try {
                const r = await axiosClient.get(ENDPOINTS.LOOKUPS.REGIONS_BY_GOV(selectedGov.gov_id));
                const data = Array.isArray(r.data) ? r.data : [];
                setRegions(data);
            } catch { setRegions([]); }
        };
        load();
    }, [selectedGov]);

    /* Load streets when region selected */
    useEffect(() => {
        if (!selectedRegion) return;
        const load = async () => {
            try {
                const r = await axiosClient.get(ENDPOINTS.LOOKUPS.STREETS_BY_REGION(selectedRegion.region_id));
                const data = Array.isArray(r.data) ? r.data : [];
                setStreets(data);
            } catch { setStreets([]); }
        };
        load();
    }, [selectedRegion]);

    /* Screens filtered by current level */
    const screensAtLevel = useCallback(() => {
        if (level === 'country') return screens;
        if (level === 'gov') return screens.filter(s => s.gov_id === selectedGov?.gov_id);
        if (level === 'region') return screens.filter(s => s.region_id === selectedRegion?.region_id || s.gov_id === selectedGov?.gov_id);
        if (level === 'street') return screens.filter(s => s.street_id === selectedStreet?.street_id || s.gov_id === selectedGov?.gov_id);
        return screens;
    }, [level, screens, selectedGov, selectedRegion, selectedStreet]);

    /* ── TRACKING SYSTEM (OSRM) ── */
    const cancelTracking = () => {
        setRouteState(null);
        setTrackingState({ loading: false, screenId: null });
    };

    const startTracking = useCallback((scr) => {
        if (!navigator.geolocation) {
            alert(t('dashboard.gps_not_supported'));
            return;
        }
        setTrackingState({ loading: true, screenId: scr.id });
        
        navigator.geolocation.getCurrentPosition(async (pos) => {
            let userLat = pos.coords.latitude;
            let userLng = pos.coords.longitude;
            
            /* Fallback for Testing/Demo: If outside Yemen, simulate location near the screen */
            if (userLat < 12 || userLat > 19 || userLng < 42 || userLng > 54) {
                userLat = scr.lat - 0.05;
                userLng = scr.lng - 0.05;
            }

            try {
                // Call public OSRM mapping
                const res = await fetch(`https://router.project-osrm.org/route/v1/driving/${userLng},${userLat};${scr.lng},${scr.lat}?geometries=geojson&overview=full`);
                const data = await res.json();
                
                if (data.routes && data.routes.length > 0) {
                    const coords = data.routes[0].geometry.coordinates.map(c => [c[1], c[0]]);
                    setRouteState({
                        active: true,
                        path: coords,
                        userLoc: [userLat, userLng],
                        targetScr: scr,
                        distance: (data.routes[0].distance / 1000).toFixed(1),
                        duration: Math.round(data.routes[0].duration / 60)
                    });
                    // Zoom bounding box to show route properly
                    const latBounds = [Math.min(userLat, scr.lat), Math.max(userLat, scr.lat)];
                    const lngBounds = [Math.min(userLng, scr.lng), Math.max(userLng, scr.lng)];
                    setMapTarget({ bounds: [[latBounds[0], lngBounds[0]], [latBounds[1], lngBounds[1]]] });
                } else {
                    alert(t('dashboard.no_route_found'));
                }
            } catch (err) {
                alert(t('dashboard.route_error'));
            } finally {
                setTrackingState({ loading: false, screenId: null });
            }
        }, (err) => {
            alert(t('dashboard.gps_permission_needed'));
            setTrackingState({ loading: false, screenId: null });
        }, { enableHighAccuracy: true });
    }, []);

    // Provide to children if needed via global/props (Hacky bypass but works for ScreenCard out of direct scoop)
    useEffect(() => {
        window.startAppTracking = startTracking;
        return () => { delete window.startAppTracking; };
    }, [startTracking]);

    /* ── HANDLERS ── */
    const handleGovClick = (gov) => {
        setSelectedGov(gov);
        setSelectedRegion(null);
        setSelectedStreet(null);
        setLevel('gov');
        const center = govCenter(gov.name);
        const b = GOV_BOUNDS[gov.name];
        setMapTarget(b
            ? { bounds: [[b[0], b[1]], [b[2], b[3]]] }
            : { center: gov.lat && gov.lng ? [gov.lat, gov.lng] : center, zoom: 11 }
        );
    };

    const handleRegionClick = (region) => {
        setSelectedRegion(region);
        setSelectedStreet(null);
        setLevel('region');
        /* Region has lat/lng from DB if stored, otherwise zoom to center of gov */
        const fallbackCenter = govCenter(selectedGov?.name);
        setMapTarget({ center: region.lat && region.lng ? [region.lat, region.lng] : fallbackCenter, zoom: 13 });
    };

    const handleStreetClick = (street) => {
        setSelectedStreet(street);
        setLevel('street');
        const fallbackCenter = govCenter(selectedGov?.name);
        setMapTarget({ center: street.lat && street.lng ? [street.lat, street.lng] : fallbackCenter, zoom: 15 });
    };

    /* ── BREADCRUMB NAVIGATION ── */
    const crumbs = [{ label: t('dashboard.yemen') }];
    if (selectedGov)    crumbs.push({ label: selectedGov.name });
    if (selectedRegion) crumbs.push({ label: selectedRegion.name });
    if (selectedStreet) crumbs.push({ label: selectedStreet.name });

    const navigateToCrumb = (idx) => {
        if (idx === 0) { setLevel('country'); setSelectedGov(null); setSelectedRegion(null); setSelectedStreet(null); setMapTarget({ center: [15.5, 48.0], zoom: 6 }); }
        else if (idx === 1) { setLevel('gov'); setSelectedRegion(null); setSelectedStreet(null); handleGovClick(selectedGov); }
        else if (idx === 2) { setLevel('region'); setSelectedStreet(null); handleRegionClick(selectedRegion); }
    };

    const currentScreens = screensAtLevel();
    const countsByStatus = { online: 0, broken: 0, maintenance: 0, disconnected: 0 };
    currentScreens.forEach(s => { const st = deriveStatus(s); countsByStatus[st]++; });

    /* Right-panel list: at country level show govs, else show screens */
    const panelTitle = level === 'country' ? t('dashboard.governorates') : level === 'gov' ? t('dashboard.areas') : level === 'region' ? t('dashboard.streets') : t('dashboard.screens_level');
    const panelItems = level === 'country' ? govs
        : level === 'gov' ? regions
        : level === 'region' ? streets
        : currentScreens;

    return (
        <div style={{
            background: T.bg,
            border: `1px solid ${T.border}`,
            borderRadius: '16px',
            overflow: 'hidden',
            marginBottom: '24px',
            direction: 'rtl',
            fontFamily: "'IBM Plex Sans Arabic', sans-serif",
        }}>
            {/* Leaflet popup & Route animation CSS override */}
            <style>{`
                .dd-map .leaflet-popup-content-wrapper {
                    direction: rtl; font-family: 'IBM Plex Sans Arabic', sans-serif;
                    border-radius: 12px !important; box-shadow: 0 8px 28px rgba(0,0,0,.18) !important;
                    border:none !important; padding:0 !important; overflow:hidden;
                }
                .dd-map .leaflet-popup-content { margin:0 !important; width:auto !important; }
                .dd-map .leaflet-popup-tip-container { display:none; }
                .dd-map .leaflet-tile { filter: grayscale(.1) brightness(.98); }
                .dd-map .leaflet-control-zoom { right: auto; left: 12px; top: 12px; }
                
                .route-path-animated {
                    animation: dashMove 2s linear infinite;
                }
                @keyframes dashMove {
                    from { stroke-dashoffset: 24; }
                    to { stroke-dashoffset: 0; }
                }
            `}</style>

            {/* ── Header ── */}
            <div style={{ padding: '14px 18px', borderBottom: `1px solid ${T.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <MapPin style={{ width: 16, height: 16, color: T.primary }} />
                    <span style={{ fontSize: '14px', fontWeight: 800, color: T.text }}>{t('dashboard.interactive_map_title')}</span>
                    <span style={{ fontSize: '10px', color: T.muted, background: T.surface, padding: '2px 8px', borderRadius: 99 }}>
                        {level === 'country' ? t('dashboard.click_gov_to_enter') : level === 'gov' ? t('dashboard.click_area_for_more') : level === 'region' ? t('dashboard.click_street_for_details') : t('dashboard.screens_level')}
                    </span>
                </div>

                {/* Status pills */}
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {Object.entries(STATUS).map(([key, cfg]) => (
                        <span key={key} style={{
                            display: 'inline-flex', alignItems: 'center', gap: '4px',
                            padding: '4px 10px', borderRadius: 99,
                            background: cfg.light, color: cfg.color,
                            fontSize: '11px', fontWeight: 700,
                        }}>
                            <span style={{ width: 7, height: 7, borderRadius: '50%', background: cfg.color }} />
                            {t('dashboard.status_' + key)}: {countsByStatus[key]}
                        </span>
                    ))}
                </div>
            </div>

            {/* ── Active Tracking Banner ── */}
            <AnimatePresence>
                {routeState && routeState.active && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} style={{ overflow: 'hidden' }}>
                        <div style={{ background: T.primary, color: '#fff', padding: '10px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <Navigation style={{ width: 16, height: 16, animation: 'pulse 1.5s infinite' }} />
                                <div>
                                    <p style={{ margin: 0, fontSize: '12px', fontWeight: 700 }}>{t('dashboard.direct_route_to', { name: routeState.targetScr?.name })}</p>
                                    <p style={{ margin: '2px 0 0', fontSize: '10px', opacity: 0.9 }}>{t('dashboard.distance_time', { dist: routeState.distance, dur: routeState.duration })}</p>
                                </div>
                            </div>
                            <button onClick={cancelTracking} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff', padding: '6px 12px', borderRadius: '6px', fontSize: '11px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <X style={{ width: 14, height: 14 }} /> {t('dashboard.exit_route')}
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Breadcrumb ── */}
            <Breadcrumb crumbs={crumbs} onNavigate={navigateToCrumb} />

            {/* ── Map + Side Panel ── */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 260px' }}>

                {/* MAP */}
                <div style={{ height: '440px', position: 'relative' }} className="dd-map">
                    <MapContainer
                        center={[15.5, 48.0]}
                        zoom={6}
                        style={{ height: '100%', width: '100%' }}
                        zoomControl={true}
                        scrollWheelZoom={true}
                        attributionControl={false}
                    >
                        <TileLayer 
                            url="https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}" 
                            attribution='&copy; <a href="https://maps.google.com">Google Maps</a>'
                        />
                        <MapController target={mapTarget} />

                        {/* ─ ROUTE PATH Overlay ─ */}
                        {routeState && routeState.active && (
                            <>
                                <Polyline 
                                    positions={routeState.path} 
                                    pathOptions={{ color: T.primary, weight: 5, dashArray: '12, 12', className: 'route-path-animated' }} 
                                />
                                <Marker position={routeState.userLoc} icon={makeUserIcon()}>
                                    <Popup><div style={{ direction: 'rtl', fontFamily: "'IBM Plex Sans Arabic', sans-serif", fontSize: '12px', fontWeight: 700, padding: '4px' }}>موقعك (المهندس)</div></Popup>
                                </Marker>
                            </>
                        )}

                        {/* ─ SHOW ALL SCREENS FOR CURRENT LEVEL ALWAYS ─ */}
                        {currentScreens.map(scr => (
                                <Marker key={scr.id} position={[scr.lat, scr.lng]}
                                    icon={makeScreenIcon(deriveStatus(scr))}
                                >
                                    <Popup>
                                        <div style={{ padding: '14px 16px', minWidth: '190px', direction: 'rtl', fontFamily: "'IBM Plex Sans Arabic', sans-serif" }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                                                <div style={{ width: 34, height: 34, borderRadius: '9px', background: STATUS[deriveStatus(scr)]?.light, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                    <Monitor style={{ width: 16, height: 16, color: STATUS[deriveStatus(scr)]?.color }} />
                                                </div>
                                                <div>
                                                    <p style={{ margin: 0, fontSize: '13px', fontWeight: 800, color: T.text }}>{scr.name}</p>
                                                    <span style={{
                                                        display: 'inline-flex', alignItems: 'center', gap: '4px',
                                                        fontSize: '11px', fontWeight: 700,
                                                        color: STATUS[deriveStatus(scr)]?.color,
                                                    }}>
                                                        <span style={{ width: 7, height: 7, borderRadius: '50%', background: STATUS[deriveStatus(scr)]?.color }} />
                                                        {t('dashboard.status_' + deriveStatus(scr))}
                                                    </span>
                                                </div>
                                            </div>
                                            {/* Last heartbeat note */}
                                            {deriveStatus(scr) === 'maintenance' && (
                                                <div style={{ padding: '6px 10px', borderRadius: '8px', background: T.maintL, fontSize: '11px', color: T.maint, fontWeight: 600 }}>
                                                    🔧 قيد الصيانة — فُعِّلت يدوياً
                                                </div>
                                            )}
                                            {deriveStatus(scr) === 'disconnected' && (
                                                <div style={{ padding: '6px 10px', borderRadius: '8px', background: T.discL, fontSize: '11px', color: T.disc, fontWeight: 600 }}>
                                                    ⚫ مفصولة — لا إشارة
                                                </div>
                                            )}
                                            {deriveStatus(scr) === 'broken' && (
                                                <div style={{ padding: '6px 10px', borderRadius: '8px', background: T.brokenL, fontSize: '11px', color: T.broken, fontWeight: 600 }}>
                                                    🔴 عطل — انقطع الاتصال فجأة
                                                </div>
                                            )}

                                            {/* Dispatch Action (Native App Tracker) */}
                                            <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: `1px solid ${T.border}`, display: 'flex', gap: '8px' }}>
                                                <button
                                                    onClick={() => startTracking(scr)}
                                                    disabled={trackingState.loading}
                                                    style={{
                                                        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                                                        padding: '8px', borderRadius: '8px', border: 'none', cursor: trackingState.loading ? 'wait' : 'pointer',
                                                        background: T.primary, color: '#fff', fontSize: '12px', fontWeight: 700,
                                                        boxShadow: '0 2px 8px rgba(37,99,235,0.25)', opacity: trackingState.loading ? 0.7 : 1, transition: 'all 0.15s'
                                                    }}
                                                >
                                                    {trackingState.loading && trackingState.screenId === scr.id ? (
                                                        <Loader2 style={{ width: 14, height: 14, animation: 'spin 1s linear infinite' }} />
                                                    ) : (
                                                        <Navigation style={{ width: 14, height: 14 }} />
                                                    )}
                                                    {trackingState.loading && trackingState.screenId === scr.id ? 'جاري...' : 'تتبع المسار'}
                                                </button>
                                                
                                                {deriveStatus(scr) === 'broken' && (
                                                    <button
                                                        onClick={() => {
                                                            if (window.confirm('هل أنت متأكد من وصولك والبدء في صيانة هذه الشاشة؟')) {
                                                                if (onStartMaintenance) onStartMaintenance(scr);
                                                            }
                                                        }}
                                                        style={{
                                                            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px',
                                                            padding: '8px', borderRadius: '8px', border: 'none', cursor: 'pointer',
                                                            background: T.maint, color: '#fff', fontSize: '11px', fontWeight: 700,
                                                            boxShadow: '0 2px 8px rgba(217,119,6,0.25)'
                                                        }}
                                                    >
                                                        <Wrench style={{ width: 13, height: 13 }} />
                                                        بدء الصيانة
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </Popup>
                                </Marker>
                            ))
                        }
                    </MapContainer>

                    {/* Loading overlay */}
                    {loading && (
                        <div style={{
                            position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.7)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
                        }}>
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ width: 32, height: 32, border: `3px solid ${T.primary}`, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 8px' }} />
                                <p style={{ fontSize: '13px', color: T.muted, fontWeight: 600 }}>جاري تحميل الخريطة...</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* ─ SIDE PANEL ─ */}
                <div style={{
                    borderRight: `1px solid ${T.border}`,
                    display: 'flex', flexDirection: 'column',
                    height: '440px', background: T.surface,
                }}>
                    {/* Panel header */}
                    <div style={{ padding: '12px 14px', borderBottom: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {level === 'country' && <Globe style={{ width: 14, height: 14, color: T.primary }} />}
                        {level === 'gov'     && <MapIcon style={{ width: 14, height: 14, color: T.primary }} />}
                        {level === 'region'  && <Navigation style={{ width: 14, height: 14, color: T.primary }} />}
                        {level === 'street'  && <Monitor style={{ width: 14, height: 14, color: T.primary }} />}
                        <span style={{ fontSize: '12px', fontWeight: 800, color: T.text }}>{panelTitle}</span>
                        <span style={{ marginRight: 'auto', fontSize: '11px', color: T.muted, background: T.bg, padding: '2px 8px', borderRadius: 99, border: `1px solid ${T.border}` }}>
                            {panelItems.length}
                        </span>
                    </div>

                    {/* Panel list */}
                    <div style={{ flex: 1, overflowY: 'auto', padding: '10px 12px' }}>
                        {panelItems.length === 0 && (
                            <div style={{ textAlign: 'center', padding: '30px 16px', color: T.muted }}>
                                <MapPin style={{ width: 28, height: 28, opacity: 0.3, display: 'block', margin: '0 auto 8px' }} />
                                <p style={{ fontSize: '12px', fontWeight: 600 }}>لا توجد بيانات</p>
                            </div>
                        )}

                        {/* Country level → list of govs */}
                        {level === 'country' && govs.map(gov => {
                            const govScreens = screens.filter(s => s.gov_id === gov.gov_id);
                            const hasIssues = govScreens.some(s => deriveStatus(s) !== 'online');
                            return (
                                <div key={gov.gov_id}
                                    onClick={() => handleGovClick(gov)}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: '10px',
                                        padding: '9px 11px', marginBottom: '5px', borderRadius: '10px',
                                        background: T.bg, border: `1px solid ${T.border}`,
                                        cursor: 'pointer', transition: 'all 0.15s',
                                    }}
                                    onMouseEnter={e => { e.currentTarget.style.borderColor = T.primary; e.currentTarget.style.background = '#eff6ff'; }}
                                    onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.background = T.bg; }}
                                >
                                    <div style={{ width: 30, height: 30, borderRadius: '8px', background: hasIssues ? T.brokenL : '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                        <Globe style={{ width: 14, height: 14, color: hasIssues ? T.broken : T.primary }} />
                                    </div>
                                    <span style={{ flex: 1, fontSize: '12px', fontWeight: 700, color: T.text }}>{gov.name}</span>
                                    <span style={{ fontSize: '12px', fontWeight: 800, color: hasIssues ? T.broken : T.muted }}>{govScreens.length}</span>
                                    <ChevronLeft style={{ width: 12, height: 12, color: T.muted }} />
                                </div>
                            );
                        })}

                        {/* Gov level → list of regions */}
                        {level === 'gov' && (regions.length === 0 ? (
                            <div style={{ padding: '12px', borderRadius: '10px', background: '#eff6ff', border: `1px solid #bfdbfe`, marginBottom: '10px' }}>
                                <p style={{ margin: 0, fontSize: '11px', color: T.primary, fontWeight: 700 }}>💡 لا توجد مناطق مُسجلة لهذه المحافظة.</p>
                                <p style={{ margin: '4px 0 0', fontSize: '11px', color: T.muted }}>الشاشات معروضة مباشرة على الخريطة.</p>
                            </div>
                        ) : regions.map(reg => {
                            const regScreens = currentScreens.filter(s => s.region_id === reg.region_id);
                            return (
                                <div key={reg.region_id}
                                    onClick={() => handleRegionClick(reg)}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: '10px',
                                        padding: '9px 11px', marginBottom: '5px', borderRadius: '10px',
                                        background: T.bg, border: `1px solid ${T.border}`,
                                        cursor: 'pointer', transition: 'all 0.15s',
                                    }}
                                    onMouseEnter={e => { e.currentTarget.style.borderColor = T.primary; e.currentTarget.style.background = '#eff6ff'; }}
                                    onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.background = T.bg; }}
                                >
                                    <MapIcon style={{ width: 14, height: 14, color: T.primary, flexShrink: 0 }} />
                                    <span style={{ flex: 1, fontSize: '12px', fontWeight: 700, color: T.text }}>{reg.name}</span>
                                    {regScreens.length > 0 && <span style={{ fontSize: '11px', color: T.primary, fontWeight: 800 }}>{regScreens.length} شاشة</span>}
                                    <ChevronLeft style={{ width: 12, height: 12, color: T.muted }} />
                                </div>
                            );
                        }))}

                        {/* Region level → streets */}
                        {level === 'region' && (streets.length === 0 ? (
                            <div style={{ padding: '12px', borderRadius: '10px', background: '#f0fdf4', border: `1px solid #bbf7d0`, marginBottom: '10px' }}>
                                <p style={{ margin: 0, fontSize: '11px', color: T.online, fontWeight: 700 }}>💡 لا توجد شوارع مُسجلة لهذه المنطقة.</p>
                            </div>
                        ) : streets.map(st => {
                            const stScreens = currentScreens.filter(s => s.street_id === st.street_id);
                            return (
                                <div key={st.street_id}
                                    onClick={() => handleStreetClick(st)}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: '10px',
                                        padding: '9px 11px', marginBottom: '5px', borderRadius: '10px',
                                        background: T.bg, border: `1px solid ${T.border}`,
                                        cursor: 'pointer', transition: 'all 0.15s',
                                    }}
                                    onMouseEnter={e => { e.currentTarget.style.borderColor = T.primary; e.currentTarget.style.background = '#eff6ff'; }}
                                    onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.background = T.bg; }}
                                >
                                    <Navigation style={{ width: 14, height: 14, color: '#16a34a', flexShrink: 0 }} />
                                    <span style={{ flex: 1, fontSize: '12px', fontWeight: 700, color: T.text }}>{st.name}</span>
                                    {stScreens.length > 0 && <span style={{ fontSize: '11px', color: '#16a34a', fontWeight: 800 }}>{stScreens.length}</span>}
                                    <ChevronLeft style={{ width: 12, height: 12, color: T.muted }} />
                                </div>
                            );
                        }))}

                        {/* All deep levels + country: show screens */}
                        {(level !== 'country') && currentScreens.length > 0 && (
                            <>
                                <p style={{ margin: '10px 0 6px', fontSize: '11px', fontWeight: 800, color: T.muted }}>الشاشات في هذا المستوى:</p>
                                {currentScreens.map(scr => <ScreenCard key={scr.id} screen={scr} />)}
                            </>
                        )}
                    </div>

                    {/* Back button */}
                    {level !== 'country' && (
                        <div style={{ padding: '10px 12px', borderTop: `1px solid ${T.border}` }}>
                            <button
                                onClick={() => navigateToCrumb(crumbs.length - 2)}
                                style={{
                                    width: '100%', padding: '8px', borderRadius: '9px',
                                    background: T.bg, border: `1px solid ${T.border}`,
                                    color: T.primary, fontSize: '12px', fontWeight: 700, cursor: 'pointer',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                                }}
                            >
                                <ChevronLeft style={{ width: 13, height: 13, transform: 'rotate(180deg)' }} />
                                العودة للمستوى السابق
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* spin animation */}
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    );
};

export default DrillDownMap;
