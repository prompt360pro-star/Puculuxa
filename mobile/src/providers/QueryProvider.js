import React from 'react';
import { QueryClient } from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import AsyncStorage from '@react-native-async-storage/async-storage';

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            cacheTime: 1000 * 60 * 60 * 24 * 7, // 7 days cache time for offline viewing
            staleTime: 1000 * 60 * 5, // 5 minutes fresh data
            retry: 2, // Retry twice if request fails
            refetchOnWindowFocus: true, // Native apps come back from background
        },
    },
});

const persister = createAsyncStoragePersister({
    storage: AsyncStorage,
    throttleTime: 1000,
});

export const QueryProvider = ({ children }) => {
    return (
        <PersistQueryClientProvider
            client={queryClient}
            persistOptions={{ persister }}
        >
            {children}
        </PersistQueryClientProvider>
    );
};
