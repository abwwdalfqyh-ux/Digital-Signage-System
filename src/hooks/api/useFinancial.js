import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axiosClient from '../../core/api/axiosClient';
import { ENDPOINTS } from '../../core/api/endpoints';
import useToastStore from '../../store/useToastStore';

export const useLedger = (filters = {}) => {
  return useQuery({
    queryKey: ['ledger', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.start_date) params.append('start_date', filters.start_date);
      if (filters.end_date) params.append('end_date', filters.end_date);
      const queryString = params.toString() ? `?${params.toString()}` : '';
      
      const res = await axiosClient.get(`${ENDPOINTS.FINANCIAL.LEDGER}${queryString}`);
      return res.data?.data || res.data || {};
    },
    keepPreviousData: true,
    placeholderData: (previousData) => previousData,
  });
};

export const useArchiveLedger = () => {
  const queryClient = useQueryClient();
  const addToast = useToastStore(state => state.addToast);

  return useMutation({
    mutationFn: async (payload) => {
      const res = await axiosClient.post('/financial/archive', payload);
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['ledger'] });
      addToast({ title: 'نجاح', message: data.message, type: 'success' });
      // Trigger download if URL exists
      if (data.download_url) {
        window.open(data.download_url, '_blank');
      }
    },
    onError: (error) => {
      addToast({
        title: 'خطأ',
        message: error.response?.data?.message || 'حدث خطأ أثناء أرشفة السجلات',
        type: 'error'
      });
    }
  });
};

export const useApprovePayment = () => {
  const queryClient = useQueryClient();
  const addToast = useToastStore(state => state.addToast);

  return useMutation({
    mutationFn: async ({ id, payload }) => {
      const res = await axiosClient.put(ENDPOINTS.FINANCIAL.APPROVE(id), payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ledger'] });
      addToast('تم اتخاذ الإجراء بنجاح', 'success');
    },
    onError: (err) => {
      addToast(err.response?.data?.message || 'تعذر إتمام الإجراء', 'error');
    }
  });
};

export const useRecordPayment = () => {
  const queryClient = useQueryClient();
  const addToast = useToastStore(state => state.addToast);

  return useMutation({
    mutationFn: async (payload) => {
      const res = await axiosClient.post(ENDPOINTS.FINANCIAL.RECORD_PAYMENT, payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ledger'] });
      addToast('تم تسجيل الدفعة بنجاح', 'success');
    },
    onError: (err) => {
      addToast(err.response?.data?.message || 'تعذر تسجيل الدفعة', 'error');
    }
  });
};

export const useOwnerEarnings = () => {
  return useQuery({
    queryKey: ['ownerEarnings'],
    queryFn: async () => {
      const res = await axiosClient.get(ENDPOINTS.FINANCIAL.MY_EARNINGS);
      return res.data?.data || res.data;
    },
  });
};

export const useRequestPayout = () => {
  const queryClient = useQueryClient();
  const addToast = useToastStore(state => state.addToast);

  return useMutation({
    mutationFn: async (payload) => {
      const res = await axiosClient.post(ENDPOINTS.FINANCIAL.REQUEST_PAYOUT, payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ownerEarnings'] });
      addToast('تم إرسال طلب السحب بنجاح!', 'success');
    },
    onError: (err) => {
      addToast(err.response?.data?.message || 'فشلت العملية', 'error');
    }
  });
};

export const useApprovePayout = () => {
  const queryClient = useQueryClient();
  const addToast = useToastStore(state => state.addToast);

  return useMutation({
    mutationFn: async ({ id, reference_number }) => {
      const res = await axiosClient.post(ENDPOINTS.FINANCIAL.APPROVE_PAYOUT(id), { reference_number });
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['ledger'] });
      addToast(data.message || 'تم اعتماد السحب بنجاح', 'success');
    },
    onError: (err) => {
      addToast(err.response?.data?.message || 'تعذر اعتماد السحب', 'error');
    }
  });
};

export const useRejectPayout = () => {
  const queryClient = useQueryClient();
  const addToast = useToastStore(state => state.addToast);

  return useMutation({
    mutationFn: async ({ id, reason }) => {
      const res = await axiosClient.post(ENDPOINTS.FINANCIAL.REJECT_PAYOUT(id), { reason });
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['ledger'] });
      addToast(data.message || 'تم رفض السحب بنجاح', 'success');
    },
    onError: (err) => {
      addToast(err.response?.data?.message || 'تعذر رفض السحب', 'error');
    }
  });
};
