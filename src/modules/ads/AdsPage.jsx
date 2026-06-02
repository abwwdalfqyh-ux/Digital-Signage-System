import React, { useState, useEffect } from 'react';
import { Megaphone, Plus, CheckCircle, XCircle, Trash2, Eye, PauseCircle, PlayCircle, CreditCard } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axiosClient from '../../core/api/axiosClient';
import { ENDPOINTS } from '../../core/api/endpoints';
import DataTable from '../../shared/components/DataTable';
import StatusBadge from '../../shared/components/StatusBadge';
import Modal from '../../shared/components/Modal';
import ConfirmDialog from '../../shared/components/ConfirmDialog';
import PageHeader from '../../shared/components/PageHeader';
import usePermission from '../../hooks/usePermission';
import useToastStore from '../../store/useToastStore';
import StripePaymentModal from './components/StripePaymentModal';

const AdsPage = () => {
    const [ads, setAds] = useState([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('all');
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [approveModal, setApproveModal] = useState({ open: false, ad: null, action: '' });
    const [detailsModal, setDetailsModal] = useState({ open: false, ad: null });
    const [stripeModal, setStripeModal] = useState({ open: false, ad: null });
    const [rejectReason, setRejectReason] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('all');
    const { can, isAdvertiser, isAdmin } = usePermission();
    const navigate = useNavigate();
    const addToast = useToastStore(state => state.addToast);

    useEffect(() => { fetchAds(); }, []);

    const fetchAds = async () => {
        try {
            const res = await axiosClient.get(ENDPOINTS.ADS.ALL);
            setAds(res.data.data || []);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const filteredAds = ads.filter(a => {
        const matchStatus = statusFilter === 'all' || a.status === statusFilter;
        const matchCategory = categoryFilter === 'all' || a.category_id === Number(categoryFilter);
        return matchStatus && matchCategory;
    });

    const handleStatusChange = async () => {
        const { ad, action } = approveModal;
        try {
            await axiosClient.put(ENDPOINTS.ADS.STATUS(ad.ad_id), {
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
            await axiosClient.delete(ENDPOINTS.ADS.DELETE(deleteTarget));
            addToast('تم حذف الإعلان بنجاح', 'success');
            setDeleteTarget(null);
            fetchAds();
        } catch (e) { addToast('فشل الحذف', 'error'); }
    };

    const columns = [
        { key: 'title', header: 'العنوان', render: (row) => row.title },
        { key: 'advertiser.full_name', header: 'المعلن', render: (row) => row.advertiser?.full_name || '—' },
        { key: 'category', header: 'التصنيف', render: (row) => row.category?.category_name || '—' },
        { key: 'status', header: 'الحالة', render: (row) => <StatusBadge status={row.status} /> },
        { key: 'total_cost', header: 'التكلفة', render: (row) => `$${row.total_cost || 0}` },
        { key: 'daily_frequency', header: 'التكرار (د)', render: (row) => row.daily_frequency || '—' },
        { key: 'duration', header: 'المدة (ث)', render: (row) => row.duration || '—' },
        { key: 'file_size', header: 'الحجم', render: (row) => row.file_size ? `${row.file_size} MB` : '—' },
        { key: 'start_date', header: 'من', render: (row) => row.start_date || '—' },
        { key: 'end_date', header: 'إلى', render: (row) => row.end_date || '—' },
        {
            key: 'actions', header: 'إجراءات', render: (row) => (
                <div className="flex items-center justify-center gap-1">
                    <button onClick={(e) => { e.stopPropagation(); setDetailsModal({ open: true, ad: row })}} className="text-gray-500 hover:text-[var(--color-dark-turquoise)] p-1.5 rounded-lg hover:bg-gray-100 transition-all" title="التفاصيل">
                        <Eye className="w-5 h-5" />
                    </button>
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
                    {(can('approve_ads') || can('manage_all')) && row.status === 'Active' && (
                        <button onClick={(e) => { e.stopPropagation(); setApproveModal({ open: true, ad: row, action: 'Paused' })}} className="text-yellow-500 hover:bg-yellow-500/10 p-1.5 rounded-lg transition-all" title="إيقاف مؤقت">
                            <PauseCircle className="w-5 h-5" />
                        </button>
                    )}
                    {(can('approve_ads') || can('manage_all')) && row.status === 'Paused' && (
                        <button onClick={(e) => { e.stopPropagation(); setApproveModal({ open: true, ad: row, action: 'Active' })}} className="text-[#2E7D32] hover:bg-[#2E7D32]/10 p-1.5 rounded-lg transition-all" title="استئناف">
                            <PlayCircle className="w-5 h-5" />
                        </button>
                    )}
                    {(isAdvertiser || isAdmin) && row.status === 'waiting_payment' && (
                        <button onClick={(e) => { e.stopPropagation(); setStripeModal({ open: true, ad: row })}} className="text-blue-500 hover:bg-blue-50 p-1.5 rounded-lg transition-all border border-blue-100" title="الدفع الإلكتروني (Stripe)">
                            <CreditCard className="w-5 h-5" />
                        </button>
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
        { key: 'Paused', label: 'متوقف مؤقتاً' },
        { key: 'Rejected', label: 'مرفوض' },
    ];

    const uniqueCategories = [...new Set(ads.map(a => a.category).filter(Boolean).map(c => JSON.stringify(c)))].map(s => JSON.parse(s));

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

            <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar items-center">
                <span className="text-xs font-bold text-gray-500 whitespace-nowrap px-2">الحالة:</span>
                {statusTabs.map(tab => (
                    <button key={tab.key} onClick={() => setStatusFilter(tab.key)}
                        className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all border ${statusFilter === tab.key ? 'bg-[var(--color-dark-turquoise)] text-white border-[var(--color-dark-turquoise)]' : 'bg-white text-gray-600 border-gray-300 hover:border-[var(--color-dark-turquoise)]'}`}>
                        {tab.label}
                    </button>
                ))}
                
                <div className="mx-2 h-6 w-px bg-gray-300"></div>
                
                <span className="text-xs font-bold text-gray-500 whitespace-nowrap px-2">التصنيف:</span>
                <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} className="px-4 py-2 bg-white text-gray-600 border border-gray-300 rounded-full text-xs font-bold focus:outline-none focus:border-[var(--color-dark-turquoise)]">
                    <option value="all">كل التصنيفات</option>
                    {uniqueCategories.map(c => (
                        <option key={c.category_id} value={c.category_id}>{c.category_name}</option>
                    ))}
                </select>
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

            {/* View Details Modal */}
            <Modal isOpen={detailsModal.open} onClose={() => setDetailsModal({ open: false, ad: null })} title="تفاصيل الإعلان">
                {detailsModal.ad && (
                    <div className="space-y-4" dir="rtl">
                        <div className="grid grid-cols-2 gap-4 text-sm bg-gray-50 p-4 rounded-xl border border-gray-200">
                            <div><span className="text-gray-500 block text-xs">العنوان</span> <span className="font-bold">{detailsModal.ad.title}</span></div>
                            <div><span className="text-gray-500 block text-xs">المعلن</span> <span className="font-bold">{detailsModal.ad.advertiser?.full_name || '—'}</span></div>
                            <div><span className="text-gray-500 block text-xs">التصنيف</span> <span className="font-bold">{detailsModal.ad.category?.category_name || '—'}</span></div>
                            <div><span className="text-gray-500 block text-xs">الحالة</span> <StatusBadge status={detailsModal.ad.status} /></div>
                            <div><span className="text-gray-500 block text-xs">تاريخ البدء</span> <span className="font-bold">{detailsModal.ad.start_date || '—'}</span></div>
                            <div><span className="text-gray-500 block text-xs">تاريخ الانتهاء</span> <span className="font-bold">{detailsModal.ad.end_date || '—'}</span></div>
                            <div><span className="text-gray-500 block text-xs">المدة</span> <span className="font-bold">{detailsModal.ad.duration ? `${detailsModal.ad.duration} ثانية` : '—'}</span></div>
                            <div><span className="text-gray-500 block text-xs">حجم الملف</span> <span className="font-bold">{detailsModal.ad.file_size ? `${detailsModal.ad.file_size} MB` : '—'}</span></div>
                            <div><span className="text-gray-500 block text-xs">التكلفة</span> <span className="font-bold text-[var(--color-gold)]">${detailsModal.ad.total_cost || 0}</span></div>
                            <div><span className="text-gray-500 block text-xs">معدل التكرار</span> <span className="font-bold">كل {detailsModal.ad.daily_frequency || '—'} دقيقة</span></div>
                        </div>

                        {detailsModal.ad.rejection_reason && detailsModal.ad.status === 'Rejected' && (
                            <div className="bg-red-50 p-4 rounded-xl border border-red-200 text-red-700">
                                <span className="block text-xs font-bold mb-1">سبب الرفض:</span>
                                <p className="text-sm">{detailsModal.ad.rejection_reason}</p>
                            </div>
                        )}

                        <div>
                            <span className="block text-xs font-bold text-gray-500 mb-2">الشاشات المستهدفة:</span>
                            {detailsModal.ad.screens && detailsModal.ad.screens.length > 0 ? (
                                <div className="flex flex-wrap gap-2">
                                    {detailsModal.ad.screens.map(s => (
                                        <span key={s.screen_id} className="bg-[var(--color-dark-turquoise)]/10 text-[var(--color-dark-turquoise)] px-3 py-1 rounded-full text-xs font-bold border border-[var(--color-dark-turquoise)]/20">
                                            {s.screen_name}
                                        </span>
                                    ))}
                                </div>
                            ) : (
                                <span className="text-sm text-gray-400">لا توجد شاشات مسجلة</span>
                            )}
                        </div>

                        <button onClick={() => setDetailsModal({ open: false, ad: null })} className="w-full mt-4 bg-gray-100 text-gray-700 font-bold py-3 rounded-full hover:bg-gray-200 transition-colors">
                            إغلاق
                        </button>
                    </div>
                )}
            </Modal>

            <ConfirmDialog isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete}
                title="حذف الإعلان" message="هل أنت متأكد من حذف هذا الإعلان نهائياً؟" confirmText="نعم، احذف" />

            <StripePaymentModal 
                isOpen={stripeModal.open}
                onClose={() => setStripeModal({ open: false, ad: null })}
                advertisement={stripeModal.ad}
                onSuccess={() => fetchAds()}
            />
        </div>
    );
};

export default AdsPage;
