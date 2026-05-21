import React, { useState, useEffect } from 'react';
import { Monitor, PlayCircle, Clock, Settings, Search } from 'lucide-react';
import axiosClient from '../../core/api/axiosClient';

const StatCard = ({ title, value, icon: Icon }) => (
    <div className="flex flex-col items-center justify-center p-3 h-[105px] bg-white rounded-lg border-[2.5px] border-[var(--color-dark-turquoise)]">
        <Icon className="w-5 h-5 text-[var(--color-gold)] mb-1" />
        <p className="text-[10px] md:text-xs font-bold text-[var(--color-dark-turquoise)] text-center leading-tight mb-2">
            {title}
        </p>
        <p className="text-sm md:text-lg font-black text-[var(--color-dark-turquoise)]">
            {value}
        </p>
    </div>
);

const HealthCard = ({ title, value, icon: Icon }) => (
    <div className="flex flex-col items-center justify-center p-3 h-[105px] bg-white rounded-lg border-[2.5px] border-[var(--color-dark-turquoise)]">
        <Icon className="w-5 h-5 text-[var(--color-gold)] mb-1" />
        <p className="text-[10px] md:text-xs font-bold text-[var(--color-dark-turquoise)] text-center leading-tight mb-2">
            {title}
        </p>
        <div className="bg-[#2E7D32] px-3 py-0.5 rounded-full">
            <span className="text-[10px] md:text-xs font-bold text-white">{value}</span>
        </div>
    </div>
);

const SectionHeader = ({ title }) => (
    <div className="flex items-center justify-between bg-[var(--color-dark-turquoise)] px-4 py-2.5 rounded-t-lg mt-6">
        <h3 className="text-sm font-bold text-white">{title}</h3>
        <Search className="w-5 h-5 text-white" />
    </div>
);

const Dashboard = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDashboard = async () => {
            try {
                const res = await axiosClient.get('/dashboard/overview');
                setData(res.data.data || res.data);
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };
        fetchDashboard();
    }, []);

    if (loading) {
        return (
            <div className="flex justify-center py-20">
                <div className="w-10 h-10 border-4 border-gray-200 border-t-[var(--color-dark-turquoise)] rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="space-y-4" dir="rtl">
            {/* KPI Cards (Matches Flutter Row of 4 Expanded widgets) */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3">
                <StatCard 
                    title="الشاشات النشطة" 
                    value={data?.active_screens_count || '0'} 
                    icon={Monitor} 
                />
                <StatCard 
                    title={<>الإعلانات<br />المعروضة حالياً</>} 
                    value={data?.active_ads_count || '0'} 
                    icon={PlayCircle} 
                />
                <StatCard 
                    title={<>معدل التشغيل<br />اليومي</>} 
                    value={data?.total_daily_plays || '0'} 
                    icon={Clock} 
                />
                <HealthCard 
                    title="صحة الشبكة" 
                    value="ممتاز" 
                    icon={Settings} 
                />
            </div>

            {/* Recent Campaigns Table (Flutter style) */}
            <div>
                <SectionHeader title="أداء الحملات الإعلانية النشطة" />
                <div className="bg-white border-[2.5px] border-t-0 border-[var(--color-dark-turquoise)] rounded-b-lg overflow-x-auto">
                    <table className="w-full text-center">
                        <thead>
                            <tr className="border-b border-gray-300">
                                <th className="py-2 px-1 text-[10px] md:text-xs font-black text-gray-800">اسم الحملة</th>
                                <th className="py-2 px-1 text-[10px] md:text-xs font-black text-gray-800">المعلن</th>
                                <th className="py-2 px-1 text-[10px] md:text-xs font-black text-gray-800">التكلفة</th>
                                <th className="py-2 px-1 text-[10px] md:text-xs font-black text-gray-800">الحالة</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data?.recent_campaigns?.map((campaign, idx) => (
                                <tr key={idx}>
                                    <td className="py-3 px-1 text-[10px] md:text-xs font-bold text-gray-800">{campaign.title || 'حملة بدون عنوان'}</td>
                                    <td className="py-3 px-1 text-[10px] md:text-xs font-bold text-gray-800">{campaign.user?.full_name || '—'}</td>
                                    <td className="py-3 px-1 text-[10px] md:text-xs font-bold text-gray-800">${campaign.total_cost || '0'}</td>
                                    <td className="py-3 px-1">
                                        <span className={`text-white text-[9px] md:text-[10px] font-bold px-2 py-1 rounded ${
                                            campaign.status === 'Active' ? 'bg-[#2E7D32]' : 
                                            campaign.status === 'Pending' ? 'bg-[var(--color-gold)]' : 'bg-gray-500'
                                        }`}>
                                            {campaign.status === 'Active' ? 'أخضر نشط' : campaign.status === 'Pending' ? 'أصفر مراجعة' : campaign.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                            {!data?.recent_campaigns?.length && (
                                <tr>
                                    <td colSpan="4" className="py-6 text-xs text-gray-500 font-bold">لا يوجد حملات حالية</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Recent Logs (Flutter style screens table) */}
            <div>
                <SectionHeader title="حالة ونشاط الشاشات" />
                <div className="bg-white border-[2.5px] border-t-0 border-[var(--color-dark-turquoise)] rounded-b-lg overflow-x-auto">
                    <table className="w-full text-center">
                        <thead>
                            <tr className="border-b border-gray-300">
                                <th className="py-2 px-1 text-[10px] md:text-xs font-black text-gray-800">الشاشة/الموقع</th>
                                <th className="py-2 px-1 text-[10px] md:text-xs font-black text-gray-800">آخر نشاط</th>
                                <th className="py-2 px-1 text-[10px] md:text-xs font-black text-gray-800">الإعلان</th>
                                <th className="py-2 px-1 text-[10px] md:text-xs font-black text-gray-800">الحالة</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data?.recent_logs?.map((log, idx) => (
                                <tr key={idx} className="border-b border-gray-100 last:border-0">
                                    <td className="py-3 px-1 text-[10px] md:text-xs font-bold text-gray-800">{log.screen?.screen_name || '—'}</td>
                                    <td className="py-3 px-1 text-[10px] md:text-xs font-bold text-gray-800">{log.played_at}</td>
                                    <td className="py-3 px-1 text-[10px] md:text-xs font-bold text-gray-800 truncate max-w-[100px]">{log.advertisement?.title || '—'}</td>
                                    <td className="py-3 px-1">
                                        <span className="bg-[#2E7D32] text-white text-[9px] md:text-[10px] font-bold px-2 py-1 rounded">أخضر نشط</span>
                                    </td>
                                </tr>
                            ))}
                            {!data?.recent_logs?.length && (
                                <tr>
                                    <td colSpan="4" className="py-6 text-xs text-gray-500 font-bold">لا يوجد نشاط</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
            
            <div className="h-10"></div>
        </div>
    );
};

export default Dashboard;
