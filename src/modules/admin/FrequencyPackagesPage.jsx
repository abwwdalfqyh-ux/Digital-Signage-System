import React, { useState, useEffect } from 'react';
import axiosClient from '../../core/api/axiosClient';
import useToastStore from '../../store/useToastStore';
import Modal from '../../shared/components/Modal';
import ConfirmDialog from '../../shared/components/ConfirmDialog';
import { ENDPOINTS } from '../../core/api/endpoints';
import usePermission from '../../hooks/usePermission';
import { useFrequencyPackages, useCreateFrequencyPackage, useUpdateFrequencyPackage, useDeleteFrequencyPackage } from '../../hooks/api/usePackages';

const FrequencyPackagesPage = () => {
    const { data: packages = [], isLoading } = useFrequencyPackages();
    const { mutateAsync: createPackage } = useCreateFrequencyPackage();
    const { mutateAsync: updatePackage } = useUpdateFrequencyPackage();
    const { mutateAsync: deletePackage } = useDeleteFrequencyPackage();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingPackage, setEditingPackage] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [deleteDialog, setDeleteDialog] = useState({ open: false, id: null });
    const { can } = usePermission();

    const [form, setForm] = useState({
        name: '',
        display_interval: '1',
        price_multiplier: '1.0'
    });

    const openModal = (pkg = null) => {
        if (pkg) {
            setEditingPackage(pkg);
            setForm({
                name: pkg.name || '',
                display_interval: pkg.display_interval?.toString() || '1',
                price_multiplier: pkg.price_multiplier?.toString() || '1.0'
            });
        } else {
            setEditingPackage(null);
            setForm({ name: '', display_interval: '1', price_multiplier: '1.0' });
        }
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingPackage(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.name || !form.display_interval || !form.price_multiplier) {
            addToast('يرجى تعبئة جميع الحقول المطلوبة', 'warning');
            return;
        }

        setIsSubmitting(true);
        try {
            const payload = {
                name: form.name,
                display_interval: parseInt(form.display_interval),
                price_multiplier: parseFloat(form.price_multiplier)
            };

            if (editingPackage) {
                await updatePackage({ id: editingPackage.id, payload });
                addToast('تم تحديث باقة التكرار بنجاح', 'success');
            } else {
                await createPackage(payload);
                addToast('تم إضافة باقة التكرار بنجاح', 'success');
            }
            closeModal();
        } catch (error) {
            // Handled by hook
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async () => {
        const { id } = deleteDialog;
        try {
            await deletePackage(id);
            addToast('تم حذف الباقة بنجاح', 'success');
            setDeleteDialog({ open: false, id: null });
        } catch (error) {
            // Handled by hook
        }
    };

    const getMultiplierStyle = (multiplier) => {
        const val = parseFloat(multiplier);
        if (val <= 1.0) return "bg-[#DCFCE7] text-[#166534] border-[#bbf7d0]";
        if (val < 2.0) return "bg-[#FEF9C3] text-[#854D0E] border-[#fef08a]";
        return "bg-orange-50 text-orange-700 border-orange-200";
    };

    const inputClass = "w-full bg-background border border-outline-variant rounded-lg py-2.5 px-4 font-body-md text-on-surface placeholder-on-surface-variant focus:outline-none focus:border-primary focus:bg-surface transition-all text-right";
    const labelClass = "font-label-md text-label-md text-on-surface-variant mb-1.5 block px-1";

    return (
        <div className="space-y-6 pb-12" dir="rtl">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 py-4 mb-2">
                <div className="flex flex-col">
                    <h1 className="font-headline-lg text-headline-lg font-bold text-on-surface mb-1 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                            <span className="material-symbols-outlined text-xl">replay</span>
                        </div>
                        باقات التكرار
                    </h1>
                    <p className="text-on-surface-variant font-body-md text-body-md">إدارة معدل تكرار ظهور الإعلانات ومضاعفات أسعارها.</p>
                </div>
                {can('manage_all') && (
                    <button
                        onClick={() => openModal()}
                        className="bg-primary hover:bg-primary/90 text-on-primary font-label-md text-label-md px-6 py-2.5 rounded-lg flex items-center justify-center gap-2 shadow-sm transition-all whitespace-nowrap"
                    >
                        <span className="material-symbols-outlined text-xl">add</span>
                        إضافة باقة جديدة
                    </button>
                )}
            </div>

            {/* Table Card */}
            <div className="bg-surface rounded-2xl border border-outline-variant shadow-sm overflow-hidden flex flex-col min-h-[300px] mt-8">
                <div className="p-5 border-b border-outline-variant flex justify-between items-center bg-surface">
                    <h3 className="font-title-lg text-title-lg text-on-surface font-semibold flex items-center gap-2">
                        قائمة باقات التكرار
                    </h3>
                </div>
                
                {isLoading ? (
                    <div className="flex justify-center items-center flex-1 bg-surface/50 z-10 py-20">
                        <div className="w-8 h-8 border-4 border-outline-variant border-t-primary rounded-full animate-spin"></div>
                    </div>
                ) : packages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-12 text-center my-auto">
                        <div className="w-16 h-16 bg-surface-container-lowest rounded-full flex items-center justify-center mb-4 border border-outline-variant">
                            <span className="material-symbols-outlined text-outline text-3xl">info</span>
                        </div>
                        <h4 className="font-headline-md text-headline-md text-on-surface mb-2">لا توجد باقات تكرار</h4>
                        <p className="font-body-md text-body-md text-on-surface-variant">أضف باقات تكرار جديدة للبدء.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-right border-collapse">
                            <thead className="bg-surface-container-low border-b border-outline-variant">
                                <tr>
                                    <th className="py-4 px-6 font-label-md text-label-md text-on-surface-variant font-medium whitespace-nowrap">اسم الباقة</th>
                                    <th className="py-4 px-6 font-label-md text-label-md text-on-surface-variant font-medium whitespace-nowrap text-center">تكرار العرض</th>
                                    <th className="py-4 px-6 font-label-md text-label-md text-on-surface-variant font-medium whitespace-nowrap text-center">مضاعف السعر</th>
                                    {can('manage_all') && <th className="py-4 px-6 font-label-md text-label-md text-on-surface-variant font-medium whitespace-nowrap text-left">إجراءات</th>}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-outline-variant font-body-md text-body-md">
                                {packages.map((pkg, index) => {
                                    const id = pkg.id || index;
                                    return (
                                        <tr key={id} className="hover:bg-surface-container-lowest transition-colors group">
                                            <td className="py-4 px-6 font-medium text-on-surface whitespace-nowrap">
                                                {pkg.name}
                                            </td>
                                            <td className="py-4 px-6 text-center text-on-surface-variant font-mono whitespace-nowrap">
                                                كل {pkg.display_interval} دقيقة
                                            </td>
                                            <td className="py-4 px-6 text-center whitespace-nowrap">
                                                <span className={`inline-flex items-center justify-center px-2.5 py-1 rounded-md border font-bold text-xs tracking-wide ${getMultiplierStyle(pkg.price_multiplier)}`}>
                                                    {parseFloat(pkg.price_multiplier).toFixed(2)}x
                                                </span>
                                            </td>
                                            {can('manage_all') && (
                                                <td className="py-4 px-6 text-left whitespace-nowrap">
                                                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button 
                                                            type="button" 
                                                            onClick={(e) => { e.stopPropagation(); openModal(pkg); }} 
                                                            className="w-8 h-8 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-primary/10 hover:text-primary transition-colors" 
                                                            title="تعديل"
                                                        >
                                                            <span className="material-symbols-outlined text-sm">edit</span>
                                                        </button>
                                                        <button 
                                                            type="button" 
                                                            onClick={(e) => { e.stopPropagation(); setDeleteDialog({ open: true, id: pkg.id }); }} 
                                                            className="w-8 h-8 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-error/10 hover:text-error transition-colors" 
                                                            title="حذف"
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

            {/* Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={closeModal}
                title={editingPackage ? 'تعديل باقة تكرار' : 'إضافة باقة تكرار جديدة'}
                size="md"
            >
                <form onSubmit={handleSubmit} className="space-y-4 mt-4" dir="rtl">
                    <div>
                        <label className={labelClass}>اسم الباقة <span className="text-error">*</span></label>
                        <input
                            type="text"
                            required
                            maxLength="100"
                            value={form.name}
                            onChange={(e) => setForm({ ...form, name: e.target.value })}
                            className={inputClass}
                            placeholder="مثال: ذهبية، فضية..."
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className={labelClass}>تكرار العرض (بالدقائق) <span className="text-error">*</span></label>
                            <div className="relative">
                                <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-sm">timer</span>
                                <input
                                    type="number"
                                    required
                                    min="1"
                                    value={form.display_interval}
                                    onChange={(e) => setForm({ ...form, display_interval: e.target.value })}
                                    className={`${inputClass} pr-9`}
                                    placeholder="1"
                                />
                            </div>
                        </div>
                        <div>
                            <label className={labelClass}>مضاعف السعر <span className="text-error">*</span></label>
                            <div className="relative">
                                <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-sm">close</span>
                                <input
                                    type="number"
                                    step="0.01"
                                    required
                                    min="0.01"
                                    value={form.price_multiplier}
                                    onChange={(e) => setForm({ ...form, price_multiplier: e.target.value })}
                                    className={`${inputClass} pr-9`}
                                    placeholder="1.0"
                                />
                            </div>
                        </div>
                    </div>
                    
                    <p className="font-body-sm text-body-sm text-on-surface-variant px-1 pt-1">
                        تكرار العرض: كل كم دقيقة يتم عرض الإعلان. <br />
                        مضاعف السعر: القيمة التي يضرب بها السعر الأساسي.
                    </p>

                    <div className="pt-4 flex gap-3">
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="flex-1 bg-primary text-on-primary py-3 rounded-lg font-label-md text-label-md hover:bg-primary/90 shadow-sm transition-colors disabled:opacity-50"
                        >
                            {isSubmitting ? 'جاري المعالجة...' : 'تخزين واعتماد'}
                        </button>
                        <button
                            type="button"
                            onClick={closeModal}
                            className="flex-1 bg-surface-variant text-on-surface-variant py-3 rounded-lg font-label-md text-label-md hover:bg-surface-container-highest border border-outline-variant transition-colors"
                        >
                            إلغاء
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Delete Confirmation */}
            <ConfirmDialog 
                isOpen={deleteDialog.open} 
                onClose={() => setDeleteDialog({ open: false, id: null })}
                onConfirm={handleDelete} 
                title="تأكيد الحذف" 
                message="هل أنت متأكد من حذف باقة التكرار هذه؟ قد يؤثر ذلك على الإعلانات المستقبلية." 
                confirmText="تأكيد الحذف" 
            />
        </div>
    );
};

export default FrequencyPackagesPage;
