import React from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Mail, Phone, Edit, Lock, LogOut, ShieldCheck } from 'lucide-react';
import useAuthStore from '../../store/useAuthStore';
import axiosClient from '../../core/api/axiosClient';

const AdminProfilePage = () => {
    const navigate = useNavigate();
    const { user, logout } = useAuthStore();

    const handleLogout = async () => {
        if (window.confirm('هل أنت متأكد أنك تريد الخروج من التطبيق؟')) {
            try {
                await axiosClient.post('/logout');
            } catch (e) {
                console.error('Logout API failed', e);
            } finally {
                logout();
                navigate('/login');
            }
        }
    };

    const fullName = user?.full_name || 'مدير النظام';
    const email = user?.email || 'غير متوفر';
    const phone = user?.phone || 'غير متوفر';
    const roleName = user?.role?.role_name || 'Admin';

    const InfoCard = ({ icon: Icon, title, value }) => (
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex items-center gap-4 hover:border-[var(--color-dark-turquoise)]/30 transition-colors">
            <div className="w-12 h-12 rounded-full bg-[var(--color-dark-turquoise)]/10 flex items-center justify-center text-[var(--color-dark-turquoise)] shrink-0">
                <Icon className="w-6 h-6" />
            </div>
            <div>
                <p className="text-xs text-gray-500 font-bold mb-1">{title}</p>
                <p className="text-base font-black text-gray-800">{value}</p>
            </div>
        </div>
    );

    const ActionItem = ({ icon: Icon, title, onClick, isDestructive }) => (
        <button
            onClick={onClick}
            className={`w-full flex items-center justify-between p-5 bg-white rounded-2xl border border-gray-100 shadow-sm transition-all hover:shadow-md ${
                isDestructive ? 'hover:border-red-200 group' : 'hover:border-[var(--color-dark-turquoise)]/30'
            }`}
        >
            <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    isDestructive ? 'bg-red-50 text-red-500 group-hover:bg-red-500 group-hover:text-white transition-colors' : 'bg-gray-50 text-gray-600'
                }`}>
                    <Icon className="w-5 h-5" />
                </div>
                <span className={`font-bold ${isDestructive ? 'text-red-600' : 'text-gray-800'}`}>
                    {title}
                </span>
            </div>
            <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400">
                <svg className="w-4 h-4 rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
            </div>
        </button>
    );

    return (
        <div className="max-w-3xl mx-auto space-y-6 animate-fade-in pb-12" dir="rtl">
            {/* Header / Avatar Section */}
            <div className="bg-[var(--color-dark-turquoise)] rounded-3xl p-8 relative overflow-hidden shadow-lg shadow-[var(--color-dark-turquoise)]/20">
                {/* Decorative background elements */}
                <div className="absolute top-0 left-0 w-64 h-64 bg-white/5 rounded-full -translate-x-1/2 -translate-y-1/2"></div>
                <div className="absolute bottom-0 right-0 w-48 h-48 bg-[var(--color-gold)]/10 rounded-full translate-x-1/4 translate-y-1/4"></div>
                
                <div className="relative z-10 flex flex-col items-center">
                    <div className="w-28 h-28 rounded-full bg-white p-1.5 shadow-xl mb-4">
                        <div className="w-full h-full rounded-full bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400">
                            <User className="w-12 h-12" />
                        </div>
                    </div>
                    <h1 className="text-2xl font-black text-white mb-2">{fullName}</h1>
                    <div className="flex items-center gap-2 px-4 py-1.5 bg-[var(--color-gold)] text-white rounded-full text-sm font-bold shadow-sm">
                        <ShieldCheck className="w-4 h-4" />
                        {roleName}
                    </div>
                </div>
            </div>

            {/* User Info Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InfoCard icon={Mail} title="البريد الإلكتروني" value={email} />
                <InfoCard icon={Phone} title="رقم الهاتف" value={phone} />
            </div>

            {/* Actions List */}
            <div className="space-y-3 pt-4">
                <h3 className="text-lg font-black text-gray-800 mb-4 px-2">إعدادات الحساب</h3>
                
                <ActionItem 
                    icon={Edit} 
                    title="تعديل البيانات الشخصية" 
                    onClick={() => navigate('/dashboard/settings')} 
                />
                <ActionItem 
                    icon={Lock} 
                    title="تغيير كلمة المرور" 
                    onClick={() => navigate('/dashboard/settings')} 
                />
                <ActionItem 
                    icon={LogOut} 
                    title="تسجيل الخروج" 
                    isDestructive={true} 
                    onClick={handleLogout} 
                />
            </div>
        </div>
    );
};

export default AdminProfilePage;
