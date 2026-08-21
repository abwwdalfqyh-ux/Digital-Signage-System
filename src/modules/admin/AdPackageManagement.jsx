import React, { useState, useEffect } from 'react';
import axiosClient from '../../core/api/axiosClient';
import { ENDPOINTS } from '../../core/api/endpoints';
import useToastStore from '../../store/useToastStore';
import Modal from '../../shared/components/Modal';
import ConfirmDialog from '../../shared/components/ConfirmDialog';
import usePermission from '../../hooks/usePermission';
import useTranslation from '../../i18n/useTranslation';

const AdPackageManagement = () => {
    const { t, dir } = useTranslation();
    const addToast = useToastStore(state => state.addToast);
    const [packages, setPackages] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingPackage, setEditingPackage] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [deleteDialog, setDeleteDialog] = useState({ open: false, id: null });
    const { can } = usePermission();

    const [form, setForm] = useState({
        name_ar: '',
        name_en: '',
        interval_minutes: '1',
        price_multiplier: '1.0',
        is_active: true
    });

    const fetchData = async () => {
        setIsLoading(true);
        try {
            if (can('manage_all')) {
                const res = await axiosClient.get(ENDPOINTS.PACKAGES.ALL);
                setPackages(res.data?.data || []);
            }
        } catch (error) {
            addToast(error.response?.data?.message || t('common.loading_wait'), 'error');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const openModal = (pkg = null) => {
        if (pkg) {
            setEditingPackage(pkg);
            setForm({
                name_ar: pkg.name_ar || '',
                name_en: pkg.name_en || '',
                interval_minutes: pkg.interval_minutes?.toString() || '1',
                price_multiplier: pkg.price_multiplier?.toString() || '1.0',
                is_active: pkg.is_active !== undefined ? pkg.is_active : true
            });
        } else {
            setEditingPackage(null);
            setForm({ name_ar: '', name_en: '', interval_minutes: '1', price_multiplier: '1.0', is_active: true });
        }
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingPackage(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.name_ar || !form.name_en || !form.interval_minutes || !form.price_multiplier) {
            addToast(t('common.no_data'), 'warning');
            return;
        }

        setIsSubmitting(true);
        try {
            const payload = {
                name_ar: form.name_ar,
                name_en: form.name_en,
                interval_minutes: parseInt(form.interval_minutes),
                price_multiplier: parseFloat(form.price_multiplier),
                is_active: form.is_active
            };

            if (editingPackage) {
                const res = await axiosClient.put(ENDPOINTS.PACKAGES.UPDATE(editingPackage.package_id), payload);
                if (res.data.success) {
                    addToast(t('packages.success_update'), 'success');
                }
            } else {
                const res = await axiosClient.post(ENDPOINTS.PACKAGES.CREATE, payload);
                if (res.data.success) {
                    addToast(t('packages.success_add'), 'success');
                }
            }
            closeModal();
            fetchData();
        } catch (error) {
            addToast(error.response?.data?.message || t('common.save_confirm'), 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async () => {
        try {
            await axiosClient.delete(ENDPOINTS.PACKAGES.DELETE(deleteDialog.id));
            addToast(t('packages.success_delete'), 'success');
            setDeleteDialog({ open: false, id: null });
            fetchData();
        } catch (error) {
            addToast(error.response?.data?.message || t('common.no_data'), 'error');
        }
    };

    if (!can('manage_all')) {
        return <div className="p-8 text-center text-error font-bold">{t('common.no_data')}</div>;
    }

    return (
        <div className="p-4 md:p-8 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-on-background mb-1">{t('packages.title')}</h1>
                    <p className="text-on-surface-variant">{t('packages.description')}</p>
                </div>
                <button
                    onClick={() => openModal()}
                    className="flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-xl hover:bg-primary/90 transition-colors shadow-sm"
                >
                    <span className="material-symbols-outlined text-[20px]">add</span>
                    {t('packages.add_new')}
                </button>
            </div>

            <div className="bg-surface-container-lowest rounded-2xl shadow-sm border border-border-color overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-surface-container-low text-on-surface-variant font-medium border-b border-border-color">
                            <tr>
                                <th className={`px-6 py-4 ${dir === 'rtl' ? 'text-right' : 'text-left'}`}>{t('packages.name_ar')}</th>
                                <th className={`px-6 py-4 ${dir === 'rtl' ? 'text-right' : 'text-left'}`}>{t('packages.name_en')}</th>
                                <th className="px-6 py-4 text-center">{t('packages.interval_minutes')}</th>
                                <th className="px-6 py-4 text-center">{t('packages.price_multiplier')}</th>
                                <th className="px-6 py-4 text-center">{t('packages.status')}</th>
                                <th className="px-6 py-4 text-center">{t('common.edit')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border-color">
                            {isLoading ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-12 text-center text-on-surface-variant">
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                                            <p>{t('common.loading')}</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : packages.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-12 text-center text-on-surface-variant">
                                        <div className="flex flex-col items-center gap-3 opacity-50">
                                            <span className="material-symbols-outlined text-4xl">inventory_2</span>
                                            <p>{t('common.no_data')}</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                packages.map((pkg) => (
                                    <tr key={pkg.package_id} className="hover:bg-surface-container-low/30 transition-colors group">
                                        <td className="px-6 py-4 font-bold text-on-background">{pkg.name_ar}</td>
                                        <td className="px-6 py-4 text-on-surface">{pkg.name_en}</td>
                                        <td className="px-6 py-4 text-center">
                                            <span className="inline-flex items-center justify-center bg-primary/10 text-primary font-bold px-3 py-1 rounded-lg">
                                                {pkg.interval_minutes} {t('common.minutes_short')}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className="font-mono text-on-surface-variant">x{parseFloat(pkg.price_multiplier).toFixed(2)}</span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`inline-flex px-2 py-1 rounded-full text-xs font-bold ${pkg.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                {pkg.is_active ? t('packages.active') : t('packages.inactive')}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => openModal(pkg)}
                                                    className="p-2 text-primary hover:bg-primary/10 rounded-lg transition-colors"
                                                    title={t('common.edit')}
                                                >
                                                    <span className="material-symbols-outlined text-[20px]">edit</span>
                                                </button>
                                                <button
                                                    onClick={() => setDeleteDialog({ open: true, id: pkg.package_id })}
                                                    className="p-2 text-error hover:bg-error/10 rounded-lg transition-colors"
                                                    title={t('common.delete')}
                                                >
                                                    <span className="material-symbols-outlined text-[20px]">delete</span>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <Modal isOpen={isModalOpen} onClose={closeModal} title={editingPackage ? t('packages.edit') : t('packages.add_new')}>
                <form onSubmit={handleSubmit} className="space-y-4 min-w-[300px] sm:min-w-[400px]">
                    <div>
                        <label className="block text-sm font-medium text-on-background mb-1">{t('packages.name_ar')} *</label>
                        <input
                            type="text"
                            required
                            value={form.name_ar}
                            onChange={e => setForm({ ...form, name_ar: e.target.value })}
                            className="w-full bg-surface-container-lowest border border-border-color rounded-xl px-4 py-2.5 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-on-background mb-1">{t('packages.name_en')} *</label>
                        <input
                            type="text"
                            required
                            value={form.name_en}
                            onChange={e => setForm({ ...form, name_en: e.target.value })}
                            className="w-full bg-surface-container-lowest border border-border-color rounded-xl px-4 py-2.5 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                            dir="ltr"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-on-background mb-1">{t('packages.interval_minutes')} *</label>
                            <input
                                type="number"
                                min="1"
                                required
                                value={form.interval_minutes}
                                onChange={e => setForm({ ...form, interval_minutes: e.target.value })}
                                className="w-full bg-surface-container-lowest border border-border-color rounded-xl px-4 py-2.5 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-on-background mb-1">{t('packages.price_multiplier')} *</label>
                            <input
                                type="number"
                                step="0.01"
                                min="0.01"
                                required
                                value={form.price_multiplier}
                                onChange={e => setForm({ ...form, price_multiplier: e.target.value })}
                                className="w-full bg-surface-container-lowest border border-border-color rounded-xl px-4 py-2.5 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                            />
                        </div>
                    </div>
                    <div className="flex items-center mt-4">
                        <input
                            type="checkbox"
                            id="is_active"
                            checked={form.is_active}
                            onChange={e => setForm({ ...form, is_active: e.target.checked })}
                            className="w-5 h-5 text-primary border-border-color rounded focus:ring-primary"
                        />
                        <label htmlFor="is_active" className="ml-2 mr-2 text-sm font-medium text-on-background">
                            {t('packages.active')}
                        </label>
                    </div>
                    <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-border-color">
                        <button
                            type="button"
                            onClick={closeModal}
                            className="px-4 py-2 text-on-surface-variant hover:bg-surface-container-low rounded-xl transition-colors font-medium"
                        >
                            {t('common.cancel')}
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="px-6 py-2 bg-primary text-white rounded-xl hover:bg-primary/90 transition-colors shadow-sm font-medium disabled:opacity-50 flex items-center gap-2"
                        >
                            {isSubmitting && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>}
                            {t('common.save')}
                        </button>
                    </div>
                </form>
            </Modal>

            <ConfirmDialog
                isOpen={deleteDialog.open}
                onClose={() => setDeleteDialog({ open: false, id: null })}
                onConfirm={handleDelete}
                title={t('common.delete')}
                message={t('packages.delete_confirm')}
                confirmText={t('common.delete')}
                cancelText={t('common.cancel')}
                type="danger"
            />
        </div>
    );
};

export default AdPackageManagement;
