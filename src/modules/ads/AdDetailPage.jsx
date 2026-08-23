import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    ArrowRight, Megaphone, Calendar, DollarSign, Monitor, Clock,
    CheckCircle, XCircle, PauseCircle, PlayCircle, Eye, Info,
    User, MapPin, Layers, Activity, CreditCard, Trash2, ArrowLeft
} from 'lucide-react';
import axiosClient from '../../core/api/axiosClient';
import { ENDPOINTS } from '../../core/api/endpoints';
import useToastStore from '../../store/useToastStore';
import useTranslation from '../../i18n/useTranslation';
import usePermission from '../../hooks/usePermission';
import ConfirmDialog from '../../shared/components/ConfirmDialog';

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

/* ─── Status Pill ─── */
const StatusPill = ({ status, t }) => {
    const cfg = {
        'Pending': { bg: '#fef3c7', color: '#b45309', label: t('ad_detail.status_pending'), icon: Clock },
        'Active': { bg: '#dcfce7', color: '#16a34a', label: t('ad_detail.status_active'), icon: PlayCircle },
        'Rejected': { bg: '#fee2e2', color: '#dc2626', label: t('ad_detail.status_rejected'), icon: XCircle },
        'Paused': { bg: S.surfaceContainerHigh, color: S.onSurfaceVariant, label: t('ad_detail.status_paused'), icon: PauseCircle },
        'waiting_payment': { bg: '#fef3c7', color: '#b45309', label: t('ad_detail.status_waiting_payment'), icon: CreditCard },
    };
    const c = cfg[status] || { bg: '#f3f4f6', color: '#6b7280', label: status, icon: Info };
    const Icon = c.icon;
    return (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 14px', borderRadius: '999px', background: c.bg, color: c.color, fontSize: '13px', fontWeight: 700, fontFamily: "'IBM Plex Sans Arabic', sans-serif" }}>
            <Icon style={{ width: 15, height: 15 }} />
            {c.label}
        </span>
    );
};

/* ─── Detail Block ─── */
const DetailBlock = ({ icon: Icon, label, value }) => (
    <div style={{ display: 'flex', gap: '14px' }}>
        <div style={{ width: 42, height: 42, borderRadius: '12px', background: S.surfaceContainerLow, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Icon style={{ width: 20, height: 20, color: S.primaryContainer }} />
        </div>
        <div>
            <p style={{ margin: 0, fontSize: '13px', color: S.outline, fontFamily: "'IBM Plex Sans Arabic', sans-serif" }}>{label}</p>
            <p style={{ margin: '2px 0 0', fontSize: '15px', fontWeight: 600, color: S.onBackground, fontFamily: "'IBM Plex Sans Arabic', sans-serif" }}>{value}</p>
        </div>
    </div>
);

const AdDetailPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { t, dir } = useTranslation();
    const addToast = useToastStore(s => s.addToast);
    const { can, isAdvertiser } = usePermission();

    const [ad, setAd] = useState(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [deleteDialog, setDeleteDialog] = useState(false);

    /* ── Fetch ── */
    useEffect(() => {
        const fetchAd = async () => {
            try {
                // Here we fetch from all ads using the ID. Since we don't have a specific GET /ads/:id endpoint in endpoints.js,
                // we simulate it by fetching ALL and filtering, or if there's a backend endpoint we'll use it.
                // Assuming ENDPOINTS.ADS.GET exists or we fetch ALL and find.
                const res = await axiosClient.get(ENDPOINTS.ADS.ALL);
                const list = res.data?.data || res.data || [];
                const found = list.find(a => String(a.ad_id) === String(id) || String(a.id) === String(id));
                
                if (found) {
                    setAd(found);
                } else {
                    addToast(t('ad_detail.ad_not_found'), 'error');
                    navigate('/dashboard/ads');
                }
            } catch (e) {
                addToast(t('ad_detail.load_fail'), 'error');
                navigate('/dashboard/ads');
            } finally {
                setLoading(false);
            }
        };
        fetchAd();
    }, [id, navigate, addToast]);

    /* ── Actions ── */
    const handleStatus = async (status) => {
        setActionLoading(true);
        try {
            await axiosClient.put(ENDPOINTS.ADS.STATUS(ad.ad_id || ad.id), { status });
            addToast(`${t('ad_detail.status_changed')}${status}`, 'success');
            setAd(p => ({ ...p, status }));
        } catch (e) {
            addToast(e.response?.data?.message || t('ad_detail.action_fail'), 'error');
        } finally {
            setActionLoading(false);
        }
    };

    const handleDelete = async () => {
        setActionLoading(true);
        try {
            await axiosClient.delete(ENDPOINTS.ADS.DELETE(ad.ad_id || ad.id));
            addToast(t('ad_detail.delete_success'), 'success');
            navigate('/dashboard/ads');
        } catch (e) {
            addToast(e.response?.data?.message || t('ad_detail.delete_fail'), 'error');
            setActionLoading(false);
        } finally {
            setDeleteDialog(false);
        }
    };

    if (loading) {
        return (
            <div dir={dir} style={{ fontFamily: "'IBM Plex Sans Arabic', sans-serif", padding: '8px' }}>
                <div style={{ height: '40px', width: '200px', borderRadius: '10px', background: S.surfaceContainerHigh, marginBottom: '24px' }} />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '24px' }}>
                    <div style={{ height: '500px', borderRadius: '24px', background: S.surfaceContainerHigh }} />
                    <div style={{ height: '500px', borderRadius: '24px', background: S.surfaceContainerHigh }} />
                </div>
            </div>
        );
    }

    if (!ad) return null;

    const startDate = ad.start_date ? new Date(ad.start_date).toLocaleDateString('ar') : '—';
    const endDate = ad.end_date ? new Date(ad.end_date).toLocaleDateString('ar') : '—';
    const hasMedia = ad.media_url || ad.thumbnail_url;
    const mediaUrl = ad.media_url || ad.thumbnail_url;
    const isVideo = ad.media_type === 'video' || mediaUrl?.includes('.mp4');

    return (
        <div dir={dir} style={{ fontFamily: "'IBM Plex Sans Arabic', sans-serif", paddingBottom: '40px' }}>

            {/* ── Header ── */}
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <button
                        onClick={() => navigate(-1)}
                        style={{ width: 44, height: 44, borderRadius: '14px', border: `1px solid ${S.outlineVariant}`, background: S.surfaceContainerLowest, color: S.onSurfaceVariant, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >
                        {dir === 'rtl' ? <ArrowRight style={{ width: 20, height: 20 }} /> : <ArrowLeft style={{ width: 20, height: 20 }} />}
                    </button>
                    <div>
                        <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 700, color: S.onBackground, fontFamily: "'IBM Plex Sans Arabic', sans-serif" }}>
                            {ad.title || ad.campaign_name || `${t('ad_detail.ad_number')}${ad.ad_id || ad.id}`}
                        </h1>
                        <p style={{ margin: '4px 0 0', fontSize: '14px', color: S.outline, fontFamily: "'IBM Plex Sans Arabic', sans-serif", display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <User style={{ width: 14, height: 14 }} /> {ad.advertiser_name || t('ad_detail.advertiser')}
                        </p>
                    </div>
                </div>
                <div>
                    <StatusPill status={ad.status} t={t} />
                </div>
            </motion.div>

            {/* ── Grid ── */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: '24px', alignItems: 'start' }}>

                {/* Left: Media & Description */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}
                >
                    {/* Media Viewer */}
                    <div style={{ background: '#0f172a', borderRadius: '24px', overflow: 'hidden', border: `1px solid ${S.outlineVariant}`, position: 'relative', aspectRatio: '16/9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {hasMedia ? (
                            isVideo ? (
                                <video src={mediaUrl} controls autoPlay muted loop style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                            ) : (
                                <img src={mediaUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                            )
                        ) : (
                            <div style={{ textAlign: 'center' }}>
                                <Megaphone style={{ width: 64, height: 64, color: 'rgba(255,255,255,0.2)', marginBottom: '16px' }} />
                                <p style={{ margin: 0, color: 'rgba(255,255,255,0.5)', fontFamily: "'IBM Plex Sans Arabic', sans-serif" }}>{t('ad_detail.no_media')}</p>
                            </div>
                        )}
                    </div>

                    {/* Stats */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                        <div style={{ background: S.surfaceContainerLowest, borderRadius: '16px', padding: '20px', border: `1px solid ${S.outlineVariant}` }}>
                            <p style={{ margin: 0, fontSize: '13px', color: S.outline, fontFamily: "'IBM Plex Sans Arabic', sans-serif", marginBottom: '8px' }}>{t('ad_detail.total_cost')}</p>
                            <span style={{ fontSize: '28px', fontWeight: 700, color: S.primaryContainer, fontFamily: "'IBM Plex Sans Arabic', sans-serif" }}>
                                ${Number(ad.total_cost || 0).toLocaleString()}
                            </span>
                        </div>
                        <div style={{ background: S.surfaceContainerLowest, borderRadius: '16px', padding: '20px', border: `1px solid ${S.outlineVariant}` }}>
                            <p style={{ margin: 0, fontSize: '13px', color: S.outline, fontFamily: "'IBM Plex Sans Arabic', sans-serif", marginBottom: '8px' }}>{t('ad_detail.screens_count')}</p>
                            <span style={{ fontSize: '28px', fontWeight: 700, color: S.onBackground, fontFamily: "'IBM Plex Sans Arabic', sans-serif" }}>
                                {ad.screens_count || ad.screen_ids?.length || 0}
                            </span>
                        </div>
                        <div style={{ background: S.surfaceContainerLowest, borderRadius: '16px', padding: '20px', border: `1px solid ${S.outlineVariant}` }}>
                            <p style={{ margin: 0, fontSize: '13px', color: S.outline, fontFamily: "'IBM Plex Sans Arabic', sans-serif", marginBottom: '8px' }}>{t('ad_detail.estimated_impressions')}</p>
                            <span style={{ fontSize: '28px', fontWeight: 700, color: '#16a34a', fontFamily: "'IBM Plex Sans Arabic', sans-serif" }}>
                                {ad.estimated_impressions || '—'}
                            </span>
                        </div>
                    </div>
                </motion.div>

                {/* Right: Details & Actions */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}
                >
                    {/* Admin Actions */}
                    {can('manage_all') && (
                        <div style={{ background: S.surfaceContainerLowest, borderRadius: '20px', padding: '20px', border: `1px solid ${S.outlineVariant}` }}>
                            <h3 style={{ margin: '0 0 16px', fontSize: '15px', fontWeight: 700, color: S.onBackground, fontFamily: "'IBM Plex Sans Arabic', sans-serif" }}>
                                {t('ad_detail.admin_actions')}
                            </h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                {ad.status === 'Pending' && (
                                    <>
                                        <button onClick={() => handleStatus('Active')} disabled={actionLoading} style={{ width: '100%', padding: '12px', borderRadius: '12px', border: 'none', background: '#16a34a', color: '#fff', cursor: 'pointer', fontSize: '14px', fontWeight: 700, fontFamily: "'IBM Plex Sans Arabic', sans-serif", display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                            <CheckCircle style={{ width: 18, height: 18 }} /> {t('ad_detail.approve_activate')}
                                        </button>
                                        <button onClick={() => handleStatus('Rejected')} disabled={actionLoading} style={{ width: '100%', padding: '12px', borderRadius: '12px', border: 'none', background: S.errorContainer, color: S.error, cursor: 'pointer', fontSize: '14px', fontWeight: 700, fontFamily: "'IBM Plex Sans Arabic', sans-serif", display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                            <XCircle style={{ width: 18, height: 18 }} /> {t('ad_detail.reject_ad')}
                                        </button>
                                    </>
                                )}
                                {ad.status === 'Active' && (
                                    <button onClick={() => handleStatus('Paused')} disabled={actionLoading} style={{ width: '100%', padding: '12px', borderRadius: '12px', border: 'none', background: S.surfaceContainerHigh, color: S.onSurfaceVariant, cursor: 'pointer', fontSize: '14px', fontWeight: 700, fontFamily: "'IBM Plex Sans Arabic', sans-serif", display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                        <PauseCircle style={{ width: 18, height: 18 }} /> {t('ad_detail.pause_ad')}
                                    </button>
                                )}
                                {ad.status === 'Paused' && (
                                    <button onClick={() => handleStatus('Active')} disabled={actionLoading} style={{ width: '100%', padding: '12px', borderRadius: '12px', border: 'none', background: '#dbeafe', color: '#2563eb', cursor: 'pointer', fontSize: '14px', fontWeight: 700, fontFamily: "'IBM Plex Sans Arabic', sans-serif", display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                        <PlayCircle style={{ width: 18, height: 18 }} /> {t('ad_detail.resume_ad')}
                                    </button>
                                )}
                                <button onClick={() => setDeleteDialog(true)} disabled={actionLoading} style={{ width: '100%', padding: '12px', borderRadius: '12px', border: `1px solid ${S.errorContainer}`, background: '#fff', color: S.error, cursor: 'pointer', fontSize: '14px', fontWeight: 700, fontFamily: "'IBM Plex Sans Arabic', sans-serif", display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: '10px' }}>
                                    <Trash2 style={{ width: 18, height: 18 }} /> {t('ad_detail.delete_ad')}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Campaign Details */}
                    <div style={{ background: S.surfaceContainerLowest, borderRadius: '20px', padding: '20px', border: `1px solid ${S.outlineVariant}` }}>
                        <h3 style={{ margin: '0 0 20px', fontSize: '15px', fontWeight: 700, color: S.onBackground, fontFamily: "'IBM Plex Sans Arabic', sans-serif" }}>
                            {t('ad_detail.campaign_details')}
                        </h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <DetailBlock icon={Calendar} label={t('ad_detail.campaign_period')} value={`${startDate} — ${endDate}`} />
                            <DetailBlock icon={Clock} label={t('ad_detail.daily_display_times')} value={ad.start_time ? `${ad.start_time} ${t('ad_detail.to')} ${ad.end_time}` : t('ad_detail.around_the_clock')} />
                            <DetailBlock icon={Activity} label={t('ad_detail.frequency_package')} value={ad.interval_minutes ? t('ad_detail.every_min').replace('{min}', ad.interval_minutes) : '—'} />
                            <DetailBlock icon={MapPin} label={t('ad_detail.target_region')} value={ad.region_name || t('ad_detail.multiple_regions')} />
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* ── Delete Confirm ── */}
            <ConfirmDialog
                isOpen={deleteDialog}
                onClose={() => setDeleteDialog(false)}
                onConfirm={handleDelete}
                title={t('ad_detail.delete_title')}
                message={t('ad_detail.delete_message')}
                confirmLabel={t('ad_detail.confirm_delete')}
                cancelLabel={t('ad_detail.cancel')}
                confirmVariant="danger"
            />
        </div>
    );
};

export default AdDetailPage;
