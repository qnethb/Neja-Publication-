'use client';

import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/client';
import type { Role } from '@/lib/domain';

export type Me = {
  user:
    | (({
        id: string;
        name: string;
        email: string;
        role: Role;
        groupIds: string[];
        estateIds: string[];
        divisionIds: string[];
      }) & {
        permissions: { createRecommendation: boolean; logOperation: boolean; globalScope: boolean };
      })
    | null;
  estates?: { id: string; name: string; code: string; groupId: string }[];
  groups?: { id: string; name: string; region: string }[];
};

const AuthContext = createContext<{
  me: Me | undefined;
  isLoading: boolean;
  refresh: () => void;
}>({ me: undefined, isLoading: true, refresh: () => {} });

export function useAuth() {
  return useContext(AuthContext);
}

function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ['me'],
    queryFn: () => api<Me>('/api/auth/me'),
    staleTime: 60_000,
    retry: false,
  });

  const value = useMemo(
    () => ({
      me: data,
      isLoading,
      refresh: () => queryClient.invalidateQueries({ queryKey: ['me'] }),
    }),
    [data, isLoading, queryClient],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function Providers({ children }: { children: ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { refetchOnWindowFocus: false, retry: 1, staleTime: 30_000 },
        },
      }),
  );

  return (
    <QueryClientProvider client={client}>
      <AuthProvider>{children}</AuthProvider>
    </QueryClientProvider>
  );
}
