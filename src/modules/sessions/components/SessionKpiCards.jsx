import React from 'react';
import { motion } from 'framer-motion';
import useTranslation from '../../../i18n/useTranslation';

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
const KpiCard = ({ title, value }) => (
    <motion.div
        variants={itemVariants}
        className="bg-surface-container-lowest border border-outline-variant rounded-xl py-3 px-4 shadow-sm flex flex-col items-center justify-center text-center gap-1"
    >
        <p className="text-base sm:text-lg font-bold text-on-surface">{title}</p>
        <p className="text-lg font-normal text-on-surface-variant">{value ?? '—'}</p>
    </motion.div>
);

/* ─── Skeleton Card  ─── */
const KpiSkeleton = () => (
    <div className="bg-surface-container-lowest border border-outline-variant rounded-xl py-3 px-4 shadow-sm flex flex-col items-center justify-center text-center gap-2 animate-pulse">
        <div className="h-4 bg-surface-variant rounded-lg w-28"></div>
        <div className="h-5 bg-surface-variant rounded-lg w-12"></div>
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
    const { t } = useTranslation();
    const otherSessions = sessions.filter(s => !s.is_current);
    const deviceTypes   = [...new Set(sessions.map(s => guessDeviceType(s.device_name)))].length;

    /* Security score: 100% if no other sessions, penalise proportionally */
    const secScore = sessions.length === 0
        ? 100
        : Math.max(0, Math.round(100 - (otherSessions.length / sessions.length) * 60));

    if (loading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {Array.from({ length: 3 }).map((_, i) => <KpiSkeleton key={i} />)}
            </div>
        );
    }

    return (
        <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 md:grid-cols-3 gap-4"
        >
            <KpiCard
                title={t('sessions.total_sessions')}
                value={sessions.length}
            />
            <KpiCard
                title={t('sessions.device_types')}
                value={deviceTypes}
            />
            <KpiCard
                title={t('sessions.security_level')}
                value={`${secScore}%`}
            />
        </motion.div>
    );
};

export default SessionKpiCards;
