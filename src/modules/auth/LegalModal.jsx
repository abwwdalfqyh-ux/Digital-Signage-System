import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShieldCheck, FileText } from 'lucide-react';
import useTranslation from '../../i18n/useTranslation';

const LegalModal = ({ isOpen, onClose, type }) => {
    const { t, dir } = useTranslation();
    const isPrivacy = type === 'privacy';
    const title = isPrivacy ? t('auth.privacy_policy') : t('auth.terms_of_use');
    const Icon = isPrivacy ? ShieldCheck : FileText;

    const privacyContent = (
        <div className="space-y-4 text-sm text-[#4b5563] leading-relaxed font-medium">
            <p>{t('auth.privacy_policy_desc')}</p>
            <h4 className="text-[#111827] font-bold mt-4 text-base">{t('auth.privacy_sec1_title')}</h4>
            <p>{t('auth.privacy_sec1_desc')}</p>
            <h4 className="text-[#111827] font-bold mt-4 text-base">{t('auth.privacy_sec2_title')}</h4>
            <p>{t('auth.privacy_sec2_desc')}</p>
            <h4 className="text-[#111827] font-bold mt-4 text-base">{t('auth.privacy_sec3_title')}</h4>
            <p>{t('auth.privacy_sec3_desc')}</p>
            <p className="mt-4 pt-4 border-t border-gray-100 text-xs text-gray-400 text-center">{t('auth.last_updated_july_2026')}</p>
        </div>
    );

    const termsContent = (
        <div className="space-y-4 text-sm text-[#4b5563] leading-relaxed font-medium">
            <p>{t('auth.terms_desc')}</p>
            <h4 className="text-[#111827] font-bold mt-4 text-base">{t('auth.terms_sec1_title')}</h4>
            <p>{t('auth.terms_sec1_desc')}</p>
            <h4 className="text-[#111827] font-bold mt-4 text-base">{t('auth.terms_sec2_title')}</h4>
            <p>{t('auth.terms_sec2_desc')}</p>
            <h4 className="text-[#111827] font-bold mt-4 text-base">{t('auth.terms_sec3_title')}</h4>
            <p>{t('auth.terms_sec3_desc')}</p>
            <p className="mt-4 pt-4 border-t border-gray-100 text-xs text-gray-400 text-center">{t('auth.last_updated_july_2026')}</p>
        </div>
    );

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6" dir={dir}>
                    {/* Dark Background */}
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-[#111827]/40 backdrop-blur-sm"
                    />

                    {/* Modal Content */}
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 10 }}
                        transition={{ type: "spring", bounce: 0, duration: 0.4 }}
                        className="relative w-full max-w-[500px] bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
                    >
                        {/* Header */}
                        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-white shadow-sm border border-gray-100 flex items-center justify-center text-[#14506b]">
                                    <Icon className="w-5 h-5" />
                                </div>
                                <h3 className="text-xl font-black text-[#111827]">{title}</h3>
                            </div>
                            <button 
                                onClick={onClose}
                                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-200/60 text-gray-500 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Content Scroll Area */}
                        <div className="px-6 py-6 overflow-y-auto">
                            {isPrivacy ? privacyContent : termsContent}
                        </div>

                        {/* Footer Button */}
                        <div className="px-6 py-5 border-t border-gray-100 bg-gray-50/50">
                            <button 
                                onClick={onClose}
                                className="w-full py-3 bg-[#14506b] hover:bg-[#0f3c50] text-white rounded-xl font-bold text-sm shadow-md shadow-[#14506b]/20 transition-all hover:-translate-y-0.5"
                            >
                                {t('auth.i_read_and_agree')}
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default LegalModal;
