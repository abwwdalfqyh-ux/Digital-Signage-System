import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * DynamicPageLoader: An enterprise-grade, progressive loading state component.
 * To be used inside pages (e.g. during initial data fetch) to keep users engaged.
 *
 * @param {Array<string>} messages - Custom array of messages to cycle through.
 * @param {string} icon - Material Symbols icon name. Default: "cloud_sync".
 * @param {boolean} minHeight - Minimum height to prevent layout shift.
 */
const DynamicPageLoader = ({ 
    messages = [
        "جاري الاتصال الآمن بالسيرفر...",
        "يتم الآن تجميع البيانات...",
        "جاري المعالجة والأمان...",
        "لحظات وننتهي من ترتيب واجهتك..."
    ], 
    icon = "cloud_sync",
    minHeight = "min-h-[400px]"
}) => {
    const [messageIdx, setMessageIdx] = useState(0);

    useEffect(() => {
        setMessageIdx(0); // Reset on mount
        const interval = setInterval(() => {
            setMessageIdx((prev) => (prev + 1) % messages.length);
        }, 1800);
        return () => clearInterval(interval);
    }, [messages]);

    return (
        <div className={`flex flex-col items-center justify-center p-10 md:p-16 space-y-8 ${minHeight} w-full`}>
            {/* Spinning & Pulsing Enterprise Icon */}
            <div className="relative flex items-center justify-center mb-2">
                <span className="absolute w-24 h-24 rounded-full border-[3px] border-surface-variant border-t-primary animate-spin"></span>
                <span 
                    className="absolute w-20 h-20 rounded-full border-[3px] border-surface-variant border-b-primaryContainer animate-spin" 
                    style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}
                ></span>
                <span className="material-symbols-outlined text-4xl text-primary animate-pulse" data-icon={icon}>
                    {icon}
                </span>
            </div>

            {/* Cycling Loading Text */}
            <div className="text-center h-16 w-full relative overflow-hidden flex flex-col items-center">
                <AnimatePresence mode="wait">
                    <motion.p 
                        key={messageIdx}
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -15 }}
                        transition={{ duration: 0.3, ease: 'easeOut' }}
                        className="text-lg md:text-xl font-bold text-on-surface absolute top-0 w-full text-center px-4"
                    >
                        {messages[messageIdx]}
                    </motion.p>
                </AnimatePresence>
                <p className="text-sm font-medium text-outline mt-8 md:mt-10">
                    يرجى الانتظار، جاري الجلب بأمان...
                </p>
            </div>

            {/* Blurry Fading Skeleton */}
            <div className="w-full max-w-2xl space-y-4 pt-4 opacity-40 pointer-events-none hidden md:block">
                <div className="w-full h-24 bg-surface-variant rounded-2xl animate-pulse"></div>
                <div className="w-full h-24 bg-surface-variant rounded-2xl animate-pulse opacity-70" style={{ animationDelay: '0.2s' }}></div>
                <div className="w-full h-24 bg-surface-variant rounded-2xl animate-pulse opacity-40" style={{ animationDelay: '0.4s' }}></div>
            </div>
        </div>
    );
};

export default DynamicPageLoader;
