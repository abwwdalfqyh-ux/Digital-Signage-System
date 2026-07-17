import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axiosClient from '../../core/api/axiosClient';
import { ENDPOINTS } from '../../core/api/endpoints';
import ConfirmDialog from '../../shared/components/ConfirmDialog';
import Modal from '../../shared/components/Modal';
import useToastStore from '../../store/useToastStore';
import usePermission, { ROLES } from '../../hooks/usePermission';
import SessionKpiCards from './components/SessionKpiCards';
import SessionsTable from './components/SessionsTable';
import DynamicPageLoader from '../../shared/components/DynamicPageLoader';
import { guessDeviceType, DeviceIcon, formatDateTime, timeAgo } from './components/SessionsTable';
import BlocklistTable from './components/BlocklistTable';
import BlockDeviceModal from './components/BlockDeviceModal';
import useTranslation from '../../i18n/useTranslation';

/* ─── Animation Variants ─── */
const containerVariants = {
    hidden: { opacity: 0 },
    show:   { opacity: 1, transition: { staggerChildren: 0.07 } },
};
const itemVariants = {
    hidden: { opacity: 0, y: 18 },
    show:   { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 280, damping: 22 } },
};

/* ═══════════════════════════════
   Mobile Session Card
   ═══════════════════════════════ */
const SessionCard = ({ session, isSuperAdmin, onRevoke }) => {
    const { t } = useTranslation();
    const [menuOpen, setMenuOpen] = useState(false);

    return (
        <motion.div
            variants={itemVariants}
            layout
            className={`relative bg-surface-container-lowest rounded-xl border overflow-hidden transition-all duration-300
                        ${session.is_current
                    ? 'border-primary outline outline-1 outline-primary shadow-sm'
                    : 'border-outline-variant shadow-sm hover:shadow-md'
                }`}
        >
            {/* Current session accent top-bar */}
            {session.is_current && (
                <div className="absolute top-0 left-0 right-0 h-1 bg-primary" />
            )}

            <div className="p-md">
                {/* ── Header ── */}
                <div className="flex items-start justify-between gap-sm mb-md">
                    {/* Device avatar */}
                    <div className={`p-sm rounded-lg flex items-center justify-center shrink-0
                                    ${session.is_current
                            ? 'bg-primary-container/10 text-primary'
                            : 'bg-surface-container text-on-surface-variant'}`}
                    >
                        <DeviceIcon deviceName={session.device_name} />
                    </div>

                    {/* Name + badges */}
                    <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-xs mb-1">
                            <span className="font-label-md text-label-md text-on-surface truncate">
                                {session.device_name || t('sessions.unknown_device')}
                            </span>
                            {session.is_current && (
                                <span className="bg-primary/10 text-primary px-2 py-0.5 rounded text-[10px] font-bold whitespace-nowrap">
                                    {t('sessions.current_session')}
                                </span>
                            )}
                        </div>
                        {isSuperAdmin && session.user_name && (
                            <div className="flex items-center gap-xs text-on-surface-variant">
                                <span className="material-symbols-outlined text-[14px]">person</span>
                                <span className="font-caption text-caption truncate">{session.user_name}</span>
                            </div>
                        )}
                    </div>

                    {/* Actions dropdown (non-current only) */}
                    {!session.is_current && (
                        <div className="relative shrink-0">
                            <button
                                onClick={() => setMenuOpen(v => !v)}
                                className="w-8 h-8 flex items-center justify-center rounded-lg text-on-surface-variant hover:bg-surface-container transition-all"
                            >
                                <span className="material-symbols-outlined">more_vert</span>
                            </button>
                            <AnimatePresence>
                                {menuOpen && (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.92, y: -4 }}
                                        animate={{ opacity: 1, scale: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.92, y: -4 }}
                                        transition={{ duration: 0.14 }}
                                        className="absolute left-0 top-full mt-1.5 w-44 bg-surface-container-lowest rounded-xl shadow-md border border-outline-variant z-20 overflow-hidden"
                                    >
                                        <button
                                            onClick={() => { setMenuOpen(false); onRevoke(session); }}
                                            className="w-full flex items-center gap-sm px-4 py-3 font-label-md text-label-md text-error hover:bg-error-container transition-colors"
                                        >
                                            <span className="material-symbols-outlined text-xl">logout</span>
                                            {t('sessions.terminate_this_session')}
                                        </button>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    )}
                </div>

                {/* ── Timestamps ── */}
                <div className="space-y-sm">
                    {session.last_used_at && (
                        <div className="flex items-center gap-sm text-on-surface-variant font-caption text-caption">
                            <span className="material-symbols-outlined text-[16px]">history</span>
                            <span className="font-bold">{timeAgo(session.last_used_at)}</span>
                            <span>•</span>
                            <span>{formatDateTime(session.last_used_at)}</span>
                        </div>
                    )}
                    <div className="flex items-center gap-sm text-on-surface-variant font-caption text-caption">
                        <span className="material-symbols-outlined text-[16px]">calendar_today</span>
                        <span>{t('sessions.started_at', { date: formatDateTime(session.created_at) })}</span>
                    </div>
                </div>

                {/* ── Revoke button ── */}
                {!session.is_current && (
                    <button
                        onClick={() => onRevoke(session)}
                        className="mt-md w-full flex items-center justify-center gap-xs py-sm rounded-lg font-label-md text-label-md text-error border border-error/30 hover:bg-error-container hover:border-error transition-all group"
                    >
                        <span className="material-symbols-outlined text-lg">logout</span>
                        {t('sessions.terminate_session')}
                    </button>
                )}
            </div>
        </motion.div>
    );
};

/* ─── Mobile Card Skeleton ─── */
const MobileSkeletonCard = () => (
    <div className="bg-surface-container-lowest rounded-xl border border-outline-variant p-md animate-pulse">
        <div className="flex items-start gap-sm mb-md">
            <div className="w-10 h-10 rounded-lg bg-surface-variant shrink-0" />
            <div className="flex-1 space-y-2 pt-1 border-0">
                <div className="h-4 bg-surface-variant rounded-lg w-3/4" />
                <div className="h-3 bg-surface-variant rounded-lg w-1/2" />
            </div>
        </div>
        <div className="space-y-2">
            <div className="h-3 bg-surface-variant rounded-lg w-2/3" />
            <div className="h-3 bg-surface-variant rounded-lg w-1/2" />
        </div>
    </div>
);

/* ─── Page-level Error State (non-table) ─── */
const PageErrorState = ({ onRetry }) => {
    const { t } = useTranslation();
    return (
    <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center py-24 bg-surface-container-lowest rounded-xl border border-error/30"
    >
        <div className="w-16 h-16 bg-error-container rounded-full flex items-center justify-center mb-md border border-error/20">
            <span className="material-symbols-outlined text-error text-3xl">warning</span>
        </div>
        <h4 className="font-title-lg text-title-lg text-on-surface mb-xs">{t('sessions.load_failed')}</h4>
            {t('sessions.load_failed_desc')}
        <button
            onClick={onRetry}
            className="flex items-center gap-xs px-md py-sm rounded-lg font-label-md text-label-md text-on-primary bg-primary hover:opacity-90 transition-opacity shadow-sm"
        >
            <span className="material-symbols-outlined text-lg">refresh</span>
            {t('sessions.retry')}
        </button>
    </motion.div>
    );
};

/* ─── Page-level Empty State ─── */
const PageEmptyState = () => {
    const { t } = useTranslation();
    return (
    <div className="flex flex-col items-center justify-center py-24 bg-surface-container-lowest rounded-xl border border-outline-variant">
        <div className="w-20 h-20 bg-surface-container-low rounded-full flex items-center justify-center mb-md border border-outline-variant">
            <span className="material-symbols-outlined text-outline text-4xl">lock</span>
        </div>
        <h4 className="font-title-lg text-title-lg text-on-surface mb-xs">{t('sessions.no_active_sessions')}</h4>
            {t('sessions.no_active_sessions_desc')}
    </div>
    );
};

/* ═══════════════════════════════════════════════════
   Main Page
   ═══════════════════════════════════════════════════ */
const SessionsPage = () => {
    const { t } = useTranslation();
    const [sessions, setSessions]         = useState([]);
    const [loading, setLoading]           = useState(true);
    const [refreshing, setRefreshing]     = useState(false);
    const [error, setError]               = useState(false);
    const [revoking, setRevoking]         = useState(false);
    const [revokeTarget, setRevokeTarget] = useState(null); // { session?, type: 'single'|'others' }
    const [viewTarget, setViewTarget]     = useState(null);
    const [blockTarget, setBlockTarget]   = useState(null);
    const [unblockTarget, setUnblockTarget] = useState(null);
    const [activeTab, setActiveTab]       = useState('sessions');
    const [blockedList, setBlockedList]   = useState([]);

    const addToast     = useToastStore(state => state.addToast);
    const { roleId } = usePermission();
    const isSuperAdmin = roleId === ROLES.SUPER_ADMIN;

    /* ── Fetch ── */
    const fetchSessions = useCallback(async (silent = false) => {
        if (silent) {
            setRefreshing(true);
        } else {
            setLoading(true);
            setError(false);
        }
        try {
            const res  = await axiosClient.get(ENDPOINTS.SESSIONS.ALL);
            // API returns { success: true, data: [...] }
            const list = Array.isArray(res.data)
                ? res.data
                : Array.isArray(res.data?.data)
                    ? res.data.data
                    : [];
            setSessions(list);
            setError(false);
        } catch (err) {
            console.error('Sessions fetch error:', err);
            if (!silent) {
                // Only show the error state (not just toast) on initial load failure
                setError(true);
            }
            // Axios interceptor already shows a toast; avoid double-toasting on silent refresh
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => { fetchSessions(); }, [fetchSessions]);

    /* ── Revoke confirm ── */
    const handleRevokeConfirm = async () => {
        if (!revokeTarget) return;
        setRevoking(true);
        try {
            if (revokeTarget.type === 'others') {
                await axiosClient.delete(ENDPOINTS.SESSIONS.REVOKE_OTHERS);
                addToast(t('sessions.terminate_others_success'), 'success');
            } else {
                await axiosClient.delete(ENDPOINTS.SESSIONS.REVOKE(revokeTarget.session.id));
                addToast(t('sessions.terminate_single_success'), 'success');
            }
            await fetchSessions(true);
        } catch (err) {
            addToast(err.response?.data?.message || t('sessions.terminate_failed'), 'error');
        } finally {
            setRevoking(false);
            setRevokeTarget(null);
        }
    };

    /* ── Block confirm ── */
    const handleBlockConfirm = async (reason) => {
        if (!blockTarget) return;
        try {
            // Add to mocked blocked list for UI demonstration
            setBlockedList(prev => [...prev, {
                id: blockTarget.id || Date.now(),
                device_name: blockTarget.device_name,
                ip_address: blockTarget.ip_address || '192.168.1.1',
                reason: reason,
                blocked_at: new Date().toISOString()
            }]);
            // Remove from current sessions to reflect UI change
            setSessions(prev => prev.filter(s => s.id !== blockTarget.id));
            
            addToast(t('sessions.block_success', { device: blockTarget.device_name || t('sessions.unknown_device') }), 'success');
        } catch (err) {
            addToast(t('sessions.block_failed'), 'error');
        } finally {
            setBlockTarget(null);
        }
    };

    const handleUnblockConfirm = () => {
        if (!unblockTarget) return;
        setBlockedList(prev => prev.filter(b => b.id !== unblockTarget.id));
        addToast(t('sessions.unblock_success'), 'success');
        setUnblockTarget(null);
    };

    /* ── Derived ── */
    const currentSession = sessions.find(s => s.is_current);
    const otherSessions  = sessions.filter(s => !s.is_current);

    /* ── Confirmation dialog texts ── */
    const dialogTitle = revokeTarget?.type === 'others'
        ? t('sessions.terminate_others_title')
        : t('sessions.terminate_single_title');

    const dialogMessage = revokeTarget?.type === 'others'
        ? t('sessions.terminate_others_confirm', { count: otherSessions.length })
        : t('sessions.terminate_single_confirm', { device: revokeTarget?.session?.device_name || t('sessions.unknown_device') });

    const dialogConfirmText = revoking
        ? t('sessions.terminating')
        : revokeTarget?.type === 'others'
            ? t('sessions.yes_terminate_all')
            : t('sessions.yes_terminate');

    /* ════════════════════════════════════
       Render
    ════════════════════════════════════ */
    return (
        <div className="space-y-lg w-full font-sans" dir="rtl">

            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-md">
                <div className="flex items-start gap-md">
                    <div className="p-sm bg-surface-container rounded-lg text-primary">
                        <span className="material-symbols-outlined text-3xl">security</span>
                    </div>
                    <div>
                        <h2 className="font-headline-lg text-headline-lg text-on-surface">{t('sessions.manage_sessions_title')}</h2>
                        <p className="font-body-md text-body-md text-on-surface-variant mt-xs">
                            {isSuperAdmin
                                ? t('sessions.manage_sessions_admin_desc')
                                : t('sessions.manage_sessions_desc')}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-sm">
                    {/* Refresh */}
                    <button
                        onClick={() => fetchSessions(true)}
                        disabled={refreshing}
                        className="flex items-center gap-xs px-md py-sm bg-surface-container-lowest border border-outline-variant rounded-lg font-label-md text-label-md text-on-surface hover:bg-surface-container transition-colors shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                        <span className={`material-symbols-outlined text-sm ${refreshing ? 'animate-spin' : ''}`}>sync</span>
                        {t('sessions.refresh')}
                    </button>
                    {/* Revoke others — only shown when there are other sessions */}
                    {!loading && !error && otherSessions.length > 0 && (
                        <button
                            onClick={() => setRevokeTarget({ type: 'others' })}
                            className="flex items-center gap-xs px-md py-sm bg-error-container text-on-error-container rounded-lg font-label-md text-label-md hover:bg-error hover:text-on-error transition-colors shadow-sm"
                        >
                            <span className="material-symbols-outlined text-sm">cancel</span>
                            {t('sessions.terminate_other_btn')}
                        </button>
                    )}
                </div>
            </div>

            {/* ══════════════════════════════
                Dynamic Page Loader (Initial Fetch)
            ══════════════════════════════ */}
            {loading ? (
                <motion.div 
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }} 
                    className="flex justify-center w-full py-10"
                >
                    <DynamicPageLoader 
                        messages={[
                            t('sessions.loading_security_1'), 
                            t('sessions.loading_security_2'),
                            t('sessions.loading_security_3')
                        ]}
                        icon="admin_panel_settings"
                    />
                </motion.div>
            ) : error ? (
                /* ══════════════════════════════
                    Page-level Error State
                ══════════════════════════════ */
                <PageErrorState onRetry={() => fetchSessions(false)} />
            ) : (
                <>
                    {/* ── Tabs ── */}
                    <div className="flex items-center gap-4 border-b border-outline-variant pb-px mb-6">
                        <button 
                            onClick={() => setActiveTab('sessions')}
                            className={`pb-3 px-2 font-bold text-sm transition-all border-b-2 flex items-center gap-2 ${activeTab === 'sessions' ? 'border-primary text-primary' : 'border-transparent text-on-surface-variant hover:text-on-surface'}`}
                        >
                            <span className="material-symbols-outlined text-[18px]">devices</span>
                            {t('sessions.active_sessions_tab')}
                            <span className="bg-surface-container-high text-xs px-2 py-0.5 rounded-full">
                                {sessions.length}
                            </span>
                        </button>
                        <button 
                            onClick={() => setActiveTab('blocklist')}
                            className={`pb-3 px-2 font-bold text-sm transition-all border-b-2 flex items-center gap-2 ${activeTab === 'blocklist' ? 'border-primary text-primary' : 'border-transparent text-on-surface-variant hover:text-on-surface'}`}
                        >
                            <span className="material-symbols-outlined text-[18px]">block</span>
                            {t('sessions.blocklist_tab')}
                            {blockedList.length > 0 && (
                                <span className="bg-error/10 text-error text-xs px-2 py-0.5 rounded-full">
                                    {blockedList.length}
                                </span>
                            )}
                        </button>
                    </div>

                    {activeTab === 'blocklist' && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                        >
                            <BlocklistTable blockedItems={blockedList} onUnblock={setUnblockTarget} />
                        </motion.div>
                    )}

                    {activeTab === 'sessions' && (
                        <>
                            {/* ── KPI Cards ── */}
                    <SessionKpiCards sessions={sessions} loading={false} />

                    {/* ── Security Banner (other sessions present) ── */}
                    <AnimatePresence>
                        {otherSessions.length > 0 && (
                            <motion.div
                                initial={{ opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -8 }}
                                className="bg-[#FFFBEB] border border-[#FDE68A] rounded-xl p-md flex items-start gap-md"
                            >
                                <span className="material-symbols-outlined text-[#D97706] mt-xs">warning</span>
                                <div>
                                    <h3 className="font-title-lg text-title-lg text-[#92400E]">
                                        {isSuperAdmin
                                            ? t('sessions.security_alert', { count: otherSessions.length })
                                            : t('sessions.security_alert', { count: otherSessions.length })
                                        }
                                    </h3>
                                    <p className="font-body-md text-body-md text-[#B45309] mt-xs">
                                        {isSuperAdmin
                                            ? t('sessions.security_alert_admin_action')
                                            : t('sessions.security_alert_action')
                                        }
                                    </p>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* ══════════════════════════════
                        DESKTOP: Table (lg+)
                    ══════════════════════════════ */}
                    <div className="hidden lg:block">
                        <SessionsTable
                            sessions={sessions}
                            loading={false}
                            error={false}          /* error handled at page level */
                            isSuperAdmin={isSuperAdmin}
                            onRevoke={(sess) => setRevokeTarget({ session: sess, type: 'single' })}
                            onViewDetails={(sess) => setViewTarget(sess)}
                            onBlockDevice={(sess) => setBlockTarget(sess)}
                            onRetry={() => fetchSessions(false)}
                        />
                    </div>

                    {/* ══════════════════════════════
                        MOBILE / TABLET: Card Grid (< lg)
                    ══════════════════════════════ */}
                    <div className="block lg:hidden">
                        {sessions.length === 0 ? (
                            <PageEmptyState />
                        ) : (
                            <motion.div
                                variants={containerVariants}
                                initial="hidden"
                                animate="show"
                                className="space-y-6"
                            >
                                {/* Current Session */}
                                {currentSession && (
                                    <section>
                                        <div className="flex items-center gap-2 mb-3">
                                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse block" />
                                            <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest">
                                                {t('sessions.current_session_title')}
                                            </h3>
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <SessionCard
                                                session={currentSession}
                                                isSuperAdmin={isSuperAdmin}
                                                onRevoke={() => {}}
                                            />
                                        </div>
                                    </section>
                                )}

                                {/* Other Sessions */}
                                {otherSessions.length > 0 && (
                                    <section>
                                        <div className="flex items-center gap-2 mb-3">
                                            <span className="w-2 h-2 rounded-full bg-gray-300 block" />
                                            <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest">
                                                {t('sessions.other_sessions_title', { count: otherSessions.length })}
                                            </h3>
                                        </div>
                                        <AnimatePresence mode="popLayout">
                                            <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                {otherSessions.map(s => (
                                                    <SessionCard
                                                        key={s.id}
                                                        session={s}
                                                        isSuperAdmin={isSuperAdmin}
                                                        onRevoke={(sess) => setRevokeTarget({ session: sess, type: 'single' })}
                                                    />
                                                ))}
                                            </motion.div>
                                        </AnimatePresence>
                                    </section>
                                )}
                            </motion.div>
                        )}
                    </div>
                        </>
                    )}
                </>
            )}

            {/* ── Unblock Device Confirmation Dialog ── */}
            <ConfirmDialog
                isOpen={!!unblockTarget}
                onClose={() => setUnblockTarget(null)}
                onConfirm={handleUnblockConfirm}
                title={t('sessions.confirm_unblock_title')}
                message={t('sessions.confirm_unblock_message', { device: unblockTarget?.device_name || t('sessions.unknown_device') })}
                confirmText={t('sessions.yes_unblock')}
                variant="primary"
            />

            {/* ── Revoke Confirmation Dialog ── */}
            <ConfirmDialog
                isOpen={!!revokeTarget}
                onClose={() => !revoking && setRevokeTarget(null)}
                onConfirm={handleRevokeConfirm}
                title={dialogTitle}
                message={revoking ? t('sessions.processing') : dialogMessage}
                confirmText={dialogConfirmText}
                variant="danger"
            />

            {/* ── Block Device Modal (With Reason) ── */}
            <BlockDeviceModal
                isOpen={!!blockTarget}
                onClose={() => setBlockTarget(null)}
                onConfirm={handleBlockConfirm}
                deviceName={blockTarget?.device_name}
                ipAddress={blockTarget?.ip_address}
            />

            {/* ── View Details Modal ── */}
            <Modal isOpen={!!viewTarget} onClose={() => setViewTarget(null)} title={t('sessions.session_details_title')}>
                {viewTarget && (
                    <div className="flex flex-col pt-2" dir="rtl">
                        <div className="flex items-center gap-4 mb-6 p-4 bg-surface-container-low rounded-2xl border border-outline-variant shadow-sm">
                            <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0 border border-primary/20">
                                <DeviceIcon deviceName={viewTarget.device_name} className="text-3xl" />
                            </div>
                            <div>
                                <h4 className="font-bold text-on-surface text-lg mb-1">{viewTarget.device_name || t('sessions.unknown_device')}</h4>
                                <p className="text-sm text-on-surface-variant font-mono bg-surface-container rounded px-2 py-0.5 inline-block" dir="ltr">
                                    IP: {viewTarget.ip_address || t('sessions.ip_default')}
                                </p>
                            </div>
                        </div>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center border-b border-outline-variant/50 pb-3">
                                <span className="text-sm text-on-surface-variant flex items-center gap-2">
                                    <span className="material-symbols-outlined text-[18px]">public</span> 
                                    {t('sessions.os_browser')}
                                </span>
                                <span className="text-xs font-medium text-on-surface font-mono max-w-[200px] truncate" title={viewTarget.user_agent}>
                                    {viewTarget.user_agent || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}
                                </span>
                            </div>
                            <div className="flex justify-between items-center border-b border-outline-variant/50 pb-3">
                                <span className="text-sm text-on-surface-variant flex items-center gap-2">
                                    <span className="material-symbols-outlined text-[18px]">login</span>
                                    {t('sessions.first_login')}
                                </span>
                                <span className="text-sm font-medium text-on-surface">{formatDateTime(viewTarget.created_at)}</span>
                            </div>
                            <div className="flex justify-between items-center border-b border-outline-variant/50 pb-3">
                                <span className="text-sm text-on-surface-variant flex items-center gap-2">
                                    <span className="material-symbols-outlined text-[18px]">update</span>
                                    {t('sessions.last_activity')}
                                </span>
                                <span className="text-sm font-medium text-on-surface">{viewTarget.last_used_at ? formatDateTime(viewTarget.last_used_at) : '—'}</span>
                            </div>
                            <div className="flex justify-between items-center pt-2">
                                <span className="text-sm text-on-surface-variant flex items-center gap-2">
                                    <span className="material-symbols-outlined text-[18px]">policy</span>
                                    {t('sessions.session_status')}
                                </span>
                                {viewTarget.is_current ? (
                                    <span className="text-xs font-bold text-emerald-700 bg-emerald-100 border border-emerald-200 px-3 py-1 rounded-full shadow-sm">
                                        {t('sessions.active_now')}
                                    </span>
                                ) : (
                                    <span className="text-xs font-bold text-orange-700 bg-orange-100 border border-orange-200 px-3 py-1 rounded-full shadow-sm">
                                        {t('sessions.active')}
                                    </span>
                                )}
                            </div>
                        </div>
                        <button 
                            onClick={() => setViewTarget(null)} 
                            className="mt-8 mb-2 w-full bg-surface-container text-on-surface py-3 rounded-xl font-bold text-sm hover:bg-outline-variant hover:text-surface-container-lowest transition-all"
                        >
                            {t('sessions.close')}
                        </button>
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default SessionsPage;
