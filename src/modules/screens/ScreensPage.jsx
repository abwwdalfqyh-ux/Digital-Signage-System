import React, { useState, useEffect } from 'react';
import { Monitor, Plus, Trash2 } from 'lucide-react';
import axiosClient from '../../core/api/axiosClient';
import DataTable from '../../shared/components/DataTable';
import StatusBadge from '../../shared/components/StatusBadge';
import Modal from '../../shared/components/Modal';
import ConfirmDialog from '../../shared/components/ConfirmDialog';
import PageHeader from '../../shared/components/PageHeader';
import useToastStore from '../../store/useToastStore';

const ScreensPage = () => {
    const [screens, setScreens] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [lookups, setLookups] = useState({ types: [], streets: [], owners: [] });
    const addToast = useToastStore(state => state.addToast);

    // Form state
    const [form, setForm] = useState({ screen_name: '', mac_address: '', type_id: '', street_id: '', owner_id: '', photo: null });

    useEffect(() => {
        fetchScreens();
        fetchLookups();
    }, []);

    const fetchScreens = async () => {
        try {
            const res = await axiosClient.get('/screens');
            setScreens(res.data);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const fetchLookups = async () => {
        try {
            const [types, streets, owners] = await Promise.all([
                axiosClient.get('/lookups/screen-types'),
                axiosClient.get('/lookups/streets'),
                axiosClient.get('/lookups/users-by-role/ScreenOwner'),
            ]);
            setLookups({ types: types.data, streets: streets.data, owners: owners.data });
        } catch (e) { console.error(e); }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const formData = new FormData();
        Object.entries(form).forEach(([key, val]) => { if (val) formData.append(key, val); });

        try {
            await axiosClient.post('/screens', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
            addToast('تم إضافة الشاشة بنجاح', 'success');
            setShowAddModal(false);
            setForm({ screen_name: '', mac_address: '', type_id: '', street_id: '', owner_id: '', photo: null });
            fetchScreens();
        } catch (e) {
            addToast(e.response?.data?.message || 'حدث خطأ', 'error');
        }
    };

    const handleDelete = async () => {
        try {
            await axiosClient.delete(`/screens/${deleteTarget}`);
            addToast('تم حذف الشاشة بنجاح', 'success');
            setDeleteTarget(null);
            fetchScreens();
        } catch (e) {
            addToast('فشل الحذف', 'error');
        }
    };

    const columns = [
        { key: 'screen_name', header: 'اسم الشاشة', accessorKey: 'screen_name' },
        { key: 'mac_address', header: 'MAC Address', accessorKey: 'mac_address' },
        { key: 'status', header: 'الحالة', cell: (row) => <StatusBadge status={row.status} /> },
        { key: 'type.type_name', header: 'النوع', cell: (row) => row.type?.type_name || '—' },
        { key: 'owner.full_name', header: 'المالك', cell: (row) => row.owner?.full_name || '—' },
        {
            key: 'street.name', header: 'الموقع', cell: (row) => {
                const s = row.street;
                if (!s) return '—';
                return `${s.name}${s.region ? ` - ${s.region.name}` : ''}`;
            }
        },
        {
            key: 'actions', header: 'إجراءات', cell: (row) => (
                <div className="flex items-center justify-center gap-1">
                    <button onClick={(e) => { e.stopPropagation(); setDeleteTarget(row.screen_id) }} className="text-gray-500 hover:text-red-500 p-1.5 rounded-lg hover:bg-gray-100 transition-all">
                        <Trash2 className="w-5 h-5" />
                    </button>
                </div>
            )
        },
    ];

    const inputClass = "w-full bg-white border-[1.5px] border-[var(--color-dark-turquoise)] rounded-full py-3 px-4 text-sm text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[var(--color-dark-turquoise)]/30 text-right";
    const labelClass = "text-xs font-bold text-[var(--color-dark-turquoise)] mb-1.5 block px-2";

    return (
        <div className="space-y-6" dir="rtl">
            <PageHeader
                title={
                    <span className="flex items-center gap-3">
                        <Monitor className="w-7 h-7 text-[var(--color-dark-turquoise)]" /> إدارة الشاشات
                    </span>
                }
                description="عرض وإدارة جميع الشاشات المسجلة في النظام"
                action={
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="bg-[var(--color-dark-turquoise)] hover:opacity-90 text-white font-bold px-5 py-2.5 rounded-full flex items-center gap-2 text-sm transition-opacity shadow-sm"
                    >
                        <Plus className="w-4 h-4 text-[var(--color-gold)]" /> إضافة شاشة
                    </button>
                }
            />

            <DataTable columns={columns} data={screens} loading={loading} emptyMessage="لا توجد شاشات مسجلة" />

            {/* Add Screen Modal */}
            <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="إضافة شاشة جديدة">
                <form onSubmit={handleSubmit} className="space-y-4" dir="rtl">
                    <div>
                        <label className={labelClass}>اسم الشاشة *</label>
                        <input type="text" required value={form.screen_name} onChange={(e) => setForm(p => ({ ...p, screen_name: e.target.value }))} placeholder="مثال: شاشة شارع الستين" className={inputClass} />
                    </div>
                    <div>
                        <label className={labelClass}>معرّف الجهاز (MAC Address) *</label>
                        <input type="text" required value={form.mac_address} onChange={(e) => setForm(p => ({ ...p, mac_address: e.target.value }))} placeholder="AA:BB:CC:DD:EE:FF" className={inputClass} dir="ltr" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className={labelClass}>نوع الشاشة</label>
                            <select value={form.type_id} onChange={(e) => setForm(p => ({ ...p, type_id: e.target.value }))} className={inputClass}>
                                <option value="">اختر</option>
                                {lookups.types.map(t => <option key={t.type_id} value={t.type_id}>{t.type_name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className={labelClass}>الموقع (الشارع)</label>
                            <select value={form.street_id} onChange={(e) => setForm(p => ({ ...p, street_id: e.target.value }))} className={inputClass}>
                                <option value="">اختر</option>
                                {lookups.streets.map(s => <option key={s.street_id} value={s.street_id}>{s.name} - {s.region?.name}</option>)}
                            </select>
                        </div>
                    </div>
                    <div>
                        <label className={labelClass}>المالك</label>
                        <select value={form.owner_id} onChange={(e) => setForm(p => ({ ...p, owner_id: e.target.value }))} className={inputClass}>
                            <option value="">اختر</option>
                            {lookups.owners.map(o => <option key={o.user_id} value={o.user_id}>{o.full_name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className={labelClass}>صورة الشاشة *</label>
                        <input type="file" accept="image/*" required onChange={(e) => setForm(p => ({ ...p, photo: e.target.files[0] }))}
                            className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-bold file:bg-[var(--color-dark-turquoise)]/10 file:text-[var(--color-dark-turquoise)] cursor-pointer" />
                    </div>
                    <button type="submit" className="w-full bg-[var(--color-dark-turquoise)] hover:opacity-90 text-white font-bold py-3 rounded-full transition-opacity mt-6 shadow-sm">
                        إضافة الشاشة
                    </button>
                </form>
            </Modal>

            {/* Delete Confirmation */}
            <ConfirmDialog
                isOpen={!!deleteTarget}
                onClose={() => setDeleteTarget(null)}
                onConfirm={handleDelete}
                title="حذف الشاشة"
                message="هل أنت متأكد من حذف هذه الشاشة؟"
                confirmText="نعم، احذف"
            />
        </div>
    );
};

export default ScreensPage;
