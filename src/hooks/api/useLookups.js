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

// ── بيانات نادراً ما تتغير — تُخزَّن 30 دقيقة في الذاكرة ──────────────────
export const useCategories = () => {
  return useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const res = await axiosClient.get(ENDPOINTS.LOOKUPS.CATEGORIES);
      return parseArray(res);
    },
    staleTime: 1000 * 60 * 30, // 30 minutes — التصنيفات تتغير نادراً
    refetchOnWindowFocus: false,
  });
};

export const useAllScreens = () => {
  return useQuery({
    queryKey: ['screens', 'all'],
    queryFn: async () => {
      const res = await axiosClient.get('/screens');
      return Array.isArray(res.data) ? res.data : res.data?.data || [];
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: false,
  });
};

export const useRegionsByGov = (govId) => {
  return useQuery({
    queryKey: ['regions', govId],
    queryFn: async () => {
      const res = await axiosClient.get(ENDPOINTS.LOOKUPS.REGIONS_BY_GOV(govId));
      return parseArray(res);
    },
    enabled: !!govId,
    staleTime: 1000 * 60 * 30, // 30 minutes
    refetchOnWindowFocus: false,
  });
};

export const useStreetsByRegion = (regionId) => {
  return useQuery({
    queryKey: ['streets', 'region', regionId],
    queryFn: async () => {
      const res = await axiosClient.get(ENDPOINTS.LOOKUPS.STREETS_BY_REGION(regionId));
      return parseArray(res);
    },
    enabled: !!regionId,
    staleTime: 1000 * 60 * 30, // 30 minutes
    refetchOnWindowFocus: false,
  });
};
