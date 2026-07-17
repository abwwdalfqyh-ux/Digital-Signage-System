import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Play, Clock, HardDrive, FileType, Info, CheckCircle, Ban } from 'lucide-react';
import useTranslation from '../../../i18n/useTranslation';

const ReviewAdModal = ({ 
    isOpen, 
    onClose, 
    ad, 
    onOpenDetails, 
    onApproveClick, 
    onRejectSubmit 
}) => {
    const [rejectReason, setRejectReason] = useState('');
    const { t, dir } = useTranslation();

    if (!isOpen || !ad) return null;

    const isVideo = ad.file_path && ad.file_path.match(/\.(mp4|mov|avi|webm)$/i);

    const handleReject = () => {
        if (!rejectReason.trim()) return; // Must have reason
        onRejectSubmit(rejectReason);
    };

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
                {/* Backdrop */}
                <motion.div 
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }} 
                    exit={{ opacity: 0 }} 
                    onClick={onClose}
                    className="absolute inset-0 bg-[#141b2b]/60 backdrop-blur-sm"
                />

                {/* Modal Container */}
                <motion.div 
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                    className="relative w-full max-w-3xl bg-surface-container-lowest rounded-[24px] shadow-2xl overflow-hidden font-sans border border-outline-variant/30 flex flex-col max-h-[90vh]"
                    dir={dir}
                >
                    {/* Header */}
                    <div className="flex items-center justify-between px-6 py-4 border-b border-outline-variant/40 bg-surface-bright/50">
                        <div className="flex items-center gap-3">
                            <button 
                                onClick={onClose}
                                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface-container-low text-on-surface-variant transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <h2 className="text-xl font-bold text-on-surface flex-1 text-center pr-8">
                            {t('ads.review_approve_campaign')}
                        </h2>
                    </div>

                    {/* Scrollable Content */}
                    <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
                        
                        {/* Top Info Row */}
                        <div className="flex flex-wrap items-center justify-between gap-4 mb-6 bg-surface p-4 rounded-2xl border border-outline-variant/30">
                            <div className="flex items-center gap-6 flex-wrap">
                                <div>
                                    <span className="text-sm font-medium text-on-surface-variant block mb-1">{t('ads.campaign_title')}</span>
                                    <span className="text-lg font-bold text-on-surface">{ad.title}</span>
                                </div>
                                <div className="w-[1px] h-8 bg-outline-variant/50 hidden sm:block"></div>
                                <div>
                                    <span className="text-sm font-medium text-on-surface-variant block mb-1">{t('ads.advertiser')}</span>
                                    <span className="text-lg font-bold text-on-surface">{ad.advertiser?.full_name || t('common.unspecified')}</span>
                                </div>
                            </div>
                            
                            <div className="flex items-center gap-3">
                                {/* Status Badge */}
                                <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-[#FEF3C7] text-[#D97706] border border-[#FDE68A] text-sm font-bold shadow-sm">
                                    <span className="w-2 h-2 rounded-full bg-[#D97706] animate-pulse"></span>
                                    {t('ads.status_pending')}
                                </span>

                                {/* Details Button */}
                                <button 
                                    onClick={onOpenDetails}
                                    className="flex items center gap-2 bg-surface-container-low hover:bg-surface-container border border-outline-variant px-4 py-1.5 rounded-full text-sm font-bold text-primary transition-colors shadow-sm"
                                >
                                    <Info className="w-4 h-4" />
                                    {t('ads.identity card')}
                                </button>
                            </div>
                        </div>

                        {/* Media Player */}
                        <div className="relative w-full bg-[#000000] rounded-2xl overflow-hidden shadow-inner border border-outline-variant/20 group flex items-center justify-center min-h-[300px]">
                            {ad.file_path ? (
                                isVideo ? (
                                    <video 
                                        src={ad.file_path} 
                                        controls 
                                        className="w-full max-h-[400px] object-contain"
                                    />
                                ) : (
                                    <img 
                                        src={ad.file_path} 
                                        alt={ad.title} 
                                        className="w-full max-h-[400px] object-contain"
                                    />
                                )
                            ) : (
                                <div className="text-outline-variant flex flex-col items-center">
                                    <Play className="w-12 h-12 mb-2 opacity-50" />
                                    <p>{t('ads.no_media_file')}</p>
                                </div>
                            )}

                            {/* Preview Overlay */}
                            <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md px-3 py-1 rounded-lg border border-white/10 pointer-events-none transition-opacity opacity-100 group-hover:opacity-0">
                                <span className="text-white text-xs font-bold flex items-center gap-2 tracking-wide">
                                    <Play className="w-3 h-3 text-primary-container" />
                                    {t('ads.preview')}
                                </span>
                            </div>
                        </div>

                        {/* Metadata Row */}
                        <div className="flex items-center justify-center gap-6 mt-4 mb-8 text-sm text-on-surface-variant font-medium">
                            <div className="flex items-center gap-1.5">
                                <FileType className="w-4 h-4 text-primary opacity-80" />
                                <span>{t('ads.format')}: {isVideo ? t('ads.video') : t('ads.image')}</span>
                            </div>
                            <div className="w-1 h-1 rounded-full bg-outline-variant"></div>
                            <div className="flex items-center gap-1.5" dir="ltr">
                                <Clock className="w-4 h-4 text-primary opacity-80" />
                                <span>{t('ads.duration')}: {ad.duration ? `${ad.duration}s` : '—'}</span>
                            </div>
                            <div className="w-1 h-1 rounded-full bg-outline-variant"></div>
                            <div className="flex items-center gap-1.5" dir="ltr">
                                <HardDrive className="w-4 h-4 text-primary opacity-80" />
                                <span>{t('ads.size')}: {ad.file_size ? `${ad.file_size}MB` : '—'}</span>
                            </div>
                        </div>

                        {/* Rejection Input */}
                        <div className="space-y-2 bg-error-container/30 p-5 rounded-2xl border border-error/20">
                            <label className="text-sm font-bold text-error block px-1 flex items-center gap-2">
                                <Ban className="w-4 h-4" />
                                {t('ads.reject_reason')} ({t('ads.mandatory_if_rejected')})
                            </label>
                            <textarea 
                                value={rejectReason}
                                onChange={(e) => setRejectReason(e.target.value)}
                                placeholder={t('ads.reject_placeholder')}
                                className="w-full bg-surface-container-lowest border border-error/30 rounded-xl px-4 py-3 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-error focus:border-error transition-all resize-none shadow-inner min-h-[80px]"
                            />
                        </div>

                    </div>

                    {/* Bottom Actions */}
                    <div className="p-6 bg-surface-bright/50 border-t border-outline-variant/40 flex gap-4">
                        <button 
                            onClick={handleReject}
                            disabled={!rejectReason.trim()}
                            className={`flex-1 py-4 rounded-xl font-bold text-lg transition-all shadow-sm flex items-center justify-center gap-2 ${
                                rejectReason.trim() 
                                    ? 'bg-error hover:bg-error/90 text-white' 
                                    : 'bg-surface-container-high text-outline cursor-not-allowed'
                            }`}
                        >
                            <Ban className="w-5 h-5" />
                            {t('ads.reject_ad')}
                        </button>
                        <button 
                            onClick={onApproveClick}
                            className="flex-[2] bg-emerald-600 hover:bg-emerald-700 text-white py-4 rounded-xl font-bold text-lg transition-all shadow-sm flex items-center justify-center gap-2"
                        >
                            <CheckCircle className="w-5 h-5" />
                            {t('ads.approve_and_request_payment')}
                        </button>
                    </div>

                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default ReviewAdModal;
