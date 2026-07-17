import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import useTranslation from '../../../i18n/useTranslation';

const BlocklistTable = ({ blockedItems = [], onUnblock }) => {
    const { t } = useTranslation();
    return (
        <div className="bg-surface-container-lowest border border-error/20 rounded-2xl shadow-sm overflow-hidden mt-6 relative">
            {/* Warning Top Accent Gradient */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-error/40 via-orange-500/50 to-error/40 shadow-sm" />
            
            {/* ── Header ── */}
            <div className="p-6 border-b border-outline-variant/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-gradient-to-b from-error/5 to-transparent">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-white text-error flex items-center justify-center border border-error/20 shadow-sm shadow-error/10">
                        <span className="material-symbols-outlined text-[24px]">gpp_maybe</span>
                    </div>
                    <div>
                        <h3 className="font-title-lg text-title-lg font-black text-on-surface tracking-tight">{t('sessions.threat_log')}</h3>
                        <p className="text-sm text-on-surface-variant mt-1 font-medium">{t('sessions.threat_log_desc')}</p>
                    </div>
                </div>
                <div className="bg-white border border-outline-variant rounded-xl px-5 py-2.5 flex items-center gap-3 shadow-sm">
                    <span className="text-xs font-black text-on-surface-variant uppercase tracking-widest">{t('sessions.total_blocked')}</span>
                    <span className="font-black text-error text-2xl leading-none">{blockedItems.length}</span>
                </div>
            </div>
            
            {/* ── Table ── */}
            <div className="overflow-x-auto">
                <table className="w-full text-right border-collapse">
                    <thead>
                        <tr className="bg-surface-container-low/40 text-on-surface-variant font-label-md text-label-md border-b border-outline-variant/60">
                            <th className="py-4 px-6 font-bold uppercase tracking-widest text-[11px] whitespace-nowrap">{t('sessions.blocked_entity')}</th>
                            <th className="py-4 px-6 font-bold uppercase tracking-widest text-[11px] whitespace-nowrap text-center">{t('sessions.ip_fingerprint')}</th>
                            <th className="py-4 px-6 font-bold uppercase tracking-widest text-[11px] whitespace-nowrap">{t('sessions.block_date')}</th>
                            <th className="py-4 px-6 font-bold uppercase tracking-widest text-[11px] whitespace-nowrap">{t('sessions.block_reason_col')}</th>
                            <th className="py-4 px-6 font-bold uppercase tracking-widest text-[11px] whitespace-nowrap text-left">{t('sessions.security_actions')}</th>
                        </tr>
                    </thead>
                    <tbody className="font-body-md text-body-md text-on-surface divide-y divide-outline-variant/40">
                        {blockedItems.length === 0 ? (
                            <tr>
                                <td colSpan={5}>
                                    <div className="flex flex-col items-center justify-center py-28 text-center bg-gray-50/30">
                                        <div className="w-24 h-24 bg-emerald-50 rounded-full flex items-center justify-center mb-6 border border-emerald-100 shadow-sm shadow-emerald-100/50 relative">
                                            <div className="absolute inset-0 rounded-full bg-emerald-400/20 animate-ping" style={{ animationDuration: '3s' }} />
                                            <span className="material-symbols-outlined text-emerald-500 text-5xl relative z-10" style={{ fontVariationSettings: "'FILL' 1" }}>verified_user</span>
                                        </div>
                                        <h4 className="font-extrabold text-xl text-on-surface mb-2">{t('sessions.system_secure')}</h4>
                                        <p className="text-sm text-on-surface-variant leading-relaxed">
                                            {t('sessions.no_blocked')}
                                        </p>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            <AnimatePresence mode="popLayout">
                                {blockedItems.map((item) => (
                                    <motion.tr
                                        key={item.id}
                                        layout
                                        initial={{ opacity: 0, y: 15, filter: 'blur(4px)' }}
                                        animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                                        exit={{ opacity: 0, scale: 0.95, x: -20 }}
                                        transition={{ duration: 0.4, type: 'spring' }}
                                        className="hover:bg-error/5 hover:shadow-inner transition-all duration-300 group"
                                    >
                                        {/* Column 1: Device */}
                                        <td className="py-5 px-6">
                                            <div className="flex items-center gap-4">
                                                <div className="w-11 h-11 rounded-xl bg-surface-container-high flex items-center justify-center border border-outline-variant/60 group-hover:border-error/40 transition-colors shadow-sm text-on-surface-variant">
                                                    <span className="material-symbols-outlined text-[22px]">devices</span>
                                                </div>
                                                <div>
                                                    <p className="font-bold text-sm text-on-surface">{item.device_name || t('sessions.unknown_network')}</p>
                                                    <p className="text-[11px] font-bold text-on-surface-variant mt-0.5 opacity-70">{t('sessions.untrusted')}</p>
                                                </div>
                                            </div>
                                        </td>

                                        {/* Column 2: IP Address */}
                                        <td className="py-5 px-6 text-center">
                                            <div className="inline-flex items-center gap-2 bg-surface-container-high px-3 py-1.5 rounded-lg border border-outline-variant/50 shadow-sm relative overflow-hidden group-hover:border-error/30 transition-colors">
                                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-error" />
                                                <span className="w-2 h-2 rounded-full bg-error animate-pulse ml-1 shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
                                                <span className="font-mono text-[13px] tracking-wider font-extrabold text-on-surface" dir="ltr">{item.ip_address}</span>
                                            </div>
                                        </td>

                                        {/* Column 3: Timing */}
                                        <td className="py-5 px-6">
                                            <div className="flex flex-col">
                                                <span className="text-[13px] font-bold text-on-surface">
                                                    {new Date(item.blocked_at).toLocaleDateString('ar-EG', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                                <span className="text-[11px] text-error font-medium mt-1">
                                                    {t('sessions.recently_blocked')}
                                                </span>
                                            </div>
                                        </td>

                                        {/* Column 4: Reason Tag */}
                                        <td className="py-5 px-6">
                                            <span className="inline-flex items-center gap-1.5 bg-[#FFF7ED] text-[#C2410C] px-3 py-1.5 rounded-full text-xs font-bold border border-[#FED7AA] shadow-sm">
                                                <span className="material-symbols-outlined text-[15px]">warning</span>
                                                {item.reason || t('sessions.manual_block')}
                                            </span>
                                        </td>

                                        {/* Column 5: Action */}
                                        <td className="py-5 px-6 text-left">
                                            <button
                                                onClick={() => onUnblock(item)}
                                                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white hover:bg-emerald-50 hover:text-emerald-700 text-on-surface-variant text-sm font-bold transition-all border border-outline-variant/80 hover:border-emerald-300 shadow-sm hover:shadow group-hover:bg-white"
                                            >
                                                <span className="material-symbols-outlined text-[18px]">lock_open</span>
                                                {t('sessions.unblock_restore')}
                                            </button>
                                        </td>
                                    </motion.tr>
                                ))}
                            </AnimatePresence>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default BlocklistTable;
