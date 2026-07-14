import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Monitor, PlayCircle, DollarSign, Users, AlertCircle, RefreshCw, Search, ChevronLeft, ChevronRight, TrendingUp, Info, CalendarDays, Plus, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axiosClient from '../../core/api/axiosClient';
import { ENDPOINTS } from '../../core/api/endpoints';
import { useAdminDashboard } from '../../hooks/api/useDashboard';
import useToastStore from '../../store/useToastStore';
import RecentPlaybackLogs from './components/RecentPlaybackLogs';

/* ─── Stitch colour tokens ─── */
const S = {
    primary: '#004ac6',
    primaryContainer: '#2563eb',
    onPrimaryContainer: '#eeefff',
    secondary: '#0060ac',
    secondaryFixed: '#d4e3ff',
    secondaryContainer: '#64a8fe',
    onSecondaryContainer: '#003c70',
    surface: '#f9f9ff',
    surfaceContainerLowest: '#ffffff',
    surfaceContainerLow: '#f1f3ff',
    surfaceContainer: '#e9edff',
    surfaceContainerHigh: '#e1e8fd',
    surfaceContainerHighest: '#dce2f7',
    onBackground: '#141b2b',
    onSurface: '#141b2b',
    onSurfaceVariant: '#434655',
    outline: '#737686',
    outlineVariant: '#c3c6d7',
    primaryFixed: '#dbe1ff',
    primaryFixedDim: '#b4c5ff',
    error: '#ba1a1a',
    errorContainer: '#ffdad6',
    onError: '#ffffff',
};

/* ── Gov chart colours ── */
const GOV_COLORS = [S.primaryContainer, S.secondaryContainer, S.secondaryFixed, '#adc6ff', '#64a8fe'];

/* ══════════════════════════════════════════════════════
   KPI CARD  — Stitch style
══════════════════════════════════════════════════════ */
const KpiCard = ({
    label, sublabel, value, valueSmall,
    note, noteIcon: NoteIcon, noteColor,
    accentColor, iconBg, iconColor, Icon,
    borderAccent, index,
}) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: index * 0.07 }}
        whileHover={{ y: -3, boxShadow: '0 8px 24px -4px rgba(0,74,198,0.14)' }}
        style={{
            background: S.surfaceContainerLowest,
            border: `1px solid ${S.outlineVariant}`,
            borderRadius: '16px',
            padding: '22px 22px 18px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            minHeight: '130px',
            cursor: 'default',
            transition: 'all 0.2s ease',
            position: 'relative',
            overflow: 'hidden',
            borderRight: borderAccent ? `4px solid ${borderAccent}` : `1px solid ${S.outlineVariant}`,
            direction: 'rtl',
        }}
    >
        {/* header row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
            <div>
                <p style={{
                    margin: 0, fontSize: '13px', fontWeight: 500,
                    color: S.outline,
                    fontFamily: "'IBM Plex Sans Arabic', sans-serif",
                }}>
                    {label}
                </p>
                {sublabel && (
                    <p style={{ margin: '2px 0 0', fontSize: '10px', color: S.outlineVariant, fontFamily: "'IBM Plex Sans Arabic', sans-serif" }}>
                        {sublabel}
                    </p>
                )}
            </div>
            {Icon && (
                <div style={{
                    width: 40, height: 40, borderRadius: '50%',
                    background: iconBg || S.surfaceContainer,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                }}>
                    <Icon style={{ width: 20, height: 20, color: iconColor || S.primaryContainer }} />
                </div>
            )}
        </div>

        {/* value */}
        <div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', direction: 'ltr' }}>
                <span style={{
                    fontSize: '36px', fontWeight: 700, lineHeight: 1,
                    color: accentColor || S.onBackground,
                    fontFamily: "'IBM Plex Sans Arabic', sans-serif",
                    letterSpacing: '-0.02em',
                }}>
                    {value}
                </span>
                {valueSmall && (
                    <span style={{ fontSize: '16px', fontWeight: 500, color: S.outline }}>
                        {valueSmall}
                    </span>
                )}
            </div>
            {note && (
                <div style={{
                    display: 'flex', alignItems: 'center', gap: '4px',
                    marginTop: '6px',
                    color: noteColor || S.primaryContainer,
                }}>
                    {NoteIcon && <NoteIcon style={{ width: 14, height: 14 }} />}
                    <span style={{ fontSize: '11px', fontFamily: "'IBM Plex Sans Arabic', sans-serif" }}>
                        {note}
                    </span>
                </div>
            )}
        </div>
    </motion.div>
);

/* ══════════════════════════════════════════════════════
   WEEKLY REVENUE SVG CHART — Stitch blue palette
══════════════════════════════════════════════════════ */
const WEEK_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const WeeklyChart = ({ weeklyRevenue = [] }) => {
    const svgRef = useRef(null);
    const [tip, setTip] = useState(null);

    const W = 580, H = 220, pL = 52, pR = 16, pT = 16, pB = 32;
    const iW = W - pL - pR, iH = H - pT - pB;

    const pts = weeklyRevenue.length > 0
        ? weeklyRevenue.map(item => ({
            label: item.day ?? item.label ?? '',
            value: Number(item.amount ?? item.value ?? item ?? 0),
        }))
        : WEEK_DAYS.map(d => ({ label: d, value: 0 }));

    const maxV = Math.max(...pts.map(p => p.value), 1);
    const xOf = i => pL + (i / (pts.length - 1)) * iW;
    const yOf = v => pT + iH - (v / maxV) * iH;
    const coords = pts.map((p, i) => [xOf(i), yOf(p.value)]);

    const makePath = (arr) => {
        if (arr.length < 2) return '';
        let d = `M ${arr[0][0]} ${arr[0][1]}`;
        for (let i = 0; i < arr.length - 1; i++) {
            const mx = (arr[i][0] + arr[i + 1][0]) / 2;
            d += ` C ${mx} ${arr[i][1]}, ${mx} ${arr[i + 1][1]}, ${arr[i + 1][0]} ${arr[i + 1][1]}`;
        }
        return d;
    };

    const linePath = makePath(coords);
    const areaPath = `${linePath} L ${coords[coords.length - 1][0]} ${pT + iH} L ${coords[0][0]} ${pT + iH} Z`;

    const yTicks = [0, 0.25, 0.5, 0.75, 1].map(r => ({
        v: maxV * r,
        y: pT + iH - r * iH,
    }));

    const onMove = (e) => {
        const rect = svgRef.current?.getBoundingClientRect();
        if (!rect) return;
        const mx = (e.clientX - rect.left) * (W / rect.width);
        let best = 0;
        coords.forEach((c, i) => { if (Math.abs(c[0] - mx) < Math.abs(coords[best][0] - mx)) best = i; });
        setTip({ x: coords[best][0], y: coords[best][1], label: pts[best].label, value: pts[best].value });
    };

    return (
        <div style={{ direction: 'ltr', width: '100%' }}>
            <svg
                ref={svgRef}
                viewBox={`0 0 ${W} ${H}`}
                style={{ width: '100%', overflow: 'visible' }}
                onMouseMove={onMove}
                onMouseLeave={() => setTip(null)}
            >
                <defs>
                    <linearGradient id="wkAreaStitch" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={S.primaryContainer} stopOpacity="0.22" />
                        <stop offset="70%" stopColor={S.primaryContainer} stopOpacity="0.06" />
                        <stop offset="100%" stopColor={S.primaryContainer} stopOpacity="0" />
                    </linearGradient>
                    <filter id="glowStitch" x="-20%" y="-20%" width="140%" height="140%">
                        <feGaussianBlur stdDeviation="2" result="blur" />
                        <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                    </filter>
                </defs>

                {/* grid lines */}
                {yTicks.map((t, i) => (
                    <g key={i}>
                        <line
                            x1={pL} y1={t.y} x2={W - pR} y2={t.y}
                            stroke={S.outlineVariant} strokeOpacity="0.5"
                            strokeDasharray={i === 0 ? 'none' : '4 4'}
                            strokeWidth="1"
                        />
                        <text x={pL - 6} y={t.y + 4} textAnchor="end" fontSize="9.5"
                            fill={S.outline} fontFamily="'IBM Plex Sans Arabic',sans-serif">
                            {t.v >= 1000 ? `$${(t.v / 1000).toFixed(1)}k` : `$${Math.round(t.v)}`}
                        </text>
                    </g>
                ))}

                {/* area fill */}
                <path d={areaPath} fill="url(#wkAreaStitch)" />

                {/* line */}
                <path d={linePath} fill="none" stroke={S.primaryContainer} strokeWidth="2.5"
                    strokeLinecap="round" filter="url(#glowStitch)" />

                {/* dots */}
                {coords.map(([x, y], i) => (
                    <g key={i}>
                        <circle cx={x} cy={y} r="5.5" fill={S.surfaceContainerLowest}
                            stroke={S.primaryContainer} strokeWidth="2.5" />
                        <circle cx={x} cy={y} r="2.5" fill={S.primaryContainer} />
                    </g>
                ))}

                {/* x-axis labels */}
                {pts.map((p, i) => (
                    <text key={i} x={xOf(i)} y={H - 4} textAnchor="middle" fontSize="10"
                        fill={S.outline} fontFamily="'IBM Plex Sans Arabic',sans-serif">
                        {p.label}
                    </text>
                ))}

                {/* tooltip */}
                {tip && (
                    <g>
                        <line x1={tip.x} y1={pT} x2={tip.x} y2={pT + iH}
                            stroke={S.primaryContainer} strokeOpacity="0.35" strokeDasharray="4 3" />
                        <circle cx={tip.x} cy={tip.y} r="8" fill={S.primaryContainer} fillOpacity="0.15" />
                        <circle cx={tip.x} cy={tip.y} r="4" fill={S.primaryContainer} />
                        <rect x={tip.x - 36} y={tip.y - 34} width="72" height="22" rx="6"
                            fill={S.onBackground} stroke={S.primaryContainer} strokeWidth="1" />
                        <text x={tip.x} y={tip.y - 19} textAnchor="middle" fontSize="11"
                            fill="#fff" fontWeight="bold" fontFamily="'IBM Plex Sans Arabic',sans-serif">
                            ${tip.value.toLocaleString()}
                        </text>
                    </g>
                )}
            </svg>
        </div>
    );
};

/* ══════════════════════════════════════════════════════
   DONUT CHART — Stitch palette
══════════════════════════════════════════════════════ */
const DonutChart = ({ data = [] }) => {
    const [hov, setHov] = useState(null);
    const cx = 90, cy = 90, R = 70, r = 42;
    const total = data.reduce((s, d) => s + (d.count || 0), 0) || 1;

    let angle = -Math.PI / 2;
    const slices = data.map((d, i) => {
        const pct = d.count / total;
        const a1 = angle;
        const a2 = angle + pct * 2 * Math.PI;
        const R2 = hov === i ? R + 6 : R;
        const lrg = pct > 0.5 ? 1 : 0;
        const x1 = cx + R2 * Math.cos(a1), y1 = cy + R2 * Math.sin(a1);
        const x2 = cx + R2 * Math.cos(a2), y2 = cy + R2 * Math.sin(a2);
        const xi1 = cx + r * Math.cos(a1), yi1 = cy + r * Math.sin(a1);
        const xi2 = cx + r * Math.cos(a2), yi2 = cy + r * Math.sin(a2);
        angle = a2;
        return {
            path: `M ${xi1} ${yi1} L ${x1} ${y1} A ${R2} ${R2} 0 ${lrg} 1 ${x2} ${y2} L ${xi2} ${yi2} A ${r} ${r} 0 ${lrg} 0 ${xi1} ${yi1} Z`,
            color: GOV_COLORS[i % GOV_COLORS.length],
            name: d.name,
            pct: Math.round(pct * 100),
        };
    });

    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
            <div style={{ position: 'relative', width: '180px', height: '180px' }}>
                <svg viewBox="0 0 180 180" style={{ width: '100%', height: '100%', direction: 'ltr' }}>
                    <defs>
                        <filter id="dsStitch">
                            <feDropShadow dx="0" dy="2" stdDeviation="3"
                                floodColor={S.onBackground} floodOpacity="0.10" />
                        </filter>
                    </defs>
                    {slices.map((s, i) => (
                        <path key={i} d={s.path} fill={s.color}
                            filter="url(#dsStitch)"
                            style={{
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                opacity: hov === null || hov === i ? 1 : 0.45,
                            }}
                            onMouseEnter={() => setHov(i)}
                            onMouseLeave={() => setHov(null)}
                        />
                    ))}
                    {/* center label */}
                    <text x={cx} y={cy - 5} textAnchor="middle" fontSize="20"
                        fontWeight="700" fill={S.onBackground}
                        fontFamily="'IBM Plex Sans Arabic',sans-serif">
                        {hov !== null ? `${slices[hov]?.pct ?? ''}%` : (total > 1 ? `${slices[0]?.pct ?? ''}%` : '100%')}
                    </text>
                    <text x={cx} y={cy + 13} textAnchor="middle" fontSize="11"
                        fill={S.outline} fontFamily="'IBM Plex Sans Arabic',sans-serif">
                        {hov !== null ? slices[hov]?.name : 'إجمالي'}
                    </text>
                </svg>
            </div>

            {/* legend */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%', padding: '0 4px' }}>
                {slices.map((s, i) => (
                    <div key={i}
                        style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            padding: '6px 8px', borderRadius: '8px', cursor: 'pointer',
                            background: hov === i ? `${s.color}22` : 'transparent',
                            transition: 'background 0.15s',
                        }}
                        onMouseEnter={() => setHov(i)}
                        onMouseLeave={() => setHov(null)}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{
                                width: 10, height: 10, borderRadius: '50%',
                                background: s.color, flexShrink: 0,
                            }} />
                            <span style={{
                                fontSize: '13px', color: S.onSurface,
                                fontFamily: "'IBM Plex Sans Arabic', sans-serif",
                            }}>
                                {s.name}
                            </span>
                        </div>
                        <span style={{
                            fontSize: '13px', fontWeight: 700, color: s.color,
                            fontFamily: "'IBM Plex Sans Arabic', sans-serif",
                        }}>
                            {s.pct}%
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
};

/* ══════════════════════════════════════════════════════
                                            </span>
                                        </button>
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                )}
            </div>
        </motion.div>
    );
};

/* ══════════════════════════════════════════════════════
   SKELETON
══════════════════════════════════════════════════════ */
const DashboardSkeleton = () => (
    <div style={{ direction: 'rtl', padding: '8px' }}>
        <style>{`
            @keyframes stitchPulse {
              0%, 100% { opacity: 1; }
              50% { opacity: 0.45; }
            }
            .stitch-skel { animation: stitchPulse 1.6s ease-in-out infinite; }
        `}</style>
        {/* title skeleton */}
        <div className="stitch-skel" style={{ height: '32px', width: '220px', borderRadius: '8px', background: S.surfaceContainerHigh, marginBottom: '24px' }} />
        {/* kpi row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '16px', marginBottom: '20px' }}>
            {[...Array(4)].map((_, i) => (
                <div key={i} className="stitch-skel"
                    style={{ height: '130px', borderRadius: '16px', background: S.surfaceContainerHigh, border: `1px solid ${S.outlineVariant}` }} />
            ))}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px', marginBottom: '16px' }}>
            <div className="stitch-skel" style={{ height: '280px', borderRadius: '16px', background: S.surfaceContainerHigh }} />
            <div className="stitch-skel" style={{ height: '280px', borderRadius: '16px', background: S.surfaceContainerHigh }} />
        </div>
        <div className="stitch-skel" style={{ height: '220px', borderRadius: '16px', background: S.surfaceContainerHigh }} />
    </div>
);

/* ══════════════════════════════════════════════════════
   MAIN DASHBOARD
══════════════════════════════════════════════════════ */
const Dashboard = () => {
    const navigate = useNavigate();
    const { data: dashboardData, isLoading: loading, error: fetchError, refetch: load } = useAdminDashboard();
    
    const data = dashboardData;
    const error = fetchError ? true : false;

    /* table */
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const PER = 8;

    /* gov filter dropdown */
    const [govSel, setGovSel] = useState('all');

    /* ── Date period filter ── */
    const [period, setPeriod] = useState('month');
    const PERIOD_OPTS = [
        { value: 'today', label: 'اليوم' },
        { value: 'week', label: 'هذا الأسبوع' },
        { value: 'month', label: 'هذا الشهر' },
        { value: 'year', label: 'هذا العام' },
        { value: 'all', label: 'الكل' },
    ];

    const filterByPeriod = (items, dateKey) => {
        if (period === 'all') return items;
        const now = new Date();
        return items.filter(item => {
            const d = new Date(item[dateKey]);
            if (isNaN(d)) return true;
            if (period === 'today') return d.toDateString() === now.toDateString();
            if (period === 'week') {
                const weekAgo = new Date(now); weekAgo.setDate(now.getDate() - 7);
                return d >= weekAgo;
            }
            if (period === 'month') return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
            if (period === 'year') return d.getFullYear() === now.getFullYear();
            return true;
        });
    };

    const addToast = useToastStore(s => s.addToast);

    if (loading) return <DashboardSkeleton />;

    if (error && !data) return (
        <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            justifyContent: 'center', padding: '80px 16px',
            direction: 'rtl', gap: '16px', textAlign: 'center',
        }}>
            <div style={{
                width: 72, height: 72, borderRadius: '20px',
                background: S.errorContainer,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
                <AlertCircle style={{ width: 36, height: 36, color: S.error }} />
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: 700, color: S.onBackground, margin: 0, fontFamily: "'IBM Plex Sans Arabic', sans-serif" }}>
                تعذر تحميل بيانات اللوحة
            </h3>
            <p style={{ fontSize: '13px', color: S.onSurfaceVariant, margin: 0, fontFamily: "'IBM Plex Sans Arabic', sans-serif" }}>
                يرجى التحقق من الاتصال والمحاولة مرة أخرى.
            </p>
            <button
                onClick={load}
                style={{
                    display: 'flex', alignItems: 'center', gap: '8px',
                    padding: '10px 28px', borderRadius: '10px',
                    background: S.primaryContainer, color: '#fff',
                    fontSize: '13px', fontWeight: 600, border: 'none', cursor: 'pointer',
                    fontFamily: "'IBM Plex Sans Arabic', sans-serif",
                }}
            >
                <RefreshCw style={{ width: 16, height: 16 }} />
                إعادة المحاولة
            </button>
        </div>
    );

    /* ── derived data (props & state unchanged) ── */
    const kpis = data?.kpis || {};
    const totalRevenue = kpis.total_revenue ?? 0;
    const activeScreens = kpis.active_screens ?? 0;
    const totalScreens = kpis.total_screens ?? 0;
    const pendingAds = kpis.pending_ads ?? 0;
    const activeUsers = kpis.active_users ?? 0;

    const charts = data?.charts || {};
    const weeklyRevenue = charts.weekly_revenue || data?.weekly_revenue || [];
    const screensByGov = charts.screens_by_governorate || data?.screens_by_governorate || [];

    const rawLogs = data?.recent_logs || [];
    const periodLogs = filterByPeriod(rawLogs, 'playback_timestamp');
    const filtered = periodLogs.filter(l =>
        !search ||
        l.ad_name?.toLowerCase().includes(search.toLowerCase()) ||
        l.screen_name?.toLowerCase().includes(search.toLowerCase())
    );
    const totalPages = Math.max(1, Math.ceil(filtered.length / PER));
    const pageLogs = filtered.slice((page - 1) * PER, page * PER);

    /* weekly revenue filtered by period */
    const filteredWeekly = (() => {
        if (period === 'all' || period === 'week' || period === 'month') return weeklyRevenue;
        if (period === 'today') {
            const today = new Date().toLocaleDateString('en-US', { weekday: 'short' });
            return weeklyRevenue.filter(r => (r.day ?? r.label) === today);
        }
        return weeklyRevenue;
    })();

    /* screen ratio */
    const screenRatio = totalScreens > 0 ? Math.round((activeScreens / totalScreens) * 100) : 0;

    /* ── glass card style ── */
    const glassCard = {
        background: S.surfaceContainerLowest,
        border: `1px solid ${S.outlineVariant}`,
        borderRadius: '16px',
        boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
    };

    return (
        <div style={{
            direction: 'rtl',
            paddingBottom: '40px',
            fontFamily: "'IBM Plex Sans Arabic', sans-serif",
        }}>

            {/* ── Page header ── */}
            <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4 }}
                style={{
                    marginBottom: '24px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-end',
                }}
            >
                <div>
                    <h1 style={{
                        fontSize: '28px', fontWeight: 700,
                        color: S.onBackground, margin: 0,
                        fontFamily: "'IBM Plex Sans Arabic', sans-serif",
                        lineHeight: 1.2,
                    }}>
                        نظرة عامة على لوحة التحكم
                    </h1>
                    <p style={{
                        margin: '4px 0 0', fontSize: '13px',
                        color: S.outline,
                        fontFamily: "'IBM Plex Sans Arabic', sans-serif",
                    }}>
                        Dashboard Overview
                    </p>
                </div>

                {/* action buttons */}
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    {/* ── Period filter ── */}
                    <div style={{
                        display: 'flex', alignItems: 'center', gap: '0',
                        border: `1px solid ${S.outlineVariant}`,
                        borderRadius: '10px', overflow: 'hidden',
                        background: S.surfaceContainerLowest,
                        boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                    }}>
                        <span style={{
                            padding: '0 10px', display: 'flex', alignItems: 'center',
                            color: S.outline, borderLeft: `1px solid ${S.outlineVariant}`,
                            height: '36px',
                        }}>
                            <CalendarDays style={{ width: 14, height: 14 }} />
                        </span>
                        <select
                            value={period}
                            onChange={e => { setPeriod(e.target.value); setPage(1); }}
                            style={{
                                border: 'none', outline: 'none',
                                background: 'transparent',
                                padding: '0 12px 0 8px',
                                height: '36px',
                                fontSize: '13px', fontWeight: 600,
                                color: S.onSurface,
                                cursor: 'pointer',
                                direction: 'rtl',
                                fontFamily: "'IBM Plex Sans Arabic', sans-serif",
                                minWidth: '110px',
                            }}
                        >
                            {PERIOD_OPTS.map(o => (
                                <option key={o.value} value={o.value}>{o.label}</option>
                            ))}
                        </select>
                    </div>
                    <button
                        onClick={() => navigate('/dashboard/ads/create')}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '6px',
                            padding: '8px 16px', borderRadius: '10px',
                            background: S.primaryContainer, color: '#fff',
                            border: 'none', fontSize: '13px', fontWeight: 600,
                            cursor: 'pointer', fontFamily: "'IBM Plex Sans Arabic', sans-serif",
                            boxShadow: '0 2px 8px rgba(37,99,235,0.30)',
                        }}>
                        <Plus style={{ width: 15, height: 15 }} />
                        إعلان جديد
                    </button>
                </div>
            </motion.div>


            {/* ── KPI CARDS ROW ── */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '16px',
                marginBottom: '20px',
            }}>
                {/* Active Users */}
                <KpiCard
                    index={0}
                    label="المستخدمون النشطون"
                    sublabel="Active Users"
                    value={activeUsers}
                    note="+12% من الشهر الماضي"
                    noteIcon={TrendingUp}
                    noteColor={S.primaryContainer}
                    Icon={Users}
                    iconBg={S.surfaceContainer}
                    iconColor={S.primaryContainer}
                />
                {/* Pending Ads */}
                <KpiCard
                    index={1}
                    label="إعلانات قيد المراجعة"
                    sublabel="Pending Ads"
                    value={pendingAds}
                    note="يتطلب إجراء"
                    noteIcon={Info}
                    noteColor={S.error}
                    Icon={Monitor}
                    iconBg={S.errorContainer}
                    iconColor={S.error}
                    borderAccent={S.error}
                />
                {/* Active Screens */}
                <KpiCard
                    index={2}
                    label="الشاشات النشطة"
                    sublabel="Active Screens"
                    value={activeScreens}
                    valueSmall={`/ ${totalScreens}`}
                    Icon={Monitor}
                    iconBg={S.secondaryFixed}
                    iconColor={S.secondary}
                    extraContent={
                        <div style={{
                            marginTop: '8px',
                            height: '6px', borderRadius: '999px',
                            background: S.surfaceContainerHighest, overflow: 'hidden',
                        }}>
                            <div style={{
                                height: '100%', borderRadius: '999px',
                                background: S.secondary,
                                width: `${screenRatio}%`,
                                transition: 'width 0.5s ease',
                            }} />
                        </div>
                    }
                />
                {/* Total Revenue */}
                <KpiCard
                    index={3}
                    label="إجمالي الأرباح"
                    sublabel="Total Revenue"
                    value={`$${Number(totalRevenue).toLocaleString()}`}
                    note="+5.4% هذا الأسبوع"
                    noteIcon={TrendingUp}
                    noteColor={S.primaryContainer}
                    accentColor={S.primaryContainer}
                    Icon={DollarSign}
                    iconBg={S.primaryFixed}
                    iconColor={S.primary}
                />
            </div>

            {/* ── CHARTS ROW ── */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: '2fr 1fr',
                gap: '16px',
                marginBottom: '20px',
            }}>
                {/* Weekly Revenue chart */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                    style={{ ...glassCard, padding: '22px 22px 16px' }}
                >
                    <div style={{
                        display: 'flex', alignItems: 'center',
                        justifyContent: 'space-between', marginBottom: '16px',
                    }}>
                        <h3 style={{
                            margin: 0, fontSize: '16px', fontWeight: 600,
                            color: S.onBackground,
                            fontFamily: "'IBM Plex Sans Arabic', sans-serif",
                        }}>
                            الأرباح الأسبوعية الكلية
                        </h3>
                        <select
                            value={govSel}
                            onChange={e => setGovSel(e.target.value)}
                            style={{
                                fontSize: '12px', fontWeight: 500,
                                color: S.onSurface,
                                border: `1px solid ${S.outlineVariant}`,
                                borderRadius: '8px',
                                padding: '5px 12px',
                                background: S.surfaceContainerLow,
                                outline: 'none', cursor: 'pointer',
                                direction: 'rtl',
                                fontFamily: "'IBM Plex Sans Arabic', sans-serif",
                            }}
                        >
                            <option value="all">كل المحافظات</option>
                            {screensByGov.map(g => (
                                <option key={g.name} value={g.name}>{g.name}</option>
                            ))}
                        </select>
                    </div>
                    <WeeklyChart weeklyRevenue={filteredWeekly} />
                </motion.div>

                {/* Donut chart */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.4 }}
                    style={{ ...glassCard, padding: '22px' }}
                >
                    <h3 style={{
                        margin: '0 0 18px', fontSize: '16px', fontWeight: 600,
                        color: S.onBackground,
                        fontFamily: "'IBM Plex Sans Arabic', sans-serif",
                    }}>
                        الشاشات حسب المحافظة
                    </h3>
                    {screensByGov.length > 0 ? (
                        <DonutChart data={screensByGov} />
                    ) : (
                        <div style={{
                            display: 'flex', flexDirection: 'column',
                            alignItems: 'center', justifyContent: 'center',
                            height: '200px', gap: '10px',
                        }}>
                            <Monitor style={{ width: 36, height: 36, color: S.outlineVariant }} />
                            <p style={{
                                fontSize: '13px', color: S.outline, margin: 0,
                                fontFamily: "'IBM Plex Sans Arabic', sans-serif",
                            }}>
                                لا توجد بيانات
                            </p>
                        </div>
                    )}
                </motion.div>
            </div>

            {/* ── RECENT PLAY LOGS ── */}
            <RecentPlaybackLogs />
        </div>
    );
};

export default Dashboard;
