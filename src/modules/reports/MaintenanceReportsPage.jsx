import React, { useState, useEffect } from 'react';
import { Calendar, FileText, Printer, Search, Activity, Wifi, WifiOff, Clock } from 'lucide-react';
import axiosClient from '../../core/api/axiosClient';
import { ENDPOINTS } from '../../core/api/endpoints';
import useToastStore from '../../store/useToastStore';
import useAuthStore from '../../store/useAuthStore';

const MaintenanceReportsPage = () => {
    const { user } = useAuthStore();
    const [screens, setScreens] = useState([]);
    const [loadingScreens, setLoadingScreens] = useState(true);
    
    // Filters State
    const [filters, setFilters] = useState({
        screen_id: '',
        start_date: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
        end_date: new Date().toISOString().split('T')[0],
    });

    const [reportData, setReportData] = useState(null);
    const [loadingReport, setLoadingReport] = useState(false);
    
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
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    const generateReport = async () => {
        if (!filters.screen_id || !filters.start_date || !filters.end_date) {
            addToast('يرجى تعبئة جميع الفلاتر المطلوبة', 'warning');
            return;
        }

        setLoadingReport(true);
        try {
            const res = await axiosClient.get('/reports/maintenance', { params: filters });
            setReportData(res.data);
            addToast('تم استخراج تقرير الصيانة بنجاح', 'success');
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
                        <Activity className="w-8 h-8 text-primary" />
                        تقرير الصيانة الفني
                    </h1>
                    <p className="text-on-surface-variant mt-2 text-sm">استخرج تقارير فنية حول حالة الشاشات وأوقات الانقطاع</p>
                </div>
            </div>

            {/* Filters Section - Hidden on Print */}
            <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-6 shadow-sm mb-8 print:hidden">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
                    
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
                            {screens.map(screen => (
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
                    @page { size: A4; margin: 0; }
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
                        
                        <div className="w-48 bg-[#102a43]" style={{ clipPath: 'polygon(0 0, 100% 0, 75% 100%, 25% 100%)' }}></div>

                        <div className="flex-1 flex items-center justify-end px-12 bg-[#1c5b8e]">
                            <h1 className="text-5xl font-black tracking-tight" style={{ color: '#ffffff' }}>تقرير فني للصيانة</h1>
                        </div>
                    </div>

                    {/* Metadata Section */}
                    <div className="grid grid-cols-2 gap-8 py-10 px-16 bg-white">
                        <div className="flex-1 text-right space-y-3">
                            <div className="flex justify-start gap-3"><span className="font-bold text-gray-900 w-32">السيد/ة:</span> <span className="text-gray-700">{reportData.screen.owner ? (reportData.screen.owner.full_name || reportData.screen.owner.username) : 'غير مدرج'}</span></div>
                            <div className="flex justify-start gap-3"><span className="font-bold text-gray-900 w-32">رقم الجوال:</span> <span className="text-gray-700">{reportData.screen.owner?.phone || 'غير مدرج'}</span></div>
                        </div>

                        <div className="flex-1 text-left space-y-3">
                            <div className="flex justify-end gap-3"><span className="text-gray-700">{reportData.screen.screen_id} - {reportData.screen.screen_name}</span> <span className="font-bold text-gray-900">:رقم الشاشة</span></div>
                            <div className="flex justify-end gap-3"><span className="text-gray-700">{reportData.screen.street ? `${reportData.screen.street.street_name} - ${reportData.screen.street.region?.region_name}` : 'غير محدد'}</span> <span className="font-bold text-gray-900">:موقع الشاشة</span></div>
                            <div className="flex justify-end gap-3"><span className="text-gray-700">{new Date().toLocaleDateString('ar-SA')}</span> <span className="font-bold text-gray-900">:تاريخ الإصدار</span></div>
                            <div className="flex justify-end gap-3"><span className="text-gray-700" dir="ltr">{filters.start_date} <span className="mx-1">/</span> {filters.end_date}</span> <span className="font-bold text-gray-900">:الفترة</span></div>
                        </div>
                    </div>

                    {/* Technical Stats */}
                    <div className="px-16 flex-1 mb-10">
                        <h2 className="text-xl font-bold mb-6 text-gray-800 border-b pb-2">الملخص الفني وحالة الشاشة</h2>
                        
                        <div className="grid grid-cols-2 gap-6">
                            {/* Status Card */}
                            <div className={`p-6 rounded-2xl border ${reportData.summary.status === 'Online' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                                <div className="flex items-center gap-4">
                                    <div className={`p-4 rounded-full ${reportData.summary.status === 'Online' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                                        {reportData.summary.status === 'Online' ? <Wifi className="w-8 h-8" /> : <WifiOff className="w-8 h-8" />}
                                    </div>
                                    <div>
                                        <p className="text-gray-600 font-medium">حالة الاتصال الحالية</p>
                                        <h3 className={`text-2xl font-bold ${reportData.summary.status === 'Online' ? 'text-green-700' : 'text-red-700'}`}>
                                            {reportData.summary.status === 'Online' ? 'متصلة (Online)' : 'غير متصلة (Offline)'}
                                        </h3>
                                    </div>
                                </div>
                            </div>

                            {/* Offline Hours Card */}
                            <div className="p-6 rounded-2xl border bg-orange-50 border-orange-200">
                                <div className="flex items-center gap-4">
                                    <div className="p-4 rounded-full bg-orange-100 text-orange-600">
                                        <Clock className="w-8 h-8" />
                                    </div>
                                    <div>
                                        <p className="text-gray-600 font-medium">ساعات الانقطاع الحالية</p>
                                        <h3 className="text-2xl font-bold text-orange-700">
                                            {reportData.summary.offline_hours} ساعة
                                        </h3>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-6 mt-6">
                            {/* Ads count */}
                            <div className="p-6 rounded-2xl border bg-blue-50 border-blue-200">
                                <p className="text-gray-600 font-medium mb-1">إجمالي الحملات الفعالة</p>
                                <h3 className="text-3xl font-bold text-blue-700">{reportData.summary.total_ads}</h3>
                                <p className="text-xs text-gray-500 mt-2">خلال الفترة المحددة</p>
                            </div>
                            
                            {/* Total Plays */}
                            <div className="p-6 rounded-2xl border bg-indigo-50 border-indigo-200">
                                <p className="text-gray-600 font-medium mb-1">إجمالي مرات العرض (Playbacks)</p>
                                <h3 className="text-3xl font-bold text-indigo-700">{reportData.summary.total_plays}</h3>
                                <p className="text-xs text-gray-500 mt-2">مؤشر على عمل مشغل الوسائط</p>
                            </div>
                        </div>

                        <div className="mt-8 bg-gray-50 p-6 rounded-2xl border border-gray-200">
                            <h3 className="font-bold text-gray-800 mb-4">سجل الاتصال الأخير</h3>
                            <div className="space-y-3">
                                <div className="flex justify-between border-b pb-2">
                                    <span className="text-gray-600">آخر اتصال بالخادم (Ping):</span>
                                    <span className="font-medium text-gray-900" dir="ltr">{reportData.summary.last_ping || 'غير متاح'}</span>
                                </div>
                                <div className="flex justify-between border-b pb-2">
                                    <span className="text-gray-600">تاريخ آخر انقطاع:</span>
                                    <span className="font-medium text-gray-900" dir="ltr">{reportData.summary.offline_since || 'لا يوجد انقطاع مسجل'}</span>
                                </div>
                            </div>
                        </div>
                        
                        {/* Conditions and Info */}
                        <div className="mt-16 grid grid-cols-2 gap-8 items-end w-full">
                            <div className="text-right">
                                <h4 className="font-bold text-gray-900 text-lg mb-2">معلومات إضافية:</h4>
                                <p className="text-gray-600 text-sm leading-relaxed">
                                    هذا التقرير مخصص لفريق الصيانة والدعم الفني لمراقبة أداء الشاشات ولا يحتوي على أي بيانات مالية. التقرير مصدر آلياً.
                                </p>
                            </div>
                            <div className="flex flex-col items-center justify-end px-12">
                                <h4 className="font-bold text-gray-900 text-lg mb-10 border-b border-gray-300 pb-2 min-w-[250px] text-center">{user?.full_name || user?.username || 'فريق الصيانة'}</h4>
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
                <div className="bg-surface-container-low border border-outline-variant/50 border-dashed rounded-3xl py-24 flex flex-col items-center justify-center text-center print:hidden">
                    <div className="w-20 h-20 bg-surface rounded-full flex items-center justify-center shadow-sm mb-6">
                        <Activity className="w-10 h-10 text-primary/40" />
                    </div>
                    <h3 className="text-xl font-bold text-on-background mb-2">التقارير الفنية جاهزة للاستخراج</h3>
                    <p className="text-on-surface-variant max-w-md">قم بتحديد الشاشة والفترة الزمنية ثم اضغط على زر "استخراج" لعرض تقرير الصيانة الفني وطباعته.</p>
                </div>
            )}
        </div>
    );
};

export default MaintenanceReportsPage;
