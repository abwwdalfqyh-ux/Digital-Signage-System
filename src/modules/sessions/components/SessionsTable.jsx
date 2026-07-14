import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

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
            // hour: '2-digit', minute: '2-digit', // omitting this to match screenshot
        }).format(new Date(dateStr));
    } catch {
        return dateStr;
    }
};

export const timeAgo = (dateStr) => {
    if (!dateStr) return '';
    try {
        const diff = Date.now() - new Date(dateStr).getTime();
        const mins = Math.floor(diff / 60000);
        if (mins < 1)  return 'منذ لحظات';
        if (mins < 60) return `منذ ${mins} دقيقة`;
        const hrs = Math.floor(mins / 60);
        if (hrs < 24)  return `منذ ${hrs} ساعة`;
        return `منذ ${Math.floor(hrs / 24)} يوم`;
    } catch {
        return '';
    }
};

/* ─── Table Row Skeleton ─── */
const SkeletonRow = () => (
    <tr className="border-b border-outline-variant hover:bg-surface-container-lowest transition-colors animate-pulse">
        <td className="p-md"><div className="flex items-center gap-sm">
            <div className="p-sm bg-surface-variant rounded-lg shrink-0 w-10 h-10" />
            <div className="space-y-1.5">
                <div className="h-4 bg-surface-variant rounded w-28" />
                <div className="h-3 bg-surface-variant rounded w-16" />
            </div>
        </div></td>
        <td className="p-md"><div className="h-4 bg-surface-variant rounded w-24" /></td>
        <td className="p-md"><div className="h-4 bg-surface-variant rounded w-20" /></td>
        <td className="p-md"><div className="h-4 bg-surface-variant rounded w-20" /></td>
        <td className="p-md"><div className="h-6 bg-surface-variant rounded-full w-20" /></td>
        <td className="p-md text-center"><div className="h-8 bg-surface-variant rounded-lg w-16 mx-auto" /></td>
    </tr>
);

/* ─── Empty State ─── */
const EmptyState = () => (
    <tr>
        <td colSpan={6}>
            <div className="flex flex-col items-center justify-center py-20">
                <div className="w-16 h-16 bg-surface-container-low rounded-full flex items-center justify-center mb-4 border border-outline-variant">
                    <span className="material-symbols-outlined text-outline text-3xl">lock</span>
                </div>
                <h4 className="font-title-lg text-title-lg text-on-surface mb-1">لا توجد جلسات نشطة</h4>
                <p className="font-body-md text-body-md text-on-surface-variant max-w-xs text-center leading-relaxed">
                    لم يتم العثور على أي جلسات نشطة حالياً في النظام
                </p>
            </div>
        </td>
    </tr>
);

/* ─── Error State Row ─── */
const ErrorState = ({ onRetry }) => (
    <tr>
        <td colSpan={6}>
            <div className="flex flex-col items-center justify-center py-16">
                <div className="w-14 h-14 bg-error-container rounded-full flex items-center justify-center mb-4 border border-error/30">
                    <span className="material-symbols-outlined text-error text-2xl">warning</span>
                </div>
                <h4 className="font-title-lg text-title-lg text-on-surface mb-1">تعذّر تحميل البيانات</h4>
                <p className="font-body-sm text-body-sm text-on-surface-variant mb-4">حدث خطأ أثناء جلب بيانات الجلسات</p>
                <button
                    onClick={onRetry}
                    className="px-md py-sm rounded-lg font-label-md text-label-md text-on-primary bg-primary hover:opacity-90 transition-opacity"
                >
                    إعادة المحاولة
                </button>
            </div>
        </td>
    </tr>
);

/* ═══════════════════════════════════════════════
   Main Table Component
   ═══════════════════════════════════════════════ */
const SessionsTable = ({ sessions = [], loading, error, isSuperAdmin, onRevoke, onViewDetails, onBlockDevice, onRetry }) => {
    return (
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl shadow-sm overflow-hidden">
            <div className="p-lg border-b border-outline-variant">
                <h3 className="font-title-lg text-title-lg text-on-surface">الجلسات النشطة</h3>
            </div>
            
            <div className="overflow-x-auto">
                <table className="w-full text-right border-collapse">
                    <thead>
                        <tr className="bg-surface-container-low text-on-surface-variant font-label-md text-label-md border-b border-outline-variant">
                            <th className="p-md font-medium">الجهاز</th>
                            {isSuperAdmin && <th className="p-md font-medium">المستخدم</th>}
                            <th className="p-md font-medium">آخر نشاط</th>
                            <th className="p-md font-medium">بدأت في</th>
                            <th className="p-md font-medium">الحالة</th>
                            <th className="p-md font-medium text-left">إجراءات</th>
                        </tr>
                    </thead>
                    <tbody className="font-body-md text-body-md text-on-surface">
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
                                        <td className="p-md">
                                            <div className="flex items-center gap-sm">
                                                <div className={`p-sm rounded-lg ${
                                                    session.is_current ? 'bg-primary-container/10 text-primary' : 'bg-surface-container text-on-surface-variant'
                                                }`}>
                                                    <DeviceIcon deviceName={session.device_name} />
                                                </div>
                                                <div>
                                                    <p className="font-medium flex items-center gap-xs">
                                                        {session.device_name || 'جهاز غير معروف'}
                                                        {session.is_current && (
                                                            <span className="bg-primary/10 text-primary px-2 py-0.5 rounded text-[10px] font-bold">الحالية</span>
                                                        )}
                                                    </p>
                                                    <div className="flex items-center gap-2 mt-0.5">
                                                        <p className="text-on-surface-variant font-caption text-caption capitalize">
                                                            {guessDeviceType(session.device_name) === 'desktop' ? 'Desktop' :
                                                             guessDeviceType(session.device_name) === 'mobile' ? 'Mobile' : 'Tablet'}
                                                        </p>
                                                        {session.ip_address && (
                                                            <p className="text-on-surface-variant font-caption text-caption flex items-center gap-1">
                                                                <span className="w-1 h-1 rounded-full bg-outline-variant"></span>
                                                                <span className="font-mono text-[10px]" dir="ltr">{session.ip_address}</span>
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>

                                        {/* User column (SuperAdmin only) */}
                                        {isSuperAdmin && (
                                            <td className="p-md">
                                                <div className="flex items-center gap-sm">
                                                    <div className="w-8 h-8 rounded-full bg-surface-variant overflow-hidden flex items-center justify-center text-on-surface-variant">
                                                        <span className="material-symbols-outlined text-lg">person</span>
                                                    </div>
                                                    <span>{session.user_name || '—'}</span>
                                                </div>
                                            </td>
                                        )}

                                        {/* Last active */}
                                        <td className="p-md text-on-surface-variant">
                                            {session.last_used_at ? timeAgo(session.last_used_at) : '—'}
                                        </td>

                                        {/* Created at */}
                                        <td className="p-md text-on-surface-variant">
                                            {formatDateTime(session.created_at)}
                                        </td>

                                        {/* Status */}
                                        <td className="p-md">
                                            {session.is_current ? (
                                                <span className="inline-flex items-center gap-xs px-2 py-1 rounded-full bg-green-100 text-green-800 font-label-md text-label-md">
                                                    <span className="w-2 h-2 rounded-full bg-green-500 block" />
                                                    نشطة الآن
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-xs px-2 py-1 rounded-full bg-secondary-container/30 text-secondary font-label-md text-label-md">
                                                    نشطة
                                                </span>
                                            )}
                                        </td>

                                        {/* Action */}
                                        <td className="p-md text-left whitespace-nowrap">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => onViewDetails(session)}
                                                    className="w-8 h-8 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-primary-container hover:text-primary transition-colors"
                                                    title="عرض التفاصيل الأمنية"
                                                >
                                                    <span className="material-symbols-outlined text-[18px]">visibility</span>
                                                </button>
                                                {session.is_current ? (
                                                    <span className="text-xs text-outline-variant font-bold px-2">الجلسة الحالية</span>
                                                ) : (
                                                    <>
                                                        <button
                                                            onClick={() => onBlockDevice(session)}
                                                            className="w-8 h-8 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-orange-100 hover:text-orange-600 transition-colors"
                                                            title="حظر الـ IP أو الجهاز"
                                                        >
                                                            <span className="material-symbols-outlined text-[18px]">block</span>
                                                        </button>
                                                        <button
                                                            onClick={() => onRevoke(session)}
                                                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-error/10 hover:bg-error text-error hover:text-white text-xs font-bold transition-all shadow-sm"
                                                            title="إنهاء الجلسة (إجباري)"
                                                        >
                                                            <span className="material-symbols-outlined text-[15px]">logout</span>
                                                            إنهاء
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
