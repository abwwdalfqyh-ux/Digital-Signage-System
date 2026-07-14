import { useQuery } from '@tanstack/react-query';
import axiosClient from '../../core/api/axiosClient';
import { ENDPOINTS } from '../../core/api/endpoints';

export const useAdminDashboard = () => {
  return useQuery({
    queryKey: ['adminDashboard'],
    queryFn: async () => {
      const res = await axiosClient.get(ENDPOINTS.DASHBOARD.OVERVIEW);
      return res.data?.data || res.data;
    },
  });
};

export const useOwnerDashboard = () => {
  return useQuery({
    queryKey: ['ownerDashboard'],
    queryFn: async () => {
      const res = await axiosClient.get(ENDPOINTS.OWNER.DASHBOARD);
      return res.data?.data || res.data;
    },
  });
};

export const useAdvertiserDashboard = () => {
  return useQuery({
    queryKey: ['advertiserDashboard'],
    queryFn: async () => {
      const res = await axiosClient.get(ENDPOINTS.ADVERTISER.DASHBOARD);
      return res.data?.data || res.data;
    },
  });
};
