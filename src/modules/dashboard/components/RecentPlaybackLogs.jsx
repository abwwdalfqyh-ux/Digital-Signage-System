import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, ChevronRight, ChevronLeft, Download, Filter, Trash2 } from 'lucide-react';
import { usePlaybackLogs } from '../../../hooks/api/useLogs';
import axiosClient from '../../../core/api/axiosClient';
import { ENDPOINTS } from '../../../core/api/endpoints';
import useToastStore from '../../../store/useToastStore';
import useTranslation from '../../../i18n/useTranslation';

const S = {
    surfaceContainerLowest: '#ffffff',
    surfaceContainerLow: '#f8f9fa',
    onBackground: '#1a1a1a',
    outlineVariant: '#e0e0e0',
    onSurfaceVariant: '#5f6368',
    outline: '#747775',
    onSurface: '#202124',
    primaryContainer: '#e8efae',
    onPrimaryContainer: '#4d5118',
};

const glassCard = {
    background: 'rgba(255,255,255,0.7)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    borderRadius: '24px',
    border: '1px solid rgba(255,255,255,0.5)',
    boxShadow: '0 8px 32px rgba(0,0,0,0.04)',
};

const RecentPlaybackLogs = () => {
    const { t, dir } = useTranslation();
    const addToast = useToastStore(state => state.addToast);
    const [page, setPage] = useState(1);
    const [isExporting, setIsExporting] = useState(false);
    const [exportFormat, setExportFormat] = useState('csv');
    const [isCleaning, setIsCleaning] = useState(false);
    const [cleanupDays, setCleanupDays] = useState(30);

    const params = {
        page,
        per_page: 10,
    };

    // Polling every 15 seconds to keep it real-time
    const { data, isLoading } = usePlaybackLogs(params, {
        refetchInterval: 15000,
    });

    const logs = data?.logs || [];
    const stats = data?.stats || { total_plays: 0 };
    const pagination = data?.pagination || { current_page: 1, last_page: 1, total: 0 };

    const handleExport = async () => {
        try {
            setIsExporting(true);
            const response = await axiosClient.get(ENDPOINTS.LOGS.PLAYBACK_EXPORT, {
                params: {
                    ...params,
                    format: exportFormat // 'csv' or 'pdf'
                },
                responseType: 'blob',
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', exportFormat === 'pdf' ? 'playback_logs.pdf' : 'playback_logs.csv');
            document.body.appendChild(link);
            link.click();
            link.remove();
            addToast(t('dashboard.export_success'), 'success');
        } catch (error) {
            addToast(t('dashboard.export_error'), 'error');
        } finally {
            setIsExporting(false);
        }
    };

    const handleCleanup = async () => {
        const daysLabel = cleanupDays == 1 ? t('dashboard.cleanup_day') : cleanupDays == 7 ? t('dashboard.cleanup_week') : t('dashboard.cleanup_days', { days: cleanupDays });
        if (!window.confirm(t('dashboard.cleanup_confirm', { daysLabel }))) return;

        try {
            setIsCleaning(true);
            const response = await axiosClient.delete(ENDPOINTS.LOGS.PLAYBACK_CLEANUP, {
                params: { days: cleanupDays }
            });
            addToast(response.data.message || t('dashboard.cleanup_success'), 'success');
        } catch (error) {
            addToast(t('dashboard.cleanup_error'), 'error');
        } finally {
            setIsCleaning(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            style={{ ...glassCard, overflow: 'hidden', marginTop: '30px' }}
        >
            {/* toolbar: Title centered + Buttons row below */}
            <div style={{
                background: S.surfaceContainerLowest,
                borderBottom: `1px solid ${S.outlineVariant}`,
            }}>
                {/* Title Row - centered */}
                <div style={{
                    padding: '20px 20px 12px',
                    textAlign: 'center',
                }}>
                    <h3 style={{
                        margin: 0, fontSize: '26px', fontWeight: 800,
                        color: S.onBackground,
                        fontFamily: "'IBM Plex Sans Arabic', sans-serif",
                        letterSpacing: '-0.02em',
                    }}>
                        {t('dashboard.live_playback_logs')}
                    </h3>
                    <div style={{ width: '50px', height: '3px', background: '#004ac6', borderRadius: '99px', margin: '8px auto 0' }} />
                </div>

                {/* Buttons Row - Full Width */}
                <div style={{
                    display: 'flex', alignItems: 'stretch',
                    padding: '0 20px 16px',
                    gap: '12px',
                }}>

                    {/* Cleanup Section - flex:1 */}
                    <div style={{ display: 'flex', alignItems: 'stretch', gap: '0', background: S.surfaceContainerLow, borderRadius: '10px', overflow: 'hidden', border: `1px solid ${S.outlineVariant}`, flex: 1 }}>
                        <select
                            value={cleanupDays}
                            onChange={(e) => setCleanupDays(e.target.value)}
                            style={{
                                background: 'transparent', border: 'none', outline: 'none',
                                color: S.onSurface, padding: '10px 12px',
                                fontFamily: "'IBM Plex Sans Arabic', sans-serif", fontSize: '14px',
                                cursor: 'pointer', fontWeight: 600,
                                flex: 1,
                            }}
                        >
                            <option value="30">{t('dashboard.older_than_month')}</option>
                            <option value="15">{t('dashboard.older_than_15_days')}</option>
                            <option value="7">{t('dashboard.older_than_week')}</option>
                            <option value="1">{t('dashboard.older_than_day')}</option>
                        </select>
                        <button
                            onClick={handleCleanup}
                            disabled={isCleaning}
                            style={{
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                                background: isCleaning ? S.surfaceContainerLowest : '#fee2e2',
                                color: isCleaning ? S.outline : '#ef4444',
                                border: 'none', borderRight: `1px solid ${S.outlineVariant}`,
                                padding: '10px 18px',
                                cursor: isCleaning ? 'wait' : 'pointer', fontWeight: 700,
                                fontFamily: "'IBM Plex Sans Arabic', sans-serif", fontSize: '14px',
                                whiteSpace: 'nowrap',
                            }}
                            title={t('dashboard.delete_logs_title')}
                        >
                            <Trash2 style={{ width: '16px', height: '16px' }} />
                            {t('dashboard.clear_btn')}
                        </button>
                    </div>

                    {/* Export Section - flex:1 */}
                    <div style={{ display: 'flex', alignItems: 'stretch', gap: '0', background: S.surfaceContainerLow, borderRadius: '10px', overflow: 'hidden', border: `1px solid ${S.outlineVariant}`, flex: 1 }}>
                        <select
                            value={exportFormat}
                            onChange={(e) => setExportFormat(e.target.value)}
                            style={{
                                background: 'transparent', border: 'none', outline: 'none',
                                color: S.onSurface, padding: '10px 12px',
                                fontFamily: "'IBM Plex Sans Arabic', sans-serif", fontSize: '14px',
                                cursor: 'pointer', fontWeight: 600,
                                flex: 1,
                            }}
                        >
                            <option value="csv">Excel (CSV)</option>
                            <option value="pdf">PDF</option>
                        </select>
                        <button
                            onClick={handleExport}
                            disabled={isExporting}
                            style={{
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                                background: isExporting ? S.surfaceContainerLowest : '#e8efae',
                                color: isExporting ? S.outline : '#4d5118',
                                border: 'none', padding: '10px 18px',
                                cursor: isExporting ? 'wait' : 'pointer', fontWeight: 700,
                                fontFamily: "'IBM Plex Sans Arabic', sans-serif", fontSize: '14px',
                                whiteSpace: 'nowrap',
                            }}
                        >
                            <Download style={{ width: '16px', height: '16px' }} />
                            {t('dashboard.export_btn')}
                        </button>
                    </div>

                    {/* Pagination */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
                        <button
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page === 1}
                            style={{
                                width: 40, height: 40, borderRadius: '10px',
                                border: `1px solid ${S.outlineVariant}`,
                                background: S.surfaceContainerLowest,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                cursor: 'pointer', opacity: page === 1 ? 0.35 : 1,
                                color: S.onSurfaceVariant,
                            }}
                        >
                            <ChevronRight style={{ width: 20, height: 20 }} />
                        </button>
                        <span style={{
                            padding: '0 16px', height: 40, borderRadius: '10px',
                            background: '#e8efae', color: '#4d5118',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '14px', fontWeight: 800,
                        }}>
                            {page} / {pagination.last_page}
                        </span>
                        <button
                            onClick={() => setPage(p => Math.min(pagination.last_page, p + 1))}
                            disabled={page === pagination.last_page || pagination.last_page === 0}
                            style={{
                                width: 40, height: 40, borderRadius: '10px',
                                border: `1px solid ${S.outlineVariant}`,
                                background: S.surfaceContainerLowest,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                cursor: 'pointer', opacity: (page === pagination.last_page || pagination.last_page === 0) ? 0.35 : 1,
                                color: S.onSurfaceVariant,
                            }}
                        >
                            <ChevronLeft style={{ width: 20, height: 20 }} />
                        </button>
                    </div>
                </div>
            </div>

            {/* table */}
            <div style={{ overflowX: 'auto' }}>
                <table style={{
                    width: '100%', borderCollapse: 'collapse',
                    whiteSpace: 'nowrap', minWidth: '700px',
                }}>
                    <thead>
                        <tr style={{
                            background: S.surfaceContainerLow,
                            borderBottom: `1px solid ${S.outlineVariant}`,
                        }}>
                            {[
                                t('dashboard.id_col'),
                                t('dashboard.ad_name_col'),
                                t('dashboard.screen_col'),
                                t('dashboard.duration_col'),
                                t('dashboard.play_time_col'),
                                t('dashboard.status_col')
                            ].map((label, i) => (
                                <th key={i} style={{
                                    padding: '18px 20px',
                                    textAlign: dir === 'rtl' ? 'right' : 'left',
                                    fontSize: '17px', fontWeight: 700,
                                    color: S.onSurface,
                                    fontFamily: "'IBM Plex Sans Arabic', sans-serif",
                                }}>
                                    {label}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        <AnimatePresence mode="wait">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={6} style={{ padding: '40px', textAlign: 'center' }}>
                                        <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
                                            <div className="w-5 h-5 border-2 border-[#e8efae] border-t-[#4d5118] rounded-full animate-spin"></div>
                                            <span style={{ fontFamily: "'IBM Plex Sans Arabic', sans-serif" }}>{t('dashboard.loading_logs')}</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : logs.length > 0 ? logs.map((log, idx) => (
                                <motion.tr
                                    key={log.log_id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: 0.2, delay: idx * 0.03 }}
                                    style={{
                                        borderBottom: `1px solid ${S.outlineVariant}40`,
                                        background: S.surfaceContainerLowest,
                                        cursor: 'default',
                                        transition: 'background 0.2s',
                                    }}
                                    onMouseEnter={e => e.currentTarget.style.background = S.surfaceContainerLow}
                                    onMouseLeave={e => e.currentTarget.style.background = S.surfaceContainerLowest}
                                >
                                    <td style={{ padding: '18px 20px', fontSize: '15px', fontWeight: 700, color: S.onSurfaceVariant }}>
                                        #{log.log_id}
                                    </td>
                                    <td style={{ padding: '16px 20px' }}>
                                        <span style={{
                                            fontSize: '16px', fontWeight: 600,
                                            color: S.onSurface,
                                            fontFamily: "'IBM Plex Sans Arabic', sans-serif"
                                        }}>
                                            {log.ad_name}
                                        </span>
                                    </td>
                                    <td style={{ padding: '16px 20px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <span style={{
                                                fontSize: '15px', fontWeight: 500,
                                                color: S.onSurfaceVariant,
                                                fontFamily: "'IBM Plex Sans Arabic', sans-serif"
                                            }}>
                                                {log.screen_name}
                                            </span>
                                        </div>
                                    </td>
                                    <td style={{ padding: '16px 20px' }}>
                                        <span style={{
                                            fontSize: '15px', fontWeight: 500,
                                            color: S.onSurface,
                                            fontFamily: "'IBM Plex Sans Arabic', sans-serif"
                                        }}>
                                            {log.duration} {t('dashboard.seconds_unit')}
                                        </span>
                                    </td>
                                    <td style={{ padding: '18px 20px', textAlign: 'center', verticalAlign: 'middle' }}>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', alignItems: 'center' }} dir="ltr">
                                            <span style={{ fontSize: '15px', fontWeight: 600, color: S.onSurface, letterSpacing: '0.01em' }}>
                                                {log.played_at}
                                            </span>
                                            <span style={{ fontSize: '13px', color: S.outline }}>
                                                {log.played_at_human}
                                            </span>
                                        </div>
                                    </td>
                                    <td style={{ padding: '16px 20px' }}>
                                        <span style={{
                                            background: 'rgba(52, 211, 153, 0.1)', color: '#059669',
                                            padding: '6px 14px', borderRadius: '12px', fontSize: '14px', fontWeight: 700
                                        }}>
                                            {t('dashboard.completed_status')}
                                        </span>
                                    </td>
                                </motion.tr>
                            )) : (
                                <tr>
                                    <td colSpan={6} style={{ padding: '40px', textAlign: 'center' }}>
                                        <p style={{
                                            fontSize: '14px', color: S.outline, margin: 0,
                                            fontFamily: "'IBM Plex Sans Arabic', sans-serif",
                                        }}>
                                            {t('dashboard.no_recent_logs')}
                                        </p>
                                    </td>
                                </tr>
                            )}
                        </AnimatePresence>
                    </tbody>
                </table>
            </div>
        </motion.div>
    );
};

export default RecentPlaybackLogs;
