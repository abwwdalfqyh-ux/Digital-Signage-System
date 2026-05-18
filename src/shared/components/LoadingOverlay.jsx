import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Full-screen loading overlay with premium animation.
 */
const LoadingOverlay = ({ isVisible, message = 'جاري التحميل...' }) => {
    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-md flex flex-col items-center justify-center gap-6"
                >
                    {/* Spinner */}
                    <div className="relative w-16 h-16">
                        <div className="absolute inset-0 rounded-full border-4 border-white/10"></div>
                        <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-indigo-500 animate-spin"></div>
                    </div>
                    <p className="text-white/80 text-sm font-bold tracking-wide">{message}</p>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default LoadingOverlay;
