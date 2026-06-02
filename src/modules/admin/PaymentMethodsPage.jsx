import React, { useState, useEffect } from 'react';
import { CreditCard, Plus, Edit2, Trash2 } from 'lucide-react';
import axiosClient from '../../core/api/axiosClient';
import { ENDPOINTS } from '../../core/api/endpoints';
import useToastStore from '../../store/useToastStore';
import PageHeader from '../../shared/components/PageHeader';
import DataTable from '../../shared/components/DataTable';
import Modal from '../../shared/components/Modal';
import usePermission from '../../hooks/usePermission';

const PaymentMethodsPage = () => {
    const addToast = useToastStore(state => state.addToast);
    const [methods, setMethods] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingMethod, setEditingMethod] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { can } = usePermission();

    const [form, setForm] = useState({
        name: '',
        account_details: '',
        stripe_publishable_key: '',
        stripe_secret_key: '',
        is_active: true
    });

    const fetchMethods = async () => {
        setIsLoading(true);
        try {
            const res = await axiosClient.get(ENDPOINTS.PAYMENT.METHODS);
            if (res.data.success) {
                setMethods(res.data.data || []);
            } else {
                setMethods(Array.isArray(res.data) ? res.data : []);
            }
        } catch (error) {
            addToast('فشل في جلب وسائل الدفع', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchMethods();
    }, []);

    const openModal = (method = null) => {
        if (method) {
            setEditingMethod(method);
            setForm({
                name: method.name || '',
                account_details: method.account_details || '',
                stripe_publishable_key: method.stripe_publishable_key || '',
                stripe_secret_key: method.stripe_secret_key || '',
                is_active: method.is_active == 1 || method.is_active === true || method.is_active === 'true'
            });
        } else {
            setEditingMethod(null);
            setForm({ name: '', account_details: '', stripe_publishable_key: '', stripe_secret_key: '', is_active: true });
        }
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingMethod(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.name || !form.account_details) {
            addToast('يرجى تعبئة الحقول الأساسية', 'warning');
            return;
        }

        setIsSubmitting(true);
        try {
            const payload = {
                ...form,
                is_active: form.is_active ? 'true' : 'false'
            };

            if (editingMethod) {
                const id = editingMethod.method_id || editingMethod.id;
                await axiosClient.put(ENDPOINTS.PAYMENT.METHOD(id), payload);
                addToast('تم تعديل وسيلة الدفع بنجاح', 'success');
            } else {
                await axiosClient.post(ENDPOINTS.PAYMENT.METHODS, payload);
                addToast('تم إضافة وسيلة الدفع بنجاح', 'success');
            }
            closeModal();
            fetchMethods();
        } catch (error) {
            const errList = error.response?.data?.errors;
            if (errList) {
                const firstErr = Object.values(errList)[0][0];
                addToast(firstErr, 'error');
            } else {
                addToast(error.response?.data?.message || 'حدث خطأ أثناء حفظ وسيلة الدفع', 'error');
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('هل أنت متأكد من حذف وسيلة الدفع هذه؟')) {
            try {
                await axiosClient.delete(ENDPOINTS.PAYMENT.METHOD(id));
                addToast('تم حذف وسيلة الدفع بنجاح', 'success');
                fetchMethods();
            } catch (error) {
                addToast(error.response?.data?.message || 'فشل حذف وسيلة الدفع', 'error');
            }
        }
    };

    const columns = [
        { accessorKey: 'name', header: 'الاسم', cell: (row) => <span className="font-bold text-[var(--color-dark-turquoise)]">{row.name}</span> },
        { accessorKey: 'account_details', header: 'التفاصيل / الوصف', cell: (row) => <span className="text-gray-600 line-clamp-1 truncate max-w-sm" title={row.account_details}>{row.account_details}</span> },
        {
            accessorKey: 'is_active',
            header: 'الحالة',
            cell: (row) => {
                const isActive = row.is_active == 1 || row.is_active === true || row.is_active === 'true';
                return (
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                        {isActive ? 'مفعل' : 'معطل'}
                    </span>
                );
            }
        }
    ];

    if (can('manage_all')) {
        columns.push({
            accessorKey: 'actions',
            header: 'إجراءات',
            cell: (row) => {
                const id = row.method_id || row.id;
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
                    title="وسائل الدفع"
                    description="إدارة طرق الدفع المتاحة وتفاصيل الحسابات"
                    icon={CreditCard}
                />
                {can('manage_all') && (
                    <button
                        onClick={() => openModal()}
                        className="bg-[var(--color-gold)] hover:opacity-90 text-white px-5 py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-sm"
                    >
                        <Plus className="w-5 h-5" /> إضافة وسيلة
                    </button>
                )}
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <DataTable
                    columns={columns}
                    data={methods.map(m => ({ ...m, id: m.method_id }))}
                    loading={isLoading}
                    emptyMessage="لا توجد وسائل دفع مضافة حالياً"
                />
            </div>

            <Modal
                isOpen={isModalOpen}
                onClose={closeModal}
                title={editingMethod ? 'تعديل وسيلة الدفع' : 'إضافة وسيلة دفع جديدة'}
                icon={CreditCard}
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className={labelClass}>اسم الوسيلة (مثلاً: بنك الكريمي، Stripe) *</label>
                        <input
                            type="text"
                            required
                            maxLength="255"
                            value={form.name}
                            onChange={(e) => setForm({ ...form, name: e.target.value })}
                            className={inputClass}
                            placeholder="Stripe"
                        />
                    </div>
                    <div>
                        <label className={labelClass}>تفاصيل الحساب / الوصف *</label>
                        <textarea
                            required
                            value={form.account_details}
                            onChange={(e) => setForm({ ...form, account_details: e.target.value })}
                            className={`${inputClass} resize-none h-20`}
                            placeholder="اكتب رقم الحساب أو تفاصيل الدفع هنا..."
                        ></textarea>
                    </div>

                    <div className="border-t border-gray-100 pt-4 mt-4">
                        <label className="text-xs font-bold text-gray-500 mb-4 block px-1">إعدادات بوابات الدفع الإلكترونية (اختياري)</label>
                        <div className="space-y-4 bg-gray-50 p-4 rounded-xl border border-gray-200">
                            <div>
                                <label className={labelClass}>Stripe Publishable Key (pk_...)</label>
                                <input
                                    type="text"
                                    value={form.stripe_publishable_key}
                                    onChange={(e) => setForm({ ...form, stripe_publishable_key: e.target.value })}
                                    className={inputClass}
                                    dir="ltr"
                                    placeholder="pk_test_..."
                                />
                            </div>
                            <div>
                                <label className={labelClass}>Stripe Secret Key (sk_...)</label>
                                <input
                                    type="text"
                                    value={form.stripe_secret_key}
                                    onChange={(e) => setForm({ ...form, stripe_secret_key: e.target.value })}
                                    className={inputClass}
                                    dir="ltr"
                                    placeholder="sk_test_..."
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 pt-2 px-1">
                        <input
                            type="checkbox"
                            id="is_active"
                            checked={form.is_active}
                            onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                            className="w-4 h-4 text-[var(--color-dark-turquoise)] border-gray-300 rounded focus:ring-[var(--color-dark-turquoise)]"
                        />
                        <label htmlFor="is_active" className="text-sm font-bold text-gray-700 cursor-pointer">
                            تفعيل وسيلة الدفع للمستخدمين
                        </label>
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

export default PaymentMethodsPage;
