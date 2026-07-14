import React from 'react';

/**
 * Reusable Status Badge Component
 * Displays a colored badge based on status type.
 */
const statusConfig = {
    // Screen statuses
    Online:       { label: 'متصل',        color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', dot: 'bg-emerald-400' },
    Offline:      { label: 'غير متصل',    color: 'bg-red-500/10 text-red-400 border-red-500/20',           dot: 'bg-red-400' },
    Maintenance:  { label: 'صيانة',        color: 'bg-amber-500/10 text-amber-400 border-amber-500/20',     dot: 'bg-amber-400' },
    // Ad statuses
    Active:          { label: 'نشط',           color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', dot: 'bg-emerald-400' },
    Pending:         { label: 'قيد المراجعة',  color: 'bg-amber-500/10 text-amber-400 border-amber-500/20',     dot: 'bg-amber-400' },
    Paused:          { label: 'متوقف',         color: 'bg-gray-500/10 text-gray-400 border-gray-500/20',        dot: 'bg-gray-400' },
    Rejected:        { label: 'مرفوض',         color: 'bg-red-500/10 text-red-400 border-red-500/20',           dot: 'bg-red-400' },
    waiting_payment: { label: 'بانتظار الدفع', color: 'bg-orange-500/10 text-orange-400 border-orange-500/20', dot: 'bg-orange-400' },
    // Payment statuses
    paid:      { label: 'مدفوع',    color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', dot: 'bg-emerald-400' },
    unpaid:    { label: 'غير مدفوع', color: 'bg-red-500/10 text-red-400 border-red-500/20',           dot: 'bg-red-400' },
    completed: { label: 'مكتمل',    color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', dot: 'bg-emerald-400' },
    pending:   { label: 'معلق',     color: 'bg-amber-500/10 text-amber-400 border-amber-500/20',     dot: 'bg-amber-400' },
    failed:    { label: 'فشل',      color: 'bg-red-500/10 text-red-400 border-red-500/20',           dot: 'bg-red-400' },
    // User statuses
    Suspended: { label: 'موقوف', color: 'bg-red-500/10 text-red-400 border-red-500/20', dot: 'bg-red-400' },
};

const StatusBadge = ({ status, customLabel }) => {
    const config = statusConfig[status] || {
        label: status,
        color: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
        dot: 'bg-gray-400'
    };

    return (
        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${config.color}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${config.dot} animate-pulse`}></span>
            {customLabel || config.label}
        </span>
    );
};

export default StatusBadge;
