import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Banknote, DollarSign, ArrowDownCircle } from 'lucide-react';
import axiosClient from '../../core/api/axiosClient';

const OwnerEarningsPage = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetch = async () => { try { const r = await axiosClient.get('/financial/my-earnings'); setData(r.data.data); } catch(e){} finally { setLoading(false); } };
        fetch();
    }, []);

    if (loading) return <div className="flex justify-center py-20"><div className="w-10 h-10 border-4 border-white/10 border-t-indigo-500 rounded-full animate-spin"></div></div>;

    return (
        <div className="space-y-6" dir="rtl">
            <div>
                <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-3"><Banknote className="w-7 h-7 text-emerald-400" /> أرباحي</h1>
                <p className="text-sm text-gray-500 font-bold mt-1">تتبع أرباحك من الشاشات المسجلة</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-[#121215]/60 backdrop-blur-xl border border-white/5 rounded-3xl p-6">
                    <p className="text-xs text-gray-500 font-bold mb-2">إجمالي الأرباح</p>
                    <p className="text-3xl font-black text-emerald-400">${(data?.total_earned || 0).toLocaleString()}</p>
                </motion.div>
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-[#121215]/60 backdrop-blur-xl border border-white/5 rounded-3xl p-6">
                    <p className="text-xs text-gray-500 font-bold mb-2">المسحوب</p>
                    <p className="text-3xl font-black text-white">${(data?.withdrawn || 0).toLocaleString()}</p>
                </motion.div>
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-[#121215]/60 backdrop-blur-xl border border-indigo-500/20 rounded-3xl p-6">
                    <p className="text-xs text-gray-500 font-bold mb-2">الرصيد المتبقي</p>
                    <p className="text-3xl font-black text-indigo-400">${(data?.balance || 0).toLocaleString()}</p>
                </motion.div>
            </div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-[#121215]/60 backdrop-blur-xl border border-white/5 rounded-3xl overflow-hidden">
                <div className="p-6 border-b border-white/5"><h3 className="text-sm font-black text-white">سجل الأرباح</h3></div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead><tr className="border-b border-white/5">
                            <th className="px-6 py-3 text-right text-xs font-bold text-gray-500">الإعلان</th>
                            <th className="px-6 py-3 text-right text-xs font-bold text-gray-500">المبلغ</th>
                            <th className="px-6 py-3 text-right text-xs font-bold text-gray-500">التاريخ</th>
                        </tr></thead>
                        <tbody>
                            {(data?.history || []).map((item, i) => (
                                <tr key={i} className="border-b border-white/[0.02]">
                                    <td className="px-6 py-4 text-sm text-white font-bold">{item.advertisement?.title || '—'}</td>
                                    <td className="px-6 py-4 text-sm text-emerald-400 font-black">${item.amount}</td>
                                    <td className="px-6 py-4 text-xs text-gray-600">{item.created_at}</td>
                                </tr>
                            ))}
                            {(!data?.history || data.history.length === 0) && <tr><td colSpan={3} className="px-6 py-12 text-center text-gray-600 text-sm">لا توجد أرباح بعد</td></tr>}
                        </tbody>
                    </table>
                </div>
            </motion.div>
        </div>
    );
};

export default OwnerEarningsPage;
