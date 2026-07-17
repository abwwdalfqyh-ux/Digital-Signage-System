import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, AlertTriangle, Info, AlertCircle } from 'lucide-react';
import useToastStore from '../../store/useToastStore';
import useTranslation from '../../i18n/useTranslation';

const iconMap = {
    success: CheckCircle,
    error: AlertCircle,
    warning: AlertTriangle,
    info: Info,
};

const colorMap = {
    success: { border: 'border-emerald-500/40', bg: 'bg-emerald-950/90', icon: 'text-emerald-400', text: 'text-emerald-100', bar: 'bg-emerald-400' },
    error:   { border: 'border-red-500/40',     bg: 'bg-red-950/90',     icon: 'text-red-400',     text: 'text-red-100',     bar: 'bg-red-400'     },
    warning: { border: 'border-amber-500/40',   bg: 'bg-amber-950/90',   icon: 'text-amber-400',   text: 'text-amber-100',   bar: 'bg-amber-400'   },
    info:    { border: 'border-indigo-500/40',  bg: 'bg-indigo-950/90',  icon: 'text-indigo-400',  text: 'text-indigo-100',  bar: 'bg-indigo-400'  },
};

const ToastContainer = () => {
    const { toasts, removeToast } = useToastStore();
    const { t, dir } = useTranslation();

    return (
        <div
            className="fixed top-5 left-1/2 -translate-x-1/2 z-[9999] flex flex-col gap-3 w-full pointer-events-none"
            style={{ maxWidth: '520px', padding: '0 16px' }}
            dir={dir}
        >
            <AnimatePresence>
                {toasts.map((toast) => {
                    const Icon = iconMap[toast.type] || Info;
                    const c = colorMap[toast.type] || colorMap.info;

                    return (
                        <motion.div
                            key={toast.id}
                            initial={{ opacity: 0, y: -20, scale: 0.96 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -20, scale: 0.96 }}
                            transition={{ duration: 0.22, ease: 'easeOut' }}
                            className={`pointer-events-auto backdrop-blur-xl border rounded-2xl shadow-2xl overflow-hidden ${c.border} ${c.bg}`}
                        >
                            {/* شريط ملون علوي */}
                            <div className={`h-[3px] w-full ${c.bar}`} />

                            <div className="flex items-start gap-3 px-4 py-3">
                                <Icon className={`w-5 h-5 shrink-0 mt-0.5 ${c.icon}`} />
                                {/* الرسالة كاملة بدون قطع */}
                                <p
                                    className={`text-sm font-semibold flex-1 leading-relaxed ${c.text}`}
                                    style={{ wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}
                                >
                                    {toast.message}
                                </p>
                                <button
                                    onClick={() => removeToast(toast.id)}
                                    className="text-white/40 hover:text-white/80 transition-colors shrink-0 mt-0.5"
                                    aria-label={t('common.close')}
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        </motion.div>
                    );
                })}
            </AnimatePresence>
        </div>
    );
};

export default ToastContainer;
