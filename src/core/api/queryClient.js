import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: true, // Auto-refetch when tab becomes active
      staleTime: 1000 * 60 * 5, // Data is considered fresh for 5 minutes
      cacheTime: 1000 * 60 * 30, // Data remains in cache for 30 minutes
      retry: 1, // Only retry once on failure
    },
  },
});
