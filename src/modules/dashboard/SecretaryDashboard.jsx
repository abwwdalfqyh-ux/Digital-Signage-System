import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Megaphone, DollarSign, RefreshCw, AlertCircle, PlayCircle, ShieldCheck,
    CheckCircle, XCircle, Clock, TrendingUp, FileText, ChevronRight,
    Activity, Users, Monitor, ArrowRight, Eye, Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axiosClient from '../../core/api/axiosClient';
import { ENDPOINTS } from '../../core/api/endpoints';
import useToastStore from '../../store/useToastStore';
import useTranslation from '../../i18n/useTranslation';

/* ─── Design Tokens ─── */
const S = {
    primary: '#004ac6',
    primaryContainer: '#2563eb',
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

/* ─── Status badge ─── */
const StatusPill = ({ status, t }) => {
    const cfg = {
        'Pending': { bg: '#fef3c7', color: '#b45309', label: t('secretary.status_pending'), dot: '#f59e0b' },
        'Active': { bg: '#dcfce7', color: '#16a34a', label: t('secretary.status_active'), dot: '#22c55e' },
        'Rejected': { bg: '#fee2e2', color: '#dc2626', label: t('secretary.status_rejected'), dot: '#ef4444' },
        'Paused': { bg: S.surfaceContainerHigh, color: S.onSurfaceVariant, label: t('secretary.status_paused'), dot: S.outline },
        'waiting_payment': { bg: '#fef3c7', color: '#b45309', label: t('secretary.status_waiting_payment'), dot: '#f59e0b' },
    };
    const c = cfg[status] || { bg: '#f3f4f6', color: '#6b7280', label: status, dot: '#9ca3af' };
    return (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '3px 10px', borderRadius: '999px', background: c.bg, color: c.color, fontSize: '11px', fontWeight: 600, whiteSpace: 'nowrap', fontFamily: "'IBM Plex Sans Arabic', sans-serif" }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: c.dot, display: 'inline-block', flexShrink: 0 }} />
            {c.label}
        </span>
    );
};

/* ─── KPI Card ─── */
const KpiCard = ({ label, value, subtitle, icon: Icon, iconBg, iconColor, borderColor, index, onClick, trend }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: index * 0.07 }}
        whileHover={{ y: -4, boxShadow: '0 12px 32px -8px rgba(0,74,198,0.14)' }}
        onClick={onClick}
        style={{
            background: S.surfaceContainerLowest, borderRadius: '18px', padding: '22px',
            border: `1px solid ${S.outlineVariant}`,
            borderRight: `4px solid ${borderColor || S.primaryContainer}`,
            cursor: onClick ? 'pointer' : 'default',
            display: 'flex', flexDirection: 'column', gap: '12px',
            transition: 'all 0.2s ease',
        }}
    >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
                <p style={{ margin: 0, fontSize: '13px', fontWeight: 500, color: S.outline, fontFamily: "'IBM Plex Sans Arabic', sans-serif" }}>{label}</p>
                {subtitle && <p style={{ margin: '2px 0 0', fontSize: '11px', color: S.outlineVariant, fontFamily: "'IBM Plex Sans Arabic', sans-serif" }}>{subtitle}</p>}
            </div>
            {Icon && (
                <div style={{ width: 42, height: 42, borderRadius: '12px', background: iconBg || S.surfaceContainer, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon style={{ width: 20, height: 20, color: iconColor || S.primaryContainer }} />
                </div>
            )}
        </div>
        <div>
            <span style={{ fontSize: '38px', fontWeight: 700, color: borderColor || S.onBackground, fontFamily: "'IBM Plex Sans Arabic', sans-serif", lineHeight: 1 }}>
                {value}
            </span>
            {trend && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '6px' }}>
                    <TrendingUp style={{ width: 13, height: 13, color: '#16a34a' }} />
                    <span style={{ fontSize: '11px', color: '#16a34a', fontFamily: "'IBM Plex Sans Arabic', sans-serif" }}>{trend}</span>
                </div>
            )}
        </div>
    </motion.div>
);

/* ─── Quick Action Card ─── */
const ActionCard = ({ title, desc, icon: Icon, iconBg, iconColor, onClick, badge }) => (
    <motion.div
        whileHover={{ y: -2, boxShadow: '0 8px 20px rgba(0,74,198,0.10)' }}
        whileTap={{ scale: 0.98 }}
        onClick={onClick}
        style={{
            background: S.surfaceContainerLowest, borderRadius: '16px', padding: '18px 20px',
            border: `1px solid ${S.outlineVariant}`, cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: '14px',
            transition: 'all 0.2s ease', position: 'relative',
        }}
    >
        <div style={{ width: 46, height: 46, borderRadius: '14px', background: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Icon style={{ width: 22, height: 22, color: iconColor }} />
        </div>
        <div style={{ flex: 1 }}>
            <p style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: S.onBackground, fontFamily: "'IBM Plex Sans Arabic', sans-serif" }}>{title}</p>
            <p style={{ margin: '2px 0 0', fontSize: '12px', color: S.outline, fontFamily: "'IBM Plex Sans Arabic', sans-serif" }}>{desc}</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {badge != null && badge > 0 && (
                <span style={{ padding: '2px 8px', borderRadius: '999px', background: '#fee2e2', color: '#dc2626', fontSize: '12px', fontWeight: 700, fontFamily: "'IBM Plex Sans Arabic', sans-serif" }}>
                    {badge}
                </span>
            )}
            <ChevronRight style={{ width: 16, height: 16, color: S.outline, transform: 'scaleX(-1)' }} />
        </div>
    </motion.div>
);

/* ─── Pending Ad Row ─── */
const PendingAdRow = ({ ad, onApprove, onReject, dir, t }) => (
    <motion.div
        initial={{ opacity: 0, x: 10 }}
        animate={{ opacity: 1, x: 0 }}
        style={{
            display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 16px',
            borderBottom: `1px solid ${S.outlineVariant}`, background: S.surfaceContainerLowest,
        }}
    >
        {/* Ad thumb */}
        <div style={{ width: 44, height: 44, borderRadius: '10px', background: S.surfaceContainerHigh, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Megaphone style={{ width: 20, height: 20, color: S.primaryContainer }} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ margin: 0, fontSize: '13px', fontWeight: 700, color: S.onBackground, fontFamily: "'IBM Plex Sans Arabic', sans-serif", overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {ad.title || ad.campaign_name || `${t('secretary.ad_number')}${ad.ad_id}`}
            </p>
            <p style={{ margin: '2px 0 0', fontSize: '11px', color: S.outline, fontFamily: "'IBM Plex Sans Arabic', sans-serif" }}>
                {ad.advertiser_name || t('secretary.advertiser')} · ${ad.total_cost || 0}
            </p>
        </div>
        <StatusPill status={ad.status} t={t} />
        <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
            <button
                onClick={() => onApprove(ad)}
                title={t('secretary.approve')}
                style={{ width: 32, height: 32, borderRadius: '8px', border: 'none', background: '#dcfce7', color: '#16a34a', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
                <CheckCircle style={{ width: 15, height: 15 }} />
            </button>
            <button
                onClick={() => onReject(ad)}
                title={t('secretary.reject')}
                style={{ width: 32, height: 32, borderRadius: '8px', border: 'none', background: S.errorContainer, color: S.error, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
                <XCircle style={{ width: 15, height: 15 }} />
            </button>
        </div>
    </motion.div>
);

/* ══════════════════════════════════════════════════════
   SECRETARY DASHBOARD
══════════════════════════════════════════════════════ */
const SecretaryDashboard = () => {
    const { t, dir } = useTranslation();
    const navigate = useNavigate();
    const addToast = useToastStore(state => state.addToast);

    const [data, setData] = useState(null);
    const [ads, setAds] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(null);
    const [rejectModal, setRejectModal] = useState({ open: false, ad: null });
    const [rejectReason, setRejectReason] = useState('');

    /* ── Fetch dashboard data + pending ads ── */
    const fetchData = useCallback(async (silent = false) => {
        if (!silent) setLoading(true);
        try {
            const [dashRes, adsRes] = await Promise.allSettled([
                axiosClient.get('/dashboard/secretary-overview'),
                axiosClient.get(ENDPOINTS.ADS.ALL, { params: { status: 'Pending', per_page: 8 } }),
            ]);
            if (dashRes.status === 'fulfilled') setData(dashRes.value.data?.data || dashRes.value.data);
            if (adsRes.status === 'fulfilled') setAds(adsRes.value.data?.data || []);
        } catch (e) {
            if (!silent) addToast(t('common.error'), 'error');
        } finally {
            if (!silent) setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
        const iv = setInterval(() => fetchData(true), 60000);
        return () => clearInterval(iv);
    }, [fetchData]);

    /* ── Approve ad ── */
    const handleApprove = async (ad) => {
        setActionLoading(ad.ad_id);
        try {
            await axiosClient.put(ENDPOINTS.ADS.STATUS(ad.ad_id), { status: 'Active' });
            addToast(t('secretary.approve_success'), 'success');
            fetchData(true);
        } catch (e) {
            addToast(e.response?.data?.message || t('secretary.action_fail'), 'error');
        } finally {
            setActionLoading(null);
        }
    };

    /* ── Reject ad ── */
    const handleReject = async () => {
        if (!rejectModal.ad) return;
        if (!rejectReason.trim()) { addToast(t('secretary.provide_reject_reason'), 'warning'); return; }
        setActionLoading(rejectModal.ad.ad_id);
        try {
            await axiosClient.put(ENDPOINTS.ADS.STATUS(rejectModal.ad.ad_id), { status: 'Rejected', reason: rejectReason });
            addToast(t('secretary.reject_success'), 'info');
            setRejectModal({ open: false, ad: null });
            setRejectReason('');
            fetchData(true);
        } catch (e) {
            addToast(e.response?.data?.message || t('secretary.action_fail'), 'error');
        } finally {
            setActionLoading(null);
        }
    };

    /* ── Skeleton ── */
    if (loading) {
        return (
            <div dir={dir} style={{ fontFamily: "'IBM Plex Sans Arabic', sans-serif", padding: '8px' }}>
                <div style={{ height: '36px', width: '250px', borderRadius: '10px', background: S.surfaceContainerHigh, marginBottom: '24px' }} />
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
                    {[1,2,3,4].map(i => <div key={i} style={{ height: '130px', borderRadius: '18px', background: S.surfaceContainerHigh }} />)}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div style={{ height: '400px', borderRadius: '18px', background: S.surfaceContainerHigh }} />
                    <div style={{ height: '400px', borderRadius: '18px', background: S.surfaceContainerHigh }} />
                </div>
            </div>
        );
    }

    const pendingCount = data?.pending_ads_count ?? ads.length;
    const paymentsCount = data?.pending_payments_count ?? 0;
    const offlineScreens = data?.offline_screens_count ?? 0;
    const totalAds = data?.total_ads ?? 0;

    return (
        <div dir={dir} style={{ fontFamily: "'IBM Plex Sans Arabic', sans-serif", paddingBottom: '40px' }}>

            {/* ── Header ── */}
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '28px', flexWrap: 'wrap', gap: '16px' }}
            >
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
                        <div style={{ width: 44, height: 44, borderRadius: '14px', background: S.surfaceContainer, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <ShieldCheck style={{ width: 22, height: 22, color: S.primaryContainer }} />
                        </div>
                        <div>
                            <h1 style={{ margin: 0, fontSize: '26px', fontWeight: 700, color: S.onBackground, fontFamily: "'IBM Plex Sans Arabic', sans-serif" }}>
                                {t('dashboard.overview')}
                            </h1>
                            <p style={{ margin: '3px 0 0', fontSize: '13px', color: S.outline, fontFamily: "'IBM Plex Sans Arabic', sans-serif" }}>
                                {t('dashboard.welcome_secretary')}
                            </p>
                        </div>
                    </div>
                </div>
                <button
                    onClick={() => fetchData()}
                    style={{
                        display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 18px',
                        borderRadius: '12px', border: `1px solid ${S.outlineVariant}`,
                        background: S.surfaceContainerLowest, color: S.onSurfaceVariant,
                        cursor: 'pointer', fontSize: '14px', fontWeight: 600, fontFamily: "'IBM Plex Sans Arabic', sans-serif",
                    }}
                >
                    <RefreshCw style={{ width: 15, height: 15 }} />
                    {t('common.refresh')}
                </button>
            </motion.div>

            {/* ── KPI Grid ── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '28px' }}>
                <KpiCard
                    label={t('secretary.ads_pending_approval')}
                    value={pendingCount}
                    icon={Clock}
                    iconBg="#fef3c7"
                    iconColor="#b45309"
                    borderColor="#f59e0b"
                    index={0}
                    onClick={() => navigate('/dashboard/ads')}
                    trend={pendingCount > 0 ? t('secretary.needs_review_now') : undefined}
                />
                <KpiCard
                    label={t('secretary.pending_payments')}
                    value={paymentsCount}
                    icon={DollarSign}
                    iconBg="#dbeafe"
                    iconColor="#2563eb"
                    borderColor="#2563eb"
                    index={1}
                    onClick={() => navigate('/dashboard/payment-ops')}
                />
                <KpiCard
                    label={t('secretary.offline_screens')}
                    value={offlineScreens}
                    icon={Monitor}
                    iconBg={S.errorContainer}
                    iconColor={S.error}
                    borderColor={S.error}
                    index={2}
                    onClick={() => navigate('/dashboard/screens')}
                />
                <KpiCard
                    label={t('secretary.total_ads')}
                    value={totalAds}
                    icon={PlayCircle}
                    iconBg="#e0e7ff"
                    iconColor="#4f46e5"
                    borderColor="#4f46e5"
                    index={3}
                    onClick={() => navigate('/dashboard/ads')}
                />
            </div>

            {/* ── Main Grid: Pending Ads + Quick Actions ── */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '20px', alignItems: 'start' }}>

                {/* ── Pending Ads Panel ── */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    style={{ background: S.surfaceContainerLowest, borderRadius: '20px', border: `1px solid ${S.outlineVariant}`, overflow: 'hidden' }}
                >
                    <div style={{ padding: '20px 24px', borderBottom: `1px solid ${S.outlineVariant}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{ width: 36, height: 36, borderRadius: '10px', background: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Clock style={{ width: 18, height: 18, color: '#b45309' }} />
                            </div>
                            <div>
                                <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: S.onBackground, fontFamily: "'IBM Plex Sans Arabic', sans-serif" }}>
                                    {t('secretary.ads_waiting_review')}
                                </h3>
                                <p style={{ margin: '2px 0 0', fontSize: '12px', color: S.outline, fontFamily: "'IBM Plex Sans Arabic', sans-serif" }}>
                                    {ads.length}{t('secretary.ads_waiting_decision')}
                                </p>
                            </div>
                        </div>
                        {ads.length > 0 && (
                            <span style={{ padding: '4px 12px', borderRadius: '999px', background: '#fee2e2', color: S.error, fontSize: '12px', fontWeight: 700, fontFamily: "'IBM Plex Sans Arabic', sans-serif" }}>
                                {ads.length}
                            </span>
                        )}
                    </div>

                    {ads.length === 0 ? (
                        <div style={{ padding: '60px 20px', textAlign: 'center' }}>
                            <div style={{ width: 64, height: 64, borderRadius: '50%', background: S.surfaceContainerLow, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                                <CheckCircle style={{ width: 28, height: 28, color: '#16a34a' }} />
                            </div>
                            <p style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: S.onBackground, fontFamily: "'IBM Plex Sans Arabic', sans-serif" }}>{t('secretary.all_good')}</p>
                            <p style={{ margin: '6px 0 0', fontSize: '13px', color: S.outline, fontFamily: "'IBM Plex Sans Arabic', sans-serif" }}>{t('secretary.no_pending_ads')}</p>
                        </div>
                    ) : (
                        <div>
                            <AnimatePresence>
                                {ads.map(ad => (
                                    <PendingAdRow
                                        key={ad.ad_id}
                                        ad={ad}
                                        dir={dir}
                                        onApprove={handleApprove}
                                        onReject={ad => setRejectModal({ open: true, ad })}
                                        t={t}
                                    />
                                ))}
                            </AnimatePresence>
                            <div style={{ padding: '16px 24px', background: S.surfaceContainerLow, display: 'flex', justifyContent: 'center' }}>
                                <button
                                    onClick={() => navigate('/dashboard/ads')}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: '6px',
                                        padding: '8px 20px', borderRadius: '10px',
                                        border: `1px solid ${S.outlineVariant}`,
                                        background: S.surfaceContainerLowest, color: S.primaryContainer,
                                        cursor: 'pointer', fontSize: '13px', fontWeight: 700,
                                        fontFamily: "'IBM Plex Sans Arabic', sans-serif",
                                    }}
                                >
                                    {t('secretary.view_all_ads')} <ArrowRight style={{ width: 14, height: 14, transform: dir === 'rtl' ? 'scaleX(-1)' : 'none' }} />
                                </button>
                            </div>
                        </div>
                    )}
                </motion.div>

                {/* ── Right Column ── */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

                    {/* Quick Actions */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.25 }}
                        style={{ background: S.surfaceContainerLowest, borderRadius: '20px', border: `1px solid ${S.outlineVariant}`, overflow: 'hidden' }}
                    >
                        <div style={{ padding: '18px 20px', borderBottom: `1px solid ${S.outlineVariant}` }}>
                            <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: S.onBackground, fontFamily: "'IBM Plex Sans Arabic', sans-serif" }}>
                                {t('secretary.quick_access')}
                            </h3>
                        </div>
                        <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <ActionCard
                                title={t('secretary.payment_ops')}
                                desc={t('secretary.review_payments')}
                                icon={DollarSign}
                                iconBg="#dbeafe"
                                iconColor="#2563eb"
                                onClick={() => navigate('/dashboard/payment-ops')}
                                badge={paymentsCount}
                            />
                            <ActionCard
                                title={t('secretary.ads_management')}
                                desc={t('secretary.monitor_campaigns')}
                                icon={Megaphone}
                                iconBg="#fef3c7"
                                iconColor="#b45309"
                                onClick={() => navigate('/dashboard/ads')}
                                badge={pendingCount}
                            />
                            <ActionCard
                                title={t('secretary.screens')}
                                desc={t('secretary.monitor_screens')}
                                icon={Monitor}
                                iconBg={S.surfaceContainer}
                                iconColor={S.primaryContainer}
                                onClick={() => navigate('/dashboard/screens')}
                                badge={offlineScreens > 0 ? offlineScreens : undefined}
                            />
                            <ActionCard
                                title={t('secretary.reports')}
                                desc={t('secretary.financial_reports')}
                                icon={FileText}
                                iconBg="#f0fdf4"
                                iconColor="#16a34a"
                                onClick={() => navigate('/dashboard/reports')}
                            />
                        </div>
                    </motion.div>

                    {/* System Status */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        style={{ background: S.surfaceContainerLowest, borderRadius: '20px', border: `1px solid ${S.outlineVariant}`, padding: '20px' }}
                    >
                        <h3 style={{ margin: '0 0 16px', fontSize: '15px', fontWeight: 700, color: S.onBackground, fontFamily: "'IBM Plex Sans Arabic', sans-serif" }}>
                            {t('secretary.system_status')}
                        </h3>
                        {[
                            { label: t('secretary.active_ads'), value: data?.active_ads || '—', color: '#16a34a', bg: '#dcfce7' },
                            { label: t('secretary.connected_screens'), value: data?.online_screens || '—', color: S.primaryContainer, bg: S.surfaceContainer },
                            { label: t('secretary.today_ops'), value: data?.today_payments || '—', color: '#7c3aed', bg: '#ede9fe' },
                        ].map((item, i) => (
                            <div key={i} style={{
                                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                padding: '10px 0', borderBottom: i < 2 ? `1px solid ${S.outlineVariant}` : 'none',
                            }}>
                                <span style={{ fontSize: '13px', color: S.onSurfaceVariant, fontFamily: "'IBM Plex Sans Arabic', sans-serif" }}>{item.label}</span>
                                <span style={{ padding: '2px 12px', borderRadius: '999px', background: item.bg, color: item.color, fontSize: '13px', fontWeight: 700, fontFamily: "'IBM Plex Sans Arabic', sans-serif" }}>
                                    {item.value}
                                </span>
                            </div>
                        ))}
                    </motion.div>
                </div>
            </div>

            {/* ── Reject Modal ── */}
            <AnimatePresence>
                {rejectModal.open && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '20px' }}
                        onClick={e => e.target === e.currentTarget && setRejectModal({ open: false, ad: null })}
                    >
                        <motion.div
                            initial={{ scale: 0.92, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.92, opacity: 0 }}
                            style={{ background: '#fff', borderRadius: '24px', padding: '32px', width: '100%', maxWidth: '480px' }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                                <div style={{ width: 48, height: 48, borderRadius: '14px', background: S.errorContainer, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <XCircle style={{ width: 24, height: 24, color: S.error }} />
                                </div>
                                <div>
                                    <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: S.onBackground, fontFamily: "'IBM Plex Sans Arabic', sans-serif" }}>{t('secretary.reject_ad')}</h3>
                                    <p style={{ margin: '2px 0 0', fontSize: '13px', color: S.outline, fontFamily: "'IBM Plex Sans Arabic', sans-serif" }}>
                                        {rejectModal.ad?.title || `${t('secretary.ad_number')}${rejectModal.ad?.ad_id}`}
                                    </p>
                                </div>
                            </div>
                            <div style={{ marginBottom: '20px' }}>
                                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: S.onSurfaceVariant, marginBottom: '8px', fontFamily: "'IBM Plex Sans Arabic', sans-serif" }}>
                                    {t('secretary.reject_reason')} <span style={{ color: S.error }}>*</span>
                                </label>
                                <textarea
                                    rows={4}
                                    value={rejectReason}
                                    onChange={e => setRejectReason(e.target.value)}
                                    placeholder={t('secretary.reject_reason_placeholder')}
                                    style={{ width: '100%', border: `1px solid ${S.outlineVariant}`, borderRadius: '12px', padding: '12px', fontSize: '14px', fontFamily: "'IBM Plex Sans Arabic', sans-serif", resize: 'vertical', outline: 'none', boxSizing: 'border-box' }}
                                    dir="rtl"
                                />
                            </div>
                            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                                <button onClick={() => { setRejectModal({ open: false, ad: null }); setRejectReason(''); }}
                                    style={{ padding: '10px 20px', borderRadius: '10px', border: `1px solid ${S.outlineVariant}`, background: S.surfaceContainerLow, color: S.onSurfaceVariant, cursor: 'pointer', fontSize: '14px', fontWeight: 600, fontFamily: "'IBM Plex Sans Arabic', sans-serif" }}>
                                    {t('secretary.cancel')}
                                </button>
                                <button onClick={handleReject} disabled={!rejectReason.trim() || actionLoading}
                                    style={{ padding: '10px 24px', borderRadius: '10px', border: 'none', background: S.error, color: '#fff', cursor: 'pointer', fontSize: '14px', fontWeight: 600, fontFamily: "'IBM Plex Sans Arabic', sans-serif" }}>
                                    {t('secretary.confirm_reject')}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default SecretaryDashboard;
