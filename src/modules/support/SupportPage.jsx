import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    HeadphonesIcon,
    Plus,
    X,
    Send,
    Clock,
    CheckCircle,
    AlertCircle,
    XCircle,
    ChevronDown,
    Monitor,
    Wifi,
    Zap,
    HelpCircle,
    RefreshCw,
    MessageSquare,
} from 'lucide-react';
import axiosClient from '../../core/api/axiosClient';
import { ENDPOINTS } from '../../core/api/endpoints';
import { useSupportTickets, useCreateSupportTicket } from '../../hooks/api/useSupportTickets';
import { useScreens } from '../../hooks/api/useScreens';
import echo from '../../core/api/echo';
import useAuthStore from '../../store/useAuthStore';
import { useQueryClient } from '@tanstack/react-query';
import useTranslation from '../../i18n/useTranslation';

/* ─── Status Configs ─────────────────────────────────────────── */
const getStatusMap = (t) => ({
    open:        { label: t('support.status_open'),       color: '#3b82f6', bg: 'rgba(59,130,246,0.1)',  Icon: Clock },
    in_progress: { label: t('support.status_in_progress'), color: '#f59e0b', bg: 'rgba(245,158,11,0.1)',  Icon: RefreshCw },
    resolved:    { label: t('support.status_resolved'),    color: '#10b981', bg: 'rgba(16,185,129,0.1)',  Icon: CheckCircle },
    closed:      { label: t('support.status_closed'),      color: '#6b7280', bg: 'rgba(107,114,128,0.1)', Icon: XCircle },
});

/* ─── Priority Configs ───────────────────────────────────────── */
const getPriorityMap = (t) => ({
    low:    { label: t('support.priority_low'), color: '#6b7280' },
    medium: { label: t('support.priority_medium'), color: '#f59e0b' },
    high:   { label: t('support.priority_high'),  color: '#ef4444' },
    urgent: { label: t('support.priority_urgent'),  color: '#dc2626' },
});

/* ─── Category Configs ───────────────────────────────────────── */
const getCategories = (t) => [
    { value: 'screen_offline',    label: t('support.category_screen_offline'),        Icon: Wifi },
    { value: 'display_issue',     label: t('support.category_display_issue'),         Icon: Monitor },
    { value: 'technical_fault',   label: t('support.category_technical_fault'),       Icon: Zap },
    { value: 'billing_query',     label: t('support.category_billing_query'),         Icon: AlertCircle },
    { value: 'other',             label: t('support.category_other'),                 Icon: HelpCircle },
];

/* ─── Skeleton Loader ────────────────────────────────────────── */
const SkeletonCard = () => (
    <div className="bg-white border border-[#c3c6d7] shadow-sm rounded-2xl p-5 animate-pulse">
        <div className="flex justify-between items-start mb-3">
            <div className="h-4 bg-white/10 rounded w-1/3" />
            <div className="h-6 bg-white/10 rounded-full w-20" />
        </div>
        <div className="h-3 bg-[#f1f3ff] rounded w-2/3 mb-2" />
        <div className="h-3 bg-[#f1f3ff] rounded w-1/2" />
    </div>
);

const TicketCard = ({ ticket, onClick }) => {
    const { t } = useTranslation();
    const status  = getStatusMap(t)[ticket.status]   || getStatusMap(t).open;
    const priority = getPriorityMap(t)[ticket.priority] || getPriorityMap(t).medium;
    const StatusIcon = status.Icon;

    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -2, borderColor: '#c3c6d7' }}
            onClick={() => onClick(ticket)}
            className="bg-white border border-[#c3c6d7] shadow-sm rounded-2xl p-5 cursor-pointer transition-all"
        >
            <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-black text-[#141b2b] truncate">{ticket.subject}</p>
                    <p className="text-xs text-[#737686] mt-0.5">#{ticket.id} · {ticket.created_at_human || ticket.created_at}</p>
                </div>
                {/* Status Badge */}
                <span
                    className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold flex-shrink-0"
                    style={{ color: status.color, background: status.bg }}
                >
                    <StatusIcon className="w-3 h-3" />
                    {status.label}
                </span>
            </div>

            <p className="text-xs text-[#737686] line-clamp-2 mb-3">{ticket.description}</p>

            <div className="flex items-center justify-between">
                <span className="text-xs font-bold" style={{ color: priority.color }}>
                    ● {t('support.priority_label_prefix')} {priority.label}
                </span>
                {ticket.category && (
                    <span className="text-xs text-[#434655] bg-[#f1f3ff] px-2 py-0.5 rounded-full">
                        {getCategories(t).find(c => c.value === ticket.category)?.label || ticket.category}
                    </span>
                )}
            </div>
        </motion.div>
    );
};

const NewTicketModal = ({ onClose, onSuccess }) => {
    const { t } = useTranslation();
    const [form, setForm] = useState({
        subject: '',
        category: 'screen_offline',
        priority: 'medium',
        description: '',
        screen_id: '',
    });
    const [error, setError] = useState('');
    const { data: screens = [] } = useScreens();
    const { mutateAsync: createTicket, isLoading: loading } = useCreateSupportTicket();

    const handleChange = (field, value) =>
        setForm(prev => ({ ...prev, [field]: value }));

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.subject.trim() || !form.description.trim()) {
            setError(t('support.fill_required_fields'));
            return;
        }
        setError('');
        try {
            await createTicket(form);
            onSuccess();
        } catch (err) {
            setError(err.response?.data?.message || t('support.submit_error'));
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }}
            onClick={(e) => e.target === e.currentTarget && onClose()}
        >
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="w-[95%] sm:w-[500px] shrink-0 bg-white border border-[#c3c6d7] rounded-3xl overflow-hidden"
                dir="rtl"
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-5 border-b border-[#c3c6d7]">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-[#e9edff] flex items-center justify-center">
                            <Plus className="w-4 h-4 text-[#004ac6]" />
                        </div>
                        <div>
                            <h2 className="text-sm font-black text-[#141b2b]">{t('support.new_ticket')}</h2>
                            <p className="text-xs text-[#737686]">{t('support.tell_us_problem')}</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 rounded-xl bg-[#f1f3ff] hover:bg-[#e9edff] flex items-center justify-center transition-colors"
                    >
                        <X className="w-4 h-4 text-[#434655]" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {/* Screen Selection */}
                    <div>
                        <label className="block text-xs font-bold text-[#434655] mb-1.5">
                            {t('support.related_screen')}
                        </label>
                        <div className="relative">
                            <select
                                value={form.screen_id}
                                onChange={e => handleChange('screen_id', e.target.value)}
                                className="w-full appearance-none bg-[#f1f3ff] border border-[#c3c6d7] rounded-xl px-4 py-2.5 text-sm text-[#141b2b] focus:outline-none focus:border-[#004ac6]/50 transition-colors"
                            >
                                <option value="" style={{ background: '#ffffff' }}>-- {t('support.general_issue')} --</option>
                                {screens.map(s => (
                                    <option key={s.screen_id} value={s.screen_id} style={{ background: '#ffffff' }}>
                                        {s.screen_name} ({t('support.screen_number')}: {s.screen_id})
                                    </option>
                                ))}
                            </select>
                            <ChevronDown className="absolute left-3 top-3 w-4 h-4 text-[#737686] pointer-events-none" />
                        </div>
                    </div>

                    {/* Subject */}
                    <div>
                        <label className="block text-xs font-bold text-[#434655] mb-1.5">
                            {t('support.issue_title')} <span className="text-red-400">*</span>
                        </label>
                        <input
                            type="text"
                            placeholder={t('support.issue_title_placeholder')}
                            value={form.subject}
                            onChange={e => handleChange('subject', e.target.value)}
                            maxLength={120}
                            className="w-full bg-[#f1f3ff] border border-[#c3c6d7] rounded-xl px-4 py-2.5 text-sm text-[#141b2b] placeholder-gray-600 focus:outline-none focus:border-[#004ac6]/50 transition-colors"
                        />
                    </div>

                    {/* Category + Priority */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-bold text-[#434655] mb-1.5">{t('support.issue_type')}</label>
                            <div className="relative">
                                <select
                                    value={form.category}
                                    onChange={e => handleChange('category', e.target.value)}
                                    className="w-full appearance-none bg-[#f1f3ff] border border-[#c3c6d7] rounded-xl px-4 py-2.5 text-sm text-[#141b2b] focus:outline-none focus:border-[#004ac6]/50 transition-colors"
                                >
                                    {getCategories(t).map(c => (
                                        <option key={c.value} value={c.value} style={{ background: '#ffffff' }}>
                                            {c.label}
                                        </option>
                                    ))}
                                </select>
                                <ChevronDown className="absolute left-3 top-3 w-4 h-4 text-[#737686] pointer-events-none" />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-[#434655] mb-1.5">{t('support.priority')}</label>
                            <div className="relative">
                                <select
                                    value={form.priority}
                                    onChange={e => handleChange('priority', e.target.value)}
                                    className="w-full appearance-none bg-[#f1f3ff] border border-[#c3c6d7] rounded-xl px-4 py-2.5 text-sm text-[#141b2b] focus:outline-none focus:border-[#004ac6]/50 transition-colors"
                                >
                                    {Object.entries(getPriorityMap(t)).map(([val, cfg]) => (
                                        <option key={val} value={val} style={{ background: '#ffffff' }}>
                                            {cfg.label}
                                        </option>
                                    ))}
                                </select>
                                <ChevronDown className="absolute left-3 top-3 w-4 h-4 text-[#737686] pointer-events-none" />
                            </div>
                        </div>
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-xs font-bold text-[#434655] mb-1.5">
                            {t('support.issue_description')} <span className="text-red-400">*</span>
                        </label>
                        <textarea
                            placeholder={t('support.issue_description_placeholder')}
                            value={form.description}
                            onChange={e => handleChange('description', e.target.value)}
                            rows={4}
                            className="w-full bg-[#f1f3ff] border border-[#c3c6d7] rounded-xl px-4 py-2.5 text-sm text-[#141b2b] placeholder-gray-600 focus:outline-none focus:border-[#004ac6]/50 transition-colors resize-none"
                        />
                    </div>

                    {/* Error */}
                    {error && (
                        <motion.p
                            initial={{ opacity: 0, y: -4 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2.5"
                        >
                            {error}
                        </motion.p>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-3 pt-1">
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-[#004ac6] hover:bg-[#2563eb] disabled:opacity-50 disabled:cursor-not-allowed rounded-xl text-sm font-black text-white transition-colors"
                        >
                            {loading ? (
                                <RefreshCw className="w-4 h-4 animate-spin" />
                            ) : (
                                <Send className="w-4 h-4" />
                            )}
                            {loading ? t('support.submitting') : t('support.submit_ticket')}
                        </button>
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-5 py-2.5 bg-[#f1f3ff] hover:bg-[#e9edff] rounded-xl text-sm font-bold text-[#434655] transition-colors"
                        >
                            {t('common.cancel')}
                        </button>
                    </div>
                </form>
            </motion.div>
        </motion.div>
    );
};

const TicketDetailDrawer = ({ ticket, onClose }) => {
    const { t } = useTranslation();
    const status   = getStatusMap(t)[ticket.status]    || getStatusMap(t).open;
    const priority = getPriorityMap(t)[ticket.priority] || getPriorityMap(t).medium;
    const StatusIcon = status.Icon;

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }}
            onClick={(e) => e.target === e.currentTarget && onClose()}
        >
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="w-[95%] sm:w-[500px] shrink-0 bg-white border border-[#c3c6d7] rounded-3xl overflow-hidden"
                dir="rtl"
            >
                {/* Header */}
                <div className="flex items-start justify-between px-6 py-5 border-b border-[#c3c6d7]">
                    <div className="flex-1 min-w-0">
                        <p className="text-xs text-[#737686] mb-1">#{ticket.id}</p>
                        <h2 className="text-sm font-black text-[#141b2b]">{ticket.subject}</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 ml-3 rounded-xl bg-[#f1f3ff] hover:bg-[#e9edff] flex items-center justify-center transition-colors flex-shrink-0"
                    >
                        <X className="w-4 h-4 text-[#434655]" />
                    </button>
                </div>

                <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
                    {/* Status + Priority Row */}
                    <div className="flex flex-wrap items-center gap-3">
                        <span
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold"
                            style={{ color: status.color, background: status.bg }}
                        >
                            <StatusIcon className="w-3 h-3" />
                            {status.label}
                        </span>
                        <span className="text-xs font-bold" style={{ color: priority.color }}>
                            ● {t('support.priority_label_prefix')} {priority.label}
                        </span>
                        {ticket.category && (
                            <span className="text-xs text-[#434655] bg-[#f1f3ff] px-2 py-1 rounded-full">
                                {getCategories(t).find(c => c.value === ticket.category)?.label || ticket.category}
                            </span>
                        )}
                        {ticket.screen && (
                            <span className="text-xs text-[#004ac6] bg-[#e9edff] px-2 py-1 rounded-full flex items-center gap-1">
                                <Monitor className="w-3 h-3" />
                                {ticket.screen.screen_name} ({t('support.screen_number')}: {ticket.screen.screen_id})
                            </span>
                        )}
                    </div>

                    {/* Description */}
                    <div className="bg-[#f1f3ff] border border-[#c3c6d7] rounded-2xl p-4">
                        <p className="text-xs font-bold text-[#737686] mb-2">{t('support.issue_description')}</p>
                        <p className="text-sm text-[#141b2b] leading-relaxed">{ticket.description}</p>
                    </div>

                    {/* Admin Reply */}
                    {ticket.admin_reply && (
                        <div className="bg-indigo-500/5 border border-indigo-500/20 rounded-2xl p-4">
                            <div className="flex items-center gap-2 mb-2">
                                <MessageSquare className="w-3.5 h-3.5 text-[#004ac6]" />
                                <p className="text-xs font-bold text-[#004ac6]">{t('support.support_reply')}</p>
                            </div>
                            <p className="text-sm text-[#141b2b] leading-relaxed">{ticket.admin_reply}</p>
                        </div>
                    )}

                    {/* Timeline */}
                    <div>
                        <p className="text-xs font-bold text-[#737686] mb-3">{t('support.info')}</p>
                        <div className="space-y-2">
                            <div className="flex justify-between text-xs">
                                <span className="text-[#434655]">{t('support.created_at')}</span>
                                <span className="text-[#434655]">{ticket.created_at_human || ticket.created_at}</span>
                            </div>
                            {ticket.updated_at && ticket.updated_at !== ticket.created_at && (
                                <div className="flex justify-between text-xs">
                                    <span className="text-[#434655]">{t('support.last_updated')}</span>
                                    <span className="text-[#434655]">{ticket.updated_at_human || ticket.updated_at}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="px-6 py-4 border-t border-[#c3c6d7]">
                    <button
                        onClick={onClose}
                        className="w-full py-2.5 bg-[#f1f3ff] hover:bg-[#e9edff] rounded-xl text-sm font-bold text-[#434655] transition-colors"
                    >
                        {t('common.close')}
                    </button>
                </div>
            </motion.div>
        </motion.div>
    );
};

/* ─── Statistics Card ────────────────────────────────────────── */
const StatCard = ({ label, value, color, delay = 0 }) => (
    <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay }}
        className="bg-white border border-[#c3c6d7] shadow-sm rounded-2xl p-5"
    >
        <p className="text-xs font-bold text-[#737686] mb-1">{label}</p>
        <p className="text-2xl font-black" style={{ color }}>{value}</p>
    </motion.div>
);

const SupportPage = () => {
    const { t } = useTranslation();
    const { data: tickets = [], isLoading: loading } = useSupportTickets();
    const [showNewModal, setShowNewModal] = useState(false);
    const [selectedTicket, setSelectedTicket] = useState(null);
    const [activeFilter, setActiveFilter] = useState('all');
    const { user } = useAuthStore();
    const queryClient = useQueryClient();

    useEffect(() => {
        if (!user) return;

        // Admins can see all tickets, but users only see their own.
        // We will listen to user specific channel and admin channel.
        const userChannel = echo.private(`user.tickets.${user.user_id}`);
        userChannel.listen('TicketUpdated', (e) => {
            queryClient.invalidateQueries(['supportTickets']);
        });

        let adminChannel = null;
        if (user.role_id === 1 || user.role_id === 2 || user.role_id === 3) {
            adminChannel = echo.private('admin.tickets');
            adminChannel.listen('TicketUpdated', (e) => {
                queryClient.invalidateQueries(['supportTickets']);
            });
        }

        return () => {
            echo.leave(`user.tickets.${user.user_id}`);
            if (adminChannel) {
                echo.leave('admin.tickets');
            }
        };
    }, [user, queryClient]);

    const handleNewSuccess = () => {
        setShowNewModal(false);
    };

    /* Filter Tabs */
    const getFilters = (t) => [
        { key: 'all',        label: t('common.all') },
        { key: 'open',       label: t('support.status_open') },
        { key: 'in_progress', label: t('support.status_in_progress') },
        { key: 'resolved',   label: t('support.status_resolved') },
        { key: 'closed',     label: t('support.status_closed') },
    ];

    const filtered = activeFilter === 'all'
        ? tickets
        : tickets.filter(t => t.status === activeFilter);

    /* Stats */
    const stats = {
        total:      tickets.length,
        open:       tickets.filter(t => t.status === 'open').length,
        inProgress: tickets.filter(t => t.status === 'in_progress').length,
        resolved:   tickets.filter(t => t.status === 'resolved').length,
    };

    return (
        <div className="space-y-6" dir="rtl">
            {/* ── Page Header ── */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black text-[#141b2b] tracking-tight flex items-center gap-3">
                        <HeadphonesIcon className="w-7 h-7 text-[#004ac6]" />
                        {t('support.support_and_maintenance')}
                    </h1>
                    <p className="text-sm text-[#737686] font-bold mt-1">
                        {t('support.track_support_tickets')}
                    </p>
                </div>
                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => setShowNewModal(true)}
                    className="flex items-center gap-2 px-5 py-2.5 bg-[#004ac6] hover:bg-[#2563eb] rounded-xl text-sm font-black text-white transition-colors shadow-lg shadow-[#004ac6]/20"
                >
                    <Plus className="w-4 h-4" />
                    {t('support.new_ticket_btn')}
                </motion.button>
            </div>

            {/* ── Stats ── */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <StatCard label={t('support.total_tickets')}  value={stats.total}      color="#ffffff"  delay={0}    />
                <StatCard label={t('support.status_open')}           value={stats.open}       color="#3b82f6"  delay={0.05} />
                <StatCard label={t('support.status_in_progress')}    value={stats.inProgress}  color="#f59e0b"  delay={0.1}  />
                <StatCard label={t('support.resolved')}          value={stats.resolved}    color="#10b981"  delay={0.15} />
            </div>

            {/* ── Filter Tabs ── */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
                {getFilters(t).map(f => (
                    <button
                        key={f.key}
                        onClick={() => setActiveFilter(f.key)}
                        className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                            activeFilter === f.key
                                ? 'bg-[#004ac6] text-white shadow-lg shadow-[#004ac6]/20'
                                : 'bg-[#f1f3ff] text-[#737686] hover:bg-[#e9edff] hover:text-gray-300'
                        }`}
                    >
                        {f.label}
                        {f.key !== 'all' && tickets.filter(t => t.status === f.key).length > 0 && (
                            <span className="mr-1.5 text-[10px] opacity-70">
                                ({tickets.filter(t => t.status === f.key).length})
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {/* ── Tickets List ── */}
            {loading ? (
                <div className="space-y-3">
                    {[1, 2, 3].map(i => <SkeletonCard key={i} />)}
                </div>
            ) : filtered.length === 0 ? (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col items-center justify-center py-20 text-center"
                >
                    <div className="w-16 h-16 rounded-3xl bg-[#f1f3ff] flex items-center justify-center mb-4">
                        <HeadphonesIcon className="w-8 h-8 text-[#434655]" />
                    </div>
                    <p className="text-base font-black text-[#737686]">{t('support.no_tickets')}</p>
                    <p className="text-xs text-[#434655] mt-1">
                        {activeFilter === 'all'
                            ? t('support.no_tickets_opened_yet')
                            : `${t('support.no_tickets_in_status')} "${getFilters(t).find(f => f.key === activeFilter)?.label}".`}
                    </p>
                    {activeFilter === 'all' && (
                        <button
                            onClick={() => setShowNewModal(true)}
                            className="mt-4 flex items-center gap-2 px-4 py-2 bg-[#004ac6]/20 hover:bg-[#004ac6]/30 border border-indigo-500/30 rounded-xl text-sm font-bold text-[#004ac6] transition-colors"
                        >
                            <Plus className="w-4 h-4" />
                            {t('support.open_first_ticket')}
                        </button>
                    )}
                </motion.div>
            ) : (
                <div className="space-y-3">
                    <AnimatePresence>
                        {filtered.map(ticket => (
                            <TicketCard
                                key={ticket.id}
                                ticket={ticket}
                                onClick={setSelectedTicket}
                            />
                        ))}
                    </AnimatePresence>
                </div>
            )}

            {/* ── Modals ── */}
            <AnimatePresence>
                {showNewModal && (
                    <NewTicketModal
                        onClose={() => setShowNewModal(false)}
                        onSuccess={handleNewSuccess}
                    />
                )}
                {selectedTicket && (
                    <TicketDetailDrawer
                        ticket={selectedTicket}
                        onClose={() => setSelectedTicket(null)}
                    />
                )}
            </AnimatePresence>
        </div>
    );
};

export default SupportPage;


