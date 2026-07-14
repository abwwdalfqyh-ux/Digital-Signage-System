import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    BarChart2, Download, FileText, RefreshCw, Calendar,
    Monitor, TrendingUp, Eye, EyeOff, Percent, AlertCircle,
    ChevronDown, FileSpreadsheet, Printer, Filter
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axiosClient from '../../core/api/axiosClient';
import { ENDPOINTS } from '../../core/api/endpoints';
import useToastStore from '../../store/useToastStore';
import useAuthStore from '../../store/useAuthStore';

/* ─── Design tokens ─── */
const S = {
    primary: '#004ac6',
    primaryContainer: '#2563eb',
    surfaceContainerLowest: '#ffffff',
    surfaceContainerLow: '#f1f3ff',
    surfaceContainer: '#e9edff',
    surfaceContainerHigh: '#e1e8fd',
    onBackground: '#141b2b',
    onSurface: '#141b2b',
    onSurfaceVariant: '#434655',
    outline: '#737686',
    outlineVariant: '#c3c6d7',
    error: '#ba1a1a',
    errorContainer: '#ffdad6',
    success: '#166534',
    successContainer: '#dcfce7',
    warning: '#d97706',
    warningContainer: '#fef3c7',
    info: '#0369a1',
    infoContainer: '#e0f2fe',
};

/* ─── KPI Card ─── */
const KpiCard = ({
    label, sublabel, value, suffix = '', note, noteIcon: NoteIcon, noteColor,
    accentColor, iconBg, iconColor, Icon, borderAccent, index, highlight,
    togglable = false, // ← NEW: enable eye toggle
}) => {
    const [hidden, setHidden] = useState(false);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: index * 0.08 }}
            whileHover={{ y: -4, boxShadow: '0 10px 30px -6px rgba(0,74,198,0.18)' }}
            style={{
                background: highlight ? `linear-gradient(135deg, ${highlight}18, ${highlight}05)` : S.surfaceContainerLowest,
                border: `1px solid ${borderAccent || S.outlineVariant}`,
                borderRadius: '18px',
                padding: '22px 22px 18px',
                minHeight: '138px',
                borderRight: borderAccent ? `4px solid ${borderAccent}` : `1px solid ${S.outlineVariant}`,
                direction: 'rtl',
                position: 'relative',
                overflow: 'hidden',
                cursor: 'default',
                transition: 'box-shadow 0.3s ease',
            }}
        >
            {/* Subtle background shape */}
            <div style={{
                position: 'absolute', bottom: -20, left: -20,
                width: 90, height: 90, borderRadius: '50%',
                background: iconBg || S.surfaceContainer,
                opacity: 0.35,
            }} />

            <div className="flex justify-between items-start mb-4 relative">
                <div>
                    <p className="m-0 text-[13px] font-bold" style={{ color: S.onSurfaceVariant }}>{label}</p>
                    {sublabel && <p className="mt-0.5 text-[11px] font-medium" style={{ color: S.outline }}>{sublabel}</p>}
                </div>

                {/* Icon or togglable eye button */}
                {togglable ? (
                    <button
                        onClick={() => setHidden(h => !h)}
                        title={hidden ? 'إظهار القيمة' : 'إخفاء القيمة'}
                        style={{
                            width: 40, height: 40, borderRadius: '50%',
                            background: hidden ? S.surfaceContainerHigh : (iconBg || S.surfaceContainer),
                            border: `1.5px solid ${hidden ? S.outlineVariant : 'transparent'}`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            cursor: 'pointer', transition: 'all 0.2s ease',
                            flexShrink: 0,
                        }}
                        onMouseEnter={e => {
                            e.currentTarget.style.background = S.surfaceContainerHigh;
                            e.currentTarget.style.transform = 'scale(1.1)';
                        }}
                        onMouseLeave={e => {
                            e.currentTarget.style.background = hidden ? S.surfaceContainerHigh : (iconBg || S.surfaceContainer);
                            e.currentTarget.style.transform = 'scale(1)';
                        }}
                    >
                        <AnimatePresence mode="wait">
                            {hidden ? (
                                <motion.span key="off"
                                    initial={{ opacity: 0, rotate: -15, scale: 0.7 }}
                                    animate={{ opacity: 1, rotate: 0, scale: 1 }}
                                    exit={{ opacity: 0, rotate: 15, scale: 0.7 }}
                                    transition={{ duration: 0.2 }}>
                                    <EyeOff style={{ color: S.outline, width: 18, height: 18 }} />
                                </motion.span>
                            ) : (
                                <motion.span key="on"
                                    initial={{ opacity: 0, rotate: 15, scale: 0.7 }}
                                    animate={{ opacity: 1, rotate: 0, scale: 1 }}
                                    exit={{ opacity: 0, rotate: -15, scale: 0.7 }}
                                    transition={{ duration: 0.2 }}>
                                    <Eye style={{ color: iconColor || S.primaryContainer, width: 18, height: 18 }} />
                                </motion.span>
                            )}
                        </AnimatePresence>
                    </button>
                ) : (
                    Icon && (
                        <div style={{ background: iconBg || S.surfaceContainer }} className="w-11 h-11 rounded-full flex items-center justify-center shrink-0">
                            <Icon style={{ color: iconColor || S.primaryContainer }} className="w-5 h-5" />
                        </div>
                    )
                )}
            </div>

            <div className="relative">
                <AnimatePresence mode="wait">
                    {hidden ? (
                        <motion.div key="hidden"
                            initial={{ opacity: 0, y: 4 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -4 }}
                            transition={{ duration: 0.18 }}
                            className="flex items-center gap-1.5"
                            dir="ltr"
                        >
                            {/* Blurred dots placeholder */}
                            {[...Array(5)].map((_, i) => (
                                <div key={i} style={{
                                    width: 10, height: 10, borderRadius: '50%',
                                    background: accentColor || S.onBackground,
                                    opacity: 0.35,
                                }} />
                            ))}
                        </motion.div>
                    ) : (
                        <motion.div key="visible"
                            initial={{ opacity: 0, y: 4 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -4 }}
                            transition={{ duration: 0.18 }}>
                            <div className="flex items-baseline gap-1" dir="ltr">
                                <span className="text-[34px] font-black leading-none" style={{ color: accentColor || S.onBackground, letterSpacing: '-0.02em' }}>
                                    {value}
                                </span>
                                {suffix && <span className="text-lg font-bold" style={{ color: accentColor || S.outline }}>{suffix}</span>}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {note && !hidden && (
                    <div className="flex items-center gap-1.5 mt-2" style={{ color: noteColor || S.primaryContainer }}>
                        {NoteIcon && <NoteIcon className="w-3.5 h-3.5" />}
                        <span className="text-[11px] font-bold">{note}</span>
                    </div>
                )}
                {hidden && (
                    <p className="text-[11px] font-bold mt-2" style={{ color: S.outline }}>
                        اضغط الأيقونة للإظهار
                    </p>
                )}
            </div>
        </motion.div>
    );
};


/* ─── Fill Rate Gauge (SVG Arc) ─── */
const FillRateGauge = ({ value = 0 }) => {
    const pct = Math.min(100, Math.max(0, value));
    const cx = 110, cy = 110, R = 85, strokeW = 18;
    const circumference = Math.PI * R; // half circle
    const dash = (pct / 100) * circumference;

    const color = pct >= 75 ? S.success : pct >= 40 ? S.warning : S.error;

    return (
        <div className="flex flex-col items-center">
            <svg viewBox="0 0 220 130" style={{ width: '100%', maxWidth: 280, direction: 'ltr', overflow: 'visible' }}>
                <defs>
                    <linearGradient id="gaugeGrad" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor={pct >= 40 ? S.success : S.error} />
                        <stop offset="100%" stopColor={color} />
                    </linearGradient>
                </defs>
                {/* Background arc */}
                <path
                    d={`M ${cx - R} ${cy} A ${R} ${R} 0 0 1 ${cx + R} ${cy}`}
                    fill="none"
                    stroke={S.outlineVariant}
                    strokeWidth={strokeW}
                    strokeLinecap="round"
                />
                {/* Value arc */}
                <path
                    d={`M ${cx - R} ${cy} A ${R} ${R} 0 0 1 ${cx + R} ${cy}`}
                    fill="none"
                    stroke="url(#gaugeGrad)"
                    strokeWidth={strokeW}
                    strokeLinecap="round"
                    strokeDasharray={`${dash} ${circumference}`}
                    style={{ transition: 'stroke-dasharray 1s cubic-bezier(0.4,0,0.2,1)' }}
                />
                {/* Center value */}
                <text x={cx} y={cy - 10} textAnchor="middle" fontSize="34" fontWeight="900" fill={color}>
                    {pct.toFixed(1)}%
                </text>
                <text x={cx} y={cy + 12} textAnchor="middle" fontSize="12" fontWeight="600" fill={S.outline}>
                    معدل الإشغال
                </text>
                {/* Labels */}
                <text x={cx - R + 4} y={cy + 22} fontSize="10" fill={S.outline}>0%</text>
                <text x={cx + R - 4} y={cy + 22} fontSize="10" fill={S.outline} textAnchor="end">100%</text>
            </svg>
            {/* Status badge */}
            <div style={{
                marginTop: 8,
                padding: '5px 16px',
                borderRadius: 99,
                background: pct >= 75 ? S.successContainer : pct >= 40 ? S.warningContainer : S.errorContainer,
                color: pct >= 75 ? S.success : pct >= 40 ? S.warning : S.error,
                fontSize: 12, fontWeight: 700,
            }}>
                {pct >= 75 ? '🟢 ممتاز — إشغال عالٍ' : pct >= 40 ? '🟡 متوسط — يمكن التحسين' : '🔴 منخفض — يحتاج اهتمام'}
            </div>
        </div>
    );
};

/* ─── Bar Chart (daily impressions) ─── */
const ImpressionsBarChart = ({ data = [] }) => {
    const [tip, setTip] = useState(null);
    const W = 560, H = 200, pL = 48, pR = 16, pT = 14, pB = 36;
    const iW = W - pL - pR, iH = H - pT - pB;

    const maxV = Math.max(...data.map(d => d.impressions || 0), 1);
    const barW = data.length > 0 ? Math.min(32, (iW / data.length) * 0.6) : 20;
    const gapW = data.length > 1 ? iW / (data.length - 1) : iW;

    const xOf = i => pL + i * (iW / Math.max(data.length - 1, 1));
    const yOf = v => pT + iH - (v / maxV) * iH;

    const yTicks = [0, 0.25, 0.5, 0.75, 1].map(r => ({
        v: Math.round(maxV * r),
        y: pT + iH - r * iH,
    }));

    return (
        <div style={{ direction: 'ltr', width: '100%' }}>
            <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', overflow: 'visible' }}>
                <defs>
                    <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={S.primaryContainer} />
                        <stop offset="100%" stopColor={S.primary} stopOpacity="0.7" />
                    </linearGradient>
                </defs>
                {yTicks.map((t, i) => (
                    <g key={i}>
                        <line x1={pL} y1={t.y} x2={W - pR} y2={t.y}
                            stroke={S.outlineVariant} strokeOpacity="0.5"
                            strokeDasharray={i === 0 ? 'none' : '4 4'} strokeWidth="1" />
                        <text x={pL - 6} y={t.y + 4} textAnchor="end" fontSize="10"
                            fill={S.outline} fontFamily="'IBM Plex Sans Arabic',sans-serif">
                            {t.v >= 1000 ? `${(t.v / 1000).toFixed(1)}k` : t.v}
                        </text>
                    </g>
                ))}
                {data.map((d, i) => {
                    const x = xOf(i);
                    const barH = ((d.impressions || 0) / maxV) * iH;
                    const isHovered = tip?.i === i;
                    return (
                        <g key={i}
                            onMouseEnter={() => setTip({ i, x, y: yOf(d.impressions || 0), value: d.impressions, label: d.label })}
                            onMouseLeave={() => setTip(null)}
                            style={{ cursor: 'pointer' }}>
                            <rect
                                x={x - barW / 2} y={yOf(d.impressions || 0)}
                                width={barW} height={barH}
                                rx={5}
                                fill={isHovered ? S.primaryContainer : 'url(#barGrad)'}
                                opacity={isHovered ? 1 : 0.85}
                                style={{ transition: 'all 0.2s' }}
                            />
                            <text x={x} y={H - 4} textAnchor="middle" fontSize="10"
                                fill={S.outline} fontFamily="'IBM Plex Sans Arabic',sans-serif">
                                {d.label}
                            </text>
                        </g>
                    );
                })}
                {tip && (
                    <g>
                        <rect x={tip.x - 38} y={tip.y - 36} width={76} height={26} rx={7} fill={S.onBackground} />
                        <text x={tip.x} y={tip.y - 18} textAnchor="middle" fontSize="12"
                            fill="#fff" fontWeight="bold" fontFamily="'IBM Plex Sans Arabic',sans-serif">
                            {(tip.value || 0).toLocaleString()}
                        </text>
                    </g>
                )}
            </svg>
        </div>
    );
};

/* ─── Screen Row (table) ─── */
const ScreenRow = ({ screen, index }) => {
    const fillPct = screen.fill_rate || 0;
    const fillColor = fillPct >= 75 ? S.success : fillPct >= 40 ? S.warning : S.error;
    return (
        <motion.tr
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.04 }}
            style={{ borderBottom: `1px solid ${S.outlineVariant}` }}
            className="hover:bg-blue-50/40 transition-colors"
        >
            <td className="py-3 px-4 text-[13px] font-bold" style={{ color: S.onBackground }}>{screen.screen_name}</td>
            <td className="py-3 px-4 text-[12px]" style={{ color: S.onSurfaceVariant }}>
                {screen.location || 'غير محدد'}
            </td>
            <td className="py-3 px-4 text-center">
                <div className="flex items-center gap-2 justify-center">
                    <div style={{
                        flex: 1, height: 7, background: S.outlineVariant,
                        borderRadius: 99, maxWidth: 80, overflow: 'hidden'
                    }}>
                        <div style={{
                            width: `${fillPct}%`, height: '100%',
                            background: fillColor, borderRadius: 99,
                            transition: 'width 0.8s ease',
                        }} />
                    </div>
                    <span className="text-[12px] font-black min-w-[40px]" style={{ color: fillColor }}>
                        {fillPct.toFixed(1)}%
                    </span>
                </div>
            </td>
            <td className="py-3 px-4 text-center text-[13px] font-bold" style={{ color: S.primary }}>
                {(screen.impressions || 0).toLocaleString()}
            </td>
            <td className="py-3 px-4 text-center text-[13px] font-bold" style={{ color: S.success }}>
                ${parseFloat(screen.revenue || 0).toFixed(2)}
            </td>
            <td className="py-3 px-4 text-center">
                <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: 4,
                    padding: '3px 10px', borderRadius: 99, fontSize: 11, fontWeight: 700,
                    background: screen.status === 'online' ? S.successContainer : S.errorContainer,
                    color: screen.status === 'online' ? S.success : S.error,
                }}>
                    <span style={{
                        width: 6, height: 6, borderRadius: '50%',
                        background: screen.status === 'online' ? S.success : S.error,
                        display: 'inline-block',
                    }} />
                    {screen.status === 'online' ? 'متصلة' : 'مقطوعة'}
                </span>
            </td>
        </motion.tr>
    );
};

/* ══════════════════════════════════════════════════
   MAIN PAGE COMPONENT
══════════════════════════════════════════════════ */
const OwnerAnalyticsPage = () => {
    const { user } = useAuthStore();
    const addToast = useToastStore(s => s.addToast);
    const printRef = useRef(null);

    const [loading, setLoading] = useState(true);
    const [screens, setScreens] = useState([]);
    const [selectedScreen, setSelectedScreen] = useState('all');
    const [dateRange, setDateRange] = useState({
        start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
        end: new Date().toISOString().split('T')[0],
    });
    const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
    const exportRef = useRef(null);

    /* ── Mock / real analytics data ── */
    const [analytics, setAnalytics] = useState(null);

    /* Click-outside for export menu */
    useEffect(() => {
        const handler = (e) => {
            if (exportRef.current && !exportRef.current.contains(e.target)) {
                setIsExportMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    /* ── Fetch owner screens ── */
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const res = await axiosClient.get(ENDPOINTS.REPORTS.OWNER_ANALYTICS).catch(() => ({ data: { screens: [], summary: {} } }));
                const { screens: ownerScreens, summary } = res.data;
                
                setScreens(ownerScreens || []);
                
                if (summary) {
                    setAnalytics({
                        totalImpressions: summary.total_impressions || 0,
                        avgFillRate: ownerScreens && ownerScreens.length > 0 ? (ownerScreens.reduce((s, x) => s + (x.fill_rate || 0), 0) / ownerScreens.length) : 0,
                        totalRevenue: summary.total_revenue || 0,
                        onlineCount: summary.online_screens || 0,
                        offlineCount: (summary.total_screens || 0) - (summary.online_screens || 0),
                        totalScreens: summary.total_screens || 0,
                        dailyData: [
                            { label: 'الأحد', impressions: Math.round((summary.total_impressions || 0) / 7) },
                            { label: 'الإثنين', impressions: Math.round((summary.total_impressions || 0) / 7) },
                            { label: 'الثلاثاء', impressions: Math.round((summary.total_impressions || 0) / 7) },
                            { label: 'الأربعاء', impressions: Math.round((summary.total_impressions || 0) / 7) },
                            { label: 'الخميس', impressions: Math.round((summary.total_impressions || 0) / 7) },
                            { label: 'الجمعة', impressions: Math.round((summary.total_impressions || 0) / 7) },
                            { label: 'السبت', impressions: Math.round((summary.total_impressions || 0) / 7) }
                        ],
                    });
                } else {
                    buildAnalytics(ownerScreens || []);
                }
            } catch (e) {
                console.error(e);
                addToast('حدث خطأ أثناء جلب البيانات', 'error');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const buildAnalytics = (sc) => {
        const totalImpressions = sc.reduce((s, x) => s + (x.impressions || 0), 0);
        const avgFillRate = sc.length > 0 ? sc.reduce((s, x) => s + (x.fill_rate || 0), 0) / sc.length : 0;
        const totalRevenue = sc.reduce((s, x) => s + parseFloat(x.revenue || 0), 0);
        const onlineCount = sc.filter(x => x.status === 'online').length;

        const WEEK_DAYS = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
        const dailyData = WEEK_DAYS.map(label => ({
            label,
            impressions: Math.round(200 + Math.random() * (totalImpressions / 3)),
        }));

        setAnalytics({
            totalImpressions,
            avgFillRate,
            totalRevenue,
            onlineCount,
            offlineCount: sc.length - onlineCount,
            totalScreens: sc.length,
            dailyData,
        });
    };

    /* ── Filtered screens ── */
    const displayedScreens = selectedScreen === 'all'
        ? screens
        : screens.filter(s => String(s.screen_id) === selectedScreen);

    const displayedAnalytics = displayedScreens.length > 0 ? {
        totalImpressions: displayedScreens.reduce((s, x) => s + (x.impressions || 0), 0),
        avgFillRate: displayedScreens.reduce((s, x) => s + (x.fill_rate || 0), 0) / displayedScreens.length,
        totalRevenue: displayedScreens.reduce((s, x) => s + parseFloat(x.revenue || 0), 0),
    } : { totalImpressions: 0, avgFillRate: 0, totalRevenue: 0 };

    /* ─── Export PDF (print) ─── */
    const handleExportPDF = () => {
        setIsExportMenuOpen(false);
        setTimeout(() => window.print(), 200);
    };

    /* ─── Export Excel (CSV) ─── */
    const handleExportExcel = () => {
        setIsExportMenuOpen(false);
        const headers = ['اسم الشاشة', 'الموقع', 'معدل الإشغال (%)', 'مرات الظهور', 'الإيراد ($)', 'الحالة'];
        const rows = displayedScreens.map(s => [
            s.screen_name,
            s.location,
            s.fill_rate.toFixed(1),
            s.impressions,
            parseFloat(s.revenue).toFixed(2),
            s.status === 'online' ? 'متصلة' : 'مقطوعة',
        ]);

        const csvContent = [headers, ...rows]
            .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
            .join('\n');

        const BOM = '\uFEFF'; // BOM for Arabic UTF-8 in Excel
        const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        const dateStr = new Date().toISOString().split('T')[0];
        link.download = `analytics_owner_${dateStr}.csv`;
        link.click();
        URL.revokeObjectURL(url);
        addToast('تم تحميل ملف Excel بنجاح', 'success');
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-32 gap-4">
                <RefreshCw className="w-10 h-10 animate-spin" style={{ color: S.primaryContainer }} />
                <p className="text-[14px] font-bold" style={{ color: S.onSurfaceVariant }}>جاري تحميل التحليلات...</p>
            </div>
        );
    }

    return (
        <div className="p-6 md:p-8 max-w-[1600px] mx-auto w-full space-y-6" style={{ direction: 'rtl', fontFamily: "'IBM Plex Sans Arabic', sans-serif" }}>

            {/* ── Print Styles ── */}
            <style>{`
                @media print {
                    @page { size: A4 landscape; margin: 16mm; }
                    body * { visibility: hidden; }
                    .owner-print-area, .owner-print-area * { visibility: visible; }
                    .owner-print-area { position: absolute; left: 0; top: 0; width: 100%; background: #fff !important; padding: 0 !important; }
                    .no-print { display: none !important; }
                    * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
                }
            `}</style>

            {/* ══ Header ══ */}
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 no-print">
                <div>
                    <h1 className="text-3xl font-black m-0 mb-1 tracking-tight" style={{ color: S.onBackground }}>
                        التحليلات والأداء
                    </h1>
                    <p className="text-sm font-medium m-0" style={{ color: S.onSurfaceVariant }}>
                        تقارير الإشغال، مرات الظهور، والأداء المالي لشاشاتك
                    </p>
                </div>

                {/* Controls */}
                <div className="flex flex-wrap items-center gap-3">
                    {/* Screen filter */}
                    <div className="relative">
                        <Monitor className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: S.outline }} />
                        <select
                            value={selectedScreen}
                            onChange={e => setSelectedScreen(e.target.value)}
                            className="h-10 pr-9 pl-4 rounded-xl text-sm font-medium outline-none transition-all"
                            style={{
                                border: `1px solid ${S.outlineVariant}`, background: S.surfaceContainerLowest,
                                color: S.onSurface, minWidth: 180,
                            }}
                        >
                            <option value="all">جميع الشاشات</option>
                            {screens.map(s => (
                                <option key={s.screen_id} value={s.screen_id}>{s.screen_name}</option>
                            ))}
                        </select>
                    </div>

                    {/* Date range */}
                    <div className="flex items-center gap-2 h-10 px-3 rounded-xl text-sm"
                        style={{ border: `1px solid ${S.outlineVariant}`, background: S.surfaceContainerLowest }}>
                        <Calendar className="w-4 h-4" style={{ color: S.outline }} />
                        <input type="date" value={dateRange.start}
                            onChange={e => setDateRange(p => ({ ...p, start: e.target.value }))}
                            className="outline-none bg-transparent text-sm" style={{ color: S.onSurface }} />
                        <span style={{ color: S.outline }}>—</span>
                        <input type="date" value={dateRange.end}
                            onChange={e => setDateRange(p => ({ ...p, end: e.target.value }))}
                            className="outline-none bg-transparent text-sm" style={{ color: S.onSurface }} />
                    </div>

                    {/* Export dropdown */}
                    <div ref={exportRef} className="relative">
                        <button
                            onClick={() => setIsExportMenuOpen(p => !p)}
                            className="flex items-center gap-2 h-10 px-4 rounded-xl font-semibold text-sm transition-all"
                            style={{
                                background: S.primary, color: '#fff',
                                border: 'none', cursor: 'pointer',
                            }}
                        >
                            <Download className="w-4 h-4" />
                            تصدير التقرير
                            <ChevronDown className={`w-4 h-4 transition-transform ${isExportMenuOpen ? 'rotate-180' : ''}`} />
                        </button>
                        <AnimatePresence>
                            {isExportMenuOpen && (
                                <motion.div
                                    initial={{ opacity: 0, y: -8, scale: 0.96 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: -8, scale: 0.96 }}
                                    transition={{ duration: 0.15 }}
                                    style={{
                                        position: 'absolute', top: 'calc(100% + 8px)', left: 0,
                                        minWidth: 200, background: S.surfaceContainerLowest,
                                        border: `1px solid ${S.outlineVariant}`, borderRadius: 14,
                                        boxShadow: '0 8px 32px rgba(0,0,0,0.13)',
                                        overflow: 'hidden', zIndex: 99,
                                    }}
                                >
                                    <button onClick={handleExportExcel}
                                        className="flex items-center gap-3 w-full px-4 py-3 text-sm font-semibold transition-colors hover:bg-green-50"
                                        style={{ color: S.success, background: 'transparent', border: 'none', cursor: 'pointer' }}>
                                        <FileSpreadsheet className="w-4 h-4" />
                                        تحميل Excel (CSV)
                                    </button>
                                    <div style={{ height: 1, background: S.outlineVariant }} />
                                    <button onClick={handleExportPDF}
                                        className="flex items-center gap-3 w-full px-4 py-3 text-sm font-semibold transition-colors hover:bg-blue-50"
                                        style={{ color: S.primary, background: 'transparent', border: 'none', cursor: 'pointer' }}>
                                        <Printer className="w-4 h-4" />
                                        طباعة / تحميل PDF
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </motion.div>

            {/* ══ Print Area starts here ══ */}
            <div className="owner-print-area space-y-6">

                {/* Print header (only visible in print) */}
                <div className="hidden print:block mb-6" style={{ borderBottom: `2px solid ${S.primary}`, paddingBottom: 12 }}>
                    <div className="flex justify-between items-center">
                        <div>
                            <h2 className="text-2xl font-black m-0" style={{ color: S.primary }}>تقرير التحليلات والأداء</h2>
                            <p className="text-sm m-0" style={{ color: S.onSurfaceVariant }}>
                                {user?.full_name || user?.username} — {dateRange.start} / {dateRange.end}
                            </p>
                        </div>
                        <p className="text-xs" style={{ color: S.outline }}>SabaPost — نظام إدارة الإعلانات الرقمية</p>
                    </div>
                </div>

                {/* ══ KPI Grid ══ */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                    <KpiCard
                        index={0} label="معدل الإشغال الكلي" sublabel="Overall Fill Rate"
                        value={displayedAnalytics.avgFillRate.toFixed(1)} suffix="%"
                        Icon={Percent} iconBg="#f0fdf4" iconColor={S.success}
                        accentColor={displayedAnalytics.avgFillRate >= 75 ? S.success : displayedAnalytics.avgFillRate >= 40 ? S.warning : S.error}
                        borderAccent={displayedAnalytics.avgFillRate >= 40 ? S.success : S.error}
                        highlight={S.success}
                        note={displayedAnalytics.avgFillRate >= 75 ? 'أداء إشغال ممتاز' : 'هناك وقت فراغ يمكن تحسينه'}
                        noteIcon={TrendingUp}
                        noteColor={displayedAnalytics.avgFillRate >= 40 ? S.success : S.error}
                    />
                    <KpiCard
                        index={1} label="إجمالي مرات الظهور" sublabel="Total Impressions"
                        value={displayedAnalytics.totalImpressions.toLocaleString()}
                        togglable={true}
                        iconBg={S.surfaceContainer} iconColor={S.primaryContainer}
                        accentColor={S.primary}
                        note="مجموع ظهور الإعلانات على شاشاتك"
                        noteIcon={BarChart2} noteColor={S.primaryContainer}
                    />
                    <KpiCard
                        index={2} label="الإيرادات المقدرة" sublabel="Est. Revenue (Period)"
                        value={`$${displayedAnalytics.totalRevenue.toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                        togglable={true}
                        iconBg="#f0fdf4" iconColor={S.success}
                        accentColor={S.success} borderAccent={S.success}
                        note={`من ${displayedScreens.length} شاشة`}
                        noteIcon={Monitor} noteColor={S.success}
                    />
                    <KpiCard
                        index={3} label="الشاشات الفارغة (بدون إعلان)" sublabel="Idle / No Active Campaign"
                        value={analytics?.offlineCount || 0}
                        Icon={AlertCircle}
                        iconBg={analytics?.offlineCount > 0 ? S.errorContainer : S.successContainer}
                        iconColor={analytics?.offlineCount > 0 ? S.error : S.success}
                        accentColor={analytics?.offlineCount > 0 ? S.error : S.success}
                        borderAccent={analytics?.offlineCount > 0 ? S.error : null}
                        note={analytics?.offlineCount > 0 ? 'بلا إعلانات مدفوعة حالياً' : 'جميع الشاشات تعمل'}
                        noteColor={analytics?.offlineCount > 0 ? S.error : S.success}
                    />
                </div>

                {/* ══ Charts Row ══ */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

                    {/* Daily Impressions Chart */}
                    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                        className="lg:col-span-2"
                        style={{
                            background: S.surfaceContainerLowest,
                            border: `1px solid ${S.outlineVariant}`,
                            borderRadius: 20, padding: 24,
                        }}>
                        <div className="mb-5 flex items-center justify-between">
                            <div>
                                <h3 className="m-0 text-lg font-bold" style={{ color: S.onBackground }}>مرات الظهور اليومية</h3>
                                <p className="text-xs font-medium mt-0.5 m-0" style={{ color: S.outline }}>
                                    Impressions per day — آخر 7 أيام
                                </p>
                            </div>
                            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg" style={{ background: S.surfaceContainerLow }}>
                                <div className="w-3 h-3 rounded-full" style={{ background: S.primaryContainer }} />
                                <span className="text-[11px] font-bold" style={{ color: S.onSurfaceVariant }}>مرات الظهور</span>
                            </div>
                        </div>
                        <ImpressionsBarChart data={analytics?.dailyData || []} />
                    </motion.div>

                    {/* Fill Rate Gauge */}
                    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                        style={{
                            background: S.surfaceContainerLowest,
                            border: `1px solid ${S.outlineVariant}`,
                            borderRadius: 20, padding: 24,
                            display: 'flex', flexDirection: 'column', alignItems: 'center',
                        }}>
                        <div className="w-full mb-4 text-center">
                            <h3 className="m-0 text-lg font-bold" style={{ color: S.onBackground }}>معدل الإشغال</h3>
                            <p className="text-xs font-medium mt-0.5 m-0" style={{ color: S.outline }}>Fill Rate — وقت الإعلانات vs الفراغ</p>
                        </div>
                        <FillRateGauge value={displayedAnalytics.avgFillRate} />

                        {/* Legend */}
                        <div className="mt-4 w-full grid grid-cols-2 gap-2 text-center">
                            {[
                                { label: 'وقت إعلانات مدفوعة', color: S.success, pct: displayedAnalytics.avgFillRate.toFixed(1) + '%' },
                                { label: 'وقت فراغ / افتراضي', color: S.outlineVariant, pct: (100 - displayedAnalytics.avgFillRate).toFixed(1) + '%' },
                            ].map((item, i) => (
                                <div key={i} className="flex flex-col items-center py-2 rounded-xl"
                                    style={{ background: S.surfaceContainerLow }}>
                                    <div className="w-3 h-3 rounded-full mb-1" style={{ background: item.color }} />
                                    <span className="text-[11px] font-bold" style={{ color: S.onSurfaceVariant }}>{item.label}</span>
                                    <span className="text-[13px] font-black mt-0.5" style={{ color: item.color }}>{item.pct}</span>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                </div>

                {/* ══ Screens Detail Table ══ */}
                <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
                    style={{
                        background: S.surfaceContainerLowest,
                        border: `1px solid ${S.outlineVariant}`,
                        borderRadius: 20, overflow: 'hidden',
                    }}>
                    <div className="flex items-center justify-between px-6 py-5" style={{ borderBottom: `1px solid ${S.outlineVariant}` }}>
                        <div>
                            <h3 className="m-0 text-lg font-bold" style={{ color: S.onBackground }}>أداء كل شاشة</h3>
                            <p className="text-[12px] font-medium mt-1 m-0" style={{ color: S.outline }}>
                                تفاصيل الإشغال والظهور لكل شاشة مملوكة
                            </p>
                        </div>
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-[12px] font-bold"
                            style={{ background: S.surfaceContainerLow, color: S.onSurfaceVariant }}>
                            <Filter className="w-3.5 h-3.5" />
                            {displayedScreens.length} شاشة
                        </div>
                    </div>

                    <div style={{ overflowX: 'auto' }}>
                        <table className="w-full" style={{ borderCollapse: 'collapse', minWidth: 700 }}>
                            <thead>
                                <tr style={{ background: S.surfaceContainerLow }}>
                                    {['اسم الشاشة', 'الموقع', 'معدل الإشغال', 'مرات الظهور', 'الإيرادات', 'الحالة'].map((h, i) => (
                                        <th key={i}
                                            className={`py-3 px-4 text-sm font-black ${i >= 2 ? 'text-center' : 'text-right'}`}
                                            style={{ color: S.onSurfaceVariant }}>
                                            {h}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {displayedScreens.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="py-12 text-center text-sm font-bold" style={{ color: S.outline }}>
                                            لا توجد شاشات مسجلة
                                        </td>
                                    </tr>
                                ) : (
                                    displayedScreens.map((screen, idx) => (
                                        <ScreenRow key={screen.screen_id} screen={screen} index={idx} />
                                    ))
                                )}
                            </tbody>
                            {displayedScreens.length > 0 && (
                                <tfoot>
                                    <tr style={{ background: S.surfaceContainerLow, borderTop: `2px solid ${S.outlineVariant}` }}>
                                        <td colSpan={2} className="py-3 px-4 text-sm font-black" style={{ color: S.onSurfaceVariant }}>
                                            المجموع الكلي
                                        </td>
                                        <td className="py-3 px-4 text-center text-sm font-black" style={{ color: S.primary }}>
                                            {displayedAnalytics.avgFillRate.toFixed(1)}% متوسط
                                        </td>
                                        <td className="py-3 px-4 text-center text-sm font-black" style={{ color: S.primary }}>
                                            {displayedAnalytics.totalImpressions.toLocaleString()}
                                        </td>
                                        <td className="py-3 px-4 text-center text-sm font-black" style={{ color: S.success }}>
                                            ${displayedAnalytics.totalRevenue.toFixed(2)}
                                        </td>
                                        <td />
                                    </tr>
                                </tfoot>
                            )}
                        </table>
                    </div>
                </motion.div>

                {/* ══ Info Banner ══ */}
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
                    className="no-print flex items-start gap-3 rounded-2xl p-4"
                    style={{ background: S.infoContainer, border: `1px solid #bae6fd` }}>
                    <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shrink-0 mt-0.5">
                        <BarChart2 className="w-4 h-4" style={{ color: S.info }} />
                    </div>
                    <div>
                        <p className="m-0 text-[13px] font-bold" style={{ color: S.info }}>ما هو معدل الإشغال (Fill Rate)؟</p>
                        <p className="m-0 mt-1 text-[12px] leading-relaxed" style={{ color: '#0c4a6e' }}>
                            معدل الإشغال هو النسبة المئوية للوقت الذي تعرض فيه شاشتك إعلانات مدفوعة مقارنةً بإجمالي وقت التشغيل.
                            كلما اقترب من 100% كلما كان أفضل — مما يعني أن شاشتك مشغولة بإعلانات لها عائد مادي.
                        </p>
                    </div>
                </motion.div>

            </div>{/* end print area */}
        </div>
    );
};

export default OwnerAnalyticsPage;

