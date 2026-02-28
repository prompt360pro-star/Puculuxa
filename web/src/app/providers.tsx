'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';

import { SocketProvider } from '../components/SocketProvider';

export default function Providers({ children }: { children: React.ReactNode }) {
    const [queryClient] = useState(
        () =>
            new QueryClient({
                defaultOptions: {
                    queries: {
                        staleTime: 60 * 1000, // 1 minuto de cache padrão antes de re-fetches background
                        refetchOnWindowFocus: false, // Menos re-fetches intrusivos
                        retry: 1, // Limite de retentativas
                    },
                },
            }),
    );

    return (
        <QueryClientProvider client={queryClient}>
            <SocketProvider>
                {children}
            </SocketProvider>
        </QueryClientProvider>
    );
}
