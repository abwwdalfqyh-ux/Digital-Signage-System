import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axiosClient from '../../core/api/axiosClient';
import { ENDPOINTS } from '../../core/api/endpoints';
import useToastStore from '../../store/useToastStore';

export const useAds = (page = 1, status = 'all', search = '') => {
  return useQuery({
    queryKey: ['ads', page, status, search],
    queryFn: async () => {
      const params = new URLSearchParams({ page });
      if (status !== 'all') params.append('status', status);
      if (search) params.append('search', search);

      const res = await axiosClient.get(`${ENDPOINTS.ADS.ALL}?${params.toString()}`);
      return res.data;
    },
    refetchInterval: 15000, // Live Polling every 15s
  });
};

export const useCreateAd = () => {
  const queryClient = useQueryClient();
  const addToast = useToastStore(state => state.addToast);

  return useMutation({
    mutationFn: async (payload) => {
      const res = await axiosClient.post(ENDPOINTS.ADS.CREATE, payload, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ads'] });
      addToast('تم إنشاء الإعلان بنجاح', 'success');
    },
    onError: (err) => {
      addToast(err.response?.data?.message || 'فشل في إنشاء الإعلان', 'error');
    }
  });
};

export const useUpdateAdStatus = () => {
  const queryClient = useQueryClient();
  const addToast = useToastStore(state => state.addToast);

  return useMutation({
    mutationFn: async ({ id, payload }) => {
      const res = await axiosClient.put(ENDPOINTS.ADS.STATUS(id), payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ads'] });
      addToast('تم تحديث حالة الإعلان', 'success');
    },
    onError: (err) => {
      addToast(err.response?.data?.message || 'فشل تحديث حالة الإعلان', 'error');
    }
  });
};

export const useDeleteAd = () => {
  const queryClient = useQueryClient();
  const addToast = useToastStore(state => state.addToast);

  return useMutation({
    mutationFn: async (id) => {
      const res = await axiosClient.delete(ENDPOINTS.ADS.DELETE(id));
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ads'] });
      addToast('تم حذف الإعلان بنجاح', 'success');
    },
    onError: () => {
      addToast('فشلت عملية الحذف', 'error');
    }
  });
};
