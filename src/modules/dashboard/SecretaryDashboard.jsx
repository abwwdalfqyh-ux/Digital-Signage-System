import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Megaphone, Monitor, DollarSign, RefreshCw, Users, AlertCircle, PlayCircle, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';
import axiosClient from '../../core/api/axiosClient';
import { ENDPOINTS } from '../../core/api/endpoints';
import useToastStore from '../../store/useToastStore';
import useTranslation from '../../i18n/useTranslation';

/* ─── Stitch colour tokens ─── */
const S = {
    primary: '#004ac6',
    primaryContainer: '#2563eb',
    onPrimaryContainer: '#eeefff',
    secondary: '#0060ac',
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
    error: '#ba1a1a',
    errorContainer: '#ffdad6',
};

/* ══════════════════════════════════════════════════════
   KPI CARD
══════════════════════════════════════════════════════ */
const KpiCard = ({
    label, value, 
    iconBg, iconColor, Icon,
    borderAccent, index, onClick
}) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: index * 0.05 }}
        onClick={onClick}
        className={`group relative overflow-hidden bg-white rounded-2xl p-5 sm:p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_24px_rgba(0,0,0,0.06)] cursor-pointer flex flex-col justify-between min-h-[140px]`}
        style={{
            border: `1px solid ${S.outlineVariant}`,
            borderRight: `4px solid ${borderAccent}`
        }}
    >
        <div className="flex items-start justify-between">
            <div className="flex flex-col gap-1 z-10">
                <span className="font-label-md text-on-surface-variant/80 tracking-wide">
                    {label}
                </span>
                <div className="flex items-baseline gap-2">
                    <span className="font-display-md text-on-surface tracking-tight" style={{ fontWeight: 700 }}>
                        {value}
                    </span>
                </div>
            </div>

            <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-110 z-10"
                style={{ backgroundColor: iconBg, color: iconColor }}
            >
                <Icon strokeWidth={2} size={24} />
            </div>
        </div>
    </motion.div>
);

const SecretaryDashboard = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const addToast = useToastStore(state => state.addToast);
    const { t, dir } = useTranslation();
    const navigate = useNavigate();

    const fetchData = async (silent = false) => {
        if (!silent) setLoading(true);
        try {
            const res = await axiosClient.get('/dashboard/secretary-overview');
            setData(res.data.data || res.data);
        } catch (e) {
            if (!silent) addToast(t('common.error'), 'error');
            console.error(e);
        } finally {
            if (!silent) setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        const interval = setInterval(() => fetchData(true), 60000);
        return () => clearInterval(interval);
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-surface">
                <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}>
                    <RefreshCw className="w-8 h-8 text-primary" />
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-surface p-4 sm:p-6 lg:p-8 font-sans" dir={dir}>
            <div className="max-w-7xl mx-auto space-y-6 lg:space-y-8">
                
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                    <div>
                        <motion.h1
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="font-display-md text-on-surface mb-2"
                        >
                            {t('dashboard.overview')}
                        </motion.h1>
                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.1 }}
                            className="font-body-md text-on-surface-variant flex items-center gap-2"
                        >
                            <ShieldCheck size={18} className="text-primary" />
                            {t('dashboard.welcome_secretary')}
                        </motion.p>
                    </div>

                    <motion.button
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => fetchData()}
                        className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-on-surface-variant font-label-md transition-colors bg-white hover:bg-surface-container hover:text-primary border border-outline-variant shadow-sm w-full sm:w-auto"
                    >
                        <RefreshCw size={18} />
                        <span>{t('common.refresh')}</span>
                    </motion.button>
                </div>

                {/* KPI Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
                    <KpiCard
                        label={t('dashboard.pending_ads')}
                        value={data?.pending_ads_count || 0}
                        iconBg="#fff3e0"
                        iconColor="#ea580c"
                        Icon={Megaphone}
                        borderAccent="#ea580c"
                        index={0}
                        onClick={() => navigate('/dashboard/ads')}
                    />
                    <KpiCard
                        label={t('dashboard.pending_receipts')}
                        value={data?.pending_payments_count || 0}
                        iconBg="#e0f2fe"
                        iconColor="#0284c7"
                        Icon={DollarSign}
                        borderAccent="#0284c7"
                        index={1}
                        onClick={() => navigate('/dashboard/payment-ops')}
                    />
                    <KpiCard
                        label={t('dashboard.offline_screens_count')}
                        value={data?.offline_screens_count || 0}
                        iconBg="#fee2e2"
                        iconColor="#dc2626"
                        Icon={AlertCircle}
                        borderAccent="#dc2626"
                        index={2}
                        onClick={() => navigate('/dashboard/screens')}
                    />
                    <KpiCard
                        label={t('dashboard.total_ads')}
                        value={data?.total_ads || 0}
                        iconBg="#e0e7ff"
                        iconColor="#4f46e5"
                        Icon={PlayCircle}
                        borderAccent="#4f46e5"
                        index={3}
                        onClick={() => navigate('/dashboard/ads')}
                    />
                </div>

                {/* Quick Actions or Info (Placeholder for future Ticket System) */}
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-white rounded-3xl p-6 lg:p-8 border border-outline-variant/50 shadow-sm"
                >
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-xl bg-primary-container/10 flex items-center justify-center text-primary">
                            <Users size={20} />
                        </div>
                        <h2 className="font-title-lg text-on-surface">{t('dashboard.support_system')}</h2>
                    </div>
                    <div className="flex flex-col items-center justify-center py-12 px-4 text-center border-2 border-dashed border-outline-variant/30 rounded-2xl bg-surface-container-lowest">
                        <div className="w-16 h-16 bg-surface-container rounded-full flex items-center justify-center mb-4">
                            <AlertCircle className="text-on-surface-variant w-8 h-8 opacity-50" />
                        </div>
                        <h3 className="font-title-md text-on-surface mb-2">{t('dashboard.system_under_dev')}</h3>
                        <p className="font-body-md text-on-surface-variant max-w-md">
                            {t('dashboard.ticket_system_soon')}
                        </p>
                    </div>
                </motion.div>

            </div>
        </div>
    );
};

export default SecretaryDashboard;
