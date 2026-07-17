import React, { useState, useEffect } from 'react';
import { Wallet, ArrowDownRight, ArrowUpRight } from 'lucide-react';
import axiosClient from '../../core/api/axiosClient';
import { ENDPOINTS } from '../../core/api/endpoints';
import PageHeader from '../../shared/components/PageHeader';
import DataTable from '../../shared/components/DataTable';
import DynamicPageLoader from '../../shared/components/DynamicPageLoader';
import { motion } from 'framer-motion';
import useTranslation from '../../i18n/useTranslation';

const AdvertiserFinancials = () => {
    const [data, setData] = useState({ approved_balance: 0, total_payments: 0, transactions: [] });
    const [loading, setLoading] = useState(true);
    const { t, dir } = useTranslation();

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
        { key: 'date', header: t('financial.date'), accessorKey: 'date' },
        { key: 'method', header: t('financial.payment_method'), accessorKey: 'method' },
        { key: 'ref', header: t('financial.reference'), accessorKey: 'ref' },
        { key: 'amount', header: t('financial.amount'), render: (row) => `$${row.amount}` },
        { key: 'status', header: t('financial.status'), cell: (row) => (
            <span className={`px-2 py-1 rounded-full text-[10px] font-bold text-white ${
                row.status === 'معتمدة' ? 'bg-[#2E7D32]' : 
                row.status === 'مرفوضة' ? 'bg-red-600' : 'bg-[var(--color-gold)]'
            }`}>
                {row.status === 'معتمدة' ? t('financial.status_approved') :
                 row.status === 'مرفوضة' ? t('financial.status_rejected') :
                 row.status === 'قيد الانتظار' ? t('financial.status_pending') : row.status}
            </span>
        )},
    ];


    return (
        <div className="space-y-6" dir={dir}>
            <PageHeader 
                title={
                    <span className="flex items-center gap-3">
                        <Wallet className="w-7 h-7 text-[var(--color-dark-turquoise)]" /> {t('financial.history')}
                    </span>
                }
                description={t('financial.history_desc')}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white border-[2.5px] border-[var(--color-dark-turquoise)] rounded-lg p-6 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-sm font-bold text-gray-500 mb-1">{t('financial.approved_balance')}</p>
                        <h2 className="text-3xl font-black text-[var(--color-dark-turquoise)]">${data.approved_balance || 0}</h2>
                    </div>
                    <div className="p-4 bg-[var(--color-dark-turquoise)]/10 rounded-full">
                        <ArrowDownRight className="w-8 h-8 text-[#2E7D32]" />
                    </div>
                </div>

                <div className="bg-white border-[2.5px] border-[var(--color-dark-turquoise)] rounded-lg p-6 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-sm font-bold text-gray-500 mb-1">{t('financial.total_payments')}</p>
                        <h2 className="text-3xl font-black text-[var(--color-dark-turquoise)]">${data.total_payments || 0}</h2>
                    </div>
                    <div className="p-4 bg-[var(--color-dark-turquoise)]/10 rounded-full">
                        <ArrowUpRight className="w-8 h-8 text-[var(--color-gold)]" />
                    </div>
                </div>
            </div>

            {loading ? (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-center py-20" dir={dir}>
                    <DynamicPageLoader 
                        messages={[
                            t('financial.loading_msg_1'), 
                            t('financial.loading_msg_2'),
                            t('financial.loading_msg_3')
                        ]}
                        icon="account_balance_wallet"
                    />
                </motion.div>
            ) : (
                <DataTable columns={columns} data={data.transactions} loading={false} emptyMessage={t('financial.no_transactions')} />
            )}
        </div>
    );
};

export default AdvertiserFinancials;
