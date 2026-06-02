import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
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
    RotateCcw
} from 'lucide-react';
import axiosClient from '../../core/api/axiosClient';
import { ENDPOINTS } from '../../core/api/endpoints';
import useAuthStore from '../../store/useAuthStore';

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

const AdvertiserDashboard = () => {
    const { user } = useAuthStore();
    const navigate = useNavigate();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    useEffect(() => {
        const fetchDashboard = async () => {
            try {
                const res = await axiosClient.get(ENDPOINTS.ADVERTISER.DASHBOARD);
                setData(res.data.data || res.data);
            } catch (error) {
                console.error('Error fetching dashboard', error);
                setData({});
            } finally {
                setLoading(false);
            }
        };
        fetchDashboard();
    }, []);

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'صباح الخير والبركة ☀️';
        if (hour < 18) return 'مساء الخير والسرور 🌤️';
        return 'مساء الخير الهادئ 🌙';
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center py-32 relative">
                <div className="w-16 h-16 border-4 border-[var(--color-dark-turquoise)]/20 border-t-[var(--color-dark-turquoise)] rounded-full animate-spin"></div>
                <div className="absolute w-6 h-6 bg-[var(--color-gold)] rounded-full animate-ping"></div>
            </div>
        );
    }

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
            className="space-y-6 pb-12 text-right relative" 
            dir="rtl"
        >
            {/* Ambient light spots */}
            <div className="absolute top-10 left-1/4 w-96 h-96 bg-[var(--color-dark-turquoise)]/5 rounded-full blur-[100px] pointer-events-none -z-10 animate-pulse"></div>
            <div className="absolute bottom-20 right-1/4 w-96 h-96 bg-[var(--color-gold)]/5 rounded-full blur-[100px] pointer-events-none -z-10"></div>

            {/* 1. Welcoming Hero Banner */}
            <motion.div 
                variants={itemVariants}
                className="relative overflow-hidden rounded-3xl bg-gradient-to-tr from-[var(--color-dark-turquoise)] via-[#026c80] to-[#004b57] text-white p-6 md:p-8 shadow-xl border border-white/10"
            >
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-white/10 via-transparent to-transparent"></div>
                <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-[var(--color-gold)]/10 rounded-full blur-2xl"></div>

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-[var(--color-gold)] shadow-lg shrink-0">
                            <User className="w-8 h-8" />
                        </div>
                        <div>
                            <p className="text-xs text-white/70 font-bold mb-1 flex items-center gap-1.5">
                                <Sparkles className="w-4 h-4 text-[var(--color-gold)]" />
                                {getGreeting()}
                            </p>
                            <h1 className="text-2xl md:text-3xl font-black tracking-tight">
                                {user?.full_name || 'شريكنا المتميز'}
                            </h1>
                        </div>
                    </div>
                    
                    <button 
                        onClick={() => navigate('/dashboard/ads/create')}
                        className="bg-white hover:bg-[var(--color-gold)] hover:text-gray-900 text-[var(--color-dark-turquoise)] font-black text-sm px-6 py-4 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-md active:scale-95 group shrink-0"
                    >
                        <PlusCircle className="w-5 h-5 group-hover:rotate-90 transition-transform" />
                        إطلاق حملة إعلانية جديدة
                    </button>
                </div>
            </motion.div>

            {/* 2. KPI Stats Cards */}
            <motion.div 
                variants={itemVariants}
                className="grid grid-cols-1 md:grid-cols-3 gap-4"
            >
                {/* Active Cards */}
                <div 
                    onClick={() => setStatusFilter(statusFilter === 'Active' ? 'all' : 'Active')}
                    className={`bg-white rounded-2xl p-5 border-2 cursor-pointer shadow-sm flex items-center justify-between transition-all duration-300 hover:-translate-y-1 relative overflow-hidden group ${
                        statusFilter === 'Active' 
                            ? 'border-emerald-500 ring-4 ring-emerald-500/10' 
                            : 'border-transparent hover:border-emerald-500/20'
                    }`}
                >
                    <div className="space-y-1">
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">إعلانات نشطة الآن</p>
                        <h3 className="text-3xl font-black text-gray-800">{data?.active_ads_count || '0'}</h3>
                        <p className="text-[10px] text-emerald-600 font-extrabold flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                            {statusFilter === 'Active' ? 'اضغط لإلغاء الفلترة' : 'انقر لتصفية الجدول بالأسفل'}
                        </p>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Megaphone className="w-6 h-6" />
                    </div>
                </div>

                {/* Pending Card */}
                <div 
                    onClick={() => setStatusFilter(statusFilter === 'Pending' ? 'all' : 'Pending')}
                    className={`bg-white rounded-2xl p-5 border-2 cursor-pointer shadow-sm flex items-center justify-between transition-all duration-300 hover:-translate-y-1 relative overflow-hidden group ${
                        statusFilter === 'Pending' 
                            ? 'border-[var(--color-gold)] ring-4 ring-[var(--color-gold)]/10' 
                            : 'border-transparent hover:border-[var(--color-gold)]/20'
                    }`}
                >
                    <div className="space-y-1">
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">قيد المراجعة والتدقيق</p>
                        <h3 className="text-3xl font-black text-gray-800">{data?.pending_ads_count || '0'}</h3>
                        <p className="text-[10px] text-amber-600 font-extrabold">
                            {statusFilter === 'Pending' ? 'اضغط لإلغاء الفلترة' : 'انقر لتصفية الجدول بالأسفل'}
                        </p>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-amber-50 text-[var(--color-gold)] flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Clock className="w-6 h-6" />
                    </div>
                </div>

                {/* Expenses Card */}
                <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow relative overflow-hidden group">
                    <div className="absolute top-0 left-0 w-1.5 h-full bg-[var(--color-dark-turquoise)]"></div>
                    <div className="space-y-1">
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">إجمالي المصروفات</p>
                        <h3 className="text-3xl font-black text-gray-800">${data?.total_spent || '0'}</h3>
                        <p className="text-[10px] text-gray-400 font-bold">حساب الفواتير الإجمالية المعتمدة</p>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-cyan-50 text-[var(--color-dark-turquoise)] flex items-center justify-center group-hover:scale-110 transition-transform">
                        <DollarSign className="w-6 h-6" />
                    </div>
                </div>
            </motion.div>

            {/* 3. Filterable Campaigns / Ads registry */}
            <motion.div 
                variants={itemVariants}
                className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden"
            >
                {/* Search / Filter Header */}
                <div className="p-5 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div>
                            <h3 className="text-md font-black text-gray-800 flex items-center gap-2">
                                <Calendar className="w-5 h-5 text-[var(--color-dark-turquoise)]" />
                                سجل الإعلانات الحديثة
                            </h3>
                            <p className="text-[10px] text-gray-400 font-bold">
                                {statusFilter !== 'all' ? (
                                    <span className="text-[var(--color-dark-turquoise)] font-black flex items-center gap-1">
                                        تمت تصفية الجدول لعرض فئة ({statusFilter === 'Active' ? 'نشط' : 'قيد المراجعة'}) فقط.
                                        <button onClick={() => setStatusFilter('all')} className="underline hover:text-gray-800 flex items-center gap-0.5">
                                            <RotateCcw className="w-3 h-3" /> إعادة ضبط
                                        </button>
                                    </span>
                                ) : 'تصفح و ابحث في آخر 5 حملات إعلانية قمت بنشرها معنا'}
                            </p>
                        </div>
                    </div>

                    {/* Search Field */}
                    <div className="relative min-w-[240px]">
                        <input
                            type="text"
                            placeholder="ابحث باسم الإعلان..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2 px-10 text-xs font-bold text-gray-800 focus:outline-none focus:border-[var(--color-dark-turquoise)] focus:bg-white transition-all text-right"
                        />
                        <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    </div>
                </div>

                {/* Table Content */}
                <div className="overflow-x-auto">
                    <table className="w-full text-right border-collapse">
                        <thead>
                            <tr className="bg-gray-50/70 border-b border-gray-100">
                                <th className="py-3.5 px-5 text-xs font-black text-gray-500">عنوان الإعلان</th>
                                <th className="py-3.5 px-5 text-xs font-black text-gray-500">تاريخ الحملة</th>
                                <th className="py-3.5 px-5 text-xs font-black text-gray-500">التكلفة الإجمالية</th>
                                <th className="py-3.5 px-5 text-xs font-black text-gray-500 text-center">حالة النشر</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredAds.map((ad, idx) => {
                                const status = ad.status;
                                let statusClass = 'bg-gray-100 text-gray-600';
                                let statusText = 'غير معروف';

                                if (status === 'Active') {
                                    statusClass = 'bg-emerald-50 text-emerald-700 border border-emerald-100';
                                    statusText = 'نشط حالياً';
                                } else if (status === 'Pending' || status === 'waiting_payment') {
                                    statusClass = 'bg-amber-50 text-amber-700 border border-amber-100';
                                    statusText = 'قيد المراجعة';
                                } else if (status === 'Rejected') {
                                    statusClass = 'bg-rose-50 text-rose-700 border border-rose-100';
                                    statusText = 'مرفوض';
                                }

                                return (
                                    <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors last:border-0">
                                        <td className="py-4 px-5">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-lg bg-[var(--color-dark-turquoise)]/5 flex items-center justify-center text-[var(--color-dark-turquoise)]">
                                                    <Tv className="w-4 h-4" />
                                                </div>
                                                <div>
                                                    <p className="text-xs font-extrabold text-gray-800 leading-normal">{ad.title || 'بدون عنوان'}</p>
                                                    <p className="text-[9px] text-gray-400 font-bold">المدة: {ad.duration || '0'} ثانية</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-4 px-5 text-xs font-bold text-gray-500">
                                            من {ad.start_date || '--'} إلى {ad.end_date || '--'}
                                        </td>
                                        <td className="py-4 px-5 text-xs font-extrabold text-gray-800">
                                            ${ad.total_cost || '0'}
                                        </td>
                                        <td className="py-4 px-5 text-center">
                                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black ${statusClass}`}>
                                                {status === 'Active' && <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>}
                                                {statusText}
                                            </span>
                                        </td>
                                    </tr>
                                );
                            })}

                            {filteredAds.length === 0 && (
                                <tr>
                                    <td colSpan="4" className="py-12 text-center text-xs text-gray-400 font-black">
                                        لا توجد أي إعلانات تطابق المعايير أو الفلاتر المختارة حالياً.
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
