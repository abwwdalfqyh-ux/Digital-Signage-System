const fs = require('fs');
const file = 'd:/projects/Digital-Signage-System-main/Digital-Signage-System-main/src/modules/financial/OwnerEarningsPage.jsx';
let content = fs.readFileSync(file, 'utf8');

// Replace imports to add useEffect, axiosClient, ENDPOINTS
content = content.replace(
    /import React, \{ useState \} from 'react';/,
    import React, { useState, useEffect } from 'react';\nimport axiosClient from '../../core/api/axiosClient';\nimport { ENDPOINTS } from '../../core/api/endpoints';
);

// Replace mock data block with actual state and useEffect
const mockDataBlockRegex = /\/\/ ─── 1\. MOCK DATA \(Until Backend is Connected\) ───[\s\S]*?(?=\/\/ ─── 2\. STATE & UI CONTROLS ───)/;

const newBlock = // ─── 1. DATA FROM BACKEND ───
    const [balance, setBalance] = useState(0);
    const [totalEarned, setTotalEarned] = useState(0);
    const [pendingPayouts, setPendingPayouts] = useState(0);
    const [transactions, setTransactions] = useState([]);
    const [isFetching, setIsFetching] = useState(true);

    const fetchEarnings = async () => {
        setIsFetching(true);
        try {
            const res = await axiosClient.get(ENDPOINTS.FINANCIAL.MY_EARNINGS);
            const data = res.data.data;
            setBalance(data.available_balance || 0);
            setTotalEarned(data.total_earnings || 0);
            
            // pending payouts can be calculated from pending_logs or we can just sum payout_requested
            // but wait, the backend didn't return pending_requested. It returns pending_logs which are payout_pending logs.
            // Let's just calculate pending payouts from transactions with status pending and type payout
            
            const logs = data.pending_logs || [];
            
            const formattedTx = logs.map(log => {
                let type = 'earning';
                if (log.transaction_type === 'payout_requested' || log.transaction_type === 'payout_completed' || log.transaction_type === 'payout_rejected') {
                    type = 'payout';
                }
                
                let source = log.notes || 'معاملة مالية';
                if (log.advertisement) {
                     source = 'إعلان: ' + log.advertisement.title;
                }
                
                return {
                    id: log.ledger_id,
                    type: type,
                    amount: Math.abs(log.amount),
                    source: source,
                    date: new Date(log.created_at).toLocaleString('ar-EG'),
                    status: log.status
                };
            });
            
            setTransactions(formattedTx);
            
            const pendingTotal = formattedTx.filter(t => t.type === 'payout' && t.status === 'pending').reduce((sum, t) => sum + t.amount, 0);
            setPendingPayouts(pendingTotal);

        } catch (error) {
            console.error('Failed to fetch earnings', error);
        } finally {
            setIsFetching(false);
        }
    };

    useEffect(() => {
        fetchEarnings();
    }, []);

    ;

content = content.replace(mockDataBlockRegex, newBlock);

// Replace handleRequestPayout
const handleRequestPayoutRegex = /const handleRequestPayout = \(e\) => \{[\s\S]*?\};/;
const newHandlePayout = const handleRequestPayout = async (e) => {
        e.preventDefault();
        const amt = parseFloat(payoutForm.amount);
        if (amt > balance) return addToast('المبلغ المطلوب يتخطى الرصيد المتاح!', 'error');
        if (amt < 50) return addToast('الحد الأدنى للسحب هو ', 'warning');

        setLoading(true);
        try {
            await axiosClient.post(ENDPOINTS.FINANCIAL.REQUEST_PAYOUT, {
                amount: amt,
                bank_name: payoutForm.bank,
                account_number: payoutForm.account_number
            });
            addToast('تم رفع طلب السحب للمراجعة بنجاح', 'success');
            setPayoutModalOpen(false);
            setPayoutForm({ amount: '', bank: '', account_number: '' });
            fetchEarnings();
        } catch (error) {
            addToast(error.response?.data?.message || 'فشلت عملية طلب السحب', 'error');
        } finally {
            setLoading(false);
        }
    };;

content = content.replace(handleRequestPayoutRegex, newHandlePayout);

fs.writeFileSync(file, content);
console.log('Successfully updated OwnerEarningsPage.jsx');

