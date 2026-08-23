import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    CheckCircle, XCircle, Clock, Eye, Megaphone, RefreshCw,
    User, Calendar, DollarSign, Monitor, Activity, Search,
    X, ChevronDown, Filter, Play, FileText
} from 'lucide-react';
import axiosClient from '../../core/api/axiosClient';
import { ENDPOINTS } from '../../core/api/endpoints';
import useToastStore from '../../store/useToastStore';
import usePermission from '../../hooks/usePermission';
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
    onBackground: '#141b2b',
    onSurface: '#141b2b',
    onSurfaceVariant: '#434655',
    outline: '#737686',
    outlineVariant: '#c3c6d7',
    error: '#ba1a1a',
    errorContainer: '#ffdad6',
};

/* ─── KPI Card ─── */
const KpiCard = ({ label, value, icon: Icon, iconBg, iconColor, borderColor, index }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: index * 0.08 }}
        style={{
            background: S.surfaceContainerLowest, borderRadius: '16px', padding: '20px',
            border: `1px solid ${S.outlineVariant}`,
            borderRight: `4px solid ${borderColor || S.primaryContainer}`,
            display: 'flex', flexDirection: 'column', gap: '10px',
        }}
    >
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <p style={{ margin: 0, fontSize: '13px', color: S.outline, fontFamily: "'IBM Plex Sans Arabic', sans-serif" }}>{label}</p>
            {Icon && <div style={{ width: 38, height: 38, borderRadius: '10px', background: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon style={{ width: 18, height: 18, color: iconColor }} />
            </div>}
        </div>
        <span style={{ fontSize: '34px', fontWeight: 700, color: borderColor || S.onBackground, fontFamily: "'IBM Plex Sans Arabic', sans-serif", lineHeight: 1 }}>{value}</span>
    </motion.div>
);

/* ─── Ad Preview Card ─── */
const AdPreviewCard = ({ ad, onApprove, onReject, onView, dir, isActioning, t }) => {
    const startDate = ad.start_date ? new Date(ad.start_date).toLocaleDateString('ar') : '—';
    const endDate = ad.end_date ? new Date(ad.end_date).toLocaleDateString('ar') : '—';
    const hasMedia = ad.media_url || ad.thumbnail_url;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            layout
            style={{
                background: S.surfaceContainerLowest,
                border: `1px solid ${S.outlineVariant}`,
                borderRadius: '20px',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                position: 'relative',
            }}
        >
            {/* Pending badge */}
            <div style={{ position: 'absolute', top: '12px', right: dir === 'rtl' ? '12px' : 'auto', left: dir === 'ltr' ? '12px' : 'auto', zIndex: 10 }}>
                <span style={{ padding: '4px 10px', borderRadius: '999px', background: '#fef3c7', color: '#b45309', fontSize: '11px', fontWeight: 700, fontFamily: "'IBM Plex Sans Arabic', sans-serif", display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#f59e0b', animation: 'pulse 2s infinite' }} />
                    {t('ads_approval.pending_approval')}
                </span>
            </div>

            {/* Media preview */}
            <div style={{ height: '160px', background: 'linear-gradient(135deg, #1e3a8a, #1d4ed8)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
                {hasMedia ? (
                    ad.media_type === 'video' || ad.media_url?.includes('.mp4') ? (
                        <video src={ad.media_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} muted playsInline />
                    ) : (
                        <img src={ad.thumbnail_url || ad.media_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => e.target.style.display = 'none'} />
                    )
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                        <Megaphone style={{ width: 40, height: 40, color: 'rgba(255,255,255,0.6)' }} />
                        <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', fontFamily: "'IBM Plex Sans Arabic', sans-serif" }}>{t('ads_approval.no_preview')}</span>
                    </div>
                )}
                {/* Overlay */}
                <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.3)' }} />
            </div>

            {/* Content */}
            <div style={{ padding: '18px', flex: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                    <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: S.onBackground, fontFamily: "'IBM Plex Sans Arabic', sans-serif", lineHeight: 1.3 }}>
                        {ad.title || ad.campaign_name || `${t('ads_approval.ad_number')}${ad.ad_id}`}
                    </h3>
                    {ad.advertiser_name && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginTop: '5px' }}>
                            <User style={{ width: 12, height: 12, color: S.outline }} />
                            <span style={{ fontSize: '12px', color: S.outline, fontFamily: "'IBM Plex Sans Arabic', sans-serif" }}>{ad.advertiser_name}</span>
                        </div>
                    )}
                </div>

                {/* Meta Info */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    {[
                        { icon: Calendar, label: `${startDate} — ${endDate}` },
                        { icon: DollarSign, label: `$${Number(ad.total_cost || 0).toLocaleString()}` },
                        { icon: Monitor, label: `${ad.screens_count || ad.screen_ids?.length || 0} ${t('ads_approval.screen')}` },
                        { icon: Activity, label: ad.interval_minutes ? `${t('ads_approval.every')} ${ad.interval_minutes} ${t('ads_approval.min_short')}` : t('ads_approval.undefined') },
                    ].map(({ icon: I, label }, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '7px 10px', background: S.surfaceContainerLow, borderRadius: '8px' }}>
                            <I style={{ width: 13, height: 13, color: S.outline, flexShrink: 0 }} />
                            <span style={{ fontSize: '12px', color: S.onSurfaceVariant, fontFamily: "'IBM Plex Sans Arabic', sans-serif", overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{label}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Actions */}
            <div style={{ padding: '12px 18px 18px', display: 'flex', gap: '8px', borderTop: `1px solid ${S.outlineVariant}` }}>
                <button
                    onClick={() => onApprove(ad)}
                    disabled={isActioning}
                    style={{
                        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                        padding: '10px', borderRadius: '10px', border: 'none',
                        background: '#16a34a', color: '#fff', cursor: isActioning ? 'not-allowed' : 'pointer',
                        fontSize: '13px', fontWeight: 700, fontFamily: "'IBM Plex Sans Arabic', sans-serif",
                        opacity: isActioning ? 0.6 : 1, transition: 'all 0.15s',
                    }}
                >
                    <CheckCircle style={{ width: 14, height: 14 }} />
                    {t('ads_approval.approve')}
                </button>
                <button
                    onClick={() => onReject(ad)}
                    disabled={isActioning}
                    style={{
                        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                        padding: '10px', borderRadius: '10px', border: 'none',
                        background: S.error, color: '#fff', cursor: isActioning ? 'not-allowed' : 'pointer',
                        fontSize: '13px', fontWeight: 700, fontFamily: "'IBM Plex Sans Arabic', sans-serif",
                        opacity: isActioning ? 0.6 : 1, transition: 'all 0.15s',
                    }}
                >
                    <XCircle style={{ width: 14, height: 14 }} />
                    {t('ads_approval.reject')}
                </button>
                <button
                    onClick={() => onView(ad)}
                    style={{
                        width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        borderRadius: '10px', border: `1px solid ${S.outlineVariant}`, background: S.surfaceContainerLow,
                        color: S.onSurfaceVariant, cursor: 'pointer', flexShrink: 0,
                    }}
                >
                    <Eye style={{ width: 15, height: 15 }} />
                </button>
            </div>
        </motion.div>
    );
};

/* ─── Decision history row ─── */
const HistoryRow = ({ ad, dir, t }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', borderBottom: `1px solid ${S.outlineVariant}` }}>
        <div style={{
            width: 34, height: 34, borderRadius: '10px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: ad.status === 'Active' ? '#dcfce7' : '#fee2e2',
            color: ad.status === 'Active' ? '#16a34a' : S.error,
        }}>
            {ad.status === 'Active' ? <CheckCircle style={{ width: 16, height: 16 }} /> : <XCircle style={{ width: 16, height: 16 }} />}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ margin: 0, fontSize: '13px', fontWeight: 600, color: S.onBackground, fontFamily: "'IBM Plex Sans Arabic', sans-serif", overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {ad.title || ad.campaign_name || `${t('ads_approval.ad_number')}${ad.ad_id}`}
            </p>
            <p style={{ margin: '2px 0 0', fontSize: '11px', color: S.outline, fontFamily: "'IBM Plex Sans Arabic', sans-serif" }}>
                {ad.advertiser_name || '—'} · {ad.updated_at ? new Date(ad.updated_at).toLocaleDateString('ar') : '—'}
            </p>
        </div>
        <span style={{
            padding: '3px 10px', borderRadius: '999px', fontSize: '11px', fontWeight: 700,
            background: ad.status === 'Active' ? '#dcfce7' : '#fee2e2',
            color: ad.status === 'Active' ? '#16a34a' : S.error,
            fontFamily: "'IBM Plex Sans Arabic', sans-serif",
        }}>
            {ad.status === 'Active' ? t('ads_approval.accepted') : t('ads_approval.rejected')}
        </span>
        <span style={{ fontSize: '12px', color: S.outline, fontFamily: "'IBM Plex Sans Arabic', sans-serif", whiteSpace: 'nowrap' }}>
            ${Number(ad.total_cost || 0).toLocaleString()}
        </span>
    </div>
);

/* ══════════════════════════════════════════════════════
   ADS APPROVAL PAGE
══════════════════════════════════════════════════════ */
const AdsApprovalPage = () => {
    const { t, dir } = useTranslation();
    const addToast = useToastStore(state => state.addToast);
    const { can } = usePermission();

    const [pendingAds, setPendingAds] = useState([]);
    const [recentDecisions, setRecentDecisions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    /* Reject Modal */
    const [rejectModal, setRejectModal] = useState({ open: false, ad: null });
    const [rejectReason, setRejectReason] = useState('');
    const [rejectLoading, setRejectLoading] = useState(false);

    /* View Modal */
    const [viewModal, setViewModal] = useState({ open: false, ad: null });

    /* ── Fetch ── */
    const fetchData = useCallback(async (silent = false) => {
        if (!silent) setLoading(true);
        try {
            const [pendingRes, recentRes] = await Promise.allSettled([
                axiosClient.get(ENDPOINTS.ADS.ALL, { params: { status: 'Pending', per_page: 20 } }),
                axiosClient.get(ENDPOINTS.ADS.ALL, { params: { status: 'Active,Rejected', per_page: 10 } }),
            ]);
            if (pendingRes.status === 'fulfilled') setPendingAds(pendingRes.value.data?.data || []);
            if (recentRes.status === 'fulfilled') setRecentDecisions(recentRes.value.data?.data || []);
        } catch (e) {
            if (!silent) addToast(t('ads_approval.fail_load'), 'error');
        } finally {
            if (!silent) setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
        const iv = setInterval(() => fetchData(true), 30000);
        return () => clearInterval(iv);
    }, [fetchData]);

    /* ── Approve ── */
    const handleApprove = async (ad) => {
        setActionLoading(ad.ad_id);
        try {
            await axiosClient.put(ENDPOINTS.ADS.STATUS(ad.ad_id), { status: 'Active' });
            addToast(t('ads_approval.approve_success'), 'success');
            fetchData(true);
        } catch (e) {
            addToast(e.response?.data?.message || t('ads_approval.action_fail'), 'error');
        } finally {
            setActionLoading(null);
        }
    };

    /* ── Reject ── */
    const handleReject = async () => {
        if (!rejectReason.trim()) { addToast(t('ads_approval.provide_reject_reason'), 'warning'); return; }
        setRejectLoading(true);
        try {
            await axiosClient.put(ENDPOINTS.ADS.STATUS(rejectModal.ad.ad_id), { status: 'Rejected', reason: rejectReason });
            addToast(t('ads_approval.reject_success'), 'info');
            setRejectModal({ open: false, ad: null });
            setRejectReason('');
            fetchData(true);
        } catch (e) {
            addToast(e.response?.data?.message || t('ads_approval.action_fail'), 'error');
        } finally {
            setRejectLoading(false);
        }
    };

    /* ── Filtered ── */
    const filtered = pendingAds.filter(ad =>
        !searchTerm ||
        (ad.title || ad.campaign_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (ad.advertiser_name || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    /* ── Skeleton ── */
    if (loading) {
        return (
            <div dir={dir} style={{ fontFamily: "'IBM Plex Sans Arabic', sans-serif", padding: '8px' }}>
                <div style={{ height: '36px', width: '260px', borderRadius: '10px', background: S.surfaceContainerHigh, marginBottom: '24px' }} />
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
                    {[1, 2, 3].map(i => <div key={i} style={{ height: '110px', borderRadius: '16px', background: S.surfaceContainerHigh }} />)}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
                    {[1, 2, 3].map(i => <div key={i} style={{ height: '380px', borderRadius: '20px', background: S.surfaceContainerHigh }} />)}
                </div>
            </div>
        );
    }

    const approvedToday = recentDecisions.filter(a => {
        const d = new Date(a.updated_at);
        return d.toDateString() === new Date().toDateString() && a.status === 'Active';
    }).length;

    const rejectedThisWeek = recentDecisions.filter(a => {
        const d = new Date(a.updated_at);
        const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 7);
        return d >= weekAgo && a.status === 'Rejected';
    }).length;

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
                        <div style={{ width: 44, height: 44, borderRadius: '14px', background: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <CheckCircle style={{ width: 22, height: 22, color: '#b45309' }} />
                        </div>
                        <div>
                            <h1 style={{ margin: 0, fontSize: '26px', fontWeight: 700, color: S.onBackground, fontFamily: "'IBM Plex Sans Arabic', sans-serif" }}>
                                {t('ads_approval.title')}
                            </h1>
                            <p style={{ margin: '3px 0 0', fontSize: '13px', color: S.outline, fontFamily: "'IBM Plex Sans Arabic', sans-serif" }}>
                                {t('ads_approval.subtitle')}
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
                    {t('ads_approval.refresh')}
                </button>
            </motion.div>

            {/* ── KPI Cards ── */
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '28px' }}>
                <KpiCard label={t('ads_approval.pending_review')} value={pendingAds.length} icon={Clock} iconBg="#fef3c7" iconColor="#b45309" borderColor="#f59e0b" index={0} />
                <KpiCard label={t('ads_approval.approved_today')} value={approvedToday} icon={CheckCircle} iconBg="#dcfce7" iconColor="#16a34a" borderColor="#16a34a" index={1} />
                <KpiCard label={t('ads_approval.rejected_this_week')} value={rejectedThisWeek} icon={XCircle} iconBg={S.errorContainer} iconColor={S.error} borderColor={S.error} index={2} />
            </div>

            /* ── Search ── */}
            <div style={{ marginBottom: '20px', position: 'relative', maxWidth: '420px' }}>
                <Search style={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)', right: dir === 'rtl' ? '14px' : 'auto', left: dir === 'ltr' ? '14px' : 'auto', width: 15, height: 15, color: S.outline }} />
                <input
                    type="text"
                    placeholder={t('ads_approval.search_placeholder')}
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    style={{
                        width: '100%', border: `1px solid ${S.outlineVariant}`, borderRadius: '12px',
                        padding: '10px 14px', paddingRight: dir === 'rtl' ? '40px' : '14px', paddingLeft: dir === 'ltr' ? '40px' : '14px',
                        fontSize: '14px', fontFamily: "'IBM Plex Sans Arabic', sans-serif",
                        background: S.surfaceContainerLowest, color: S.onBackground, outline: 'none',
                        boxSizing: 'border-box',
                    }}
                />
                {searchTerm && (
                    <button onClick={() => setSearchTerm('')} style={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)', left: dir === 'rtl' ? '12px' : 'auto', right: dir === 'ltr' ? '12px' : 'auto', background: 'none', border: 'none', cursor: 'pointer', color: S.outline }}>
                        <X style={{ width: 13, height: 13 }} />
                    </button>
                )}
            </div>

            {/* ── Main Grid: Pending Ads ── */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '24px', alignItems: 'start' }}>

                {/* Ads Grid */}
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                        <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: S.onBackground, fontFamily: "'IBM Plex Sans Arabic', sans-serif" }}>
                            {t('ads_approval.pending_ads_title')} ({filtered.length})
                        </h2>
                    </div>

                    {filtered.length === 0 ? (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            style={{ textAlign: 'center', padding: '80px 20px', background: S.surfaceContainerLowest, borderRadius: '24px', border: `2px dashed ${S.outlineVariant}` }}
                        >
                            <div style={{ width: 80, height: 80, borderRadius: '50%', background: S.surfaceContainer, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                                <CheckCircle style={{ width: 36, height: 36, color: '#16a34a' }} />
                            </div>
                            <h3 style={{ margin: '0 0 8px', fontSize: '18px', fontWeight: 700, color: S.onBackground, fontFamily: "'IBM Plex Sans Arabic', sans-serif" }}>
                                {searchTerm ? t('ads_approval.no_results') : t('ads_approval.no_pending_ads')}
                            </h3>
                            <p style={{ margin: 0, fontSize: '14px', color: S.outline, fontFamily: "'IBM Plex Sans Arabic', sans-serif" }}>
                                {searchTerm ? t('ads_approval.try_diff_words') : t('ads_approval.all_reviewed')}
                            </p>
                        </motion.div>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
                            <AnimatePresence>
                                {filtered.map((ad, idx) => (
                                    <AdPreviewCard
                                        key={ad.ad_id}
                                        ad={ad}
                                        dir={dir}
                                        isActioning={actionLoading === ad.ad_id}
                                        onApprove={handleApprove}
                                        onReject={ad => setRejectModal({ open: true, ad })}
                                        onView={ad => setViewModal({ open: true, ad })}
                                        t={t}
                                    />
                                ))}
                            </AnimatePresence>
                        </div>
                    )}
                </div>

                {/* Decision History Sidebar */}
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                    style={{ background: S.surfaceContainerLowest, borderRadius: '20px', border: `1px solid ${S.outlineVariant}`, overflow: 'hidden', position: 'sticky', top: '80px' }}
                >
                    <div style={{ padding: '18px 20px', borderBottom: `1px solid ${S.outlineVariant}`, display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <FileText style={{ width: 18, height: 18, color: S.primaryContainer }} />
                        <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: S.onBackground, fontFamily: "'IBM Plex Sans Arabic', sans-serif" }}>
                            {t('ads_approval.recent_decisions')}
                        </h3>
                    </div>
                    {recentDecisions.length === 0 ? (
                        <div style={{ padding: '40px 20px', textAlign: 'center' }}>
                            <p style={{ margin: 0, fontSize: '13px', color: S.outline, fontFamily: "'IBM Plex Sans Arabic', sans-serif" }}>{t('ads_approval.no_history')}</p>
                        </div>
                    ) : (
                        <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
                            {recentDecisions.map(ad => <HistoryRow key={ad.ad_id} ad={ad} dir={dir} t={t} />)}
                        </div>
                    )}
                </motion.div>
            </div>

            {/* ── Reject Modal ── */}
            <AnimatePresence>
                {rejectModal.open && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '20px' }}
                        onClick={e => e.target === e.currentTarget && setRejectModal({ open: false, ad: null })}
                    >
                        <motion.div
                            initial={{ scale: 0.92, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.92, opacity: 0 }}
                            style={{ background: '#fff', borderRadius: '24px', padding: '32px', width: '100%', maxWidth: '500px' }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '24px' }}>
                                <div style={{ width: 52, height: 52, borderRadius: '16px', background: S.errorContainer, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <XCircle style={{ width: 26, height: 26, color: S.error }} />
                                </div>
                                <div>
                                    <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: S.onBackground, fontFamily: "'IBM Plex Sans Arabic', sans-serif" }}>{t('ads_approval.reject_ad')}</h3>
                                    <p style={{ margin: '4px 0 0', fontSize: '13px', color: S.outline, fontFamily: "'IBM Plex Sans Arabic', sans-serif" }}>
                                        {rejectModal.ad?.title || rejectModal.ad?.campaign_name || `${t('ads_approval.ad_number')}${rejectModal.ad?.ad_id}`}
                                    </p>
                                </div>
                            </div>
                            <div style={{ marginBottom: '24px' }}>
                                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: S.onSurfaceVariant, marginBottom: '8px', fontFamily: "'IBM Plex Sans Arabic', sans-serif" }}>
                                    {t('ads_approval.reject_reason')} <span style={{ color: S.error }}>*</span>
                                </label>
                                <textarea
                                    rows={4}
                                    value={rejectReason}
                                    onChange={e => setRejectReason(e.target.value)}
                                    placeholder={t('ads_approval.reject_reason_placeholder')}
                                    style={{ width: '100%', border: `1px solid ${S.outlineVariant}`, borderRadius: '12px', padding: '12px', fontSize: '14px', fontFamily: "'IBM Plex Sans Arabic', sans-serif", resize: 'vertical', outline: 'none', boxSizing: 'border-box', color: S.onBackground }}
                                    dir="rtl"
                                />
                            </div>
                            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                                <button onClick={() => { setRejectModal({ open: false, ad: null }); setRejectReason(''); }}
                                    style={{ padding: '10px 20px', borderRadius: '10px', border: `1px solid ${S.outlineVariant}`, background: S.surfaceContainerLow, color: S.onSurfaceVariant, cursor: 'pointer', fontSize: '14px', fontWeight: 600, fontFamily: "'IBM Plex Sans Arabic', sans-serif" }}>
                                    {t('ads_approval.cancel')}
                                </button>
                                <button onClick={handleReject} disabled={rejectLoading || !rejectReason.trim()}
                                    style={{ padding: '10px 24px', borderRadius: '10px', border: 'none', background: rejectLoading ? S.outlineVariant : S.error, color: '#fff', cursor: 'pointer', fontSize: '14px', fontWeight: 600, fontFamily: "'IBM Plex Sans Arabic', sans-serif", display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    {rejectLoading && <RefreshCw style={{ width: 13, height: 13, animation: 'spin 1s linear infinite' }} />}
                                    {t('ads_approval.confirm_reject')}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── View Ad Modal ── */}
            <AnimatePresence>
                {viewModal.open && viewModal.ad && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '20px' }}
                        onClick={e => e.target === e.currentTarget && setViewModal({ open: false, ad: null })}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            style={{ background: '#fff', borderRadius: '24px', width: '100%', maxWidth: '600px', overflow: 'hidden' }}
                        >
                            {/* Media */}
                            <div style={{ height: '280px', background: 'linear-gradient(135deg, #0f172a, #1e40af)', position: 'relative' }}>
                                {viewModal.ad.media_url ? (
                                    viewModal.ad.media_type === 'video' || viewModal.ad.media_url.includes('.mp4') ? (
                                        <video src={viewModal.ad.media_url} controls style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                                    ) : (
                                        <img src={viewModal.ad.media_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                                    )
                                ) : (
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', flexDirection: 'column', gap: '10px' }}>
                                        <Megaphone style={{ width: 48, height: 48, color: 'rgba(255,255,255,0.4)' }} />
                                        <span style={{ fontSize: '14px', color: 'rgba(255,255,255,0.4)', fontFamily: "'IBM Plex Sans Arabic', sans-serif" }}>{t('ads_approval.no_media_preview')}</span>
                                    </div>
                                )}
                                <button onClick={() => setViewModal({ open: false, ad: null })}
                                    style={{ position: 'absolute', top: '12px', right: '12px', width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(0,0,0,0.5)', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <X style={{ width: 14, height: 14 }} />
                                </button>
                            </div>
                            <div style={{ padding: '24px' }}>
                                <h3 style={{ margin: '0 0 16px', fontSize: '18px', fontWeight: 700, color: S.onBackground, fontFamily: "'IBM Plex Sans Arabic', sans-serif" }}>
                                    {viewModal.ad.title || viewModal.ad.campaign_name || `${t('ads_approval.ad_number')}${viewModal.ad.ad_id}`}
                                </h3>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
                                    {[
                                        { label: t('ads_approval.advertiser'), value: viewModal.ad.advertiser_name || '—' },
                                        { label: t('ads_approval.total_cost'), value: `$${Number(viewModal.ad.total_cost || 0).toLocaleString()}` },
                                        { label: t('ads_approval.start_date'), value: viewModal.ad.start_date ? new Date(viewModal.ad.start_date).toLocaleDateString('ar') : '—' },
                                        { label: t('ads_approval.end_date'), value: viewModal.ad.end_date ? new Date(viewModal.ad.end_date).toLocaleDateString('ar') : '—' },
                                        { label: t('ads_approval.screens_count'), value: `${viewModal.ad.screens_count || 0} ${t('ads_approval.screen')}` },
                                        { label: t('ads_approval.display_frequency'), value: viewModal.ad.interval_minutes ? `${t('ads_approval.every')} ${viewModal.ad.interval_minutes} ${t('ads_approval.minute')}` : '—' },
                                    ].map(({ label, value }) => (
                                        <div key={label} style={{ padding: '10px 12px', background: S.surfaceContainerLow, borderRadius: '10px' }}>
                                            <p style={{ margin: 0, fontSize: '11px', color: S.outline, fontFamily: "'IBM Plex Sans Arabic', sans-serif" }}>{label}</p>
                                            <p style={{ margin: '3px 0 0', fontSize: '14px', fontWeight: 600, color: S.onBackground, fontFamily: "'IBM Plex Sans Arabic', sans-serif" }}>{value}</p>
                                        </div>
                                    ))}
                                </div>
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <button
                                        onClick={() => { handleApprove(viewModal.ad); setViewModal({ open: false, ad: null }); }}
                                        style={{ flex: 1, padding: '11px', borderRadius: '12px', border: 'none', background: '#16a34a', color: '#fff', cursor: 'pointer', fontSize: '14px', fontWeight: 700, fontFamily: "'IBM Plex Sans Arabic', sans-serif" }}
                                    >
                                        {t('ads_approval.approve_emoji')}
                                    </button>
                                    <button
                                        onClick={() => { setViewModal({ open: false, ad: null }); setRejectModal({ open: true, ad: viewModal.ad }); }}
                                        style={{ flex: 1, padding: '11px', borderRadius: '12px', border: 'none', background: S.error, color: '#fff', cursor: 'pointer', fontSize: '14px', fontWeight: 700, fontFamily: "'IBM Plex Sans Arabic', sans-serif" }}
                                    >
                                        {t('ads_approval.reject_emoji')}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default AdsApprovalPage;
