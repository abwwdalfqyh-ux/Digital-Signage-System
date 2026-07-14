import React, { useState } from 'react';
import Modal from '../../../shared/components/Modal';
import { motion, AnimatePresence } from 'framer-motion';

const PREDEFINED_REASONS = [
    "سلوك مريب متكرر",
    "نظام تشغيل مهكر / VPN مجهول",
    "إدخال كلمة مرور خاطئة عدة مرات",
    "بطلب مباشر من مالك الحساب",
    "جهاز استثنائي وغير مصرح به"
];

const BlockDeviceModal = ({ isOpen, onClose, onConfirm, deviceName, ipAddress }) => {
    const [reason, setReason] = useState('');
    const [customReason, setCustomReason] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = () => {
        onConfirm(reason.trim() || 'حظر أمني إداري (بدون سبب)');
        setReason(''); // reset for next time
    };

    const handleClose = () => {
        setReason('');
        setCustomReason(false);
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={handleClose} title="إجراء أمني حازم: حظر جهاز">
            <div className="flex flex-col pt-2 w-full" dir="rtl">
                {/* Visual Header */}
                <div className="bg-error/10 border border-error/20 p-4 rounded-xl flex items-start gap-4 mb-6 shadow-inner">
                    <div className="w-12 h-12 rounded-full bg-white text-error flex items-center justify-center shrink-0 border border-error/10 shadow-sm">
                        <span className="material-symbols-outlined text-[24px]">gpp_maybe</span>
                    </div>
                    <div>
                        <h4 className="font-bold text-error text-lg mb-1 tracking-tight">تحذير أمني شديد</h4>
                        <p className="text-sm text-error/90 font-medium leading-relaxed">
                            أنت على وشك حظر الجهاز (<span className="font-extrabold underline decoration-error/50 underline-offset-4">{deviceName || 'غير معروف'}</span>) 
                            والعنوان المعرف له (<span className="font-mono text-xs font-bold" dir="ltr">{ipAddress || 'غير محدد'}</span>) بشكل نهائي عن النظام.
                        </p>
                    </div>
                </div>

                {/* Reason Selection */}
                <div className="mb-6 space-y-4">
                    <label className="block text-sm font-black text-on-surface">
                        وثّق سبب الحظر <span className="text-error">*</span>
                    </label>
                    <div className="flex flex-wrap gap-2">
                        {PREDEFINED_REASONS.map((r) => (
                            <button
                                key={r}
                                onClick={() => { setReason(r); setCustomReason(false); }}
                                className={`whitespace-nowrap px-4 py-2 rounded-xl text-[13px] font-bold transition-all border shadow-sm ${
                                    reason === r && !customReason
                                        ? 'bg-error text-white border-error shadow-[0_4px_12px_rgba(239,68,68,0.2)] scale-105'
                                        : 'bg-surface-container-lowest text-on-surface-variant border-outline-variant hover:bg-error/5 hover:text-error hover:border-error/30'
                                }`}
                            >
                                {r}
                            </button>
                        ))}
                        <button
                            onClick={() => { setReason(''); setCustomReason(true); }}
                            className={`whitespace-nowrap px-4 py-2 rounded-xl text-[13px] font-bold transition-all border shadow-sm ${
                                customReason
                                    ? 'bg-surface-container-highest text-on-surface border-outline scale-105'
                                    : 'bg-surface-container-lowest text-on-surface-variant border-outline-variant hover:bg-surface-container-highest'
                            }`}
                        >
                            <span className="material-symbols-outlined text-[15px] ml-1.5 align-middle">edit</span>
                            سبب آخر مخصص
                        </button>
                    </div>

                    <AnimatePresence>
                        {customReason && (
                            <motion.div 
                                initial={{ opacity: 0, height: 0, marginTop: 0 }}
                                animate={{ opacity: 1, height: 'auto', marginTop: 12 }}
                                exit={{ opacity: 0, height: 0, marginTop: 0 }}
                                className="overflow-hidden"
                            >
                                <textarea
                                    value={reason}
                                    onChange={(e) => setReason(e.target.value)}
                                    placeholder="اكتب أسباب وتفاصيل الحظر الأمنية أو رقم التذكرة (Ticket Info) هنا..."
                                    rows={3}
                                    className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl p-4 text-sm text-on-surface focus:outline-none focus:border-error focus:ring-1 focus:ring-error transition-all resize-none shadow-inner font-medium placeholder:text-on-surface-variant/50"
                                    autoFocus
                                />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row items-center gap-3 mt-2 pt-5 border-t border-outline-variant/60">
                    <button
                        onClick={handleClose}
                        className="w-full sm:w-auto flex-1 py-3.5 px-4 rounded-xl font-bold text-[15px] bg-surface-container hover:bg-outline-variant/50 text-on-surface-variant transition-colors"
                    >
                        تراجع وإلغاء
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={!reason.trim()}
                        className="w-full sm:w-auto flex-[2] py-3.5 px-4 rounded-xl font-bold text-[15px] bg-error hover:bg-error/90 text-white transition-all shadow-sm focus:ring-2 focus:ring-error focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        <span className="material-symbols-outlined text-[20px]">block</span>
                        تأكيد الحظر والإبعاد
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default BlockDeviceModal;
