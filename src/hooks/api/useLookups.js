import { useQuery } from '@tanstack/react-query';
import axiosClient from '../../core/api/axiosClient';
import { ENDPOINTS } from '../../core/api/endpoints';

const parseArray = (res) => {
  if (Array.isArray(res.data)) return res.data;
  if (Array.isArray(res.data?.data)) return res.data.data;
  if (Array.isArray(res)) return res;
  return [];
};

export const useGovernorates = () => {
  return useQuery({
    queryKey: ['governorates'],
    queryFn: async () => {
      const res = await axiosClient.get(ENDPOINTS.LOOKUPS.GOVERNORATES);
      return parseArray(res);
    },
    staleTime: 1000 * 60 * 60 * 24, // 24 hours
  });
};

export const useScreenTypes = () => {
  return useQuery({
    queryKey: ['screenTypes'],
    queryFn: async () => {
      const res = await axiosClient.get(ENDPOINTS.LOOKUPS.SCREEN_TYPES);
      return parseArray(res);
    },
    staleTime: 1000 * 60 * 60 * 24, // 24 hours
  });
};

export const useStreets = () => {
  return useQuery({
    queryKey: ['streets'],
    queryFn: async () => {
      const res = await axiosClient.get(ENDPOINTS.LOOKUPS.STREETS);
      return parseArray(res);
    },
    staleTime: 1000 * 60 * 60 * 24, // 24 hours
  });
};

export const useRoles = () => {
  return useQuery({
    queryKey: ['roles'],
    queryFn: async () => {
      const res = await axiosClient.get(ENDPOINTS.LOOKUPS.ROLES);
      return parseArray(res);
    },
    staleTime: 1000 * 60 * 60 * 24, // 24 hours
  });
};

export const useUsersByRole = (roleName) => {
  return useQuery({
    queryKey: ['users', 'role', roleName],
    queryFn: async () => {
      const res = await axiosClient.get(ENDPOINTS.LOOKUPS.USERS_BY_ROLE(roleName));
      return parseArray(res);
    },
    enabled: !!roleName,
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
};
