import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axiosClient from '../../core/api/axiosClient';
import { ENDPOINTS } from '../../core/api/endpoints';
import useToastStore from '../../store/useToastStore';

export const useUsers = () => {
  return useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const res = await axiosClient.get(ENDPOINTS.USERS.ALL);
      return Array.isArray(res.data) ? res.data : (Array.isArray(res.data?.data) ? res.data.data : []);
    },
  });
};

export const useCreateUser = () => {
  const queryClient = useQueryClient();
  const addToast = useToastStore(state => state.addToast);

  return useMutation({
    mutationFn: async (payload) => {
      const res = await axiosClient.post(ENDPOINTS.USERS.ALL, payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      addToast('تمت إضافة المستخدم بنجاح', 'success');
    },
    onError: (err) => {
      addToast(err.response?.data?.message || 'فشلت إضافة المستخدم', 'error');
    }
  });
};

export const useUpdateUser = () => {
  const queryClient = useQueryClient();
  const addToast = useToastStore(state => state.addToast);

  return useMutation({
    mutationFn: async ({ id, payload }) => {
      const res = await axiosClient.put(ENDPOINTS.USERS.UPDATE(id), payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      addToast('تم تحديث بيانات المستخدم بنجاح', 'success');
    },
    onError: (err) => {
      addToast(err.response?.data?.message || 'فشل تحديث المستخدم', 'error');
    }
  });
};

export const useUpdateUserRole = () => {
  const queryClient = useQueryClient();
  const addToast = useToastStore(state => state.addToast);

  return useMutation({
    mutationFn: async ({ id, payload }) => {
      const res = await axiosClient.put(ENDPOINTS.USERS.UPDATE_ROLE(id), payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      addToast('تم تحديث الصلاحية بنجاح', 'success');
    },
    onError: (err) => {
      addToast(err.response?.data?.message || 'فشل تحديث الصلاحية', 'error');
    }
  });
};

export const useUpdateUserStatus = () => {
  const queryClient = useQueryClient();
  const addToast = useToastStore(state => state.addToast);

  return useMutation({
    mutationFn: async ({ id, payload }) => {
      const res = await axiosClient.put(ENDPOINTS.USERS.UPDATE_STATUS(id), payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      addToast('تم تغيير حالة المستخدم بنجاح', 'success');
    },
    onError: (err) => {
      addToast(err.response?.data?.message || 'فشل تغيير حالة المستخدم', 'error');
    }
  });
};

export const useDeleteUser = () => {
  const queryClient = useQueryClient();
  const addToast = useToastStore(state => state.addToast);

  return useMutation({
    mutationFn: async (id) => {
      const res = await axiosClient.delete(ENDPOINTS.USERS.DELETE(id));
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      addToast('تم حذف المستخدم بنجاح', 'success');
    },
    onError: () => {
      addToast('فشلت عملية الحذف', 'error');
    }
  });
};
