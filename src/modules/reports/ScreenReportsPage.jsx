import React, { useState, useEffect, useRef } from 'react';
import { Calendar, FileText, Printer, Search, MonitorPlay, DollarSign, ListVideo, Activity } from 'lucide-react';
import axiosClient from '../../core/api/axiosClient';
import { ENDPOINTS } from '../../core/api/endpoints';
import useToastStore from '../../store/useToastStore';
import useAuthStore from '../../store/useAuthStore';

const ScreenReportsPage = () => {
    const { user } = useAuthStore();
    const [screens, setScreens] = useState([]);
    const [loadingScreens, setLoadingScreens] = useState(true);
    
    // Filters State
    const [filters, setFilters] = useState({
        owner_id: '',
        screen_id: '',
        start_date: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0], // First day of current month
        end_date: new Date().toISOString().split('T')[0], // Today
    });

    const [reportData, setReportData] = useState(null);
    const [loadingReport, setLoadingReport] = useState(false);
    
    const isAdmin = user?.role_id === 1 || user?.role_id === 4 || ['Admin', 'SuperAdmin'].includes(user?.role?.role_name);

    // Extract unique owners from screens
    const uniqueOwners = screens.reduce((acc, screen) => {
        if (screen.owner && !acc.find(o => o.user_id === screen.owner.user_id)) {
            acc.push(screen.owner);
        }
        return acc;
    }, []);

    // Filter screens based on selected owner
    const filteredScreens = filters.owner_id 
        ? screens.filter(s => s.owner_id === parseInt(filters.owner_id))
        : screens;
    
    const addToast = useToastStore(state => state.addToast);

    useEffect(() => {
        fetchScreens();
    }, []);

    const fetchScreens = async () => {
        try {
            const res = await axiosClient.get(ENDPOINTS.SCREENS.ALL);
            setScreens(res.data || []);
            if (res.data && res.data.length > 0) {
                setFilters(prev => ({ ...prev, screen_id: res.data[0].screen_id }));
            }
        } catch (error) {
            console.error("Error fetching screens", error);
            addToast('فشل في جلب قائمة الشاشات', 'error');
        } finally {
            setLoadingScreens(false);
        }
    };

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        
        if (name === 'owner_id') {
            // Reset screen_id when owner changes
            setFilters(prev => ({ ...prev, owner_id: value, screen_id: '' }));
        } else {
            setFilters(prev => ({ ...prev, [name]: value }));
        }
    };

    const generateReport = async () => {
        if (!filters.screen_id || !filters.start_date || !filters.end_date) {
            addToast('يرجى تعبئة جميع الفلاتر المطلوبة', 'warning');
            return;
        }

        setLoadingReport(true);
        try {
            const res = await axiosClient.get('/reports/screen', { params: filters });
            setReportData(res.data);
            addToast('تم استخراج التقرير بنجاح', 'success');
        } catch (error) {
            console.error("Error generating report", error);
            addToast('حدث خطأ أثناء استخراج التقرير', 'error');
            setReportData(null);
        } finally {
            setLoadingReport(false);
        }
    };

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="p-6 font-sans max-w-7xl mx-auto min-h-screen pb-20">
            {/* Header - Hidden on Print */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 print:hidden">
                <div>
                    <h1 className="text-3xl font-bold text-on-background flex items-center gap-3">
                        <FileText className="w-8 h-8 text-primary" />
                        تقرير أداء الشاشات
                    </h1>
                    <p className="text-on-surface-variant mt-2 text-sm">استخرج تقارير مفصلة حول الإيرادات ومرات العرض لكل شاشة</p>
                </div>
            </div>

            {/* Filters Section - Hidden on Print */}
            <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-6 shadow-sm mb-8 print:hidden">
                <div className={isAdmin ? 'grid grid-cols-1 md:grid-cols-5 gap-6 items-end' : 'grid grid-cols-1 md:grid-cols-4 gap-6 items-end'}>
                    
                    {isAdmin && (
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-on-surface block">تصفية حسب المالك</label>
                            <select 
                                name="owner_id" 
                                value={filters.owner_id} 
                                onChange={handleFilterChange}
                                className="w-full h-11 px-4 rounded-xl border border-outline-variant bg-surface text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                                disabled={loadingScreens}
                            >
                                <option value="">-- جميع الملاك --</option>
                                {uniqueOwners.map(owner => (
                                    <option key={owner.user_id} value={owner.user_id}>
                                        {owner.full_name || owner.username}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-on-surface block">اختر الشاشة</label>
                        <select 
                            name="screen_id" 
                            value={filters.screen_id} 
                            onChange={handleFilterChange}
                            className="w-full h-11 px-4 rounded-xl border border-outline-variant bg-surface text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                            disabled={loadingScreens}
                        >
                            <option value="">-- يرجى اختيار شاشة --</option>
                            {filteredScreens.map(screen => (
                                <option key={screen.screen_id} value={screen.screen_id}>
                                    {screen.screen_name} {screen.mac_address ? `(${screen.mac_address})` : ''}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-on-surface block">من تاريخ</label>
                        <div className="relative">
                            <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-on-surface-variant pointer-events-none" />
                            <input 
                                type="date" 
                                name="start_date" 
                                value={filters.start_date} 
                                onChange={handleFilterChange}
                                className="w-full h-11 pr-10 pl-4 rounded-xl border border-outline-variant bg-surface text-on-surface focus:border-primary outline-none transition-all"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-on-surface block">إلى تاريخ</label>
                        <div className="relative">
                            <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-on-surface-variant pointer-events-none" />
                            <input 
                                type="date" 
                                name="end_date" 
                                value={filters.end_date} 
                                onChange={handleFilterChange}
                                className="w-full h-11 pr-10 pl-4 rounded-xl border border-outline-variant bg-surface text-on-surface focus:border-primary outline-none transition-all"
                            />
                        </div>
                    </div>

                    <div className="flex gap-3 h-11">
                        <button 
                            onClick={generateReport}
                            disabled={loadingReport || !filters.screen_id}
                            className="flex-1 bg-primary hover:bg-primary/90 text-white font-medium rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                        >
                            {loadingReport ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            ) : (
                                <>
                                    <Search className="w-5 h-5" />
                                    استخراج
                                </>
                            )}
                        </button>
                        
                        <button 
                            onClick={handlePrint}
                            disabled={!reportData}
                            className="px-5 bg-surface border border-outline-variant text-on-surface hover:text-primary hover:bg-primary-container hover:border-primary font-medium rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                            title="طباعة التقرير (PDF)"
                        >
                            <Printer className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Print Styles */}
            <style>
                {`
                @media print {
                    @page { size: A4; margin: 0; } /* Edge to edge printing */
                    body * { visibility: hidden; }
                    .print-area, .print-area * { visibility: visible; }
                    .print-area {
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 100%;
                        background-color: white !important;
                    }
                    * {
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }
                }
                `}
            </style>

            {/* Report Content - This area gets printed */}
            {reportData && (
                <div className="print-area bg-white relative overflow-hidden font-sans shadow-sm border border-outline-variant rounded-2xl print:border-none print:rounded-none" dir="rtl" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
                    
                    {/* Top Header Polygon */}
                    <div className="w-full bg-[#1c5b8e] text-white flex justify-between items-stretch" style={{ height: '140px' }}>
                        <div className="flex-1 flex items-center justify-start px-12 bg-[#1c5b8e]">
                            <div className="text-center">
                                <img src="/Main_app_logo.png" alt="SabaPost Logo" className="h-16 object-contain mb-2 brightness-0 invert mx-auto" />
                                <p className="font-bold text-lg">سبأ بوست - SabaPost</p>
                                <p className="text-sm opacity-80">نظام إدارة الإعلانات الرقمية</p>
                            </div>
                        </div>
                        
                        {/* Center decorative element */}
                        <div className="w-48 bg-[#102a43]" style={{ clipPath: 'polygon(0 0, 100% 0, 75% 100%, 25% 100%)' }}></div>

                        <div className="flex-1 flex items-center justify-end px-12 bg-[#1c5b8e]">
                            <h1 className="text-5xl font-black tracking-tight" style={{ color: '#ffffff' }}>تقرير الشاشة</h1>
                        </div>
                    </div>

                    {/* Metadata Section */}
                    <div className="flex justify-between items-start px-16 py-10">
                        <div className="flex-1 text-right space-y-2">
                            <p className="text-xl font-bold text-gray-800">تقرير صادر إلى:</p>
                            <h2 className="text-3xl font-black text-gray-900">{user?.full_name || user?.username || 'مدير النظام'}</h2>
                            <p className="text-gray-600 font-medium">مُصدر تقارير معتمد</p>
                            <p className="text-gray-500 text-sm mt-4 tracking-widest font-mono" dir="ltr">{user?.phone || 'رقم الهاتف غير مدرج'}</p>
                        </div>
                        
                        <div className="flex-1 flex justify-end" dir="rtl">
                            <div className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-3 text-right">
                                <span className="font-bold text-gray-900">رقم الشاشة:</span>
                                <span className="text-gray-700">{reportData.screen.screen_id} - {reportData.screen.screen_name}</span>

                                <span className="font-bold text-gray-900">موقع الشاشة:</span>
                                <span className="text-gray-700">{reportData.screen.street ? `${reportData.screen.street.name} - ${reportData.screen.street.region?.name}` : 'غير محدد'}</span>

                                <span className="font-bold text-gray-900">تاريخ الإصدار:</span>
                                <span className="text-gray-700">{new Date().toLocaleDateString('ar-SA')}</span>

                                <span className="font-bold text-gray-900">الفترة:</span>
                                <span className="text-gray-700 text-right" dir="ltr">{filters.start_date} <span className="mx-1">/</span> {filters.end_date}</span>
                            </div>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="px-16 flex-1 mb-10">
                        <table className="w-full text-right text-sm border-collapse">
                            <thead className="bg-[#1c5b8e] text-white font-bold text-lg">
                                <tr>
                                    <th className="py-4 px-4 text-center w-16">رقم</th>
                                    <th className="py-4 px-4">اسم الحملة</th>
                                    <th className="py-4 px-4">المعلن والفئة</th>
                                    <th className="py-4 px-4 text-center">التكرار</th>
                                    <th className="py-4 px-4 text-center">الإيراد</th>
                                    <th className="py-4 px-4 text-center">مرات العرض</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 border-b-2 border-[#1c5b8e]">
                                {reportData.ads.map((ad, idx) => (
                                    <tr key={idx} className={idx % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                                        <td className="py-4 px-4 text-center font-bold text-gray-700">{String(idx + 1).padStart(2, '0')}</td>
                                        <td className="py-4 px-4 font-bold text-gray-900">{ad.title}</td>
                                        <td className="py-4 px-4 text-gray-600">{ad.advertiser} - {ad.category}</td>
                                        <td className="py-4 px-4 text-center text-gray-700">كل {ad.frequency} د</td>
                                        <td className="py-4 px-4 text-center font-bold text-gray-900">${parseFloat(ad.revenue).toFixed(2)}</td>
                                        <td className="py-4 px-4 text-center font-bold text-gray-900">{ad.plays_count}</td>
                                    </tr>
                                ))}
                                {(!reportData.ads || reportData.ads.length === 0) && (
                                    <tr>
                                        <td colSpan="6" className="py-8 text-center text-gray-500 font-medium">لا توجد حملات إعلانية مطابقة في هذه الفترة</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>

                        {/* Totals Section */}
                        <div className="flex justify-end mt-6">
                            <div className="w-1/3">
                                <div className="flex justify-between py-2 px-4 border-b border-gray-200">
                                    <span className="font-bold text-gray-800">إجمالي الحملات</span>
                                    <span className="font-bold text-gray-900">{reportData.summary.total_ads}</span>
                                </div>
                                <div className="flex justify-between py-2 px-4 border-b border-gray-200">
                                    <span className="font-bold text-gray-800">إجمالي مرات العرض</span>
                                    <span className="font-bold text-gray-900">{reportData.summary.total_plays}</span>
                                </div>
                                <div className="flex justify-between py-3 px-4 bg-[#1c5b8e] text-white rounded-b-lg mt-1">
                                    <span className="font-bold text-lg">الإجمالي الكلي</span>
                                    <span className="font-bold text-lg">${parseFloat(reportData.summary.total_revenue).toFixed(2)}</span>
                                </div>
                            </div>
                        </div>
                        
                        {/* Conditions and Info */}
                        <div className="mt-16 grid grid-cols-2 gap-8 items-end w-full">
                            <div className="text-right">
                                <h4 className="font-bold text-gray-900 text-lg mb-2">معلومات إضافية:</h4>
                                <p className="text-gray-600 text-sm leading-relaxed">
                                    هذا التقرير صادر آلياً من نظام (SabaPost) لإدارة الشاشات الإعلانية الرقمية، وهو يُعتبر تقريراً معتمداً ولا يتطلب ختماً أو توقيعاً يدوياً للمصادقة على صحة الأرقام.
                                </p>
                            </div>
                            <div className="flex flex-col items-center justify-end px-12">
                                <h4 className="font-bold text-gray-900 text-lg mb-10 border-b border-gray-300 pb-2 min-w-[250px] text-center">{user?.full_name || user?.username || 'مدير النظام'}</h4>
                                <p className="text-gray-500 text-sm w-full text-center">التوقيع</p>
                            </div>
                        </div>
                    </div>

                    {/* Footer Bar */}
                    <div className="w-full bg-[#14355d] text-white py-4 px-16 flex justify-between items-center mt-auto">
                        <div className="flex items-center gap-2">
                            <span>🌐</span>
                            <span dir="ltr">www.sabapost.com.sa</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span dir="ltr">{user?.phone || ''}</span>
                            <span>📞</span>
                        </div>
                    </div>
                </div>
            )}
            
            {/* Empty State when no report is generated yet */}
            {!reportData && !loadingReport && (
                <div className="w-full bg-surface-container-low border border-outline-variant/50 border-dashed rounded-3xl py-24 px-4 flex flex-col items-center justify-center text-center print:hidden">
                    <div className="w-20 h-20 bg-surface rounded-full flex items-center justify-center shadow-sm mb-6">
                        <FileText className="w-10 h-10 text-primary/40" />
                    </div>
                    <h3 className="text-xl font-bold text-on-background mb-2 whitespace-nowrap">التقارير جاهزة للاستخراج</h3>
                    <p className="text-on-surface-variant min-w-[min(100%,400px)] max-w-[500px] w-full mx-auto leading-relaxed">قم بتحديد الشاشة والفترة الزمنية من الفلاتر العلوية ثم اضغط على زر "استخراج" لعرض التقرير وطباعته.</p>
                </div>
            )}
        </div>
    );
};

export default ScreenReportsPage;
