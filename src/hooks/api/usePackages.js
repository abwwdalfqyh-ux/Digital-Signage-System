import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axiosClient from '../../core/api/axiosClient';
import { ENDPOINTS } from '../../core/api/endpoints';
import useToastStore from '../../store/useToastStore';

export const useDurationDiscounts = () => {
  return useQuery({
    queryKey: ['durationDiscounts'],
    queryFn: async () => {
      const res = await axiosClient.get(ENDPOINTS.DURATION_DISCOUNTS.ALL);
      return Array.isArray(res.data?.data) ? res.data.data : Array.isArray(res.data) ? res.data : [];
    },
  });
};



export const useCreateDurationDiscount = () => {
  const queryClient = useQueryClient();
  const addToast = useToastStore(state => state.addToast);

  return useMutation({
    mutationFn: async (payload) => {
      const res = await axiosClient.post(ENDPOINTS.DURATION_DISCOUNTS.CREATE, payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['durationDiscounts'] });
      addToast('تمت إضافة الخصم بنجاح', 'success');
    },
    onError: (err) => {
      addToast(err.response?.data?.message || 'تعذر إضافة الخصم', 'error');
    }
  });
};

export const useUpdateDurationDiscount = () => {
  const queryClient = useQueryClient();
  const addToast = useToastStore(state => state.addToast);

  return useMutation({
    mutationFn: async ({ id, payload }) => {
      const res = await axiosClient.put(ENDPOINTS.DURATION_DISCOUNTS.UPDATE(id), payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['durationDiscounts'] });
      addToast('تم تحديث الخصم بنجاح', 'success');
    },
    onError: (err) => {
      addToast(err.response?.data?.message || 'تعذر تحديث الخصم', 'error');
    }
  });
};

export const useDeleteDurationDiscount = () => {
  const queryClient = useQueryClient();
  const addToast = useToastStore(state => state.addToast);

  return useMutation({
    mutationFn: async (id) => {
      const res = await axiosClient.delete(ENDPOINTS.DURATION_DISCOUNTS.DELETE(id));
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['durationDiscounts'] });
      addToast('تم حذف الخصم بنجاح', 'success');
    },
    onError: () => {
      addToast('تعذر حذف الخصم', 'error');
    }
  });
};
