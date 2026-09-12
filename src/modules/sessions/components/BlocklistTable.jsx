import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import useTranslation from '../../../i18n/useTranslation';

const BlocklistTable = ({ blockedItems = [], onUnblock }) => {
    const { t } = useTranslation();
    return (
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl shadow-sm overflow-hidden mt-6">
            {/* ── Header ── */}
            <div className="p-5 border-b border-outline-variant text-center">
                <h3 className="text-xl sm:text-2xl font-bold text-on-surface">{t('sessions.threat_log')}</h3>
            </div>
            
            {/* ── Table ── */}
            <div className="overflow-x-auto">
                <table className="w-full text-right border-collapse">
                    <thead>
                        <tr className="bg-surface-container-low text-on-surface font-bold text-lg sm:text-xl border-b-2 border-outline-variant">
                            <th className="py-5 px-6 font-bold whitespace-nowrap text-start">{t('sessions.blocked_entity')}</th>
                            <th className="py-5 px-6 font-bold whitespace-nowrap text-center">{t('sessions.ip_fingerprint')}</th>
                            <th className="py-5 px-6 font-bold whitespace-nowrap text-start">{t('sessions.block_date')}</th>
                            <th className="py-5 px-6 font-bold whitespace-nowrap text-start">{t('sessions.block_reason_col')}</th>
                            <th className="py-5 px-6 font-bold whitespace-nowrap text-left">{t('sessions.security_actions')}</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-outline-variant text-base sm:text-lg font-medium text-on-surface">
                        {blockedItems.length === 0 ? (
                            <tr>
                                <td colSpan={5}>
                                    <div className="flex flex-col items-center justify-center py-16 text-center">
                                        <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mb-3 border border-emerald-100 shadow-sm">
                                            <span className="material-symbols-outlined text-emerald-500 text-3xl">verified_user</span>
                                        </div>
                                        <h4 className="font-bold text-lg text-on-surface">{t('sessions.system_secure')}</h4>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            <AnimatePresence mode="popLayout">
                                {blockedItems.map((item) => (
                                    <motion.tr
                                        key={item.id}
                                        layout
                                        initial={{ opacity: 0, y: 12 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, x: -20 }}
                                        transition={{ duration: 0.2 }}
                                        className="border-b border-outline-variant hover:bg-surface-container-lowest transition-colors"
                                    >
                                        {/* Column 1: Device */}
                                        <td className="py-5 px-6">
                                            <div className="flex items-center gap-4">
                                                <div className="w-11 h-11 rounded-xl bg-surface-container flex items-center justify-center border border-outline-variant text-on-surface-variant">
                                                    <span className="material-symbols-outlined text-[22px]">devices</span>
                                                </div>
                                                <div>
                                                    <p className="font-bold text-lg text-on-surface">{item.device_name || t('sessions.unknown_network')}</p>
                                                    <p className="text-xs font-semibold text-on-surface-variant mt-0.5">{t('sessions.untrusted')}</p>
                                                </div>
                                            </div>
                                        </td>

                                        {/* Column 2: IP Address */}
                                        <td className="py-5 px-6 text-center">
                                            <div className="inline-flex items-center gap-2 bg-surface-container-high px-3.5 py-1.5 rounded-lg border border-outline-variant shadow-sm">
                                                <span className="font-mono text-sm tracking-wider font-bold text-on-surface" dir="ltr">{item.ip_address}</span>
                                            </div>
                                        </td>

                                        {/* Column 3: Timing */}
                                        <td className="py-5 px-6">
                                            <div className="flex flex-col">
                                                <span className="text-base font-semibold text-on-surface">
                                                    {new Date(item.blocked_at).toLocaleDateString('ar-EG', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                                <span className="text-xs text-on-surface-variant font-medium mt-0.5">
                                                    {t('sessions.recently_blocked')}
                                                </span>
                                            </div>
                                        </td>

                                        {/* Column 4: Reason Tag */}
                                        <td className="py-5 px-6">
                                            <span className="inline-flex items-center gap-1.5 bg-surface-container-high text-on-surface-variant px-3.5 py-1.5 rounded-full text-sm font-bold border border-outline-variant shadow-sm">
                                                {item.reason || t('sessions.manual_block')}
                                            </span>
                                        </td>

                                        {/* Column 5: Action */}
                                        <td className="py-5 px-6 text-left">
                                            <button
                                                onClick={() => onUnblock(item)}
                                                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary/10 hover:bg-primary text-primary hover:text-white text-sm font-bold transition-all border border-primary/20 shadow-sm"
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
