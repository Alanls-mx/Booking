import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false, // Prevent refetching when window gains focus
      retry: 1, // Retry failed requests once
      staleTime: 1000 * 60 * 5, // Data is considered fresh for 5 minutes
    },
  },
});
