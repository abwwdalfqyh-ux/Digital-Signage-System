import React, { useState, useEffect } from 'react';
import useAuthStore from '../../store/useAuthStore';
import useToastStore from '../../store/useToastStore';
import { motion, AnimatePresence } from 'framer-motion';
import axiosClient from '../../core/api/axiosClient';
import { ENDPOINTS } from '../../core/api/endpoints';
import { useSettings, useUpdateSettings } from '../../hooks/api/useSettings';
import useTranslation from '../../i18n/useTranslation';

const SettingsPage = () => {
    const { user } = useAuthStore();
    const addToast = useToastStore(state => state.addToast);
    
    const { data: systemSettings, isLoading: isLoadingSettings } = useSettings();
    const { mutate: updateSettings, isPending: isUpdatingSettings } = useUpdateSettings();
    const { t, dir } = useTranslation();

    const [activeTab, setActiveTab] = useState('profile');
    const [emailNotif, setEmailNotif] = useState(true);
    const [systemNotif, setSystemNotif] = useState(true);
    const [isDownloading, setIsDownloading] = useState(false);

    const [formData, setFormData] = useState({
        full_name: user?.full_name || '',
        email: user?.email || '',
        phone: user?.phone || '',
    });

    const [passwordData, setPasswordData] = useState({
        current_password: '',
        new_password: '',
    });
    const [isSavingPassword, setIsSavingPassword] = useState(false);

    const [sysSettings, setSysSettings] = useState({
        platform_name: 'Sabapost',
        support_email: 'support@sabapost.com',
        support_phone: '+967 000 000',
        maintenance_mode: false,
        currency_rate: 1,
        platform_commission: 20,
        min_withdrawal: 50,
        heartbeat_interval: 30,
        smtp_host: 'smtp.mailtrap.io',
        smtp_port: 2525,
        smtp_user: '',
        smtp_pass: '',
        backup_disk: 'local',
        auto_backup_schedule: 'daily',
    });

    const [originalData, setOriginalData] = useState({ ...formData });
    const [originalSysSettings, setOriginalSysSettings] = useState({ ...sysSettings });

    useEffect(() => {
        if (systemSettings) {
            const parsedSettings = {
                ...sysSettings,
                ...systemSettings,
                maintenance_mode: systemSettings.maintenance_mode === 'true' || systemSettings.maintenance_mode === true,
            };
            setSysSettings(parsedSettings);
            setOriginalSysSettings(parsedSettings);
        }
    }, [systemSettings]);

    const isProfileDirty = formData.email !== originalData.email || formData.phone !== originalData.phone || formData.full_name !== originalData.full_name;
    const isSystemDirty = JSON.stringify(sysSettings) !== JSON.stringify(originalSysSettings);

    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
    const handleSysChange = (e) => {
        const { name, value, type, checked } = e.target;
        setSysSettings(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    };

    const handleSaveProfile = async () => {
        if (!isProfileDirty) return;
        try {
            const res = await axiosClient.put(ENDPOINTS.AUTH.UPDATE_PROFILE, {
                full_name: formData.full_name, email: formData.email, phone: formData.phone
            });
            useAuthStore.getState().setUser(res.data.user);
            setOriginalData({ ...formData });
            addToast(t('settings.profile_saved'), 'success');
        } catch (error) {
            addToast(error.response?.data?.message || t('settings.profile_save_error'), 'error');
        }
    };

    const handleSavePassword = async () => {
        if (!passwordData.current_password || !passwordData.new_password) return;
        setIsSavingPassword(true);
        try {
            const res = await axiosClient.put(ENDPOINTS.AUTH.CHANGE_PASSWORD, passwordData);
            addToast(res.data.message || t('settings.password_changed'), 'success');
            setPasswordData({ current_password: '', new_password: '' });
        } catch (error) {
            addToast(error.response?.data?.message || t('settings.password_change_error'), 'error');
        } finally {
            setIsSavingPassword(false);
        }
    };

    const handleSaveSystemSettings = () => {
        if (!isSystemDirty) return;
        updateSettings(sysSettings, {
            onSuccess: () => {
                setOriginalSysSettings({ ...sysSettings });
                addToast(t('settings.system_settings_saved'), 'success');
            },
            onError: (err) => addToast(err.response?.data?.message || t('settings.system_settings_error'), 'error')
        });
    };

    const handleDownloadBackup = async () => {
        try {
            setIsDownloading(true);
            const response = await axiosClient.get('/settings/backup/download', {
                responseType: 'blob',
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            const contentDisposition = response.headers['content-disposition'];
            let fileName = 'database_backup.json';
            if (contentDisposition) {
                const fileNameMatch = contentDisposition.match(/filename="(.+)"/);
                if (fileNameMatch && fileNameMatch.length === 2) fileName = fileNameMatch[1];
            }
            link.setAttribute('download', fileName);
            document.body.appendChild(link);
            link.click();
            link.remove();
            addToast(t('settings.backup_download_success'), 'success');
        } catch (error) {
            addToast(t('settings.backup_download_error'), 'error');
        } finally {
            setIsDownloading(false);
        }
    };

    const tabs = [
        { id: 'profile', label: t('settings.tab_profile'), icon: 'person' },
        { id: 'general', label: t('settings.tab_general'), icon: 'settings' },
        { id: 'financial', label: t('settings.tab_financial'), icon: 'payments' },
        { id: 'technical', label: t('settings.tab_technical'), icon: 'memory' },
        { id: 'backup', label: t('settings.tab_backup'), icon: 'cloud_sync' },
    ];

    if (isLoadingSettings && user?.role?.role_name !== 'ScreenOwner' && user?.role?.role_name !== 'Advertiser') {
        return <div className="flex justify-center items-center h-64"><div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>;
    }

    return (
        <div className="space-y-6 pb-8 font-sans w-full max-w-5xl mx-auto" dir={dir}>
            <div className="flex items-center gap-4 mb-2">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center text-white shadow-lg">
                    <span className="material-symbols-outlined text-[26px]">manage_accounts</span>
                </div>
                <h1 className="text-2xl font-black text-on-surface">{user?.role_id === 1 || user?.role_id === 7 ? t('settings.title_admin') : t('settings.title_personal')}</h1>
            </div>

            {(user?.role_id === 1 || user?.role_id === 7) && (
                <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
                    {tabs.map(tab => (
                        <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-bold transition-all whitespace-nowrap ${activeTab === tab.id ? 'bg-primary text-white shadow-md' : 'text-on-surface-variant hover:bg-surface-container'}`}>
                            <span className="material-symbols-outlined text-[20px]">{tab.icon}</span>{tab.label}
                        </button>
                    ))}
                </div>
            )}

            <AnimatePresence mode="wait">
                <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
                    
                    {activeTab === 'profile' && (
                        <div className="space-y-6">
                            <div className="bg-surface-container-lowest rounded-3xl border border-outline-variant p-6 md:p-8 space-y-6 shadow-sm">
                                <h3 className="text-lg font-extrabold text-on-surface flex items-center gap-3 border-b border-outline-variant/60 pb-4 mb-6"><span className="material-symbols-outlined text-primary">person</span>{t('settings.identity_security')}</h3>
                                <div className="grid md:grid-cols-2 gap-6">
                                    <div><label className="block text-sm font-bold text-on-surface mb-2">{t('settings.full_name')}</label><input type="text" name="full_name" value={formData.full_name} onChange={handleChange} className="w-full bg-surface-container border border-outline-variant rounded-xl p-3.5" /></div>
                                    <div><label className="block text-sm font-bold text-on-surface mb-2">{t('settings.phone')}</label><input type="text" dir="ltr" name="phone" value={formData.phone} onChange={handleChange} className="w-full bg-surface-container border border-outline-variant rounded-xl p-3.5 font-mono" /></div>
                                    <div className="md:col-span-2"><label className="block text-sm font-bold text-on-surface mb-2">{t('settings.email')}</label><input type="email" dir="ltr" name="email" value={formData.email} onChange={handleChange} className="w-full bg-surface-container border border-outline-variant rounded-xl p-3.5 font-mono" /></div>
                                </div>
                                <div className="flex justify-end mt-4"><button disabled={!isProfileDirty} onClick={handleSaveProfile} className={`px-8 py-3 rounded-xl font-bold text-white transition-all ${!isProfileDirty ? 'bg-outline-variant text-on-surface-variant cursor-not-allowed' : 'bg-primary hover:bg-primary/90 shadow-md'}`}>{t('settings.save_profile')}</button></div>
                            </div>
                            
                            <div className="bg-surface-container-lowest rounded-3xl border border-outline-variant p-6 md:p-8 space-y-6 shadow-sm">
                                <h3 className="text-lg font-extrabold text-on-surface flex items-center gap-3 border-b border-outline-variant/60 pb-4 mb-6"><span className="material-symbols-outlined text-secondary">lock</span>{t('settings.change_password')}</h3>
                                <div className="grid md:grid-cols-2 gap-6">
                                    <div><label className="block text-sm font-bold text-on-surface mb-2">{t('settings.current_password')}</label><input type="password" name="current_password" value={passwordData.current_password} onChange={(e) => setPasswordData({...passwordData, current_password: e.target.value})} className="w-full bg-surface-container border border-outline-variant rounded-xl p-3.5 font-mono" /></div>
                                    <div><label className="block text-sm font-bold text-on-surface mb-2">{t('settings.new_password')}</label><input type="password" name="new_password" value={passwordData.new_password} onChange={(e) => setPasswordData({...passwordData, new_password: e.target.value})} className="w-full bg-surface-container border border-outline-variant rounded-xl p-3.5 font-mono" /></div>
                                </div>
                                <div className="flex justify-end mt-4"><button disabled={!passwordData.current_password || !passwordData.new_password || isSavingPassword} onClick={handleSavePassword} className={`px-8 py-3 rounded-xl font-bold text-white transition-all ${(!passwordData.current_password || !passwordData.new_password || isSavingPassword) ? 'bg-outline-variant text-on-surface-variant cursor-not-allowed' : 'bg-secondary hover:bg-secondary/90 shadow-md flex gap-2 items-center'}`}>{isSavingPassword && <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}{t('settings.update_password')}</button></div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'general' && (
                        <div className="space-y-6">
                            <div className="bg-surface-container-lowest rounded-3xl border border-outline-variant p-6 shadow-sm">
                                <h3 className="text-lg font-extrabold text-on-surface flex items-center gap-3 border-b border-outline-variant/60 pb-4 mb-6"><span className="material-symbols-outlined text-primary">domain</span>{t('settings.platform_settings')}</h3>
                                <div className="grid md:grid-cols-2 gap-6">
                                    <div className="md:col-span-2"><label className="block text-sm font-bold mb-2">{t('settings.platform_name')}</label><input type="text" name="platform_name" value={sysSettings.platform_name} onChange={handleSysChange} className="w-full bg-surface-container border border-outline-variant rounded-xl p-3.5" /></div>
                                    <div><label className="block text-sm font-bold mb-2">{t('settings.support_email')}</label><input type="email" dir="ltr" name="support_email" value={sysSettings.support_email} onChange={handleSysChange} className="w-full bg-surface-container border border-outline-variant rounded-xl p-3.5 font-mono" /></div>
                                    <div><label className="block text-sm font-bold mb-2">{t('settings.support_phone')}</label><input type="text" dir="ltr" name="support_phone" value={sysSettings.support_phone} onChange={handleSysChange} className="w-full bg-surface-container border border-outline-variant rounded-xl p-3.5 font-mono" /></div>
                                </div>
                                <div className="mt-6 pt-6 border-t border-outline-variant/40">
                                    <div className="flex items-center justify-between bg-error-container/20 p-5 rounded-2xl border border-error/20">
                                        <div><h4 className="font-bold text-error mb-1">{t('settings.maintenance_mode')}</h4><p className="text-sm text-on-surface-variant">{t('settings.maintenance_mode_desc')}</p></div>
                                        <button type="button" onClick={() => setSysSettings(p => ({ ...p, maintenance_mode: !p.maintenance_mode }))} className={`relative inline-flex h-7 w-12 rounded-full transition-colors ${sysSettings.maintenance_mode ? 'bg-error' : 'bg-outline-variant'}`}><span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-transform ${sysSettings.maintenance_mode ? '-translate-x-6' : 'translate-x-0'}`} /></button>
                                    </div>
                                </div>
                            </div>
                            <SystemSaveBar isDirty={isSystemDirty} onRevert={() => setSysSettings({ ...originalSysSettings })} onSave={handleSaveSystemSettings} isPending={isUpdatingSettings} />
                        </div>
                    )}

                    {activeTab === 'financial' && (
                        <div className="space-y-6">
                            <div className="bg-surface-container-lowest rounded-3xl border border-outline-variant p-6 shadow-sm">
                                <h3 className="text-lg font-extrabold text-on-surface flex items-center gap-3 border-b border-outline-variant/60 pb-4 mb-6"><span className="material-symbols-outlined text-emerald-500">payments</span>{t('settings.financial_controls')}</h3>
                                <div className="grid md:grid-cols-2 gap-6">
                                    <div><label className="block text-sm font-bold mb-2">{t('settings.platform_commission')}</label><input type="number" name="platform_commission" value={sysSettings.platform_commission} onChange={handleSysChange} className="w-full bg-surface-container border border-outline-variant rounded-xl p-3.5" /></div>
                                    <div><label className="block text-sm font-bold mb-2">{t('settings.exchange_rate')}</label><input type="number" step="0.01" name="currency_rate" value={sysSettings.currency_rate} onChange={handleSysChange} className="w-full bg-surface-container border border-outline-variant rounded-xl p-3.5" /></div>
                                    <div><label className="block text-sm font-bold mb-2">{t('settings.min_withdrawal')}</label><input type="number" name="min_withdrawal" value={sysSettings.min_withdrawal} onChange={handleSysChange} className="w-full bg-surface-container border border-outline-variant rounded-xl p-3.5" /></div>
                                </div>
                            </div>
                            <SystemSaveBar isDirty={isSystemDirty} onRevert={() => setSysSettings({ ...originalSysSettings })} onSave={handleSaveSystemSettings} isPending={isUpdatingSettings} />
                        </div>
                    )}

                    {activeTab === 'technical' && (
                        <div className="space-y-6">
                            <div className="bg-surface-container-lowest rounded-3xl border border-outline-variant p-6 shadow-sm">
                                <h3 className="text-lg font-extrabold text-on-surface flex items-center gap-3 border-b border-outline-variant/60 pb-4 mb-6"><span className="material-symbols-outlined text-blue-500">memory</span>{t('settings.server_settings')}</h3>
                                <div className="mb-6"><label className="block text-sm font-bold mb-2">{t('settings.heartbeat_interval')}</label><input type="number" name="heartbeat_interval" value={sysSettings.heartbeat_interval} onChange={handleSysChange} className="w-full md:w-1/2 bg-surface-container border border-outline-variant rounded-xl p-3.5" /></div>
                                <div className="pt-6 border-t border-outline-variant/40"><h4 className="font-bold mb-4">{t('settings.smtp_settings')}</h4>
                                    <div className="grid md:grid-cols-2 gap-4">
                                        <div><label className="block text-sm font-bold mb-1">{t('settings.smtp_host')}</label><input type="text" dir="ltr" name="smtp_host" value={sysSettings.smtp_host} onChange={handleSysChange} className="w-full bg-surface-container border rounded-xl p-3 font-mono" /></div>
                                        <div><label className="block text-sm font-bold mb-1">{t('settings.smtp_port')}</label><input type="number" dir="ltr" name="smtp_port" value={sysSettings.smtp_port} onChange={handleSysChange} className="w-full bg-surface-container border rounded-xl p-3 font-mono" /></div>
                                        <div><label className="block text-sm font-bold mb-1">{t('settings.smtp_user')}</label><input type="text" dir="ltr" name="smtp_user" value={sysSettings.smtp_user} onChange={handleSysChange} className="w-full bg-surface-container border rounded-xl p-3 font-mono" /></div>
                                        <div><label className="block text-sm font-bold mb-1">{t('settings.smtp_password')}</label><input type="password" dir="ltr" name="smtp_pass" value={sysSettings.smtp_pass} onChange={handleSysChange} className="w-full bg-surface-container border rounded-xl p-3 font-mono" /></div>
                                    </div>
                                </div>
                            </div>
                            <SystemSaveBar isDirty={isSystemDirty} onRevert={() => setSysSettings({ ...originalSysSettings })} onSave={handleSaveSystemSettings} isPending={isUpdatingSettings} />
                        </div>
                    )}

                    {activeTab === 'backup' && (
                        <div className="space-y-6">
                            <div className="bg-surface-container-lowest rounded-3xl border border-outline-variant p-6 shadow-sm">
                                <h3 className="text-lg font-extrabold text-on-surface flex items-center gap-3 border-b border-outline-variant/60 pb-4 mb-6"><span className="material-symbols-outlined text-primary">cloud_sync</span>{t('settings.backup')}</h3>
                                <div className="grid md:grid-cols-2 gap-6 mb-6">
                                    <div><label className="block text-sm font-bold mb-2">{t('settings.backup_location')}</label><select name="backup_disk" value={sysSettings.backup_disk} onChange={handleSysChange} className="w-full bg-surface-container border rounded-xl p-3.5"><option value="local">{t('settings.backup_local')}</option><option value="s3">{t('settings.backup_s3')}</option></select></div>
                                    <div><label className="block text-sm font-bold mb-2">{t('settings.backup_schedule')}</label><select name="auto_backup_schedule" value={sysSettings.auto_backup_schedule} onChange={handleSysChange} className="w-full bg-surface-container border rounded-xl p-3.5"><option value="none">{t('settings.schedule_none')}</option><option value="daily">{t('settings.schedule_daily')}</option><option value="weekly">{t('settings.schedule_weekly')}</option></select></div>
                                </div>
                                <div className="flex gap-4 pt-4 border-t border-outline-variant/40">
                                    <button onClick={handleDownloadBackup} disabled={isDownloading} className={`flex-1 bg-primary/10 text-primary px-6 py-3 rounded-xl font-bold flex justify-center items-center gap-2 transition-all ${isDownloading ? 'opacity-70 cursor-wait' : 'hover:bg-primary/20'}`}>
                                        {isDownloading ? <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" /> : <span className="material-symbols-outlined">download</span>}
                                        {t('settings.download_data_now')}
                                    </button>
                                    <button className="flex-1 bg-error/10 text-error px-6 py-3 rounded-xl font-bold flex justify-center items-center gap-2 hover:bg-error/20"><span className="material-symbols-outlined">restore</span>{t('settings.restore_from_file')}</button>
                                </div>
                            </div>
                            <SystemSaveBar isDirty={isSystemDirty} onRevert={() => setSysSettings({ ...originalSysSettings })} onSave={handleSaveSystemSettings} isPending={isUpdatingSettings} />
                        </div>
                    )}
                </motion.div>
            </AnimatePresence>
        </div>
    );
};

const SystemSaveBar = ({ isDirty, onRevert, onSave, isPending }) => {
    const { t } = useTranslation();
    return (
        <div className="sticky bottom-6 bg-surface/90 backdrop-blur-xl rounded-2xl border border-outline-variant shadow-lg p-4 flex justify-end gap-3 z-40">
            {isDirty && <button onClick={onRevert} className="px-5 py-3 rounded-xl font-bold text-on-surface-variant hover:bg-outline-variant/60">{t('common.revert')}</button>}
            <button disabled={!isDirty || isPending} onClick={onSave} className={`px-8 py-3 rounded-xl font-bold flex items-center gap-2 ${!isDirty || isPending ? 'bg-outline-variant text-on-surface-variant cursor-not-allowed' : 'bg-primary text-white hover:bg-primary/90 shadow-md'}`}>
                {isPending ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <span className="material-symbols-outlined">save</span>}
                {t('common.save_changes')}
            </button>
        </div>
    );
};

export default SettingsPage;