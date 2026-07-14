import React, { useState, useEffect } from 'react';
import { Clock, Zap, Info, Calendar } from 'lucide-react';
import Modal from '../../../shared/components/Modal';
import axiosClient from '../../../core/api/axiosClient';
import { ENDPOINTS } from '../../../core/api/endpoints';

const ScreenAvailabilityModal = ({ isOpen, onClose, screen, selectedDate }) => {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState([]);

    useEffect(() => {
        if (!isOpen || !screen?.screen_id) return;
        
        const fetchAvailability = async () => {
            setLoading(true);
            try {
                // Ignore the timezone shift by using simple format or today
                const targetDate = selectedDate || new Date().toISOString().split('T')[0];
                const res = await axiosClient.get(`${ENDPOINTS.SCREENS.AVAILABILITY(screen.screen_id)}?date=${targetDate}`);
                setData(res.data.data);
            } catch (error) {
                console.error("Failed to load availability", error);
            } finally {
                setLoading(false);
            }
        };

        fetchAvailability();
    }, [isOpen, screen, selectedDate]);

    // Legend item helper
    const LegendItem = ({ colorClass, text }) => (
        <div className="flex items-center gap-1.5">
            <div className={`w-3 h-3 rounded-full ${colorClass}`}></div>
            <span className="text-[10px] font-bold text-gray-600">{text}</span>
        </div>
    );

    return (
        <Modal 
            isOpen={isOpen} 
            onClose={onClose} 
            title={
                <span className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-[var(--color-dark-turquoise)]" />
                    خريطة سعات الشاشة الزمنية
                </span>
            }
        >
            <div className="space-y-5" dir="rtl">
                {/* Header Info */}
                <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 flex flex-col gap-2">
                    <div className="flex justify-between items-center">
                        <h3 className="font-black text-sm text-gray-800">{screen?.screen_name}</h3>
                        <div className="flex items-center gap-1 text-[11px] font-bold text-gray-500 bg-white px-2 py-1 rounded-md shadow-sm border border-gray-100">
                            <Calendar className="w-3.5 h-3.5 text-[var(--color-dark-turquoise)]" /> 
                            {selectedDate || 'اليوم'}
                        </div>
                    </div>
                    <p className="text-[10px] text-gray-500 font-bold leading-relaxed">
                        اختر أوقات التشغيل بعناية. المربعات توضح حالة الساعات المتاحة للبث. وتعتبر أوقات الذروة 
                        مضاعفة التكلفة ولكن أعلى مشاهدة.
                    </p>
                </div>

                {/* Loading State */}
                {loading ? (
                    <div className="flex flex-col justify-center items-center py-12 gap-3">
                        <div className="w-8 h-8 border-4 border-[var(--color-dark-turquoise)]/20 border-t-[var(--color-dark-turquoise)] rounded-full animate-spin"></div>
                        <span className="text-xs font-bold text-gray-400">جاري فحص الاتصال والسعات...</span>
                    </div>
                ) : (
                    <>
                        {/* Legend */}
                        <div className="flex flex-wrap items-center gap-4 bg-white border border-gray-100 p-3 rounded-xl shadow-sm">
                            <LegendItem colorClass="bg-emerald-100 border border-emerald-300" text="متاح بشكل كامل" />
                            <LegendItem colorClass="bg-amber-100 border border-amber-300" text="متاح جزئياً" />
                            <LegendItem colorClass="bg-rose-100 border border-rose-300" text="ممتلئ تماماً" />
                            <span className="flex items-center gap-1 ml-auto text-[10px] font-bold text-gray-600 bg-gray-50 px-2 py-1 rounded-lg">
                                <Zap className="w-3 h-3 text-[var(--color-gold)]" /> وقت ذروة مدفوع
                            </span>
                        </div>

                        {/* Hours Grid */}
                        <div className="grid grid-cols-4 sm:grid-cols-6 gap-2.5">
                            {data.map((slot, index) => {
                                const availableRatio = slot.available_seconds / 3600;
                                let bgClass = "bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100";
                                if (slot.is_full) {
                                    bgClass = "bg-rose-50 border-rose-200 text-rose-700 opacity-60";
                                } else if (availableRatio < 0.5) {
                                    bgClass = "bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100";
                                }

                                return (
                                    <div 
                                        key={index} 
                                        className={`p-2 rounded-xl border flex flex-col items-center justify-center relative overflow-hidden transition-colors ${bgClass}`}
                                    >
                                        {slot.is_peak && (
                                            <div className="absolute top-1 right-1" title="وقت ذروة">
                                                <Zap className="w-3 h-3 text-[var(--color-gold)] fill-[var(--color-gold)]" />
                                            </div>
                                        )}
                                        <span className="text-[11px] font-black tracking-wider" dir="ltr">{slot.hour}</span>
                                        <span className="text-[9px] font-extrabold mt-1.5 bg-white/60 px-1.5 py-0.5 rounded-md w-full text-center">
                                            {slot.is_full ? 'محجوز' : `${Math.floor(slot.available_seconds / 60)} د ق`}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </>
                )}
            </div>
        </Modal>
    );
};

export default ScreenAvailabilityModal;
