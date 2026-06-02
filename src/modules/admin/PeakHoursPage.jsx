import React, { useState, useEffect } from 'react';
import { Clock, Plus, Edit2, Trash2 } from 'lucide-react';
import axiosClient from '../../core/api/axiosClient';
import useToastStore from '../../store/useToastStore';
import PageHeader from '../../shared/components/PageHeader';
import Modal from '../../shared/components/Modal';
import DataTable from '../../shared/components/DataTable';
import { ENDPOINTS } from '../../core/api/endpoints';
import usePermission from '../../hooks/usePermission';

const PeakHoursPage = () => {
    const addToast = useToastStore(state => state.addToast);
    const [slots, setSlots] = useState([]);
    const [screens, setScreens] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingSlot, setEditingSlot] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { can } = usePermission();

    const [form, setForm] = useState({
        screen_id: '',
        start_time: '16:00',
        end_time: '22:00',
        price_multiplier: '1.5'
    });

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const screensRes = await axiosClient.get(ENDPOINTS.SCREENS.ALL);
            setScreens(Array.isArray(screensRes.data?.data) ? screensRes.data.data : screensRes.data || []);

            if (can('manage_all')) {
                const slotsRes = await axiosClient.get(ENDPOINTS.SCREEN_PRICING.ALL);
                setSlots(slotsRes.data?.data || []);
            }
        } catch (error) {
            addToast(error.response?.data?.message || 'فشل في جلب البيانات', 'error');
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
                start_time: slot.start_time ? slot.start_time.substring(0, 5) : '16:00',
                end_time: slot.end_time ? slot.end_time.substring(0, 5) : '22:00',
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
                screen_id: parseInt(form.screen_id),
                start_time: form.start_time,
                end_time: form.end_time,
                price_multiplier: parseFloat(form.price_multiplier)
            };

            if (editingSlot) {
                await axiosClient.put(ENDPOINTS.SCREEN_PRICING.UPDATE(editingSlot.slot_id), payload);
                addToast('تم تعديل وقت الذروة بنجاح', 'success');
            } else {
                await axiosClient.post(ENDPOINTS.SCREEN_PRICING.ALL, payload);
                addToast('تم إضافة وقت الذروة بنجاح', 'success');
            }
            closeModal();
            fetchData();
        } catch (error) {
            addToast(error.response?.data?.message || 'حدث خطأ أثناء حفظ وقت الذروة', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('هل أنت متأكد من حذف وقت الذروة هذا؟')) {
            try {
                await axiosClient.delete(ENDPOINTS.SCREEN_PRICING.DELETE(id));
                addToast('تم حذف وقت الذروة بنجاح', 'success');
                fetchData();
            } catch (error) {
                addToast(error.response?.data?.message || 'فشل الحذف', 'error');
            }
        }
    };

    const columns = [
        {
            header: 'الشاشة',
            accessorKey: 'screen',
            cell: (row) => {
                const screenName = screens.find(s => s.screen_id == row.screen_id)?.screen_name || row.screen?.screen_name || 'شاشة غير معروفة';
                return <span className="font-bold">{screenName}</span>;
            }
        },
        {
            header: 'وقت البدء',
            accessorKey: 'start_time',
            cell: (row) => <span className="text-gray-600" dir="ltr">{row.start_time?.substring(0, 5)}</span>
        },
        {
            header: 'وقت الانتهاء',
            accessorKey: 'end_time',
            cell: (row) => <span className="text-gray-600" dir="ltr">{row.end_time?.substring(0, 5)}</span>
        },
        {
            header: 'مضاعف السعر',
            accessorKey: 'price_multiplier',
            cell: (row) => (
                <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-md text-xs font-black inline-block">
                    {row.price_multiplier}x
                </span>
            )
        }
    ];

    if (can('manage_all')) {
        columns.push({
            header: 'إجراءات',
            accessorKey: 'actions',
            cell: (row) => (
                <div className="flex justify-center gap-2">
                    <button onClick={() => openModal(row)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                        <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(row.slot_id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            )
        });
    }

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
                {can('manage_all') && (
                    <button
                        onClick={() => openModal()}
                        className="bg-[var(--color-dark-turquoise)] hover:opacity-90 text-white px-5 py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-sm shrink-0"
                    >
                        <Plus className="w-5 h-5" /> إضافة ذروة جديدة
                    </button>
                )}
            </div>

            <DataTable
                columns={columns}
                data={slots.map(slot => ({ ...slot, id: slot.slot_id }))}
                loading={isLoading}
                emptyMessage="لم تقم بإضافة أي أوقات ذروة بعد."
            />

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
