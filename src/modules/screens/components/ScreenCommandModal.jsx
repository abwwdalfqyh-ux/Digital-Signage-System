import React, { useState } from 'react';
import { Power, Moon, RefreshCw, RefreshCcw } from 'lucide-react';
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
    { id: 'SYNC_PLAYLIST', labelKey: 'screens.cmd_sync_playlist', icon: RefreshCcw, color: 'text-[#004ac6]', bg: 'bg-[#e1e8fd]', border: 'border-[#c3c6d7]' },
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
                    <span className="text-[20px] font-extrabold text-[#141b2b]">
                        {t('screens.remote_control_system')}
                    </span>
                }
            >
                <div className="space-y-4" dir={dir}>
                    <div className="bg-[#f9f9ff] p-4 rounded-xl border border-[#c3c6d7] shadow-sm flex justify-between items-center relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-1.5 h-full bg-[#004ac6]"></div>
                        <div className="w-full">
                            <h3 className="font-extrabold text-[18px] text-[#141b2b]">{screen?.screen_name || t('screens.unknown')}</h3>
                            <p className="text-[16px] text-[#004ac6] mt-1 font-mono font-bold tracking-wider" dir="ltr">{screen?.mac_address || '---'}</p>
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
                                    className={`flex flex-col items-center justify-center py-6 px-3 gap-3 rounded-2xl border-[1.5px] transition-all hover:shadow-md ${cmd.bg} ${cmd.border} hover:opacity-80 active:scale-95 disabled:opacity-50 disabled:scale-100 group cursor-pointer`}
                                >
                                    {isLoading ? (
                                        <div className={`w-9 h-9 border-4 border-t-transparent rounded-full animate-spin ${cmd.color.replace('text-', 'border-')}`}></div>
                                    ) : (
                                        <Icon className={`w-9 h-9 ${cmd.color} group-hover:scale-110 transition-transform`} />
                                    )}
                                    <span className={`text-[16px] font-extrabold ${cmd.color}`}>{t(cmd.labelKey)}</span>
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
