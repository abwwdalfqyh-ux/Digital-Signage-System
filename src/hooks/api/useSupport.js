import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axiosClient from '../../core/api/axiosClient';
import { ENDPOINTS } from '../../core/api/endpoints';
import useToastStore from '../../store/useToastStore';

export const useSupportTickets = () => {
    return useQuery({
        queryKey: ['supportTickets'],
        queryFn: async () => {
            const { data } = await axiosClient.get(ENDPOINTS.SUPPORT.ALL);
            return data;
        },
    });
};

export const useSupportTicket = (id) => {
    return useQuery({
        queryKey: ['supportTickets', id],
        queryFn: async () => {
            const { data } = await axiosClient.get(ENDPOINTS.SUPPORT.GET(id));
            return data;
        },
        enabled: !!id,
    });
};

export const useCreateSupportTicket = () => {
    const queryClient = useQueryClient();
    const addToast = useToastStore(state => state.addToast);

    return useMutation({
        mutationFn: async (payload) => {
            const { data } = await axiosClient.post(ENDPOINTS.SUPPORT.CREATE, payload);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['supportTickets'] });
            addToast('تم رفع التذكرة بنجاح', 'success');
        },
        onError: (error) => {
            addToast(error.response?.data?.message || 'حدث خطأ أثناء رفع التذكرة', 'error');
        },
    });
};

export const useUpdateSupportTicket = () => {
    const queryClient = useQueryClient();
    const addToast = useToastStore(state => state.addToast);

    return useMutation({
        mutationFn: async ({ id, payload }) => {
            const { data } = await axiosClient.put(ENDPOINTS.SUPPORT.UPDATE(id), payload);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['supportTickets'] });
            addToast('تم تحديث التذكرة بنجاح', 'success');
        },
        onError: (error) => {
            addToast(error.response?.data?.message || 'حدث خطأ أثناء تحديث التذكرة', 'error');
        },
    });
};

export const useDeleteSupportTicket = () => {
    const queryClient = useQueryClient();
    const addToast = useToastStore(state => state.addToast);

    return useMutation({
        mutationFn: async (id) => {
            await axiosClient.delete(ENDPOINTS.SUPPORT.DELETE(id));
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['supportTickets'] });
            addToast('تم حذف التذكرة', 'success');
        },
        onError: (error) => {
            addToast(error.response?.data?.message || 'حدث خطأ أثناء حذف التذكرة', 'error');
        },
    });
};
