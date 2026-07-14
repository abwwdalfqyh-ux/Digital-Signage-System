import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axiosClient from '../../core/api/axiosClient';
import { ENDPOINTS } from '../../core/api/endpoints';
import useToastStore from '../../store/useToastStore';

export const useSupportTickets = () => {
  return useQuery({
    queryKey: ['supportTickets'],
    queryFn: async () => {
      const res = await axiosClient.get(ENDPOINTS.SUPPORT.ALL);
      return Array.isArray(res.data) ? res.data : (Array.isArray(res.data?.data) ? res.data.data : []);
    },
  });
};

export const useCreateSupportTicket = () => {
  const queryClient = useQueryClient();
  const addToast = useToastStore(state => state.addToast);

  return useMutation({
    mutationFn: async (payload) => {
      const res = await axiosClient.post(ENDPOINTS.SUPPORT.CREATE, payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supportTickets'] });
      addToast('تم إنشاء التذكرة بنجاح', 'success');
    },
    onError: (err) => {
      addToast(err.response?.data?.message || 'فشل في إنشاء التذكرة', 'error');
    }
  });
};
