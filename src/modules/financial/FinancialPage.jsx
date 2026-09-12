import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import axiosClient from '../../core/api/axiosClient';
import { ENDPOINTS } from '../../core/api/endpoints';
import DataTable from '../../shared/components/DataTable';
import DynamicPageLoader from '../../shared/components/DynamicPageLoader';
import Modal from '../../shared/components/Modal';
import { useQueryClient } from '@tanstack/react-query';
import echo from '../../core/api/echo';
import { useLedger, useRecordPayment, useApprovePayout, useRejectPayout, useArchiveLedger, useApprovePayment, useRejectPayment } from '../../hooks/api/useFinancial';
import useTranslation from '../../i18n/useTranslation';

const FinancialPage = () => {
    const { t, dir } = useTranslation();
    const queryClient = useQueryClient();
    const [dateFilters, setDateFilters] = useState({ start_date: '', end_date: '' });
    const { data: ledgerData, isLoading, isFetching } = useLedger(dateFilters);
    const { mutateAsync: recordPayment } = useRecordPayment();
    const { mutateAsync: approvePayout, isPending: isApproving } = useApprovePayout();
    const { mutateAsync: rejectPayout, isPending: isRejecting } = useRejectPayout();
    const { mutateAsync: approvePayment, isPending: isApprovingPayment } = useApprovePayment();
    const { mutateAsync: rejectPayment, isPending: isRejectingPayment } = useRejectPayment();

    const data = ledgerData || { total_payments: 0, transactions: [] };
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
    const [reviewModalData, setReviewModalData] = useState(null);
    const [reviewForm, setReviewForm] = useState({ reference_number: '', reason: '' });
    const [activeFilter, setActiveFilter] = useState('all'); // 'all', 'completed', 'pending', 'rejected'
    const [formData, setFormData] = useState({ amount: '', reference_number: '', payment_method: 'bank_transfer' });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isAmountVisible, setIsAmountVisible] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

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
        if (!reviewForm.reference_number) return alert(t('financial.please_enter_ref_number'));
        try {
            if (reviewModalData.transaction_type === 'payment_pending') {
                await approvePayment({ id: reviewModalData.ledger_id, payload: { reference_number: reviewForm.reference_number } });
            } else {
                await approvePayout({ id: reviewModalData.ledger_id, reference_number: reviewForm.reference_number });
            }
            setReviewModalData(null);
            setReviewForm({ reference_number: '', reason: '' });
        } catch (error) {}
    };

    const handleRejectPayout = async (e) => {
        e.preventDefault();
        if (!reviewForm.reason) return alert(t('financial.please_enter_reject_reason'));
        try {
            if (reviewModalData.transaction_type === 'payment_pending') {
                await rejectPayment({ id: reviewModalData.ledger_id, payload: { reason: reviewForm.reason } });
            } else {
                await rejectPayout({ id: reviewModalData.ledger_id, reason: reviewForm.reason });
            }
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
        const headers = [t('common.date'), t('common.advertiser'), t('financial.payment method'), t('financial.reference'), t('financial.amount usd'), t('common.status')];
        
        let csvContent = "";
        
        if (transactionsList.length === 0) {
            alert(t('financial.ledger empty export alert'));
        }

        const csvRows = transactionsList.map(t => {
            const date = new Date(t.created_at).toLocaleDateString('ar-EG');
            const user = t.user?.full_name || t('common.unknown');
            const method = t.payment_method || 'N/A';
            const ref = t.reference_number || '-';
            const amount = parseFloat(t.amount || 0).toFixed(2);
            const status = t.status === 'completed' ? t('common.approved') : t.status === 'rejected' ? t('common.rejected') : t('common.under_review');
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

    const rawTransactions = Array.isArray(data.transactions) ? data.transactions : Object.values(data.transactions || {});
    const transactions = rawTransactions.filter(t => t && typeof t === 'object' && Object.keys(t).length > 0 && t.created_at);
    const filteredTransactions = transactions.filter(t => {
        const matchesFilter = activeFilter === 'all' || t.status === activeFilter;
        if (!matchesFilter) return false;
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        const userName = t.user?.full_name?.toLowerCase() || '';
        const ref = t.reference_number?.toLowerCase() || '';
        const amount = String(t.amount || '');
        const method = t.payment_method?.toLowerCase() || '';
        return userName.includes(q) || ref.includes(q) || amount.includes(q) || method.includes(q);
    });
    
    // Financial Metrics
    const platformProfit = data.platform_profit || 0;
    const ownersLiabilities = data.owners_liabilities || 0;
    const totalCashFlow = data.total_payments || 0;
    const pendingTransactions = transactions.filter(t => t.status === 'pending').length;

    const columns = [
        { 
            key: 'created_at', 
            header: t('common.date'), 
            cell: (row) => (
                <div className="flex flex-col items-center justify-center">
                    <span className="font-extrabold text-base md:text-lg text-on-surface" dir="ltr">
                        {new Date(row.created_at).toLocaleDateString('ar-EG', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </span>
                    <span className="font-bold text-xs text-on-surface-variant mt-0.5" dir="ltr">
                        {new Date(row.created_at).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                </div>
            )
        },
        { 
            key: 'user.full_name', 
            header: t('common.advertiser'), 
            cell: (row) => (
                <div className="flex items-center justify-center py-1">
                    <span className="font-extrabold text-base md:text-lg text-on-surface">{row.user?.full_name || '—'}</span>
                </div>
            )
        },
        {
            key: 'transaction_type',
            header: t('financial.transaction_type') || 'نوع العملية',
            cell: (row) => {
                let label = row.transaction_type;
                switch (row.transaction_type) {
                    case 'payment':
                    case 'payment_in':
                        label = 'دفع إعلان';
                        break;
                    case 'payment_pending':
                        label = 'مراجعة دفعة';
                        break;
                    case 'platform_fee':
                        label = 'عمولة منصة';
                        break;
                    case 'payout_pending':
                        label = 'أرباح مستحقة';
                        break;
                    case 'payout_requested':
                        label = 'طلب سحب';
                        break;
                    case 'platform_payout_deduction':
                        label = 'صرف أرباح';
                        break;
                }
                
                return (
                    <div className="flex flex-col items-center justify-center gap-0.5">
                        <span className="font-extrabold text-base md:text-lg text-on-surface whitespace-nowrap">
                            {label}
                        </span>
                        {row.advertisement?.title && (
                            <span className="text-xs font-semibold text-on-surface-variant max-w-[140px] truncate" title={row.advertisement.title}>
                                إعلان: {row.advertisement.title}
                            </span>
                        )}
                        {row.screen?.screen_name && (row.transaction_type === 'payout_pending' || row.transaction_type === 'platform_payout_deduction') && (
                            <span className="text-xs font-semibold text-on-surface-variant max-w-[140px] truncate" title={row.screen.screen_name}>
                                شاشة: {row.screen.screen_name}
                            </span>
                        )}
                    </div>
                );
            }
        },
        { 
            key: 'payment_method', 
            header: t('financial.payment_method'), 
            cell: (row) => (
                <span className="font-extrabold text-base md:text-lg text-on-surface uppercase">
                    {row.payment_method || 'N/A'}
                </span>
            )
        },
        { 
            key: 'reference_number', 
            header: t('financial.reference'), 
            cell: (row) => (
                <span className="font-mono text-base md:text-lg font-extrabold text-on-surface">
                    #{row.reference_number || '---'}
                </span>
            )
        },
        { 
            key: 'amount', 
            header: t('financial.amount'), 
            cell: (row) => (
                <span className="text-lg md:text-xl font-black text-on-surface tracking-tighter">
                    ${parseFloat(row.amount || 0).toFixed(2)}
                </span>
            )
        },
        { 
            key: 'status', 
            header: t('common.status'), 
            cell: (row) => {
                let statusText = t('common.under_review');
                if (row.status === 'completed') statusText = t('common.approved');
                if (row.status === 'rejected') statusText = t('common.rejected');

                return (
                    <span className="font-extrabold text-base md:text-lg text-on-surface">
                        {statusText}
                    </span>
                );
            }
        },
        {
            key: 'actions',
            header: t('common.actions'),
            cell: (row) => {
                if ((row.transaction_type === 'payout_requested' || row.transaction_type === 'payment_pending') && row.status === 'pending') {
                    return (
                        <button 
                            onClick={() => setReviewModalData(row)}
                            className="bg-primary/10 text-primary hover:bg-primary/20 px-4 py-2 rounded-xl text-sm font-extrabold transition-colors shadow-sm"
                        >
                            {t('financial.review request')}
                        </button>
                    );
                }
                return null;
            }
        }
    ];


    return (
        <div className="w-full font-[IBM_Plex_Sans_Arabic] pb-20" dir={dir}>
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
            <div className="mb-lg flex flex-col gap-4">
                <h1 className="text-3xl md:text-4xl font-extrabold text-on-surface text-center w-full">{t('financial.financial_ledger')}</h1>
                <button 
                    onClick={() => setIsAddModalOpen(true)}
                    className="w-full bg-primary text-on-primary py-4 rounded-xl text-lg font-extrabold hover:bg-primary-fixed-variant transition-all shadow-md flex items-center justify-center gap-3">
                    <span className="material-symbols-outlined text-[24px]">add</span>
                    {t('financial.add_transaction')}
                </button>
            </div>

            {/* Dashboard Bento Grid */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-lg mb-lg">
                {/* Primary Revenue Card */}
                <div className="md:col-span-6 lg:col-span-6 rounded-2xl text-white p-lg shadow-md relative overflow-hidden flex flex-col justify-between min-h-[200px]" style={{ background: 'linear-gradient(135deg, #004ac6 0%, #00174b 100%)' }}>
                    <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '24px 24px' }}></div>
                    <div className="relative z-10 flex justify-between items-start">
                        <h3 className="text-2xl font-extrabold text-inverse-primary opacity-90 flex items-center gap-2">
                            {t('financial.platform_net_profits')}
                        </h3>
                    </div>
                    <div className="relative z-10 mt-6">
                        <div className="text-xl font-bold tracking-tight mb-4">
                            {isAmountVisible ? `$${parseFloat(platformProfit).toFixed(2)}` : '****'}
                        </div>
                        <button 
                            onClick={() => setIsAmountVisible(!isAmountVisible)}
                            className="bg-white/10 hover:bg-white/20 text-white w-10 h-10 rounded-lg backdrop-blur-sm transition-all border border-white/20 flex items-center justify-center"
                            title={isAmountVisible ? t('financial.hide_balance') : t('financial.show_balance')}
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
                    <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-lg flex flex-col justify-center items-center text-center shadow-sm hover:shadow-md transition-shadow">
                        <div>
                            <p className="text-xl font-extrabold text-on-surface-variant mb-3">{t('financial.total_cash_flow')}</p>
                            <p className="text-base font-normal text-on-surface">${parseFloat(totalCashFlow).toFixed(2)}</p>
                        </div>
                    </div>

                    {/* Owners Liabilities */}
                    <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-lg flex flex-col justify-center items-center text-center shadow-sm hover:shadow-md transition-shadow">
                        <div>
                            <p className="text-xl font-extrabold text-on-surface-variant mb-3">{t('financial.owners_liabilities')}</p>
                            <p className="text-base font-normal text-on-surface">${parseFloat(ownersLiabilities).toFixed(2)}</p>
                        </div>
                    </div>

                    {/* Under Review */}
                    <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-lg flex flex-col justify-center items-center text-center shadow-sm hover:shadow-md transition-shadow">
                        <div>
                            <p className="text-xl font-extrabold text-on-surface-variant mb-3">{t('financial.requests_under_review')}</p>
                            <p className="text-base font-normal text-on-surface">{pendingTransactions}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Financial Log Card */}
            <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl shadow-sm overflow-hidden flex flex-col flex-1 min-h-[400px]">
                {/* Card Header & Filters */}
                <div className="px-lg py-md border-b border-outline-variant flex flex-col bg-surface gap-4">
                    {/* Top Row: Title */}
                    <div className="flex justify-center items-center w-full text-center">
                        <h2 className="text-2xl md:text-3xl font-extrabold text-on-surface flex items-center justify-center gap-2">
                            {t('financial.financial_ledger')} {activeFilter !== 'all' && <span className="bg-primary/10 text-primary text-sm px-2.5 py-1 rounded-md mx-2 font-bold">{activeFilter === 'completed' ? t('common.approved') : activeFilter === 'pending' ? t('common.pending') : t('common.rejected')}</span>}
                        </h2>
                    </div>

                    {/* Bottom Row: Date Filters and Action Buttons */}
                    <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 w-full hide-on-print pt-2 border-t border-outline-variant/40">
                        {/* Date Filter */}
                        <div className="flex items-center gap-2 bg-surface-container-low rounded-xl px-3 py-1.5 border border-outline-variant text-sm font-bold text-on-surface">
                            <div className="flex items-center gap-1">
                                <span className="text-xs text-on-surface-variant font-medium">من:</span>
                                <input 
                                    type="date" 
                                    dir="ltr"
                                    value={dateFilters.start_date}
                                    onChange={e => setDateFilters(prev => ({ ...prev, start_date: e.target.value }))}
                                    className="bg-transparent border-none text-sm font-bold text-on-surface outline-none px-1 py-0.5 cursor-pointer"
                                    title={t('common.from_date')}
                                />
                            </div>
                            <span className="text-on-surface-variant/40 font-bold">|</span>
                            <div className="flex items-center gap-1">
                                <span className="text-xs text-on-surface-variant font-medium">إلى:</span>
                                <input 
                                    type="date" 
                                    dir="ltr"
                                    value={dateFilters.end_date}
                                    onChange={e => setDateFilters(prev => ({ ...prev, end_date: e.target.value }))}
                                    className="bg-transparent border-none text-sm font-bold text-on-surface outline-none px-1 py-0.5 cursor-pointer"
                                    title={t('common.to_date')}
                                />
                            </div>
                            {(dateFilters.start_date || dateFilters.end_date) && (
                                <button 
                                    onClick={() => setDateFilters({ start_date: '', end_date: '' })}
                                    className="p-1 text-error hover:bg-error-container rounded-lg transition-colors mr-1"
                                    title={t('common.clear_date')}
                                >
                                    <span className="material-symbols-outlined text-[16px]">close</span>
                                </button>
                            )}
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-wrap items-center gap-3">
                            <button 
                                onClick={() => setIsFilterModalOpen(true)}
                                className="px-4 py-2.5 text-on-surface-variant hover:bg-surface-container rounded-xl transition-colors border border-outline-variant flex items-center gap-2 text-base font-extrabold shadow-sm" title={t('financial.filter_transactions')}>
                                <span className="material-symbols-outlined text-[22px]">filter_list</span>
                                <span>تصفية</span>
                            </button>
                            <button 
                                onClick={handleExportCSV}
                                className="px-4 py-2.5 text-on-surface-variant hover:bg-surface-container rounded-xl transition-colors border border-outline-variant flex items-center gap-2 text-base font-extrabold shadow-sm" title={t('common.export_csv')}>
                                <span className="material-symbols-outlined text-[22px]">download</span>
                                <span>تصدير CSV</span>
                            </button>
                            <button 
                                onClick={handlePrintPlatformReport}
                                className="px-4 py-2.5 text-white bg-[#1c5b8e] hover:bg-[#14355d] rounded-xl transition-colors border border-[#1c5b8e] flex items-center gap-2 text-base font-extrabold shadow-sm" title={t('financial.print_profits_report')}>
                                <span className="material-symbols-outlined text-[22px]">print</span>
                                <span>طباعة التقرير</span>
                            </button>
                            <button 
                                onClick={() => setIsArchiveModalOpen(true)}
                                className="px-4 py-2.5 text-error hover:bg-error-container rounded-xl transition-colors border border-error/30 flex items-center gap-2 text-base font-extrabold shadow-sm" title={t('financial.clear_and_archive_records')}>
                                <span className="material-symbols-outlined text-[22px]">delete_sweep</span>
                                <span>أرشفة</span>
                            </button>
                        </div>
                    </div>

                    {/* Middle Row: Search Bar, Refresh & Analytics Buttons (Dedicated Row) */}
                    <div className="flex flex-col sm:flex-row items-center gap-3 w-full hide-on-print pt-2 border-t border-outline-variant/40">
                        {/* Search Input Container - Spans Full Available Width */}
                        <div className="relative flex-1 w-full">
                            <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[22px] pointer-events-none">
                                search
                            </span>
                            <input 
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="بحث في السجل المالي (اسم المعلن، رقم المرجع، المبلغ، طريقة الدفع)..."
                                className="w-full bg-surface-container-low border border-outline-variant rounded-xl py-2.5 pr-10 pl-10 text-base font-bold text-on-surface placeholder-on-surface-variant/70 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all shadow-sm"
                            />
                            {searchQuery && (
                                <button 
                                    onClick={() => setSearchQuery('')}
                                    className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-error transition-colors p-1"
                                    title="مسح البحث"
                                >
                                    <span className="material-symbols-outlined text-[18px]">close</span>
                                </button>
                            )}
                        </div>

                        {/* Refresh & Analytics Action Buttons Next to Search Input */}
                        <div className="flex items-center gap-3 shrink-0 w-full sm:w-auto">
                            <button 
                                onClick={() => queryClient.invalidateQueries({ queryKey: ['ledger'] })}
                                className="flex-1 sm:flex-none px-4 py-2.5 text-on-surface-variant hover:bg-surface-container rounded-xl transition-colors border border-outline-variant flex items-center justify-center gap-2 text-base font-extrabold shadow-sm"
                                title="تحديث البيانات"
                            >
                                <span className="material-symbols-outlined text-[22px]">refresh</span>
                                <span>تحديث</span>
                            </button>
                            <button 
                                onClick={() => setIsFilterModalOpen(true)}
                                className="flex-1 sm:flex-none px-4 py-2.5 text-primary bg-primary/10 hover:bg-primary/20 rounded-xl transition-colors border border-primary/20 flex items-center justify-center gap-2 text-base font-extrabold shadow-sm"
                                title="تحليل البيانات المالية"
                            >
                                <span className="material-symbols-outlined text-[22px]">analytics</span>
                                <span>التحليل</span>
                            </button>
                        </div>
                    </div>
                </div>

                {isLoading && !ledgerData ? (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-center flex-1 w-full py-20" dir={dir}>
                        <DynamicPageLoader 
                            messages={[
                                t('financial.syncing_revenues'), 
                                t('financial.verifying_transactions'),
                                t('financial.fetching_records')
                            ]}
                            icon="payments"
                        />
                    </motion.div>
                ) : filteredTransactions.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center p-2xl text-center bg-surface-bright">
                        <div className="w-24 h-24 bg-surface-container rounded-full flex items-center justify-center mb-6 shadow-inner">
                            <span className="material-symbols-outlined text-5xl text-outline font-normal">receipt_long</span>
                        </div>
                        <h3 className="font-headline-md text-headline-md text-on-surface mb-2">{t('financial.ledger_empty')}</h3>
                        <p className="font-body-md text-body-md text-on-surface-variant mb-6 w-full text-center" style={{ maxWidth: '400px' }}>
                            {t('financial.no_transactions_yet')}
                        </p>
                        <button 
                            onClick={() => setIsAddModalOpen(true)}
                            className="bg-primary-container text-on-primary-container px-6 py-2.5 rounded-lg font-label-md text-label-md hover:bg-primary hover:text-white transition-colors flex items-center gap-2">
                            <span className="material-symbols-outlined text-[18px]">add_box</span>
                            {t('financial.record_transaction')}
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
            <Modal isOpen={isFilterModalOpen} onClose={() => setIsFilterModalOpen(false)} title={t('financial.filter_financial_ledger')}>
                <div className="space-y-4" dir={dir}>
                    <p className="font-body-sm text-body-sm text-on-surface-variant">{t('financial.choose_classification')}</p>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <button 
                            onClick={() => { setActiveFilter('all'); setIsFilterModalOpen(false); }}
                            className={`p-3 rounded-xl border flex items-center gap-2 transition-all ${activeFilter === 'all' ? 'bg-primary/5 border-primary text-primary font-bold' : 'bg-surface border-outline-variant text-on-surface hover:bg-surface-container-high'}`}
                        >
                            <span className="material-symbols-outlined">receipt_long</span>
                            {t('financial.show_all_transactions')}
                        </button>
                        
                        <button 
                            onClick={() => { setActiveFilter('completed'); setIsFilterModalOpen(false); }}
                            className={`p-3 rounded-xl border flex items-center gap-2 transition-all ${activeFilter === 'completed' ? 'bg-secondary/5 border-secondary text-secondary font-bold' : 'bg-surface border-outline-variant text-on-surface hover:bg-surface-container-high'}`}
                        >
                            <span className="material-symbols-outlined">check_circle</span>
                            {t('financial.approved_revenues_only')}
                        </button>

                        <button 
                            onClick={() => { setActiveFilter('pending'); setIsFilterModalOpen(false); }}
                            className={`p-3 rounded-xl border flex items-center gap-2 transition-all ${activeFilter === 'pending' ? 'bg-primary/5 border-primary text-primary font-bold' : 'bg-surface border-outline-variant text-on-surface hover:bg-surface-container-high'}`}
                        >
                            <span className="material-symbols-outlined">schedule</span>
                            {t('financial.operations_under_review')}
                        </button>

                        <button 
                            onClick={() => { setActiveFilter('rejected'); setIsFilterModalOpen(false); }}
                            className={`p-3 rounded-xl border flex items-center gap-2 transition-all ${activeFilter === 'rejected' ? 'bg-error/5 border-error text-error font-bold' : 'bg-surface border-outline-variant text-on-surface hover:bg-surface-container-high'}`}
                        >
                            <span className="material-symbols-outlined">cancel</span>
                            {t('financial.rejected_operations')}
                        </button>
                    </div>

                    <div className="pt-4 mt-2 mb-1 border-t border-outline-variant/60">
                        <button 
                            onClick={() => setIsFilterModalOpen(false)}
                            className="w-full bg-surface border border-outline-variant text-on-surface hover:bg-surface-container font-label-md text-label-md py-3 rounded-xl transition-colors shadow-sm"
                        >
                            {t('common.close_window')}
                        </button>
                    </div>
                </div>
            </Modal>

            {/* Add Transaction Modal */}
            <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title={t('financial.record_financial_transaction')} maxWidth="max-w-[760px]">
                <form onSubmit={handleSubmit} className="space-y-6" dir={dir}>
                    <div className="bg-surface-container-low border border-outline-variant p-3.5 rounded-xl flex items-center">
                        <h4 className="font-extrabold text-base md:text-lg text-primary">{t('financial.manual_record') || 'تسجيل يدوي'}</h4>
                    </div>

                    <div className="space-y-5">
                        <div className="space-y-2">
                            <label className="font-extrabold text-base md:text-lg text-on-surface block">{t('financial.received_amount') || 'المبلغ المستلم'}</label>
                            <div className="relative">
                                <span className={`absolute ${dir === 'rtl' ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 text-on-surface-variant font-extrabold text-lg`}>$</span>
                                <input 
                                    type="number" 
                                    step="0.01"
                                    min="1"
                                    required
                                    value={formData.amount}
                                    onChange={(e) => setFormData({...formData, amount: e.target.value})}
                                    className={`w-full bg-surface border border-outline-variant rounded-xl py-3.5 ${dir === 'rtl' ? 'pl-4 pr-10' : 'pr-4 pl-10'} text-base md:text-lg font-extrabold text-on-background focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all shadow-sm`}
                                    placeholder={t('financial.amount_placeholder') || 'أدخل المبلغ'}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="font-extrabold text-base md:text-lg text-on-surface block">{t('financial.reference_number_label') || 'رقم المرجع / الحوالة'}</label>
                            <input 
                                type="text" 
                                required
                                value={formData.reference_number}
                                onChange={(e) => setFormData({...formData, reference_number: e.target.value})}
                                className="w-full bg-surface border border-outline-variant rounded-xl py-3.5 px-4 text-base md:text-lg font-extrabold text-on-background focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all shadow-sm"
                                placeholder={t('financial.ref_placeholder') || 'أدخل رقم المرجع'}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="font-extrabold text-base md:text-lg text-on-surface block">{t('financial.payment_method') || 'طريقة الدفع'}</label>
                            <div className="relative">
                                <select 
                                    required
                                    value={formData.payment_method}
                                    onChange={(e) => setFormData({...formData, payment_method: e.target.value})}
                                    className={`w-full appearance-none bg-surface border border-outline-variant rounded-xl py-3.5 ${dir === 'rtl' ? 'pr-4 pl-10' : 'pl-4 pr-10'} text-base md:text-lg font-extrabold text-on-background focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all cursor-pointer shadow-sm`}
                                >
                                    <option value="bank_transfer">تحويل بنكي</option>
                                    <option value="cash">نقداً (كاش)</option>
                                    <option value="credit">إشعار دائن / رصيد</option>
                                    <option value="credit_card">بطاقة ائتمانية / مدى</option>
                                </select>
                                <span className={`material-symbols-outlined absolute ${dir === 'rtl' ? 'left-4' : 'right-4'} top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none text-xl`}>expand_more</span>
                            </div>
                        </div>
                    </div>

                    <div className="pt-5 mt-3 border-t border-outline-variant/60 flex items-center justify-end gap-3">
                        <button 
                            type="button" 
                            onClick={() => setIsAddModalOpen(false)}
                            className="px-6 py-3 rounded-xl text-base font-extrabold border border-outline-variant text-on-surface hover:bg-surface-container transition-colors"
                        >
                            {t('common.cancel') || 'إلغاء'}
                        </button>
                        <button 
                            type="submit" 
                            disabled={isSubmitting}
                            className={`px-8 py-3.5 rounded-xl text-base md:text-lg font-extrabold text-white transition-all shadow-md flex items-center gap-2 ${
                                isSubmitting 
                                    ? 'bg-[#1c5b8e]/70 cursor-not-allowed' 
                                    : 'bg-[#1c5b8e] hover:bg-[#14355d] active:scale-95'
                            }`}
                        >
                            {isSubmitting ? (t('common.saving') || 'جاري الحفظ...') : (t('financial.save_transaction') || 'حفظ المعاملة')}
                            {!isSubmitting && <span className="material-symbols-outlined text-[22px]">save</span>}
                            {isSubmitting && <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Review Payout Modal */}
            <Modal isOpen={!!reviewModalData} onClose={() => setReviewModalData(null)} title={t('financial.review_payout_request')}>
                {reviewModalData && (
                    <div className="space-y-6" dir={dir}>
                        <div className="bg-surface-container border border-outline-variant rounded-xl p-4 space-y-3">
                            <h3 className="font-bold text-lg text-on-surface mb-2">{t('financial.payout_request_data')}</h3>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <p className="text-on-surface-variant mb-1">{t('financial.beneficiary_owner_name')}</p>
                                    <p className="font-bold text-on-surface">{reviewModalData.user?.full_name || t('common.unknown')}</p>
                                </div>
                                <div>
                                    <p className="text-on-surface-variant mb-1">{t('financial.requested_amount')}</p>
                                    <p className="font-bold text-primary text-lg">${parseFloat(reviewModalData.amount || 0).toFixed(2)}</p>
                                </div>
                                {(() => {
                                    try {
                                        const notes = JSON.parse(reviewModalData.notes || '{}');
                                        return (
                                            <>
                                                <div>
                                                    <p className="text-on-surface-variant mb-1">{t('financial.bank_name')}</p>
                                                    <p className="font-bold text-on-surface">{notes.bank_name || t('common.not_specified')}</p>
                                                </div>
                                                <div>
                                                    <p className="text-on-surface-variant mb-1">{t('financial.account_number')}</p>
                                                    <p className="font-mono font-bold text-on-surface bg-surface px-2 py-1 rounded inline-block">{notes.account_number || t('common.not_specified')}</p>
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
                                        {t('financial.approve_payout')}
                                    </h4>
                                    <p className="text-xs text-green-800 mb-3 leading-relaxed">
                                        {t('financial.approve_payout_desc')}
                                    </p>
                                    <input 
                                        type="text" 
                                        placeholder={t('financial.ref_number_placeholder')}
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
                                    {isApproving ? t('common.approving') : t('financial.approve_payout')}
                                </button>
                            </form>

                            {/* Reject Section */}
                            <form onSubmit={handleRejectPayout} className="border border-red-200 bg-red-50/30 p-4 rounded-xl flex flex-col justify-between">
                                <div>
                                    <h4 className="font-bold text-red-700 flex items-center gap-2 mb-3">
                                        <span className="material-symbols-outlined">cancel</span>
                                        {t('financial.reject_payout')}
                                    </h4>
                                    <p className="text-xs text-red-800 mb-3 leading-relaxed">
                                        {t('financial.reject_payout_desc')}
                                    </p>
                                    <textarea 
                                        placeholder={t('financial.reject_reason_placeholder')}
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
                                    {isRejecting ? t('common.rejecting') : t('financial.reject_payout')}
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
                            <p className="font-bold text-lg">{t('common.app_name')}</p>
                            <p className="text-sm opacity-80">{t('common.app_desc')}</p>
                        </div>
                    </div>
                    
                    <div className="w-48 bg-[#102a43]" style={{ clipPath: 'polygon(0 0, 100% 0, 75% 100%, 25% 100%)' }}></div>

                    <div className="flex-1 flex items-center justify-end px-12 bg-[#1c5b8e]">
                        <h1 className="text-5xl font-black tracking-tight" style={{ color: '#ffffff' }}>{t('financial.platform_profits')}</h1>
                    </div>
                </div>

                {/* Metadata Section */}
                <div className="flex justify-between items-start px-16 py-10">
                    <div className="flex-1 text-right space-y-2">
                        <p className="text-xl font-bold text-gray-800">{t('financial.report_issued_to')}</p>
                        <h2 className="text-3xl font-black text-gray-900">{t('financial.platform_management')} ({t('common.app_name')})</h2>
                        <p className="text-gray-600 font-medium">{t('financial.certified_report_issuer')}</p>
                    </div>
                    
                    <div className="flex-1 flex justify-end" dir={dir}>
                        <div className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-3 text-right">
                            <span className="font-bold text-gray-900">{t('financial.time_period')}:</span>
                            <span className="text-gray-700" dir="ltr">{dateFilters.start_date || '-'} / {dateFilters.end_date || '-'}</span>

                            <span className="font-bold text-gray-900">{t('financial.issue_date')}:</span>
                            <span className="text-gray-700">{new Date().toLocaleDateString(dir === 'rtl' ? 'ar-SA' : 'en-US')}</span>
                        </div>
                    </div>
                </div>

                {/* Table */}
                <div className="px-16 flex-1 mb-10">
                    <table className="w-full text-right text-sm border-collapse">
                        <thead className="bg-[#102a43] text-white">
                            <tr className="bg-[#102a43] text-white">
                                <th className="py-4 px-6 text-right font-bold w-1/4">{t('common.date')}</th>
                                <th className="py-4 px-6 text-right font-bold w-1/4">{t('financial.reference')}</th>
                                <th className="py-4 px-6 text-right font-bold w-1/4">{t('common.status')}</th>
                                <th className="py-4 px-6 text-left font-bold w-1/4">{t('financial.amount')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 border-b-2 border-[#1c5b8e]">
                            {platformTransactions.map((trx, idx) => (
                                <tr key={trx.ledger_id} className={idx % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                                    <td className="py-4 px-6 text-gray-700">{new Date(trx.created_at).toLocaleString('ar-EG')}</td>
                                    <td className="py-4 px-6 font-bold text-gray-900">#{trx.ledger_id}</td>
                                    <td className="py-4 px-6 text-right font-bold text-green-600">{t('common.approved')}</td>
                                    <td className="py-4 px-6 text-left font-bold text-green-600" dir="ltr">
                                        +${parseFloat(trx.amount).toFixed(2)}
                                    </td>
                                </tr>
                            ))}
                            {platformTransactions.length === 0 && (
                                <tr>
                                    <td colSpan="4" className="py-8 text-center text-gray-500 font-bold text-lg">
                                        {t('financial.no_profitable_transactions')}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>

                    {/* Totals Section */}
                    <div className="flex gap-6 mt-6">
                        <div className="bg-gray-50 p-6 rounded-xl border border-gray-200 flex-1">
                            <p className="text-gray-500 mb-2 font-bold">{t('financial.total_profits')}</p>
                            <p className="text-4xl font-black text-[#1c5b8e]" dir="ltr">${parseFloat(totalPlatformProfit).toFixed(2)}</p>
                        </div>
                        <div className="bg-gray-50 p-6 rounded-xl border border-gray-200 flex-1">
                            <p className="text-gray-500 mb-2 font-bold">{t('financial.number_of_transactions')}</p>
                            <p className="text-4xl font-black text-[#1c5b8e]" dir="ltr">{platformTransactions.length}</p>
                        </div>
                    </div>
                    
                    {/* Conditions and Info */}
                    <div className="mt-16 grid grid-cols-2 gap-8 items-end w-full">
                        <div className="text-right">
                            <h4 className="font-bold text-gray-900 text-lg mb-2">{t('financial.additional_info')}</h4>
                            <p className="text-gray-600 text-sm leading-relaxed">
                                {t('financial.report_disclaimer')}
                            </p>
                        </div>
                        <div className="text-center">
                            <p className="font-bold text-gray-800 text-lg mb-4">{t('financial.admin_signature')}</p>
                            <div className="w-48 border-b-2 border-gray-300 mx-auto"></div>
                        </div>
                    </div>
                </div>

                {/* Archive Modal */}
                <Modal isOpen={isArchiveModalOpen} onClose={() => setIsArchiveModalOpen(false)} title={t('financial.archive_old_records')}>
                    <div className="space-y-4" dir={dir}>
                        <div className="bg-error-container border border-error/20 p-4 rounded-xl flex items-start gap-3">
                            <span className="material-symbols-outlined text-error mt-0.5">warning</span>
                            <div>
                                <h4 className="font-label-md text-label-md text-error mb-1">{t('financial.archive_warning')}</h4>
                                <p className="font-body-sm text-body-sm text-error/80 leading-relaxed">{t('financial.archive_desc')}</p>
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="font-label-md text-label-md text-on-surface">{t('financial.archive_period')}</label>
                            <select 
                                value={archiveMonths}
                                onChange={(e) => setArchiveMonths(e.target.value)}
                                className={`w-full bg-surface-container-highest border border-outline-variant rounded-xl p-3 outline-none`}
                            >
                                <option value="3">{t('financial.older_than_3_months')}</option>
                                <option value="6">{t('financial.older_than_6_months')}</option>
                                <option value="12">{t('financial.older_than_year')}</option>
                                <option value="24">{t('financial.older_than_2_years')}</option>
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
                                {t('financial.archive_now')}
                            </button>
                            <button 
                                onClick={() => setIsArchiveModalOpen(false)}
                                className="flex-1 bg-surface-container-high text-on-surface py-2.5 rounded-xl font-bold hover:bg-surface-container-highest transition-colors"
                            >
                                {t('common.cancel')}
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
