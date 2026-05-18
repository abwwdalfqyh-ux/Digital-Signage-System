import React, { useState, useEffect } from 'react';
import { Megaphone, Plus, CheckCircle, XCircle, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axiosClient from '../../core/api/axiosClient';
import DataTable from '../../shared/components/DataTable';
import StatusBadge from '../../shared/components/StatusBadge';
import Modal from '../../shared/components/Modal';
import ConfirmDialog from '../../shared/components/ConfirmDialog';
import PageHeader from '../../shared/components/PageHeader';
import usePermission from '../../hooks/usePermission';
import useToastStore from '../../store/useToastStore';

const AdsPage = () => {
    const [ads, setAds] = useState([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('all');
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [approveModal, setApproveModal] = useState({ open: false, ad: null, action: '' });
    const [rejectReason, setRejectReason] = useState('');
    const { can } = usePermission();
    const navigate = useNavigate();
    const addToast = useToastStore(state => state.addToast);

    useEffect(() => { fetchAds(); }, []);

    const fetchAds = async () => {
        try {
            const res = await axiosClient.get('/ads');
            setAds(res.data.data || []);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const filteredAds = statusFilter === 'all' ? ads : ads.filter(a => a.status === statusFilter);

    const handleStatusChange = async () => {
        const { ad, action } = approveModal;
        try {
            await axiosClient.put(`/ads/${ad.ad_id}/status`, {
                status: action,
                reason: action === 'Rejected' ? rejectReason : null,
            });
            addToast(`تم ${action === 'Active' ? 'قبول' : action === 'Rejected' ? 'رفض' : 'إيقاف'} الإعلان بنجاح`, 'success');
            setApproveModal({ open: false, ad: null, action: '' });
            setRejectReason('');
            fetchAds();
        } catch (e) {
            addToast('فشلت العملية', 'error');
        }
    };

    const handleDelete = async () => {
        try {
            await axiosClient.delete(`/ads/${deleteTarget}`);
            addToast('تم حذف الإعلان بنجاح', 'success');
            setDeleteTarget(null);
            fetchAds();
        } catch (e) { addToast('فشل الحذف', 'error'); }
    };

    const columns = [
        { key: 'title', header: 'العنوان', render: (row) => row.title },
        { key: 'advertiser.full_name', header: 'المعلن', render: (row) => row.advertiser?.full_name || '—' },
        { key: 'status', header: 'الحالة', render: (row) => <StatusBadge status={row.status} /> },
        { key: 'total_cost', header: 'التكلفة', render: (row) => `$${row.total_cost || 0}` },
        { key: 'daily_frequency', header: 'التكرار اليومي', accessorKey: 'daily_frequency' },
        { key: 'start_date', header: 'من', render: (row) => row.start_date || '—' },
        { key: 'end_date', header: 'إلى', render: (row) => row.end_date || '—' },
        {
            key: 'actions', header: 'إجراءات', render: (row) => (
                <div className="flex items-center justify-center gap-1">
                    {can('approve_ads') && row.status === 'Pending' && (
                        <>
                            <button onClick={(e) => { e.stopPropagation(); setApproveModal({ open: true, ad: row, action: 'Active' })}}
                                className="text-[#2E7D32] hover:bg-[#2E7D32]/10 p-1.5 rounded-lg transition-all" title="قبول">
                                <CheckCircle className="w-5 h-5" />
                            </button>
                            <button onClick={(e) => { e.stopPropagation(); setApproveModal({ open: true, ad: row, action: 'Rejected' })}}
                                className="text-red-500 hover:bg-red-500/10 p-1.5 rounded-lg transition-all" title="رفض">
                                <XCircle className="w-5 h-5" />
                            </button>
                        </>
                    )}
                    <button onClick={(e) => { e.stopPropagation(); setDeleteTarget(row.ad_id)}} className="text-gray-500 hover:text-red-500 p-1.5 rounded-lg hover:bg-gray-100 transition-all">
                        <Trash2 className="w-5 h-5" />
                    </button>
                </div>
            )
        },
    ];

    // Map new columns to DataTable cell structure
    const mappedColumns = columns.map(col => ({
        header: col.header,
        accessorKey: col.accessorKey,
        cell: col.render
    }));

    const statusTabs = [
        { key: 'all', label: 'الكل' },
        { key: 'Active', label: 'نشط' },
        { key: 'Pending', label: 'معلق' },
        { key: 'waiting_payment', label: 'بانتظار الدفع' },
        { key: 'Rejected', label: 'مرفوض' },
    ];

    const inputClass = "w-full bg-white border-[1.5px] border-[var(--color-dark-turquoise)] rounded-xl py-3 px-4 text-sm text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[var(--color-dark-turquoise)]/30 text-right";

    return (
        <div className="space-y-6" dir="rtl">
            <PageHeader 
                title={
                    <span className="flex items-center gap-3">
                        <Megaphone className="w-7 h-7 text-[var(--color-dark-turquoise)]" /> إدارة الإعلانات
                    </span>
                }
                description="عرض وإدارة جميع الحملات الإعلانية"
                action={
                    can('create_campaigns') && (
                        <button onClick={() => navigate('/dashboard/ads/create')}
                            className="bg-[var(--color-dark-turquoise)] hover:opacity-90 text-white font-bold px-5 py-2.5 rounded-full flex items-center gap-2 text-sm transition-opacity shadow-sm">
                            <Plus className="w-4 h-4 text-[var(--color-gold)]" /> رفع إعلان
                        </button>
                    )
                }
            />

            {/* Status Filter Tabs */}
            <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
                {statusTabs.map(tab => (
                    <button key={tab.key} onClick={() => setStatusFilter(tab.key)}
                        className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all border ${statusFilter === tab.key ? 'bg-[var(--color-dark-turquoise)] text-white border-[var(--color-dark-turquoise)]' : 'bg-white text-gray-600 border-gray-300 hover:border-[var(--color-dark-turquoise)]'}`}>
                        {tab.label}
                    </button>
                ))}
            </div>

            <DataTable columns={mappedColumns} data={filteredAds} loading={loading} emptyMessage="لا توجد إعلانات" />

            {/* Approve/Reject Modal */}
            <Modal isOpen={approveModal.open} onClose={() => { setApproveModal({ open: false, ad: null, action: '' }); setRejectReason(''); }}
                title={approveModal.action === 'Active' ? 'قبول الإعلان' : 'رفض الإعلان'}>
                <div className="space-y-4" dir="rtl">
                    <p className="text-sm text-gray-700 font-bold mb-4">
                        {approveModal.action === 'Active'
                            ? `هل تريد تأكيد قبول الإعلان "${approveModal.ad?.title}" وبدء عرضه؟`
                            : `يرجى تحديد سبب الرفض للإعلان "${approveModal.ad?.title}" ليتم إرساله للمعلن.`}
                    </p>
                    {approveModal.action === 'Rejected' && (
                        <textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} placeholder="اكتب سبب الرفض هنا..."
                            className={`${inputClass} min-h-[100px] mb-4`} required />
                    )}
                    <button onClick={handleStatusChange}
                        className={`w-full font-bold py-3 rounded-full transition-all text-white ${approveModal.action === 'Active' ? 'bg-[#2E7D32] hover:opacity-90' : 'bg-red-600 hover:opacity-90'}`}>
                        {approveModal.action === 'Active' ? 'تأكيد القبول' : 'تأكيد الرفض'}
                    </button>
                </div>
            </Modal>

            <ConfirmDialog isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete}
                title="حذف الإعلان" message="هل أنت متأكد من حذف هذا الإعلان نهائياً؟" confirmText="نعم، احذف" />
        </div>
    );
};

export default AdsPage;
