import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import axiosClient from '../../core/api/axiosClient';
import { ENDPOINTS } from '../../core/api/endpoints';
import DataTable from '../../shared/components/DataTable';
import DynamicPageLoader from '../../shared/components/DynamicPageLoader';
import Modal from '../../shared/components/Modal';
import { useQueryClient } from '@tanstack/react-query';
import echo from '../../core/api/echo';
import { useLedger, useRecordPayment, useApprovePayout, useRejectPayout, useArchiveLedger } from '../../hooks/api/useFinancial';

const FinancialPage = () => {
    const queryClient = useQueryClient();
    const [dateFilters, setDateFilters] = useState({ start_date: '', end_date: '' });
    const { data: ledgerData, isLoading, isFetching } = useLedger(dateFilters);
    const { mutateAsync: recordPayment } = useRecordPayment();
    const { mutateAsync: approvePayout, isPending: isApproving } = useApprovePayout();
    const { mutateAsync: rejectPayout, isPending: isRejecting } = useRejectPayout();

    const data = ledgerData || { total_payments: 0, transactions: [] };
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
    const [reviewModalData, setReviewModalData] = useState(null);
    const [reviewForm, setReviewForm] = useState({ reference_number: '', reason: '' });
    const [activeFilter, setActiveFilter] = useState('all'); // 'all', 'completed', 'pending', 'rejected'
    const [formData, setFormData] = useState({ amount: '', reference_number: '', payment_method: 'bank_transfer' });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isAmountVisible, setIsAmountVisible] = useState(true);

    const [isArchiveModalOpen, setIsArchiveModalOpen] = useState(false);
    const [archiveMonths, setArchiveMonths] = useState('6');
    const { mutateAsync: archiveLedger, isPending: isArchiving } = useArchiveLedger();

    useEffect(() => {
        const channel = echo.private('admin.ledger');
        channel.listen('LedgerUpdated', (e) => {
            queryClient.invalidateQueries({ queryKey: ['ledger'] });
        });
        return () => {
            echo.leave('admin.ledger');
        };
    }, [queryClient]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await recordPayment({
                amount: parseFloat(formData.amount),
                reference_number: formData.reference_number,
                payment_method: formData.payment_method,
            });
            setIsAddModalOpen(false);
            setFormData({ amount: '', reference_number: '', payment_method: 'bank_transfer' });
        } catch (error) {
            // Handled by hook
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleApprovePayout = async (e) => {
        e.preventDefault();
        if (!reviewForm.reference_number) return alert('الرجاء إدخال رقم مرجعي للتحويل');
        try {
            await approvePayout({ id: reviewModalData.ledger_id, reference_number: reviewForm.reference_number });
            setReviewModalData(null);
            setReviewForm({ reference_number: '', reason: '' });
        } catch (error) {}
    };

    const handleRejectPayout = async (e) => {
        e.preventDefault();
        if (!reviewForm.reason) return alert('الرجاء إدخال سبب الرفض');
        try {
            await rejectPayout({ id: reviewModalData.ledger_id, reason: reviewForm.reason });
            setReviewModalData(null);
            setReviewForm({ reference_number: '', reason: '' });
        } catch (error) {}
    };

    const handleArchive = async () => {
        try {
            await archiveLedger({ months: parseInt(archiveMonths) });
            setIsArchiveModalOpen(false);
        } catch (error) {}
    };

    const handleExportCSV = () => {
        const transactionsList = Array.isArray(data.transactions) ? data.transactions : Object.values(data.transactions || {});
        const headers = ['التاريخ', 'المعلن', 'طريقة الدفع', 'المرجع', 'المبلغ ($)', 'الحالة'];
        
        let csvContent = "";
        
        if (transactionsList.length === 0) {
            // Provide feedback via alert if the user wants to ensure it's communicative
            alert("السجل المحاسبي فارغ حالياً! سيتم تصدير قالب فارغ يحتوي على العناوين فقط.");
        }

        const csvRows = transactionsList.map(t => {
            const date = new Date(t.created_at).toLocaleDateString('ar-EG');
            const user = t.user?.full_name || 'غير معروف';
            const method = t.payment_method || 'N/A';
            const ref = t.reference_number || '-';
            const amount = parseFloat(t.amount || 0).toFixed(2);
            const status = t.status === 'completed' ? 'معتمدة' : t.status === 'rejected' ? 'مرفوضة' : 'قيد المراجعة';
            return `"${date}","${user}","${method}","${ref}","${amount}","${status}"`;
        });
        
        csvContent = "data:text/csv;charset=utf-8,\uFEFF" + [headers.join(','), ...csvRows].join('\n');
        
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement('a');
        link.setAttribute('href', encodedUri);
        link.setAttribute('download', `financial_ledger_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handlePrintPlatformReport = () => {
        window.print();
    };

    const platformTransactions = Array.isArray(data.transactions) 
        ? data.transactions.filter(t => t.transaction_type === 'platform_fee' && t.status === 'completed') 
        : [];
    const totalPlatformProfit = data.platform_profit || 0;

    const transactions = Array.isArray(data.transactions) ? data.transactions : Object.values(data.transactions || {});
    const filteredTransactions = transactions.filter(t => activeFilter === 'all' || t.status === activeFilter);
    
    // Financial Metrics
    const platformProfit = data.platform_profit || 0;
    const ownersLiabilities = data.owners_liabilities || 0;
    const totalCashFlow = data.total_payments || 0;
    const pendingTransactions = transactions.filter(t => t.status === 'pending').length;

    const columns = [
        { 
            key: 'created_at', 
            header: 'التاريخ', 
            cell: (row) => (
                <div className="flex flex-col">
                    <span className="font-label-md text-label-md text-on-surface" dir="ltr">
                        {new Date(row.created_at).toLocaleDateString('ar-EG', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </span>
                    <span className="font-caption text-[10px] text-on-surface-variant" dir="ltr">
                        {new Date(row.created_at).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                </div>
            )
        },
        { 
            key: 'user.full_name', 
            header: 'المعلن', 
            cell: (row) => (
                <div className="flex items-center gap-3 py-1">
                    <div className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center font-bold text-on-surface-variant text-xs shadow-inner shrink-0">
                        {row.user?.full_name?.charAt(0) || '-'}
                    </div>
                    <span className="font-label-md text-label-md text-on-surface">{row.user?.full_name || '—'}</span>
                </div>
            )
        },
        { 
            key: 'payment_method', 
            header: 'طريقة الدفع', 
            cell: (row) => (
                <span className="bg-surface-container-high text-on-surface-variant px-2.5 py-1 rounded-md font-caption text-xs uppercase flex w-max gap-1 items-center">
                    <span className="material-symbols-outlined text-[14px]">account_balance_wallet</span> {row.payment_method || 'N/A'}
                </span>
            )
        },
        { 
            key: 'reference_number', 
            header: 'المرجع', 
            cell: (row) => (
                <span className="font-mono text-xs font-bold text-on-surface-variant bg-surface-container px-2 py-1 rounded border border-outline-variant">
                    #{row.reference_number || '---'}
                </span>
            )
        },
        { 
            key: 'amount', 
            header: 'المبلغ', 
            cell: (row) => (
                <span className="font-body-md text-base font-bold text-primary tracking-tighter">
                    ${parseFloat(row.amount || 0).toFixed(2)}
                </span>
            )
        },
        { 
            key: 'status', 
            header: 'الحالة', 
            cell: (row) => {
                if (row.status === 'completed') return (
                    <span className="bg-secondary-container/20 border border-secondary text-secondary font-label-md text-[11px] px-2.5 py-1 rounded-full flex items-center gap-1.5 w-max shadow-sm">
                        <span className="material-symbols-outlined text-[14px]">check_circle</span> معتمدة
                    </span>
                );
                if (row.status === 'rejected') return (
                    <span className="bg-error-container border border-error/50 text-error font-label-md text-[11px] px-2.5 py-1 rounded-full flex items-center gap-1.5 w-max shadow-sm">
                        <span className="material-symbols-outlined text-[14px]">cancel</span> مرفوضة
                    </span>
                );
                return (
                    <span className="bg-surface-container-high border border-outline-variant text-on-surface-variant font-label-md text-[11px] px-2.5 py-1 rounded-full flex items-center gap-1.5 w-max shadow-sm">
                        <span className="material-symbols-outlined text-[14px]">schedule</span> قيد المراجعة
                    </span>
                );
            }
        },
        {
            key: 'actions',
            header: 'إجراءات',
            cell: (row) => {
                if (row.transaction_type === 'payout_requested' && row.status === 'pending') {
                    return (
                        <button 
                            onClick={() => setReviewModalData(row)}
                            className="bg-primary/10 text-primary hover:bg-primary/20 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors shadow-sm"
                        >
                            مراجعة الطلب
                        </button>
                    );
                }
                return null;
            }
        }
    ];

    // Show full page loader only on initial load when there's no data at all
    if (isLoading && !ledgerData) return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-center flex-1 w-full py-20" dir="rtl">
            <DynamicPageLoader 
                messages={[
                    "جاري مزامنة الإيرادات المالية...", 
                    "يتم تدقيق المعاملات من قاعدة البيانات...",
                    "يتم سحب السجلات المحاسبية..."
                ]}
                icon="payments"
            />
        </motion.div>
    );

    return (
        <div className="w-full font-[IBM_Plex_Sans_Arabic] pb-20" dir="rtl">
            <style>
                {`
                @media screen {
                    .print-area { display: none !important; }
                }
                @media print {
                    @page { size: A4; margin: 0; }
                    body * { visibility: hidden; }
                    .print-area, .print-area * { visibility: visible !important; }
                    .print-area {
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 100%;
                        display: flex !important;
                        background-color: white !important;
                        margin: 0 !important;
                        padding: 0 !important;
                    }
                    * {
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                        color-adjust: exact !important;
                    }
                    .hide-on-print {
                        display: none !important;
                    }
                }
                `}
            </style>
            {/* Page Header */}
            <div className="mb-lg flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-lg bg-surface-container-high flex items-center justify-center">
                            <span className="material-symbols-outlined text-primary text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>account_balance_wallet</span>
                        </div>
                        <h1 className="font-headline-lg text-headline-lg md:text-display-lg text-on-surface">دفتر الأستاذ المالي</h1>
                    </div>
                    <p className="font-body-md text-body-md text-on-surface-variant">نظرة تنفيذية آنية للتدفقات النقدية والعمليات المالية مع سجلات المحاسبة الدقيقة.</p>
                </div>
                <div>
                    <button 
                        onClick={() => setIsAddModalOpen(true)}
                        className="bg-primary text-on-primary px-6 py-2.5 rounded-lg font-label-md text-label-md hover:bg-primary-fixed-variant transition-colors shadow-sm flex items-center gap-2">
                        <span className="material-symbols-outlined text-[20px]">add</span>
                        إضافة معاملة
                    </button>
                </div>
            </div>

            {/* Dashboard Bento Grid */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-lg mb-lg">
                {/* Primary Revenue Card */}
                <div className="md:col-span-6 lg:col-span-6 rounded-2xl text-white p-lg shadow-md relative overflow-hidden flex flex-col justify-between min-h-[200px]" style={{ background: 'linear-gradient(135deg, #004ac6 0%, #00174b 100%)' }}>
                    <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '24px 24px' }}></div>
                    <div className="relative z-10 flex justify-between items-start">
                        <h3 className="font-title-lg text-title-lg text-inverse-primary opacity-90 flex items-center gap-2">
                            <span className="material-symbols-outlined font-normal">account_balance</span>
                            أرباح المنصة الصافية
                        </h3>
                        <span className="material-symbols-outlined text-3xl opacity-50 font-normal">trending_up</span>
                    </div>
                    <div className="relative z-10 mt-6">
                        <div className="font-display-lg text-display-lg font-bold tracking-tight mb-4">
                            {isAmountVisible ? `$${parseFloat(platformProfit).toFixed(2)}` : '****'}
                        </div>
                        <button 
                            onClick={() => setIsAmountVisible(!isAmountVisible)}
                            className="bg-white/10 hover:bg-white/20 text-white w-10 h-10 rounded-lg backdrop-blur-sm transition-all border border-white/20 flex items-center justify-center"
                            title={isAmountVisible ? 'إخفاء الرصيد' : 'إظهار الرصيد'}
                        >
                            <span className="material-symbols-outlined text-[20px]">
                                {isAmountVisible ? 'visibility_off' : 'visibility'}
                            </span>
                        </button>
                    </div>
                </div>

                {/* Secondary Metrics Group */}
                <div className="md:col-span-6 lg:col-span-6 grid grid-cols-1 sm:grid-cols-3 gap-md">
                    {/* Total Cash Flow */}
                    <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-lg flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow">
                        <div className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center mb-4">
                            <span className="material-symbols-outlined text-primary font-normal">payments</span>
                        </div>
                        <div>
                            <p className="font-label-md text-label-md text-on-surface-variant mb-1">إجمالي التدفق النقدي</p>
                            <p className="font-headline-lg text-headline-lg text-on-surface">${parseFloat(totalCashFlow).toFixed(2)}</p>
                        </div>
                    </div>

                    {/* Owners Liabilities */}
                    <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-lg flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow">
                        <div className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center mb-4 text-warning">
                            <span className="material-symbols-outlined font-normal">group</span>
                        </div>
                        <div>
                            <p className="font-label-md text-label-md text-on-surface-variant mb-1">مستحقات الملاك</p>
                            <p className="font-headline-lg text-headline-lg text-on-surface">${parseFloat(ownersLiabilities).toFixed(2)}</p>
                        </div>
                    </div>

                    {/* Under Review */}
                    <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-lg flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
                        <div className="w-10 h-10 rounded-full bg-error-container flex items-center justify-center mb-4">
                            <span className="material-symbols-outlined text-error font-normal">schedule</span>
                        </div>
                        <div>
                            <p className="font-label-md text-label-md text-on-surface-variant mb-1">طلبات قيد المراجعة</p>
                            <p className="font-headline-lg text-headline-lg text-on-surface">{pendingTransactions}</p>
                        </div>
                        <div className="absolute bottom-0 left-0 w-full h-1 bg-error opacity-20"></div>
                    </div>
                </div>
            </div>

            {/* Main Financial Log Card */}
            <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl shadow-sm overflow-hidden flex flex-col flex-1 min-h-[400px]">
                {/* Card Header & Filters */}
                <div className="px-lg py-md border-b border-outline-variant flex flex-col md:flex-row justify-between items-start md:items-center bg-surface gap-4">
                    <h2 className="font-title-lg text-title-lg text-on-surface flex items-center gap-2 shrink-0">
                        <span className="material-symbols-outlined text-primary font-normal">monitoring</span>
                        السجل المالي {activeFilter !== 'all' && <span className="bg-primary/10 text-primary text-xs px-2 py-0.5 rounded-md mx-2">{activeFilter === 'completed' ? 'الناجحة' : activeFilter === 'pending' ? 'المعلقة' : 'المرفوضة'}</span>}
                    </h2>
                    
                    <div className="flex flex-wrap items-center gap-3 w-full md:w-auto hide-on-print">
                        <div className="flex items-center gap-2 bg-surface-container-low rounded-lg p-1 border border-outline-variant">
                            <input 
                                type="date" 
                                value={dateFilters.start_date}
                                onChange={e => setDateFilters(prev => ({ ...prev, start_date: e.target.value }))}
                                className="bg-transparent border-none text-sm font-bold text-on-surface outline-none px-2 py-1"
                                title="من تاريخ"
                            />
                            <span className="text-on-surface-variant">-</span>
                            <input 
                                type="date" 
                                value={dateFilters.end_date}
                                onChange={e => setDateFilters(prev => ({ ...prev, end_date: e.target.value }))}
                                className="bg-transparent border-none text-sm font-bold text-on-surface outline-none px-2 py-1"
                                title="إلى تاريخ"
                            />
                            {(dateFilters.start_date || dateFilters.end_date) && (
                                <button 
                                    onClick={() => setDateFilters({ start_date: '', end_date: '' })}
                                    className="p-1 text-error hover:bg-error-container rounded transition-colors"
                                    title="مسح التاريخ"
                                >
                                    <span className="material-symbols-outlined text-[16px]">close</span>
                                </button>
                            )}
                        </div>
                        
                        <div className="flex gap-2 shrink-0">
                        <button 
                            onClick={() => setIsFilterModalOpen(true)}
                            className="p-2 text-on-surface-variant hover:bg-surface-container rounded-lg transition-colors border border-outline-variant flex items-center justify-center" title="فلترة المعاملات">
                            <span className="material-symbols-outlined text-[20px]">filter_list</span>
                        </button>
                        <button 
                            onClick={handleExportCSV}
                            className="p-2 text-on-surface-variant hover:bg-surface-container rounded-lg transition-colors border border-outline-variant flex items-center justify-center" title="تصدير بصيغة CSV">
                            <span className="material-symbols-outlined text-[20px]">download</span>
                        </button>
                        <button 
                            onClick={handlePrintPlatformReport}
                            className="p-2 text-white bg-[#1c5b8e] hover:bg-[#14355d] rounded-lg transition-colors border border-[#1c5b8e] flex items-center justify-center shadow-sm" title="طباعة تقرير أرباح المنصة">
                            <span className="material-symbols-outlined text-[20px]">print</span>
                        </button>
                        <button 
                            onClick={() => setIsArchiveModalOpen(true)}
                            className="p-2 text-error hover:bg-error-container rounded-lg transition-colors border border-error/30 flex items-center justify-center" title="مسح وأرشفة السجلات">
                            <span className="material-symbols-outlined text-[20px]">delete_sweep</span>
                        </button>
                    </div>
                    </div>
                </div>

                {filteredTransactions.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center p-2xl text-center bg-surface-bright">
                        <div className="w-24 h-24 bg-surface-container rounded-full flex items-center justify-center mb-6 shadow-inner">
                            <span className="material-symbols-outlined text-5xl text-outline font-normal">receipt_long</span>
                        </div>
                        <h3 className="font-headline-md text-headline-md text-on-surface mb-2">السجل المحاسبي فارغ حالياً</h3>
                        <p className="font-body-md text-body-md text-on-surface-variant mb-6 w-full text-center" style={{ maxWidth: '400px' }}>
                            لم يتم تسجيل أي تعاملات المحددة في النظام حتى هذه اللحظة. عندما تتم الحركات، ستظهر تفاصيلها هنا في الجداول.
                        </p>
                        <button 
                            onClick={() => setIsAddModalOpen(true)}
                            className="bg-primary-container text-on-primary-container px-6 py-2.5 rounded-lg font-label-md text-label-md hover:bg-primary hover:text-white transition-colors flex items-center gap-2">
                            <span className="material-symbols-outlined text-[18px]">add_box</span>
                            تسجيل معاملة
                        </button>
                    </div>
                ) : (
                    <div className="p-4 [&>div]:!shadow-none [&>div]:!p-0 [&_table]:!border-0">
                        <DataTable 
                            columns={columns} 
                            data={filteredTransactions} 
                            loading={isFetching} 
                        />
                    </div>
                )}
            </div>

            {/* Filter Modal */}
            <Modal isOpen={isFilterModalOpen} onClose={() => setIsFilterModalOpen(false)} title="تصفية السجل المالي">
                <div className="space-y-4" dir="rtl">
                    <p className="font-body-sm text-body-sm text-on-surface-variant">اختر نوع التصنيف الذي ترغب بعرضه في دفتر الأستاذ:</p>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <button 
                            onClick={() => { setActiveFilter('all'); setIsFilterModalOpen(false); }}
                            className={`p-3 rounded-xl border flex items-center gap-2 transition-all ${activeFilter === 'all' ? 'bg-primary/5 border-primary text-primary font-bold' : 'bg-surface border-outline-variant text-on-surface hover:bg-surface-container-high'}`}
                        >
                            <span className="material-symbols-outlined">receipt_long</span>
                            عرض كل المعاملات
                        </button>
                        
                        <button 
                            onClick={() => { setActiveFilter('completed'); setIsFilterModalOpen(false); }}
                            className={`p-3 rounded-xl border flex items-center gap-2 transition-all ${activeFilter === 'completed' ? 'bg-secondary/5 border-secondary text-secondary font-bold' : 'bg-surface border-outline-variant text-on-surface hover:bg-surface-container-high'}`}
                        >
                            <span className="material-symbols-outlined">check_circle</span>
                            الإيرادات المعتمدة فقط
                        </button>

                        <button 
                            onClick={() => { setActiveFilter('pending'); setIsFilterModalOpen(false); }}
                            className={`p-3 rounded-xl border flex items-center gap-2 transition-all ${activeFilter === 'pending' ? 'bg-primary/5 border-primary text-primary font-bold' : 'bg-surface border-outline-variant text-on-surface hover:bg-surface-container-high'}`}
                        >
                            <span className="material-symbols-outlined">schedule</span>
                            العمليات قيد المراجعة
                        </button>

                        <button 
                            onClick={() => { setActiveFilter('rejected'); setIsFilterModalOpen(false); }}
                            className={`p-3 rounded-xl border flex items-center gap-2 transition-all ${activeFilter === 'rejected' ? 'bg-error/5 border-error text-error font-bold' : 'bg-surface border-outline-variant text-on-surface hover:bg-surface-container-high'}`}
                        >
                            <span className="material-symbols-outlined">cancel</span>
                            العمليات المرفوضة
                        </button>
                    </div>

                    <div className="pt-4 mt-2 mb-1 border-t border-outline-variant/60">
                        <button 
                            onClick={() => setIsFilterModalOpen(false)}
                            className="w-full bg-surface border border-outline-variant text-on-surface hover:bg-surface-container font-label-md text-label-md py-3 rounded-xl transition-colors shadow-sm"
                        >
                            إغلاق النافذة
                        </button>
                    </div>
                </div>
            </Modal>

            {/* Add Transaction Modal */}
            <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="تسجيل بيانات معاملة مالية">
                <form onSubmit={handleSubmit} className="space-y-5" dir="rtl">
                    <div className="bg-primary-container/20 border border-primary/20 p-4 rounded-xl flex items-start gap-3">
                        <span className="material-symbols-outlined text-primary mt-0.5">info</span>
                        <div>
                            <h4 className="font-label-md text-label-md text-primary mb-1">تسجيل يدوي للأرصدة</h4>
                            <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">استخدم هذا المربع لإضافة العمليات المالية الخارجية (تحويلات بنكية، كاش) التي تمت خارج بوابة الدفع الآلية ليتم إدراجها بالدفتر.</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="space-y-1.5">
                            <label className="font-label-md text-label-md text-on-surface">إجمالي المبلغ المقبوض ($) <span className="text-error">*</span></label>
                            <div className="relative">
                                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant font-bold">$</span>
                                <input 
                                    type="number" 
                                    step="0.01"
                                    min="1"
                                    required
                                    value={formData.amount}
                                    onChange={(e) => setFormData({...formData, amount: e.target.value})}
                                    className="w-full bg-surface border border-outline-variant rounded-xl py-3 pl-4 pr-10 font-body-lg text-body-lg text-on-background focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                                    placeholder="مثال: 500.00"
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="font-label-md text-label-md text-on-surface">رقم المرجع (رقم الحوالة/الإيصال) <span className="text-error">*</span></label>
                            <input 
                                type="text" 
                                required
                                value={formData.reference_number}
                                onChange={(e) => setFormData({...formData, reference_number: e.target.value})}
                                className="w-full bg-surface border border-outline-variant rounded-xl py-3 px-4 font-body-md text-body-md text-on-background placeholder-outline focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                                placeholder="مثال: TRX-9821102"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="font-label-md text-label-md text-on-surface">وسيلة الدفع <span className="text-error">*</span></label>
                            <div className="relative">
                                <select 
                                    required
                                    value={formData.payment_method}
                                    onChange={(e) => setFormData({...formData, payment_method: e.target.value})}
                                    className="w-full appearance-none bg-surface border border-outline-variant rounded-xl py-3 pr-4 pl-10 font-body-md text-body-md text-on-background focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all cursor-pointer"
                                >
                                    <option value="bank_transfer">تحويل بنكي (Bank Transfer)</option>
                                    <option value="cash">نقداً (Cash)</option>
                                    <option value="credit">رصيد دائن (Credit Note)</option>
                                </select>
                                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none">expand_content</span>
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 mt-2 border-t border-outline-variant/60 flex items-center justify-end gap-3">
                        <button 
                            type="button" 
                            onClick={() => setIsAddModalOpen(false)}
                            className="px-5 py-2.5 rounded-xl font-label-md text-label-md border border-outline-variant text-on-surface hover:bg-surface-container transition-colors"
                        >
                            تراجع
                        </button>
                        <button 
                            type="submit" 
                            disabled={isSubmitting}
                            className={`px-6 py-2.5 rounded-xl font-label-md text-label-md text-on-primary transition-all shadow-sm flex items-center gap-2 ${isSubmitting ? 'bg-primary/70 cursor-not-allowed' : 'bg-primary hover:bg-primary-fixed-variant'}`}
                        >
                            {isSubmitting ? 'جاري التسجيل...' : 'اعتماد وحفظ المعاملة'}
                            {!isSubmitting && <span className="material-symbols-outlined text-[18px]">save</span>}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Review Payout Modal */}
            <Modal isOpen={!!reviewModalData} onClose={() => setReviewModalData(null)} title="مراجعة طلب سحب أرباح">
                {reviewModalData && (
                    <div className="space-y-6" dir="rtl">
                        <div className="bg-surface-container border border-outline-variant rounded-xl p-4 space-y-3">
                            <h3 className="font-bold text-lg text-on-surface mb-2">بيانات طلب السحب</h3>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <p className="text-on-surface-variant mb-1">اسم المالك المستفيد</p>
                                    <p className="font-bold text-on-surface">{reviewModalData.user?.full_name || 'غير معروف'}</p>
                                </div>
                                <div>
                                    <p className="text-on-surface-variant mb-1">المبلغ المطلوب</p>
                                    <p className="font-bold text-primary text-lg">${parseFloat(reviewModalData.amount || 0).toFixed(2)}</p>
                                </div>
                                {(() => {
                                    try {
                                        const notes = JSON.parse(reviewModalData.notes || '{}');
                                        return (
                                            <>
                                                <div>
                                                    <p className="text-on-surface-variant mb-1">اسم البنك</p>
                                                    <p className="font-bold text-on-surface">{notes.bank_name || 'غير محدد'}</p>
                                                </div>
                                                <div>
                                                    <p className="text-on-surface-variant mb-1">رقم الحساب</p>
                                                    <p className="font-mono font-bold text-on-surface bg-surface px-2 py-1 rounded inline-block">{notes.account_number || 'غير محدد'}</p>
                                                </div>
                                            </>
                                        );
                                    } catch(e) { return null; }
                                })()}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Approve Section */}
                            <form onSubmit={handleApprovePayout} className="border border-green-200 bg-green-50/30 p-4 rounded-xl flex flex-col justify-between">
                                <div>
                                    <h4 className="font-bold text-green-700 flex items-center gap-2 mb-3">
                                        <span className="material-symbols-outlined">check_circle</span>
                                        اعتماد السحب
                                    </h4>
                                    <p className="text-xs text-green-800 mb-3 leading-relaxed">
                                        قم بتحويل المبلغ للحساب المذكور، ثم أدخل رقم الحوالة هنا للتوثيق والاعتماد. سيتم خصم المبلغ من خزينة المنصة.
                                    </p>
                                    <input 
                                        type="text" 
                                        placeholder="رقم الحوالة المرجعي *"
                                        required
                                        value={reviewForm.reference_number}
                                        onChange={(e) => setReviewForm({...reviewForm, reference_number: e.target.value})}
                                        className="w-full bg-white border border-green-300 rounded-lg py-2.5 px-3 font-body-sm text-on-surface mb-4 focus:ring-1 focus:ring-green-500 outline-none"
                                    />
                                </div>
                                <button 
                                    type="submit" 
                                    disabled={isApproving}
                                    className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    {isApproving ? 'جاري الاعتماد...' : 'اعتماد السحب'}
                                </button>
                            </form>

                            {/* Reject Section */}
                            <form onSubmit={handleRejectPayout} className="border border-red-200 bg-red-50/30 p-4 rounded-xl flex flex-col justify-between">
                                <div>
                                    <h4 className="font-bold text-red-700 flex items-center gap-2 mb-3">
                                        <span className="material-symbols-outlined">cancel</span>
                                        رفض السحب
                                    </h4>
                                    <p className="text-xs text-red-800 mb-3 leading-relaxed">
                                        في حال وجود مشكلة في بيانات الحساب البنكي، أدخل سبب الرفض هنا. سيتم إرجاع المبلغ لمحفظة المالك.
                                    </p>
                                    <textarea 
                                        placeholder="سبب الرفض *"
                                        required
                                        value={reviewForm.reason}
                                        onChange={(e) => setReviewForm({...reviewForm, reason: e.target.value})}
                                        className="w-full bg-white border border-red-300 rounded-lg py-2.5 px-3 font-body-sm text-on-surface mb-4 focus:ring-1 focus:ring-red-500 outline-none resize-none h-20"
                                    />
                                </div>
                                <button 
                                    type="submit" 
                                    disabled={isRejecting}
                                    className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    {isRejecting ? 'جاري الرفض...' : 'رفض السحب'}
                                </button>
                            </form>
                        </div>
                    </div>
                )}
            </Modal>

            {/* ── PRINTABLE PLATFORM REPORT TEMPLATE ── */}
            <div className="print-area bg-white overflow-hidden font-sans" dir="rtl" style={{ minHeight: '100vh', flexDirection: 'column' }}>
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
                        <h1 className="text-5xl font-black tracking-tight" style={{ color: '#ffffff' }}>أرباح المنصة</h1>
                    </div>
                </div>

                {/* Metadata Section */}
                <div className="flex justify-between items-start px-16 py-10">
                    <div className="flex-1 text-right space-y-2">
                        <p className="text-xl font-bold text-gray-800">تقرير صادر إلى:</p>
                        <h2 className="text-3xl font-black text-gray-900">إدارة المنصة (SabaPost)</h2>
                        <p className="text-gray-600 font-medium">مُصدر تقارير معتمد</p>
                    </div>
                    
                    <div className="flex-1 flex justify-end" dir="rtl">
                        <div className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-3 text-right">
                            <span className="font-bold text-gray-900">الفترة الزمنية:</span>
                            <span className="text-gray-700" dir="ltr">{dateFilters.start_date || '-'} / {dateFilters.end_date || '-'}</span>

                            <span className="font-bold text-gray-900">تاريخ الإصدار:</span>
                            <span className="text-gray-700">{new Date().toLocaleDateString('ar-SA')}</span>
                        </div>
                    </div>
                </div>

                {/* Table */}
                <div className="px-16 flex-1 mb-10">
                    <table className="w-full text-right text-sm border-collapse">
                        <thead className="bg-[#1c5b8e] text-white font-bold text-lg">
                            <tr>
                                <th className="py-4 px-4 text-center w-16">رقم</th>
                                <th className="py-4 px-4">التاريخ</th>
                                <th className="py-4 px-4">نوع الإيراد</th>
                                <th className="py-4 px-4">البيان (رقم الإعلان / الشاشة)</th>
                                <th className="py-4 px-4 text-left">قيمة العمولة (الربح)</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 border-b-2 border-[#1c5b8e]">
                            {platformTransactions.map((trx, idx) => (
                                <tr key={trx.ledger_id} className={idx % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                                    <td className="py-4 px-4 text-center font-bold text-gray-700">{String(idx + 1).padStart(2, '0')}</td>
                                    <td className="py-4 px-4 text-gray-700">{new Date(trx.created_at).toLocaleString('ar-EG')}</td>
                                    <td className="py-4 px-4 font-bold text-gray-900">عمولة منصة</td>
                                    <td className="py-4 px-4 text-gray-600">
                                        إعلان: {trx.advertisement?.title || 'غير محدد'} | شاشة: {trx.screen?.screen_name || 'غير محدد'}
                                    </td>
                                    <td className="py-4 px-4 text-left font-bold text-green-600" dir="ltr">
                                        +${parseFloat(trx.amount).toFixed(2)}
                                    </td>
                                </tr>
                            ))}
                            {platformTransactions.length === 0 && (
                                <tr>
                                    <td colSpan="5" className="py-8 text-center text-gray-500 font-medium">لا توجد أرباح مسجلة للمنصة حتى الآن</td>
                                </tr>
                            )}
                        </tbody>
                    </table>

                    {/* Totals Section */}
                    <div className="flex justify-end mt-6">
                        <div className="w-1/3">
                            <div className="flex justify-between py-3 px-4 bg-[#1c5b8e] text-white rounded-b-lg mt-1">
                                <span className="font-bold text-lg">إجمالي أرباح المنصة الصافية</span>
                                <span className="font-bold text-lg">${parseFloat(totalPlatformProfit).toFixed(2)}</span>
                            </div>
                        </div>
                    </div>
                    
                    {/* Conditions and Info */}
                    <div className="mt-16 grid grid-cols-2 gap-8 items-end w-full">
                        <div className="text-right">
                            <h4 className="font-bold text-gray-900 text-lg mb-2">معلومات إضافية:</h4>
                            <p className="text-gray-600 text-sm leading-relaxed">
                                هذا التقرير يمثل العوائد الصافية للمنصة المستقطعة من الحملات الإعلانية كعمولة تشغيل بناءً على نسبة العمولة المحددة في إعدادات النظام. التقرير آلي ولا يحتاج إلى توقيع.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Archive Modal */}
                <Modal isOpen={isArchiveModalOpen} onClose={() => setIsArchiveModalOpen(false)} title="تنظيف وأرشفة السجلات">
                    <div className="space-y-4" dir="rtl">
                        <div className="bg-warning-container text-on-warning-container p-4 rounded-xl flex items-start gap-3">
                            <span className="material-symbols-outlined shrink-0">warning</span>
                            <div className="text-sm">
                                <p className="font-bold mb-1">تنبيه هام جداً</p>
                                <p>هذه العملية ستقوم بـ:</p>
                                <ul className="list-disc list-inside mt-2 space-y-1">
                                    <li>إنشاء ملف Excel (CSV) كنسخة احتياطية وتنزيله لك.</li>
                                    <li>مسح جميع تفاصيل المعاملات القديمة نهائياً.</li>
                                    <li>استبدالها برصيد إجمالي مجمّع (رصيد مرحل) للحفاظ على المجاميع الكلية دون خلل.</li>
                                </ul>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-on-surface mb-2">اختر مدة السجلات المراد مسحها وأرشفتها</label>
                            <select 
                                value={archiveMonths}
                                onChange={(e) => setArchiveMonths(e.target.value)}
                                className="w-full bg-surface-container-highest border border-outline-variant rounded-xl p-3 outline-none"
                            >
                                <option value="3">السجلات الأقدم من 3 أشهر</option>
                                <option value="6">السجلات الأقدم من 6 أشهر</option>
                                <option value="12">السجلات الأقدم من سنة كاملة</option>
                                <option value="24">السجلات الأقدم من سنتين</option>
                            </select>
                        </div>

                        <div className="flex gap-3 pt-4 border-t border-outline-variant">
                            <button 
                                onClick={handleArchive}
                                disabled={isArchiving}
                                className="flex-1 bg-error text-white py-2.5 rounded-xl font-bold hover:bg-error/90 transition-colors flex justify-center items-center gap-2 disabled:opacity-70"
                            >
                                {isArchiving ? (
                                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                                ) : (
                                    <span className="material-symbols-outlined text-[20px]">delete_sweep</span>
                                )}
                                أرشفة ومسح الآن
                            </button>
                            <button 
                                onClick={() => setIsArchiveModalOpen(false)}
                                className="flex-1 bg-surface-container-high text-on-surface py-2.5 rounded-xl font-bold hover:bg-surface-container-highest transition-colors"
                            >
                                إلغاء
                            </button>
                        </div>
                    </div>
                </Modal>

                {/* Footer Bar */}
                <div className="w-full bg-[#14355d] text-white py-4 px-16 flex justify-between items-center mt-auto">
                    <div className="flex items-center gap-2">
                        <span>🌐</span>
                        <span dir="ltr">www.sabapost.com.sa</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FinancialPage;
