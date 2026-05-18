import React, { useState, useEffect } from 'react';
import { DollarSign, CheckCircle, Image as ImageIcon, X } from 'lucide-react';
import axiosClient from '../../core/api/axiosClient';
import useToastStore from '../../store/useToastStore';
import PageHeader from '../../shared/components/PageHeader';
import Modal from '../../shared/components/Modal';

const PaymentOperationsPage = () => {
    const addToast = useToastStore(state => state.addToast);
    const [isLoading, setIsLoading] = useState(true);
    const [pendingPayments, setPendingPayments] = useState([]);
    const [completedPayments, setCompletedPayments] = useState([]);
    const [activeTab, setActiveTab] = useState('pending');
    
    // For Receipt Modal
    const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
    const [selectedReceipt, setSelectedReceipt] = useState(null);

    const fetchPayments = async () => {
        setIsLoading(true);
        try {
            const res = await axiosClient.get('/financial/ledger');
            if (res.data.success) {
                const ledger = res.data.data || [];
                
                // Filter manual pending payments
                setPendingPayments(
                    ledger.filter(item => item.transaction_type === 'payment_pending' && item.status === 'pending')
                );
                
                // Filter completed electronic/approved payments
                setCompletedPayments(
                    ledger.filter(item => item.transaction_type === 'payment_in' && item.status === 'completed')
                );
            }
        } catch (error) {
            addToast('فشل في جلب سجلات الدفع', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchPayments();
    }, []);

    const handleApprove = async (ledgerId) => {
        if (!window.confirm('هل أنت متأكد من اعتماد هذه الدفعة وتفعيل الإعلان؟')) return;
        
        try {
            await axiosClient.post(`/financial/approve-payment/${ledgerId}`);
            addToast('تم اعتماد الدفعة بنجاح', 'success');
            fetchPayments();
        } catch (error) {
            addToast(error.response?.data?.message || 'فشل اعتماد الدفعة', 'error');
        }
    };

    const openReceipt = (path) => {
        if (!path) return;
        const fullUrl = axiosClient.defaults.baseURL.replace('/api', '') + path;
        setSelectedReceipt(fullUrl);
        setIsReceiptModalOpen(true);
    };

    const PaymentCard = ({ item, isCompleted }) => (
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm mb-4 transition-all hover:shadow-md">
            <div className="flex justify-between items-start mb-4 pb-4 border-b border-gray-50">
                <div>
                    <p className="text-sm font-bold text-gray-500 mb-1">المبلغ</p>
                    <p className={`text-xl font-black ${isCompleted ? 'text-green-600' : 'text-orange-500'}`}>
                        ${item.amount}
                    </p>
                </div>
                <div className={`px-4 py-1.5 rounded-full text-xs font-bold ${
                    isCompleted ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                }`}>
                    {isCompleted ? 'مكتمل (إلكتروني/معتمد)' : 'بانتظار التأكيد (يدوي)'}
                </div>
            </div>

            <div className="space-y-3 mb-6">
                <div className="flex justify-between text-sm">
                    <span className="text-gray-500">الإعلان المستهدف:</span>
                    <span className="font-bold text-gray-800">{item.advertisement?.title || 'غير متوفر'}</span>
                </div>
                <div className="flex justify-between text-sm">
                    <span className="text-gray-500">المعلن:</span>
                    <span className="font-bold text-gray-800">{item.user?.full_name || 'غير متوفر'}</span>
                </div>
                <div className="flex justify-between text-sm">
                    <span className="text-gray-500">التاريخ:</span>
                    <span className="font-bold text-gray-800">{new Date(item.created_at).toLocaleDateString('ar-EG')}</span>
                </div>
                {isCompleted && item.reference_number && (
                    <div className="flex justify-between text-sm">
                        <span className="text-gray-500">المرجع (Stripe):</span>
                        <span className="font-bold text-gray-800" dir="ltr">{item.reference_number}</span>
                    </div>
                )}
            </div>

            {!isCompleted && (
                <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-50">
                    {item.receipt_path && (
                        <button
                            onClick={() => openReceipt(item.receipt_path)}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border-[1.5px] border-[var(--color-gold)] text-[var(--color-gold)] font-bold hover:bg-[var(--color-gold)]/5 transition-colors"
                        >
                            <ImageIcon className="w-4 h-4" /> عرض الإيصال
                        </button>
                    )}
                    <button
                        onClick={() => handleApprove(item.ledger_id)}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-green-500 text-white font-bold hover:bg-green-600 transition-colors shadow-sm"
                    >
                        <CheckCircle className="w-4 h-4" /> اعتماد الدفع
                    </button>
                </div>
            )}
        </div>
    );

    return (
        <div className="space-y-6 animate-fade-in pb-12" dir="rtl">
            <PageHeader
                title="عمليات الدفع"
                description="مراجعة الإيصالات اليدوية واعتماد الدفعات المعلقة"
                icon={DollarSign}
            />

            {/* Tabs */}
            <div className="flex gap-2 p-1 bg-gray-100 rounded-xl w-fit">
                <button
                    onClick={() => setActiveTab('pending')}
                    className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${
                        activeTab === 'pending'
                            ? 'bg-white text-[var(--color-dark-turquoise)] shadow-sm'
                            : 'text-gray-500 hover:text-gray-700'
                    }`}
                >
                    المعلقات (يدوي)
                    {pendingPayments.length > 0 && (
                        <span className="mr-2 px-2 py-0.5 bg-orange-100 text-orange-600 rounded-full text-xs">
                            {pendingPayments.length}
                        </span>
                    )}
                </button>
                <button
                    onClick={() => setActiveTab('completed')}
                    className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${
                        activeTab === 'completed'
                            ? 'bg-white text-[var(--color-dark-turquoise)] shadow-sm'
                            : 'text-gray-500 hover:text-gray-700'
                    }`}
                >
                    مكتملة
                </button>
            </div>

            {/* Lists */}
            {isLoading ? (
                <div className="flex justify-center py-12">
                    <div className="w-8 h-8 border-4 border-[var(--color-dark-turquoise)]/20 border-t-[var(--color-dark-turquoise)] rounded-full animate-spin"></div>
                </div>
            ) : (
                <div className="mt-6">
                    {activeTab === 'pending' ? (
                        pendingPayments.length === 0 ? (
                            <div className="text-center py-16 bg-white rounded-2xl border border-gray-100 shadow-sm">
                                <DollarSign className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                <h3 className="text-lg font-bold text-gray-800 mb-2">لا توجد معلقات</h3>
                                <p className="text-gray-500 text-sm">جميع الدفعات اليدوية تم معالجتها.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {pendingPayments.map(item => <PaymentCard key={item.ledger_id} item={item} isCompleted={false} />)}
                            </div>
                        )
                    ) : (
                        completedPayments.length === 0 ? (
                            <div className="text-center py-16 bg-white rounded-2xl border border-gray-100 shadow-sm">
                                <CheckCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                <h3 className="text-lg font-bold text-gray-800 mb-2">لا توجد عمليات مكتملة</h3>
                                <p className="text-gray-500 text-sm">لم يقم أحد بالدفع بعد.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {completedPayments.map(item => <PaymentCard key={item.ledger_id} item={item} isCompleted={true} />)}
                            </div>
                        )
                    )}
                </div>
            )}

            {/* Receipt Modal */}
            <Modal
                isOpen={isReceiptModalOpen}
                onClose={() => setIsReceiptModalOpen(false)}
                title="إيصال الدفع"
                icon={ImageIcon}
            >
                <div className="flex flex-col items-center">
                    {selectedReceipt ? (
                        <img 
                            src={selectedReceipt} 
                            alt="إيصال الدفع" 
                            className="max-w-full rounded-xl border border-gray-200"
                            onError={(e) => {
                                e.target.onerror = null; 
                                e.target.src = 'https://via.placeholder.com/400x500?text=تعذر+تحميل+الصورة';
                            }}
                        />
                    ) : (
                        <p className="text-gray-500 py-8">لا يوجد إيصال مرفق</p>
                    )}
                    <button 
                        onClick={() => setIsReceiptModalOpen(false)}
                        className="mt-6 w-full bg-gray-100 text-gray-700 py-3 rounded-xl font-bold hover:bg-gray-200 transition-colors"
                    >
                        إغلاق
                    </button>
                </div>
            </Modal>
        </div>
    );
};

export default PaymentOperationsPage;
