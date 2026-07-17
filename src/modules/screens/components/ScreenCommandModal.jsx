import React, { useState } from 'react';
import { Power, Moon, RefreshCw, RefreshCcw, TerminalSquare } from 'lucide-react';
import Modal from '../../../shared/components/Modal';
import ConfirmDialog from '../../../shared/components/ConfirmDialog';
import axiosClient from '../../../core/api/axiosClient';
import { ENDPOINTS } from '../../../core/api/endpoints';
import useToastStore from '../../../store/useToastStore';
import useTranslation from '../../../i18n/useTranslation';

const commands = [
    { id: 'RESTART_APP', labelKey: 'screens.cmd_restart_app', icon: RefreshCw, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200' },
    { id: 'WAKE_SCREEN', labelKey: 'screens.cmd_wake_screen', icon: Power, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200' },
    { id: 'SLEEP_SCREEN', labelKey: 'screens.cmd_sleep_screen', icon: Moon, color: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-200' },
    { id: 'SYNC_PLAYLIST', labelKey: 'screens.cmd_sync_playlist', icon: RefreshCcw, color: 'text-[var(--color-dark-turquoise)]', bg: 'bg-[var(--color-dark-turquoise)]/10', border: 'border-[var(--color-dark-turquoise)]/30' },
];

const ScreenCommandModal = ({ isOpen, onClose, screen }) => {
    const [loadingCommand, setLoadingCommand] = useState(null);
    const [confirmAction, setConfirmAction] = useState(null); // holds cmd object to confirm
    const addToast = useToastStore(state => state.addToast);
    const { t, dir } = useTranslation();

    const executeCommand = async () => {
        if (!screen?.mac_address || !confirmAction) return;
        
        setLoadingCommand(confirmAction.id);
        const actionId = confirmAction.id;
        setConfirmAction(null); // close dialog immediately

        try {
            await axiosClient.post(ENDPOINTS.SCREENS.COMMAND, {
                target_screen: screen.mac_address,
                command: actionId
            });
            addToast(t('screens.cmd_sent_success'), 'success');
        } catch (error) {
            addToast(error.response?.data?.message || t('screens.cmd_sent_error'), 'error');
        } finally {
            setLoadingCommand(null);
        }
    };

    return (
        <>
            <Modal 
                isOpen={isOpen} 
                onClose={onClose} 
                title={
                    <span className="flex items-center gap-2">
                        <TerminalSquare className="w-5 h-5 text-[var(--color-dark-turquoise)]" /> 
                        {t('screens.remote_control_system')}
                    </span>
                }
            >
                <div className="space-y-4" dir={dir}>
                    <div className="bg-white p-4 rounded-xl border-[1.5px] border-gray-100 shadow-sm flex justify-between items-center relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-1.5 h-full bg-[var(--color-dark-turquoise)]"></div>
                        <div>
                            <p className="text-[10px] text-gray-400 font-bold mb-0.5">{t('screens.target_screen')}</p>
                            <h3 className="font-black text-sm text-gray-800">{screen?.screen_name || t('screens.unknown')}</h3>
                            <p className="text-[11px] text-gray-400 mt-1 font-mono tracking-widest text-left mt-0.5" dir="ltr">{screen?.mac_address || '---'}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-2">
                        {commands.map(cmd => {
                            const Icon = cmd.icon;
                            const isLoading = loadingCommand === cmd.id;
                            
                            return (
                                <button
                                    key={cmd.id}
                                    disabled={!!loadingCommand}
                                    onClick={() => setConfirmAction(cmd)}
                                    className={`flex flex-col items-center justify-center py-6 px-2 gap-3 rounded-2xl border-[1.5px] transition-all hover:shadow-md ${cmd.bg} ${cmd.border} hover:opacity-80 active:scale-95 disabled:opacity-50 disabled:scale-100 group`}
                                >
                                    {isLoading ? (
                                        <div className={`w-8 h-8 border-4 border-t-transparent rounded-full animate-spin ${cmd.color.replace('text-', 'border-')}`}></div>
                                    ) : (
                                        <Icon className={`w-8 h-8 ${cmd.color} group-hover:scale-110 transition-transform`} />
                                    )}
                                    <span className={`text-xs font-black ${cmd.color}`}>{t(cmd.labelKey)}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            </Modal>

            <ConfirmDialog
                isOpen={!!confirmAction}
                onClose={() => setConfirmAction(null)}
                onConfirm={executeCommand}
                title={t('screens.confirm_cmd_title')}
                message={t('screens.confirm_cmd_message').replace('{command}', confirmAction ? t(confirmAction.labelKey) : '')}
                confirmText={t('screens.yes_send')}
            />
        </>
    );
};

export default ScreenCommandModal;
