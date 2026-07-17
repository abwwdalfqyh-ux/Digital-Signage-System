import React, { useState } from 'react';
import { Calendar, Search, Printer, FileText, PieChart, TrendingUp, MonitorPlay, CheckCircle, XCircle, DollarSign } from 'lucide-react';
import axiosClient from '../../core/api/axiosClient';
import useToastStore from '../../store/useToastStore';
import useAuthStore from '../../store/useAuthStore';
import useTranslation from '../../i18n/useTranslation';

const AdPerformanceReportPage = () => {
    const { t } = useTranslation();
    const { user } = useAuthStore();
    const addToast = useToastStore(state => state.addToast);

    // Filters State
    const [filters, setFilters] = useState({
        start_date: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
        end_date: new Date().toISOString().split('T')[0],
    });

    const [reportData, setReportData] = useState(null);
    const [loadingReport, setLoadingReport] = useState(false);

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    const generateReport = async () => {
        if (!filters.start_date || !filters.end_date) {
            addToast(t('reports.fill_required_filters'), 'warning');
            return;
        }

        setLoadingReport(true);
        try {
            const res = await axiosClient.get('/reports/ad-performance', { params: filters });
            setReportData(res.data);
            addToast(t('reports.report_generated_success'), 'success');
        } catch (error) {
            console.error("Error generating report", error);
            addToast(t('reports.report_generate_failed'), 'error');
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
                        <MonitorPlay className="w-8 h-8 text-primary" />
                        {t('reports.ad_performance_report_title', 'Ad Performance Report')}
                    </h1>
                    <p className="text-on-surface-variant mt-2 text-sm">{t('reports.ad_performance_desc', 'Analyze ad statuses, durations, and geographical distribution.')}</p>
                </div>
            </div>

            {/* Filters Section - Hidden on Print */}
            <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-6 shadow-sm mb-8 print:hidden">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
                    
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-on-surface block">{t('reports.from_date')}</label>
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
                        <label className="text-sm font-semibold text-on-surface block">{t('reports.to_date')}</label>
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
                            disabled={loadingReport}
                            className="flex-1 bg-primary hover:bg-primary/90 text-white font-medium rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                        >
                            {loadingReport ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            ) : (
                                <>
                                    <Search className="w-5 h-5" />
                                    {t('reports.extract_btn')}
                                </>
                            )}
                        </button>
                        
                        <button 
                            onClick={handlePrint}
                            disabled={!reportData}
                            className="px-5 bg-surface border border-outline-variant text-on-surface hover:text-primary hover:bg-primary-container hover:border-primary font-medium rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                            title={t('reports.print_report')}
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
                                <p className="font-bold text-lg">{t('reports.sabapost_title')}</p>
                                <p className="text-sm opacity-80">{t('reports.sabapost_subtitle')}</p>
                            </div>
                        </div>
                        
                        {/* Center decorative element */}
                        <div className="w-48 bg-[#102a43]" style={{ clipPath: 'polygon(0 0, 100% 0, 75% 100%, 25% 100%)' }}></div>

                        <div className="flex-1 flex items-center justify-end px-12 bg-[#1c5b8e]">
                            <h1 className="text-4xl font-black tracking-tight" style={{ color: '#ffffff' }}>{t('reports.ad_performance_report_header', 'Ad Performance Report')}</h1>
                        </div>
                    </div>

                    {/* Metadata Section */}
                    <div className="flex justify-between items-start px-16 py-10">
                        <div className="flex-1 text-right space-y-2">
                            <p className="text-xl font-bold text-gray-800">{t('reports.report_issued_to')}</p>
                            <h2 className="text-3xl font-black text-gray-900">{user?.full_name || user?.username || t('reports.system_admin')}</h2>
                            <p className="text-gray-600 font-medium">{t('reports.certified_report_issuer')}</p>
                            <p className="text-gray-500 text-sm mt-4 tracking-widest font-mono" dir="ltr">{user?.phone || t('reports.phone_not_listed')}</p>
                        </div>
                        
                        <div className="flex-1 flex justify-end" dir="rtl">
                            <div className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-3 text-right">
                                <span className="font-bold text-gray-900">{t('reports.issue_date_lbl')}</span>
                                <span className="text-gray-700">{new Date().toLocaleDateString()}</span>

                                <span className="font-bold text-gray-900">{t('reports.period_lbl')}</span>
                                <span className="text-gray-700 text-right" dir="ltr">{filters.start_date} <span className="mx-1">/</span> {filters.end_date}</span>
                            </div>
                        </div>
                    </div>

                    <div className="px-16 flex-1 mb-10">
                        
                        {/* KPI Cards */}
                        <div className="grid grid-cols-4 gap-4 mb-10">
                            <div className="bg-blue-50 border border-blue-100 p-5 rounded-2xl text-center shadow-sm">
                                <PieChart className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                                <h3 className="text-gray-600 font-medium text-xs mb-1">{t('reports.total_ads', 'Total Ads')}</h3>
                                <p className="text-2xl font-black text-gray-900">{reportData.summary.total_ads}</p>
                            </div>
                            <div className="bg-emerald-50 border border-emerald-100 p-5 rounded-2xl text-center shadow-sm">
                                <CheckCircle className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
                                <h3 className="text-gray-600 font-medium text-xs mb-1">{t('reports.approval_rate', 'Approved Ads')}</h3>
                                <p className="text-2xl font-black text-emerald-900">{reportData.summary.approval_rate}</p>
                            </div>
                            <div className="bg-rose-50 border border-rose-100 p-5 rounded-2xl text-center shadow-sm">
                                <XCircle className="w-8 h-8 text-rose-600 mx-auto mb-2" />
                                <h3 className="text-gray-600 font-medium text-xs mb-1">{t('reports.rejection_rate', 'Rejected Ads')}</h3>
                                <p className="text-2xl font-black text-rose-900">{reportData.summary.rejection_rate}</p>
                            </div>
                            <div className="bg-amber-50 border border-amber-100 p-5 rounded-2xl text-center shadow-sm">
                                <TrendingUp className="w-8 h-8 text-amber-600 mx-auto mb-2" />
                                <h3 className="text-gray-600 font-medium text-xs mb-1">{t('reports.avg_duration', 'Avg Duration (Days)')}</h3>
                                <p className="text-2xl font-black text-amber-900">{reportData.summary.avg_duration_days}</p>
                            </div>
                        </div>

                        {/* Top Expensive Ads & Distribution */}
                        <div className="grid grid-cols-2 gap-8 mb-10">
                            {/* Distribution by Governorate */}
                            <div className="border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
                                <div className="bg-gray-50 py-3 px-4 border-b border-gray-200 font-bold text-gray-800 flex items-center gap-2">
                                    <PieChart className="w-5 h-5 text-gray-500" />
                                    {t('reports.distribution_gov', 'Distribution by Governorate')}
                                </div>
                                <div className="p-0">
                                    <table className="w-full text-right text-sm">
                                        <thead className="bg-gray-50 text-gray-500 border-b border-gray-200">
                                            <tr>
                                                <th className="py-2 px-4 font-medium">{t('reports.governorate', 'Governorate')}</th>
                                                <th className="py-2 px-4 font-medium text-center">{t('reports.ads_count', 'Ads Count')}</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {(reportData?.distribution_by_governorate || []).map((gov, idx) => (
                                                <tr key={idx} className="hover:bg-gray-50 transition-colors">
                                                    <td className="py-3 px-4 text-gray-800 font-medium">{gov.name}</td>
                                                    <td className="py-3 px-4 text-center font-bold text-gray-900">{gov.value}</td>
                                                </tr>
                                            ))}
                                            {(reportData?.distribution_by_governorate || []).length === 0 && (
                                                <tr>
                                                    <td colSpan="2" className="py-6 text-center text-gray-400">{t('reports.no_data', 'No data available')}</td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Most Expensive Ads */}
                            <div className="border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
                                <div className="bg-gray-50 py-3 px-4 border-b border-gray-200 font-bold text-gray-800 flex items-center gap-2">
                                    <DollarSign className="w-5 h-5 text-gray-500" />
                                    {t('reports.expensive_ads', 'Most Expensive Ads')}
                                </div>
                                <div className="p-0">
                                    <table className="w-full text-right text-sm">
                                        <thead className="bg-gray-50 text-gray-500 border-b border-gray-200">
                                            <tr>
                                                <th className="py-2 px-4 font-medium">{t('reports.ad_title', 'Ad Title')}</th>
                                                <th className="py-2 px-4 font-medium text-center">{t('reports.status', 'Status')}</th>
                                                <th className="py-2 px-4 font-medium text-left">{t('reports.cost', 'Cost')}</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {(reportData?.most_expensive_ads || []).map((ad, idx) => (
                                                <tr key={idx} className="hover:bg-gray-50 transition-colors">
                                                    <td className="py-3 px-4 text-gray-800 font-medium">{ad.title}</td>
                                                    <td className="py-3 px-4 text-center">
                                                        <span className={`inline-flex px-2 py-1 rounded-md text-xs font-bold ${
                                                            ad.status === 'Active' ? 'bg-emerald-100 text-emerald-800' :
                                                            ad.status === 'Pending' ? 'bg-amber-100 text-amber-800' :
                                                            ad.status === 'Rejected' ? 'bg-rose-100 text-rose-800' :
                                                            'bg-gray-100 text-gray-800'
                                                        }`}>
                                                            {t(`ads.status_${ad.status?.toLowerCase() || 'unknown'}`, ad.status || 'Unknown')}
                                                        </span>
                                                    </td>
                                                    <td className="py-3 px-4 text-left font-bold text-gray-900">${parseFloat(ad.cost || 0).toFixed(2)}</td>
                                                </tr>
                                            ))}
                                            {(reportData?.most_expensive_ads || []).length === 0 && (
                                                <tr>
                                                    <td colSpan="3" className="py-6 text-center text-gray-400">{t('reports.no_data', 'No data available')}</td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                        
                        {/* Conditions and Info */}
                        <div className="mt-16 grid grid-cols-2 gap-8 items-end w-full">
                            <div className="text-right">
                                <h4 className="font-bold text-gray-900 text-lg mb-2">{t('reports.additional_info')}</h4>
                                <p className="text-gray-600 text-sm leading-relaxed">
                                    {t('reports.auto_generated_disclaimer')}
                                </p>
                            </div>
                            <div className="flex flex-col items-center justify-end px-12">
                                <h4 className="font-bold text-gray-900 text-lg mb-10 border-b border-gray-300 pb-2 min-w-[250px] text-center">{user?.full_name || user?.username || t('reports.system_admin')}</h4>
                                <p className="text-gray-500 text-sm w-full text-center">{t('reports.signature')}</p>
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
                    <h3 className="text-xl font-bold text-on-background mb-2 whitespace-nowrap">{t('reports.reports_ready')}</h3>
                    <p className="text-on-surface-variant min-w-[min(100%,400px)] max-w-[500px] w-full mx-auto leading-relaxed">{t('reports.reports_ready_desc')}</p>
                </div>
            )}
        </div>
    );
};

export default AdPerformanceReportPage;
