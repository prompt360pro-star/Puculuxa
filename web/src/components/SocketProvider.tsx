'use client';

import { useEffect } from 'react';
import { io } from 'socket.io-client';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

// Configure this to match where your NestJS backend serves WebSockets
const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:4001';

export function SocketProvider({ children }: { children: React.ReactNode }) {
    const queryClient = useQueryClient();

    useEffect(() => {
        if (typeof window === 'undefined') return;

        const socket = io(SOCKET_URL, {
            transports: ['websocket'],
            reconnectionAttempts: 5,
        });

        socket.on('connect', () => {
            console.log('✅ WebSocket Connected to Backend Server');
        });

        socket.on('new_quotation', (quotation) => {
            toast.success('🎉 Novo Orçamento!', {
                description: `${quotation.customerName || 'Cliente'} enviou um pedido (${quotation.guestCount} convidados).`,
                duration: 6000,
            });
            // Auto refresh any quotation tables/data
            queryClient.invalidateQueries({ queryKey: ['quotations'] });
        });

        socket.on('new_order', (order) => {
            toast.message('🛒 Nova Encomenda Recebida', {
                description: `Valor Total: Kz ${order.total}`,
                duration: 6000,
            });
            // Auto refresh orders table and dashboard stats
            queryClient.invalidateQueries({ queryKey: ['orders'] });
            queryClient.invalidateQueries({ queryKey: ['dashboard'] });
        });

        socket.on('order_status_update', (order) => {
            toast.info('🔄 Atualização de Pedido', {
                description: `O pedido #${order.id.slice(0, 8)} mudou para ${order.status}.`,
            });
            queryClient.invalidateQueries({ queryKey: ['orders'] });
            queryClient.invalidateQueries({ queryKey: ['dashboard'] });
        });

        socket.on('disconnect', () => {
            console.log('⚠️ WebSocket Disconnected');
        });

        return () => {
            socket.disconnect();
        };
    }, [queryClient]);

    return <>{children}</>;
}
