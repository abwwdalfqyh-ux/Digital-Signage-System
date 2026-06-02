import React, { useState, useEffect } from 'react';
import { Bell, CheckCircle2, Trash2, CheckSquare } from 'lucide-react';
import axiosClient from '../../core/api/axiosClient';
import { ENDPOINTS } from '../../core/api/endpoints';
import useToastStore from '../../store/useToastStore';
import PageHeader from '../../shared/components/PageHeader';
import { parseNotificationContent, getNotificationIconInfo } from './utils/notificationTranslator';

const NotificationsPage = () => {
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const addToast = useToastStore(state => state.addToast);

    const fetchNotifications = async () => {
        setLoading(true);
        try {
            const res = await axiosClient.get(ENDPOINTS.NOTIFICATIONS.ALL);
            if (res.data?.success || (res.status >= 200 && res.status < 300)) {
                setNotifications(res.data.data || res.data || []);
                setUnreadCount(res.data.unread_count || 0);
            }
        } catch (error) {
            addToast('حدث خطأ أثناء جلب الإشعارات', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNotifications();
    }, []);

    const markAsRead = async (id) => {
        try {
            await axiosClient.put(ENDPOINTS.NOTIFICATIONS.MARK_READ(id));
            setNotifications(prev => prev.map(n => n.notification_id === id ? { ...n, is_read: 'true' } : n));
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (error) {
            addToast('تعذر تحديث حالة الإشعار', 'error');
        }
    };

    const markAllAsRead = async () => {
        try {
            await axiosClient.put(ENDPOINTS.NOTIFICATIONS.MARK_ALL_READ);
            setNotifications(prev => prev.map(n => ({ ...n, is_read: 'true' })));
            setUnreadCount(0);
            addToast('تم تحديد جميع الإشعارات كمقروءة', 'success');
        } catch (error) {
            addToast('تعذر تحديث الإشعارات', 'error');
        }
    };

    const deleteNotification = async (id) => {
        try {
            await axiosClient.delete(ENDPOINTS.NOTIFICATIONS.DELETE(id));
            setNotifications(prev => {
                const target = prev.find(n => n.notification_id === id);
                if (target && target.is_read === 'false') {
                    setUnreadCount(count => Math.max(0, count - 1));
                }
                return prev.filter(n => n.notification_id !== id);
            });
            addToast('تم حذف الإشعار', 'success');
        } catch (error) {
            addToast('تعذر حذف الإشعار', 'error');
        }
    };



    return (
        <div className="space-y-6 max-w-5xl mx-auto" dir="rtl">
            <PageHeader 
                title={
                    <span className="flex items-center gap-3">
                        <Bell className="w-7 h-7 text-[var(--color-dark-turquoise)]" /> 
                        الإشعارات
                        {unreadCount > 0 && (
                            <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full mr-2">
                                {unreadCount} جديد
                            </span>
                        )}
                    </span>
                }
                description="إدارة إشعارات النظام وتنبيهات الحساب"
                action={
                    unreadCount > 0 && (
                        <button 
                            onClick={markAllAsRead}
                            className="bg-[var(--color-dark-turquoise)] hover:opacity-90 text-white font-bold px-4 py-2 rounded-full flex items-center gap-2 text-sm transition-opacity shadow-sm"
                        >
                            <CheckSquare className="w-4 h-4" /> تحديد الكل كمقروء
                        </button>
                    )
                }
            />

            {loading ? (
                <div className="flex justify-center py-20">
                    <div className="w-10 h-10 border-4 border-gray-200 border-t-[var(--color-dark-turquoise)] rounded-full animate-spin"></div>
                </div>
            ) : notifications.length === 0 ? (
                <div className="bg-white rounded-xl border border-gray-200 p-12 text-center shadow-sm">
                    <Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-bold text-gray-700">لا توجد إشعارات</h3>
                    <p className="text-gray-500 text-sm mt-1">أنت مطلع على جميع التنبيهات.</p>
                </div>
            ) : (
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="divide-y divide-gray-100">
                        {notifications.map(notif => {
                            const isUnread = notif.read_at === null || notif.is_read === false || notif.is_read === 'false';
                            const { Icon, colorClass } = getNotificationIconInfo(notif.title);
                            return (
                                <div 
                                    key={notif.notification_id} 
                                    className={`p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors ${
                                        isUnread ? 'bg-[var(--color-dark-turquoise)]/5' : 'hover:bg-gray-50'
                                    }`}
                                >
                                    <div className="flex-1 flex gap-4 items-start">
                                        <div className={`p-2 rounded-full flex-shrink-0 mt-1 ${isUnread ? colorClass : 'bg-gray-100 text-gray-400'}`}>
                                            <Icon className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <h4 className={`text-base font-bold mb-1 flex items-center gap-2 ${isUnread ? 'text-gray-900' : 'text-gray-700'}`}>
                                                {parseNotificationContent(notif.title)}
                                                {isUnread && <span className="w-2 h-2 rounded-full bg-[var(--color-dark-turquoise)] inline-block"></span>}
                                            </h4>
                                            <p className={`text-sm leading-relaxed ${isUnread ? 'text-gray-800 font-medium' : 'text-gray-500'}`}>
                                                {parseNotificationContent(notif.message)}
                                            </p>
                                            <p className="text-xs text-gray-400 mt-2 font-medium" dir="ltr">
                                                {new Date(notif.created_at).toLocaleString('ar-EG', { dateStyle: 'medium', timeStyle: 'short' })}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 self-end md:self-center mr-12 md:mr-0 shrink-0">
                                        {isUnread && (
                                            <button 
                                                onClick={() => markAsRead(notif.notification_id)}
                                                className="p-2 text-[var(--color-dark-turquoise)] hover:bg-[var(--color-dark-turquoise)]/10 rounded-lg transition-colors flex items-center justify-center"
                                                title="تحديد كمقروء"
                                            >
                                                <CheckCircle2 className="w-5 h-5" />
                                            </button>
                                        )}
                                        <button 
                                            onClick={() => deleteNotification(notif.notification_id)}
                                            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors flex items-center justify-center"
                                            title="حذف الإشعار"
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};

export default NotificationsPage;
