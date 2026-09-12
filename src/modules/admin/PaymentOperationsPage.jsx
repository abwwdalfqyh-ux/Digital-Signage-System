import React, { useState, useEffect } from 'react';
import axiosClient from '../../core/api/axiosClient';
import { ENDPOINTS } from '../../core/api/endpoints';
import useToastStore from '../../store/useToastStore';
import Modal from '../../shared/components/Modal';
import useTranslation from '../../i18n/useTranslation';

const PaymentOperationsPage = () => {
    const { t } = useTranslation();
    const addToast = useToastStore(state => state.addToast);
    const [isLoading, setIsLoading] = useState(true);
    const [pendingPayments, setPendingPayments] = useState([]);
    const [completedPayments, setCompletedPayments] = useState([]);
    const [activeTab, setActiveTab] = useState('pending');
    const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
    const [selectedReceipt, setSelectedReceipt] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    
    // Date Filters
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    
    // Details Modal
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
    const [selectedTransaction, setSelectedTransaction] = useState(null);
    
    // Rejected Tab Support
    const [rejectedPayments, setRejectedPayments] = useState([]);

    const fetchPayments = async () => {
        setIsLoading(true);
        try {
            const params = {};
            if (startDate) params.start_date = startDate;
            if (endDate) params.end_date = endDate;
            
            const res = await axiosClient.get(ENDPOINTS.FINANCIAL.LEDGER, { params });
            if (res.data.success) {
                const ledger = res.data.data?.transactions || (Array.isArray(res.data.data) ? res.data.data : []);
                setPendingPayments(
                    ledger.filter(item => item.transaction_type === 'payment_pending' && item.status === 'pending')
                );
                setCompletedPayments(
                    ledger.filter(item => (item.transaction_type === 'payment_in' || item.transaction_type === 'payment') && item.status === 'completed')
                );
                setRejectedPayments(
                    ledger.filter(item => item.status === 'rejected')
                );
            }
        } catch (error) {
            console.error('Fetch Payments Error:', error);
            const errMsg = error.response?.data?.message || error.message || t('payment_ops.fetch_error');
            addToast(`فشل: ${errMsg}`, 'error');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => { fetchPayments(); }, [startDate, endDate]);

    const handleApprove = async (ledgerId) => {
        if (!window.confirm(t('payment_ops.confirm_approve'))) return;
        try {
            await axiosClient.post(ENDPOINTS.FINANCIAL.APPROVE(ledgerId));
            addToast(t('payment_ops.approve_success'), 'success');
            fetchPayments();
        } catch (error) {
            addToast(error.response?.data?.message || t('payment_ops.approve_error'), 'error');
        }
    };

    const handleReject = async (ledgerId) => {
        if (!window.confirm(t('payment_ops.confirm_reject'))) return;
        try {
            // سنضيف هذا المسار لاحقاً في endpoints.js ولكن يمكننا استخدامه مباشرة هنا الآن
            await axiosClient.post(`/financial/reject-payment/${ledgerId}`);
            addToast(t('payment_ops.reject_success'), 'success');
            fetchPayments();
        } catch (error) {
            addToast(error.response?.data?.message || t('payment_ops.reject_error'), 'error');
        }
    };

    const openReceipt = async (ledgerId) => {
        try {
            const res = await axiosClient.get(`/financial/receipt/${ledgerId}`);
            if (res.data.success && res.data.receipt_path) {
                // Since it is a base64 string, we use it directly
                setSelectedReceipt(res.data.receipt_path);
                setIsReceiptModalOpen(true);
            }
        } catch (error) {
            addToast(t('payment_ops.no_receipt'), 'warning');
        }
    };

    const openDetails = (item) => {
        setSelectedTransaction(item);
        setIsDetailsModalOpen(true);
    };

    const currentList = activeTab === 'pending' ? pendingPayments : activeTab === 'completed' ? completedPayments : rejectedPayments;

    const filteredList = currentList.filter(item => {
        const q = searchQuery.toLowerCase();
        return (
            item.advertisement?.title?.toLowerCase().includes(q) ||
            item.user?.full_name?.toLowerCase().includes(q) ||
            item.reference_number?.toLowerCase().includes(q)
        );
    });

    const totalPending = pendingPayments.reduce((acc, i) => acc + parseFloat(i.amount || 0), 0);
    const totalCompleted = completedPayments.reduce((acc, i) => acc + parseFloat(i.amount || 0), 0);
    const totalRejected = rejectedPayments.reduce((acc, i) => acc + parseFloat(i.amount || 0), 0);

    const exportCSV = () => {
        if (filteredList.length === 0) {
            addToast(t('common.no_data_to_export'), 'warning');
            return;
        }
        
        const headers = ['#', t('payment_ops.advertisement'), t('payment_ops.advertiser'), t('payment_ops.amount'), t('payment_ops.status'), t('payment_ops.date'), t('payment_ops.reference')];
        const rows = filteredList.map((item, index) => [
            index + 1,
            item.advertisement?.title || '—',
            item.user?.full_name || '—',
            parseFloat(item.amount || 0).toFixed(2),
            item.status,
            new Date(item.created_at).toLocaleDateString('en-US'),
            item.reference_number || '—'
        ]);

        const csvContent = [
            headers.join(','),
            ...rows.map(e => e.map(String).map(v => v.replaceAll('"', '""')).map(v => `"${v}"`).join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `payment_operations_${activeTab}_${new Date().getTime()}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="space-y-6 pb-12" dir="rtl">

            {/* ───── Page Header ───── */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 py-4 mb-2">
                <div className="flex flex-col">
                    <h1 className="font-headline-lg text-3xl md:text-4xl font-bold text-on-surface">
                        {t('payment_ops.page_title')}
                    </h1>
                </div>
            </div>

            {/* ───── KPI Summary Cards ───── */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-surface border border-outline-variant rounded-2xl py-3.5 px-5 shadow-sm text-center flex flex-col items-center justify-center">
                    <p className="text-lg font-bold text-on-surface mb-2">{t('payment_ops.total_operations')}</p>
                    <p className="text-xl font-normal text-on-surface">{pendingPayments.length + completedPayments.length}</p>
                </div>
                <div className="bg-surface border border-outline-variant rounded-2xl py-3.5 px-5 shadow-sm text-center flex flex-col items-center justify-center">
                    <p className="text-lg font-bold text-on-surface mb-2">{t('payment_ops.pending_waiting')}</p>
                    <p className="text-xl font-normal text-orange-500">{pendingPayments.length}</p>
                </div>
                <div className="bg-surface border border-outline-variant rounded-2xl py-3.5 px-5 shadow-sm text-center flex flex-col items-center justify-center">
                    <p className="text-lg font-bold text-on-surface mb-2">{t('payment_ops.completed_approved')}</p>
                    <p className="text-xl font-normal text-emerald-600">{completedPayments.length}</p>
                </div>
                <div className="bg-surface border border-outline-variant rounded-2xl py-3.5 px-5 shadow-sm text-center flex flex-col items-center justify-center">
                    <p className="text-lg font-bold text-on-surface mb-2">{t('payment_ops.total_collected')}</p>
                    <p className="text-xl font-normal text-primary">${totalCompleted.toFixed(0)}</p>
                </div>
            </div>

            {/* ───── Main Table Card ───── */}
            <div className="bg-surface rounded-2xl border border-outline-variant shadow-sm overflow-hidden mt-4">

                {/* Table topbar: Row 1 (Search + Refresh), Row 2 (Date Filters + Export), Row 3 (Tabs) */}
                <div className="p-4 border-b border-outline-variant space-y-4 bg-surface">
                    {/* Row 1: Dedicated Search Box + Refresh Button */}
                    <div className="flex flex-col sm:flex-row items-center gap-3 w-full">
                        {/* Search Input (Takes all remaining width) */}
                        <div className="relative flex-1 w-full group">
                            <span className="material-symbols-outlined absolute right-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant/60 text-[22px] pointer-events-none">search</span>
                            <input
                                type="text"
                                placeholder={t('payment_ops.search_placeholder')}
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                className="w-full bg-surface-container-lowest hover:bg-surface border border-outline-variant/60 focus:border-primary/80 rounded-xl py-3 pr-11 pl-10 text-base font-medium text-on-surface placeholder-on-surface-variant/60 outline-none focus:ring-2 focus:ring-primary/10 transition-all shadow-sm"
                            />
                            {searchQuery && (
                                <button onClick={() => setSearchQuery('')} className="absolute left-2.5 top-1/2 -translate-y-1/2 w-7 h-7 flex items-center justify-center rounded-full text-on-surface-variant hover:text-error hover:bg-error/10 transition-all" title={t('common.clear_search')}>
                                    <span className="material-symbols-outlined text-[18px]">close</span>
                                </button>
                            )}
                        </div>

                        {/* Refresh Button */}
                        <button
                            onClick={fetchPayments}
                            className="flex items-center justify-center gap-2 bg-surface border border-outline-variant hover:bg-surface-container-lowest text-on-surface-variant hover:text-on-surface px-5 py-3 rounded-xl text-base font-bold transition-all whitespace-nowrap shadow-sm shrink-0 w-full sm:w-auto"
                            title={t('payment_ops.refresh_ledger')}
                        >
                            <span className="material-symbols-outlined text-[20px]">refresh</span>
                            {t('payment_ops.refresh_ledger')}
                        </button>
                    </div>

                    {/* Row 2: Date Filters + Export Button (Full Width Row) */}
                    <div className="flex flex-col sm:flex-row items-center gap-3 w-full">
                        {/* Date Filters (Spans available width) */}
                        <div className="flex items-center justify-center gap-3 bg-surface-container-lowest border border-outline-variant/60 rounded-xl px-4 py-2.5 shadow-sm flex-1 w-full">
                            <input
                                type="date"
                                value={startDate}
                                onChange={e => setStartDate(e.target.value)}
                                className="bg-transparent px-2 py-1 text-base font-medium outline-none text-on-surface cursor-pointer"
                                title={t('common.start_date')}
                            />
                            <span className="text-outline-variant font-bold text-lg">-</span>
                            <input
                                type="date"
                                value={endDate}
                                onChange={e => setEndDate(e.target.value)}
                                className="bg-transparent px-2 py-1 text-base font-medium outline-none text-on-surface cursor-pointer"
                                title={t('common.end_date')}
                            />
                            {(startDate || endDate) && (
                                <button onClick={() => { setStartDate(''); setEndDate(''); }} className="p-1 text-error hover:bg-error/10 rounded-lg transition-colors" title={t('common.clear_filter')}>
                                    <span className="material-symbols-outlined text-[18px]">close</span>
                                </button>
                            )}
                        </div>
                        
                        {/* Export Button */}
                        <button onClick={exportCSV} className="flex items-center justify-center gap-2 bg-surface-container-low border border-outline-variant hover:bg-surface-container-highest text-on-surface px-6 py-3 rounded-xl text-base font-bold transition-all shadow-sm whitespace-nowrap shrink-0 w-full sm:w-auto">
                            <span className="material-symbols-outlined text-[20px]">download</span>
                            {t('common.export')}
                        </button>
                    </div>

                    {/* Row 3: Tabs (Below Date Filters + Export Row) - Spanning Full Width */}
                    <div className="grid grid-cols-3 gap-2 bg-surface-container-low p-1.5 rounded-xl border border-outline-variant/50 w-full">
                        <button
                            onClick={() => { setActiveTab('pending'); setSearchQuery(''); }}
                            className={`py-3 rounded-lg text-base font-bold transition-all flex items-center justify-center gap-2 w-full whitespace-nowrap ${
                                activeTab === 'pending'
                                    ? 'bg-white text-primary shadow-sm border border-outline-variant/30'
                                    : 'text-on-surface-variant hover:text-on-surface'
                            }`}
                        >
                            <span className="material-symbols-outlined text-[18px]">pending</span>
                            {t('payment_ops.pending_manual')}
                            {pendingPayments.length > 0 && (
                                <span className="inline-flex items-center justify-center bg-error text-white rounded-full text-xs font-black min-w-[20px] h-[20px] px-1">
                                    {pendingPayments.length}
                                </span>
                            )}
                        </button>
                        <button
                            onClick={() => { setActiveTab('completed'); setSearchQuery(''); }}
                            className={`py-3 rounded-lg text-base font-bold transition-all flex items-center justify-center gap-2 w-full whitespace-nowrap ${
                                activeTab === 'completed'
                                    ? 'bg-white text-emerald-600 shadow-sm border border-outline-variant/30'
                                    : 'text-on-surface-variant hover:text-emerald-600'
                            }`}
                        >
                            <span className="material-symbols-outlined text-[18px]">check_circle</span>
                            {t('payment_ops.completed')}
                        </button>
                        <button
                            onClick={() => { setActiveTab('rejected'); setSearchQuery(''); }}
                            className={`py-3 rounded-lg text-base font-bold transition-all flex items-center justify-center gap-2 w-full whitespace-nowrap ${
                                activeTab === 'rejected'
                                    ? 'bg-white text-error shadow-sm border border-outline-variant/30'
                                    : 'text-on-surface-variant hover:text-error'
                            }`}
                        >
                            <span className="material-symbols-outlined text-[18px]">cancel</span>
                            {t('payment_ops.rejected')}
                        </button>
                    </div>
                </div>

                {/* Table */}
                {isLoading ? (
                    <div className="flex justify-center items-center py-24">
                        <div className="w-8 h-8 border-4 border-outline-variant border-t-primary rounded-full animate-spin"></div>
                    </div>
                ) : filteredList.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                        <span className="material-symbols-outlined text-outline text-6xl mb-4" style={{ fontWeight: 100 }}>
                            {activeTab === 'pending' ? 'attach_money' : 'check_circle'}
                        </span>
                        <h4 className="font-bold text-on-surface text-lg mb-1">
                            {searchQuery ? t('common.no_matching_results') : activeTab === 'pending' ? t('payment_ops.no_pending_payments') : t('payment_ops.no_completed_payments')}
                        </h4>
                        <p className="text-on-surface-variant text-base font-medium">
                            {searchQuery ? t('common.try_different_search') : ''}
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-right border-collapse">
                            <thead className="bg-surface-container-low border-b border-outline-variant">
                                <tr>
                                    <th className="py-4 px-6 text-sm font-bold text-on-surface uppercase tracking-wide whitespace-nowrap">#</th>
                                    <th className="py-4 px-6 text-sm font-bold text-on-surface uppercase tracking-wide whitespace-nowrap">{t('payment_ops.advertisement')}</th>
                                    <th className="py-4 px-6 text-sm font-bold text-on-surface uppercase tracking-wide whitespace-nowrap">{t('payment_ops.advertiser')}</th>
                                    <th className="py-4 px-6 text-sm font-bold text-on-surface uppercase tracking-wide whitespace-nowrap text-center">{t('payment_ops.amount')}</th>
                                    <th className="py-4 px-6 text-sm font-bold text-on-surface uppercase tracking-wide whitespace-nowrap text-center">{t('payment_ops.status')}</th>
                                    <th className="py-4 px-6 text-sm font-bold text-on-surface uppercase tracking-wide whitespace-nowrap">{t('payment_ops.date')}</th>
                                    {activeTab === 'completed' && (
                                        <th className="py-4 px-6 text-sm font-bold text-on-surface uppercase tracking-wide whitespace-nowrap">{t('payment_ops.reference')}</th>
                                    )}
                                    <th className="py-4 px-6 text-sm font-bold text-on-surface uppercase tracking-wide whitespace-nowrap text-left">{t('payment_ops.actions')}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-outline-variant text-base">
                                {filteredList.map((item, index) => {
                                    const isCompleted = activeTab === 'completed';
                                    return (
                                        <tr key={item.ledger_id} className="hover:bg-surface-container-lowest transition-colors group">
                                            <td className="py-4 px-6 text-on-surface-variant font-mono text-sm font-medium">
                                                {String(index + 1).padStart(2, '0')}
                                            </td>
                                            <td className="py-4 px-6 font-bold text-on-surface max-w-[220px] truncate">
                                                {item.advertisement?.title || '—'}
                                            </td>
                                            <td className="py-4 px-6 text-on-surface whitespace-nowrap">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                                                        <span className="material-symbols-outlined text-[16px]">person</span>
                                                    </div>
                                                    <span className="font-bold">{item.user?.full_name || '—'}</span>
                                                </div>
                                            </td>
                                            <td className="py-4 px-6 text-center whitespace-nowrap">
                                                <span className={`font-black text-lg ${isCompleted ? 'text-emerald-600' : 'text-orange-500'}`}>
                                                    ${parseFloat(item.amount || 0).toFixed(2)}
                                                </span>
                                            </td>
                                            <td className="py-4 px-6 text-center whitespace-nowrap">
                                                {isCompleted ? (
                                                    <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold text-sm">
                                                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                                                        {t('payment_ops.status_completed')}
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-orange-50 text-orange-700 border border-orange-200 font-bold text-sm">
                                                        <span className="w-2 h-2 rounded-full bg-orange-400 animate-pulse"></span>
                                                        {t('payment_ops.status_pending')}
                                                    </span>
                                                )}
                                            </td>
                                            <td className="py-4 px-6 text-on-surface-variant whitespace-nowrap text-base font-medium">
                                                {new Date(item.created_at).toLocaleDateString('ar-EG', { year: 'numeric', month: 'short', day: 'numeric' })}
                                            </td>
                                            {activeTab === 'completed' && (
                                                <td className="py-4 px-6 text-on-surface-variant">
                                                    <span className="font-mono text-sm font-medium text-on-surface-variant truncate max-w-[140px] block" dir="ltr">
                                                        {item.reference_number || '—'}
                                                    </span>
                                                </td>
                                            )}
                                            <td className="py-4 px-6 text-left whitespace-nowrap">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => openDetails(item)}
                                                        className="w-9 h-9 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-primary/10 hover:text-primary transition-colors"
                                                        title={t('payment_ops.view_details')}
                                                    >
                                                        <span className="material-symbols-outlined text-[20px]">info</span>
                                                    </button>
                                                    {!isCompleted && item.has_receipt == 1 && (
                                                        <button
                                                            onClick={() => openReceipt(item.ledger_id)}
                                                            className="w-9 h-9 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-primary/10 hover:text-primary transition-colors"
                                                            title={t('payment_ops.view_receipt')}
                                                        >
                                                            <span className="material-symbols-outlined text-[20px]">image</span>
                                                        </button>
                                                    )}
                                                    {!isCompleted && (
                                                        <>
                                                            <button
                                                                onClick={() => handleApprove(item.ledger_id)}
                                                                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-bold transition-colors shadow-sm"
                                                                title={t('payment_ops.approve_payment_tooltip')}
                                                            >
                                                                <span className="material-symbols-outlined text-[17px]">check_circle</span>
                                                                {t('payment_ops.approve')}
                                                            </button>
                                                            <button
                                                                onClick={() => handleReject(item.ledger_id)}
                                                                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-error hover:bg-error/90 text-white text-sm font-bold transition-colors shadow-sm"
                                                                title={t('payment_ops.reject_payment_tooltip')}
                                                            >
                                                                <span className="material-symbols-outlined text-[17px]">cancel</span>
                                                                {t('payment_ops.reject')}
                                                            </button>
                                                        </>
                                                    )}
                                                    {isCompleted && (
                                                        <span className={`text-sm font-bold flex items-center gap-1 ${item.status === 'rejected' ? 'text-error' : 'text-emerald-600'}`}>
                                                            <span className="material-symbols-outlined text-[17px]">{item.status === 'rejected' ? 'cancel' : 'verified'}</span>
                                                            {item.status === 'rejected' ? t('payment_ops.rejected') : t('payment_ops.approved')}
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>

                            {/* Table Footer Summary */}
                            <tfoot className="border-t-2 border-outline-variant bg-surface-container-low">
                                <tr>
                                    <td colSpan={activeTab === 'completed' ? 8 : 7} className="py-4 px-6">
                                        <div className="flex items-center justify-between text-base">
                                            <span className="text-on-surface-variant font-bold">
                                                {t('payment_ops.total_operations_count')} {filteredList.length}
                                            </span>
                                            <span className="font-black text-on-surface text-lg">
                                                {t('payment_ops.total_sum')}: ${filteredList.reduce((acc, i) => acc + parseFloat(i.amount || 0), 0).toFixed(2)}
                                            </span>
                                        </div>
                                    </td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                )}
            </div>

            {/* ───── Receipt Modal ───── */}
            <Modal isOpen={isReceiptModalOpen} onClose={() => setIsReceiptModalOpen(false)} title={t('payment_ops.manual_payment_receipt')}>
                <div className="flex flex-col items-center pt-4" dir="rtl">
                    {selectedReceipt ? (
                        <img
                            src={selectedReceipt}
                            alt={t('payment_ops.payment_receipt_alt')}
                            className="max-w-full rounded-2xl border border-outline-variant shadow"
                            onError={(e) => { e.target.onerror = null; e.target.src = 'https://via.placeholder.com/400x500?text=تعذر+تحميل+الصورة'; }}
                        />
                    ) : (
                        <div className="py-12 flex flex-col items-center gap-3 text-on-surface-variant">
                            <span className="material-symbols-outlined text-5xl" style={{ fontWeight: 100 }}>image_not_supported</span>
                            <p className="text-sm">{t('payment_ops.no_receipt_attached')}</p>
                        </div>
                    )}
                    <button
                        onClick={() => setIsReceiptModalOpen(false)}
                        className="mt-6 w-full bg-surface-container-highest text-on-surface py-3 rounded-xl font-bold text-sm hover:bg-outline-variant transition-colors"
                    >
                        {t('common.close')}
                    </button>
                </div>
            </Modal>

            {/* ───── Transaction Details Modal ───── */}
            <Modal isOpen={isDetailsModalOpen} onClose={() => setIsDetailsModalOpen(false)} title={t('payment_ops.transaction_details')}>
                {selectedTransaction && (
                    <div className="flex flex-col gap-6 pt-4" dir="rtl">
                        {/* Summary Header */}
                        <div className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant flex items-center justify-between shadow-sm">
                            <div>
                                <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wide mb-1">{t('payment_ops.total_amount')}</p>
                                <p className="text-2xl font-black text-on-surface">${parseFloat(selectedTransaction.amount || 0).toFixed(2)}</p>
                            </div>
                            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                                <span className="material-symbols-outlined text-2xl">attach_money</span>
                            </div>
                        </div>

                        {/* Breakdown */}
                        <div className="bg-surface border border-outline-variant rounded-2xl overflow-hidden shadow-sm">
                            <div className="p-4 border-b border-outline-variant bg-surface-container-low flex items-center gap-2">
                                <span className="material-symbols-outlined text-primary text-xl">pie_chart</span>
                                <h3 className="font-bold text-on-surface">{t('payment_ops.financial_breakdown')}</h3>
                            </div>
                            <div className="p-5 flex flex-col gap-4">
                                {/* Platform Commission */}
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-error/10 flex items-center justify-center text-error shrink-0">
                                            <span className="material-symbols-outlined text-sm">account_balance_wallet</span>
                                        </div>
                                        <div>
                                            <p className="font-bold text-sm text-on-surface">{t('payment_ops.platform_commission')}</p>
                                            <p className="text-xs text-on-surface-variant">{t('payment_ops.commission_rate', { rate: '20%' })}</p>
                                        </div>
                                    </div>
                                    <span className="font-black text-error">
                                        ${(parseFloat(selectedTransaction.amount || 0) * 0.20).toFixed(2)}
                                    </span>
                                </div>
                                
                                <hr className="border-outline-variant/50 border-dashed" />
                                
                                {/* Owner Profit */}
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
                                            <span className="material-symbols-outlined text-sm">savings</span>
                                        </div>
                                        <div>
                                            <p className="font-bold text-sm text-on-surface">{t('payment_ops.owner_net_profit')}</p>
                                            <p className="text-xs text-on-surface-variant">{t('payment_ops.profit_rate', { rate: '80%' })}</p>
                                        </div>
                                    </div>
                                    <span className="font-black text-emerald-600">
                                        ${(parseFloat(selectedTransaction.amount || 0) * 0.80).toFixed(2)}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Additional Information */}
                        <div className="bg-surface border border-outline-variant rounded-2xl p-5 shadow-sm space-y-4">
                            <h3 className="font-bold text-on-surface mb-2">{t('payment_ops.additional_info')}</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-xs text-on-surface-variant mb-1">{t('payment_ops.advertisement')}</p>
                                    <p className="font-medium text-sm text-on-surface">{selectedTransaction.advertisement?.title || '—'}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-on-surface-variant mb-1">{t('payment_ops.advertiser')}</p>
                                    <p className="font-medium text-sm text-on-surface">{selectedTransaction.user?.full_name || '—'}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-on-surface-variant mb-1">{t('payment_ops.transaction_date')}</p>
                                    <p className="font-medium text-sm text-on-surface" dir="ltr">
                                        {new Date(selectedTransaction.created_at).toLocaleString('en-US')}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs text-on-surface-variant mb-1">{t('payment_ops.reference')}</p>
                                    <p className="font-mono text-sm text-on-surface">{selectedTransaction.reference_number || '—'}</p>
                                </div>
                            </div>
                            
                            {selectedTransaction.notes && (
                                <div className="mt-4 pt-4 border-t border-outline-variant/50">
                                    <p className="text-xs text-on-surface-variant mb-1">{t('payment_ops.notes')}</p>
                                    <p className="text-sm text-on-surface bg-surface-container-lowest p-3 rounded-lg">
                                        {selectedTransaction.notes}
                                    </p>
                                </div>
                            )}
                        </div>

                        <button
                            onClick={() => setIsDetailsModalOpen(false)}
                            className="mt-2 w-full bg-surface-container-highest text-on-surface py-3 rounded-xl font-bold text-sm hover:bg-outline-variant transition-colors"
                        >
                            {t('common.close')}
                        </button>
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default PaymentOperationsPage;
