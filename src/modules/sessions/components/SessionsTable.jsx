import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import useTranslation from '../../../i18n/useTranslation';

/* ─── Helpers ─── */
export const guessDeviceType = (deviceName = '') => {
    const n = deviceName.toLowerCase();
    if (/mobile|iphone|android|pixel|samsung|xiaomi|huawei|galaxy|oppo|vivo/.test(n)) return 'mobile';
    if (/ipad|tablet/.test(n)) return 'tablet';
    return 'desktop';
};

export const DeviceIcon = ({ deviceName, className = '' }) => {
    const type = guessDeviceType(deviceName);
    let iconName = 'laptop_mac';
    if (type === 'mobile') iconName = 'smartphone';
    if (type === 'tablet') iconName = 'tablet_mac';
    return <span className={`material-symbols-outlined ${className}`}>{iconName}</span>;
};

export const formatDateTime = (dateStr) => {
    if (!dateStr) return '—';
    try {
        return new Intl.DateTimeFormat('ar-YE', {
            year: 'numeric', month: 'short', day: 'numeric',
        }).format(new Date(dateStr));
    } catch {
        return dateStr;
    }
};

export const timeAgo = (dateStr, t) => {
    if (!dateStr || !t) return '';
    try {
        const diff = Date.now() - new Date(dateStr).getTime();
        const mins = Math.floor(diff / 60000);
        if (mins < 1)  return t('sessions.mins_ago_few');
        if (mins < 60) return t('sessions.mins_ago', { mins });
        const hrs = Math.floor(mins / 60);
        if (hrs < 24)  return t('sessions.hrs_ago', { hrs });
        return t('sessions.days_ago', { days: Math.floor(hrs / 24) });
    } catch {
        return '';
    }
};

/* ─── Table Row Skeleton ─── */
const SkeletonRow = () => (
    <tr className="border-b border-outline-variant hover:bg-surface-container-lowest transition-colors animate-pulse">
        <td className="py-5 px-6"><div className="flex items-center gap-sm">
            <div className="p-sm bg-surface-variant rounded-lg shrink-0 w-10 h-10" />
            <div className="space-y-1.5">
                <div className="h-4 bg-surface-variant rounded w-28" />
                <div className="h-3 bg-surface-variant rounded w-16" />
            </div>
        </div></td>
        <td className="py-5 px-6"><div className="h-4 bg-surface-variant rounded w-24" /></td>
        <td className="py-5 px-6"><div className="h-4 bg-surface-variant rounded w-20" /></td>
        <td className="py-5 px-6"><div className="h-4 bg-surface-variant rounded w-20" /></td>
        <td className="py-5 px-6"><div className="h-6 bg-surface-variant rounded-full w-20" /></td>
        <td className="py-5 px-6 text-center"><div className="h-8 bg-surface-variant rounded-lg w-16 mx-auto" /></td>
    </tr>
);

/* ─── Empty State ─── */
const EmptyState = () => {
    const { t } = useTranslation();
    return (
    <tr>
        <td colSpan={6}>
            <div className="flex flex-col items-center justify-center py-20">
                <div className="w-16 h-16 bg-surface-container-low rounded-full flex items-center justify-center mb-4 border border-outline-variant">
                    <span className="material-symbols-outlined text-outline text-3xl">lock</span>
                </div>
                <h4 className="text-xl font-bold text-on-surface mb-1">{t('sessions.no_active_sessions')}</h4>
                <p className="text-base text-on-surface-variant max-w-xs text-center leading-relaxed">
                    {t('sessions.no_sessions_sys')}
                </p>
            </div>
        </td>
    </tr>
    );
};

/* ─── Error State Row ─── */
const ErrorState = ({ onRetry }) => {
    const { t } = useTranslation();
    return (
    <tr>
        <td colSpan={6}>
            <div className="flex flex-col items-center justify-center py-16">
                <div className="w-14 h-14 bg-error-container rounded-full flex items-center justify-center mb-4 border border-error/30">
                    <span className="material-symbols-outlined text-error text-2xl">warning</span>
                </div>
                <h4 className="text-xl font-bold text-on-surface mb-1">{t('sessions.load_failed_table')}</h4>
                <p className="text-base text-on-surface-variant mb-4">{t('sessions.load_failed_table_desc')}</p>
                <button
                    onClick={onRetry}
                    className="px-6 py-2.5 rounded-xl font-bold text-sm text-on-primary bg-primary hover:opacity-90 transition-opacity"
                >
                    {t('sessions.retry')}
                </button>
            </div>
        </td>
    </tr>
    );
};

/* ═══════════════════════════════════════════════
   Main Table Component
   ═══════════════════════════════════════════════ */
const SessionsTable = ({ sessions = [], loading, error, isSuperAdmin, onRevoke, onViewDetails, onBlockDevice, onRetry }) => {
    const { t } = useTranslation();
    return (
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl shadow-sm overflow-hidden">
            <div className="p-5 border-b border-outline-variant text-center">
                <h3 className="text-xl sm:text-2xl font-bold text-on-surface">{t('sessions.active_sessions_tab')}</h3>
            </div>
            
            <div className="overflow-x-auto">
                <table className="w-full text-right border-collapse">
                    <thead>
                        <tr className="bg-surface-container-low text-on-surface font-bold text-lg sm:text-xl border-b-2 border-outline-variant">
                            <th className="py-5 px-6 font-bold whitespace-nowrap text-start">{t('sessions.device_col')}</th>
                            {isSuperAdmin && <th className="py-5 px-6 font-bold whitespace-nowrap text-start">{t('sessions.user_col')}</th>}
                            <th className="py-5 px-6 font-bold whitespace-nowrap text-start">{t('sessions.last_activity_col')}</th>
                            <th className="py-5 px-6 font-bold whitespace-nowrap text-start">{t('sessions.started_in_col')}</th>
                            <th className="py-5 px-6 font-bold whitespace-nowrap text-start">{t('sessions.status_col')}</th>
                            <th className="py-5 px-6 font-bold whitespace-nowrap text-left">{t('sessions.actions_col')}</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-outline-variant text-base sm:text-lg font-medium text-on-surface">
                        {/* Loading */}
                        {loading && Array.from({ length: 4 }).map((_, i) => <SkeletonRow key={i} />)}

                        {/* Error */}
                        {!loading && error && <ErrorState onRetry={onRetry} />}

                        {/* Empty */}
                        {!loading && !error && sessions.length === 0 && <EmptyState />}

                        {/* Data rows */}
                        {!loading && !error && sessions.length > 0 && (
                            <AnimatePresence mode="popLayout">
                                {sessions.map((session) => (
                                    <motion.tr
                                        key={session.id}
                                        layout
                                        initial={{ opacity: 0, y: 8 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, x: -20 }}
                                        transition={{ duration: 0.2 }}
                                        className="border-b border-outline-variant hover:bg-surface-container-lowest transition-colors"
                                    >
                                        {/* Device column */}
                                        <td className="py-5 px-6">
                                            <div className="flex items-center gap-3">
                                                <div className={`p-2.5 rounded-xl ${
                                                    session.is_current ? 'bg-primary-container/10 text-primary' : 'bg-surface-container text-on-surface-variant'
                                                }`}>
                                                    <DeviceIcon deviceName={session.device_name} className="text-2xl" />
                                                </div>
                                                <div>
                                                    <p className="font-bold text-lg text-on-surface flex items-center gap-2">
                                                        {session.device_name || t('sessions.unknown_device')}
                                                        {session.is_current && (
                                                            <span className="bg-primary/10 text-primary px-2.5 py-0.5 rounded-full text-xs font-bold">{t('sessions.current_session')}</span>
                                                        )}
                                                    </p>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <p className="text-on-surface-variant text-sm font-medium capitalize">
                                                            {guessDeviceType(session.device_name) === 'desktop' ? 'Desktop' :
                                                             guessDeviceType(session.device_name) === 'mobile' ? 'Mobile' : 'Tablet'}
                                                        </p>
                                                        {session.ip_address && (
                                                            <p className="text-on-surface-variant text-sm font-medium flex items-center gap-1">
                                                                <span className="w-1.5 h-1.5 rounded-full bg-outline-variant"></span>
                                                                <span className="font-mono text-xs" dir="ltr">{session.ip_address}</span>
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>

                                        {/* User column (SuperAdmin only) */}
                                        {isSuperAdmin && (
                                            <td className="py-5 px-6 text-base font-semibold text-on-surface">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 rounded-full bg-surface-variant overflow-hidden flex items-center justify-center text-on-surface-variant">
                                                        <span className="material-symbols-outlined text-xl">person</span>
                                                    </div>
                                                    <span>{session.user_name || '—'}</span>
                                                </div>
                                            </td>
                                        )}

                                        {/* Last active */}
                                        <td className="py-5 px-6 text-base font-semibold text-on-surface-variant">
                                            {session.last_used_at ? timeAgo(session.last_used_at, t) : '—'}
                                        </td>

                                        {/* Created at */}
                                        <td className="py-5 px-6 text-base font-semibold text-on-surface-variant">
                                            {formatDateTime(session.created_at)}
                                        </td>

                                        {/* Status */}
                                        <td className="py-5 px-6">
                                            {session.is_current ? (
                                                <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-green-100 text-green-800 text-sm font-bold">
                                                    <span className="w-2.5 h-2.5 rounded-full bg-green-500 block" />
                                                    {t('sessions.active_now')}
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-secondary-container/30 text-secondary text-sm font-bold">
                                                    {t('sessions.active')}
                                                </span>
                                            )}
                                        </td>

                                        {/* Action */}
                                        <td className="py-5 px-6 text-left whitespace-nowrap">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => onViewDetails(session)}
                                                    className="w-9 h-9 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-primary-container hover:text-primary transition-colors"
                                                    title={t('sessions.security_details')}
                                                >
                                                    <span className="material-symbols-outlined text-xl">visibility</span>
                                                </button>
                                                {session.is_current ? (
                                                    <span className="text-xs text-outline-variant font-bold px-2">{t('sessions.current_session_title')}</span>
                                                ) : (
                                                    <>
                                                        <button
                                                            onClick={() => onBlockDevice(session)}
                                                            className="w-9 h-9 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-orange-100 hover:text-orange-600 transition-colors"
                                                            title={t('sessions.block_ip_device')}
                                                        >
                                                            <span className="material-symbols-outlined text-xl">block</span>
                                                        </button>
                                                        <button
                                                            onClick={() => onRevoke(session)}
                                                            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-error/10 hover:bg-error text-error hover:text-white text-xs font-bold transition-all shadow-sm"
                                                            title={t('sessions.force_terminate')}
                                                        >
                                                            <span className="material-symbols-outlined text-base">logout</span>
                                                            {t('sessions.terminate')}
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </motion.tr>
                                ))}
                            </AnimatePresence>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default SessionsTable;
