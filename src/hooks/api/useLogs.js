import { useQuery } from '@tanstack/react-query';
import axiosClient from '../../core/api/axiosClient';
import { ENDPOINTS } from '../../core/api/endpoints';

export const usePlaybackLogs = (params, options = {}) => {
    return useQuery({
        queryKey: ['playback_logs', params],
        queryFn: async () => {
            const res = await axiosClient.get(ENDPOINTS.LOGS.PLAYBACK, { params });
            return res.data.data;
        },
        ...options,
    });
};
