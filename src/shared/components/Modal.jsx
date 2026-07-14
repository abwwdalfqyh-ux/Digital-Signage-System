import React from 'react';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Modal = ({ isOpen, onClose, title, children }) => {
    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6" dir="rtl">
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/40 backdrop-blur-sm" 
                    />
                    <motion.div 
                        initial={{ scale: 0.95, opacity: 0, y: 10 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.95, opacity: 0, y: 10 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        className="relative bg-surface/95 backdrop-blur-xl border border-outline-variant/60 w-full max-w-[680px] rounded-3xl shadow-xl flex flex-col overflow-hidden max-h-[90vh]"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-6 py-5 border-b border-outline-variant/50 bg-surface-container-lowest/50">
                            <h2 className="font-title-lg text-title-lg text-on-background font-bold">{title}</h2>
                            <button 
                                onClick={onClose}
                                className="w-8 h-8 flex items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container hover:text-error transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        
                        {/* Body */}
                        <div className="p-6 overflow-y-auto custom-scrollbar flex-1 relative">
                            {children}
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default Modal;
