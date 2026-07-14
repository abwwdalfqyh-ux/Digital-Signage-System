import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowRight, Monitor, Activity, Clock, PlayCircle, BarChart2, Star, RefreshCw, Camera, Moon, Sun, RotateCcw } from 'lucide-react';
import { motion } from 'framer-motion';
import axiosClient from '../../core/api/axiosClient';
import { ENDPOINTS } from '../../core/api/endpoints';
import useToastStore from '../../store/useToastStore';

import { useScreens, useScreenAvailability } from '../../hooks/api/useScreens';

const S = {
    primary: '#004ac6', primaryContainer: '#2563eb', surfaceContainerLowest: '#ffffff',
    surfaceContainerLow: '#f1f3ff', surfaceContainer: '#e9edff', onBackground: '#141b2b',
    onSurfaceVariant: '#434655', outline: '#737686', outlineVariant: '#c3c6d7',
    success: '#166534', successContainer: '#dcfce7', error: '#ba1a1a', errorContainer: '#ffdad6',
    warning: '#d97706', warningContainer: '#fef3c7',
};

const ScreenDetailPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const addToast = useToastStore(s => s.addToast);
    
    const { data: screens = [], isLoading: loading } = useScreens();
    const screen = screens.find(s => String(s.screen_id) === String(id));

    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const { data: availabilityData, isLoading: loadingAvailability } = useScreenAvailability(id, selectedDate);
    const availability = availabilityData?.data || [];

    useEffect(() => {
        if (!loading && !screen) {
            addToast('لم يتم العثور على الشاشة', 'error');
            navigate('/dashboard/screens');
        }
    }, [loading, screen, navigate, addToast]);

    const handleCommand = async (command) => {
        try {
            await axiosClient.post(`/screens/${screen.screen_id}/command`, {
                target_screen: screen.mac_address,
                command: command
            });
            addToast(`تم إرسال أمر: ${command} بنجاح`, 'success');
        } catch (error) {
            addToast('حدث خطأ أثناء إرسال الأمر', 'error');
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center p-32 gap-4 h-[60vh]">
                <RefreshCw className="w-10 h-10 animate-spin text-[#004ac6]" />
                <p className="font-bold text-[#434655]">جاري تحميل تفاصيل الشاشة...</p>
            </div>
        );
    }

    if (!screen) return null;

    const isOnline = screen.status === 'Online' || screen.status === 'online';

    return (
        <div className="p-6 md:p-8 max-w-7xl mx-auto w-full font-sans text-right" dir="rtl" style={{ fontFamily: "'IBM Plex Sans Arabic', sans-serif" }}>
            
            {/* ══ Header ══ */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors">
                        <ArrowRight className="w-5 h-5 text-gray-600" />
                    </button>
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-2xl font-black text-gray-900 m-0">{screen.screen_name}</h1>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${isOnline ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                {isOnline ? 'متصلة الآن' : 'غير متصلة'}
                            </span>
                        </div>
                        <p className="text-sm text-gray-500 m-0 mt-1">تتبع أداء وحالة هذه الشاشة بالتفصيل</p>
                    </div>
                </div>
                <div className="flex items-center gap-2 bg-blue-50 px-4 py-2 rounded-xl border border-blue-100 text-blue-700 font-bold text-sm">
                    <Monitor className="w-4 h-4" />
                    معرف الشاشة: <span className="font-mono">{screen.mac_address}</span>
                </div>
            </div>

            {/* ══ Layout ══ */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Right col (Overview) */}
                <div className="lg:col-span-1 space-y-6">
                    {/* Image Card */}
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white border text-center border-gray-200 rounded-2xl p-4 shadow-sm">
                        <div className="aspect-[4/3] bg-gray-100 rounded-xl overflow-hidden mb-4 border border-gray-200 flex items-center justify-center">
                            {screen.image_path ? (
                                <img src={screen.image_path} alt={screen.screen_name} className="w-full h-full object-cover" />
                            ) : (
                                <Monitor className="w-16 h-16 text-gray-300" />
                            )}
                        </div>
                        <h3 className="font-bold text-gray-800 text-lg m-0">{screen.screen_name}</h3>
                        <p className="text-sm text-gray-500">{screen.street?.name || 'موقع غير محدد'} {screen.street?.region?.name ? `- ${screen.street.region.name}` : ''}</p>
                    </motion.div>

                    {/* Remote Management */}
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm space-y-4">
                        <h4 className="font-bold text-gray-800 text-sm m-0 border-b pb-3">التحكم عن بعد (Live Remote)</h4>
                        
                        {screen.last_screenshot_url && (
                            <div className="mb-4">
                                <p className="text-xs text-gray-500 mb-2">آخر لقطة شاشة:</p>
                                <div className="aspect-[16/9] bg-black rounded-lg overflow-hidden border border-gray-200 relative group">
                                    <img src={screen.last_screenshot_url} alt="Screenshot" className="w-full h-full object-contain" />
                                </div>
                                <p className="text-[10px] text-gray-400 mt-1 text-left" dir="ltr">{new Date(screen.last_screenshot_at).toLocaleString()}</p>
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-2">
                            <button onClick={() => handleCommand('TAKE_SCREENSHOT')} className="flex flex-col items-center justify-center gap-2 p-3 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors border border-blue-100">
                                <Camera className="w-5 h-5" />
                                <span className="text-xs font-bold">لقطة شاشة</span>
                            </button>
                            <button onClick={() => handleCommand('SLEEP_SCREEN')} className="flex flex-col items-center justify-center gap-2 p-3 rounded-xl bg-gray-50 text-gray-700 hover:bg-gray-100 transition-colors border border-gray-200">
                                <Moon className="w-5 h-5" />
                                <span className="text-xs font-bold">إطفاء الشاشة</span>
                            </button>
                            <button onClick={() => handleCommand('WAKE_SCREEN')} className="flex flex-col items-center justify-center gap-2 p-3 rounded-xl bg-yellow-50 text-yellow-700 hover:bg-yellow-100 transition-colors border border-yellow-100">
                                <Sun className="w-5 h-5" />
                                <span className="text-xs font-bold">إيقاظ الشاشة</span>
                            </button>
                            <button onClick={() => handleCommand('RESTART_APP')} className="flex flex-col items-center justify-center gap-2 p-3 rounded-xl bg-red-50 text-red-700 hover:bg-red-100 transition-colors border border-red-100">
                                <RotateCcw className="w-5 h-5" />
                                <span className="text-xs font-bold">إعادة التشغيل</span>
                            </button>
                        </div>
                    </motion.div>

                    {/* Quick Stats (Mocked for specific screen) */}
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm space-y-4">
                        <h4 className="font-bold text-gray-800 text-sm m-0 border-b pb-3">أداء الشاشة المخصص</h4>
                        <div className="flex justify-between items-center">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center"><BarChart2 className="w-4 h-4 text-blue-600" /></div>
                                <span className="text-sm font-semibold text-gray-600">الإشغال اليوم</span>
                            </div>
                            <span className="font-black text-gray-900">76%</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center"><Activity className="w-4 h-4 text-green-600" /></div>
                                <span className="text-sm font-semibold text-gray-600">مرات الظهور (يومي)</span>
                            </div>
                            <span className="font-black text-gray-900">1,240</span>
                        </div>
                    </motion.div>
                </div>

                {/* Left col (Active Campaigns & Schedule) */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Active Ads */}
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
                        <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                            <div>
                                <h3 className="font-bold text-gray-800 text-lg m-0">الإعلانات النشطة عليها الآن</h3>
                                <p className="text-xs text-gray-500 m-0 mt-1">الحملات التي تعرض حالياً على هذه الشاشة</p>
                            </div>
                            <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-bold">2 حملات نشطة</span>
                        </div>
                        <div className="p-0">
                            {/* Mocked Ads list */}
                            {[1, 2].map((ad, i) => (
                                <div key={i} className="flex items-center justify-between p-4 border-b border-gray-100 last:border-0 hover:bg-blue-50/30 transition-colors">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center">
                                            <PlayCircle className="w-6 h-6 text-gray-400" />    
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-gray-800 text-sm m-0">إعلان تجاري {ad}</h4>
                                            <p className="text-xs text-gray-500 m-0 mt-0.5 max-w-[200px] truncate">شركة التسويق الحديثة</p>
                                        </div>
                                    </div>
                                    <div className="text-left">
                                        <div className="text-xs font-bold text-gray-600 bg-gray-100 px-2 py-1 rounded">كل 5 دقائق</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.div>

                    {/* Available Schedule (Mocked) */}
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
                        <div className="p-5 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                            <div>
                                <h3 className="font-bold text-gray-800 text-lg m-0 mb-1">جدول عمل الشاشة ومواعيد الذروة</h3>
                                <p className="text-xs text-gray-500 m-0">ساعات العمل والأوقات التي يكون فيها السعر مضاعفاً</p>
                            </div>
                            <div>
                                <input 
                                    type="date" 
                                    value={selectedDate}
                                    onChange={(e) => setSelectedDate(e.target.value)}
                                    className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            </div>
                        </div>
                        <div className="p-5">
                            {loadingAvailability ? (
                                <div className="flex justify-center p-8">
                                    <RefreshCw className="w-6 h-6 animate-spin text-blue-500" />
                                </div>
                            ) : (
                                <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                                    {availability.map((slot, i) => {
                                        const bookedPercentage = ((3600 - slot.available_seconds) / 3600) * 100;
                                        const isPeak = slot.is_peak;

                                        // تحويل الصيغة من 24 إلى 12 ساعة مع كتابة "من كذا إلى كذا"
                                        const startHour = parseInt(slot.hour.split(':')[0], 10);
                                        const endHour = (startHour + 1) % 24;
                                        
                                        const formatAMPM = (h) => {
                                            const ampm = h >= 12 ? 'مساءً' : 'صباحاً';
                                            const h12 = h % 12 || 12;
                                            return `${String(h12).padStart(2, '0')}:00 ${ampm}`;
                                        };
                                        const timeLabel = `من ${formatAMPM(startHour)} إلى ${formatAMPM(endHour)}`;

                                        return (
                                            <div key={i} className={`flex flex-col md:flex-row md:items-center gap-3 p-3 rounded-xl border ${slot.is_full ? 'border-red-200 bg-red-50/30' : 'border-gray-100 bg-white'} shadow-sm`}>
                                                <div className="flex flex-col justify-center md:w-56 flex-shrink-0">
                                                    <span className="font-bold text-gray-800 text-sm" dir="rtl">{timeLabel}</span>
                                                    {isPeak && <span className="mt-1 w-fit bg-orange-100 text-orange-700 px-2 py-0.5 rounded text-xs font-bold flex items-center gap-1"><Star className="w-3 h-3" /> ذروة x{slot.price_multiplier}</span>}
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex justify-between text-xs mb-1">
                                                        <span className="text-gray-600 font-bold">المحجوز: {Math.round(3600 - slot.available_seconds)} ثانية</span>
                                                        <span className={slot.available_seconds > 0 ? 'text-green-600 font-bold' : 'text-red-600 font-bold'}>
                                                            المتبقي: {Math.round(slot.available_seconds)} ثانية
                                                        </span>
                                                    </div>
                                                    <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden flex">
                                                        <div className={`h-2.5 rounded-full ${slot.is_full ? 'bg-red-500' : 'bg-blue-500'}`} style={{ width: `${bookedPercentage}%` }}></div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </motion.div>
                </div>
            </div>
        </div>
    );
};

export default ScreenDetailPage;
