import React, { useState, useEffect } from 'react';
import { Users, Shield, Plus, Edit2, Trash2 } from 'lucide-react';
import axiosClient from '../../core/api/axiosClient';
import { ENDPOINTS } from '../../core/api/endpoints';
import DataTable from '../../shared/components/DataTable';
import StatusBadge from '../../shared/components/StatusBadge';
import ConfirmDialog from '../../shared/components/ConfirmDialog';
import Modal from '../../shared/components/Modal';
import PageHeader from '../../shared/components/PageHeader';
import useToastStore from '../../store/useToastStore';

const UsersPage = () => {
    const [users, setUsers] = useState([]);
    const [roles, setRoles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [modalConfig, setModalConfig] = useState({ open: false, type: '', user: null });
    const addToast = useToastStore(state => state.addToast);
    const [formLoading, setFormLoading] = useState(false);

    const [form, setForm] = useState({
        full_name: '',
        email: '',
        phone: '',
        password: '',
        role_id: '',
        location: '',
        bank_name: '',
        account_name: '',
        account_number: ''
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [usersRes, rolesRes] = await Promise.all([
                axiosClient.get(ENDPOINTS.USERS.ALL),
                axiosClient.get(ENDPOINTS.LOOKUPS.ROLES)
            ]);
            setUsers(usersRes.data);
            setRoles(rolesRes.data?.data || rolesRes.data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        try {
            await axiosClient.delete(ENDPOINTS.USERS.DELETE(deleteTarget));
            addToast('تم حذف المستخدم بنجاح', 'success');
            setDeleteTarget(null);
            fetchData();
        } catch (e) {
            addToast('فشل الحذف', 'error');
        }
    };

    const handleOpenModal = (type, user = null) => {
        if (type === 'edit-role') {
            setForm({ 
                role_id: user.role_id || user.role?.role_id || '',
                bank_name: '', 
                account_name: '', 
                account_number: '' 
            });
        } else {
            setForm({ 
                full_name: '', 
                email: '', 
                phone: '', 
                password: '', 
                role_id: '',
                location: '',
                bank_name: '',
                account_name: '',
                account_number: ''
            });
        }
        setModalConfig({ open: true, type, user });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setFormLoading(true);
        try {
            if (modalConfig.type === 'add') {
                await axiosClient.post(ENDPOINTS.USERS.ALL, form);
                addToast('تم إضافة المستخدم بنجاح', 'success');
            } else if (modalConfig.type === 'edit-role') {
                await axiosClient.put(ENDPOINTS.USERS.UPDATE_ROLE(modalConfig.user.user_id), { 
                    role_id: form.role_id,
                    bank_name: form.bank_name,
                    account_name: form.account_name,
                    account_number: form.account_number
                });
                addToast('تم تعديل صلاحية المستخدم بنجاح', 'success');
            }
            setModalConfig({ open: false, type: '', user: null });
            fetchData();
        } catch (error) {
            addToast(error.response?.data?.message || 'حدث خطأ غير متوقع', 'error');
        } finally {
            setFormLoading(false);
        }
    };

    const columns = [
        { key: 'full_name', header: 'الاسم', accessorKey: 'full_name' },
        { key: 'email', header: 'البريد الإلكتروني', accessorKey: 'email' },
        { key: 'role.role_name', header: 'الصلاحية', cell: (row) => (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] md:text-xs font-bold bg-[var(--color-dark-turquoise)]/10 text-[var(--color-dark-turquoise)] border border-[var(--color-dark-turquoise)]/20">
                <Shield className="w-3 h-3 mr-1" />
                {row.role?.role_name || '—'}
            </span>
        )},
        { key: 'phone', header: 'رقم الهاتف', cell: (row) => <span dir="ltr">{row.phone || '—'}</span> },
        { key: 'location', header: 'الموقع', cell: (row) => row.location || '—' },
        { key: 'account_status', header: 'حالة الحساب', cell: (row) => <StatusBadge status={row.account_status || 'Active'} /> },
        { key: 'is_active', header: 'نشط', cell: (row) => <StatusBadge status={row.is_active ? 'Active' : 'Inactive'} /> },
        {
            key: 'actions', header: 'إجراءات', cell: (row) => (
                <div className="flex items-center justify-center gap-1">
                    <button onClick={(e) => { e.stopPropagation(); handleOpenModal('edit-role', row)}} className="text-blue-500 hover:text-blue-700 p-1.5 rounded-lg hover:bg-blue-100 transition-all">
                        <Edit2 className="w-5 h-5" />
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); setDeleteTarget(row.user_id)}} className="text-gray-500 hover:text-red-500 p-1.5 rounded-lg hover:bg-gray-100 transition-all">
                        <Trash2 className="w-5 h-5" />
                    </button>
                </div>
            )
        },
    ];

    const inputClass = "w-full bg-white border-[1.5px] border-[var(--color-dark-turquoise)] rounded-xl py-3 px-4 text-sm text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[var(--color-dark-turquoise)]/30 text-right";
    const labelClass = "text-xs font-bold text-[var(--color-dark-turquoise)] mb-1.5 block px-1";

    return (
        <div className="space-y-6" dir="rtl">
            <PageHeader 
                title={
                    <span className="flex items-center gap-3">
                        <Users className="w-7 h-7 text-[var(--color-dark-turquoise)]" /> إدارة المستخدمين
                    </span>
                }
                description="عرض وإدارة جميع مستخدمي النظام وصلاحياتهم"
                action={
                    <button onClick={() => handleOpenModal('add')}
                        className="bg-[var(--color-dark-turquoise)] hover:opacity-90 text-white font-bold px-5 py-2.5 rounded-full flex items-center gap-2 text-sm transition-opacity shadow-sm">
                        <Plus className="w-4 h-4" /> إضافة مستخدم
                    </button>
                }
            />

            <DataTable columns={columns} data={users} loading={loading} emptyMessage="لا يوجد مستخدمين" />

            <Modal isOpen={modalConfig.open} onClose={() => setModalConfig({ open: false, type: '', user: null })} title={modalConfig.type === 'add' ? 'إضافة مستخدم جديد' : 'تعديل صلاحية المستخدم'} size="sm">
                <form onSubmit={handleSubmit} className="space-y-4" dir="rtl">
                    {modalConfig.type === 'add' && (
                        <>
                            <div>
                                <label className={labelClass}>الاسم الكامل *</label>
                                <input type="text" required value={form.full_name} onChange={e => setForm({...form, full_name: e.target.value})} className={inputClass} />
                            </div>
                            <div>
                                <label className={labelClass}>البريد الإلكتروني *</label>
                                <input type="email" required value={form.email} onChange={e => setForm({...form, email: e.target.value})} className={inputClass} dir="ltr" />
                            </div>
                            <div>
                                <label className={labelClass}>رقم الهاتف</label>
                                <input type="tel" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} className={inputClass} dir="ltr" />
                            </div>
                            <div>
                                <label className={labelClass}>كلمة المرور *</label>
                                <input type="password" required minLength={6} value={form.password} onChange={e => setForm({...form, password: e.target.value})} className={inputClass} />
                            </div>
                            <div>
                                <label className={labelClass}>الموقع / المحافظة</label>
                                <input type="text" value={form.location} onChange={e => setForm({...form, location: e.target.value})} className={inputClass} />
                            </div>
                        </>
                    )}
                    <div>
                        <label className={labelClass}>الصلاحية *</label>
                        <select required value={form.role_id} onChange={e => setForm({...form, role_id: e.target.value})} className={inputClass}>
                            <option value="">اختر صلاحية</option>
                            {roles.map(r => <option key={r.role_id || r.id} value={r.role_id || r.id}>{r.role_name}</option>)}
                        </select>
                    </div>
                    {roles.find(r => (r.role_id || r.id) == form.role_id)?.role_name === 'ScreenOwner' && (
                        <div className="bg-gray-50 p-4 rounded-xl space-y-4 border border-gray-200 mt-4">
                            <h4 className="text-xs font-bold text-gray-700">البيانات البنكية (لمالك الشاشة)</h4>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className={labelClass}>اسم البنك</label>
                                    <input type="text" value={form.bank_name} onChange={e => setForm({...form, bank_name: e.target.value})} className={inputClass} />
                                </div>
                                <div>
                                    <label className={labelClass}>اسم الحساب</label>
                                    <input type="text" value={form.account_name} onChange={e => setForm({...form, account_name: e.target.value})} className={inputClass} placeholder="افتراضياً: نفس الاسم الكامل" />
                                </div>
                            </div>
                            <div>
                                <label className={labelClass}>رقم الحساب البنكي / الآيبان</label>
                                <input type="text" value={form.account_number} onChange={e => setForm({...form, account_number: e.target.value})} className={inputClass} dir="ltr" />
                            </div>
                        </div>
                    )}
                    <button type="submit" disabled={formLoading} className="w-full bg-[var(--color-dark-turquoise)] text-white font-bold py-3 rounded-full hover:opacity-90 transition-all disabled:opacity-50 mt-4">
                        {formLoading ? 'جاري الحفظ...' : 'حفظ'}
                    </button>
                </form>
            </Modal>

            <ConfirmDialog
                isOpen={!!deleteTarget}
                onClose={() => setDeleteTarget(null)}
                onConfirm={handleDelete}
                title="حذف المستخدم"
                message="هل أنت متأكد من حذف هذا المستخدم نهائياً؟"
                confirmText="نعم، احذف"
            />
        </div>
    );
};

export default UsersPage;
