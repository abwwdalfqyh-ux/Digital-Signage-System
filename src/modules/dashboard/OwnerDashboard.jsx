import React, { useState, useEffect, useRef } from 'react';
import { Monitor, DollarSign, Activity, AlertCircle, RefreshCw, TrendingUp, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axiosClient from '../../core/api/axiosClient';
import { ENDPOINTS } from '../../core/api/endpoints';
import useToastStore from '../../store/useToastStore';
import { useOwnerDashboard } from '../../hooks/api/useDashboard';

/* ─── Stitch colour tokens ─── */
const S = {
    primary: '#004ac6',
    primaryContainer: '#2563eb',
    secondary: '#0060ac',
    secondaryFixed: '#d4e3ff',
    surfaceContainerLowest: '#ffffff',
    surfaceContainerLow: '#f1f3ff',
    surfaceContainer: '#e9edff',
    surfaceContainerHigh: '#e1e8fd',
    onBackground: '#141b2b',
    onSurface: '#141b2b',
    onSurfaceVariant: '#434655',
    outline: '#737686',
    outlineVariant: '#c3c6d7',
    primaryFixed: '#dbe1ff',
    error: '#ba1a1a',
    errorContainer: '#ffdad6',
    success: '#166534',
    successContainer: '#dcfce7',
    warning: '#eab308',
};

/* ══════════════════════════════════════════════════════
   KPI CARD  
══════════════════════════════════════════════════════ */
const KpiCard = ({ label, sublabel, value, note, noteIcon: NoteIcon, noteColor, accentColor, iconBg, iconColor, Icon, borderAccent, index }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: index * 0.07 }}
        whileHover={{ y: -3, boxShadow: '0 8px 24px -4px rgba(0,74,198,0.14)' }}
        className="flex flex-col justify-between relative overflow-hidden"
        style={{
            background: S.surfaceContainerLowest,
            border: `1px solid ${S.outlineVariant}`,
            borderRadius: '16px',
            padding: '22px 22px 18px',
            minHeight: '130px',
            borderRight: borderAccent ? `4px solid ${borderAccent}` : `1px solid ${S.outlineVariant}`,
            direction: 'rtl',
        }}
    >
        <div className="flex justify-between items-start mb-4">
            <div>
                <p className="m-0 text-[14px] font-bold text-gray-500">{label}</p>
                {sublabel && <p className="mt-1 text-[11px] text-gray-400 font-medium">{sublabel}</p>}
            </div>
            {Icon && (
                <div style={{ background: iconBg || S.surfaceContainer }} className="w-11 h-11 rounded-full flex items-center justify-center shrink-0">
                    <Icon style={{ color: iconColor || S.primaryContainer }} className="w-5 h-5" />
                </div>
            )}
        </div>
        <div>
            <div className="flex items-baseline gap-1" dir="ltr">
                <span className="text-[36px] font-black leading-none" style={{ color: accentColor || S.onBackground, letterSpacing: '-0.02em' }}>
                    {value}
                </span>
            </div>
            {note && (
                <div className="flex items-center gap-1.5 mt-2" style={{ color: noteColor || S.primaryContainer }}>
                    {NoteIcon && <NoteIcon className="w-4 h-4" />}
                    <span className="text-[12px] font-bold">{note}</span>
                </div>
            )}
        </div>
    </motion.div>
);

/* ══════════════════════════════════════════════════════
   WEEKLY REVENUE SVG CHART
══════════════════════════════════════════════════════ */
const WeeklyChart = ({ data = [] }) => {
    const svgRef = useRef(null);
    const [tip, setTip] = useState(null);

    const W = 580, H = 220, pL = 52, pR = 16, pT = 16, pB = 32;
    const iW = W - pL - pR, iH = H - pT - pB;

    const WEEK_DAYS = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
    const pts = data.length > 0
        ? data.map(item => ({ label: item.day, value: Number(item.amount) }))
        : WEEK_DAYS.map(d => ({ label: d, value: 0 }));

    const maxV = Math.max(...pts.map(p => p.value), 100);
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

    const yTicks = [0, 0.25, 0.5, 0.75, 1].map(r => ({ v: maxV * r, y: pT + iH - r * iH }));

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
            <svg ref={svgRef} viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', overflow: 'visible' }} onMouseMove={onMove} onMouseLeave={() => setTip(null)}>
                <defs>
                    <linearGradient id="ownerChartGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={S.success} stopOpacity="0.25" />
                        <stop offset="100%" stopColor={S.success} stopOpacity="0" />
                    </linearGradient>
                    <filter id="glowGreen" x="-20%" y="-20%" width="140%" height="140%">
                        <feGaussianBlur stdDeviation="2" result="blur" />
                        <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                    </filter>
                </defs>

                {yTicks.map((t, i) => (
                    <g key={i}>
                        <line x1={pL} y1={t.y} x2={W - pR} y2={t.y} stroke={S.outlineVariant} strokeOpacity="0.5" strokeDasharray={i === 0 ? 'none' : '4 4'} strokeWidth="1" />
                        <text x={pL - 6} y={t.y + 4} textAnchor="end" fontSize="10" fill={S.outline} fontFamily="'IBM Plex Sans Arabic',sans-serif">
                            {t.v >= 1000 ? `$${(t.v / 1000).toFixed(1)}k` : `$${Math.round(t.v)}`}
                        </text>
                    </g>
                ))}
                <path d={areaPath} fill="url(#ownerChartGradient)" />
                <path d={linePath} fill="none" stroke={S.success} strokeWidth="3" strokeLinecap="round" filter="url(#glowGreen)" />
                {coords.map(([x, y], i) => (
                    <g key={i}>
                        <circle cx={x} cy={y} r="6" fill={S.surfaceContainerLowest} stroke={S.success} strokeWidth="2.5" />
                        <circle cx={x} cy={y} r="2.5" fill={S.success} />
                    </g>
                ))}
                {pts.map((p, i) => (
                    <text key={i} x={xOf(i)} y={H - 4} textAnchor="middle" fontSize="11" fill={S.outline} fontWeight="bold" fontFamily="'IBM Plex Sans Arabic',sans-serif">
                        {p.label}
                    </text>
                ))}
                {tip && (
                    <g>
                        <line x1={tip.x} y1={pT} x2={tip.x} y2={pT + iH} stroke={S.success} strokeOpacity="0.35" strokeDasharray="4 3" />
                        <circle cx={tip.x} cy={tip.y} r="8" fill={S.success} fillOpacity="0.2" />
                        <circle cx={tip.x} cy={tip.y} r="4" fill={S.success} />
                        <rect x={tip.x - 36} y={tip.y - 34} width="72" height="24" rx="6" fill={S.onBackground} />
                        <text x={tip.x} y={tip.y - 18} textAnchor="middle" fontSize="12" fill="#fff" fontWeight="bold" fontFamily="'IBM Plex Sans Arabic',sans-serif">
                            ${tip.value.toLocaleString()}
                        </text>
                    </g>
                )}
            </svg>
        </div>
    );
};

/* ══════════════════════════════════════════════════════
   DONUT CHART 
══════════════════════════════════════════════════════ */
const StatusDonutChart = ({ data = [] }) => {
    const cx = 90, cy = 90, R = 75, r = 50;
    const total = data.reduce((s, d) => s + (d.count || 0), 0) || 1;

    let angle = -Math.PI / 2;
    const slices = data.map((d, i) => {
        const pct = d.count / total;
        const a1 = angle;
        const a2 = angle + pct * 2 * Math.PI;
        const lrg = pct > 0.5 ? 1 : 0;
        const x1 = cx + R * Math.cos(a1), y1 = cy + R * Math.sin(a1);
        const x2 = cx + R * Math.cos(a2), y2 = cy + R * Math.sin(a2);
        const xi1 = cx + r * Math.cos(a1), yi1 = cy + r * Math.sin(a1);
        const xi2 = cx + r * Math.cos(a2), yi2 = cy + r * Math.sin(a2);
        angle = a2;
        return {
            path: `M ${xi1} ${yi1} L ${x1} ${y1} A ${R} ${R} 0 ${lrg} 1 ${x2} ${y2} L ${xi2} ${yi2} A ${r} ${r} 0 ${lrg} 0 ${xi1} ${yi1} Z`,
            color: d.color, name: d.name, pct: Math.round(pct * 100), count: d.count
        };
    });

    return (
        <div className="flex flex-col items-center gap-6">
            <div style={{ position: 'relative', width: '180px', height: '180px' }}>
                <svg viewBox="0 0 180 180" style={{ width: '100%', height: '100%', direction: 'ltr' }}>
                    {slices.map((s, i) => (
                        <motion.path 
                            key={i} d={s.path} fill={s.color}
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ duration: 0.5, delay: i * 0.1 }}
                            whileHover={{ scale: 1.05 }}
                            style={{ transformOrigin: 'center', cursor: 'pointer' }}
                        />
                    ))}
                    <text x={cx} y={cy - 5} textAnchor="middle" fontSize="22" fontWeight="900" fill={S.onBackground}>
                        {total}
                    </text>
                    <text x={cx} y={cy + 15} textAnchor="middle" fontSize="12" fontWeight="600" fill={S.outline}>
                        إجمالي الشاشات
                    </text>
                </svg>
            </div>
            
            <div className="w-full flex justify-center gap-4">
                {slices.map((s, i) => (
                    <div key={i} className="flex flex-col items-center bg-gray-50 px-3 py-2 rounded-xl border border-gray-100">
                        <div className="flex items-center gap-1.5 mb-1">
                            <span className="w-2.5 h-2.5 rounded-full" style={{ background: s.color }} />
                            <span className="text-[12px] font-bold text-gray-600">{s.name}</span>
                        </div>
                        <span className="font-black text-lg" style={{ color: s.color }}>{s.count}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

/* ══════════════════════════════════════════════════════
   OWNER DASHBOARD COMPONENT
══════════════════════════════════════════════════════ */
const OwnerDashboard = () => {
    const { data: dashboardData, isLoading: loading } = useOwnerDashboard();
    const kpis = dashboardData || {};

    const stats = {
        total_screens: kpis.kpis?.total_screens ?? kpis.total_screens ?? 0,
        online_screens: kpis.kpis?.active_screens ?? kpis.active_screens ?? 0,
        offline_screens: (kpis.kpis?.total_screens ?? 0) - (kpis.kpis?.active_screens ?? 0),
        monthly_revenue: kpis.kpis?.monthly_earnings ?? kpis.monthly_earnings ?? 0,
        today_revenue: kpis.kpis?.today_earnings ?? kpis.today_earnings ?? 0,
        revenue_growth: '+0%', // Can be calculated from history
        notifications: kpis.financial_activities ? kpis.financial_activities.length : 0
    };

    let weeklyData = [
        { day: 'Sun', amount: 0 }, { day: 'Mon', amount: 0 }, { day: 'Tue', amount: 0 },
        { day: 'Wed', amount: 0 }, { day: 'Thu', amount: 0 }, { day: 'Fri', amount: 0 }, { day: 'Sat', amount: 0 }
    ];
    if (kpis.charts && kpis.charts.weekly_revenue) {
        weeklyData = kpis.charts.weekly_revenue;
    }

    const quickAlerts = (kpis.financial_activities || []).map(act => {
        let text = act.text;
        try {
            const parsed = JSON.parse(text);
            text = parsed.rejection_reason 
                ? `رفض سحب: ${parsed.rejection_reason}` 
                : (parsed.bank_name ? `سحب بنكي - ${parsed.bank_name}` : text);
        } catch(e) {}
        return {
            id: act.id,
            text: text,
            type: act.type,
            time: act.time
        };
    });

    if (loading) {
        return <div className="flex justify-center py-20"><RefreshCw className="w-10 h-10 animate-spin text-blue-600" /></div>;
    }

    const donutData = [
        { name: 'متصلة (Online)', count: stats.online_screens, color: S.success },
        { name: 'مقطوعة (Offline)', count: stats.offline_screens, color: S.error },
    ];

    return (
        <div className="p-6 md:p-8 space-y-6 max-w-[1600px] mx-auto w-full" style={{ direction: 'rtl', fontFamily: "'IBM Plex Sans Arabic', sans-serif" }}>
            
            {/* ── Header ── */}
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="mb-6 flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-black text-[#141b2b] m-0 mb-2 tracking-tight">نظرة عامة على الأصول</h1>
                    <p className="text-sm font-medium text-gray-500 m-0">مراقبة الأداء، الإيرادات، والحالة التشغيلية لشاشاتك.</p>
                </div>
            </motion.div>

            {/* ── KPI Grid ── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <KpiCard label="أرباح اليوم" sublabel="خلال 24 ساعة الماضية" value={`$${stats.today_revenue || 0}`} note="+5% عن الأمس" noteIcon={TrendingUp} noteColor={S.success} accentColor={S.primary} iconBg={S.primaryFixed} iconColor={S.primary} Icon={DollarSign} borderAccent={S.primary} index={0} />
                <KpiCard label="إجمالي الأرباح" sublabel="أرباح هذا الشهر" value={`$${stats.monthly_revenue || 0}`} note="+12% عن الشهر الماضي" noteIcon={TrendingUp} noteColor={S.success} accentColor={S.secondary} iconBg={S.secondaryFixed} iconColor={S.secondaryContainer} Icon={Activity} borderAccent={S.secondary} index={1} />
                <KpiCard
                    index={2} label="إجمالي الأصول (الشاشات)" sublabel="Total Screens Owned" value={stats.total_screens}
                    Icon={Monitor} iconBg={S.surfaceContainer} iconColor={S.primaryContainer}
                />
                <KpiCard
                    index={3} label="تنبيهات وأعطال" sublabel="Offline / Action Required" value={stats.offline_screens}
                    Icon={AlertCircle} iconBg={S.errorContainer} iconColor={S.error} accentColor={S.error} borderAccent={stats.offline_screens > 0 ? S.error : null}
                />
            </div>

            {/* ── Charts Row ── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Revenue Growth Chart (Area SVG) */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="lg:col-span-2"
                    style={{ background: S.surfaceContainerLowest, border: `1px solid ${S.outlineVariant}`, borderRadius: '20px', padding: '24px' }}>
                    <div className="mb-6">
                        <h3 className="m-0 text-lg font-bold text-[#141b2b]">نمو الأرباح اليومية</h3>
                        <p className="text-xs text-gray-400 font-medium">نظرة تحليلية على العوائد المالية آخر 7 أيام</p>
                    </div>
                    <WeeklyChart data={weeklyData} />
                </motion.div>

                {/* Status Donut Chart */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                    style={{ background: S.surfaceContainerLowest, border: `1px solid ${S.outlineVariant}`, borderRadius: '20px', padding: '24px' }}>
                    <div className="mb-4 text-center">
                        <h3 className="m-0 text-lg font-bold text-[#141b2b]">الحالة التشغيلية</h3>
                    </div>
                    <StatusDonutChart data={donutData} />
                </motion.div>

            </div>
            
            {/* ── Quick Alerts Row ── */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
                style={{ background: S.surfaceContainerLowest, border: `1px solid ${S.outlineVariant}`, borderRadius: '20px', padding: '24px' }}>
                <div className="flex items-center gap-2 mb-6 border-b border-gray-100 pb-4">
                    <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center">
                        <Info className="w-4 h-4 text-blue-600" />
                    </div>
                    <h3 className="m-0 text-lg font-bold text-[#141b2b]">الإشعارات والتحديثات الحية</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <AnimatePresence>
                        {quickAlerts.length === 0 ? (
                            <div className="col-span-1 md:col-span-3 text-center text-gray-400 py-8 font-medium">
                                لا توجد نشاطات أو تحديثات حية حالياً.
                            </div>
                        ) : quickAlerts.map(alert => (
                            <motion.div key={alert.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="group"
                                style={{
                                    padding: '20px', borderRadius: '16px',
                                    background: alert.type === 'error' ? S.errorContainer : S.successContainer,
                                    border: `1px solid ${alert.type === 'error' ? 'rgba(186, 26, 26, 0.2)' : 'rgba(22, 101, 52, 0.2)'}`,
                                    transition: 'all 0.3s'
                                }}>
                                <div className="flex items-center justify-between mb-3">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${alert.type === 'error' ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                                        {alert.type === 'error' ? <AlertCircle className="w-5 h-5" /> : <Activity className="w-5 h-5" />}
                                    </div>
                                    <span className="text-[11px] font-black opacity-60" style={{ color: alert.type === 'error' ? S.error : S.success }}>{alert.time}</span>
                                </div>
                                <p className="m-0 text-sm font-bold leading-relaxed" style={{ color: alert.type === 'error' ? '#93000a' : '#052e16' }}>{alert.text}</p>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            </motion.div>
            
        </div>
    );
};

export default OwnerDashboard;

