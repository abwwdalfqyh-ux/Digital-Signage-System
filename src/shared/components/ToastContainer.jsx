import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, AlertTriangle, Info, AlertCircle } from 'lucide-react';
import useToastStore from '../../store/useToastStore';

const iconMap = {
    success: CheckCircle,
    error: AlertCircle,
    warning: AlertTriangle,
    info: Info,
};

const colorMap = {
    success: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400',
    error: 'border-red-500/30 bg-red-500/10 text-red-400',
    warning: 'border-amber-500/30 bg-amber-500/10 text-amber-400',
    info: 'border-indigo-500/30 bg-indigo-500/10 text-indigo-400',
};

const ToastContainer = () => {
    const { toasts, removeToast } = useToastStore();

    return (
        <div className="fixed top-4 left-4 z-[9999] flex flex-col gap-3 max-w-sm w-full pointer-events-none" dir="rtl">
            <AnimatePresence>
                {toasts.map((toast) => {
                    const Icon = iconMap[toast.type] || Info;
                    const colors = colorMap[toast.type] || colorMap.info;

                    return (
                        <motion.div
                            key={toast.id}
                            initial={{ opacity: 0, x: -60, scale: 0.95 }}
                            animate={{ opacity: 1, x: 0, scale: 1 }}
                            exit={{ opacity: 0, x: -60, scale: 0.95 }}
                            className={`pointer-events-auto backdrop-blur-xl border rounded-2xl p-4 flex items-start gap-3 shadow-2xl ${colors}`}
                        >
                            <Icon className="w-5 h-5 shrink-0 mt-0.5" />
                            <p className="text-sm font-bold flex-1 leading-relaxed">{toast.message}</p>
                            <button
                                onClick={() => removeToast(toast.id)}
                                className="text-white/40 hover:text-white/80 transition-colors shrink-0"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </motion.div>
                    );
                })}
            </AnimatePresence>
        </div>
    );
};

export default ToastContainer;
