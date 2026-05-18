import React, { useState, useEffect } from 'react';
import { Clock, Plus, Edit2, Trash2, Tv } from 'lucide-react';
import axiosClient from '../../core/api/axiosClient';
import useToastStore from '../../store/useToastStore';
import PageHeader from '../../shared/components/PageHeader';
import Modal from '../../shared/components/Modal';

// Mock API for Peak Hours until backend is ready
const MOCK_API = {
    slots: [
        { slot_id: 1, screen_id: 101, screen_name: 'شاشة التحرير الرئيسية', start_time: '16:00', end_time: '22:00', price_multiplier: 1.5 },
        { slot_id: 2, screen_id: 102, screen_name: 'شاشة حدة', start_time: '18:00', end_time: '23:59', price_multiplier: 2.0 },
    ],
    getSlots: () => new Promise(resolve => setTimeout(() => resolve([...MOCK_API.slots]), 500)),
    addSlot: (data) => new Promise(resolve => setTimeout(() => {
        const newSlot = { ...data, slot_id: Date.now(), screen_name: `شاشة ${data.screen_id}` };
        MOCK_API.slots.push(newSlot);
        resolve();
    }, 500)),
    updateSlot: (id, data) => new Promise(resolve => setTimeout(() => {
        const index = MOCK_API.slots.findIndex(s => s.slot_id === id);
        if (index !== -1) MOCK_API.slots[index] = { ...MOCK_API.slots[index], ...data };
        resolve();
    }, 500)),
    deleteSlot: (id) => new Promise(resolve => setTimeout(() => {
        MOCK_API.slots = MOCK_API.slots.filter(s => s.slot_id !== id);
        resolve();
    }, 500)),
};

const PeakHoursPage = () => {
    const addToast = useToastStore(state => state.addToast);
    const [slots, setSlots] = useState([]);
    const [screens, setScreens] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingSlot, setEditingSlot] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [form, setForm] = useState({
        screen_id: '',
        start_time: '16:00',
        end_time: '22:00',
        price_multiplier: '1.5'
    });

    const fetchData = async () => {
        setIsLoading(true);
        try {
            // Fetch real screens
            const screensRes = await axiosClient.get('/screens');
            setScreens(Array.isArray(screensRes.data.data) ? screensRes.data.data : screensRes.data);

            // Fetch mock slots
            const mockSlots = await MOCK_API.getSlots();
            setSlots(mockSlots);
        } catch (error) {
            addToast('فشل في جلب أوقات الذروة', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const openModal = (slot = null) => {
        if (slot) {
            setEditingSlot(slot);
            setForm({
                screen_id: slot.screen_id || '',
                start_time: slot.start_time || '16:00',
                end_time: slot.end_time || '22:00',
                price_multiplier: slot.price_multiplier?.toString() || '1.5'
            });
        } else {
            setEditingSlot(null);
            setForm({ screen_id: '', start_time: '16:00', end_time: '22:00', price_multiplier: '1.5' });
        }
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingSlot(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.screen_id || !form.start_time || !form.end_time || !form.price_multiplier) {
            addToast('يرجى تعبئة جميع الحقول المطلوبة', 'warning');
            return;
        }

        setIsSubmitting(true);
        try {
            const payload = {
                ...form,
                screen_id: parseInt(form.screen_id),
                price_multiplier: parseFloat(form.price_multiplier)
            };

            // Using Mock API for now
            if (editingSlot) {
                await MOCK_API.updateSlot(editingSlot.slot_id, payload);
                addToast('تم تعديل وقت الذروة بنجاح', 'success');
            } else {
                await MOCK_API.addSlot(payload);
                addToast('تم إضافة وقت الذروة بنجاح', 'success');
            }
            closeModal();
            fetchData();
        } catch (error) {
            addToast('حدث خطأ أثناء حفظ وقت الذروة', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('هل أنت متأكد من حذف وقت الذروة هذا؟')) {
            try {
                // Using Mock API
                await MOCK_API.deleteSlot(id);
                addToast('تم حذف وقت الذروة بنجاح', 'success');
                fetchData();
            } catch (error) {
                addToast('فشل الحذف', 'error');
            }
        }
    };

    const inputClass = "w-full bg-gray-50 border-[1.5px] border-gray-200 rounded-xl py-2.5 px-4 text-sm text-gray-800 focus:outline-none focus:border-[var(--color-dark-turquoise)] focus:bg-white transition-all text-right";
    const labelClass = "text-xs font-bold text-[var(--color-dark-turquoise)] mb-1.5 block px-1";

    return (
        <div className="space-y-6 animate-fade-in pb-12" dir="rtl">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <PageHeader
                    title="أوقات الذروة والتسعير"
                    description="تحديد أوقات خاصة تتضاعف فيها أسعار الإعلانات"
                    icon={Clock}
                />
                <button
                    onClick={() => openModal()}
                    className="bg-[var(--color-dark-turquoise)] hover:opacity-90 text-white px-5 py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-sm"
                >
                    <Plus className="w-5 h-5" /> إضافة ذروة جديدة
                </button>
            </div>

            {/* Note about Mock Data */}
            <div className="bg-orange-50 border border-orange-200 text-orange-700 p-4 rounded-xl text-sm font-bold flex items-center gap-2">
                <span className="text-xl">⚠️</span> هذه الشاشة تعمل حالياً ببيانات وهمية (Mock Data) في الواجهة الأمامية فقط ريثما يتم تجهيز الـ API الخاص بها في الباك إند.
            </div>

            {isLoading ? (
                <div className="flex justify-center py-12">
                    <div className="w-8 h-8 border-4 border-[var(--color-dark-turquoise)]/20 border-t-[var(--color-dark-turquoise)] rounded-full animate-spin"></div>
                </div>
            ) : slots.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-2xl border border-gray-100 shadow-sm">
                    <Clock className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-bold text-gray-800 mb-2">لا توجد أوقات ذروة</h3>
                    <p className="text-gray-500 text-sm">لم تقم بإضافة أي أوقات ذروة بعد.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {slots.map(slot => (
                        <div key={slot.slot_id} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex items-start gap-4">
                            <div className="w-12 h-12 rounded-full bg-[var(--color-dark-turquoise)]/10 flex items-center justify-center text-[var(--color-dark-turquoise)] shrink-0">
                                <Clock className="w-6 h-6" />
                            </div>
                            <div className="flex-1">
                                <h4 className="font-bold text-gray-800 text-lg mb-1 flex items-center gap-2">
                                    <Tv className="w-4 h-4 text-gray-400" />
                                    {screens.find(s => s.screen_id == slot.screen_id)?.screen_name || slot.screen_name || 'شاشة غير معروفة'}
                                </h4>
                                <div className="text-sm text-gray-500 space-y-1 mb-3">
                                    <p>من {slot.start_time} إلى {slot.end_time}</p>
                                </div>
                                <span className="inline-block px-3 py-1 bg-orange-100 text-orange-700 rounded-md text-xs font-black">
                                    مضاعف السعر: {slot.price_multiplier}x
                                </span>
                            </div>
                            <div className="flex flex-col gap-2">
                                <button onClick={() => openModal(slot)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg">
                                    <Edit2 className="w-4 h-4" />
                                </button>
                                <button onClick={() => handleDelete(slot.slot_id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <Modal
                isOpen={isModalOpen}
                onClose={closeModal}
                title={editingSlot ? 'تعديل وقت ذروة' : 'إضافة وقت ذروة جديد'}
                icon={Clock}
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className={labelClass}>الشاشة المستهدفة *</label>
                        <select
                            required
                            disabled={!!editingSlot}
                            value={form.screen_id}
                            onChange={(e) => setForm({ ...form, screen_id: e.target.value })}
                            className={inputClass}
                        >
                            <option value="">اختر الشاشة</option>
                            {screens.map(s => (
                                <option key={s.screen_id} value={s.screen_id}>{s.screen_name}</option>
                            ))}
                        </select>
                        {editingSlot && <p className="text-[10px] text-gray-500 mt-1 px-1">لا يمكن تغيير الشاشة عند التعديل</p>}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className={labelClass}>وقت البدء *</label>
                            <input
                                type="time"
                                required
                                value={form.start_time}
                                onChange={(e) => setForm({ ...form, start_time: e.target.value })}
                                className={inputClass}
                            />
                        </div>
                        <div>
                            <label className={labelClass}>وقت الانتهاء *</label>
                            <input
                                type="time"
                                required
                                value={form.end_time}
                                onChange={(e) => setForm({ ...form, end_time: e.target.value })}
                                className={inputClass}
                            />
                        </div>
                    </div>

                    <div>
                        <label className={labelClass}>مضاعف السعر (Multiplier) *</label>
                        <input
                            type="number"
                            step="0.1"
                            min="0.1"
                            required
                            value={form.price_multiplier}
                            onChange={(e) => setForm({ ...form, price_multiplier: e.target.value })}
                            className={inputClass}
                            placeholder="1.5"
                        />
                        <p className="text-[10px] text-gray-500 mt-1 px-1">مثال: 1.5 يعني رفع سعر الإعلان بمرة ونصف خلال هذا الوقت.</p>
                    </div>

                    <div className="pt-4 flex gap-3">
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="flex-1 bg-[var(--color-dark-turquoise)] text-white py-3 rounded-xl font-bold hover:opacity-90 transition-opacity disabled:opacity-50"
                        >
                            {isSubmitting ? 'جاري الحفظ...' : 'حفظ'}
                        </button>
                        <button
                            type="button"
                            onClick={closeModal}
                            className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl font-bold hover:bg-gray-200 transition-colors"
                        >
                            إلغاء
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default PeakHoursPage;
