import React, { useState } from 'react';
import { CreditCard, ShieldCheck } from 'lucide-react';
import Modal from '../../../shared/components/Modal';
import axiosClient from '../../../core/api/axiosClient';
import { ENDPOINTS } from '../../../core/api/endpoints';
import useToastStore from '../../../store/useToastStore';

const StripePaymentModal = ({ isOpen, onClose, advertisement, onSuccess }) => {
    const addToast = useToastStore(state => state.addToast);
    const [isLoading, setIsLoading] = useState(false);
    const [clientSecret, setClientSecret] = useState(null);
    const [isConfirming, setIsConfirming] = useState(false);

    if (!advertisement) return null;

    const handleCreateIntent = async () => {
        setIsLoading(true);
        try {
            const res = await axiosClient.post(ENDPOINTS.PAYMENTS.STRIPE_CREATE_INTENT, {
                ad_id: advertisement.ad_id
            });
            if (res.data.success) {
                setClientSecret(res.data.clientSecret);
                addToast('تم إنشاء جلسة الدفع بنجاح', 'success');
            }
        } catch (error) {
            addToast(error.response?.data?.message || 'فشل الاتصال ببوابة Stripe', 'error');
            onClose();
        } finally {
            setIsLoading(false);
        }
    };

    // Note: Since Stripe.js is not installed in this environment, this function simulates 
    // the confirmation fallback for development purposes but maps perfectly to the backend API.
    const handleConfirmMock = async () => {
        if (!clientSecret) return;
        setIsConfirming(true);
        try {
            // In a real Stripe.js flow, we would confirm via elements here first
            const res = await axiosClient.post(ENDPOINTS.PAYMENTS.STRIPE_CONFIRM, {
                ad_id: advertisement.ad_id,
                payment_intent_id: clientSecret.split('_secret_')[0] // Using the intent ID prefix as reference
            });
            if (res.data.success) {
                addToast('تم تأكيد الدفع الإلكتروني بنجاح', 'success');
                onSuccess();
                onClose();
            }
        } catch (error) {
            addToast(error.response?.data?.message || 'حدث خطأ أثناء تأكيد الدفع', 'error');
        } finally {
            setIsConfirming(false);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="الدفع الإلكتروني عبر Stripe"
            icon={CreditCard}
        >
            <div className="space-y-6" dir="rtl">
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 shadow-sm">
                    <h3 className="text-sm font-black text-[var(--color-dark-turquoise)] mb-3 border-b pb-2">
                        تفاصيل الفاتورة
                    </h3>
                    <div className="space-y-2 text-sm text-gray-700">
                        <div className="flex justify-between">
                            <span className="font-bold">رقم الإعلان:</span>
                            <span>#{advertisement.ad_id}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="font-bold">العنوان:</span>
                            <span>{advertisement.title}</span>
                        </div>
                        <div className="flex justify-between items-center pt-2 mt-2 border-t border-gray-200">
                            <span className="font-black text-[var(--color-dark-turquoise)]">المبلغ الإجمالي المطلـوب:</span>
                            <span className="font-black text-2xl text-[var(--color-gold)]">
                                ${advertisement.total_cost}
                            </span>
                        </div>
                    </div>
                </div>

                {!clientSecret ? (
                    <div className="pt-2">
                        <p className="text-xs text-gray-500 mb-4 flex items-center gap-1">
                            <ShieldCheck className="w-4 h-4 text-[#2E7D32]" />
                            معاملاتك مشفرة ومؤمنة بالكامل عبر بوابة Stripe.
                        </p>
                        <button
                            onClick={handleCreateIntent}
                            disabled={isLoading}
                            className="w-full bg-[var(--color-dark-turquoise)] hover:opacity-90 text-white font-black py-3.5 rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {isLoading ? 'جاري الاتصال بـ Stripe...' : 'متابعة للدفع الإلكتروني'}
                        </button>
                    </div>
                ) : (
                    <div className="pt-2">
                        {/* 
                          * STUB: In production, insert <Elements stripe={stripePromise} options={{clientSecret}}>
                          * and <PaymentElement /> here instead of the mock confirmation button 
                          */}
                        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-xl mb-4 text-xs font-bold text-yellow-800 text-center">
                            بيئة مطورين (مُحاكاة): يتطلب إكمال هذه الواجهة الفعلي تثبيت مكتبة @stripe/react-stripe-js.
                            سيتم تجاوز خطوة البطاقة وإرسال طلب التأكيد API مباشرة كاختبار.
                        </div>
                        
                        <button
                            onClick={handleConfirmMock}
                            disabled={isConfirming}
                            className="w-full bg-[#2E7D32] hover:opacity-90 text-white font-black py-3.5 rounded-xl transition-all disabled:opacity-50"
                        >
                            {isConfirming ? 'جاري تأكيد الدفع...' : 'محاكاة تأكيد الدفع'}
                        </button>
                    </div>
                )}
            </div>
        </Modal>
    );
};

export default StripePaymentModal;
