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

    const fetchPayments = async () => {
        setIsLoading(true);
        try {
            const res = await axiosClient.get(ENDPOINTS.FINANCIAL.LEDGER);
            if (res.data.success) {
                const ledger = res.data.data?.transactions || (Array.isArray(res.data.data) ? res.data.data : []);
                setPendingPayments(
                    ledger.filter(item => item.transaction_type === 'payment_pending' && item.status === 'pending')
                );
                setCompletedPayments(
                    ledger.filter(item => (item.transaction_type === 'payment_in' && item.status === 'completed') || item.status === 'rejected')
                );
            }
        } catch (error) {
            addToast(t('payment_ops.fetch_error'), 'error');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => { fetchPayments(); }, []);

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

    const currentList = activeTab === 'pending' ? pendingPayments : completedPayments;

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

    return (
        <div className="space-y-6 pb-12" dir="rtl">

            {/* ───── Page Header ───── */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 py-4 mb-2">
                <div className="flex flex-col">
                    <h1 className="font-headline-lg text-headline-lg font-bold text-on-surface mb-1 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                            <span className="material-symbols-outlined text-xl">receipt_long</span>
                        </div>
                        {t('payment_ops.page_title')}
                    </h1>
                    <p className="text-on-surface-variant font-body-md text-body-md">
                        {t('payment_ops.page_desc')}
                    </p>
                </div>
                <button
                    onClick={fetchPayments}
                    className="flex items-center gap-2 bg-surface border border-outline-variant hover:bg-surface-container-lowest text-on-surface-variant hover:text-on-surface font-label-md text-label-md px-4 py-2.5 rounded-lg transition-all whitespace-nowrap shadow-sm"
                >
                    <span className="material-symbols-outlined text-xl">refresh</span>
                    {t('payment_ops.refresh_ledger')}
                </button>
            </div>

            {/* ───── KPI Summary Cards ───── */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-surface border border-outline-variant rounded-2xl p-5 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wide mb-2">{t('payment_ops.total_operations')}</p>
                        <p className="text-3xl font-black text-on-surface">{pendingPayments.length + completedPayments.length}</p>
                    </div>
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                        <span className="material-symbols-outlined text-2xl">payments</span>
                    </div>
                </div>
                <div className="bg-surface border border-outline-variant rounded-2xl p-5 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wide mb-2">{t('payment_ops.pending_waiting')}</p>
                        <p className="text-3xl font-black text-orange-500">{pendingPayments.length}</p>
                    </div>
                    <div className="w-12 h-12 rounded-full bg-orange-50 flex items-center justify-center text-orange-500 shrink-0">
                        <span className="material-symbols-outlined text-2xl">pending</span>
                    </div>
                </div>
                <div className="bg-surface border border-outline-variant rounded-2xl p-5 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wide mb-2">{t('payment_ops.completed_approved')}</p>
                        <p className="text-3xl font-black text-emerald-600">{completedPayments.length}</p>
                    </div>
                    <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
                        <span className="material-symbols-outlined text-2xl">check_circle</span>
                    </div>
                </div>
                <div className="bg-surface border border-outline-variant rounded-2xl p-5 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wide mb-2">{t('payment_ops.total_collected')}</p>
                        <p className="text-3xl font-black text-primary">${totalCompleted.toFixed(0)}</p>
                    </div>
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                        <span className="material-symbols-outlined text-2xl">account_balance</span>
                    </div>
                </div>
            </div>

            {/* ───── Main Table Card ───── */}
            <div className="bg-surface rounded-2xl border border-outline-variant shadow-sm overflow-hidden mt-4">

                {/* Table topbar: Tabs + Search (centered) */}
                <div className="p-5 border-b border-outline-variant flex flex-col sm:flex-row gap-4 items-center justify-between bg-surface">
                    {/* Tabs — right side */}
                    <div className="flex bg-surface-container-low p-1 rounded-lg border border-outline-variant/50 shrink-0">
                        <button
                            onClick={() => { setActiveTab('pending'); setSearchQuery(''); }}
                            className={`font-label-md text-label-md px-5 py-2 rounded-md text-sm font-bold transition-all flex items-center gap-2 ${
                                activeTab === 'pending'
                                    ? 'bg-white text-primary shadow-sm border border-outline-variant/30'
                                    : 'text-on-surface-variant hover:text-on-surface'
                            }`}
                        >
                            <span className="material-symbols-outlined text-[16px]">pending</span>
                            {t('payment_ops.pending_manual')}
                            {pendingPayments.length > 0 && (
                                <span className="inline-flex items-center justify-center bg-error text-white rounded-full text-[10px] font-black min-w-[18px] h-[18px] px-1">
                                    {pendingPayments.length}
                                </span>
                            )}
                        </button>
                        <button
                            onClick={() => { setActiveTab('completed'); setSearchQuery(''); }}
                            className={`font-label-md text-label-md px-5 py-2 rounded-md text-sm font-bold transition-all flex items-center gap-2 ${
                                activeTab === 'completed'
                                    ? 'bg-white text-primary shadow-sm border border-outline-variant/30'
                                    : 'text-on-surface-variant hover:text-on-surface'
                            }`}
                        >
                            <span className="material-symbols-outlined text-[16px]">check_circle</span>
                            {t('payment_ops.completed')}
                        </button>
                    </div>

                    {/* Search — Left side */}
                    <div className="relative flex-1 max-w-md mr-auto group">
                        <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
                            <span className="material-symbols-outlined text-on-surface-variant/60 group-focus-within:text-primary transition-colors duration-300 text-[22px]">
                                search
                            </span>
                        </div>
                        <input
                            type="text"
                            placeholder={t('payment_ops.search_placeholder')}
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            className="w-full bg-surface-container-lowest hover:bg-surface border border-outline-variant/60 focus:border-primary/80 rounded-2xl py-3.5 pr-12 pl-12 text-base text-on-surface placeholder-on-surface-variant/60 outline-none focus:ring-4 focus:ring-primary/10 transition-all shadow-sm"
                        />
                        <div className={`absolute inset-y-0 left-0 flex items-center pl-3 transition-opacity duration-300 ${searchQuery ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                            <button
                                onClick={() => setSearchQuery('')}
                                className="w-8 h-8 flex items-center justify-center rounded-full text-on-surface-variant hover:text-error hover:bg-error/10 transition-all"
                                title={t('common.clear_search')}
                            >
                                <span className="material-symbols-outlined text-[18px]">close</span>
                            </button>
                        </div>
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
                        <h4 className="font-bold text-on-surface text-base mb-1">
                            {searchQuery ? t('common.no_matching_results') : activeTab === 'pending' ? t('payment_ops.no_pending_payments') : t('payment_ops.no_completed_payments')}
                        </h4>
                        <p className="text-on-surface-variant text-sm">
                            {searchQuery ? t('common.try_different_search') : activeTab === 'pending' ? t('payment_ops.all_manual_payments_processed') : t('payment_ops.no_approved_payments_yet')}
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-right border-collapse">
                            <thead className="bg-surface-container-low border-b border-outline-variant">
                                <tr>
                                    <th className="py-4 px-6 text-xs font-bold text-on-surface-variant uppercase tracking-wide whitespace-nowrap">#</th>
                                    <th className="py-4 px-6 text-xs font-bold text-on-surface-variant uppercase tracking-wide whitespace-nowrap">{t('payment_ops.advertisement')}</th>
                                    <th className="py-4 px-6 text-xs font-bold text-on-surface-variant uppercase tracking-wide whitespace-nowrap">{t('payment_ops.advertiser')}</th>
                                    <th className="py-4 px-6 text-xs font-bold text-on-surface-variant uppercase tracking-wide whitespace-nowrap text-center">{t('payment_ops.amount')}</th>
                                    <th className="py-4 px-6 text-xs font-bold text-on-surface-variant uppercase tracking-wide whitespace-nowrap text-center">{t('payment_ops.status')}</th>
                                    <th className="py-4 px-6 text-xs font-bold text-on-surface-variant uppercase tracking-wide whitespace-nowrap">{t('payment_ops.date')}</th>
                                    {activeTab === 'completed' && (
                                        <th className="py-4 px-6 text-xs font-bold text-on-surface-variant uppercase tracking-wide whitespace-nowrap">{t('payment_ops.reference')}</th>
                                    )}
                                    <th className="py-4 px-6 text-xs font-bold text-on-surface-variant uppercase tracking-wide whitespace-nowrap text-left">{t('payment_ops.actions')}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-outline-variant text-sm">
                                {filteredList.map((item, index) => {
                                    const isCompleted = activeTab === 'completed';
                                    return (
                                        <tr key={item.ledger_id} className="hover:bg-surface-container-lowest transition-colors group">
                                            <td className="py-4 px-6 text-on-surface-variant font-mono text-xs">
                                                {String(index + 1).padStart(2, '0')}
                                            </td>
                                            <td className="py-4 px-6 font-medium text-on-surface max-w-[200px] truncate">
                                                {item.advertisement?.title || '—'}
                                            </td>
                                            <td className="py-4 px-6 text-on-surface-variant whitespace-nowrap">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                                                        <span className="material-symbols-outlined text-[14px]">person</span>
                                                    </div>
                                                    <span className="font-medium">{item.user?.full_name || '—'}</span>
                                                </div>
                                            </td>
                                            <td className="py-4 px-6 text-center whitespace-nowrap">
                                                <span className={`font-black text-base ${isCompleted ? 'text-emerald-600' : 'text-orange-500'}`}>
                                                    ${parseFloat(item.amount || 0).toFixed(2)}
                                                </span>
                                            </td>
                                            <td className="py-4 px-6 text-center whitespace-nowrap">
                                                {isCompleted ? (
                                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold text-xs">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                                        {t('payment_ops.status_completed')}
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-50 text-orange-700 border border-orange-200 font-bold text-xs">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse"></span>
                                                        {t('payment_ops.status_pending')}
                                                    </span>
                                                )}
                                            </td>
                                            <td className="py-4 px-6 text-on-surface-variant whitespace-nowrap text-sm">
                                                {new Date(item.created_at).toLocaleDateString('ar-EG', { year: 'numeric', month: 'short', day: 'numeric' })}
                                            </td>
                                            {activeTab === 'completed' && (
                                                <td className="py-4 px-6 text-on-surface-variant">
                                                    <span className="font-mono text-xs text-on-surface-variant/70 truncate max-w-[120px] block" dir="ltr">
                                                        {item.reference_number || '—'}
                                                    </span>
                                                </td>
                                            )}
                                            <td className="py-4 px-6 text-left whitespace-nowrap">
                                                <div className="flex items-center justify-end gap-2">
                                                    {!isCompleted && item.has_receipt == 1 && (
                                                        <button
                                                            onClick={() => openReceipt(item.ledger_id)}
                                                            className="w-8 h-8 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-primary/10 hover:text-primary transition-colors"
                                                            title={t('payment_ops.view_receipt')}
                                                        >
                                                            <span className="material-symbols-outlined text-[18px]">image</span>
                                                        </button>
                                                    )}
                                                    {!isCompleted && (
                                                        <>
                                                            <button
                                                                onClick={() => handleApprove(item.ledger_id)}
                                                                className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold transition-colors shadow-sm"
                                                                title={t('payment_ops.approve_payment_tooltip')}
                                                            >
                                                                <span className="material-symbols-outlined text-[15px]">check_circle</span>
                                                                {t('payment_ops.approve')}
                                                            </button>
                                                            <button
                                                                onClick={() => handleReject(item.ledger_id)}
                                                                className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-error hover:bg-error/90 text-white text-xs font-bold transition-colors shadow-sm"
                                                                title={t('payment_ops.reject_payment_tooltip')}
                                                            >
                                                                <span className="material-symbols-outlined text-[15px]">cancel</span>
                                                                {t('payment_ops.reject')}
                                                            </button>
                                                        </>
                                                    )}
                                                    {isCompleted && (
                                                        <span className={`text-xs font-bold flex items-center gap-1 ${item.status === 'rejected' ? 'text-error' : 'text-emerald-600'}`}>
                                                            <span className="material-symbols-outlined text-[15px]">{item.status === 'rejected' ? 'cancel' : 'verified'}</span>
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
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-on-surface-variant font-medium">
                                                {t('payment_ops.total_operations_count')} {filteredList.length}
                                            </span>
                                            <span className="font-black text-on-surface text-base">
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
        </div>
    );
};

export default PaymentOperationsPage;
