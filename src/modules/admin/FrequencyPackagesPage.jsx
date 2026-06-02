import React, { useState, useEffect } from 'react';
import { Layers, Plus, Edit2, Trash2 } from 'lucide-react';
import axiosClient from '../../core/api/axiosClient';
import useToastStore from '../../store/useToastStore';
import PageHeader from '../../shared/components/PageHeader';
import Modal from '../../shared/components/Modal';
import DataTable from '../../shared/components/DataTable';
import { ENDPOINTS } from '../../core/api/endpoints';
import usePermission from '../../hooks/usePermission';

const FrequencyPackagesPage = () => {
    const addToast = useToastStore(state => state.addToast);
    const [packages, setPackages] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingPackage, setEditingPackage] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { can } = usePermission();

    const [form, setForm] = useState({
        name: '',
        display_interval: '1',
        price_multiplier: '1.0'
    });

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const res = await axiosClient.get(ENDPOINTS.FREQUENCY_PACKAGES.ALL);
            setPackages(res.data?.data || []);
        } catch (error) {
            addToast(error.response?.data?.message || 'فشل في جلب باقات التكرار', 'error');
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
                await axiosClient.put(ENDPOINTS.FREQUENCY_PACKAGES.UPDATE(editingPackage.id), payload);
                addToast('تم تحديث باقة التكرار بنجاح', 'success');
            } else {
                await axiosClient.post(ENDPOINTS.FREQUENCY_PACKAGES.CREATE, payload);
                addToast('تم إضافة باقة التكرار بنجاح', 'success');
            }
            closeModal();
            fetchData();
        } catch (error) {
            const errList = error.response?.data?.errors;
            if (errList) {
                const firstErr = Object.values(errList)[0][0];
                addToast(firstErr, 'error');
            } else {
                addToast(error.response?.data?.message || 'حدث خطأ أثناء حفظ الباقة', 'error');
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('هل أنت متأكد من حذف هذه الباقة؟')) {
            try {
                await axiosClient.delete(ENDPOINTS.FREQUENCY_PACKAGES.DELETE(id));
                addToast('تم حذف الباقة بنجاح', 'success');
                fetchData();
            } catch (error) {
                addToast(error.response?.data?.message || 'فشل الحذف', 'error');
            }
        }
    };

    const columns = [
        {
            header: 'اسم الباقة',
            accessorKey: 'name',
            cell: (row) => <span className="font-bold whitespace-nowrap">{row.name}</span>
        },
        {
            header: 'تكرار العرض',
            accessorKey: 'display_interval',
            cell: (row) => <span className="text-gray-600">كل {row.display_interval} دقيقة</span>
        },
        {
            header: 'مضاعف السعر',
            accessorKey: 'price_multiplier',
            cell: (row) => (
                <span className="px-3 py-1 bg-green-100 text-green-700 rounded-md text-xs font-black inline-block">
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
                    <button onClick={() => handleDelete(row.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors">
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
                    title="باقات التكرار"
                    description="إدارة معدل تكرار ظهور الإعلانات ومضاعفات أسعارها"
                    icon={Layers}
                />
                {can('manage_all') && (
                    <button
                        onClick={() => openModal()}
                        className="bg-[var(--color-dark-turquoise)] hover:opacity-90 text-white px-5 py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-sm shrink-0"
                    >
                        <Plus className="w-5 h-5" /> إضافة باقة جديدة
                    </button>
                )}
            </div>

            <DataTable
                columns={columns}
                data={packages}
                loading={isLoading}
                emptyMessage="لا توجد باقات تكرار مضافة بعد."
            />

            <Modal
                isOpen={isModalOpen}
                onClose={closeModal}
                title={editingPackage ? 'تعديل باقة تكرار' : 'إضافة باقة تكرار جديدة'}
                icon={Layers}
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className={labelClass}>اسم الباقة *</label>
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
                            <label className={labelClass}>تكرار العرض (بالدقائق) *</label>
                            <input
                                type="number"
                                required
                                min="1"
                                value={form.display_interval}
                                onChange={(e) => setForm({ ...form, display_interval: e.target.value })}
                                className={inputClass}
                                placeholder="1"
                            />
                        </div>
                        <div>
                            <label className={labelClass}>مضاعف السعر *</label>
                            <input
                                type="number"
                                step="0.01"
                                required
                                min="0.01"
                                value={form.price_multiplier}
                                onChange={(e) => setForm({ ...form, price_multiplier: e.target.value })}
                                className={inputClass}
                                placeholder="1.0"
                            />
                        </div>
                    </div>
                    <p className="text-[10px] text-gray-500 px-1">
                        تكرار العرض: كل كم دقيقة يتم عرض الإعلان. مضاعف السعر: القيمة التي يضرب بها السعر الأساسي.
                    </p>

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

export default FrequencyPackagesPage;
