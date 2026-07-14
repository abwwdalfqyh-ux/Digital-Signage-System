import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axiosClient from '../../core/api/axiosClient';
import { ENDPOINTS } from '../../core/api/endpoints';
import useToastStore from '../../store/useToastStore';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../../store/useAuthStore';
import { parseNotificationContent, getNotificationIconInfo, getNotificationLink } from './utils/notificationTranslator';
import Modal from '../../shared/components/Modal';

const NotificationsPage = () => {
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [loadingMessageIdx, setLoadingMessageIdx] = useState(0);
    const [filterTab, setFilterTab] = useState('all');
    
    // Archive UI state
    const [isArchiveModalOpen, setIsArchiveModalOpen] = useState(false);
    const [archiveMonths, setArchiveMonths] = useState('6');
    const [isArchiving, setIsArchiving] = useState(false);
    
    const addToast = useToastStore(state => state.addToast);
    const { user } = useAuthStore();
    const isOwner = user?.role?.role_name === 'ScreenOwner' || user?.role === 'ScreenOwner';
    
    const navigate = useNavigate();

    const handleNotificationClick = (notif) => {
        // Mark as read if not already read
        if (notif.read_at === null || notif.is_read === false || notif.is_read === 'false') {
            markAsRead(notif.notification_id, false); // false = don't show toast for click
        }
        
        // Navigate
        const link = getNotificationLink(notif.title);
        if (link) {
            navigate(link);
        }
    };

    const loadingMessages = [
        "جاري الاتصال الآمن بالسيرفر...",
        "يتم الآن تجميع إشعاراتك الحديثة...",
        "جاري مزامنة التحديثات المالية والأمنية...",
        "لحظات وننتهي من ترتيب واجهتك..."
    ];

    const fetchNotifications = async () => {
        setLoading(true);
        try {
            const res = await axiosClient.get(ENDPOINTS.NOTIFICATIONS.ALL);
            if (res.data?.success || (res.status >= 200 && res.status < 300)) {
                const fetchedNotifications = res.data.data || res.data || [];
                setNotifications(fetchedNotifications);
                
                const count = res.data.unread_count !== undefined 
                    ? res.data.unread_count 
                    : fetchedNotifications.filter(n => n.read_at === null || n.is_read === false || n.is_read === 'false').length;
                
                setUnreadCount(count);
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

    useEffect(() => {
        let interval;
        if (loading) {
            setLoadingMessageIdx(0);
            interval = setInterval(() => {
                setLoadingMessageIdx((prev) => (prev + 1) % loadingMessages.length);
            }, 1800);
        }
        return () => clearInterval(interval);
    }, [loading]);

    const markAsRead = async (id) => {
        try {
            await axiosClient.put(ENDPOINTS.NOTIFICATIONS.MARK_READ(id));
            setNotifications(prev => prev.map(n => n.notification_id === id ? { ...n, is_read: 'true', read_at: new Date().toISOString() } : n));
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (error) {
            addToast('تعذر تحديث حالة الإشعار', 'error');
        }
    };

    const markAllAsRead = async () => {
        try {
            await axiosClient.put(ENDPOINTS.NOTIFICATIONS.MARK_ALL_READ);
            setNotifications(prev => prev.map(n => ({ ...n, is_read: 'true', read_at: new Date().toISOString() })));
            setUnreadCount(0);
            addToast('تم تحديد جميع الإشعارات كمقروءة', 'success');
        } catch (error) {
            addToast('تعذر تحديث الإشعارات', 'error');
        }
    };

    const deleteReadNotifications = async () => {
        if (!window.confirm('هل أنت متأكد من مسح جميع الإشعارات المقروءة نهائياً؟')) return;
        try {
            const res = await axiosClient.delete(ENDPOINTS.NOTIFICATIONS.DELETE_READ);
            setNotifications(prev => prev.filter(n => n.read_at === null || n.is_read === false || n.is_read === 'false'));
            addToast(res.data?.message || 'تم مسح الإشعارات المقروءة', 'success');
        } catch (error) {
            addToast('تعذر مسح الإشعارات', 'error');
        }
    };

    const handleArchive = async () => {
        setIsArchiving(true);
        try {
            const res = await axiosClient.delete(ENDPOINTS.NOTIFICATIONS.ARCHIVE, { data: { months: parseInt(archiveMonths) } });
            fetchNotifications(); // Refresh list to reflect changes
            setIsArchiveModalOpen(false);
            addToast(res.data?.message || 'تم أرشفة ومسح الإشعارات القديمة', 'success');
        } catch (error) {
            addToast(error.response?.data?.message || 'تعذر مسح الإشعارات القديمة', 'error');
        } finally {
            setIsArchiving(false);
        }
    };

    const deleteNotification = async (id) => {
        try {
            await axiosClient.delete(ENDPOINTS.NOTIFICATIONS.DELETE(id));
            setNotifications(prev => {
                const target = prev.find(n => n.notification_id === id);
                if (target && (target.read_at === null || target.is_read === false || target.is_read === 'false')) {
                    setUnreadCount(count => Math.max(0, count - 1));
                }
                return prev.filter(n => n.notification_id !== id);
            });
            addToast('تم حذف الإشعار بنجاح', 'success');
        } catch (error) {
            addToast('تعذر حذف الإشعار', 'error');
        }
    };

    const filteredNotifications = notifications.filter(n => {
        if (!isOwner || filterTab === 'all') return true;
        const searchArea = ((n.title || '') + ' ' + (n.message || '')).toLowerCase();
        return searchArea.includes('شاشة') || searchArea.includes('screen') || 
               searchArea.includes('إعلان') || searchArea.includes('عمل') || 
               searchArea.includes('انقطع') || searchArea.includes('اتصال') || searchArea.includes('ارتباط') || searchArea.includes('موافقة');
    });

    const totalNotifications = filteredNotifications.length;
    const readNotifications = totalNotifications - unreadCount;

    return (
        <div className="p-margin-mobile md:p-gutter max-w-7xl mx-auto w-full font-sans pb-20" dir="rtl">
            {/* Header Section */}
            <div className="mb-xl text-right">
                <h2 className="text-2xl md:text-3xl font-bold text-on-surface mb-xs">مركز الإشعارات</h2>
            </div>

            {/* Summary Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-md mb-xl">
                {/* Total */}
                <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-md shadow-sm flex flex-col items-center justify-center text-center">
                    <div className="w-16 h-16 bg-surface-container rounded-full flex items-center justify-center mb-sm text-primary">
                        <span className="material-symbols-outlined text-3xl" data-icon="mark_email_read">mark_email_read</span>
                    </div>
                    <p className="text-sm md:text-base text-on-surface-variant mb-xs font-semibold">إجمالي الرسائل الإشعارية</p>
                    <p className="text-3xl md:text-4xl font-bold text-on-surface">{totalNotifications}</p>
                </div>
                
                {/* New/Unread */}
                <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-md shadow-sm flex flex-col items-center justify-center text-center relative overflow-hidden">
                    <div className="w-16 h-16 bg-error-container rounded-full flex items-center justify-center mb-sm text-error relative">
                        <span className="material-symbols-outlined text-3xl" data-icon="mail">mail</span>
                        {unreadCount > 0 && (
                            <span className="absolute top-1 right-1 w-3.5 h-3.5 bg-error rounded-full border-2 border-white animate-pulse"></span>
                        )}
                    </div>
                    <p className="text-sm md:text-base text-on-surface-variant mb-xs font-semibold">الرسائل الجديدة (غير مقروءة)</p>
                    <p className="text-3xl md:text-4xl font-bold text-error">{unreadCount}</p>
                </div>
                
                {/* Archived/Read */}
                <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-md shadow-sm flex flex-col items-center justify-center text-center">
                    <div className="w-16 h-16 bg-surface-container-high rounded-full flex items-center justify-center mb-sm text-on-surface-variant">
                        <span className="material-symbols-outlined text-3xl" data-icon="archive">archive</span>
                    </div>
                    <p className="text-sm md:text-base text-on-surface-variant mb-xs font-semibold">الرسائل المؤرشفة (مقروءة)</p>
                    <p className="text-3xl md:text-4xl font-bold text-on-surface">{readNotifications}</p>
                </div>
            </div>

            {/* Notification List Area */}
            <div className="bg-surface-container-lowest border border-outline-variant rounded-xl shadow-sm overflow-hidden min-h-[400px]">
                <div className="px-lg py-md border-b border-outline-variant bg-surface-bright flex justify-between items-center">
                    <h3 className="text-xl font-bold text-on-surface">أحدث الإشعارات</h3>
                    <div className="flex flex-wrap items-center gap-2">
                        {unreadCount > 0 && (
                            <button 
                                onClick={markAllAsRead} 
                                className="text-primary hover:bg-primary-container/20 px-3 py-2 rounded-lg font-semibold text-sm md:text-base transition-colors flex items-center gap-xs"
                                title="تحديد الكل كمقروء"
                            >
                                <span className="material-symbols-outlined text-xl" data-icon="done_all">done_all</span>
                                <span className="hidden sm:inline">تحديد الكل مقروء</span>
                            </button>
                        )}
                        {readNotifications > 0 && (
                            <button 
                                onClick={deleteReadNotifications} 
                                className="text-error hover:bg-error-container/20 px-3 py-2 rounded-lg font-semibold text-sm md:text-base transition-colors flex items-center gap-xs"
                                title="مسح الإشعارات المقروءة"
                            >
                                <span className="material-symbols-outlined text-xl" data-icon="delete_sweep">delete_sweep</span>
                                <span className="hidden sm:inline">مسح المقروء</span>
                            </button>
                        )}
                        {notifications.length > 0 && (
                            <button 
                                onClick={() => setIsArchiveModalOpen(true)} 
                                className="text-on-surface-variant hover:bg-surface-container-high px-3 py-2 rounded-lg font-semibold text-sm md:text-base transition-colors flex items-center gap-xs"
                                title="تنظيف حسب التاريخ"
                            >
                                <span className="material-symbols-outlined text-xl" data-icon="auto_delete">auto_delete</span>
                                <span className="hidden sm:inline">تنظيف الأرشيف</span>
                            </button>
                        )}
                    </div>
                </div>

                {/* Filter Tabs for Screen Owner */}
                {isOwner && (
                    <div className="px-lg pb-md border-b border-outline-variant bg-surface-bright flex gap-2">
                        <button 
                            onClick={() => setFilterTab('all')} 
                            className={`px-4 py-2 rounded-lg font-bold text-sm transition-colors ${filterTab === 'all' ? 'bg-primary text-white' : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'}`}
                        >
                            جميع الإشعارات
                        </button>
                        <button 
                            onClick={() => setFilterTab('screens')} 
                            className={`px-4 py-2 rounded-lg font-bold text-sm transition-colors flex items-center gap-1 ${filterTab === 'screens' ? 'bg-primary text-white' : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'}`}
                        >
                            <span className="material-symbols-outlined text-lg" data-icon="monitor">monitor</span>
                            إشعارات شاشاتي
                        </button>
                    </div>
                )}

                {loading ? (
                    <div className="flex flex-col items-center justify-center p-10 md:p-16 space-y-8 min-h-[400px]">
                        <div className="relative flex items-center justify-center mb-2">
                            <span className="absolute w-24 h-24 rounded-full border-[3px] border-surface-variant border-t-primary animate-spin"></span>
                            <span className="absolute w-20 h-20 rounded-full border-[3px] border-surface-variant border-b-primaryContainer animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></span>
                            <span className="material-symbols-outlined text-4xl text-primary animate-pulse" data-icon="cloud_sync">cloud_sync</span>
                        </div>
                        <div className="text-center h-16 w-full relative overflow-hidden flex flex-col items-center">
                            <AnimatePresence mode="wait">
                                <motion.p 
                                    key={loadingMessageIdx}
                                    initial={{ opacity: 0, y: 15 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -15 }}
                                    transition={{ duration: 0.3, ease: 'easeOut' }}
                                    className="text-lg md:text-xl font-bold text-on-surface absolute top-0"
                                >
                                    {loadingMessages[loadingMessageIdx]}
                                </motion.p>
                            </AnimatePresence>
                            <p className="text-sm font-medium text-outline mt-8 md:mt-10">يرجى الانتظار، لا تقم بتحديث الصفحة...</p>
                        </div>
                        <div className="w-full max-w-2xl space-y-4 pt-4 opacity-40 pointer-events-none hidden md:block">
                            <div className="w-full h-24 bg-surface-variant rounded-2xl animate-pulse"></div>
                            <div className="w-full h-24 bg-surface-variant rounded-2xl animate-pulse opacity-70" style={{ animationDelay: '0.2s' }}></div>
                            <div className="w-full h-24 bg-surface-variant rounded-2xl animate-pulse opacity-40" style={{ animationDelay: '0.4s' }}></div>
                        </div>
                    </div>
                ) : filteredNotifications.length === 0 ? (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="py-20 px-4 text-center flex flex-col items-center justify-center w-full">
                        <div className="w-24 h-24 bg-surface-container rounded-full flex items-center justify-center mb-6 relative">
                            <span className="material-symbols-outlined text-5xl text-outline-variant absolute -top-2 -right-2 rotate-12">sparkles</span>
                            <span className="material-symbols-outlined text-6xl text-primary opacity-80">inbox</span>
                        </div>
                        <h3 className="text-2xl font-bold text-on-surface mb-2">صندوق الوارد فارغ تماماً</h3>
                        <p className="text-base text-on-surface-variant font-medium whitespace-nowrap">
                            أنت متصل تماماً ولا توجد إشعارات معلقة. يمكنك الاسترخاء الآن، وسنقوم بتنبيهك عند توفر أي جديد.
                        </p>
                    </motion.div>
                ) : (
                    <ul className="divide-y divide-outline-variant">
                        <AnimatePresence mode="popLayout">
                            {filteredNotifications.map(notif => {
                                const isUnread = notif.read_at === null || notif.is_read === false || notif.is_read === 'false';
                                const { Icon } = getNotificationIconInfo(notif.title);
                                
                                return (
                                    <motion.li 
                                        layout
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.98, transition: { duration: 0.2 } }}
                                        key={notif.notification_id} 
                                        onClick={() => handleNotificationClick(notif)}
                                        className={`p-lg transition-colors flex items-start gap-md md:gap-lg group relative cursor-pointer ${
                                            isUnread ? 'bg-[#f8fafc] border-r-4 border-r-[#004ac6] hover:bg-[#f1f5f9]' : 'bg-white border-r-4 border-r-transparent hover:bg-[#f8fafc]'
                                        }`}
                                    >
                                        {/* Status Icon (Right flex position in RTL) */}
                                        <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 mt-1 shadow-sm ${
                                            isUnread 
                                                ? 'bg-primary-container/20 text-primary border border-primary/10' 
                                                : 'bg-surface-container text-on-surface-variant border border-outline-variant/30'
                                        }`}>
                                            <Icon className="w-6 h-6" />
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1 text-right pt-1">
                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2 sm:mb-1 gap-1">
                                                <div className="flex items-center gap-2">
                                                    <h4 className={`text-lg font-bold ${isUnread ? 'text-[#141b2b]' : 'text-[#737686]'}`}>
                                                        {parseNotificationContent(notif.title)}
                                                    </h4>
                                                    {isUnread && (
                                                        <span className="bg-[#e1e8fd] text-[#004ac6] text-[11px] font-black px-2 py-0.5 rounded-full block self-center whitespace-nowrap">
                                                            جديد
                                                        </span>
                                                    )}
                                                </div>
                                                <span className="text-sm font-medium text-outline shrink-0 order-first sm:order-last" dir="ltr" style={{ display: 'inline-flex', gap: '6px', alignItems: 'center' }}>
                                                    <span>{new Date(notif.created_at).getFullYear()}/{new Date(notif.created_at).getMonth() + 1}/{new Date(notif.created_at).getDate()}</span>
                                                    <span>-</span>
                                                    <span>{new Date(notif.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }).replace('AM', 'ص').replace('PM', 'م')}</span>
                                                </span>
                                            </div>
                                            <p className={`text-base leading-relaxed ${isUnread ? 'text-on-surface-variant font-medium' : 'text-outline font-normal'}`}>
                                                {parseNotificationContent(notif.message)}
                                            </p>
                                        </div>

                                        {/* Action Icons (Left visible on hover or mobile) */}
                                        <div className="flex flex-col gap-2 items-center mt-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                                            {isUnread && (
                                                <button 
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        markAsRead(notif.notification_id);
                                                    }} 
                                                    className="text-on-surface-variant hover:text-primary transition-colors p-2 rounded-lg hover:bg-primary/10" 
                                                    title="تحديد كمقروء"
                                                >
                                                    <span className="material-symbols-outlined text-xl" data-icon="visibility">visibility</span>
                                                </button>
                                            )}
                                            <button 
                                                onClick={() => deleteNotification(notif.notification_id)} 
                                                className="text-on-surface-variant hover:text-error transition-colors p-2 rounded-lg hover:bg-error-container/50" 
                                                title="حذف"
                                            >
                                                <span className="material-symbols-outlined text-xl" data-icon="delete">delete</span>
                                            </button>
                                        </div>
                                    </motion.li>
                                );
                            })}
                        </AnimatePresence>
                    </ul>
                )}
            </div>

            {/* Archive Modal */}
            <Modal isOpen={isArchiveModalOpen} onClose={() => setIsArchiveModalOpen(false)} title="تنظيف وأرشفة الإشعارات">
                <div className="space-y-4" dir="rtl">
                    <div className="bg-warning-container text-on-warning-container p-4 rounded-xl flex items-start gap-3">
                        <span className="material-symbols-outlined shrink-0">warning</span>
                        <div className="text-sm">
                            <p className="font-bold mb-1">تنبيه!</p>
                            <p>سيتم مسح الإشعارات القديمة نهائياً ولا يمكن التراجع عن هذه العملية.</p>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-on-surface mb-2">اختر مدة الإشعارات المراد مسحها</label>
                        <select 
                            value={archiveMonths}
                            onChange={(e) => setArchiveMonths(e.target.value)}
                            className="w-full bg-surface-container-highest border border-outline-variant rounded-xl p-3 outline-none"
                        >
                            <option value="1">الإشعارات الأقدم من شهر واحد</option>
                            <option value="3">الإشعارات الأقدم من 3 أشهر</option>
                            <option value="6">الإشعارات الأقدم من 6 أشهر</option>
                            <option value="12">الإشعارات الأقدم من سنة كاملة</option>
                            <option value="24">الإشعارات الأقدم من سنتين</option>
                        </select>
                    </div>

                    <div className="flex gap-3 pt-4 border-t border-outline-variant">
                        <button 
                            onClick={handleArchive}
                            disabled={isArchiving}
                            className="flex-1 bg-error text-white py-2.5 rounded-xl font-bold hover:bg-error/90 transition-colors flex justify-center items-center gap-2 disabled:opacity-70"
                        >
                            {isArchiving ? (
                                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                            ) : (
                                <span className="material-symbols-outlined text-[20px]">auto_delete</span>
                            )}
                            تنظيف الأرشيف الآن
                        </button>
                        <button 
                            onClick={() => setIsArchiveModalOpen(false)}
                            className="flex-1 bg-surface-container-high text-on-surface py-2.5 rounded-xl font-bold hover:bg-surface-container-highest transition-colors"
                        >
                            إلغاء
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default NotificationsPage;
