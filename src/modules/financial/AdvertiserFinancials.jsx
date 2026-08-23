import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Wallet, ArrowDownLeft, ArrowUpRight, RefreshCw, Calendar,
    CreditCard, TrendingDown, TrendingUp, DollarSign, Receipt,
    Search, X, ChevronDown, FileText
} from 'lucide-react';
import axiosClient from '../../core/api/axiosClient';
import { ENDPOINTS } from '../../core/api/endpoints';
import useToastStore from '../../store/useToastStore';
import useTranslation from '../../i18n/useTranslation';

/* ─── Design Tokens ─── */
const S = {
    primary: '#004ac6',
    primaryContainer: '#2563eb',
    surface: '#f9f9ff',
    surfaceContainerLowest: '#ffffff',
    surfaceContainerLow: '#f1f3ff',
    surfaceContainer: '#e9edff',
    surfaceContainerHigh: '#e1e8fd',
    onBackground: '#141b2b',
    onSurface: '#141b2b',
    onSurfaceVariant: '#434655',
    outline: '#737686',
    outlineVariant: '#c3c6d7',
    error: '#ba1a1a',
    errorContainer: '#ffdad6',
};

/* ─── KPI Balance Card ─── */
const BalanceCard = ({ title, amount, subtitle, icon: Icon, gradient, accentColor, index }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: index * 0.1 }}
        whileHover={{ y: -4, boxShadow: '0 16px 40px -12px rgba(0,74,198,0.18)' }}
        style={{
            background: gradient || S.surfaceContainerLowest,
            borderRadius: '20px',
            padding: '26px',
            border: gradient ? 'none' : `1px solid ${S.outlineVariant}`,
            borderRight: gradient ? 'none' : `4px solid ${accentColor}`,
            color: gradient ? '#fff' : S.onBackground,
            display: 'flex', flexDirection: 'column', gap: '16px',
            transition: 'all 0.25s ease',
        }}
    >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
                <p style={{ margin: 0, fontSize: '13px', fontWeight: 500, opacity: gradient ? 0.8 : undefined, color: gradient ? '#fff' : S.outline, fontFamily: "'IBM Plex Sans Arabic', sans-serif" }}>{title}</p>
                {subtitle && <p style={{ margin: '3px 0 0', fontSize: '11px', opacity: 0.65, color: gradient ? '#fff' : S.outlineVariant, fontFamily: "'IBM Plex Sans Arabic', sans-serif" }}>{subtitle}</p>}
            </div>
            <div style={{ width: 46, height: 46, borderRadius: '14px', background: gradient ? 'rgba(255,255,255,0.2)' : S.surfaceContainer, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(8px)' }}>
                <Icon style={{ width: 22, height: 22, color: gradient ? '#fff' : accentColor }} />
            </div>
        </div>
        <div>
            <span style={{ fontSize: '36px', fontWeight: 800, lineHeight: 1, color: gradient ? '#fff' : (accentColor || S.onBackground), fontFamily: "'IBM Plex Sans Arabic', sans-serif", letterSpacing: '-0.02em' }}>
                ${Number(amount || 0).toLocaleString()}
            </span>
        </div>
    </motion.div>
);

/* ─── Status pill ─── */
const StatusPill = ({ status, t }) => {
    const cfg = {
        'معتمدة': { bg: '#dcfce7', color: '#16a34a', label: t('financial.status_approved') },
        'مرفوضة': { bg: '#fee2e2', color: '#dc2626', label: t('financial.status_rejected') },
        'قيد الانتظار': { bg: '#fef3c7', color: '#b45309', label: t('financial.status_pending') },
        'approved': { bg: '#dcfce7', color: '#16a34a', label: t('financial.status_approved') },
        'pending': { bg: '#fef3c7', color: '#b45309', label: t('financial.status_pending') },
        'rejected': { bg: '#fee2e2', color: '#dc2626', label: t('financial.status_rejected') },
    };
    const c = cfg[status] || { bg: '#f3f4f6', color: '#6b7280', label: status || '—' };
    return (
        <span style={{ padding: '3px 10px', borderRadius: '999px', background: c.bg, color: c.color, fontSize: '11px', fontWeight: 700, fontFamily: "'IBM Plex Sans Arabic', sans-serif", whiteSpace: 'nowrap' }}>
            {c.label}
        </span>
    );
};

/* ─── Mini bar chart ─── */
const SpendingChart = ({ transactions }) => {
    if (!transactions || transactions.length === 0) return null;

    // Group by month
    const monthlyMap = {};
    transactions.forEach(tx => {
        const d = new Date(tx.date || tx.created_at);
        if (isNaN(d)) return;
        const key = `${d.getFullYear()}-${d.getMonth()}`;
        const label = d.toLocaleDateString('ar', { month: 'short' });
        if (!monthlyMap[key]) monthlyMap[key] = { label, total: 0 };
        monthlyMap[key].total += Number(tx.amount || 0);
    });

    const months = Object.values(monthlyMap).slice(-6);
    const maxVal = Math.max(...months.map(m => m.total), 1);

    return (
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px', height: '80px', padding: '0 4px' }}>
            {months.map((m, i) => (
                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                    <div style={{ width: '100%', display: 'flex', alignItems: 'flex-end', height: '60px' }}>
                        <motion.div
                            initial={{ height: 0 }}
                            animate={{ height: `${Math.round((m.total / maxVal) * 100)}%` }}
                            transition={{ duration: 0.6, delay: i * 0.08 }}
                            style={{ width: '100%', background: 'linear-gradient(180deg, #2563eb, #004ac6)', borderRadius: '6px 6px 0 0', minHeight: '4px' }}
                        />
                    </div>
                    <span style={{ fontSize: '10px', color: S.outline, fontFamily: "'IBM Plex Sans Arabic', sans-serif", whiteSpace: 'nowrap' }}>{m.label}</span>
                </div>
            ))}
        </div>
    );
};

/* ══════════════════════════════════════════════════════
   ADVERTISER FINANCIALS PAGE
══════════════════════════════════════════════════════ */
const AdvertiserFinancials = () => {
    const { t, dir } = useTranslation();
    const addToast = useToastStore(state => state.addToast);

    const [data, setData] = useState({ approved_balance: 0, total_payments: 0, transactions: [] });
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [currentPage, setCurrentPage] = useState(1);
    const PER_PAGE = 10;

    const fetchFinancials = async (silent = false) => {
        if (!silent) setLoading(true);
        try {
            const res = await axiosClient.get(ENDPOINTS.ADVERTISER.FINANCIALS);
            setData(res.data?.data || res.data || { approved_balance: 0, total_payments: 0, transactions: [] });
        } catch (error) {
            if (!silent) addToast(t('financial.load_fail'), 'error');
        } finally {
            if (!silent) setLoading(false);
        }
    };

    useEffect(() => { fetchFinancials(); }, []);

    const transactions = data.transactions || [];

    /* ── Filtering ── */
    const filtered = transactions.filter(tx => {
        const matchSearch = !searchTerm ||
            tx.ref?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            tx.method?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchStatus = statusFilter === 'all' || tx.status === statusFilter;
        return matchSearch && matchStatus;
    });

    const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
    const paged = filtered.slice((currentPage - 1) * PER_PAGE, currentPage * PER_PAGE);

    const totalSpent = transactions.reduce((s, tx) => s + Number(tx.amount || 0), 0);
    const approvedTxCount = transactions.filter(t => t.status === 'معتمدة' || t.status === 'approved').length;

    const statusOptions = [
        { value: 'all', label: t('financial.all') },
        { value: 'معتمدة', label: t('financial.status_approved') },
        { value: 'قيد الانتظار', label: t('financial.status_pending') },
        { value: 'مرفوضة', label: t('financial.status_rejected') },
    ];

    /* ── Skeleton ── */
    if (loading) {
        return (
            <div dir={dir} style={{ fontFamily: "'IBM Plex Sans Arabic', sans-serif", padding: '8px' }}>
                <div style={{ height: '36px', width: '260px', borderRadius: '10px', background: S.surfaceContainerHigh, marginBottom: '24px' }} />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '24px' }}>
                    {[1, 2, 3].map(i => <div key={i} style={{ height: '130px', borderRadius: '20px', background: S.surfaceContainerHigh }} />)}
                </div>
                <div style={{ height: '400px', borderRadius: '20px', background: S.surfaceContainerHigh }} />
            </div>
        );
    }

    return (
        <div dir={dir} style={{ fontFamily: "'IBM Plex Sans Arabic', sans-serif", paddingBottom: '40px' }}>

            {/* ── Header ── */}
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '28px', flexWrap: 'wrap', gap: '16px' }}
            >
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
                        <div style={{ width: 44, height: 44, borderRadius: '14px', background: S.surfaceContainer, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Wallet style={{ width: 22, height: 22, color: S.primaryContainer }} />
                        </div>
                        <h1 style={{ margin: 0, fontSize: '26px', fontWeight: 700, color: S.onBackground, fontFamily: "'IBM Plex Sans Arabic', sans-serif" }}>
                            {t('financial.history')}
                        </h1>
                    </div>
                    <p style={{ margin: 0, fontSize: '14px', color: S.outline, fontFamily: "'IBM Plex Sans Arabic', sans-serif" }}>
                        {t('financial.history_desc')}
                    </p>
                </div>
                <button
                    onClick={() => fetchFinancials()}
                    style={{
                        display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 18px',
                        borderRadius: '12px', border: `1px solid ${S.outlineVariant}`,
                        background: S.surfaceContainerLowest, color: S.onSurfaceVariant,
                        cursor: 'pointer', fontSize: '14px', fontWeight: 600, fontFamily: "'IBM Plex Sans Arabic', sans-serif",
                    }}
                >
                    <RefreshCw style={{ width: 15, height: 15 }} />
                    {t('common.refresh')}
                </button>
            </motion.div>

            {/* ── Balance Cards ── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '28px' }}>
                <BalanceCard
                    title={t('financial.approved_balance')}
                    amount={data.approved_balance}
                    subtitle={t('financial.approved_balance_desc')}
                    icon={ArrowDownLeft}
                    gradient="linear-gradient(135deg, #004ac6 0%, #2563eb 60%, #3b82f6 100%)"
                    index={0}
                />
                <BalanceCard
                    title={t('financial.total_spent')}
                    amount={totalSpent}
                    subtitle={t('financial.total_spent_desc')}
                    icon={TrendingDown}
                    accentColor="#7c3aed"
                    index={1}
                />
                <BalanceCard
                    title={t('financial.total_payments')}
                    amount={data.total_payments}
                    subtitle={t('financial.approved_tx_count').replace('{count}', approvedTxCount)}
                    icon={Receipt}
                    accentColor="#16a34a"
                    index={2}
                />
            </div>

            {/* ── Spending Chart ── */}
            {transactions.length > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    style={{ background: S.surfaceContainerLowest, borderRadius: '20px', padding: '24px', border: `1px solid ${S.outlineVariant}`, marginBottom: '20px' }}
                >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                        <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: S.onBackground, fontFamily: "'IBM Plex Sans Arabic', sans-serif" }}>
                            {t('financial.monthly_spending')}
                        </h3>
                        <TrendingUp style={{ width: 18, height: 18, color: S.primaryContainer }} />
                    </div>
                    <SpendingChart transactions={transactions} />
                </motion.div>
            )}

            {/* ── Transactions Table ── */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                style={{ background: S.surfaceContainerLowest, borderRadius: '20px', border: `1px solid ${S.outlineVariant}`, overflow: 'hidden' }}
            >
                {/* Table Header */}
                <div style={{ padding: '20px 24px', borderBottom: `1px solid ${S.outlineVariant}`, display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center', justifyContent: 'space-between' }}>
                    <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: S.onBackground, fontFamily: "'IBM Plex Sans Arabic', sans-serif" }}>
                        {t('financial.tx_history_count').replace('{count}', filtered.length)}
                    </h3>
                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                        {/* Status filter */}
                        <div style={{ position: 'relative' }}>
                            <select
                                value={statusFilter}
                                onChange={e => { setStatusFilter(e.target.value); setCurrentPage(1); }}
                                style={{ appearance: 'none', border: `1px solid ${S.outlineVariant}`, borderRadius: '10px', padding: '8px 32px 8px 14px', fontSize: '13px', background: S.surfaceContainerLow, color: S.onBackground, cursor: 'pointer', fontFamily: "'IBM Plex Sans Arabic', sans-serif", outline: 'none' }}
                            >
                                {statusOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                            </select>
                            <ChevronDown style={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)', left: '10px', width: 14, height: 14, color: S.outline, pointerEvents: 'none' }} />
                        </div>
                        {/* Search */}
                        <div style={{ position: 'relative' }}>
                            <Search style={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)', right: dir === 'rtl' ? '10px' : 'auto', left: dir === 'ltr' ? '10px' : 'auto', width: 14, height: 14, color: S.outline }} />
                            <input
                                type="text"
                                placeholder={t('financial.search_placeholder')}
                                value={searchTerm}
                                onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                                style={{ border: `1px solid ${S.outlineVariant}`, borderRadius: '10px', padding: '8px', paddingRight: dir === 'rtl' ? '32px' : '10px', paddingLeft: dir === 'ltr' ? '32px' : '10px', fontSize: '13px', background: S.surfaceContainerLow, color: S.onBackground, fontFamily: "'IBM Plex Sans Arabic', sans-serif", outline: 'none', width: '160px' }}
                            />
                            {searchTerm && (
                                <button onClick={() => setSearchTerm('')} style={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)', left: dir === 'rtl' ? '8px' : 'auto', right: dir === 'ltr' ? '8px' : 'auto', background: 'none', border: 'none', cursor: 'pointer', color: S.outline }}>
                                    <X style={{ width: 12, height: 12 }} />
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Table */}
                {filtered.length === 0 ? (
                    <div style={{ padding: '60px 20px', textAlign: 'center' }}>
                        <div style={{ width: 64, height: 64, borderRadius: '50%', background: S.surfaceContainerLow, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                            <Receipt style={{ width: 28, height: 28, color: S.outline }} />
                        </div>
                        <p style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: S.onBackground, fontFamily: "'IBM Plex Sans Arabic', sans-serif" }}>
                            {t('financial.no_transactions')}
                        </p>
                        <p style={{ margin: '6px 0 0', fontSize: '13px', color: S.outline, fontFamily: "'IBM Plex Sans Arabic', sans-serif" }}>
                            {t('financial.no_tx_match')}
                        </p>
                    </div>
                ) : (
                    <>
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ background: S.surfaceContainerLow }}>
                                        {[t('financial.date'), t('financial.reference'), t('financial.payment_method'), t('financial.amount'), t('financial.status')].map((h, i) => (
                                            <th key={i} style={{ padding: '12px 16px', textAlign: dir === 'rtl' ? 'right' : 'left', fontSize: '12px', fontWeight: 700, color: S.outline, fontFamily: "'IBM Plex Sans Arabic', sans-serif", borderBottom: `1px solid ${S.outlineVariant}`, whiteSpace: 'nowrap' }}>
                                                {h}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    <AnimatePresence>
                                        {paged.map((tx, i) => (
                                            <motion.tr
                                                key={tx.id || i}
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                transition={{ delay: i * 0.03 }}
                                                style={{ borderBottom: `1px solid ${S.outlineVariant}` }}
                                                onMouseEnter={e => e.currentTarget.style.background = S.surfaceContainerLow}
                                                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                            >
                                                <td style={{ padding: '14px 16px', fontSize: '13px', color: S.onSurfaceVariant, fontFamily: "'IBM Plex Sans Arabic', sans-serif", whiteSpace: 'nowrap' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                        <Calendar style={{ width: 13, height: 13, color: S.outline, flexShrink: 0 }} />
                                                        {tx.date ? new Date(tx.date).toLocaleDateString('ar') : '—'}
                                                    </div>
                                                </td>
                                                <td style={{ padding: '14px 16px', fontSize: '13px', color: S.onBackground, fontFamily: "'IBM Plex Sans Arabic', sans-serif' " }}>
                                                    <span style={{ fontWeight: 600, fontFamily: "'IBM Plex Sans Arabic', sans-serif" }}>{tx.ref || '—'}</span>
                                                </td>
                                                <td style={{ padding: '14px 16px', fontSize: '13px', color: S.onSurfaceVariant, fontFamily: "'IBM Plex Sans Arabic', sans-serif" }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                        <CreditCard style={{ width: 13, height: 13, color: S.outline }} />
                                                        {tx.method || '—'}
                                                    </div>
                                                </td>
                                                <td style={{ padding: '14px 16px', fontFamily: "'IBM Plex Sans Arabic', sans-serif" }}>
                                                    <span style={{ fontSize: '15px', fontWeight: 700, color: S.primaryContainer }}>
                                                        ${Number(tx.amount || 0).toLocaleString()}
                                                    </span>
                                                </td>
                                                <td style={{ padding: '14px 16px' }}>
                                                    <StatusPill status={tx.status} t={t} />
                                                </td>
                                            </motion.tr>
                                        ))}
                                    </AnimatePresence>
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div style={{ padding: '16px 24px', borderTop: `1px solid ${S.outlineVariant}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontSize: '13px', color: S.outline, fontFamily: "'IBM Plex Sans Arabic', sans-serif" }}>
                                    {t('financial.page_of').replace('{current}', currentPage).replace('{total}', totalPages)}
                                </span>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    {[...Array(totalPages)].map((_, i) => (
                                        <button
                                            key={i}
                                            onClick={() => setCurrentPage(i + 1)}
                                            style={{
                                                width: '36px', height: '36px', borderRadius: '8px', border: 'none', cursor: 'pointer',
                                                background: currentPage === i + 1 ? S.primaryContainer : S.surfaceContainerLow,
                                                color: currentPage === i + 1 ? '#fff' : S.onSurfaceVariant,
                                                fontSize: '13px', fontWeight: 700, fontFamily: "'IBM Plex Sans Arabic', sans-serif",
                                            }}
                                        >
                                            {i + 1}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </>
                )}
            </motion.div>
        </div>
    );
};

export default AdvertiserFinancials;
