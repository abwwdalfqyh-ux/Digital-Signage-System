import React, { useState, useEffect } from 'react';
import axiosClient from '../../core/api/axiosClient';
import { ENDPOINTS } from '../../core/api/endpoints';
import useToastStore from '../../store/useToastStore';
import Modal from '../../shared/components/Modal';
import ConfirmDialog from '../../shared/components/ConfirmDialog';
import usePermission from '../../hooks/usePermission';
import useTranslation from '../../i18n/useTranslation';

const PeakHoursPage = () => {
    const { t, dir } = useTranslation();
    const addToast = useToastStore(state => state.addToast);
    const [slots, setSlots] = useState([]);
    const [screens, setScreens] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingSlot, setEditingSlot] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [deleteDialog, setDeleteDialog] = useState({ open: false, id: null });
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
            addToast(error.response?.data?.message || t('admin.fetch_failed'), 'error');
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
            addToast(t('admin.fill_required_fields'), 'warning');
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
                const res = await axiosClient.put(ENDPOINTS.SCREEN_PRICING.UPDATE(editingSlot.slot_id), payload);
                if (res.data.success || res.status === 200 || res.status === 201) {
                    addToast(t('admin.peak_hour_updated'), 'success');
                }
            } else {
                const res = await axiosClient.post(ENDPOINTS.SCREEN_PRICING.ALL, payload);
                if (res.data.success || res.status === 200 || res.status === 201) {
                    addToast(t('admin.peak_hour_added'), 'success');
                }
            }
            closeModal();
            fetchData();
        } catch (error) {
            addToast(error.response?.data?.message || t('admin.peak_hour_save_error'), 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async () => {
        const { id } = deleteDialog;
        try {
            const res = await axiosClient.delete(ENDPOINTS.SCREEN_PRICING.DELETE(id));
            if (res.data.success || res.status === 200) {
                addToast(t('admin.peak_hour_deleted'), 'success');
                fetchData();
            }
        } catch (error) {
            addToast(error.response?.data?.message || t('admin.delete_failed'), 'error');
        } finally {
            setDeleteDialog({ open: false, id: null });
        }
    };

    const inputClass = "w-full bg-background border border-outline-variant rounded-lg py-2.5 px-4 font-body-md text-on-surface placeholder-on-surface-variant focus:outline-none focus:border-primary focus:bg-surface transition-all text-right";
    const labelClass = "font-label-md text-label-md text-on-surface-variant mb-1.5 block px-1";

    return (
        <div className="space-y-6 pb-12" dir={dir}>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="font-headline-lg text-headline-lg font-semibold text-on-surface mb-2">{t('admin.peak_hours_title')}</h1>
                    <p className="text-on-surface-variant font-body-md text-body-md">{t('admin.peak_hours_subtitle')}</p>
                </div>
                {can('manage_all') && (
                    <button
                        onClick={() => openModal()}
                        className="bg-primary hover:bg-primary/90 text-on-primary font-label-md text-label-md px-6 py-2.5 rounded-lg flex items-center justify-center gap-2 shadow-sm transition-all whitespace-nowrap"
                    >
                        <span className="material-symbols-outlined text-[20px]">add</span>
                        <span className="hidden sm:inline">{t('admin.add_new_peak_hour')}</span>
                    </button>
                )}
            </div>

            <div className="bg-surface rounded-2xl border border-outline-variant shadow-sm overflow-hidden flex flex-col min-h-[300px] mt-8">
                <div className="p-6 border-b border-outline-variant flex justify-between items-center bg-surface-container-low">
                    <h3 className="font-title-lg text-title-lg font-semibold text-on-surface">{t('admin.peak_hours_list')}</h3>
                </div>
                
                {isLoading ? (
                    <div className="flex justify-center items-center flex-1 bg-surface/50 z-10 py-20">
                        <div className="w-8 h-8 border-4 border-outline-variant border-t-primary rounded-full animate-spin"></div>
                    </div>
                ) : slots.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-12 text-center my-auto">
                        <div className="w-16 h-16 bg-surface-container-lowest rounded-full flex items-center justify-center mb-4 border border-outline-variant">
                            <span className="material-symbols-outlined text-[48px] text-on-surface-variant mb-4 opacity-50">schedule</span>
                        </div>
                        <h4 className="font-headline-md text-headline-md text-on-surface mb-2">{t('admin.no_peak_hours')}</h4>
                        <p className="font-body-md text-body-md text-on-surface-variant">{t('admin.add_peak_hours_to_start')}</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-right border-collapse">
                            <thead className="bg-surface-container-low border-b border-outline-variant">
                                <tr>
                                    <th className="py-4 px-6 font-label-md text-label-md text-on-surface-variant font-medium whitespace-nowrap text-start">{t('admin.screen')}</th>
                                    <th className="py-4 px-6 font-label-md text-label-md text-on-surface-variant font-medium whitespace-nowrap text-center">{t('admin.start_time')}</th>
                                    <th className="py-4 px-6 font-label-md text-label-md text-on-surface-variant font-medium whitespace-nowrap text-center">{t('admin.end_time')}</th>
                                    <th className="py-4 px-6 font-label-md text-label-md text-on-surface-variant font-medium whitespace-nowrap text-center">{t('admin.price_multiplier')}</th>
                                    {can('manage_all') && <th className="py-4 px-6 font-label-md text-label-md text-on-surface-variant font-medium whitespace-nowrap text-left">{t('common.actions')}</th>}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-outline-variant font-body-md text-body-md">
                                {slots.map((row, index) => {
                                    const id = row.slot_id || row.id || index;
                                    const screenName = screens.find(s => s.screen_id == row.screen_id)?.screen_name || row.screen?.screen_name || t('admin.unknown_screen');
                                    return (
                                        <tr key={id} className="hover:bg-surface-container-lowest transition-colors group">
                                            <td className="py-4 px-6 text-on-surface font-medium whitespace-nowrap">
                                                {screenName}
                                            </td>
                                            <td className="py-4 px-6 text-center text-on-surface-variant font-mono whitespace-nowrap">
                                                {row.start_time?.substring(0, 5)}
                                            </td>
                                            <td className="py-4 px-6 text-center text-on-surface-variant font-mono whitespace-nowrap">
                                                {row.end_time?.substring(0, 5)}
                                            </td>
                                            <td className="py-4 px-6 text-center whitespace-nowrap">
                                                <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-md bg-orange-50 text-orange-700 border border-orange-200 font-bold text-xs tracking-wide">
                                                    {row.price_multiplier}x
                                                </span>
                                            </td>
                                            {can('manage_all') && (
                                                <td className="py-4 px-6 text-left whitespace-nowrap">
                                                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button 
                                                            type="button" 
                                                            onClick={() => openModal(row)}
                                                            className="w-8 h-8 rounded-full flex items-center justify-center text-primary hover:bg-primary/10 transition-colors" 
                                                            title={t('common.edit')}
                                                        >
                                                            <span className="material-symbols-outlined text-sm">edit</span>
                                                        </button>
                                                        <button 
                                                            type="button" 
                                                            onClick={() => setDeleteDialog({ open: true, id: row.slot_id })}
                                                            className="w-8 h-8 rounded-full flex items-center justify-center text-error hover:bg-error/10 transition-colors" 
                                                            title={t('common.delete')}
                                                        >
                                                            <span className="material-symbols-outlined text-sm">delete</span>
                                                        </button>
                                                    </div>
                                                </td>
                                            )}
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <Modal
                isOpen={isModalOpen}
                onClose={() => !isSubmitting && closeModal()}
                title={editingSlot ? t('admin.edit_peak_hour') : t('admin.add_new_peak_hour')}
                size="md"
            >
                <form onSubmit={handleSubmit} className="space-y-6 mt-4">
                    <div>
                        <label className={labelClass}>{t('admin.target_screen')} <span className="text-error">*</span></label>
                        <select
                            required
                            disabled={!!editingSlot}
                            value={form.screen_id}
                            onChange={(e) => setForm({ ...form, screen_id: e.target.value })}
                            className={inputClass}
                        >
                            <option value="">{t('admin.select_screen')}</option>
                            {screens.map(s => (
                                <option key={s.screen_id} value={s.screen_id}>{s.screen_name}</option>
                            ))}
                        </select>
                        {editingSlot && <p className="font-body-sm text-body-sm text-on-surface-variant mt-1.5 px-1">{t('admin.cannot_change_screen')}</p>}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div>
                            <label className={labelClass}>{t('admin.start_time')} <span className="text-error">*</span></label>
                            <div className="relative">
                                <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-sm">schedule</span>
                                <input
                                    type="time"
                                    required
                                    value={form.start_time}
                                    onChange={(e) => setForm({ ...form, start_time: e.target.value })}
                                    className={`${inputClass} pr-9`}
                                />
                            </div>
                        </div>
                        <div>
                            <label className={labelClass}>{t('admin.end_time')} <span className="text-error">*</span></label>
                            <div className="relative">
                                <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-sm">update</span>
                                <input
                                    type="time"
                                    required
                                    value={form.end_time}
                                    onChange={(e) => setForm({ ...form, end_time: e.target.value })}
                                    className={`${inputClass} pr-9`}
                                />
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className={labelClass}>{t('admin.price_multiplier')} <span className="text-error">*</span></label>
                        <div className="relative">
                            <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-sm">close</span>
                            <input
                                type="number"
                                step="0.1"
                                min="0.1"
                                required
                                value={form.price_multiplier}
                                onChange={(e) => setForm({ ...form, price_multiplier: e.target.value })}
                                className={`${inputClass} pr-9`}
                                placeholder={t('admin.multiplier_placeholder')}
                            />
                        </div>
                        <p className="font-body-sm text-body-sm text-on-surface-variant mt-1.5 px-1">{t('admin.multiplier_hint')}</p>
                    </div>

                    <div className="pt-4 flex gap-3">
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="flex-1 bg-primary text-on-primary py-3 rounded-lg font-label-md text-label-md hover:bg-primary/90 shadow-sm transition-colors disabled:opacity-50"
                        >
                            {isSubmitting ? '...' : t('common.save')}
                        </button>
                        <button
                            type="button"
                            onClick={closeModal}
                            className="flex-1 bg-surface-variant text-on-surface-variant py-3 rounded-lg font-label-md text-label-md hover:bg-surface-container-highest border border-outline-variant transition-colors"
                        >
                            {t('common.cancel')}
                        </button>
                    </div>
                </form>
            </Modal>

            <ConfirmDialog 
                isOpen={deleteDialog.open} 
                onClose={() => setDeleteDialog({ open: false, id: null })}
                onConfirm={handleDelete} 
                title={t('admin.confirm_delete_peak_hour')}
                message={t('admin.delete_peak_hour_warning')}
                confirmText={t('admin.confirm_delete')}
            />
        </div>
    );
};

export default PeakHoursPage;
