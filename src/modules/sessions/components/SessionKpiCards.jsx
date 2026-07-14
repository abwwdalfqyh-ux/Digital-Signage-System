import React from 'react';
import { motion } from 'framer-motion';

/* ─── Animation Variants (matches project style) ─── */
const containerVariants = {
    hidden: { opacity: 0 },
    show:   { opacity: 1, transition: { staggerChildren: 0.07 } },
};
const itemVariants = {
    hidden: { opacity: 0, y: 18 },
    show:   { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 280, damping: 22 } },
};

/* ─── Single KPI Card ─── */
const KpiCard = ({ title, value, icon, colorClass, isProgress, secScore }) => (
    <motion.div
        variants={itemVariants}
        className="bg-surface-container-lowest border border-outline-variant rounded-xl p-lg shadow-sm flex flex-row items-center justify-between gap-4"
    >
        <div>
            <p className="font-label-md text-label-md text-on-surface-variant">{title}</p>
            <p className="font-headline-lg text-headline-lg text-on-surface font-bold mt-sm">{value ?? '—'}</p>
        </div>
        {isProgress ? (
            <div className="relative w-12 h-12 flex-shrink-0">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                    <path className="text-surface-variant" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3"></path>
                    <path className="text-primary" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeDasharray={`${secScore}, 100`} strokeWidth="3"></path>
                </svg>
            </div>
        ) : (
            <div className={`p-sm rounded-full flex items-center justify-center flex-shrink-0 ${colorClass}`}>
                <span className="material-symbols-outlined">{icon}</span>
            </div>
        )}
    </motion.div>
);

/* ─── Skeleton Card  ─── */
const KpiSkeleton = () => (
    <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-lg shadow-sm flex flex-row items-center justify-between animate-pulse">
        <div className="space-y-2">
            <div className="h-4 bg-surface-variant rounded-lg w-24"></div>
            <div className="h-8 bg-surface-variant rounded-lg w-12"></div>
        </div>
        <div className="w-12 h-12 rounded-full bg-surface-variant shrink-0 mt-4 md:mt-0"></div>
    </div>
);

/* ─── Helper: count unique device types ─── */
const guessDeviceType = (deviceName = '') => {
    const n = deviceName.toLowerCase();
    if (/mobile|iphone|android|pixel|samsung|xiaomi|huawei|galaxy|oppo|vivo/.test(n)) return 'mobile';
    if (/ipad|tablet/.test(n)) return 'tablet';
    return 'desktop';
};

/* ═══════════════════════════════
   Exported Component
   ═══════════════════════════════ */
const SessionKpiCards = ({ sessions = [], loading = false }) => {
    const otherSessions = sessions.filter(s => !s.is_current);
    const deviceTypes   = [...new Set(sessions.map(s => guessDeviceType(s.device_name)))].length;

    /* Security score: 100% if no other sessions, penalise proportionally */
    const secScore = sessions.length === 0
        ? 100
        : Math.max(0, Math.round(100 - (otherSessions.length / sessions.length) * 60));

    if (loading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-md">
                {Array.from({ length: 4 }).map((_, i) => <KpiSkeleton key={i} />)}
            </div>
        );
    }

    return (
        <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-md"
        >
            <KpiCard
                title="إجمالي الجلسات"
                value={sessions.length}
                icon="devices"
                colorClass="bg-primary-container/10 text-primary"
            />
            <KpiCard
                title="جلسات أخرى"
                value={otherSessions.length}
                icon="multiple_stop"
                colorClass="bg-secondary-container/20 text-secondary"
            />
            <KpiCard
                title="أنواع الأجهزة"
                value={deviceTypes}
                icon="laptop_mac"
                colorClass="bg-surface-variant text-on-surface-variant"
            />
            <KpiCard
                title="مستوى الأمان"
                value={`${secScore}%`}
                isProgress={true}
                secScore={secScore}
            />
        </motion.div>
    );
};

export default SessionKpiCards;
