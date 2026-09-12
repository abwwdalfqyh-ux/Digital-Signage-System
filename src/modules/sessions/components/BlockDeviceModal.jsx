import React, { useState } from 'react';
import Modal from '../../../shared/components/Modal';
import useTranslation from '../../../i18n/useTranslation';
import { motion, AnimatePresence } from 'framer-motion';

const PREDEFINED_REASON_KEYS = [
    "block_reason_1",
    "block_reason_2",
    "block_reason_3",
    "block_reason_4",
    "block_reason_5"
];

const BlockDeviceModal = ({ isOpen, onClose, onConfirm, deviceName, ipAddress }) => {
    const { t } = useTranslation();
    const [reason, setReason] = useState('');
    const [customReason, setCustomReason] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = () => {
        onConfirm(reason.trim() || t('sessions.block_reason_admin'));
        setReason(''); // reset for next time
    };

    const handleClose = () => {
        setReason('');
        setCustomReason(false);
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={handleClose} title={t('sessions.block_device_modal_title')} maxWidth="max-w-[850px]">
            <div className="flex flex-col pt-2 w-full" dir="rtl">
                {/* Visual Header */}
                <div className="bg-error/10 border border-error/20 p-5 rounded-2xl flex items-start gap-4 mb-6 shadow-inner">
                    <div className="w-14 h-14 rounded-full bg-white text-error flex items-center justify-center shrink-0 border border-error/10 shadow-sm">
                        <span className="material-symbols-outlined text-[28px]">gpp_maybe</span>
                    </div>
                    <div>
                        <h4 className="font-bold text-error text-xl mb-1 tracking-tight">{t('sessions.block_warning_title')}</h4>
                        <p className="text-base sm:text-lg text-error/90 font-medium leading-relaxed">
                            {t('sessions.block_warning_desc_1')}<span className="font-extrabold underline decoration-error/50 underline-offset-4">{deviceName || t('sessions.unknown_device')}</span>{t('sessions.block_warning_desc_2')}<span className="font-mono text-sm font-bold" dir="ltr">{ipAddress || t('sessions.ip_default')}</span>{t('sessions.block_warning_desc_3')}
                        </p>
                    </div>
                </div>

                {/* Reason Selection */}
                <div className="mb-6 space-y-4">
                    <label className="block text-lg font-bold text-on-surface">
                        {t('sessions.block_reason_label')}
                    </label>
                    <div className="flex flex-wrap gap-3">
                        {PREDEFINED_REASON_KEYS.map((rk) => {
                            const r = t(`sessions.${rk}`);
                            return (
                            <button
                                key={r}
                                onClick={() => { setReason(r); setCustomReason(false); }}
                                className={`whitespace-nowrap px-5 py-3 rounded-xl text-base font-bold transition-all border shadow-sm ${
                                    reason === r && !customReason
                                        ? 'bg-error text-white border-error shadow-[0_4px_12px_rgba(239,68,68,0.2)] scale-105'
                                        : 'bg-surface-container-lowest text-on-surface-variant border-outline-variant hover:bg-error/5 hover:text-error hover:border-error/30'
                                }`}
                            >
                                {r}
                            </button>
                        )})}
                        <button
                            onClick={() => { setReason(''); setCustomReason(true); }}
                            className={`whitespace-nowrap px-5 py-3 rounded-xl text-base font-bold transition-all border shadow-sm ${
                                customReason
                                    ? 'bg-surface-container-highest text-on-surface border-outline scale-105'
                                    : 'bg-surface-container-lowest text-on-surface-variant border-outline-variant hover:bg-surface-container-highest'
                            }`}
                        >
                            <span className="material-symbols-outlined text-lg ml-1.5 align-middle">edit</span>
                            {t('sessions.custom_reason')}
                        </button>
                    </div>

                    <AnimatePresence>
                        {customReason && (
                            <motion.div 
                                initial={{ opacity: 0, height: 0, marginTop: 0 }}
                                animate={{ opacity: 1, height: 'auto', marginTop: 16 }}
                                exit={{ opacity: 0, height: 0, marginTop: 0 }}
                                className="overflow-hidden"
                            >
                                <textarea
                                    value={reason}
                                    onChange={(e) => setReason(e.target.value)}
                                    placeholder={t('sessions.custom_reason_placeholder')}
                                    rows={3}
                                    className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl p-4 text-base text-on-surface focus:outline-none focus:border-error focus:ring-1 focus:ring-error transition-all resize-none shadow-inner font-medium placeholder:text-on-surface-variant/50"
                                    autoFocus
                                />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row items-center gap-4 mt-2 pt-6 border-t border-outline-variant/60">
                    <button
                        onClick={handleClose}
                        className="w-full sm:w-auto flex-1 py-4 px-6 rounded-xl font-bold text-base bg-surface-container hover:bg-outline-variant/50 text-on-surface-variant transition-colors"
                    >
                        {t('sessions.cancel_btn')}
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={!reason.trim()}
                        className="w-full sm:w-auto flex-[2] py-4 px-6 rounded-xl font-bold text-base bg-error hover:bg-error/90 text-white transition-all shadow-sm focus:ring-2 focus:ring-error focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        <span className="material-symbols-outlined text-xl">block</span>
                        {t('sessions.confirm_block_btn')}
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default BlockDeviceModal;
