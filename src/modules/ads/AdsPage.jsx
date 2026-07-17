import React, { useState, useEffect } from 'react';
import { Megaphone, Plus, CheckCircle, XCircle, Trash2, Eye, PauseCircle, PlayCircle, CreditCard, Activity, Clock, Ban, DollarSign, Calendar, Info, Layers, User, Server, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axiosClient from '../../core/api/axiosClient';
import { ENDPOINTS } from '../../core/api/endpoints';
import StatusBadge from '../../shared/components/StatusBadge';
import Modal from '../../shared/components/Modal';
import ConfirmDialog from '../../shared/components/ConfirmDialog';
import usePermission from '../../hooks/usePermission';
import useToastStore from '../../store/useToastStore';
import StripePaymentModal from './components/StripePaymentModal';
import ReviewAdModal from './components/ReviewAdModal';
import AdInvoiceModal from './components/AdInvoiceModal';
import { useAds, useUpdateAdStatus, useDeleteAd } from '../../hooks/api/useAds';
import { useQueryClient } from '@tanstack/react-query';
import useTranslation from '../../i18n/useTranslation';

const AdsPage = () => {
    const [currentPage, setCurrentPage] = useState(1);
    const [statusFilter, setStatusFilter] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    
    // استخدام الهوك المحدث لجلب الإعلانات مع البحث والفلترة والـ Polling
    const { data: adsData, isLoading: adsLoading, refetch: refetchAds, isFetching } = useAds(currentPage, statusFilter, searchTerm);
    
    const { mutateAsync: updateAdStatus } = useUpdateAdStatus();
    const { mutateAsync: deleteAd } = useDeleteAd();
    
    const ads = adsData?.data || [];
    const pagination = adsData?.pagination || { current_page: 1, last_page: 1, total: 0 };
    const globalStats = adsData?.stats || { total: 0, active: 0, pending: 0, rejected: 0, paused: 0 };
    const loading = adsLoading;
    const [isRefreshing, setIsRefreshing] = useState(false);
    
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [approveModal, setApproveModal] = useState({ open: false, ad: null, action: '' });
    const [detailsModal, setDetailsModal] = useState({ open: false, ad: null });
    const [invoiceModal, setInvoiceModal] = useState({ open: false, ad: null });
    const [stripeModal, setStripeModal] = useState({ open: false, ad: null });
    const [reviewModal, setReviewModal] = useState({ open: false, ad: null });
    const [rejectReason, setRejectReason] = useState('');
    const { can, isAdvertiser, isAdmin } = usePermission();
    const navigate = useNavigate();
    const addToast = useToastStore(state => state.addToast);
    const queryClient = useQueryClient();
    const { t, dir } = useTranslation();

    const handleRefresh = async () => {
        setIsRefreshing(true);
        await refetchAds();
        setTimeout(() => setIsRefreshing(false), 600);
    };

    // الاعتماد على الفلترة من السيرفر مباشرة
    const filteredAds = ads;

    const getDurationInDays = (start, end) => {
        if (!start || !end) return '—';
        const startDate = new Date(start);
        const endDate = new Date(end);
        const diffTime = Math.abs(endDate - startDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
        return `${diffDays} ${t('common.days')}`;
    };

    const formatTime = (timeStr) => {
        if (!timeStr) return '';
        const parts = timeStr.split(':');
        if (parts.length >= 2) {
            const h = parseInt(parts[0]);
            const ampm = h >= 12 ? t('ads.pm') : t('ads.am');
            const h12 = h % 12 || 12;
            return `${h12}:${parts[1]} ${ampm}`;
        }
        return timeStr;
    };

    const handleStatusChange = async () => {
        const { ad, action } = approveModal;
        try {
            await updateAdStatus({
                id: ad.ad_id,
                payload: {
                    status: action,
                    reason: action === 'Rejected' ? rejectReason : null,
                }
            });
            setApproveModal({ open: false, ad: null, action: '' });
            setRejectReason('');
        } catch (e) {
            // Error is handled by hook
        }
    };

    const handleDelete = async () => {
        try {
            await deleteAd(deleteTarget);
            setDeleteTarget(null);
        } catch (e) {
            // Error is handled by hook
        }
    };

    const statusTabs = [
        { key: 'all', label: t('ads.tab_all_campaigns') },
        { key: 'Active', label: t('ads.tab_active') },
        { key: 'Pending', label: t('ads.tab_pending_approval') },
        { key: 'waiting_payment', label: t('ads.tab_waiting_payment') },
        { key: 'Paused', label: t('ads.tab_paused') },
        { key: 'Rejected', label: t('ads.tab_rejected') },
    ];

    const stats = globalStats;

    const renderStatusBadge = (status) => {
        switch (status) {
            case 'Active':
                return (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#D1FAE5] text-[#059669] border border-[#A7F3D0] text-xs">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#059669]"></span>
                        {t('ads.status_active')}
                    </span>
                );
            case 'Pending':
            case 'waiting_payment':
                return (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FEF3C7] text-[#D97706] border border-[#FDE68A] text-xs">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#D97706]"></span>
                        {status === 'Pending' ? t('ads.status_pending') : t('ads.status_waiting_payment')}
                    </span>
                );
            case 'Paused':
                return (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#dce2f7] text-[#434655] border border-[#c3c6d7] text-xs">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#737686]"></span>
                        {t('ads.status_paused')}
                    </span>
                );
            case 'Rejected':
                return (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#ffdad6] text-[#ba1a1a] border border-[#ba1a1a]/20 text-xs">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#ba1a1a]"></span>
                        {t('ads.status_rejected')}
                    </span>
                );
            default:
                return (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gray-100 text-gray-600 border border-gray-200 text-xs">
                        <span className="w-1.5 h-1.5 rounded-full bg-gray-400"></span>
                        {status}
                    </span>
                );
        }
    };

    return (
        <div className="flex-1 overflow-y-auto" dir={dir} style={{ fontFamily: "'IBM Plex Sans Arabic', sans-serif" }}>
            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4 mb-8">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <Megaphone className="text-[#004ac6] w-8 h-8 md:w-[36px] md:h-[36px]" />
                        <h1 className="text-2xl md:text-3xl font-semibold text-[#141b2b] flex items-center gap-3">
                            {t('ads.live_ad_center')}
                            <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-600 px-2.5 py-1 rounded-full text-xs font-medium border border-emerald-100">
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                </span>
                                {t('ads.live')}
                            </div>
                        </h1>
                    </div>
                    <p className="text-base text-[#434655]">{t('ads.live_ad_desc')}</p>
                </div>
                {can('create_campaigns') && (
                    <div className="flex items-center gap-[12px]">
                        <button
                            onClick={handleRefresh}
                            disabled={isRefreshing}
                            title={t('common.refresh')}
                            className="w-[48px] h-[48px] flex items-center justify-center rounded-lg bg-white text-[#434655] border border-[#E5E7EB] hover:bg-[#f3f4f6] hover:text-[#141b2b] transition-colors shadow-sm"
                        >
                            <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin text-[#2563eb]' : ''}`} />
                        </button>
                        <button onClick={() => navigate('/dashboard/ads/create')}
                            className="bg-[#004ac6] hover:bg-[#2563eb] text-white px-6 py-3 rounded-lg text-sm font-medium flex items-center justify-center gap-2 shadow-sm transition-all hover:shadow-md">
                            <Plus className="w-5 h-5" />
                            {t('ads.start_new_campaign')}
                        </button>
                    </div>
                )}
            </div>

            {/* Stats Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
                {/* Total Transactions */}
                <div className="bg-white rounded-[16px] p-6 border border-[#E5E7EB] flex flex-col justify-between items-center text-center shadow-sm">
                    <div className="w-12 h-12 rounded-full bg-[#f1f3ff] flex items-center justify-center mb-4">
                        <Layers className="text-[#004ac6] w-6 h-6" />
                    </div>
                    <p className="text-sm font-medium text-[#434655] mb-1">{t('ads.total_transactions')}</p>
                    <h3 className="text-5xl font-bold text-[#141b2b]">{stats.total}</h3>
                </div>

                {/* Active Campaigns */}
                <div className="bg-white rounded-[16px] p-6 border border-[#E5E7EB] flex flex-col justify-between items-center text-center shadow-sm">
                    <div className="w-12 h-12 rounded-full bg-[#E0F2FE] flex items-center justify-center mb-4">
                        <Activity className="text-[#0284C7] w-6 h-6" />
                    </div>
                    <p className="text-sm font-medium text-[#434655] mb-1">{t('ads.currently_broadcasting')}</p>
                    <h3 className="text-5xl font-bold text-[#141b2b]">{stats.active}</h3>
                </div>

                {/* Pending Approval */}
                <div className="bg-white rounded-[16px] p-6 border border-[#E5E7EB] flex flex-col justify-between items-center text-center shadow-sm">
                    <div className="w-12 h-12 rounded-full bg-[#FEF3C7] flex items-center justify-center mb-4">
                        <Clock className="text-[#D97706] w-6 h-6" />
                    </div>
                    <p className="text-sm font-medium text-[#434655] mb-1">{t('ads.pending_approval_short')}</p>
                    <h3 className="text-5xl font-bold text-[#141b2b]">{stats.pending}</h3>
                </div>

                {/* Rejected Ads */}
                <div className="bg-white rounded-[16px] p-6 border border-[#E5E7EB] flex flex-col justify-between items-center text-center shadow-sm">
                    <div className="w-12 h-12 rounded-full bg-[#ffdad6] flex items-center justify-center mb-4">
                        <Ban className="text-[#ba1a1a] w-6 h-6" />
                    </div>
                    <p className="text-sm font-medium text-[#434655] mb-1">{t('ads.rejected_ads')}</p>
                    <h3 className="text-5xl font-bold text-[#141b2b]">{stats.rejected}</h3>
                </div>

                {/* Stopped Campaigns */}
                <div className="bg-white rounded-[16px] p-6 border border-[#E5E7EB] flex flex-col justify-between items-center text-center shadow-sm">
                    <div className="w-12 h-12 rounded-full bg-[#dce2f7] flex items-center justify-center mb-4">
                        <PauseCircle className="text-[#434655] w-6 h-6" />
                    </div>
                    <p className="text-sm font-medium text-[#434655] mb-1">{t('ads.paused_campaigns')}</p>
                    <h3 className="text-5xl font-bold text-[#141b2b]">{stats.paused}</h3>
                </div>
            </div>

            {/* Filters Bar */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
                <div className="flex overflow-x-auto gap-2 bg-white p-1 rounded-lg border border-[#E5E7EB] w-full lg:w-auto">
                    {statusTabs.map(tab => (
                        <button key={tab.key} onClick={() => { setStatusFilter(tab.key); setCurrentPage(1); }}
                            className={`px-4 py-2 rounded text-sm font-medium whitespace-nowrap transition-colors ${statusFilter === tab.key ? 'bg-[#111827] text-white' : 'text-[#434655] hover:bg-[#f1f3ff]'}`}>
                            {tab.label}
                        </button>
                    ))}
                </div>

                <div className="relative w-full lg:w-80">
                    <input 
                        type="text" 
                        placeholder={t('dashboard.search_ads')} 
                        value={searchTerm}
                        onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                        className="w-full pr-10 pl-4 py-2 bg-white border border-[#E5E7EB] rounded-lg text-sm focus:outline-none focus:border-[#004ac6] focus:ring-1 focus:ring-[#004ac6] transition-colors"
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>
                </div>
            </div>

            {/* Data Table */}
            <div className="bg-surface-container-lowest rounded-2xl border border-border-color overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-right font-sans">
                        <thead>
                            <tr className="bg-surface-container-low border-b border-border-color">
                                <th className="py-3 px-3 font-label-md text-label-md text-on-surface font-bold whitespace-nowrap">{t('ads.ad_title')}</th>
                                <th className="py-3 px-3 font-label-md text-label-md text-on-surface font-bold whitespace-nowrap">{t('ads.advertiser')}</th>
                                <th className="py-3 px-3 font-label-md text-label-md text-on-surface font-bold whitespace-nowrap text-center">{t('ads.publish_status')}</th>
                                <th className="py-3 px-3 font-label-md text-label-md text-on-surface font-bold whitespace-nowrap">{t('ads.total_cost')}</th>
                                <th className="py-3 px-3 font-label-md text-label-md text-on-surface font-bold whitespace-nowrap text-center">{t('ads.target_screen')}</th>
                                <th className="py-3 px-3 font-label-md text-label-md text-on-surface font-bold whitespace-nowrap text-center">{t('ads.duration')}</th>
                                <th className="py-3 px-3 font-label-md text-label-md text-on-surface font-bold whitespace-nowrap text-center">{t('ads.size')}</th>
                                <th className="py-3 px-3 font-label-md text-label-md text-on-surface font-bold whitespace-nowrap">{t('ads.from')}</th>
                                <th className="py-3 px-3 font-label-md text-label-md text-on-surface font-bold whitespace-nowrap">{t('ads.to')}</th>
                                <th className="py-3 px-3 font-label-md text-label-md text-on-surface font-bold whitespace-nowrap text-center">{t('common.actions')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-outline-variant/30">
                            {!loading && filteredAds.length === 0 ? (
                                <tr>
                                    <td colSpan="10" className="py-16 text-center">
                                        <div className="flex flex-col items-center justify-center">
                                            <div className="w-20 h-20 bg-surface-container rounded-full flex items-center justify-center mb-5 border border-outline-variant">
                                                <Megaphone className="w-8 h-8 text-outline" />
                                            </div>
                                            <h4 className="font-title-lg text-title-lg text-on-background font-bold mb-2">{t('ads.no_ads')}</h4>
                                            <p className="font-body-md text-body-md text-on-surface-variant">{t('dashboard.try_changing_filters')}</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredAds.map(row => (
                                    <tr key={row.ad_id} className="hover:bg-surface-container-low transition-colors group">
                                        <td className="py-2 px-3">
                                            <span className="font-label-lg text-label-lg text-on-background font-bold whitespace-nowrap">{row.title}</span>
                                        </td>
                                        <td className="py-2 px-3">
                                            <span className="font-body-sm text-body-sm text-on-surface-variant whitespace-nowrap">{row.advertiser?.full_name || t('common.unspecified')}</span>
                                        </td>
                                        <td className="py-2 px-3 text-center">
                                            {renderStatusBadge(row.status)}
                                        </td>
                                        <td className="py-2 px-3 font-label-lg text-label-lg text-primary font-bold">${row.total_cost || 0}</td>
                                        <td className="py-2 px-3 text-center">
                                            <div className="flex flex-wrap gap-1 justify-center max-w-[150px] mx-auto">
                                                {row.screens && row.screens.length > 0 ? (
                                                    row.screens.map(s => (
                                                        <span key={s.screen_id} className="inline-flex px-2 py-1 bg-surface border border-outline-variant rounded-md text-on-surface-variant font-body-sm text-[11px] whitespace-nowrap shadow-sm" title={s.screen_name}>
                                                            {s.screen_name.length > 10 ? s.screen_name.substring(0, 10) + '...' : s.screen_name}
                                                        </span>
                                                    ))
                                                ) : (
                                                    <span className="text-on-surface-variant">—</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="py-2 px-3 text-center font-caption text-caption text-on-background">
                                            {getDurationInDays(row.start_date, row.end_date)}
                                        </td>
                                        <td className="py-2 px-3 text-center font-caption text-caption text-on-surface-variant whitespace-nowrap">
                                            {row.file_size ? `${row.file_size} MB` : '—'}
                                        </td>
                                        <td className="py-2 px-3 text-center" dir="ltr">
                                            <div className="flex flex-col items-center">
                                                <span className="font-caption text-caption text-on-surface-variant whitespace-nowrap">{row.start_date || '—'}</span>
                                                <span className="text-[10px] text-outline mt-0.5">{formatTime(row.schedules?.[0]?.start_time)}</span>
                                            </div>
                                        </td>
                                        <td className="py-2 px-3 text-center" dir="ltr">
                                            <div className="flex flex-col items-center">
                                                <span className="font-caption text-caption text-on-surface-variant whitespace-nowrap">{row.end_date || '—'}</span>
                                                <span className="text-[10px] text-outline mt-0.5">{formatTime(row.schedules?.[0]?.end_time)}</span>
                                            </div>
                                        </td>
                                        <td className="py-2 px-3">
                                            <div className="flex items-center justify-center gap-1.5 flex-nowrap w-max mx-auto">
                                                {/* عرض التفاصيل (Eye) */}
                                                <button onClick={(e) => { e.stopPropagation(); setDetailsModal({ open: true, ad: row }) }}
                                                    className="w-9 h-9 flex-shrink-0 rounded-xl border border-outline-variant flex items-center justify-center text-on-surface-variant hover:text-primary hover:bg-primary-container hover:border-primary transition-all bg-surface shadow-sm group/btn" title={t('ads.view_details')}>
                                                    <Eye className="w-[18px] h-[18px] transition-transform group-hover/btn:scale-110" />
                                                </button>

                                                {/* فاتورة (Invoice) */}
                                                <button onClick={(e) => { e.stopPropagation(); setInvoiceModal({ open: true, ad: row }) }}
                                                    className="w-9 h-9 flex-shrink-0 rounded-xl border border-outline-variant flex items-center justify-center text-on-surface-variant hover:text-blue-700 hover:bg-blue-100 hover:border-blue-500 transition-all bg-surface shadow-sm group/btn" title={t('ads.view_invoice')}>
                                                    <Layers className="w-[18px] h-[18px] transition-transform group-hover/btn:scale-110" />
                                                </button>

                                                {/* أوامر الرقابة (المراجعة المركزية بدلاً من القبول/الرفض المباشر) */}
                                                {can('approve_ads') && row.status === 'Pending' && (
                                                    <button onClick={(e) => { e.stopPropagation(); setReviewModal({ open: true, ad: row }) }}
                                                        className="w-9 h-9 flex-shrink-0 rounded-xl border border-primary/30 flex items-center justify-center text-primary hover:text-white hover:bg-primary transition-all bg-primary/10 shadow-sm group/btn" title={t('ads.review_and_approve')}>
                                                        <PlayCircle className="w-[18px] h-[18px] transition-transform group-hover/btn:scale-110" />
                                                    </button>
                                                )}

                                                {/* تفعيل مباشر للمدير إذا كان بانتظار الدفع (تخطي الدفع) */}
                                                {can('approve_ads') && row.status === 'waiting_payment' && (
                                                    <button onClick={(e) => { e.stopPropagation(); setApproveModal({ open: true, ad: row, action: 'Active' }) }}
                                                        className="w-9 h-9 flex-shrink-0 rounded-xl border border-outline-variant flex items-center justify-center text-on-surface-variant hover:text-emerald-700 hover:bg-emerald-100 hover:border-emerald-500 transition-all bg-surface shadow-sm group/btn" title={t('ads.activate_now_skip_payment')}>
                                                        <PlayCircle className="w-[18px] h-[18px] transition-transform group-hover/btn:scale-110" />
                                                    </button>
                                                )}

                                                {/* أوامر الإيقاف والاستئناف */}
                                                {(can('approve_ads') || can('manage_all')) && row.status === 'Active' && (
                                                    <button onClick={(e) => { e.stopPropagation(); setApproveModal({ open: true, ad: row, action: 'Paused' }) }}
                                                        className="w-9 h-9 flex-shrink-0 rounded-xl border border-outline-variant flex items-center justify-center text-on-surface-variant hover:text-amber-700 hover:bg-amber-100 hover:border-amber-500 transition-all bg-surface shadow-sm group/btn" title={t('ads.pause')}>
                                                        <PauseCircle className="w-[18px] h-[18px] transition-transform group-hover/btn:scale-110" />
                                                    </button>
                                                )}

                                                {(can('approve_ads') || can('manage_all')) && row.status === 'Paused' && (
                                                    <button onClick={(e) => { e.stopPropagation(); setApproveModal({ open: true, ad: row, action: 'Active' }) }}
                                                        className="w-9 h-9 flex-shrink-0 rounded-xl border border-outline-variant flex items-center justify-center text-on-surface-variant hover:text-primary hover:bg-primary-container hover:border-primary transition-all bg-surface shadow-sm group/btn" title={t('ads.resume')}>
                                                        <PlayCircle className="w-[18px] h-[18px] transition-transform group-hover/btn:scale-110" />
                                                    </button>
                                                )}

                                                {/* الدفع (Stripe) */}
                                                {(isAdvertiser || isAdmin) && row.status === 'waiting_payment' && (
                                                    <button onClick={(e) => { e.stopPropagation(); setStripeModal({ open: true, ad: row }) }}
                                                        className="w-9 h-9 flex-shrink-0 rounded-xl border border-border-color flex items-center justify-center text-[#8B5CF6] hover:bg-[#8B5CF6]/10 hover:border-[#8B5CF6] transition-all bg-surface shadow-sm group/btn" title={t('ads.pay_with_stripe')}>
                                                        <CreditCard className="w-[18px] h-[18px] transition-transform group-hover/btn:scale-110" />
                                                    </button>
                                                )}

                                                {/* الحذف النهائي */}
                                                <button onClick={(e) => { e.stopPropagation(); setDeleteTarget(row.ad_id) }}
                                                    className="w-9 h-9 flex-shrink-0 rounded-xl border border-outline-variant flex items-center justify-center text-on-surface-variant hover:text-error hover:bg-error-container hover:border-error transition-all bg-surface shadow-sm group/btn" title={t('common.delete')}>
                                                    <Trash2 className="w-[18px] h-[18px] transition-transform group-hover/btn:scale-110" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Controls */}
                {pagination && pagination.last_page > 1 && (
                    <div className="flex items-center justify-between px-6 py-4 border-t border-outline-variant bg-surface-container-lowest">
                        <span className="text-sm text-on-surface-variant font-body-md">
                            {t('common.page')} {pagination.current_page} {t('common.of')} {pagination.last_page} ({pagination.total} {t('ads.ads_count')})
                        </span>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={pagination.current_page === 1}
                                className="px-4 py-2 text-sm font-label-md text-primary bg-primary-container/20 rounded-lg hover:bg-primary-container/40 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                {t('common.previous')}
                            </button>
                            <button
                                onClick={() => setCurrentPage(p => Math.min(pagination.last_page, p + 1))}
                                disabled={pagination.current_page === pagination.last_page}
                                className="px-4 py-2 text-sm font-label-md text-primary bg-primary-container/20 rounded-lg hover:bg-primary-container/40 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                {t('common.next')}
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Approve/Reject Modal */}
            <Modal isOpen={approveModal.open} onClose={() => { setApproveModal({ open: false, ad: null, action: '' }); setRejectReason(''); }}
                title={approveModal.action === 'Active' ? t('ads.modal_approve_activate') : approveModal.action === 'waiting_payment' ? t('ads.modal_approve_request_payment') : approveModal.action === 'Paused' ? t('ads.modal_pause_ad') : t('ads.modal_reject_ad')}>
                <div className="space-y-6 font-sans" dir={dir}>
                    <div className={`p-5 rounded-2xl border flex gap-4 ${approveModal.action === 'Active' || approveModal.action === 'waiting_payment' ? 'bg-emerald-50 border-emerald-200' : approveModal.action === 'Paused' ? 'bg-amber-50 border-amber-200' : 'bg-error-container border-error/20'}`}>
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${approveModal.action === 'Active' || approveModal.action === 'waiting_payment' ? 'bg-emerald-100 text-emerald-600' : approveModal.action === 'Paused' ? 'bg-amber-100 text-amber-600' : 'bg-error text-white'}`}>
                            {approveModal.action === 'Active' || approveModal.action === 'waiting_payment' ? <CheckCircle className="w-5 h-5" /> : approveModal.action === 'Paused' ? <PauseCircle className="w-5 h-5" /> : <Ban className="w-5 h-5" />}
                        </div>
                        <div>
                            <span className={`block font-label-lg text-label-lg mb-1 ${approveModal.action === 'Active' || approveModal.action === 'waiting_payment' ? 'text-emerald-700' : approveModal.action === 'Paused' ? 'text-amber-700' : 'text-error'}`}>
                                {t('ads.final_action_conf')}
                            </span>
                            <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
                                {approveModal.action === 'waiting_payment'
                                    ? t('ads.waiting_payment_desc', { title: approveModal.ad?.title })
                                    : approveModal.action === 'Active'
                                        ? t('ads.active_desc', { title: approveModal.ad?.title })
                                        : approveModal.action === 'Paused'
                                            ? t('ads.pause_desc', { title: approveModal.ad?.title })
                                            : t('ads.reject_desc', { title: approveModal.ad?.title })}
                            </p>
                        </div>
                    </div>

                    {approveModal.action === 'Rejected' && (
                        <div className="space-y-2">
                            <label className="font-label-md text-label-md text-on-surface block px-1">{t('ads.reject_reason')} <span className="text-error">*</span></label>
                            <textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} placeholder={t('ads.reject_placeholder')}
                                className="w-full bg-surface border border-outline-variant rounded-xl py-3.5 px-4 font-body-md text-body-md text-on-background placeholder-outline focus:outline-none focus:ring-1 focus:ring-error focus:border-error transition-all min-h-[120px] resize-none" required />
                        </div>
                    )}

                    <button onClick={handleStatusChange}
                        className={`w-full font-label-lg text-label-lg py-4 rounded-xl transition-all shadow-sm ${approveModal.action === 'Active' || approveModal.action === 'waiting_payment' ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : approveModal.action === 'Paused' ? 'bg-amber-600 hover:bg-amber-700 text-white' : 'bg-error hover:bg-error/90 text-on-error'}`}>
                        {approveModal.action === 'waiting_payment' ? t('ads.approve_and_request_payment') : approveModal.action === 'Active' ? t('ads.approve_now') : approveModal.action === 'Paused' ? t('ads.confirm_pause') : t('ads.issue_rejection')}
                    </button>
                </div>
            </Modal>

            {/* View Details Modal */}
            <Modal isOpen={detailsModal.open} onClose={() => setDetailsModal({ open: false, ad: null })} title={t('ads.campaign_identity_card')}>
                {detailsModal.ad && (
                    <div className="space-y-6 font-sans bg-surface" dir={dir}>
                        <div className="flex items-start justify-between bg-surface-container-lowest border border-outline-variant p-5 rounded-2xl shadow-sm">
                            <div className="space-y-1.5 flex-1 pr-2">
                                <h2 className="font-title-lg text-title-lg text-on-background font-bold">{detailsModal.ad.title}</h2>
                                <div className="flex items-center gap-2 font-body-sm text-body-sm text-on-surface-variant">
                                    <User className="w-4 h-4" />
                                    <span>{detailsModal.ad.advertiser?.full_name || t('common.unspecified')}</span>
                                </div>
                            </div>
                            {renderStatusBadge(detailsModal.ad.status)}
                        </div>

                        {detailsModal.ad.rejection_reason && detailsModal.ad.status === 'Rejected' && (
                            <div className="bg-error-container p-4 rounded-2xl border border-error/20 flex gap-3 shadow-inner">
                                <Ban className="w-5 h-5 text-error shrink-0 mt-0.5" />
                                <div>
                                    <span className="block font-label-sm text-label-sm text-error uppercase tracking-wider mb-1">{t('ads.rejection_message')}</span>
                                    <p className="font-body-sm text-body-sm text-on-error-container leading-relaxed">{detailsModal.ad.rejection_reason}</p>
                                </div>
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-4 bg-surface-container-low p-5 rounded-2xl border border-outline-variant">
                            <div className="space-y-1.5">
                                <span className="font-caption text-caption text-on-surface-variant uppercase tracking-wider block">{t('ads.allocated_budget')}</span>
                                <span className="font-title-md text-title-md text-primary font-black flex items-center gap-1">
                                    <DollarSign className="w-5 h-5" />
                                    {detailsModal.ad.total_cost || 0}
                                </span>
                            </div>

                            <div className="space-y-1 mt-2">
                                <span className="font-caption text-caption text-on-surface-variant uppercase tracking-wider block">{t('ads.media_length')}</span>
                                <span className="font-body-md text-body-md text-on-background flex items-center gap-1.5 border border-outline-variant/50 bg-surface rounded p-1.5" dir="ltr">
                                    <Clock className="w-4 h-4 text-primary" />
                                    {detailsModal.ad.duration ? `${detailsModal.ad.duration}s` : '—'}
                                </span>
                            </div>

                            <div className="col-span-2 grid grid-cols-2 gap-4 pt-5 mt-3 border-t border-outline-variant">
                                <div className="space-y-2">
                                    <span className="font-label-sm text-label-sm text-on-surface-variant flex items-center gap-1.5">
                                        <div className="w-6 h-6 rounded-md bg-secondary/10 text-secondary flex items-center justify-center">
                                            <Calendar className="w-3.5 h-3.5" />
                                        </div>
                                        {t('ads.start_date')}
                                    </span>
                                    <span className="font-body-lg text-body-lg text-on-background font-bold block pl-8" dir="ltr">
                                        {detailsModal.ad.start_date || '—'} <span className="text-sm font-normal text-outline ml-1">{formatTime(detailsModal.ad.schedules?.[0]?.start_time)}</span>
                                    </span>
                                </div>
                                <div className="space-y-2 border-r border-outline-variant pr-4">
                                    <span className="font-label-sm text-label-sm text-on-surface-variant flex items-center gap-1.5">
                                        <div className="w-6 h-6 rounded-md bg-error/10 text-error flex items-center justify-center">
                                            <Calendar className="w-3.5 h-3.5" />
                                        </div>
                                        {t('ads.end_date')}
                                    </span>
                                    <span className="font-body-lg text-body-lg text-on-background font-bold block pl-8" dir="ltr">
                                        {detailsModal.ad.end_date || '—'} <span className="text-sm font-normal text-outline ml-1">{formatTime(detailsModal.ad.schedules?.[0]?.end_time)}</span>
                                    </span>
                                </div>
                            </div>
                        </div>

                        <button onClick={() => setDetailsModal({ open: false, ad: null })}
                            className="w-full mt-4 bg-surface border border-outline text-on-surface hover:bg-surface-container hover:text-primary font-label-lg text-label-lg py-3.5 rounded-xl shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-primary">
                            {t('common.close_card')}
                        </button>
                    </div>
                )}
            </Modal>

            <ConfirmDialog isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete}
                title={t('ads.delete_campaign')} message={t('ads.delete_campaign_msg')} confirmText={t('common.yes_confirm_deletion')} />

            {/* Pagination Controls */}
            {pagination.last_page > 1 && (
                <div className="mt-6 flex justify-center items-center gap-2" dir="ltr">
                    <button
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="px-3 py-1.5 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {t('common.previous')}
                    </button>
                    
                    <span className="text-sm text-gray-600 px-4">
                        {t('common.page')} {currentPage} {t('common.of')} {pagination.last_page}
                    </span>

                    <button
                        onClick={() => setCurrentPage(p => Math.min(pagination.last_page, p + 1))}
                        disabled={currentPage === pagination.last_page}
                        className="px-3 py-1.5 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {t('common.next')}
                    </button>
                </div>
            )}

            <StripePaymentModal
                isOpen={stripeModal.open}
                onClose={() => setStripeModal({ open: false, ad: null })}
                advertisement={stripeModal.ad}
                onSuccess={() => refetchAds()}
            />

            <ReviewAdModal 
                isOpen={reviewModal.open}
                onClose={() => setReviewModal({ open: false, ad: null })}
                ad={reviewModal.ad}
                onOpenDetails={() => {
                    setDetailsModal({ open: true, ad: reviewModal.ad });
                }}
                onApproveClick={() => {
                    setApproveModal({ open: true, ad: reviewModal.ad, action: 'waiting_payment' });
                    setReviewModal({ open: false, ad: null });
                }}
                onRejectSubmit={(reason) => {
                    setRejectReason(reason);
                    setApproveModal({ open: true, ad: reviewModal.ad, action: 'Rejected' });
                    setReviewModal({ open: false, ad: null });
                }}
            />

            <AdInvoiceModal
                open={invoiceModal.open}
                onClose={() => setInvoiceModal({ open: false, ad: null })}
                ad={invoiceModal.ad}
            />
        </div>
    );
};

export default AdsPage;
