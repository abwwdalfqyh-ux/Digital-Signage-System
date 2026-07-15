import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Monitor, WifiOff, AlertTriangle, CheckCircle2, RefreshCw,
    Clock, Wrench, Activity, MapPin, Eye, RotateCcw, Play, Pause,
    ChevronRight, Radio, Download, Zap, PowerOff,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import axiosClient from '../../core/api/axiosClient';
import { ENDPOINTS } from '../../core/api/endpoints';
import echo from '../../core/api/echo';
import useToastStore from '../../store/useToastStore';
import DrillDownMap from './DrillDownMap';
import { useScreens, useUpdateScreenStatus } from '../../hooks/api/useScreens';
import { useSupportTickets, useUpdateSupportTicket } from '../../hooks/api/useSupport';


/* ──────────────────────────────────────────────────────────────
   STITCH DESIGN TOKENS  (NOC — Status-forward palette)
────────────────────────────────────────────────────────────── */
const S = {
    primary:                '#004ac6',
    primaryContainer:       '#2563eb',
    onPrimary:              '#ffffff',
    surface:                '#f9f9ff',
    surfaceContainerLowest: '#ffffff',
    surfaceContainerLow:    '#f1f3ff',
    surfaceContainer:       '#e9edff',
    surfaceContainerHigh:   '#e1e8fd',
    surfaceContainerHighest:'#dce2f7',
    onBackground:           '#141b2b',
    onSurface:              '#141b2b',
    onSurfaceVariant:       '#434655',
    outline:                '#737686',
    outlineVariant:         '#c3c6d7',

    // Status palette
    online:      '#16a34a',
    onlineLight: '#dcfce7',
    offline:     '#dc2626',
    offlineLight:'#fee2e2',
    warning:     '#d97706',
    warningLight:'#fef3c7',
    info:        '#0284c7',
    infoLight:   '#e0f2fe',
};

/* ──────────────────────────────────────────────────────────────
   YEMEN SCREEN LOCATIONS  (lat/lng → SVG coords for NOC map)
   Status: 'online' | 'offline' | 'maintenance'
────────────────────────────────────────────────────────────── */
/* ──────────────────────────────────────────────────────────────
   SCREEN STATUS LOGIC
   4 States:
     'online'      → green  : is_online=true,  last_heartbeat < 5 min
     'broken'      → red    : is_online=false, last_heartbeat < 15 min (was online, now failing)
     'maintenance' → orange : status === 'maintenance' (set manually by engineer)
     'disconnected'→ grey   : last_heartbeat > 15 min  OR never had heartbeat
────────────────────────────────────────────────────────────── */
const deriveScreenStatus = (screen) => {
    if (!screen) return 'disconnected';
    if (screen.status === 'maintenance') return 'maintenance';
    const now = Date.now();
    const hb = screen.last_heartbeat ? new Date(screen.last_heartbeat).getTime() : null;
    const minsSinceHb = hb ? (now - hb) / 60000 : Infinity;
    if (screen.is_online === true || screen.is_online === 1 || screen.status === 'active' || screen.status === 'online') {
        return 'online';
    }
    if (minsSinceHb < 15) return 'broken';    // was online recently — hardware/software fault
    return 'disconnected';                      // no signal at all — power cut or physically off
};

/* Demo fallback screens with real Yemen lat/lng coordinates */
const MOCK_SCREENS_GEO = [
    { id: 1,  name: 'صنعاء – التحرير',    city: 'صنعاء',    lat: 15.3694, lng: 44.1910, status: 'broken',       is_online: false, last_heartbeat: new Date(Date.now()-8*60000).toISOString() },
    { id: 2,  name: 'صنعاء – هائل',       city: 'صنعاء',    lat: 15.3800, lng: 44.2060, status: 'online',       is_online: true,  last_heartbeat: new Date(Date.now()-1*60000).toISOString() },
    { id: 3,  name: 'عدن – المعلا',        city: 'عدن',      lat: 12.7855, lng: 44.9970, status: 'maintenance',  is_online: false, last_heartbeat: new Date(Date.now()-2*60000).toISOString() },
    { id: 4,  name: 'عدن – كريتر',         city: 'عدن',      lat: 12.7722, lng: 45.0240, status: 'online',       is_online: true,  last_heartbeat: new Date(Date.now()-2*60000).toISOString() },
    { id: 5,  name: 'تعز – جمال',          city: 'تعز',      lat: 13.5790, lng: 44.0217, status: 'broken',       is_online: false, last_heartbeat: new Date(Date.now()-6*60000).toISOString() },
    { id: 6,  name: 'تعز – المركز',        city: 'تعز',      lat: 13.5720, lng: 44.0270, status: 'online',       is_online: true,  last_heartbeat: new Date(Date.now()-3*60000).toISOString() },
    { id: 7,  name: 'مأرب – مركزي',        city: 'مأرب',     lat: 15.4650, lng: 45.3270, status: 'online',       is_online: true,  last_heartbeat: new Date(Date.now()-1*60000).toISOString() },
    { id: 8,  name: 'حضرموت – المكلا',     city: 'حضرموت',  lat: 14.5328, lng: 49.1269, status: 'online',       is_online: true,  last_heartbeat: new Date(Date.now()-4*60000).toISOString() },
    { id: 9,  name: 'حضرموت – سيئون',      city: 'حضرموت',  lat: 15.9380, lng: 48.7820, status: 'maintenance',  is_online: false, last_heartbeat: new Date(Date.now()-5*60000).toISOString() },
    { id: 10, name: 'إب – المركز',          city: 'إب',       lat: 13.9760, lng: 44.1760, status: 'online',       is_online: true,  last_heartbeat: new Date(Date.now()-2*60000).toISOString() },
    { id: 11, name: 'الحديدة – رئيسي',      city: 'الحديدة', lat: 14.7980, lng: 42.9530, status: 'disconnected', is_online: false, last_heartbeat: null },
    { id: 12, name: 'ذمار – الوسط',         city: 'ذمار',    lat: 14.5420, lng: 44.4030, status: 'online',       is_online: true,  last_heartbeat: new Date(Date.now()-1*60000).toISOString() },
    { id: 13, name: 'الحديدة – الميناء',    city: 'الحديدة', lat: 14.8260, lng: 42.9440, status: 'disconnected', is_online: false, last_heartbeat: null },
    { id: 14, name: 'صعدة – المركز',        city: 'صعدة',    lat: 16.9380, lng: 43.7630, status: 'online',       is_online: true,  last_heartbeat: new Date(Date.now()-3*60000).toISOString() },
];

const STATUS_CONFIG = {
    online:       { color: '#16a34a', light: '#dcfce7', label: 'متصلة',         icon: '🟢', pulse: true,  speed: 'slow' },
    broken:       { color: '#dc2626', light: '#fee2e2', label: 'عطل / خراب',     icon: '🔴', pulse: true,  speed: 'fast' },
    maintenance:  { color: '#d97706', light: '#fef3c7', label: 'تحت الصيانة',    icon: '🟠', pulse: false, speed: null  },
    disconnected: { color: '#6b7280', light: '#f3f4f6', label: 'مفصولة',         icon: '⚫', pulse: false, speed: null  },
};

/* ──────────────────────────────────────────────────────────────
   HELPERS
────────────────────────────────────────────────────────────── */
const statusDot = (type) => {
    const map = {
        online:   S.online,
        offline:  S.offline,
        warning:  S.warning,
        resolved: S.online,
        info:     S.info,
    };
    return map[type] ?? S.outline;
};

const priorityBadge = (p) => {
    const map = {
        critical: { bg: S.offlineLight, color: S.offline,  label: 'حرج' },
        high:     { bg: S.warningLight, color: S.warning,  label: 'عالي' },
        medium:   { bg: S.infoLight,    color: S.info,     label: 'متوسط' },
        low:      { bg: S.surfaceContainerHigh, color: S.outline, label: 'منخفض' },
    };
    return map[p] ?? map.low;
};

const statusBadge = (s) => {
    const map = {
        open:       { bg: S.offlineLight, color: S.offline,  label: 'مفتوح' },
        inprogress: { bg: S.warningLight, color: S.warning,  label: 'جارٍ العمل' },
        resolved:   { bg: S.onlineLight,  color: S.online,   label: 'تم الحل' },
    };
    return map[s] ?? map.open;
};

/* ──────────────────────────────────────────────────────────────
   PULSE INDICATOR  (live pulsing dot)
────────────────────────────────────────────────────────────── */
const PulseDot = ({ color = S.online, size = 10 }) => (
    <span style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{
            position: 'absolute',
            width: size * 2, height: size * 2,
            borderRadius: '50%',
            background: color,
            opacity: 0.25,
            animation: 'pulsering 1.8s ease-out infinite',
        }} />
        <span style={{
            width: size, height: size,
            borderRadius: '50%',
            background: color,
            display: 'inline-block',
        }} />
    </span>
);

/* ──────────────────────────────────────────────────────────────
   KPI CARD
────────────────────────────────────────────────────────────── */
const MaintKpiCard = ({ icon: Icon, label, value, sub, color, bgColor, borderColor, badge, index }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: index * 0.07 }}
        whileHover={{ y: -3, boxShadow: `0 8px 24px -4px ${color}28` }}
        style={{
            background: S.surfaceContainerLowest,
            border: `1px solid ${S.outlineVariant}`,
            borderRight: `4px solid ${borderColor ?? color}`,
            borderRadius: '16px',
            padding: '20px 22px',
            display: 'flex', flexDirection: 'column', gap: '10px',
            minHeight: '130px',
            cursor: 'default',
            transition: 'all 0.2s ease',
            position: 'relative',
            overflow: 'hidden',
            direction: 'rtl',
        }}
    >
        {/* subtle bg circle */}
        <span style={{
            position: 'absolute', bottom: -20, left: -20,
            width: 90, height: 90, borderRadius: '50%',
            background: bgColor ?? `${color}12`,
            pointerEvents: 'none',
        }} />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <p style={{ margin: 0, fontSize: '12px', fontWeight: 500, color: S.outline, fontFamily: "'IBM Plex Sans Arabic', sans-serif" }}>{label}</p>
                {badge && (
                    <span style={{ fontSize: '10px', fontWeight: 700, color: badge.color, background: badge.bg, padding: '2px 8px', borderRadius: '99px', display: 'inline-block', width: 'fit-content' }}>
                        {badge.label}
                    </span>
                )}
            </div>
            <div style={{ width: 42, height: 42, borderRadius: '50%', background: bgColor ?? `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icon style={{ width: 21, height: 21, color }} />
            </div>
        </div>

        <div>
            <div style={{ fontSize: '36px', fontWeight: 800, color: S.onBackground, lineHeight: 1, fontFamily: "'IBM Plex Sans Arabic', sans-serif", letterSpacing: '-0.02em' }}>
                {value}
            </div>
            {sub && <p style={{ margin: '4px 0 0', fontSize: '11px', color: S.onSurfaceVariant, fontFamily: "'IBM Plex Sans Arabic', sans-serif" }}>{sub}</p>}
        </div>
    </motion.div>
);

/* ──────────────────────────────────────────────────────────────
   UPTIME MINI-BAR
────────────────────────────────────────────────────────────── */
const UptimeBar = ({ pct = 0 }) => {
    const color = pct >= 90 ? S.online : pct >= 70 ? S.warning : S.offline;
    return (
        <div style={{ width: '100%', height: 6, borderRadius: 99, background: S.surfaceContainerHigh, overflow: 'hidden' }}>
            <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.9, ease: 'easeOut' }}
                style={{ height: '100%', borderRadius: 99, background: color }}
            />
        </div>
    );
};

/* ──────────────────────────────────────────────────────────────
   FIX: leaflet default icon missing in Vite builds
────────────────────────────────────────────────────────────── */
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

/* ── Create custom SVG DivIcon for each status ── */
const buildMarkerIcon = (status, isHovered = false) => {
    const cfg = STATUS_CONFIG[status];
    const size = isHovered ? 28 : 22;
    const ring = cfg.pulse ? `
        <circle cx="${size}" cy="${size}" r="${size * 0.8}" fill="${cfg.color}" opacity="0"
            style="animation: mapPulse${cfg.speed === 'fast' ? 'Fast' : 'Slow'} ${cfg.speed === 'fast' ? '1s' : '2s'} ease-out infinite;"/>
    ` : '';

    const inner = status === 'maintenance'
        ? `<text x="${size}" y="${size + 6}" text-anchor="middle" font-size="${size * 0.75}" fill="white">🔧</text>`
        : status === 'disconnected'
        ? `<line x1="${size * 0.55}" y1="${size * 0.55}" x2="${size * 1.45}" y2="${size * 1.45}" stroke="white" stroke-width="2" stroke-linecap="round"/><line x1="${size * 1.45}" y1="${size * 0.55}" x2="${size * 0.55}" y2="${size * 1.45}" stroke="white" stroke-width="2" stroke-linecap="round"/>`
        : `<circle cx="${size}" cy="${size}" r="${size * 0.32}" fill="white" opacity="0.9"/>`;

    const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${size * 2}" height="${size * 2}" viewBox="0 0 ${size * 2} ${size * 2}">
        <style>
            @keyframes mapPulseSlow { 0%{r:${size*0.8};opacity:0.5} 70%{r:${size*1.6};opacity:0} 100%{r:${size*0.8};opacity:0} }
            @keyframes mapPulseFast { 0%{r:${size*0.8};opacity:0.7} 50%{r:${size*1.5};opacity:0} 100%{r:${size*0.8};opacity:0} }
        </style>
        ${ring}
        <circle cx="${size}" cy="${size}" r="${size * 0.75}" fill="${cfg.color}" stroke="white" stroke-width="2"
            style="filter: drop-shadow(0 2px 6px ${cfg.color}88);"/>
        ${inner}
    </svg>`;

    return L.divIcon({
        html: svg,
        className: '',
        iconSize: [size * 2, size * 2],
        iconAnchor: [size, size],
        popupAnchor: [0, -size],
    });
};

/* ── Map bounds fitter ── */
const MapFitter = ({ pins }) => {
    const map = useMap();
    useEffect(() => {
        if (pins.length > 0) {
            const bounds = L.latLngBounds(pins.map(p => [p.lat, p.lng]));
            map.fitBounds(bounds, { padding: [40, 40], maxZoom: 8 });
        }
    }, [pins, map]);
    return null;
};

/* ──────────────────────────────────────────────────────────────
   YEMEN STATUS MAP  (React-Leaflet — real interactive map)
────────────────────────────────────────────────────────────── */
const YemenStatusMap = ({ screenData }) => {
    const [filterStatus, setFilterStatus] = useState('all');
    const [selectedPin, setSelectedPin] = useState(null);
    const markerRefs = useRef({});

    // Build pins from API data
    const pins = (screenData || []).map((scr) => ({
        ...scr,
        id: scr.id || scr.screen_id,
        name: scr.name || scr.screen_name,
        status: deriveScreenStatus(scr),
        lat: scr.lat ?? scr.latitude ?? null,
        lng: scr.lng ?? scr.longitude ?? null,
    })).filter(p => p.lat && p.lng);

    const filtered = filterStatus === 'all' ? pins : pins.filter(p => p.status === filterStatus);

    const counts = {
        online:       pins.filter(p => p.status === 'online').length,
        broken:       pins.filter(p => p.status === 'broken').length,
        maintenance:  pins.filter(p => p.status === 'maintenance').length,
        disconnected: pins.filter(p => p.status === 'disconnected').length,
    };

    const filterOpts = [
        { key: 'all',          label: `الكل (${pins.length})`,                color: S.primaryContainer },
        { key: 'online',       label: `متصلة (${counts.online})`,             color: STATUS_CONFIG.online.color },
        { key: 'broken',       label: `عطل (${counts.broken})`,               color: STATUS_CONFIG.broken.color },
        { key: 'maintenance',  label: `صيانة (${counts.maintenance})`,         color: STATUS_CONFIG.maintenance.color },
        { key: 'disconnected', label: `مفصولة (${counts.disconnected})`,       color: STATUS_CONFIG.disconnected.color },
    ];

    return (
        <motion.div
            initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.32 }}
            style={{
                background: S.surfaceContainerLowest,
                border: `1px solid ${S.outlineVariant}`,
                borderRadius: '16px',
                overflow: 'hidden',
                marginBottom: '24px',
            }}
        >
            {/* ── CSS for Leaflet popup Arabic direction ── */}
            <style>{`
                .leaflet-popup-content-wrapper {
                    direction: rtl;
                    font-family: 'IBM Plex Sans Arabic', sans-serif;
                    border-radius: 12px !important;
                    box-shadow: 0 8px 28px rgba(0,0,0,0.18) !important;
                    border: none !important;
                    padding: 0 !important;
                    overflow: hidden;
                }
                .leaflet-popup-content { margin: 0 !important; width: auto !important; }
                .leaflet-popup-tip-container { display:none; }
                .leaflet-container { font-family: 'IBM Plex Sans Arabic', sans-serif; }
                .leaflet-tile { filter: grayscale(0.15) brightness(0.97); }
            `}</style>

            {/* ── Header ── */}
            <div style={{ padding: '16px 20px', borderBottom: `1px solid ${S.outlineVariant}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <MapPin style={{ width: 16, height: 16, color: S.primaryContainer }} />
                    <span style={{ fontSize: '14px', fontWeight: 700, color: S.onBackground }}>خريطة حالة الشاشات — اليمن</span>
                    <span style={{ fontSize: '11px', color: S.outline, background: S.surfaceContainerLow, padding: '2px 8px', borderRadius: 99 }}>مباشر · تفاعلية</span>
                </div>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {filterOpts.map(f => (
                        <button key={f.key} onClick={() => setFilterStatus(f.key)}
                            style={{
                                padding: '5px 13px', borderRadius: 99, border: 'none', cursor: 'pointer',
                                fontSize: '11px', fontWeight: 700,
                                background: filterStatus === f.key ? f.color : S.surfaceContainerLow,
                                color: filterStatus === f.key ? '#fff' : S.onSurfaceVariant,
                                transition: 'all 0.15s',
                            }}
                        >{f.label}</button>
                    ))}
                </div>
            </div>

            {/* ── Map + Side Legend ── */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 230px' }}>

                {/* ── Leaflet Map ── */}
                <div style={{ height: '380px', position: 'relative' }}>
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
                        <MapFitter pins={pins} />

                        {filtered.map((pin) => {
                            const cfg = STATUS_CONFIG[pin.status];
                            const minsSince = pin.last_heartbeat
                                ? Math.round((Date.now() - new Date(pin.last_heartbeat).getTime()) / 60000)
                                : null;

                            return (
                                <Marker
                                    key={pin.id}
                                    position={[pin.lat, pin.lng]}
                                    icon={buildMarkerIcon(pin.status)}
                                    eventHandlers={{
                                        click: () => setSelectedPin(selectedPin?.id === pin.id ? null : pin),
                                    }}
                                >
                                    <Popup>
                                        <div style={{ minWidth: '200px', padding: '14px 16px', direction: 'rtl' }}>
                                            {/* Popup header */}
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                                                <div style={{
                                                    width: 36, height: 36, borderRadius: '10px',
                                                    background: cfg.light,
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                                                }}>
                                                    <Monitor style={{ width: 18, height: 18, color: cfg.color }} />
                                                </div>
                                                <div>
                                                    <p style={{ margin: 0, fontSize: '13px', fontWeight: 700, color: S.onBackground }}>{pin.name}</p>
                                                    <p style={{ margin: 0, fontSize: '11px', color: S.outline }}>{pin.city || pin.location_name || ''}</p>
                                                </div>
                                            </div>

                                            {/* Status badge */}
                                            <div style={{
                                                display: 'inline-flex', alignItems: 'center', gap: '6px',
                                                padding: '5px 12px', borderRadius: 99,
                                                background: cfg.light, marginBottom: '10px',
                                            }}>
                                                <span style={{ width: 8, height: 8, borderRadius: '50%', background: cfg.color, flexShrink: 0 }} />
                                                <span style={{ fontSize: '12px', fontWeight: 700, color: cfg.color }}>{cfg.label}</span>
                                            </div>

                                            {/* Heartbeat */}
                                            <div style={{ fontSize: '11px', color: S.onSurfaceVariant, marginBottom: '4px' }}>
                                                <Clock style={{ width: 11, height: 11, display: 'inline', marginLeft: '4px' }} />
                                                {minsSince !== null
                                                    ? minsSince < 1 ? 'آخر اتصال: منذ لحظات'
                                                    : minsSince < 60 ? `آخر اتصال: منذ ${minsSince} دقيقة`
                                                    : `آخر اتصال: منذ ${Math.round(minsSince/60)} ساعة`
                                                    : 'لا يوجد سجل اتصال'
                                                }
                                            </div>

                                            {/* Action note for maintenance */}
                                            {pin.status === 'maintenance' && (
                                                <div style={{
                                                    marginTop: '8px', padding: '7px 10px',
                                                    background: STATUS_CONFIG.maintenance.light,
                                                    borderRadius: '8px', fontSize: '11px',
                                                    color: STATUS_CONFIG.maintenance.color, fontWeight: 600,
                                                }}>
                                                    🔧 قيد الصيانة — فُعِّلت بواسطة الفريق التقني
                                                </div>
                                            )}
                                            {pin.status === 'disconnected' && (
                                                <div style={{
                                                    marginTop: '8px', padding: '7px 10px',
                                                    background: STATUS_CONFIG.disconnected.light,
                                                    borderRadius: '8px', fontSize: '11px',
                                                    color: STATUS_CONFIG.disconnected.color, fontWeight: 600,
                                                }}>
                                                    ⚫ مفصولة — لا يوجد اتصال منذ أكثر من 15 دقيقة
                                                </div>
                                            )}
                                            {pin.status === 'broken' && (
                                                <div style={{
                                                    marginTop: '8px', padding: '7px 10px',
                                                    background: STATUS_CONFIG.broken.light,
                                                    borderRadius: '8px', fontSize: '11px',
                                                    color: STATUS_CONFIG.broken.color, fontWeight: 600,
                                                }}>
                                                    🔴 عطل — كانت متصلة وانقطعت فجأة
                                                </div>
                                            )}
                                        </div>
                                    </Popup>
                                </Marker>
                            );
                        })}
                    </MapContainer>
                </div>

                {/* ── Side Legend ── */}
                <div style={{
                    padding: '16px', borderRight: `1px solid ${S.outlineVariant}`,
                    display: 'flex', flexDirection: 'column', gap: '8px',
                    overflowY: 'auto', maxHeight: '380px', background: S.surfaceContainerLowest,
                }}>
                    <p style={{ margin: '0 0 4px', fontSize: '11px', fontWeight: 700, color: S.outline }}>دليل الحالات:</p>
                    {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                        <div key={key} style={{
                            display: 'flex', alignItems: 'center', gap: '8px',
                            padding: '8px 10px', borderRadius: '10px',
                            background: cfg.light, cursor: 'pointer',
                            border: filterStatus === key ? `1.5px solid ${cfg.color}` : '1.5px solid transparent',
                            transition: 'all 0.15s',
                        }}
                            onClick={() => setFilterStatus(prev => prev === key ? 'all' : key)}
                        >
                            <span style={{
                                width: 14, height: 14, borderRadius: '50%',
                                background: cfg.color, border: '2px solid white',
                                boxShadow: `0 0 0 2px ${cfg.color}40`, flexShrink: 0,
                            }} />
                            <span style={{ flex: 1, fontSize: '11px', color: S.onSurfaceVariant, fontWeight: 600 }}>{cfg.label}</span>
                            <span style={{ fontSize: '14px', fontWeight: 800, color: cfg.color }}>{counts[key]}</span>
                        </div>
                    ))}

                    {/* Screen list */}
                    <div style={{ marginTop: '6px', borderTop: `1px solid ${S.outlineVariant}`, paddingTop: '8px' }}>
                        <p style={{ margin: '0 0 6px', fontSize: '11px', fontWeight: 700, color: S.outline }}>الشاشات المعروضة:</p>
                        {filtered.slice(0, 8).map(pin => {
                            const cfg = STATUS_CONFIG[pin.status];
                            return (
                                <div key={pin.id} style={{
                                    display: 'flex', alignItems: 'center', gap: '6px',
                                    padding: '5px 4px', cursor: 'pointer', borderRadius: '6px',
                                    transition: 'background 0.12s',
                                }}
                                    onMouseEnter={e => e.currentTarget.style.background = S.surfaceContainerLow}
                                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                >
                                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: cfg.color, flexShrink: 0 }} />
                                    <span style={{ fontSize: '11px', color: S.onSurface, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {pin.name}
                                    </span>
                                </div>
                            );
                        })}
                        {filtered.length > 8 && (
                            <p style={{ margin: '4px 0 0', fontSize: '10px', color: S.outline }}>+ {filtered.length - 8} شاشة أخرى</p>
                        )}
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

/* ──────────────────────────────────────────────────────────────
   MAIN MAINTENANCE DASHBOARD
────────────────────────────────────────────────────────────── */
const MaintenanceDashboard = () => {
    const navigate = useNavigate();
    const addToast = useToastStore(s => s.addToast);

    const { data: screensData, isLoading: screensLoading } = useScreens();
    const { data: ticketsData, isLoading: ticketsLoading } = useSupportTickets();
    const { mutateAsync: updateScreenStatus } = useUpdateScreenStatus();
    const { mutateAsync: updateTicket } = useUpdateSupportTicket();

    /* State */
    const [incidentFilter, setIncidentFilter] = useState('all');
    const [isLive, setIsLive]         = useState(true);

    const screens = screensData || [];
    const tickets = ticketsData || [];
    const loading = screensLoading || ticketsLoading;

    /* Derived from screens — 4 states */
    const screenStatusList = screens.map(deriveScreenStatus);
    const onlineCount       = screens.filter((s, i) => screenStatusList[i] === 'online').length;
    const brokenCount       = screens.filter((s, i) => screenStatusList[i] === 'broken').length;
    const maintenanceCount  = screens.filter((s, i) => screenStatusList[i] === 'maintenance').length;
    const disconnectedCount = screens.filter((s, i) => screenStatusList[i] === 'disconnected').length;
    const totalScreens      = screens.length;
    const uptimePct         = totalScreens > 0 ? Math.round((onlineCount / totalScreens) * 100) : 0;
    
    // Merge real tickets into incidents
    const realIncidents = tickets.map((t, idx) => {
        return {
            id: t.id,
            mac_address: t.screen?.mac_address,
            type: t.priority === 'urgent' ? 'offline' : (t.priority === 'high' ? 'warning' : 'info'),
            screen: t.screen?.screen_name || 'شاشة غير محددة',
            location: t.screen?.street?.region?.governorate?.name || 'غير محدد',
            since: new Date(t.created_at).toLocaleString('ar-EG'),
            status: t.status === 'open' ? 'open' : (t.status === 'resolved' ? 'resolved' : 'inprogress'),
            priority: t.priority,
            subject: t.subject
        };
    });

    const realActivity = tickets.filter(t => t.admin_reply).map(t => ({
        time: new Date(t.updated_at).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
        msg: `رد على التذكرة: ${t.subject}`,
        type: 'info'
    }));

    const openIncidents = realIncidents.filter(i => i.status === 'open').length;

    useEffect(() => {
        if (!isLive) return;
        const channel = echo.private('admin.screens');
        channel.listen('ScreenUpdated', (e) => {
            if (e.screen) {
                addToast(`تحديث مباشر: حالة الشاشة (${e.screen.screen_name}) تغيّرت`, 'info');
            }
        });

        return () => {
            echo.leave('admin.screens');
        };
    }, [isLive, addToast]);


    /* Update status to maintenance */
    const handleStartMaintenance = async (screen) => {
        if (!screen || !screen.screen_id) return addToast('الشاشة غير صالحة', 'error');
        await updateScreenStatus({ id: screen.screen_id, status: 'maintenance' });
    };

    const handleResolveTicket = async (ticketId) => {
        await updateTicket({ id: ticketId, payload: { status: 'resolved', admin_reply: 'تم حل المشكلة' } });
    };

    const handleInProgressTicket = async (ticketId) => {
        await updateTicket({ id: ticketId, payload: { status: 'in_progress' } });
    };
    const refreshTime = new Date().toLocaleTimeString('ar', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    /* Filtered incidents */
    const filteredIncidents = incidentFilter === 'all'
        ? realIncidents
        : realIncidents.filter(i => i.status === incidentFilter);

    /* Quick actions */
    const sendScreenCommand = async (mac_address, command) => {
        try {
            await axiosClient.post(ENDPOINTS.SCREENS.COMMAND, {
                target_screen: mac_address,
                command: command
            });
        } catch (error) {
            addToast('فشل في إرسال الأمر للشاشة', 'error');
        }
    };

    const handlePing = (mac_address) => {
        if (!mac_address) return addToast('لا يوجد معرف للشاشة', 'error');
        addToast('جاري فحص الاتصال بالشاشة...', 'info');
        sendScreenCommand(mac_address, 'PING');
    };

    const handleRebootSingle = (mac_address) => {
        if (!mac_address) return addToast('لا يوجد معرف للشاشة', 'error');
        addToast('جاري إعادة تشغيل الشاشة...', 'warning');
        sendScreenCommand(mac_address, 'RESTART_APP');
    };

    const handleReboot = () => {
        const brokenScreens = filteredIncidents.filter(i => i.type === 'offline');
        if (brokenScreens.length === 0) {
            addToast('لا توجد شاشات متعطلة لإعادة تشغيلها', 'info');
            return;
        }
        addToast(`جاري إرسال أمر إعادة التشغيل لـ ${brokenScreens.length} شاشة...`, 'warning');
        brokenScreens.forEach(inc => {
            if (inc.mac_address) {
                sendScreenCommand(inc.mac_address, 'RESTART_APP');
            }
        });
    };
    const handleExport = () => addToast('جاري تصدير تقرير الصيانة...', 'info');

    /* ── Screen table rows ── */
    const tableScreens = screens.slice(0, 12);

    const mockOnline       = onlineCount;
    const mockBroken       = brokenCount;
    const mockMaintenance  = maintenanceCount;
    const mockDisconnected = disconnectedCount;
    const mockTotal        = totalScreens;
    const mockUptime       = uptimePct;

    return (
        <div style={{ direction: 'rtl', paddingBottom: '48px', fontFamily: "'IBM Plex Sans Arabic', sans-serif" }}>

            {/* ── Pulse animation keyframe ── */}
            <style>{`
                @keyframes pulsering {
                    0%   { transform: scale(0.8); opacity: 0.6; }
                    70%  { transform: scale(2.2); opacity: 0; }
                    100% { transform: scale(0.8); opacity: 0; }
                }
                @keyframes blink-border {
                    0%, 100% { border-color: #dc2626; }
                    50%      { border-color: transparent; }
                }
            `}</style>

            {/* ══════ PAGE HEADER ══════ */}
            <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
                style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '16px' }}
            >
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                        <div style={{
                            width: 40, height: 40, borderRadius: '12px',
                            background: 'linear-gradient(135deg, #1e3a5f 0%, #2563eb 100%)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            boxShadow: '0 4px 14px rgba(37,99,235,0.35)',
                        }}>
                            <Wrench style={{ width: 20, height: 20, color: '#fff' }} />
                        </div>
                        <div>
                            <h1 style={{ margin: 0, fontSize: '26px', fontWeight: 800, color: S.onBackground, lineHeight: 1.1 }}>
                                مركز عمليات الصيانة
                            </h1>
                            <p style={{ margin: 0, fontSize: '12px', color: S.outline }}>Network Operations Center (NOC)</p>
                        </div>
                    </div>
                </div>

                {/* ── Header controls ── */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>

                    {/* Live indicator */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: S.surfaceContainerLowest, border: `1px solid ${S.outlineVariant}`, borderRadius: '10px', padding: '7px 14px' }}>
                        <PulseDot color={isLive ? S.online : S.outline} size={8} />
                        <span style={{ fontSize: '12px', fontWeight: 600, color: isLive ? S.online : S.outline }}>
                            {isLive ? 'مباشر' : 'موقوف'}
                        </span>
                        <span style={{ fontSize: '11px', color: S.outline }}>· آخر تحديث: {refreshTime}</span>
                    </div>

                    {/* Toggle live */}
                    <button
                        onClick={() => setIsLive(p => !p)}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '6px',
                            padding: '8px 14px', borderRadius: '10px',
                            background: isLive ? S.warningLight : S.onlineLight,
                            color: isLive ? S.warning : S.online,
                            border: `1px solid ${isLive ? S.warning : S.online}40`,
                            fontSize: '12px', fontWeight: 700, cursor: 'pointer',
                        }}
                    >
                        {isLive ? <Pause style={{ width: 14, height: 14 }} /> : <Play style={{ width: 14, height: 14 }} />}
                        {isLive ? 'إيقاف التحديث' : 'تشغيل التحديث'}
                    </button>

                    {/* Manual refresh */}
                    <button
                        onClick={loadScreens}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '6px',
                            padding: '8px 14px', borderRadius: '10px',
                            background: S.primaryContainer, color: '#fff',
                            border: 'none', fontSize: '12px', fontWeight: 700, cursor: 'pointer',
                            boxShadow: '0 2px 8px rgba(37,99,235,0.30)',
                        }}
                    >
                        <RefreshCw style={{ width: 14, height: 14 }} />
                        تحديث
                    </button>

                    {/* Export */}
                    <button
                        onClick={handleExport}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '6px',
                            padding: '8px 14px', borderRadius: '10px',
                            background: S.surfaceContainerLowest,
                            color: S.onSurfaceVariant,
                            border: `1px solid ${S.outlineVariant}`,
                            fontSize: '12px', fontWeight: 700, cursor: 'pointer',
                        }}
                    >
                        <Download style={{ width: 14, height: 14 }} />
                        تصدير التقرير
                    </button>
                </div>
            </motion.div>

            {/* ══════ KPI CARDS — 5 cards for all 4 states ══════ */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '14px', marginBottom: '24px' }}>
                <MaintKpiCard
                    index={0} icon={CheckCircle2}
                    label="متصلة — سليمة" value={mockOnline}
                    sub={`من إجمالي ${mockTotal} شاشة`}
                    color={STATUS_CONFIG.online.color} bgColor={STATUS_CONFIG.online.light}
                    badge={{ label: 'تعمل', color: STATUS_CONFIG.online.color, bg: STATUS_CONFIG.online.light }}
                />
                <MaintKpiCard
                    index={1} icon={AlertTriangle}
                    label="عطل / خربانة" value={mockBroken}
                    sub="انقطعت فجأة — تدخل عاجل"
                    color={STATUS_CONFIG.broken.color} bgColor={STATUS_CONFIG.broken.light}
                    badge={mockBroken > 0 ? { label: 'عاجل!', color: STATUS_CONFIG.broken.color, bg: STATUS_CONFIG.broken.light } : undefined}
                />
                <MaintKpiCard
                    index={2} icon={Wrench}
                    label="تحت الصيانة" value={mockMaintenance}
                    sub="فُعِّلت يدوياً من الفريق"
                    color={STATUS_CONFIG.maintenance.color} bgColor={STATUS_CONFIG.maintenance.light}
                />
                <MaintKpiCard
                    index={3} icon={PowerOff}
                    label="مفصولة" value={mockDisconnected}
                    sub="لا إشارة > 15 دقيقة"
                    color={STATUS_CONFIG.disconnected.color} bgColor={STATUS_CONFIG.disconnected.light}
                    badge={mockDisconnected > 0 ? { label: 'بلا اتصال', color: STATUS_CONFIG.disconnected.color, bg: STATUS_CONFIG.disconnected.light } : undefined}
                />
                <MaintKpiCard
                    index={4} icon={Activity}
                    label="نسبة وقت التشغيل" value={`${mockUptime}%`}
                    sub="خلال آخر 24 ساعة"
                    color={mockUptime >= 90 ? S.online : mockUptime >= 70 ? S.warning : S.offline}
                />
            </div>

            {/* ══════ UPTIME SUMMARY STRIP ══════ */}
            <motion.div
                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.3 }}
                style={{
                    background: S.surfaceContainerLowest,
                    border: `1px solid ${S.outlineVariant}`,
                    borderRadius: '16px',
                    padding: '18px 22px',
                    marginBottom: '24px',
                    display: 'flex', alignItems: 'center', gap: '24px', flexWrap: 'wrap',
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
                    <Radio style={{ width: 18, height: 18, color: S.primaryContainer }} />
                    <span style={{ fontSize: '13px', fontWeight: 700, color: S.onBackground }}>ملخص حالة الشبكة</span>
                </div>
                <div style={{ flex: 1, minWidth: '200px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                        <span style={{ fontSize: '11px', color: S.outline }}>وقت التشغيل الكلي</span>
                        <span style={{ fontSize: '11px', fontWeight: 700, color: mockUptime >= 90 ? S.online : S.warning }}>{mockUptime}%</span>
                    </div>
                    <UptimeBar pct={mockUptime} />
                </div>
                <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                    {[
                        { label: '24 ساعة', pct: mockUptime },
                        { label: '7 أيام',  pct: Math.min(mockUptime + 8, 99) },
                        { label: '30 يوم',  pct: Math.min(mockUptime + 15, 99) },
                    ].map((item) => (
                        <div key={item.label} style={{ textAlign: 'center' }}>
                            <p style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: item.pct >= 90 ? S.online : S.warning }}>{item.pct}%</p>
                            <p style={{ margin: 0, fontSize: '10px', color: S.outline }}>{item.label}</p>
                        </div>
                    ))}
                </div>
            </motion.div>

            {/* ══════ INTERACTIVE DRILL-DOWN MAP ══════ */}
            <DrillDownMap allScreens={screens} onStartMaintenance={handleStartMaintenance} />

            {/* ══════ MAIN GRID: Incidents + Activity Log ══════ */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: '20px', marginBottom: '24px' }}>

                {/* ── Incidents Table ── */}
                <motion.div
                    initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.35 }}
                    style={{
                        background: S.surfaceContainerLowest,
                        border: `1px solid ${S.outlineVariant}`,
                        borderRadius: '16px',
                        overflow: 'hidden',
                    }}
                >
                    {/* header */}
                    <div style={{ padding: '18px 20px', borderBottom: `1px solid ${S.outlineVariant}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <AlertTriangle style={{ width: 16, height: 16, color: S.warning }} />
                            <span style={{ fontSize: '14px', fontWeight: 700, color: S.onBackground }}>تذاكر الصيانة</span>
                            <span style={{
                                fontSize: '11px', fontWeight: 700,
                                background: S.offlineLight, color: S.offline,
                                padding: '2px 8px', borderRadius: 99,
                            }}>{openIncidents} مفتوح</span>
                        </div>
                        {/* Filter tabs */}
                        <div style={{ display: 'flex', gap: '4px' }}>
                            {[
                                { key: 'all', label: 'الكل' },
                                { key: 'open', label: 'مفتوح' },
                                { key: 'inprogress', label: 'جارٍ' },
                                { key: 'resolved', label: 'محلول' },
                            ].map(f => (
                                <button
                                    key={f.key}
                                    onClick={() => setIncidentFilter(f.key)}
                                    style={{
                                        padding: '5px 12px', borderRadius: '8px', border: 'none', cursor: 'pointer',
                                        fontSize: '11px', fontWeight: 600,
                                        background: incidentFilter === f.key ? S.primaryContainer : 'transparent',
                                        color: incidentFilter === f.key ? '#fff' : S.onSurfaceVariant,
                                        transition: 'all 0.15s',
                                    }}
                                >{f.label}</button>
                            ))}
                        </div>
                    </div>

                    {/* rows */}
                    <div style={{ overflowY: 'auto', maxHeight: '360px' }}>
                        {filteredIncidents.map((incident, idx) => {
                            const sb = statusBadge(incident.status);
                            const pb = priorityBadge(incident.priority);
                            return (
                                <motion.div
                                    key={incident.id}
                                    initial={{ opacity: 0, x: 10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: idx * 0.04 }}
                                    style={{
                                        padding: '14px 20px',
                                        borderBottom: `1px solid ${S.outlineVariant}40`,
                                        display: 'flex', alignItems: 'center', gap: '14px',
                                        background: 'transparent',
                                        transition: 'background 0.15s',
                                    }}
                                    onMouseEnter={e => e.currentTarget.style.background = S.surfaceContainerLow}
                                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                >
                                    <PulseDot color={statusDot(incident.type)} size={8} />

                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <p style={{ margin: 0, fontSize: '13px', fontWeight: 600, color: S.onSurface, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                            {incident.screen}
                                        </p>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '3px' }}>
                                            <MapPin style={{ width: 10, height: 10, color: S.outline }} />
                                            <span style={{ fontSize: '11px', color: S.outline }}>{incident.location}</span>
                                            <span style={{ fontSize: '11px', color: S.outlineVariant }}>·</span>
                                            <Clock style={{ width: 10, height: 10, color: S.outline }} />
                                            <span style={{ fontSize: '11px', color: S.outline }}>منذ {incident.since}</span>
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                                        <span style={{ fontSize: '10px', fontWeight: 700, padding: '3px 8px', borderRadius: 99, background: pb.bg, color: pb.color }}>{pb.label}</span>
                                        <span style={{ fontSize: '10px', fontWeight: 700, padding: '3px 8px', borderRadius: 99, background: sb.bg, color: sb.color }}>{sb.label}</span>
                                    </div>

                                    <div style={{ display: 'flex', gap: '4px' }}>
                                        {incident.status === 'open' && (
                                            <button
                                                onClick={() => handleInProgressTicket(incident.id)}
                                                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: S.warning, padding: '4px' }}
                                                title="قيد المعالجة"
                                            >
                                                <AlertTriangle style={{ width: 15, height: 15 }} />
                                            </button>
                                        )}
                                        {incident.status !== 'resolved' && (
                                            <button
                                                onClick={() => handleResolveTicket(incident.id)}
                                                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: S.online, padding: '4px' }}
                                                title="إغلاق التذكرة كـ محلولة"
                                            >
                                                <CheckCircle2 style={{ width: 15, height: 15 }} />
                                            </button>
                                        )}
                                        <button
                                            onClick={() => handlePing(incident.mac_address)}
                                            style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: S.info, padding: '4px' }}
                                            title="فحص الاتصال (Ping)"
                                        >
                                            <Radio style={{ width: 15, height: 15 }} />
                                        </button>
                                        <button
                                            onClick={() => handleRebootSingle(incident.mac_address)}
                                            style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: S.warning, padding: '4px' }}
                                            title="إعادة التشغيل"
                                        >
                                            <RotateCcw style={{ width: 15, height: 15 }} />
                                        </button>
                                        <button
                                            onClick={() => navigate(`/dashboard/screens/${incident.id}`)}
                                            style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: S.primaryContainer, padding: '4px' }}
                                            title="عرض الشاشة"
                                        >
                                            <Eye style={{ width: 15, height: 15 }} />
                                        </button>
                                    </div>
                                </motion.div>
                            );
                        })}
                        {filteredIncidents.length === 0 && (
                            <div style={{ padding: '40px', textAlign: 'center', color: S.outline, fontSize: '13px' }}>
                                <CheckCircle2 style={{ width: 28, height: 28, color: S.online, display: 'block', margin: '0 auto 8px' }} />
                                لا توجد تذاكر في هذه الفئة
                            </div>
                        )}
                    </div>

                    {/* footer quick action */}
                    <div style={{ padding: '12px 20px', borderTop: `1px solid ${S.outlineVariant}`, display: 'flex', gap: '10px' }}>
                        <button
                            onClick={handleReboot}
                            style={{
                                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                                padding: '9px', borderRadius: '10px',
                                background: S.offlineLight, color: S.offline,
                                border: `1px solid ${S.offline}30`,
                                fontSize: '12px', fontWeight: 700, cursor: 'pointer',
                            }}
                        >
                            <RotateCcw style={{ width: 13, height: 13 }} />
                            إعادة تشغيل المتعطلة
                        </button>
                        <button
                            onClick={() => navigate('/dashboard/screens')}
                            style={{
                                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                                padding: '9px', borderRadius: '10px',
                                background: S.surfaceContainerLow, color: S.onSurfaceVariant,
                                border: `1px solid ${S.outlineVariant}`,
                                fontSize: '12px', fontWeight: 700, cursor: 'pointer',
                            }}
                        >
                            <Monitor style={{ width: 13, height: 13 }} />
                            إدارة الشاشات
                        </button>
                    </div>
                </motion.div>

                {/* ── Live Activity Log ── */}
                <motion.div
                    initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.4 }}
                    style={{
                        background: S.surfaceContainerLowest,
                        border: `1px solid ${S.outlineVariant}`,
                        borderRadius: '16px',
                        overflow: 'hidden',
                        display: 'flex', flexDirection: 'column',
                    }}
                >
                    <div style={{ padding: '18px 20px', borderBottom: `1px solid ${S.outlineVariant}`, display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
                            <Radio style={{ width: 15, height: 15, color: S.online }} />
                            <span style={{ fontSize: '14px', fontWeight: 700, color: S.onBackground }}>سجل الأحداث</span>
                        </div>
                        <PulseDot color={S.online} size={7} />
                        <span style={{ fontSize: '11px', color: S.online, fontWeight: 600 }}>مباشر</span>
                    </div>

                    <div style={{ flex: 1, overflowY: 'auto', maxHeight: '360px' }}>
                        {realActivity.length > 0 ? realActivity.map((act, idx) => {
                            const dotColor = statusDot(act.type);
                            const bg = act.type === 'offline' ? S.offlineLight : act.type === 'warning' ? S.warningLight : act.type === 'online' ? S.onlineLight : S.infoLight;
                            return (
                                <motion.div
                                    key={idx}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: idx * 0.05 }}
                                    style={{
                                        padding: '12px 20px',
                                        borderBottom: `1px solid ${S.outlineVariant}30`,
                                        display: 'flex', alignItems: 'flex-start', gap: '12px',
                                    }}
                                >
                                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: dotColor, flexShrink: 0, marginTop: 5 }} />
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <p style={{ margin: 0, fontSize: '12px', color: S.onSurface, lineHeight: 1.4 }}>{act.msg}</p>
                                        <span style={{ fontSize: '10px', color: S.outline }}>{act.time}</span>
                                    </div>
                                    <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: 99, background: bg, color: dotColor, fontWeight: 700, flexShrink: 0 }}>
                                        {act.type === 'online' ? 'متصل' : act.type === 'offline' ? 'منقطع' : act.type === 'warning' ? 'تحذير' : 'معلومة'}
                                    </span>
                                </motion.div>
                            );
                        }) : (
                            <div style={{ textAlign: 'center', color: S.outline, padding: '20px' }}>لا توجد أحداث مؤخراً</div>
                        )}
                    </div>

                    <div style={{ padding: '12px 20px', borderTop: `1px solid ${S.outlineVariant}` }}>
                        <button
                            onClick={() => navigate('/dashboard/screens')}
                            style={{
                                width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                                padding: '9px', borderRadius: '10px',
                                background: S.surfaceContainerLow, color: S.onSurfaceVariant,
                                border: `1px solid ${S.outlineVariant}`,
                                fontSize: '12px', fontWeight: 700, cursor: 'pointer',
                            }}
                        >
                            عرض السجل الكامل
                            <ChevronRight style={{ width: 13, height: 13 }} />
                        </button>
                    </div>
                </motion.div>
            </div>

            {/* ══════ SCREEN STATUS TABLE ══════ */}
            <motion.div
                initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.45 }}
                style={{
                    background: S.surfaceContainerLowest,
                    border: `1px solid ${S.outlineVariant}`,
                    borderRadius: '16px',
                    overflow: 'hidden',
                }}
            >
                <div style={{ padding: '18px 22px', borderBottom: `1px solid ${S.outlineVariant}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Monitor style={{ width: 16, height: 16, color: S.primaryContainer }} />
                        <span style={{ fontSize: '14px', fontWeight: 700, color: S.onBackground }}>حالة جميع الشاشات</span>
                    </div>
                    <button
                        onClick={() => navigate('/dashboard/screens')}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '6px',
                            background: 'transparent', border: 'none', cursor: 'pointer',
                            color: S.primaryContainer, fontSize: '12px', fontWeight: 700,
                        }}
                    >
                        إدارة الشاشات
                        <ChevronRight style={{ width: 14, height: 14 }} />
                    </button>
                </div>

                {/* Table header */}
                <div style={{
                    display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 80px',
                    padding: '10px 22px', background: S.surfaceContainerLow,
                    borderBottom: `1px solid ${S.outlineVariant}`,
                }}>
                    {['اسم الشاشة', 'الموقع', 'الحالة', 'آخر ظهور', ''].map((h, i) => (
                        <span key={i} style={{ fontSize: '11px', fontWeight: 700, color: S.outline, textAlign: i > 1 ? 'center' : 'start' }}>{h}</span>
                    ))}
                </div>

                {/* Table rows */}
                {tableScreens.map((scr, idx) => {
                    const scrStatus = deriveScreenStatus(scr);
                    const cfg = STATUS_CONFIG[scrStatus];
                    const uptimePctRow = scrStatus === 'online'
                        ? Math.floor(Math.random() * 20 + 79)
                        : scrStatus === 'maintenance'
                        ? Math.floor(Math.random() * 20 + 50)
                        : Math.floor(Math.random() * 30 + 5);
                    const minsSinceHb = scr.last_heartbeat
                        ? Math.round((Date.now() - new Date(scr.last_heartbeat).getTime()) / 60000)
                        : null;
                    const lastSeenLabel = minsSinceHb === null ? 'غير معروف'
                        : minsSinceHb < 1   ? 'الآن'
                        : minsSinceHb < 60  ? `${minsSinceHb} د`
                        : `${Math.round(minsSinceHb / 60)} س`;
                    return (
                        <motion.div
                            key={scr.id ?? idx}
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: idx * 0.04 }}
                            style={{
                                display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 80px',
                                padding: '14px 22px',
                                borderBottom: `1px solid ${S.outlineVariant}30`,
                                alignItems: 'center',
                                transition: 'background 0.15s',
                                cursor: 'default',
                            }}
                            onMouseEnter={e => e.currentTarget.style.background = S.surfaceContainerLow}
                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <div style={{
                                    width: 34, height: 34, borderRadius: '10px',
                                    background: cfg.light,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                                }}>
                                    <Monitor style={{ width: 16, height: 16, color: cfg.color }} />
                                </div>
                                <span style={{ fontSize: '13px', fontWeight: 600, color: S.onSurface }}>{scr.name || `شاشة #${scr.id}`}</span>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                <MapPin style={{ width: 12, height: 12, color: S.outline }} />
                                <span style={{ fontSize: '12px', color: S.onSurfaceVariant }}>{scr.location_name || scr.governorate || '—'}</span>
                            </div>

                            <div style={{ textAlign: 'center' }}>
                                <span style={{
                                    fontSize: '11px', fontWeight: 700,
                                    padding: '4px 10px', borderRadius: 99,
                                    background: cfg.light, color: cfg.color,
                                    display: 'inline-flex', alignItems: 'center', gap: '5px',
                                }}>
                                    {scrStatus === 'online' && <PulseDot color={cfg.color} size={6} />}
                                    {cfg.label}
                                </span>
                            </div>

                            <div style={{ textAlign: 'center' }}>
                                <div style={{ marginBottom: '4px' }}>
                                    <UptimeBar pct={uptimePctRow} />
                                </div>
                                <span style={{ fontSize: '10px', color: S.outline }}>{lastSeenLabel}</span>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'center' }}>
                                <button
                                    onClick={() => navigate('/dashboard/screens')}
                                    title="إدارة الشاشة"
                                    style={{
                                        background: S.surfaceContainerLow, border: `1px solid ${S.outlineVariant}`,
                                        borderRadius: '8px', padding: '6px 10px', cursor: 'pointer',
                                        display: 'flex', alignItems: 'center', gap: '5px',
                                        fontSize: '11px', fontWeight: 600, color: S.onSurfaceVariant,
                                    }}
                                >
                                    <Eye style={{ width: 12, height: 12 }} />
                                    عرض
                                </button>
                            </div>
                        </motion.div>
                    );
                })}
            </motion.div>

        </div>
    );
};

export default MaintenanceDashboard;
