import React, { useState, useEffect } from 'react';
import { Wallet, ArrowDownRight, ArrowUpRight } from 'lucide-react';
import axiosClient from '../../core/api/axiosClient';
import { ENDPOINTS } from '../../core/api/endpoints';
import PageHeader from '../../shared/components/PageHeader';
import DataTable from '../../shared/components/DataTable';
import DynamicPageLoader from '../../shared/components/DynamicPageLoader';
import { motion } from 'framer-motion';

const AdvertiserFinancials = () => {
    const [data, setData] = useState({ approved_balance: 0, total_payments: 0, transactions: [] });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchFinancials = async () => {
            try {
                const res = await axiosClient.get(ENDPOINTS.ADVERTISER.FINANCIALS);
                setData(res.data.data);
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };
        fetchFinancials();
    }, []);

    const columns = [
        { key: 'date', header: 'التاريخ', accessorKey: 'date' },
        { key: 'method', header: 'طريقة الدفع', accessorKey: 'method' },
        { key: 'ref', header: 'المرجع', accessorKey: 'ref' },
        { key: 'amount', header: 'المبلغ', render: (row) => `$${row.amount}` },
        { key: 'status', header: 'الحالة', cell: (row) => (
            <span className={`px-2 py-1 rounded-full text-[10px] font-bold text-white ${
                row.status === 'معتمدة' ? 'bg-[#2E7D32]' : 
                row.status === 'مرفوضة' ? 'bg-red-600' : 'bg-[var(--color-gold)]'
            }`}>
                {row.status}
            </span>
        )},
    ];


    return (
        <div className="space-y-6" dir="rtl">
            <PageHeader 
                title={
                    <span className="flex items-center gap-3">
                        <Wallet className="w-7 h-7 text-[var(--color-dark-turquoise)]" /> السجل المالي
                    </span>
                }
                description="عرض سجل مدفوعاتك ورصيدك"
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white border-[2.5px] border-[var(--color-dark-turquoise)] rounded-lg p-6 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-sm font-bold text-gray-500 mb-1">الرصيد المعتمد</p>
                        <h2 className="text-3xl font-black text-[var(--color-dark-turquoise)]">${data.approved_balance || 0}</h2>
                    </div>
                    <div className="p-4 bg-[var(--color-dark-turquoise)]/10 rounded-full">
                        <ArrowDownRight className="w-8 h-8 text-[#2E7D32]" />
                    </div>
                </div>

                <div className="bg-white border-[2.5px] border-[var(--color-dark-turquoise)] rounded-lg p-6 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-sm font-bold text-gray-500 mb-1">إجمالي المدفوعات</p>
                        <h2 className="text-3xl font-black text-[var(--color-dark-turquoise)]">${data.total_payments || 0}</h2>
                    </div>
                    <div className="p-4 bg-[var(--color-dark-turquoise)]/10 rounded-full">
                        <ArrowUpRight className="w-8 h-8 text-[var(--color-gold)]" />
                    </div>
                </div>
            </div>

            {loading ? (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-center py-20" dir="rtl">
                    <DynamicPageLoader 
                        messages={[
                            "جاري معالجة سجلاتك المالية...", 
                            "يتم تدقيق أرصدة الحملات الإعلانية...",
                            "لحظات ونعرض واجهة الدفع الخاصة بك..."
                        ]}
                        icon="account_balance_wallet"
                    />
                </motion.div>
            ) : (
                <DataTable columns={columns} data={data.transactions} loading={false} emptyMessage="لا توجد عمليات مالية" />
            )}
        </div>
    );
};

export default AdvertiserFinancials;
