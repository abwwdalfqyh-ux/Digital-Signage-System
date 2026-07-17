import React, { useState, useEffect } from 'react';
import { 
    Wallet, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, 
    Calendar, Clock, CheckCircle2, AlertCircle, RefreshCw, 
    ChevronDown, Download, Landmark, FileText, Filter, ListFilter, Banknote, CreditCard, Building
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Printer } from 'lucide-react';
import useToastStore from '../../store/useToastStore';
import axiosClient from '../../core/api/axiosClient';
import { ENDPOINTS } from '../../core/api/endpoints';
import Modal from '../../shared/components/Modal';
import { useQueryClient } from '@tanstack/react-query';
import echo from '../../core/api/echo';
import useAuthStore from '../../store/useAuthStore';
import { useOwnerEarnings, useRequestPayout } from '../../hooks/api/useFinancial';
import useTranslation from '../../i18n/useTranslation';

/* ─── Premium Colour Tokens ─── */
const S = {
    primary: '#004ac6',
    primaryContainer: '#2563eb',
    secondary: '#0060ac',
    surfaceContainerLowest: '#ffffff',
    surfaceContainerLow: '#f1f3ff',
    surfaceContainer: '#e9edff',
    onBackground: '#141b2b',
    onSurfaceVariant: '#434655',
    outline: '#737686',
    outlineVariant: '#c3c6d7',
    error: '#ba1a1a',
    errorContainer: '#ffdad6',
    success: '#166534',
    successContainer: '#dcfce7',
    warning: '#b45309',
    warningContainer: '#fef3c7',
};

const OwnerEarningsPage = () => {
    // ─── 1. DATA FROM BACKEND ───
    const queryClient = useQueryClient();
    const user = useAuthStore(s => s.user);
    const { data, isLoading: isFetching } = useOwnerEarnings();
    const { mutateAsync: requestPayout } = useRequestPayout();
    const { t, dir } = useTranslation();

    useEffect(() => {
        if (!user) return;
        const channel = echo.private(`owner.earnings.${user.user_id}`);
        channel.listen('LedgerUpdated', () => {
            queryClient.invalidateQueries({ queryKey: ['ownerEarnings'] });
        });
        return () => echo.leave(`owner.earnings.${user.user_id}`);
    }, [user, queryClient]);

    const balance = data?.available_balance || 0;
    const totalEarned = data?.total_earnings || 0;
    const logs = Array.isArray(data?.pending_logs) ? data.pending_logs : Object.values(data?.pending_logs || {});
    
    const formattedTx = logs.map(log => {
        let type = 'earning';
        if (log.transaction_type === 'payout_requested' || log.transaction_type === 'payout_completed' || log.transaction_type === 'payout_rejected') {
            type = 'payout';
        }
        
        let source = t('financial.financial_transaction');
        if (log.notes) {
            try {
                const parsedNotes = JSON.parse(log.notes);
                if (parsedNotes.rejection_reason) {
                    source = `${t('financial.payout_rejection')}: ${parsedNotes.rejection_reason}`;
                } else if (parsedNotes.bank_name) {
                    source = `${t('financial.bank_transfer')} - ${parsedNotes.bank_name}`;
                } else {
                    source = log.notes;
                }
            } catch (e) {
                source = log.notes;
            }
        }
        
        if (log.advertisement) {
             source = t('financial.advertisement') + ': ' + log.advertisement.title;
        }
        
        return {
            id: log.ledger_id || log.id,
            type: type,
            amount: Math.abs(log.amount),
            source: source,
            date: new Date(log.created_at).toLocaleString('ar-EG'),
            rawDate: new Date(log.created_at),
            status: log.status,
            screenId: log.screen?.screen_id || null,
            screenName: log.screen ? `${log.screen.screen_id} - ${log.screen.screen_name}` : t('financial.unspecified')
        };
    });
    
    const transactions = formattedTx;
    const pendingPayouts = formattedTx.filter(t => t.type === 'payout' && t.status === 'pending').reduce((sum, t) => sum + t.amount, 0);

    // ─── 2. STATE & UI CONTROLS ───
    const [activeTab, setActiveTab] = useState('all'); // 'all', 'earnings', 'payouts'
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [selectedScreen, setSelectedScreen] = useState('all');
    const [isPayoutModalOpen, setPayoutModalOpen] = useState(false);
    const [payoutForm, setPayoutForm] = useState({ amount: '', bank: '', account_number: '' });
    const [loading, setLoading] = useState(false);
    const addToast = useToastStore(s => s.addToast);

    // استخراج قائمة الشاشات الفريدة للمالك
    const uniqueScreens = Array.from(new Set(formattedTx.filter(t => t.screenId !== null).map(t => t.screenId)))
        .map(id => {
            const tx = formattedTx.find(t => t.screenId === id);
            return { id, name: tx.screenName };
        });

    const filteredTransactions = transactions.filter(t => {
        // فلترة النوع
        if (activeTab === 'earnings' && t.type !== 'earning') return false;
        if (activeTab === 'payouts' && t.type !== 'payout') return false;

        // فلترة الشاشة
        if (selectedScreen !== 'all' && t.screenId?.toString() !== selectedScreen) return false;

        // فلترة التاريخ
        if (startDate && t.rawDate < new Date(startDate)) return false;
        if (endDate) {
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);
            if (t.rawDate > end) return false;
        }

        return true;
    });

    const reportTotalEarned = filteredTransactions.filter(t => t.type === 'earning').reduce((sum, t) => sum + t.amount, 0);
    const reportTotalPayouts = filteredTransactions.filter(t => t.type === 'payout').reduce((sum, t) => sum + t.amount, 0);

    // ─── 3. HANDLERS ───
    const handleRequestPayout = async (e) => {
        e.preventDefault();
        const amt = parseFloat(payoutForm.amount);
        if (amt > balance) return addToast(t('financial.amount_exceeds_balance'), 'error');
        if (amt < 50) return addToast(t('financial.min_payout_warning'), 'warning');
        
        setLoading(true);
        try {
            await requestPayout({
                amount: amt,
                bank_name: payoutForm.bank,
                account_number: payoutForm.account_number
            });
            setPayoutModalOpen(false);
            setPayoutForm({ amount: '', bank: '', account_number: '' });
        } catch (error) {
            // Error is handled by hook
        } finally {
            setLoading(false);
        }
    };

    const handleExportStatement = () => {
        if (filteredTransactions.length === 0) {
            alert(t('financial.transactions_empty'));
            return;
        }

        const headers = [t('financial.date'), t('financial.transaction'), t('financial.source'), t('financial.amount_usd'), t('financial.status')];
        
        const csvRows = filteredTransactions.map(tx => {
            const date = tx.date;
            const type = tx.type === 'earning' ? t('financial.earnings') : t('financial.payout');
            const source = tx.source.replace(/"/g, '""'); // Escape quotes
            const amount = tx.amount.toFixed(2);
            let statusStr = tx.status === 'completed' ? t('financial.completed') : tx.status === 'rejected' ? t('financial.rejected') : t('financial.under_review');
            if (tx.type === 'earning' && tx.status === 'pending') statusStr = t('financial.available_for_payout');
            return `"${date}","${type}","${source}","${amount}","${statusStr}"`;
        });
        
        const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + [headers.join(','), ...csvRows].join('\n');
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `account_statement_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handlePrintReport = () => {
        window.print();
    };

    return (
        <div className="p-6 md:p-8 space-y-6 max-w-[1400px] mx-auto w-full" style={{ direction: dir, fontFamily: "'IBM Plex Sans Arabic', sans-serif" }}>
            
            {/* Print Styles */}
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
            
            {/* ── Page Header ── */}
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-black text-[#141b2b] m-0 mb-2 tracking-tight flex items-center gap-3">
                        {t('financial.e_wallet')} <Wallet className="w-8 h-8 text-blue-600" />
                    </h1>
                    <p className="text-sm font-medium text-gray-500 m-0">{t('financial.e_wallet_desc')}</p>
                </div>
                <button
                    onClick={() => setPayoutModalOpen(true)}
                    className="flex items-center gap-2 px-6 py-3.5 rounded-xl font-bold text-white shadow-lg shadow-blue-600/30 hover:-translate-y-1 transition-all duration-300"
                    style={{ background: 'linear-gradient(135deg, #2563eb 0%, #004ac6 100%)' }}
                >
                    <Landmark className="w-5 h-5" />
                    {t('financial.request_payout')}
                </button>
            </motion.div>

            {/* ── 1. WALLET CARDS ── */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                {/* Available Balance (Hero Card) */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                    className="relative overflow-hidden p-8 rounded-3xl text-white shadow-xl flex flex-col justify-between min-h-[220px]"
                    style={{ background: 'linear-gradient(135deg, #141b2b 0%, #1e293b 100%)' }}
                >
                    {/* Decorative abstract shapes */}
                    <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-blue-500/20 rounded-full blur-3xl" />
                    <div className="absolute right-10 top-10 w-24 h-24 bg-indigo-500/20 rounded-full blur-2xl" />
                    
                    <div className="relative z-10">
                        <div className="flex items-center gap-2 mb-2 opacity-80">
                            <Wallet className="w-5 h-5" />
                            <span className="text-sm font-bold uppercase tracking-wider">{t('financial.available_balance')}</span>
                        </div>
                        <h2 className="text-5xl font-black mb-1 tracking-tight" dir="ltr" style={{ textAlign: 'right' }}>
                            ${balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </h2>
                    </div>
                </motion.div>

                {/* Total Earned */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                    className="p-8 rounded-3xl border shadow-sm flex flex-col justify-center"
                    style={{ background: '#ffffff', borderColor: S.outlineVariant }}
                >
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-green-50 text-green-600">
                            <Banknote className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-gray-400 mb-1">{t('financial.total_accumulated_earnings')}</p>
                            <h3 className="text-2xl font-black text-[#141b2b]" dir="ltr" style={{ textAlign: 'right' }}>
                                ${totalEarned.toLocaleString()}
                            </h3>
                        </div>
                    </div>
                </motion.div>

                {/* Pending Payouts */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                    className="p-8 rounded-3xl border shadow-sm flex flex-col justify-center"
                    style={{ background: '#ffffff', borderColor: S.outlineVariant }}
                >
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-amber-50 text-amber-600">
                            <Clock className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-gray-400 mb-1">{t('financial.pending_amounts')}</p>
                            <h3 className="text-2xl font-black text-[#141b2b]" dir="ltr" style={{ textAlign: 'right' }}>
                                ${pendingPayouts.toLocaleString()}
                            </h3>
                        </div>
                    </div>
                </motion.div>
            </div>
            {/* ── 2. Filters & Table ── */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white rounded-3xl p-6 md:p-8 border border-gray-100 shadow-sm relative overflow-hidden hide-on-print">
                
                {/* Filters Row */}
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 gap-6 border-b border-gray-100 pb-8">
                    <div>
                        <h2 className="text-2xl font-black text-[#141b2b] mb-1 flex items-center gap-2">
                            <ListFilter className="w-6 h-6 text-blue-600" />
                            {t('financial.transactions_and_earnings')}
                        </h2>
                        <p className="text-gray-500 text-sm font-medium">{t('financial.transactions_desc')}</p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        <div className="flex items-center bg-gray-50 rounded-xl p-1 border border-gray-200">
                            {['all', 'earnings', 'payouts'].map(tab => (
                                <button key={tab} onClick={() => setActiveTab(tab)}
                                    className={`px-5 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === tab ? 'bg-white shadow-sm text-blue-600 border border-gray-200/60' : 'text-gray-500 hover:text-gray-700'}`}
                                >
                                    {tab === 'all' ? t('common.all') : tab === 'earnings' ? t('financial.earnings_only') : t('financial.payouts_only')}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Advanced Filters: Date & Screen */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                    <div>
                        <label className="block text-xs font-bold text-gray-500 mb-2">{t('financial.from_date')}</label>
                        <input type="date" 
                            value={startDate} onChange={e => setStartDate(e.target.value)}
                            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold focus:border-blue-500 outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 mb-2">{t('financial.to_date')}</label>
                        <input type="date" 
                            value={endDate} onChange={e => setEndDate(e.target.value)}
                            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold focus:border-blue-500 outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 mb-2">{t('financial.screen')}</label>
                        <select 
                            value={selectedScreen} onChange={e => setSelectedScreen(e.target.value)}
                            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold focus:border-blue-500 outline-none"
                        >
                            <option value="all">{t('financial.all_screens')}</option>
                            {uniqueScreens.map(s => (
                                <option key={s.id} value={s.id.toString()}>{s.name}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Export Buttons */}
                <div className="flex flex-wrap justify-end gap-3 mb-6">
                    <button onClick={handleExportStatement}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-xl font-bold hover:bg-blue-100 transition-colors border border-blue-100 shadow-sm"
                    >
                        <Download className="w-4 h-4" />
                        {t('financial.export_statement')}
                    </button>
                    
                    <button onClick={handlePrintReport}
                        className="flex items-center gap-2 px-4 py-2 bg-gray-800 text-white rounded-xl font-bold hover:bg-gray-700 transition-colors shadow-sm"
                    >
                        <Printer className="w-4 h-4" />
                        {t('financial.print_pdf')}
                    </button>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="w-full text-right border-collapse min-w-[800px]">
                        <thead>
                            <tr className="bg-white text-gray-400 text-xs font-bold uppercase tracking-wider border-b border-gray-100">
                                <th className="p-5 font-bold">{t('financial.transaction')}</th>
                                <th className="p-5 font-bold">{t('financial.date_and_time')}</th>
                                <th className="p-5 font-bold">{t('financial.source')}</th>
                                <th className="p-5 font-bold">{t('financial.status')}</th>
                                <th className="p-5 font-bold text-left">{t('financial.amount')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 bg-white">
                            <AnimatePresence mode="popLayout">
                                {filteredTransactions.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" className="p-16 text-center text-gray-400">
                                            <ListFilter className="w-12 h-12 mx-auto mb-3 opacity-20" />
                                            {t('financial.no_matching_transactions')}
                                        </td>
                                    </tr>
                                ) : (
                                    filteredTransactions.map((trx, i) => (
                                        <motion.tr key={trx.id} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.2 }}
                                            className="hover:bg-gray-50/50 transition-colors group"
                                        >
                                            <td className="p-5">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center border ${trx.type === 'earning' ? 'bg-green-50 border-green-100 text-green-600' : 'bg-red-50 border-red-100 text-red-600'}`}>
                                                        {trx.type === 'earning' ? <ArrowDownRight className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-sm text-[#141b2b] m-0">{trx.type === 'earning' ? t('financial.screen_earnings') : t('financial.withdrawal')}</p>
                                                        <p className="text-[11px] font-mono text-gray-400 m-0 mt-0.5">{trx.id}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-5 text-sm font-medium text-gray-600 whitespace-nowrap">{trx.date}</td>
                                            <td className="p-5 text-sm font-bold text-gray-700">{trx.source}</td>
                                            <td className="p-5">
                                                {trx.status === 'completed' ? (
                                                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-50 text-green-700 border border-green-200 text-xs font-bold">
                                                        <CheckCircle2 className="w-3.5 h-3.5" /> {t('financial.completed')}
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-xs font-bold">
                                                        <Clock className="w-3.5 h-3.5" /> {t('financial.under_review')}
                                                    </span>
                                                )}
                                            </td>
                                            <td className="p-5 text-left whitespace-nowrap">
                                                <span className={`text-lg font-black ${trx.type === 'earning' ? 'text-green-600' : 'text-[#141b2b]'}`} dir="ltr">
                                                    {trx.type === 'earning' ? '+' : '-'}${trx.amount.toLocaleString()}
                                                </span>
                                            </td>
                                        </motion.tr>
                                    ))
                                )}
                            </AnimatePresence>
                        </tbody>
                    </table>
                </div>
            </motion.div>

            {/* ── 3. PAYOUT MODAL ── */}
            <Modal isOpen={isPayoutModalOpen} onClose={() => setPayoutModalOpen(false)} title={t('financial.payout_request_title')}>
                <div dir={dir} style={{ fontFamily: "'IBM Plex Sans Arabic', sans-serif" }}>
                    <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5 mb-6 flex items-start gap-4">
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                            <AlertCircle className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                            <h4 className="font-bold text-blue-900 m-0 mb-1">{t('financial.payout_info')}</h4>
                            <p className="text-xs text-blue-700 m-0 leading-relaxed">
                                {t('financial.payout_desc')}
                            </p>
                        </div>
                    </div>

                    <form onSubmit={handleRequestPayout} className="space-y-5">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-2">{t('financial.amount_to_withdraw')}</label>
                            <input type="number" required min="50" max={balance} step="0.5"
                                value={payoutForm.amount} onChange={e => setPayoutForm({ ...payoutForm, amount: e.target.value })}
                                placeholder={t('financial.amount_placeholder')}
                                className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-lg font-bold text-[#141b2b] focus:border-blue-600 focus:ring-0 outline-none transition-colors"
                            />
                            <p className="text-[11px] font-bold text-gray-400 mt-2 flex justify-between">
                                <span>{t('financial.min_withdrawal')}: $50</span>
                                <button type="button" onClick={() => setPayoutForm({ ...payoutForm, amount: balance })} className="text-blue-600 hover:underline cursor-pointer">{t('financial.withdraw_full_balance')}</button>
                            </p>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-2">{t('financial.bank_to_transfer')}</label>
                            <div className="relative">
                                <select required
                                    value={payoutForm.bank} onChange={e => setPayoutForm({ ...payoutForm, bank: e.target.value })}
                                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm font-bold text-[#141b2b] focus:border-blue-600 focus:ring-0 outline-none transition-colors appearance-none cursor-pointer"
                                    style={{ paddingRight: '40px' }}
                                >
                                    <option value="">-- {t('financial.select_bank')} --</option>
                                    <option value="kuraimi">{t('financial.bank_kuraimi')}</option>
                                    <option value="tadhamon">{t('financial.bank_tadhamon')}</option>
                                    <option value="yemen_kuwait">{t('financial.bank_yemen_kuwait')}</option>
                                    <option value="cac">{t('financial.bank_cac')}</option>
                                </select>
                                <Building className="absolute right-3 top-[14px] w-5 h-5 text-gray-400 pointer-events-none" />
                                <ChevronDown className="absolute left-4 top-[14px] w-5 h-5 text-gray-400 pointer-events-none" />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-2">{t('financial.bank_account_iban')}</label>
                            <div className="relative">
                                <input type="text" required
                                    value={payoutForm.account_number} onChange={e => setPayoutForm({ ...payoutForm, account_number: e.target.value })}
                                    placeholder={t('financial.account_placeholder')}
                                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm font-bold text-[#141b2b] focus:border-blue-600 focus:ring-0 outline-none transition-colors"
                                    style={{ paddingRight: '40px' }}
                                />
                                <CreditCard className="absolute right-3 top-[14px] w-5 h-5 text-gray-400 pointer-events-none" />
                            </div>
                        </div>

                        <div className="pt-4 border-t border-gray-100 flex gap-3">
                            <button type="button" onClick={() => setPayoutModalOpen(false)} className="px-6 py-3 rounded-xl font-bold text-gray-500 hover:bg-gray-100 transition-colors">
                                {t('common.cancel')}
                            </button>
                            <button type="submit" disabled={loading} className={`flex-1 flex justify-center items-center gap-2 px-6 py-3 rounded-xl font-bold text-white transition-all shadow-md ${loading ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 hover:-translate-y-0.5 hover:shadow-xl'}`}>
                                {loading ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Landmark className="w-5 h-5" />}
                                {t('financial.confirm_payout')}
                            </button>
                        </div>
                    </form>
                </div>
            </Modal>

            {/* ── 4. PRINTABLE REPORT TEMPLATE ── */}
            <div className="print-area bg-white overflow-hidden font-sans" dir={dir} style={{ minHeight: '100vh', flexDirection: 'column' }}>
                {/* Top Header Polygon */}
                <div className="w-full bg-[#1c5b8e] text-white flex justify-between items-stretch" style={{ height: '140px' }}>
                    <div className="flex-1 flex items-center justify-start px-12 bg-[#1c5b8e]">
                        <div className="text-center">
                            <img src="/Main_app_logo.png" alt="SabaPost Logo" className="h-16 object-contain mb-2 brightness-0 invert mx-auto" />
                            <p className="font-bold text-lg">SabaPost</p>
                            <p className="text-sm opacity-80">{t('financial.report_system_desc')}</p>
                        </div>
                    </div>
                    
                    {/* Center decorative element */}
                    <div className="w-48 bg-[#102a43]" style={{ clipPath: 'polygon(0 0, 100% 0, 75% 100%, 25% 100%)' }}></div>

                    <div className="flex-1 flex items-center justify-end px-12 bg-[#1c5b8e]">
                        <h1 className="text-5xl font-black tracking-tight" style={{ color: '#ffffff' }}>{t('financial.account_statement')}</h1>
                    </div>
                </div>

                {/* Metadata Section */}
                <div className="flex justify-between items-start px-16 py-10">
                    <div className="flex-1 text-right space-y-2">
                        <p className="text-xl font-bold text-gray-800">{t('financial.report_issued_to')}</p>
                        <h2 className="text-3xl font-black text-gray-900">{user?.full_name || t('financial.screen_owner')}</h2>
                        <p className="text-gray-600 font-medium">{t('financial.certified_report_issuer')}</p>
                        <p className="text-gray-500 text-sm mt-4 tracking-widest font-mono" dir="ltr">{user?.phone || t('financial.phone_not_listed')}</p>
                    </div>
                    
                    <div className="flex-1 flex justify-end" dir={dir}>
                        <div className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-3 text-right">
                            <span className="font-bold text-gray-900">{t('financial.screen')}:</span>
                            <span className="text-gray-700">{selectedScreen === 'all' ? t('financial.all_screens') : uniqueScreens.find(s => s.id.toString() === selectedScreen)?.name}</span>

                            <span className="font-bold text-gray-900">{t('financial.period')}:</span>
                            <span className="text-gray-700" dir="ltr">{startDate || '-'} / {endDate || '-'}</span>

                            <span className="font-bold text-gray-900">{t('financial.issue_date')}:</span>
                            <span className="text-gray-700">{new Date().toLocaleDateString(dir === 'rtl' ? 'ar-SA' : 'en-US')}</span>
                        </div>
                    </div>
                </div>

                {/* Table */}
                <div className="px-16 flex-1 mb-10">
                    <table className="w-full text-right text-sm border-collapse">
                        <thead className="bg-[#1c5b8e] text-white font-bold text-lg">
                            <tr>
                                <th className="py-4 px-4 text-center w-16">{t('financial.no')}</th>
                                <th className="py-4 px-4">{t('financial.date')}</th>
                                <th className="py-4 px-4">{t('financial.transaction')}</th>
                                <th className="py-4 px-4">{t('financial.source')}</th>
                                <th className="py-4 px-4 text-center">{t('financial.status')}</th>
                                <th className="py-4 px-4 text-left">{t('financial.amount')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 border-b-2 border-[#1c5b8e]">
                            {filteredTransactions.map((trx, idx) => (
                                <tr key={trx.id} className={idx % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                                    <td className="py-4 px-4 text-center font-bold text-gray-700">{String(idx + 1).padStart(2, '0')}</td>
                                    <td className="py-4 px-4 text-gray-700">{trx.date}</td>
                                    <td className="py-4 px-4 font-bold text-gray-900">{trx.type === 'earning' ? t('financial.screen_earnings') : t('financial.withdrawal')}</td>
                                    <td className="py-4 px-4 text-gray-600">{trx.source}</td>
                                    <td className="py-4 px-4 text-center text-gray-700">
                                        {trx.status === 'completed' ? t('financial.completed') : t('financial.under_review')}
                                    </td>
                                    <td className={`py-4 px-4 text-left font-bold ${trx.type === 'earning' ? 'text-green-600' : 'text-[#141b2b]'}`} dir="ltr">
                                        {trx.type === 'earning' ? '+' : '-'}${trx.amount.toLocaleString()}
                                    </td>
                                </tr>
                            ))}
                            {filteredTransactions.length === 0 && (
                                <tr>
                                    <td colSpan="6" className="py-8 text-center text-gray-500 font-medium">{t('financial.no_financial_movements')}</td>
                                </tr>
                            )}
                        </tbody>
                    </table>

                    {/* Totals Section */}
                    <div className="flex justify-end mt-6">
                        <div className="w-1/3">
                            <div className="flex justify-between py-2 px-4 border-b border-gray-200">
                                <span className="font-bold text-gray-800">{t('financial.total_filtered_earnings')}</span>
                                <span className="font-bold text-green-600">${reportTotalEarned.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between py-2 px-4 border-b border-gray-200">
                                <span className="font-bold text-gray-800">{t('financial.total_filtered_withdrawals')}</span>
                                <span className="font-bold text-gray-900">${reportTotalPayouts.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between py-3 px-4 bg-[#1c5b8e] text-white rounded-b-lg mt-1">
                                <span className="font-bold text-lg">{t('financial.total_available_balance')}</span>
                                <span className="font-bold text-lg">${balance.toLocaleString()}</span>
                            </div>
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
                        <div className="flex flex-col items-center justify-end px-12">
                            <h4 className="font-bold text-gray-900 text-lg mb-10 border-b border-gray-300 pb-2 min-w-[250px] text-center">{user?.full_name || t('financial.screen_owner')}</h4>
                            <p className="text-gray-500 text-sm w-full text-center">{t('financial.owner_signature')}</p>
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
        </div>
    );
};

export default OwnerEarningsPage;
