import React, { useState } from 'react';
import { Calendar, DollarSign, Search, Printer, PieChart, TrendingUp, Users, Monitor, FileText } from 'lucide-react';
import axiosClient from '../../core/api/axiosClient';
import useToastStore from '../../store/useToastStore';
import useAuthStore from '../../store/useAuthStore';
import useTranslation from '../../i18n/useTranslation';

const FinancialReportPage = () => {
    const { t } = useTranslation();
    const { user } = useAuthStore();
    const addToast = useToastStore(state => state.addToast);

    // Filters State
    const [reportType, setReportType] = useState('comprehensive');
    const [filters, setFilters] = useState({
        start_date: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
        end_date: new Date().toISOString().split('T')[0],
    });

    const [reportData, setReportData] = useState(null);
    const [detailedData, setDetailedData] = useState(null);
    const [loadingReport, setLoadingReport] = useState(false);
    
    // Users and Roles for filtering
    const [users, setUsers] = useState([]);
    const [roles, setRoles] = useState([]);
    const [selectedRole, setSelectedRole] = useState('');
    
    React.useEffect(() => {
        const fetchUsers = async () => {
            try {
                const res = await axiosClient.get('/users');
                if (res.data && res.data.users) {
                    setUsers(res.data.users);
                } else if (Array.isArray(res.data)) {
                    setUsers(res.data);
                }
            } catch (error) {
                console.error("Failed to fetch users", error);
            }
        };
        const fetchRoles = async () => {
            try {
                const res = await axiosClient.get('/lookups/roles');
                if (res.data && res.data.roles) {
                    setRoles(res.data.roles);
                } else if (Array.isArray(res.data)) {
                    setRoles(res.data);
                }
            } catch (error) {
                console.error("Failed to fetch roles", error);
            }
        };
        // Only fetch users and roles if the current user has permission (Admin/SuperAdmin)
        if ([1, 2, 7, 8].includes(Number(user?.role_id))) {
            fetchUsers();
            fetchRoles();
        }
    }, [user]);

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
        setReportData(null);
        setDetailedData(null);
        try {
            if (reportType === 'comprehensive') {
                const res = await axiosClient.get('/reports/comprehensive-financial', { params: filters });
                setReportData(res.data);
            } else {
                const res = await axiosClient.get('/financial/ledger', { params: filters });
                setDetailedData(res.data.data.transactions);
            }
            addToast(t('reports.report_generated_success'), 'success');
        } catch (error) {
            console.error("Error generating report", error);
            addToast(t('reports.report_generate_failed'), 'error');
            setReportData(null);
            setDetailedData(null);
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
                        <DollarSign className="w-8 h-8 text-primary" />
                        {t('reports.financial_report_title', 'Comprehensive Financial Report')}
                    </h1>
                    <p className="text-on-surface-variant mt-2 text-sm">{t('reports.financial_report_desc', 'Detailed financial overview including platform commissions and owner profits.')}</p>
                </div>
            </div>

            {/* Filters Section - Hidden on Print */}
            <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-6 shadow-sm mb-8 print:hidden">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
                    
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-on-surface block">{t('reports.report_type', 'Report Type')}</label>
                        <select 
                            value={reportType} 
                            onChange={(e) => setReportType(e.target.value)}
                            className="w-full h-11 px-4 rounded-xl border border-outline-variant bg-surface text-on-surface focus:border-primary outline-none transition-all"
                        >
                            <option value="comprehensive">{t('reports.comprehensive_report', 'Comprehensive Report')}</option>
                            <option value="detailed">{t('reports.detailed_ledger', 'Detailed Ledger')}</option>
                        </select>
                    </div>

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
                    
                    {[1, 2, 7, 8].includes(Number(user?.role_id)) && (
                        <>
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-on-surface block">{t('reports.role', 'الصلاحية')}</label>
                                <select 
                                    value={selectedRole} 
                                    onChange={(e) => {
                                        setSelectedRole(e.target.value);
                                        setFilters(prev => ({ ...prev, user_id: '' })); // reset user
                                    }}
                                    className="w-full h-11 px-4 rounded-xl border border-outline-variant bg-surface text-on-surface focus:border-primary outline-none transition-all"
                                >
                                    <option value="">{t('reports.all_roles', 'الكل')}</option>
                                    {roles.map(r => (
                                        <option key={r.role_id} value={r.role_id}>{r.role_name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-on-surface block">{t('reports.advertiser_owner', 'المستخدم (معلن / مالك)')}</label>
                                <select 
                                    name="user_id"
                                    value={filters.user_id || ''} 
                                    onChange={handleFilterChange}
                                    className="w-full h-11 px-4 rounded-xl border border-outline-variant bg-surface text-on-surface focus:border-primary outline-none transition-all"
                                >
                                    <option value="">{t('reports.all_users', 'الكل')}</option>
                                    {users.filter(u => selectedRole ? u.role_id == selectedRole : true).map(u => (
                                        <option key={u.user_id} value={u.user_id}>{u.full_name || u.username}</option>
                                    ))}
                                </select>
                            </div>
                        </>
                    )}

                    <div className={`flex justify-end gap-3 mt-2 ${[1, 2, 7, 8].includes(Number(user?.role_id)) ? 'md:col-span-3' : 'col-span-1'}`}>
                        <button 
                            onClick={generateReport}
                            disabled={loadingReport}
                            className="bg-primary hover:bg-primary/90 text-white px-8 h-11 font-medium rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-50 shadow-sm"
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
                            disabled={!reportData && !detailedData}
                            className="w-11 h-11 shrink-0 bg-surface border border-outline-variant text-on-surface hover:text-primary hover:bg-primary-container hover:border-primary font-medium rounded-xl flex items-center justify-center transition-all disabled:opacity-50 shadow-sm"
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
            {(reportData || detailedData) && (
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
                            <h1 className="text-4xl font-black tracking-tight" style={{ color: '#ffffff' }}>{reportType === 'comprehensive' ? t('reports.financial_report_header', 'Comprehensive Financial Report') : t('reports.detailed_ledger_header', 'Detailed Financial Ledger')}</h1>
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
                        {reportType === 'comprehensive' && reportData && (
                            <>
                                <div className="grid grid-cols-3 gap-6 mb-10">
                            <div className="bg-blue-50 border border-blue-100 p-6 rounded-2xl text-center">
                                <DollarSign className="w-10 h-10 text-blue-600 mx-auto mb-2" />
                                <h3 className="text-gray-600 font-medium text-sm mb-1">{t('reports.total_revenue_lbl', 'Total Collected Revenue')}</h3>
                                <p className="text-3xl font-black text-gray-900">${reportData.summary.total_revenue}</p>
                            </div>
                            <div className="bg-purple-50 border border-purple-100 p-6 rounded-2xl text-center">
                                <PieChart className="w-10 h-10 text-purple-600 mx-auto mb-2" />
                                <h3 className="text-gray-600 font-medium text-sm mb-1">{t('reports.platform_commission_lbl', 'Platform Commission')}</h3>
                                <p className="text-3xl font-black text-purple-900">${reportData.summary.platform_commission}</p>
                            </div>
                            <div className="bg-emerald-50 border border-emerald-100 p-6 rounded-2xl text-center">
                                <TrendingUp className="w-10 h-10 text-emerald-600 mx-auto mb-2" />
                                <h3 className="text-gray-600 font-medium text-sm mb-1">{t('reports.owners_net_profit_lbl', 'Owners Net Profit')}</h3>
                                <p className="text-3xl font-black text-emerald-900">${reportData.summary.owners_net_profit}</p>
                            </div>
                        </div>

                        {/* Top Advertisers & Screens */}
                        <div className="grid grid-cols-2 gap-8 mb-10">
                            {/* Top Advertisers */}
                            <div className="border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
                                <div className="bg-gray-50 py-3 px-4 border-b border-gray-200 font-bold text-gray-800 flex items-center gap-2">
                                    <Users className="w-5 h-5 text-gray-500" />
                                    {t('reports.top_advertisers', 'Top Advertisers')}
                                </div>
                                <div className="p-0">
                                    <table className="w-full text-right text-sm">
                                        <thead className="bg-gray-50 text-gray-500 border-b border-gray-200">
                                            <tr>
                                                <th className="py-2 px-4 font-medium">{t('reports.advertiser', 'Advertiser')}</th>
                                                <th className="py-2 px-4 font-medium text-left">{t('reports.spend', 'Spend')}</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {(reportData?.top_advertisers || []).map((adv, idx) => (
                                                <tr key={idx} className="hover:bg-gray-50 transition-colors">
                                                    <td className="py-3 px-4 text-gray-800 font-medium">{adv.advertiser_name}</td>
                                                    <td className="py-3 px-4 text-left font-bold text-gray-900">${parseFloat(adv.total_spend || 0).toFixed(2)}</td>
                                                </tr>
                                            ))}
                                            {(reportData?.top_advertisers || []).length === 0 && (
                                                <tr>
                                                    <td colSpan="2" className="py-6 text-center text-gray-400">{t('reports.no_data', 'No data available')}</td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Top Screens */}
                            <div className="border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
                                <div className="bg-gray-50 py-3 px-4 border-b border-gray-200 font-bold text-gray-800 flex items-center gap-2">
                                    <Monitor className="w-5 h-5 text-gray-500" />
                                    {t('reports.top_screens', 'Top Screens (Revenue)')}
                                </div>
                                <div className="p-0">
                                    <table className="w-full text-right text-sm">
                                        <thead className="bg-gray-50 text-gray-500 border-b border-gray-200">
                                            <tr>
                                                <th className="py-2 px-4 font-medium">{t('reports.screen', 'Screen')}</th>
                                                <th className="py-2 px-4 font-medium text-left">{t('reports.revenue', 'Revenue')}</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {(reportData?.top_screens || []).map((screen, idx) => (
                                                <tr key={idx} className="hover:bg-gray-50 transition-colors">
                                                    <td className="py-3 px-4 text-gray-800 font-medium">{screen.screen_name}</td>
                                                    <td className="py-3 px-4 text-left font-bold text-gray-900">${parseFloat(screen.total_revenue || 0).toFixed(2)}</td>
                                                </tr>
                                            ))}
                                            {(reportData?.top_screens || []).length === 0 && (
                                                <tr>
                                                    <td colSpan="2" className="py-6 text-center text-gray-400">{t('reports.no_data', 'No data available')}</td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                            </>
                        )}

                        {reportType === 'detailed' && detailedData && (
                            <div className="border border-gray-200 rounded-2xl overflow-hidden shadow-sm mt-8">
                                <table className="w-full text-right text-sm">
                                    <thead className="bg-gray-50 text-gray-500 border-b border-gray-200">
                                        <tr>
                                            <th className="py-3 px-4 font-medium">{t('reports.transaction_id', 'Trans. ID')}</th>
                                            <th className="py-3 px-4 font-medium">{t('reports.date', 'Date')}</th>
                                            <th className="py-3 px-4 font-medium">{t('reports.advertiser', 'Advertiser')}</th>
                                            <th className="py-3 px-4 font-medium">{t('reports.screen', 'Screen')}</th>
                                            <th className="py-3 px-4 font-medium">{t('reports.statement', 'البيان')}</th>
                                            <th className="py-3 px-4 font-medium">{t('reports.payment_method', 'Payment Method')}</th>
                                            <th className="py-3 px-4 font-medium">{t('reports.reference_number', 'Ref Number')}</th>
                                            <th className="py-3 px-4 font-medium text-left">{t('reports.amount', 'Amount')}</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {detailedData.map((tx, idx) => (
                                            <tr key={idx} className="hover:bg-gray-50 transition-colors">
                                                <td className="py-3 px-4 text-gray-800 font-medium" dir="ltr">#{tx.ledger_id}</td>
                                                <td className="py-3 px-4 text-gray-600">{new Date(tx.created_at).toLocaleDateString()}</td>
                                                <td className="py-3 px-4 text-gray-800">{tx.user?.full_name || t('reports.unknown', 'Unknown')}</td>
                                                <td className="py-3 px-4 text-gray-600">{tx.screen?.screen_name || '-'}</td>
                                                <td className="py-3 px-4 text-gray-600">
                                                    {(() => {
                                                        const txType = t(`reports.tx_type_${tx.transaction_type}`, tx.transaction_type);
                                                        let adName = tx.advertisement ? tx.advertisement.title : '';
                                                        let screenName = tx.screen ? tx.screen.screen_name : '';
                                                        
                                                        if (tx.transaction_type === 'platform_fee' && adName) {
                                                            return `عمولة منصة مقابل الإعلان (${adName})`;
                                                        } else if ((tx.transaction_type === 'payment' || tx.transaction_type === 'payment_in') && adName) {
                                                            return `دفع للإعلان (${adName})`;
                                                        } else if (tx.transaction_type === 'payout_completed') {
                                                            return `سحب أرباح`;
                                                        } else if (tx.transaction_type === 'payout_requested') {
                                                            return `طلب سحب أرباح`;
                                                        } else if (tx.transaction_type === 'payout_pending' && adName && screenName) {
                                                            return `أرباح الشاشة (${screenName}) من الإعلان (${adName})`;
                                                        }
                                                        
                                                        let notesText = '';
                                                        if (tx.notes) {
                                                            try {
                                                                const parsed = JSON.parse(tx.notes);
                                                                if (typeof parsed === 'object' && parsed !== null) {
                                                                    notesText = Object.entries(parsed).map(([k, v]) => `${k}: ${v}`).join(' | ');
                                                                } else {
                                                                    notesText = tx.notes;
                                                                }
                                                            } catch (e) {
                                                                notesText = tx.notes;
                                                            }
                                                        }
                                                        
                                                        if (notesText && (notesText.includes('إعلان') || notesText.includes('شاشة') || notesText.includes('دفع'))) {
                                                            return notesText;
                                                        }

                                                        if (notesText) {
                                                            return `${txType} - ${notesText}`;
                                                        }
                                                        return txType;
                                                    })()}
                                                </td>
                                                <td className="py-3 px-4 text-gray-600">{tx.payment_method || '-'}</td>
                                                <td className="py-3 px-4 text-gray-600">
                                                    {tx.reference_number ? (
                                                        <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">{tx.reference_number}</span>
                                                    ) : tx.advertisement ? (
                                                        <span className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded border border-blue-100 flex items-center gap-1 w-max">
                                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                                                            {t('ad', 'إعلان')} #{tx.advertisement.ad_id}
                                                        </span>
                                                    ) : tx.screen ? (
                                                        <span className="text-xs bg-purple-50 text-purple-700 px-2 py-1 rounded border border-purple-100 flex items-center gap-1 w-max">
                                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                                                            {t('screen', 'شاشة')} #{tx.screen.screen_id}
                                                        </span>
                                                    ) : (
                                                        <span className="text-gray-400">-</span>
                                                    )}
                                                </td>
                                                <td className="py-3 px-4 text-left font-bold text-gray-900">${parseFloat(tx.amount).toFixed(2)}</td>
                                            </tr>
                                        ))}
                                        {detailedData.length === 0 && (
                                            <tr>
                                                <td colSpan="8" className="py-6 text-center text-gray-400">{t('reports.no_data', 'No data available')}</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )}
                        
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
            {!reportData && !detailedData && !loadingReport && (
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

export default FinancialReportPage;
