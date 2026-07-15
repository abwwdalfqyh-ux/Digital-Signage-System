import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axiosClient from '../../core/api/axiosClient';
import { ENDPOINTS } from '../../core/api/endpoints';
import useToastStore from '../../store/useToastStore';

export const useScreens = () => {
  return useQuery({
    queryKey: ['screens'],
    queryFn: async () => {
      const res = await axiosClient.get(ENDPOINTS.SCREENS.ALL);
      return Array.isArray(res.data) ? res.data : (Array.isArray(res.data?.data) ? res.data.data : []);
    },
  });
};

export const useCreateScreen = () => {
  const queryClient = useQueryClient();
  const addToast = useToastStore(state => state.addToast);

  return useMutation({
    mutationFn: async (payload) => {
      const res = await axiosClient.post(ENDPOINTS.SCREENS.ALL, payload, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['screens'] });
      addToast('تمت إضافة الشاشة الجديدة بنجاح', 'success');
    },
    onError: (err) => {
      addToast(err.response?.data?.message || 'فشلت إضافة الشاشة', 'error');
    }
  });
};

export const useUpdateScreen = () => {
  const queryClient = useQueryClient();
  const addToast = useToastStore(state => state.addToast);

  return useMutation({
    mutationFn: async ({ id, payload }) => {
      // In Laravel, multipart/form-data for PUT requests should use POST with _method=PUT
      payload.append('_method', 'PUT');
      const res = await axiosClient.post(ENDPOINTS.SCREENS.UPDATE(id), payload, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['screens'] });
      addToast('تم تحديث بيانات الشاشة بنجاح', 'success');
    },
    onError: (err) => {
      addToast(err.response?.data?.message || 'فشل تحديث الشاشة', 'error');
    }
  });
};
export const useUpdateScreenStatus = () => {
  const queryClient = useQueryClient();
  const addToast = useToastStore(state => state.addToast);

  return useMutation({
    mutationFn: async ({ id, status }) => {
      const res = await axiosClient.put(ENDPOINTS.SCREENS.UPDATE_STATUS(id), { status });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['screens'] });
      addToast('تم تحديث حالة الشاشة بنجاح', 'success');
    },
    onError: (err) => {
      addToast(err.response?.data?.message || 'فشل تحديث حالة الشاشة', 'error');
    }
  });
};

export const useDeleteScreen = () => {
  const queryClient = useQueryClient();
  const addToast = useToastStore(state => state.addToast);

  return useMutation({
    mutationFn: async (id) => {
      const res = await axiosClient.delete(ENDPOINTS.SCREENS.DELETE(id));
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['screens'] });
      addToast('تم إسقاط الشاشة من الشبكة', 'success');
    },
    onError: () => {
      addToast('فشلت عملية الحذف. قد تكون الشاشة مرتبطة بإعلانات نشطة', 'error');
    }
  });
};

export const useScreenPricing = () => {
  return useQuery({
    queryKey: ['screenPricing'],
    queryFn: async () => {
      const res = await axiosClient.get(ENDPOINTS.SCREEN_PRICING.ALL);
      return Array.isArray(res.data?.data) ? res.data.data : res.data || [];
    },
  });
};

export const useScreenAvailability = (screenId, date) => {
  return useQuery({
    queryKey: ['screenAvailability', screenId, date],
    queryFn: async () => {
      const res = await axiosClient.get(`${ENDPOINTS.SCREENS.AVAILABILITY(screenId)}?date=${date}`);
      return res.data;
    },
    enabled: !!screenId && !!date,
  });
};

