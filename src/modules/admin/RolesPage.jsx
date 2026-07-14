import React, { useState, useEffect } from 'react';
import axiosClient from '../../core/api/axiosClient';
import { ENDPOINTS } from '../../core/api/endpoints';
import useToastStore from '../../store/useToastStore';
import Modal from '../../shared/components/Modal';
import usePermission from '../../hooks/usePermission';
import ConfirmDialog from '../../shared/components/ConfirmDialog';

const RolesPage = () => {
    const addToast = useToastStore(state => state.addToast);
    const [roles, setRoles] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingRole, setEditingRole] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [deleteTargetId, setDeleteTargetId] = useState(null);
    const { can } = usePermission();

    const [form, setForm] = useState({
        role_name: ''
    });

    const PROTECTED_ROLES = ['SuperAdmin', 'Advertiser', 'ScreenOwner', 'Maintenance', 'Secretary'];

    const fetchRoles = async () => {
        setIsLoading(true);
        try {
            const res = await axiosClient.get(ENDPOINTS.LOOKUPS.ROLES);
            if (res.data.success) {
                setRoles(res.data.data || []);
            } else {
                setRoles(Array.isArray(res.data) ? res.data : []);
            }
        } catch (error) {
            addToast('فشل في جلب الصلاحيات والأدوار', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchRoles();
    }, []);

    const openModal = (role = null) => {
        if (role) {
            setEditingRole(role);
            setForm({ role_name: role.role_name || '' });
        } else {
            setEditingRole(null);
            setForm({ role_name: '' });
        }
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingRole(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.role_name.trim()) {
            addToast('يرجى إدخال اسم الدور', 'warning');
            return;
        }

        setIsSubmitting(true);
        try {
            if (editingRole) {
                const id = editingRole.role_id || editingRole.id;
                await axiosClient.put(ENDPOINTS.LOOKUPS.ROLE(id), form);
                addToast('تم تعديل الدور بنجاح', 'success');
            } else {
                await axiosClient.post(ENDPOINTS.LOOKUPS.ROLES, form);
                addToast('تم إضافة الدور بنجاح', 'success');
            }
            closeModal();
            fetchRoles();
        } catch (error) {
            const errList = error.response?.data?.errors;
            if (errList) {
                const firstErr = Object.values(errList)[0][0];
                addToast(firstErr, 'error');
            } else {
                addToast(error.response?.data?.message || 'حدث خطأ أثناء حفظ الدور', 'error');
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const confirmDelete = async () => {
        if (!deleteTargetId) return;
        try {
            await axiosClient.delete(ENDPOINTS.LOOKUPS.ROLE(deleteTargetId));
            addToast('تم حذف الدور بنجاح', 'success');
            fetchRoles();
        } catch (error) {
            addToast(error.response?.data?.message || 'فشل حذف الدور', 'error');
        } finally {
            setDeleteTargetId(null);
        }
    };

    const inputClass = "w-full bg-background border border-outline-variant rounded-lg py-2.5 px-4 font-body-md text-on-surface placeholder-on-surface-variant focus:outline-none focus:border-primary focus:bg-surface transition-all text-right";
    const labelClass = "font-label-md text-label-md text-on-surface-variant mb-1.5 block px-1";

    return (
        <div className="space-y-8 animate-fade-in pb-12" dir="rtl">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-r-4 border-primary pr-6 bg-surface p-6 rounded-2xl shadow-sm border border-outline-variant">
                <div>
                    <h1 className="font-headline-lg text-headline-lg font-semibold text-on-surface mb-2">إدارة الأدوار والصلاحيات</h1>
                    <p className="text-on-surface-variant font-body-md text-body-md">إضافة وتعديل أدوار المستخدمين في النظام</p>
                </div>
                <div>
                    {can('manage_all') && (
                        <button
                            onClick={() => openModal()}
                            className="bg-primary hover:bg-primary/90 text-on-primary font-label-md text-label-md px-6 py-3 rounded-lg flex items-center gap-2 shadow-sm transition-transform hover:-translate-y-0.5 active:translate-y-0 duration-200"
                        >
                            <span className="material-symbols-outlined">add</span>
                            إضافة دور جديد
                        </button>
                    )}
                </div>
            </div>

            <div className="bg-surface rounded-2xl border border-outline-variant shadow-sm overflow-hidden flex flex-col min-h-[300px] relative">
                {isLoading ? (
                    <div className="flex justify-center items-center absolute inset-0 bg-surface/50 z-10">
                        <div className="w-8 h-8 border-4 border-outline-variant border-t-primary rounded-full animate-spin"></div>
                    </div>
                ) : roles.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-12 text-center my-auto">
                        <div className="w-16 h-16 bg-surface-container-lowest rounded-full flex items-center justify-center mb-4 border border-outline-variant">
                            <span className="material-symbols-outlined text-outline text-3xl">warning</span>
                        </div>
                        <h4 className="font-headline-md text-headline-md text-on-surface mb-2">لا توجد بيانات</h4>
                        <p className="font-body-md text-body-md text-on-surface-variant">لا توجد أدوار مضافة حالياً.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-right border-collapse">
                            <thead className="bg-surface-container-low border-b border-outline-variant">
                                <tr>
                                    <th className="py-4 px-6 font-title-lg text-title-lg text-on-surface font-semibold whitespace-nowrap">اسم الدور</th>
                                    <th className="py-4 px-6 font-title-lg text-title-lg text-on-surface font-semibold whitespace-nowrap text-center">النوع</th>
                                    {can('manage_all') && <th className="py-4 px-6 font-title-lg text-title-lg text-on-surface font-semibold whitespace-nowrap text-left">إجراءات</th>}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-outline-variant font-body-md text-body-md">
                                {roles.map((row, index) => {
                                    const id = row.role_id || row.id || index;
                                    const isProtected = PROTECTED_ROLES.includes(row.role_name);
                                    return (
                                        <tr key={id} className="hover:bg-surface-container-lowest transition-colors group">
                                            <td className="py-4 px-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-surface-container-high text-primary flex items-center justify-center">
                                                        <span className="material-symbols-outlined">shield</span>
                                                    </div>
                                                    <span className="font-medium">{row.role_name}</span>
                                                </div>
                                            </td>
                                            <td className="py-4 px-6 text-center">
                                                {isProtected ? (
                                                    <span className="inline-flex items-center px-3 py-1 rounded-full bg-[#fef3c7] text-[#92400e] font-caption text-caption border border-[#fde68a]">دور أساسي (محمي)</span>
                                                ) : (
                                                    <span className="inline-flex items-center px-3 py-1 rounded-full bg-surface-variant text-on-surface-variant font-caption text-caption">دور مخصص</span>
                                                )}
                                            </td>
                                            {can('manage_all') && (
                                                <td className="py-4 px-6 text-left">
                                                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button
                                                            type="button"
                                                            onClick={(e) => { e.stopPropagation(); openModal(row); }}
                                                            className="p-2 text-primary hover:bg-surface-container-high rounded-full transition-colors"
                                                            title="تعديل"
                                                        >
                                                            <span className="material-symbols-outlined">edit</span>
                                                        </button>
                                                        {!isProtected && (
                                                            <button
                                                                type="button"
                                                                onClick={(e) => { e.stopPropagation(); setDeleteTargetId(id); }}
                                                                className="p-2 text-error hover:bg-error-container rounded-full transition-colors"
                                                                title="حذف"
                                                            >
                                                                <span className="material-symbols-outlined">delete</span>
                                                            </button>
                                                        )}
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
                onClose={closeModal}
                title={editingRole ? 'تعديل الدور' : 'إضافة دور جديد'}
                size="sm"
            >
                <form onSubmit={handleSubmit} className="space-y-4 mt-4" dir="rtl">
                    <div>
                        <label className={labelClass}>اسم الدور <span className="text-error">*</span></label>
                        <input
                            type="text"
                            required
                            maxLength="50"
                            value={form.role_name}
                            onChange={(e) => setForm({ role_name: e.target.value })}
                            className={inputClass}
                            placeholder="مثال: مدير مالي"
                        />
                    </div>

                    <div className="pt-4 flex gap-3">
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="flex-1 bg-primary text-on-primary py-3 rounded-lg font-label-md text-label-md hover:bg-primary/90 shadow-sm transition-colors disabled:opacity-50"
                        >
                            {isSubmitting ? 'جاري الحفظ...' : 'تأكيد الحفظ'}
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

            <ConfirmDialog
                isOpen={!!deleteTargetId}
                onClose={() => setDeleteTargetId(null)}
                onConfirm={confirmDelete}
                title="تأكيد حذف الدور"
                message="هل أنت متأكد من حذف هذا الدور؟ قد يسبب هذا مشاكل إذا كان هناك مستخدمون مرتبطون به."
                confirmText="نعم، موافق على الحذف"
            />
        </div>
    );
};

export default RolesPage;

