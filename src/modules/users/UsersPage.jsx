import React, { useState, useEffect } from 'react';
import { Users, Shield, Plus, Edit2, Trash2 } from 'lucide-react';
import axiosClient from '../../core/api/axiosClient';
import DataTable from '../../shared/components/DataTable';
import StatusBadge from '../../shared/components/StatusBadge';
import ConfirmDialog from '../../shared/components/ConfirmDialog';
import PageHeader from '../../shared/components/PageHeader';
import useToastStore from '../../store/useToastStore';

const UsersPage = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const addToast = useToastStore(state => state.addToast);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const res = await axiosClient.get('/users');
            setUsers(res.data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        try {
            await axiosClient.delete(`/users/${deleteTarget}`);
            addToast('تم حذف المستخدم بنجاح', 'success');
            setDeleteTarget(null);
            fetchUsers();
        } catch (e) {
            addToast('فشل الحذف', 'error');
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
        { key: 'is_active', header: 'الحالة', cell: (row) => <StatusBadge status={row.is_active ? 'Active' : 'Inactive'} /> },
        {
            key: 'actions', header: 'إجراءات', cell: (row) => (
                <div className="flex items-center justify-center gap-1">
                    <button onClick={(e) => { e.stopPropagation(); setDeleteTarget(row.user_id)}} className="text-gray-500 hover:text-red-500 p-1.5 rounded-lg hover:bg-gray-100 transition-all">
                        <Trash2 className="w-5 h-5" />
                    </button>
                </div>
            )
        },
    ];

    return (
        <div className="space-y-6" dir="rtl">
            <PageHeader 
                title={
                    <span className="flex items-center gap-3">
                        <Users className="w-7 h-7 text-[var(--color-dark-turquoise)]" /> إدارة المستخدمين
                    </span>
                }
                description="عرض وإدارة جميع مستخدمي النظام وصلاحياتهم"
            />

            <DataTable columns={columns} data={users} loading={loading} emptyMessage="لا يوجد مستخدمين" />

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
