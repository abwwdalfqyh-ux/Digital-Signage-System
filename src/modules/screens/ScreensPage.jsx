import React, { useState, useEffect } from 'react';
import { Monitor, Plus, Trash2, TerminalSquare, Edit2, Image as ImageIcon, Eye } from 'lucide-react';
import axiosClient from '../../core/api/axiosClient';
import { ENDPOINTS } from '../../core/api/endpoints';
import DataTable from '../../shared/components/DataTable';
import StatusBadge from '../../shared/components/StatusBadge';
import Modal from '../../shared/components/Modal';
import ConfirmDialog from '../../shared/components/ConfirmDialog';
import PageHeader from '../../shared/components/PageHeader';
import useToastStore from '../../store/useToastStore';
import ScreenCommandModal from './components/ScreenCommandModal';
import usePermission from '../../hooks/usePermission';

const ScreensPage = () => {
    const [screens, setScreens] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalConfig, setModalConfig] = useState({ open: false, isEdit: false, screen: null });
    const [formLoading, setFormLoading] = useState(false);
    const [showImageModal, setShowImageModal] = useState(null);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [commandTarget, setCommandTarget] = useState(null);
    const [lookups, setLookups] = useState({ types: [], streets: [], owners: [] });
    const addToast = useToastStore(state => state.addToast);
    
    // Phase 4.3 states
    const [statusFilter, setStatusFilter] = useState('all');
    const [detailsModal, setDetailsModal] = useState({ open: false, screen: null });
    const { can } = usePermission();

    // Form state
    const [form, setForm] = useState({ 
        screen_name: '', 
        mac_address: '', 
        type_id: '', 
        street_id: '', 
        owner_id: '', 
        status: 'Online',
        photo: null 
    });

    const handleOpenModal = (isEdit = false, screen = null) => {
        if (isEdit && screen) {
            setForm({
                screen_name: screen.screen_name || '',
                mac_address: screen.mac_address || '', // not editable, but keep in state
                type_id: screen.type_id || '',
                street_id: screen.street_id || '',
                owner_id: screen.owner_id || '',
                status: screen.status || 'Online',
                photo: null
            });
        } else {
            setForm({ screen_name: '', mac_address: '', type_id: '', street_id: '', owner_id: '', status: 'Online', photo: null });
        }
        setModalConfig({ open: true, isEdit, screen });
    };

    useEffect(() => {
        fetchScreens();
        fetchLookups();
    }, []);

    const fetchScreens = async () => {
        try {
            const res = await axiosClient.get(ENDPOINTS.SCREENS.ALL);
            setScreens(res.data);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const fetchLookups = async () => {
        try {
            const [types, streets, owners] = await Promise.all([
                axiosClient.get(ENDPOINTS.LOOKUPS.SCREEN_TYPES),
                axiosClient.get(ENDPOINTS.LOOKUPS.STREETS),
                axiosClient.get(ENDPOINTS.LOOKUPS.USERS_BY_ROLE('ScreenOwner')),
            ]);
            setLookups({ types: types.data, streets: streets.data, owners: owners.data });
        } catch (e) { console.error(e); }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setFormLoading(true);

        try {
            if (modalConfig.isEdit) {
                // Update only allows screen_name, type_id, street_id, status
                const updatePayload = {
                    screen_name: form.screen_name,
                    type_id: form.type_id,
                    street_id: form.street_id,
                    status: form.status
                };
                await axiosClient.put(ENDPOINTS.SCREENS.UPDATE(modalConfig.screen.screen_id), updatePayload);
                addToast('تم تعديل الشاشة بنجاح', 'success');
            } else {
                const formData = new FormData();
                Object.entries(form).forEach(([key, val]) => { if (val) formData.append(key, val); });
                await axiosClient.post(ENDPOINTS.SCREENS.ALL, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
                addToast('تم إضافة الشاشة بنجاح', 'success');
            }
            
            setModalConfig({ open: false, isEdit: false, screen: null });
            fetchScreens();
        } catch (e) {
            addToast(e.response?.data?.message || 'حدث خطأ', 'error');
        } finally {
            setFormLoading(false);
        }
    };

    const handleDelete = async () => {
        try {
            await axiosClient.delete(ENDPOINTS.SCREENS.DELETE(deleteTarget));
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
        { key: 'pairing_code', header: 'كود الربط', cell: (row) => row.pairing_code || '—' },
        { key: 'status', header: 'الحالة', cell: (row) => <StatusBadge status={row.status} /> },
        { key: 'image', header: 'صورة', cell: (row) => (
            row.image_path ? (
                <button onClick={(e) => { e.stopPropagation(); setShowImageModal(row.image_path) }} className="text-[var(--color-dark-turquoise)] hover:opacity-80 transition-opacity">
                    <ImageIcon className="w-5 h-5 mx-auto" />
                </button>
            ) : <span className="text-gray-400 text-xs text-center block">—</span>
        )},
        { key: 'type.type_name', header: 'النوع', cell: (row) => row.type?.type_name || '—' },
        { key: 'owner.full_name', header: 'المالك', cell: (row) => row.owner?.full_name || '—' },
        {
            key: 'street.name', header: 'الموقع', cell: (row) => {
                const s = row.street;
                if (!s) return '—';
                return `${s.name}${s.region ? ` - ${s.region.name}` : ''}`;
            }
        },
        { key: 'linked_at', header: 'آخر اتصال', cell: (row) => row.linked_at ? new Date(row.linked_at).toLocaleString('ar-EG') : '—' },
        {
            key: 'actions', header: 'إجراءات', cell: (row) => (
                <div className="flex items-center justify-center gap-1">
                    <button onClick={(e) => { e.stopPropagation(); setDetailsModal({ open: true, screen: row }) }} className="text-gray-500 hover:text-[var(--color-dark-turquoise)] p-1.5 rounded-lg hover:bg-gray-100 transition-all shadow-sm" title="التفاصيل">
                        <Eye className="w-5 h-5" />
                    </button>
                    {(can('manage_all') || can('manage_screens')) && (
                        <button onClick={(e) => { e.stopPropagation(); setCommandTarget(row) }} className="text-gray-500 hover:text-[var(--color-dark-turquoise)] p-1.5 rounded-lg hover:bg-gray-100 transition-all shadow-sm" title="التحكم بالشاشة">
                            <TerminalSquare className="w-5 h-5" />
                        </button>
                    )}
                    {(can('manage_all') || can('manage_screens')) && (
                        <button onClick={(e) => { e.stopPropagation(); handleOpenModal(true, row) }} className="text-gray-500 hover:text-blue-500 p-1.5 rounded-lg hover:bg-gray-100 transition-all shadow-sm" title="تعديل الشاشة">
                            <Edit2 className="w-5 h-5" />
                        </button>
                    )}
                    {(can('manage_all') || can('manage_screens')) && (
                        <button onClick={(e) => { e.stopPropagation(); setDeleteTarget(row.screen_id) }} className="text-gray-500 hover:text-red-500 p-1.5 rounded-lg hover:bg-gray-100 transition-all shadow-sm" title="حذف الشاشة">
                            <Trash2 className="w-5 h-5" />
                        </button>
                    )}
                </div>
            )
        },
    ];

    const inputClass = "w-full bg-white border-[1.5px] border-[var(--color-dark-turquoise)] rounded-full py-3 px-4 text-sm text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[var(--color-dark-turquoise)]/30 text-right";
    const labelClass = "text-xs font-bold text-[var(--color-dark-turquoise)] mb-1.5 block px-2";

    const filteredScreens = statusFilter === 'all' ? screens : screens.filter(s => s.status === statusFilter);

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
                    (can('manage_all') || can('manage_screens')) && (
                        <button
                            onClick={() => handleOpenModal(false)}
                            className="bg-[var(--color-dark-turquoise)] hover:opacity-90 text-white font-bold px-5 py-2.5 rounded-full flex items-center gap-2 text-sm transition-opacity shadow-sm"
                        >
                            <Plus className="w-4 h-4 text-[var(--color-gold)]" /> إضافة شاشة
                        </button>
                    )
                }
            />

            {/* Status Filter Tabs */}
            <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
                {[
                    { key: 'all', label: 'الكل' },
                    { key: 'Online', label: 'متصلة' },
                    { key: 'Offline', label: 'غير متصلة' },
                    { key: 'Maintenance', label: 'صيانة' },
                    { key: 'pending_activation', label: 'بانتظار التفعيل' }
                ].map(tab => (
                    <button key={tab.key} onClick={() => setStatusFilter(tab.key)}
                        className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all border ${statusFilter === tab.key ? 'bg-[var(--color-dark-turquoise)] text-white border-[var(--color-dark-turquoise)]' : 'bg-white text-gray-600 border-gray-300 hover:border-[var(--color-dark-turquoise)]'}`}>
                        {tab.label}
                    </button>
                ))}
            </div>

            <DataTable columns={columns} data={filteredScreens} loading={loading} emptyMessage="لا توجد شاشات مسجلة" />

            {/* Add/Edit Screen Modal */}
            <Modal isOpen={modalConfig.open} onClose={() => setModalConfig({ open: false, isEdit: false, screen: null })} title={modalConfig.isEdit ? "تعديل الشاشة" : "إضافة شاشة جديدة"}>
                <form onSubmit={handleSubmit} className="space-y-4" dir="rtl">
                    <div>
                        <label className={labelClass}>اسم الشاشة *</label>
                        <input type="text" required value={form.screen_name} onChange={(e) => setForm(p => ({ ...p, screen_name: e.target.value }))} placeholder="مثال: شاشة شارع الستين" className={inputClass} />
                    </div>
                    
                    {!modalConfig.isEdit && (
                        <div>
                            <label className={labelClass}>معرّف الجهاز (MAC Address) *</label>
                            <input type="text" required value={form.mac_address} onChange={(e) => setForm(p => ({ ...p, mac_address: e.target.value }))} placeholder="AA:BB:CC:DD:EE:FF" className={inputClass} dir="ltr" />
                        </div>
                    )}

                    {modalConfig.isEdit && (
                        <div>
                            <label className={labelClass}>حالة الشاشة</label>
                            <select value={form.status} onChange={(e) => setForm(p => ({ ...p, status: e.target.value }))} className={inputClass}>
                                <option value="Online">متصلة (Online)</option>
                                <option value="Offline">غير متصلة (Offline)</option>
                                <option value="Maintenance">صيانة (Maintenance)</option>
                            </select>
                        </div>
                    )}

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
                    
                    {!modalConfig.isEdit && (
                        <>
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
                        </>
                    )}
                    
                    <button type="submit" disabled={formLoading} className="w-full bg-[var(--color-dark-turquoise)] hover:opacity-90 text-white font-bold py-3 rounded-full transition-opacity mt-6 shadow-sm disabled:opacity-50">
                        {formLoading ? 'جاري الحفظ...' : (modalConfig.isEdit ? 'حفظ التعديلات' : 'إضافة الشاشة')}
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

            <ScreenCommandModal 
                isOpen={!!commandTarget} 
                onClose={() => setCommandTarget(null)} 
                screen={commandTarget} 
            />

            {/* View Details Modal */}
            <Modal isOpen={detailsModal.open} onClose={() => setDetailsModal({ open: false, screen: null })} title="تفاصيل الشاشة">
                {detailsModal.screen && (
                    <div className="space-y-4" dir="rtl">
                        <div className="grid grid-cols-2 gap-4 text-sm bg-gray-50 p-4 rounded-xl border border-gray-200">
                            <div><span className="text-gray-500 block text-xs">اسم الشاشة</span> <span className="font-bold">{detailsModal.screen.screen_name}</span></div>
                            <div><span className="text-gray-500 block text-xs">كود الربط</span> <span className="font-bold">{detailsModal.screen.pairing_code || '—'}</span></div>
                            <div><span className="text-gray-500 block text-xs">MAC Address</span> <span className="font-bold" dir="ltr">{detailsModal.screen.mac_address || '—'}</span></div>
                            <div><span className="text-gray-500 block text-xs">آخر اتصال</span> <span className="font-bold">{detailsModal.screen.linked_at ? new Date(detailsModal.screen.linked_at).toLocaleString('ar-EG') : '—'}</span></div>
                            <div><span className="text-gray-500 block text-xs">النوع</span> <span className="font-bold">{detailsModal.screen.type?.type_name || '—'}</span></div>
                            <div><span className="text-gray-500 block text-xs">المالك</span> <span className="font-bold">{detailsModal.screen.owner?.full_name || '—'}</span></div>
                            <div><span className="text-gray-500 block text-xs">الموقع</span> <span className="font-bold">{detailsModal.screen.street?.name || '—'}</span></div>
                            <div><span className="text-gray-500 block text-xs">الحالة</span> <StatusBadge status={detailsModal.screen.status} /></div>
                        </div>

                        {detailsModal.screen.image_path && (
                            <div>
                                <span className="block text-xs font-bold text-gray-500 mb-2">صورة الشاشة:</span>
                                <div className="border-[1.5px] border-dashed border-gray-300 rounded-xl flex items-center justify-center p-2 bg-gray-50">
                                    <img src={detailsModal.screen.image_path} alt="Screen Thumbnail" className="max-h-[250px] max-w-full rounded-lg object-contain" loading="lazy" />
                                </div>
                            </div>
                        )}

                        <button onClick={() => setDetailsModal({ open: false, screen: null })} className="w-full mt-4 bg-gray-100 text-gray-700 font-bold py-3 rounded-full hover:bg-gray-200 transition-colors">
                            إغلاق
                        </button>
                    </div>
                )}
            </Modal>

            {/* View Image Modal */}
            <Modal isOpen={!!showImageModal} onClose={() => setShowImageModal(null)} title="صورة الشاشة">
                <div className="flex justify-center items-center py-4">
                    {showImageModal && (
                        <img src={showImageModal} alt="Preview" className="max-w-full h-auto rounded-lg shadow-sm" />
                    )}
                </div>
                <button onClick={() => setShowImageModal(null)} className="mt-4 w-full bg-gray-100 text-gray-700 font-bold py-3 rounded-full hover:bg-gray-200 transition-colors">
                    إغلاق
                </button>
            </Modal>
        </div>
    );
};

export default ScreensPage;
