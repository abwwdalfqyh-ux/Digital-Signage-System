import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Confirmation Dialog Component
 * Used for destructive actions (delete, revoke, etc.)
 */
const ConfirmDialog = ({ isOpen, onClose, onConfirm, title, message, confirmText = 'تأكيد', cancelText = 'إلغاء', variant = 'danger' }) => {
    const variantStyles = {
        danger: 'bg-error hover:bg-error/90 text-on-error shadow-[0_4px_12px_rgba(186,26,26,0.3)]',
        warning: 'bg-[#eab308] hover:bg-[#ca8a04] text-white shadow-sm',
        primary: 'bg-primary hover:bg-primary/90 text-on-primary shadow-sm',
    };

    const iconStyles = {
        danger: 'bg-error-container text-error',
        warning: 'bg-amber-100 text-[#ca8a04]',
        primary: 'bg-primary-container text-primary',
    };

    const iconName = {
        danger: 'warning',
        warning: 'error',
        primary: 'check_circle',
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6" dir="rtl">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/50 backdrop-blur-[2px]"
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 15 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 15 }}
                        transition={{ duration: 0.25, ease: "easeOut" }}
                        className="relative bg-surface border border-outline-variant/50 rounded-3xl p-8 w-full max-w-[420px] shadow-2xl flex flex-col items-center text-center"
                    >
                        <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-6 shadow-sm ${iconStyles[variant]}`}>
                            <span className="material-symbols-outlined text-[40px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                                {iconName[variant]}
                            </span>
                        </div>
                        <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold mb-3">{title}</h3>
                        <p className="font-body-md text-body-md text-on-surface-variant mb-10 leading-relaxed max-w-[340px]">{message}</p>
                        
                        <div className="flex w-full gap-4 flex-col sm:flex-row">
                            <button
                                onClick={onClose}
                                className="flex-1 bg-background hover:bg-surface-container-low text-on-surface border border-outline-variant font-label-lg text-label-lg py-3.5 px-4 rounded-xl transition-all"
                            >
                                {cancelText}
                            </button>
                            <button
                                onClick={onConfirm}
                                className={`flex-1 font-label-lg text-label-lg py-3.5 px-4 rounded-xl transition-all focus:outline-none focus:ring-4 focus:ring-error/20 ${variantStyles[variant]}`}
                            >
                                {confirmText}
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default ConfirmDialog;
