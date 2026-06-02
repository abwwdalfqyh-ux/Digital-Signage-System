import React, { useState, useEffect } from 'react';
import { Layers, Plus, Edit2, Trash2 } from 'lucide-react';
import axiosClient from '../../core/api/axiosClient';
import { ENDPOINTS } from '../../core/api/endpoints';
import useToastStore from '../../store/useToastStore';
import PageHeader from '../../shared/components/PageHeader';
import DataTable from '../../shared/components/DataTable';
import Modal from '../../shared/components/Modal';
import usePermission from '../../hooks/usePermission';

const CategoriesPage = () => {
    const addToast = useToastStore(state => state.addToast);
    const [categories, setCategories] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { can } = usePermission();

    const [form, setForm] = useState({
        category_name: '',
        price: '',
        max_duration: '',
        max_size: ''
    });

    const fetchCategories = async () => {
        setIsLoading(true);
        try {
            const res = await axiosClient.get(ENDPOINTS.LOOKUPS.CATEGORIES);
            if (res.data.success) {
                setCategories(Array.isArray(res.data.data) ? res.data.data : res.data.data.data || []);
            } else {
                setCategories(Array.isArray(res.data) ? res.data : []);
            }
        } catch (error) {
            addToast('فشل في جلب التصنيفات', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchCategories();
    }, []);

    const openModal = (category = null) => {
        if (category) {
            setEditingCategory(category);
            setForm({
                category_name: category.category_name || category.name || '',
                price: category.price || '',
                max_duration: category.max_duration || '',
                max_size: category.max_size || ''
            });
        } else {
            setEditingCategory(null);
            setForm({ category_name: '', price: '', max_duration: '', max_size: '' });
        }
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingCategory(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.category_name || !form.price || !form.max_duration || !form.max_size) {
            addToast('يرجى تعبئة جميع الحقول المطلوبة', 'warning');
            return;
        }

        setIsSubmitting(true);
        try {
            const payload = {
                category_name: form.category_name,
                price: parseFloat(form.price),
                max_duration: parseInt(form.max_duration),
                max_size: parseInt(form.max_size)
            };

            if (editingCategory) {
                const id = editingCategory.category_id || editingCategory.id;
                await axiosClient.put(ENDPOINTS.LOOKUPS.CATEGORY(id), payload);
                addToast('تم تعديل التصنيف بنجاح', 'success');
            } else {
                await axiosClient.post(ENDPOINTS.LOOKUPS.CATEGORIES, payload);
                addToast('تم إضافة التصنيف بنجاح', 'success');
            }
            closeModal();
            fetchCategories();
        } catch (error) {
            const errList = error.response?.data?.errors;
            if (errList) {
                const firstErr = Object.values(errList)[0][0];
                addToast(firstErr, 'error');
            } else {
                addToast(error.response?.data?.message || error.response?.data?.error || 'حدث خطأ أثناء حفظ التصنيف', 'error');
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('هل أنت متأكد من حذف هذا التصنيف؟ سيؤثر هذا على الإعلانات المرتبطة به.')) {
            try {
                await axiosClient.delete(ENDPOINTS.LOOKUPS.CATEGORY(id));
                addToast('تم حذف التصنيف بنجاح', 'success');
                fetchCategories();
            } catch (error) {
                addToast(error.response?.data?.message || 'فشل حذف التصنيف', 'error');
            }
        }
    };

    const columns = [
        { key: 'category_name', accessorKey: 'category_name', label: 'اسم التصنيف', header: 'اسم التصنيف', cell: (row) => row.category_name || row.name },
        { key: 'price', accessorKey: 'price', label: 'السعر ($/يوم)', header: 'السعر ($/يوم)', cell: (row) => <span className="font-bold text-[var(--color-dark-turquoise)]">${row.price}</span> },
        { key: 'max_duration', accessorKey: 'max_duration', label: 'أقصى مدة (ثانية)', header: 'أقصى مدة (ثانية)', cell: (row) => row.max_duration },
        { key: 'max_size', accessorKey: 'max_size', label: 'الحجم الأقصى (MB)', header: 'الحجم الأقصى (MB)', cell: (row) => row.max_size },
    ];

    if (can('manage_all')) {
        columns.push({
            key: 'actions',
            accessorKey: 'actions',
            label: 'إجراءات',
            header: 'إجراءات',
            cell: (row) => {
                const id = row.category_id || row.id;
                return (
                    <div className="flex justify-center items-center gap-2">
                        <button onClick={() => openModal(row)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                            <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                );
            }
        });
    }

    const inputClass = "w-full bg-gray-50 border-[1.5px] border-gray-200 rounded-xl py-2.5 px-4 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[var(--color-dark-turquoise)] focus:bg-white transition-all text-right";
    const labelClass = "text-xs font-bold text-[var(--color-dark-turquoise)] mb-1.5 block px-1";

    return (
        <div className="space-y-6 animate-fade-in pb-12" dir="rtl">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <PageHeader
                    title="إدارة التصنيفات"
                    description="إضافة وتعديل أسعار وأنواع تصنيفات الإعلانات"
                    icon={Layers}
                />
                {can('manage_all') && (
                    <button
                        onClick={() => openModal()}
                        className="bg-[var(--color-gold)] hover:opacity-90 text-white px-5 py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-sm"
                    >
                        <Plus className="w-5 h-5" /> إضافة تصنيف
                    </button>
                )}
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <DataTable
                    columns={columns}
                    data={categories}
                    loading={isLoading}
                    emptyMessage="لا توجد تصنيفات مضافة حالياً"
                />
            </div>

            <Modal
                isOpen={isModalOpen}
                onClose={closeModal}
                title={editingCategory ? 'تعديل التصنيف' : 'إضافة تصنيف جديد'}
                icon={Layers}
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className={labelClass}>اسم التصنيف *</label>
                        <input
                            type="text"
                            required
                            maxLength="100"
                            value={form.category_name}
                            onChange={(e) => setForm({ ...form, category_name: e.target.value })}
                            className={inputClass}
                            placeholder="مثال: الفئة الذهبية"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className={labelClass}>السعر بالدولار ($/يوم) *</label>
                            <input
                                type="number"
                                required
                                step="0.01"
                                min="0"
                                value={form.price}
                                onChange={(e) => setForm({ ...form, price: e.target.value })}
                                className={inputClass}
                                placeholder="0.00"
                            />
                        </div>
                        <div>
                            <label className={labelClass}>أقصى مدة (ثانية) *</label>
                            <input
                                type="number"
                                required
                                min="1"
                                value={form.max_duration}
                                onChange={(e) => setForm({ ...form, max_duration: e.target.value })}
                                className={inputClass}
                                placeholder="15"
                            />
                        </div>
                    </div>
                    <div>
                        <label className={labelClass}>الحجم الأقصى للملف (ميجابايت) *</label>
                        <input
                            type="number"
                            required
                            min="1"
                            value={form.max_size}
                            onChange={(e) => setForm({ ...form, max_size: e.target.value })}
                            className={inputClass}
                            placeholder="50"
                        />
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

export default CategoriesPage;
