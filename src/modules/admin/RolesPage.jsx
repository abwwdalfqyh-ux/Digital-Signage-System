import React, { useState, useEffect } from 'react';
import axiosClient from '../../core/api/axiosClient';
import { ENDPOINTS } from '../../core/api/endpoints';
import useToastStore from '../../store/useToastStore';
import Modal from '../../shared/components/Modal';
import usePermission from '../../hooks/usePermission';
import useTranslation from '../../i18n/useTranslation';

const RolesPage = () => {
    const { t, dir } = useTranslation();
    const addToast = useToastStore(state => state.addToast);
    const [roles, setRoles] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingRole, setEditingRole] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { can } = usePermission();

    const [form, setForm] = useState({
        role_name: ''
    });

    const PROTECTED_ROLES = [1, 2, 3, 4, 6, 7]; // SuperAdmin, Advertiser, ScreenOwner, Maintenance, Secretary, Admin

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
            addToast(t('admin.roles_fetch_failed'), 'error');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchRoles();
    }, []);

    const openModal = (role) => {
        if (role) {
            setEditingRole(role);
            setForm({ role_name: role.role_name || '' });
            setIsModalOpen(true);
        }
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingRole(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.role_name.trim()) {
            addToast(t('admin.role_name_required'), 'warning');
            return;
        }

        setIsSubmitting(true);
        try {
            if (editingRole) {
                const res = await axiosClient.put(ENDPOINTS.LOOKUPS.ROLE(editingRole.role_id || editingRole.id), form);
                if (res.data.success || res.status === 200) {
                    addToast(t('admin.role_updated'), 'success');
                }
            }
            closeModal();
            fetchRoles();
        } catch (error) {
            const errList = error.response?.data?.errors;
            if (errList) {
                const firstErr = Object.values(errList)[0][0];
                addToast(firstErr, 'error');
            } else {
                addToast(error.response?.data?.message || t('admin.role_save_error'), 'error');
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const inputClass = "w-full bg-background border border-outline-variant rounded-lg py-2.5 px-4 font-body-md text-on-surface placeholder-on-surface-variant focus:outline-none focus:border-primary focus:bg-surface transition-all text-right";
    const labelClass = "font-label-md text-label-md text-on-surface-variant mb-1.5 block px-1";

    return (
        <div className="space-y-8 animate-fade-in pb-12" dir="rtl">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="font-headline-lg text-headline-lg font-semibold text-on-surface mb-2">{t('admin.roles_title')}</h1>
                    <p className="text-on-surface-variant font-body-md text-body-md">{t('admin.roles_subtitle')}</p>
                </div>
            </div>

            <div className="bg-surface rounded-2xl border border-outline-variant shadow-sm overflow-hidden flex flex-col min-h-[300px] relative">
                {isLoading ? (
                    <div className="flex justify-center items-center absolute inset-0 bg-surface/50 z-10">
                        <div className="w-8 h-8 border-4 border-outline-variant border-t-primary rounded-full animate-spin"></div>
                    </div>
                ) : roles.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-12 text-center my-auto">
                        <div className="bg-surface-container-lowest p-12 text-center rounded-3xl border border-outline-variant">
                            <span className="material-symbols-outlined text-[48px] text-on-surface-variant mb-4 opacity-50">security</span>
                            <h4 className="font-headline-md text-headline-md text-on-surface mb-2">{t('common.no_data')}</h4>
                            <p className="font-body-md text-body-md text-on-surface-variant">{t('admin.no_roles_added')}</p>
                        </div>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-right border-collapse">
                            <thead className="bg-surface-container-low border-b border-outline-variant">
                                <tr>
                                    <th className="py-4 px-6 font-title-lg text-title-lg text-on-surface font-semibold whitespace-nowrap text-start">{t('admin.role_name')}</th>
                                    <th className="py-4 px-6 font-title-lg text-title-lg text-on-surface font-semibold whitespace-nowrap text-center">{t('admin.role_type')}</th>
                                    {can('manage_all') && <th className="py-4 px-6 font-title-lg text-title-lg text-on-surface font-semibold whitespace-nowrap text-left">{t('admin.actions')}</th>}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-outline-variant font-body-md text-body-md">
                                {roles.map((row, index) => {
                                    const id = row.role_id || row.id || index;
                                    const isProtected = PROTECTED_ROLES.includes(id);
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
                                                    <span className="inline-flex items-center px-3 py-1 rounded-full bg-[#fef3c7] text-[#92400e] font-caption text-caption border border-[#fde68a]">{t('admin.core_role')}</span>
                                                ) : (
                                                    <span className="inline-flex items-center px-3 py-1 rounded-full bg-surface-variant text-on-surface-variant font-caption text-caption">{t('admin.custom_role')}</span>
                                                )}
                                            </td>
                                            {can('manage_all') && (
                                                <td className="py-4 px-6 text-left">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <button
                                                            type="button"
                                                            onClick={(e) => { e.stopPropagation(); openModal(row); }}
                                                            className="p-2 text-primary hover:bg-surface-container-high rounded-full transition-colors"
                                                            title={t('common.edit')}
                                                        >
                                                            <span className="material-symbols-outlined">edit</span>
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
                onClose={() => !isSubmitting && setIsModalOpen(false)}
                title={t('admin.edit_role')}
                size="md"
            >
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className={labelClass}>{t('admin.role_name')} <span className="text-error">*</span></label>
                        <input
                            type="text"
                            required
                            maxLength="50"
                            value={form.role_name}
                            onChange={(e) => setForm({ ...form, role_name: e.target.value })}
                            placeholder={t('admin.role_name_placeholder')}
                            className={inputClass}
                        />
                    </div>

                    <div className="pt-4 flex gap-3">
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="flex-1 bg-primary text-on-primary py-3 rounded-lg font-label-md text-label-md hover:bg-primary/90 shadow-sm transition-colors disabled:opacity-50"
                        >
                            {isSubmitting ? t('common.saving') : t('common.save')}
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
        </div>
    );
};

export default RolesPage;
