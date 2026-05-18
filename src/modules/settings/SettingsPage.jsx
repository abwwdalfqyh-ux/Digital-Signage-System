import React from 'react';
import { Settings, User, Bell, Shield, Paintbrush } from 'lucide-react';
import useAuthStore from '../../store/useAuthStore';
import PageHeader from '../../shared/components/PageHeader';

const SettingsSection = ({ title, icon: Icon, children }) => (
    <div className="bg-white border-[2.5px] border-[var(--color-dark-turquoise)] rounded-lg shadow-sm overflow-hidden mb-6">
        <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-200 bg-[var(--color-bg-light)]">
            <Icon className="w-5 h-5 text-[var(--color-gold)]" />
            <h3 className="text-lg font-bold text-[var(--color-dark-turquoise)]">{title}</h3>
        </div>
        <div className="p-6">
            {children}
        </div>
    </div>
);

const SettingsPage = () => {
    const { user } = useAuthStore();

    return (
        <div className="space-y-6 max-w-4xl mx-auto" dir="rtl">
            <PageHeader 
                title={
                    <span className="flex items-center gap-3">
                        <Settings className="w-7 h-7 text-[var(--color-dark-turquoise)]" /> الإعدادات
                    </span>
                }
                description="تخصيص إعدادات الحساب والنظام"
            />

            <SettingsSection title="معلومات الحساب" icon={User}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">الاسم الكامل</label>
                        <input 
                            type="text" 
                            disabled 
                            value={user?.full_name || ''} 
                            className="w-full bg-gray-100 border border-gray-300 rounded-lg py-2.5 px-4 text-sm text-gray-500 cursor-not-allowed text-right"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">البريد الإلكتروني</label>
                        <input 
                            type="email" 
                            disabled 
                            value={user?.email || ''} 
                            className="w-full bg-gray-100 border border-gray-300 rounded-lg py-2.5 px-4 text-sm text-gray-500 cursor-not-allowed text-right"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">رقم الهاتف</label>
                        <input 
                            type="text" 
                            disabled 
                            value={user?.phone || '—'} 
                            className="w-full bg-gray-100 border border-gray-300 rounded-lg py-2.5 px-4 text-sm text-gray-500 cursor-not-allowed text-right"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">الدور / الصلاحية</label>
                        <div className="w-full bg-gray-100 border border-gray-300 rounded-lg py-2.5 px-4 text-sm text-gray-500 cursor-not-allowed flex items-center gap-2">
                            <Shield className="w-4 h-4 text-gray-400" />
                            {user?.role?.role_name || '—'}
                        </div>
                    </div>
                </div>
            </SettingsSection>

            <SettingsSection title="تفضيلات الإشعارات" icon={Bell}>
                <div className="space-y-4">
                    <label className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                        <div>
                            <p className="font-bold text-gray-800 text-sm">إشعارات البريد الإلكتروني</p>
                            <p className="text-xs text-gray-500 mt-1">تلقي تحديثات أسبوعية حول أداء الإعلانات</p>
                        </div>
                        <input type="checkbox" className="w-5 h-5 accent-[var(--color-dark-turquoise)] rounded" defaultChecked />
                    </label>
                    <label className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                        <div>
                            <p className="font-bold text-gray-800 text-sm">إشعارات النظام</p>
                            <p className="text-xs text-gray-500 mt-1">إشعارات عند الموافقة على أو رفض إعلان</p>
                        </div>
                        <input type="checkbox" className="w-5 h-5 accent-[var(--color-dark-turquoise)] rounded" defaultChecked />
                    </label>
                </div>
            </SettingsSection>
            
            <div className="flex justify-end pt-4 pb-12">
                <button className="bg-[var(--color-dark-turquoise)] hover:opacity-90 text-white font-bold px-8 py-3 rounded-full transition-opacity shadow-sm">
                    حفظ التغييرات
                </button>
            </div>
        </div>
    );
};

export default SettingsPage;
