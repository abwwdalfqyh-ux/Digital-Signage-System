import React from 'react';
import useTranslation from '../../i18n/useTranslation';

/**
 * Reusable Status Badge Component
 * Displays a colored badge based on status type.
 */
const statusConfigColors = {
    // Screen statuses
    Online:       { color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', dot: 'bg-emerald-400' },
    Offline:      { color: 'bg-red-500/10 text-red-400 border-red-500/20',           dot: 'bg-red-400' },
    Maintenance:  { color: 'bg-amber-500/10 text-amber-400 border-amber-500/20',     dot: 'bg-amber-400' },
    // Ad statuses
    Active:          { color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', dot: 'bg-emerald-400' },
    Pending:         { color: 'bg-amber-500/10 text-amber-400 border-amber-500/20',     dot: 'bg-amber-400' },
    Paused:          { color: 'bg-gray-500/10 text-gray-400 border-gray-500/20',        dot: 'bg-gray-400' },
    Rejected:        { color: 'bg-red-500/10 text-red-400 border-red-500/20',           dot: 'bg-red-400' },
    waiting_payment: { color: 'bg-orange-500/10 text-orange-400 border-orange-500/20', dot: 'bg-orange-400' },
    // Payment statuses
    paid:      { color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', dot: 'bg-emerald-400' },
    unpaid:    { color: 'bg-red-500/10 text-red-400 border-red-500/20',           dot: 'bg-red-400' },
    completed: { color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', dot: 'bg-emerald-400' },
    pending:   { color: 'bg-amber-500/10 text-amber-400 border-amber-500/20',     dot: 'bg-amber-400' },
    failed:    { color: 'bg-red-500/10 text-red-400 border-red-500/20',           dot: 'bg-red-400' },
    // User statuses
    Suspended: { color: 'bg-red-500/10 text-red-400 border-red-500/20', dot: 'bg-red-400' },
};

const StatusBadge = ({ status, customLabel }) => {
    const { t } = useTranslation();
    const configColor = statusConfigColors[status] || {
        color: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
        dot: 'bg-gray-400'
    };

    const labelMapping = {
        Online: t('common.online'),
        Offline: t('common.offline'),
        Maintenance: t('common.maintenance'),
        Active: t('common.active'),
        Pending: t('common.pending_review'),
        Paused: t('common.paused'),
        Rejected: t('common.rejected'),
        waiting_payment: t('common.waiting_payment'),
        paid: t('common.paid'),
        unpaid: t('common.unpaid'),
        completed: t('common.completed'),
        pending: t('common.pending'),
        failed: t('common.failed'),
        Suspended: t('common.suspended')
    };

    const label = customLabel || labelMapping[status] || status;

    return (
        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${configColor.color}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${configColor.dot} animate-pulse`}></span>
            {label}
        </span>
    );
};

export default StatusBadge;
