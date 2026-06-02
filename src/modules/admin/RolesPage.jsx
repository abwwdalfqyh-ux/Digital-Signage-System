import React, { useState, useEffect } from 'react';
import { Shield, Plus, Edit2, Trash2 } from 'lucide-react';
import axiosClient from '../../core/api/axiosClient';
import { ENDPOINTS } from '../../core/api/endpoints';
import useToastStore from '../../store/useToastStore';
import PageHeader from '../../shared/components/PageHeader';
import DataTable from '../../shared/components/DataTable';
import Modal from '../../shared/components/Modal';
import usePermission from '../../hooks/usePermission';

const RolesPage = () => {
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

    const handleDelete = async (id) => {
        if (window.confirm('هل أنت متأكد من حذف هذا الدور؟ قد يسبب هذا مشاكل إذا كان هناك مستخدمون مرتبطون به.')) {
            try {
                await axiosClient.delete(ENDPOINTS.LOOKUPS.ROLE(id));
                addToast('تم حذف الدور بنجاح', 'success');
                fetchRoles();
            } catch (error) {
                addToast(error.response?.data?.message || 'فشل حذف الدور', 'error');
            }
        }
    };

    const columns = [
        { 
            accessorKey: 'role_name', 
            header: 'اسم الدور', 
            cell: (row) => (
                <div className="flex items-center justify-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-indigo-100 flexitems-center justify-center text-indigo-600 shrink-0 hidden md:flex">
                        <Shield className="w-5 h-5 mx-auto mt-2.5" />
                    </div>
                    <span className="font-bold text-gray-800">{row.role_name}</span>
                </div>
            ) 
        },
        { 
            accessorKey: 'type', 
            header: 'النوع', 
            cell: (row) => {
                const isProtected = PROTECTED_ROLES.includes(row.role_name);
                return (
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        isProtected ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-700'
                    }`}>
                        {isProtected ? 'دور أساسي (محمي)' : 'دور مخصص'}
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
                const id = row.role_id || row.id;
                const isProtected = PROTECTED_ROLES.includes(row.role_name);
                
                return (
                    <div className="flex justify-center items-center gap-2">
                        <button onClick={() => openModal(row)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                            <Edit2 className="w-4 h-4" />
                        </button>
                        {!isProtected && (
                            <button onClick={() => handleDelete(id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                                <Trash2 className="w-4 h-4" />
                            </button>
                        )}
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
                    title="إدارة الأدوار والصلاحيات"
                    description="إضافة وتعديل أدوار المستخدمين في النظام"
                    icon={Shield}
                />
                {can('manage_all') && (
                    <button
                        onClick={() => openModal()}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-sm"
                    >
                        <Plus className="w-5 h-5" /> إضافة دور جديد
                    </button>
                )}
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <DataTable
                    columns={columns}
                    data={roles.map(r => ({ ...r, id: r.role_id }))}
                    loading={isLoading}
                    emptyMessage="لا توجد أدوار مضافة حالياً"
                />
            </div>

            <Modal
                isOpen={isModalOpen}
                onClose={closeModal}
                title={editingRole ? 'تعديل الدور' : 'إضافة دور جديد'}
                icon={Shield}
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className={labelClass}>اسم الدور *</label>
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
                            className="flex-1 bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 transition-colors disabled:opacity-50"
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

export default RolesPage;
