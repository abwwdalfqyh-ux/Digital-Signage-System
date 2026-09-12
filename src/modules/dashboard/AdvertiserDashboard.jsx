import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Megaphone,
    Clock,
    DollarSign,
    PlusCircle,
    Search,
    Calendar,
    Tv,
    Sparkles,
    User,
    RotateCcw,
    AlertCircle,
    RefreshCw
} from 'lucide-react';
import axiosClient from '../../core/api/axiosClient';
import { ENDPOINTS } from '../../core/api/endpoints';
import useAuthStore from '../../store/useAuthStore';
import useToastStore from '../../store/useToastStore';
import { useAdvertiserDashboard } from '../../hooks/api/useDashboard';
import useTranslation from '../../i18n/useTranslation';

// Animation variants
const containerVariants = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: { staggerChildren: 0.1 }
    }
};

const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 260, damping: 20 } }
};

const DashboardSkeleton = () => (
    <div className="space-y-6 w-full pb-12 max-w-[1600px] mx-auto" dir="rtl">
        <div className="h-40 md:h-[180px] bg-white border border-gray-100 rounded-[2.5rem] animate-pulse shadow-sm"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6">
            {[...Array(3)].map((_, i) => (
                <div key={i} className="h-[160px] bg-white border border-gray-100 rounded-3xl animate-pulse p-6 flex flex-col justify-between shadow-sm">
                    <div className="flex justify-between items-start">
                        <div className="space-y-3 w-full">
                            <div className="w-24 h-3 bg-gray-100 rounded-full"></div>
                            <div className="w-16 h-8 bg-gray-100 rounded-full"></div>
                        </div>
                        <div className="w-12 h-12 bg-gray-100 rounded-2xl shrink-0"></div>
                    </div>
                    <div className="h-8 bg-gray-50 rounded-xl w-full"></div>
                </div>
            ))}
        </div>
        <div className="h-80 bg-white border border-gray-100 rounded-3xl animate-pulse mt-6 shadow-sm"></div>
    </div>
);

const DashboardError = ({ onRetry, t }) => (
    <div className="flex flex-col items-center justify-center py-32 text-center space-y-5" dir="rtl">
        <div className="w-20 h-20 bg-red-50 rounded-3xl flex items-center justify-center shadow-inner">
            <AlertCircle className="w-10 h-10 text-red-500" />
        </div>
        <div>
            <h3 className="text-xl font-black text-gray-900 mb-2">{t('common.error')}</h3>
            <p className="text-sm font-medium text-gray-500 max-w-[320px] mx-auto leading-relaxed">
                {t('dashboard.system_under_dev')}
            </p>
        </div>
        <button
            onClick={onRetry}
            className="flex items-center gap-2 px-6 py-3 mt-2 bg-gray-900 text-white text-sm font-bold rounded-xl hover:bg-gray-800 transition-colors shadow-lg shadow-gray-900/20"
        >
            <RefreshCw className="w-4 h-4" />
            {t('common.retry')}
        </button>
    </div>
);

const AdvertiserDashboard = () => {
    const { user } = useAuthStore();
    const navigate = useNavigate();
    
    const { data: dashboardData, isLoading: loading, error: fetchError, refetch: fetchDashboard } = useAdvertiserDashboard();
    const data = dashboardData;
    const error = fetchError ? true : false;
    
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const addToast = useToastStore(state => state.addToast);
    const { t, dir } = useTranslation();

    const [isRefreshing, setIsRefreshing] = useState(false);

    const handleRefresh = async () => {
        setIsRefreshing(true);
        await fetchDashboard();
        setTimeout(() => setIsRefreshing(false), 600);
    };

    useEffect(() => {
        // التحديث التلقائي الصامت في الخلفية كل دقيقة
        const intervalId = setInterval(() => {
            fetchDashboard();
        }, 60000);

        return () => clearInterval(intervalId);
    }, []);

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return t('common.good_morning');
        if (hour < 18) return t('common.good_afternoon');
        return t('common.good_evening');
    };

    if (loading) return <DashboardSkeleton />;
    if (error && !data) return <DashboardError onRetry={fetchDashboard} t={t} />;

    // Filter recent ads by Status AND Search
    const filteredAds = data?.recent_ads?.filter(ad => {
        const matchesSearch = ad.title?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === 'all' ||
            (statusFilter === 'Active' && ad.status === 'Active') ||
            (statusFilter === 'Pending' && (ad.status === 'Pending' || ad.status === 'waiting_payment'));
        return matchesSearch && matchesStatus;
    }) || [];

    return (
        <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="space-y-6 pb-12 font-sans w-full max-w-[1600px] mx-auto min-h-screen"
            dir={dir}
        >
            {/* 1. Header (Matched to Admin Dashboard) */}
            <motion.div
                variants={itemVariants}
                className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 mb-4"
            >
                <div>
                    <h1 className="text-[32px] font-extrabold text-[#141b2b] m-0 leading-tight font-sans">
                        {t('dashboard.overview')}
                    </h1>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={handleRefresh}
                        disabled={isRefreshing}
                        title={t('common.refresh')}
                        className="w-11 h-11 flex items-center justify-center rounded-xl bg-white text-gray-600 border border-gray-200 hover:bg-gray-50 hover:text-gray-900 transition-colors shadow-sm cursor-pointer"
                    >
                        <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin text-[#2563EB]' : ''}`} />
                    </button>
                    <button
                        onClick={() => navigate('/dashboard/ads/create')}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#2563EB] text-white text-[16px] font-extrabold cursor-pointer font-sans shadow-[0_2px_8px_rgba(37,99,235,0.30)] hover:bg-[#1D4ED8] transition-colors border-none"
                    >
                        <PlusCircle className="w-5 h-5" />
                        {t('ads.create')}
                    </button>
                </div>
            </motion.div>

            {/* 2. KPI Stats Cards */}
            <motion.div
                variants={itemVariants}
                className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6 mb-6"
            >
                {/* Active Cards */}
                <div
                    onClick={() => setStatusFilter(statusFilter === 'Active' ? 'all' : 'Active')}
                    className={`bg-white rounded-3xl py-6 px-5 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)] cursor-pointer flex flex-col items-center justify-center text-center transition-all duration-300 ${statusFilter === 'Active'
                            ? 'border-2 border-emerald-500 shadow-[0_8px_30px_-4px_rgba(16,185,129,0.2)] -translate-y-1'
                            : 'border border-gray-200 hover:border-emerald-500/30 hover:shadow-[0_8px_30px_-4px_rgba(0,0,0,0.08)] hover:-translate-y-1'
                        }`}
                >
                    <p className="text-xl md:text-2xl font-black text-[#141b2b] mb-1.5">{t('dashboard.active_ads_now')}</p>
                    <p className="text-lg md:text-xl font-bold text-emerald-600">{data?.active_ads_count || '0'}</p>
                </div>

                {/* Pending Card */}
                <div
                    onClick={() => setStatusFilter(statusFilter === 'Pending' ? 'all' : 'Pending')}
                    className={`bg-white rounded-3xl py-6 px-5 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)] cursor-pointer flex flex-col items-center justify-center text-center transition-all duration-300 ${statusFilter === 'Pending'
                            ? 'border-2 border-[var(--color-gold)] shadow-[0_8px_30px_-4px_rgba(196,160,82,0.2)] -translate-y-1'
                            : 'border border-gray-200 hover:border-[var(--color-gold)]/30 hover:shadow-[0_8px_30px_-4px_rgba(0,0,0,0.08)] hover:-translate-y-1'
                        }`}
                >
                    <p className="text-xl md:text-2xl font-black text-[#141b2b] mb-1.5">{t('dashboard.under_review')}</p>
                    <p className="text-lg md:text-xl font-bold text-amber-600">{data?.pending_ads_count || '0'}</p>
                </div>

                {/* Expenses Card */}
                <div className="bg-white rounded-3xl py-6 px-5 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)] border border-gray-200 flex flex-col items-center justify-center text-center hover:shadow-[0_8px_30px_-4px_rgba(0,0,0,0.08)] transition-all duration-300">
                    <p className="text-xl md:text-2xl font-black text-[#141b2b] mb-1.5">{t('dashboard.total_expenses')}</p>
                    <p className="text-lg md:text-xl font-bold text-[#141b2b]">${data?.total_spent || '0'}</p>
                </div>
            </motion.div>

            {/* 3. Filterable Campaigns / Ads registry */}
            <motion.div
                variants={itemVariants}
                className="bg-white rounded-3xl border border-gray-200 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)] overflow-hidden flex flex-col"
            >
                {/* Search / Filter Header */}
                <div className="p-6 md:p-8 border-b border-gray-200 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                    <div>
                        <h3 className="text-2xl font-black text-[#141b2b] tracking-tight mb-1">
                            {t('dashboard.recent_ads_registry')}
                        </h3>
                        {statusFilter !== 'all' && (
                            <p className="text-sm text-gray-500 font-bold">
                                <span className="text-[var(--color-dark-turquoise)] flex items-center gap-1.5">
                                    {statusFilter === 'Active' ? t('dashboard.filter_active_only') : t('dashboard.filter_pending_only')}
                                    <button onClick={() => setStatusFilter('all')} className="underline hover:text-[#005e6b] flex items-center gap-1 ml-2 text-gray-400 hover:text-gray-600 transition-colors">
                                        <RotateCcw className="w-3.5 h-3.5" /> {t('common.reset')}
                                    </button>
                                </span>
                            </p>
                        )}
                    </div>

                    {/* Search Field */}
                    <div className="relative w-full lg:w-auto lg:min-w-[360px]">
                        <input
                            type="text"
                            placeholder={t('dashboard.search_ads')}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-gray-50 border border-gray-300 rounded-2xl py-3.5 px-12 text-base font-bold text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[var(--color-dark-turquoise)] focus:bg-white focus:ring-4 focus:ring-[var(--color-dark-turquoise)]/10 transition-all text-right"
                        />
                        <Search className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                </div>

                {/* Table Content */}
                <div className="overflow-x-auto custom-scrollbar">
                    <table className="w-full text-right border-collapse min-w-[800px]">
                        <thead className="bg-gray-50/90 sticky top-0 z-10 backdrop-blur-sm border-b border-gray-200">
                            <tr className="border-b border-gray-200">
                                <th className="py-5 px-6 md:px-8 text-[17px] md:text-[19px] font-extrabold text-[#141b2b] uppercase tracking-wider">{t('ads.ad_title')}</th>
                                <th className="py-5 px-6 md:px-8 text-[17px] md:text-[19px] font-extrabold text-[#141b2b] uppercase tracking-wider">{t('ads.campaign_date')}</th>
                                <th className="py-5 px-6 md:px-8 text-[17px] md:text-[19px] font-extrabold text-[#141b2b] uppercase tracking-wider text-right">{t('ads.total_cost')}</th>
                                <th className="py-5 px-6 md:px-8 text-[17px] md:text-[19px] font-extrabold text-[#141b2b] uppercase tracking-wider text-center">{t('ads.publish_status')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 bg-white">
                            <AnimatePresence>
                                {filteredAds.map((ad, idx) => {
                                    const status = ad.status;
                                    let statusClass = 'bg-gray-100 text-gray-600 border-gray-200';
                                    let statusText = t('screens.unknown');

                                    if (status === 'Active') {
                                        statusClass = 'bg-emerald-50 text-emerald-700 border border-emerald-200';
                                        statusText = t('ads.status_active');
                                    } else if (status === 'Pending') {
                                        statusClass = 'bg-amber-50 text-amber-700 border border-amber-200';
                                        statusText = t('ads.status_pending');
                                    } else if (status === 'waiting_payment') {
                                        statusClass = 'bg-[#FEF3C7] text-[#D97706] border border-[#FDE68A]';
                                        statusText = t('ads.status_waiting_payment');
                                    } else if (status === 'Rejected') {
                                        statusClass = 'bg-rose-50 text-rose-700 border border-rose-200';
                                        statusText = t('ads.status_rejected');
                                    }

                                    return (
                                        <motion.tr
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0 }}
                                            transition={{ duration: 0.2 }}
                                            key={`${ad.id}-${idx}`}
                                            className="hover:bg-gray-50/80 transition-colors group cursor-default"
                                        >
                                            <td className="py-5 px-6 md:px-8">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-11 h-11 rounded-xl bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-600 shrink-0 group-hover:bg-white transition-colors">
                                                        <Tv className="w-6 h-6" />
                                                    </div>
                                                    <div>
                                                        <p className="text-[17px] font-black text-[#141b2b] leading-snug mb-1 truncate max-w-[280px]" title={ad.title}>
                                                            {ad.title || t('ads.no_title')}
                                                        </p>
                                                        <p className="text-xs md:text-sm font-bold text-gray-500 bg-gray-100 px-2.5 py-0.5 rounded-md inline-block">{t('ads.duration')}: {ad.duration || '0'} {t('ads.seconds')}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-5 px-6 md:px-8 text-sm font-bold text-gray-600">
                                                <div className="flex flex-col gap-1 text-[15px]">
                                                    <span className="text-gray-900 font-bold">{t('ads.from')}: <span className="font-sans">{ad.start_date || '--'}</span></span>
                                                    <span className="text-gray-500">{t('ads.to')}: <span className="font-sans">{ad.end_date || '--'}</span></span>
                                                </div>
                                            </td>
                                            <td className="py-5 px-6 md:px-8 text-base md:text-lg font-black text-[#141b2b]">
                                                ${ad.total_cost || '0'}
                                            </td>
                                            <td className="py-5 px-6 md:px-8 text-center">
                                                <span className={`inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-full text-xs md:text-sm font-extrabold w-36 ${statusClass}`}>
                                                    {status === 'Active' && <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse shrink-0"></span>}
                                                    {statusText}
                                                </span>
                                            </td>
                                        </motion.tr>
                                    );
                                })}
                            </AnimatePresence>

                            {!filteredAds?.length && (
                                <tr>
                                    <td colSpan="4" className="py-24 text-center">
                                        <motion.div
                                            initial={{ opacity: 0, scale: 0.95 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            className="flex flex-col items-center justify-center w-full max-w-sm mx-auto min-w-[300px]"
                                        >
                                            <div className="w-24 h-24 mb-6 relative">
                                                <div className="absolute inset-0 bg-[var(--color-dark-turquoise)]/10 rounded-full animate-ping"></div>
                                                <div className="absolute inset-0 bg-white border border-gray-200 rounded-full flex items-center justify-center shadow-lg">
                                                    <Megaphone className="w-10 h-10 text-gray-400" />
                                                </div>
                                            </div>
                                            <h4 className="text-xl font-black text-[#141b2b] mb-2 whitespace-nowrap">
                                                {searchQuery || statusFilter !== 'all' ? t('dashboard.no_matches') : t('dashboard.no_ads_yet')}
                                            </h4>
                                            <p className="text-base font-bold text-gray-500 mb-8 leading-relaxed">
                                                {searchQuery || statusFilter !== 'all'
                                                    ? t('dashboard.try_changing_filters')
                                                    : t('dashboard.start_first_campaign')}
                                            </p>
                                            {!searchQuery && statusFilter === 'all' && (
                                                <button
                                                    onClick={() => navigate('/dashboard/ads/create')}
                                                    className="px-8 py-4 bg-[var(--color-dark-turquoise)] text-white text-base font-black rounded-xl hover:opacity-90 shadow-[0_8px_16px_rgba(20,93,106,0.2)] transition-opacity flex items-center gap-2"
                                                >
                                                    <PlusCircle className="w-6 h-6" />
                                                    {t('ads.start_new_campaign')}
                                                </button>
                                            )}
                                        </motion.div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </motion.div>
        </motion.div>
    );
};

export default AdvertiserDashboard;
