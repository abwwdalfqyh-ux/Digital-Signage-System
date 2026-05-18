import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X } from 'lucide-react';

/**
 * Confirmation Dialog Component
 * Used for destructive actions (delete, revoke, etc.)
 */
const ConfirmDialog = ({ isOpen, onClose, onConfirm, title, message, confirmText = 'تأكيد', cancelText = 'إلغاء', variant = 'danger' }) => {
    const variantStyles = {
        danger: 'bg-red-600 hover:bg-red-700 shadow-red-600/20',
        warning: 'bg-amber-600 hover:bg-amber-700 shadow-amber-600/20',
        primary: 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/20',
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4" dir="rtl">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="relative bg-[#121215]/95 backdrop-blur-xl border border-white/10 rounded-3xl p-8 max-w-sm w-full shadow-2xl text-center"
                    >
                        <div className="bg-red-500/10 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5">
                            <AlertTriangle className="w-8 h-8 text-red-400" />
                        </div>
                        <h3 className="text-lg font-black text-white mb-2">{title}</h3>
                        <p className="text-gray-500 text-sm mb-8 leading-relaxed">{message}</p>
                        <div className="flex gap-3">
                            <button
                                onClick={onConfirm}
                                className={`flex-1 text-white font-bold py-3 rounded-2xl shadow-xl transition-all ${variantStyles[variant]}`}
                            >
                                {confirmText}
                            </button>
                            <button
                                onClick={onClose}
                                className="flex-1 bg-white/5 hover:bg-white/10 text-gray-400 font-bold py-3 rounded-2xl border border-white/5 transition-all"
                            >
                                {cancelText}
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default ConfirmDialog;
