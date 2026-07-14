import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axiosClient from '../../core/api/axiosClient';
import { ENDPOINTS } from '../../core/api/endpoints';

export const SETTINGS_QUERY_KEY = ['system-settings'];

/**
 * Fetch all system settings
 */
export const useSettings = () => {
    return useQuery({
        queryKey: SETTINGS_QUERY_KEY,
        queryFn: async () => {
            const { data } = await axiosClient.get(ENDPOINTS.SETTINGS.ALL);
            return data.data; // The settings key-value pair object
        },
        staleTime: 1000 * 60 * 5, // Cache for 5 minutes
    });
};

/**
 * Update system settings
 */
export const useUpdateSettings = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (settingsData) => {
            const { data } = await axiosClient.post(ENDPOINTS.SETTINGS.UPDATE, settingsData);
            return data;
        },
        onSuccess: (data) => {
            // Update the cache immediately
            queryClient.setQueryData(SETTINGS_QUERY_KEY, data.data);
        },
    });
};
