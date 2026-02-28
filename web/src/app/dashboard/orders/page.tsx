'use client';

import React, { useState } from 'react';
import { Clock, CheckCircle, ChefHat, PackageCheck, Truck, XCircle, Search, Filter, X, Eye } from 'lucide-react';
import { OrderWebService } from '@/services/orderService';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Order } from '@/types';

const COLUMNS = [
    { id: 'PENDING', title: 'Aguardando', icon: Clock, color: 'bg-yellow-500' },
    { id: 'APPROVED', title: 'Aprovados', icon: CheckCircle, color: 'bg-blue-500' },
    { id: 'PRODUCING', title: 'Em Produção', icon: ChefHat, color: 'bg-puculuxa-orange' },
    { id: 'READY', title: 'Prontos', icon: PackageCheck, color: 'bg-puculuxa-lime' },
    { id: 'DELIVERED', title: 'Entregues', icon: Truck, color: 'bg-green-600' },
    { id: 'CANCELLED', title: 'Cancelados', icon: XCircle, color: 'bg-red-500' },
];

export default function OrdersPage() {
    const queryClient = useQueryClient();
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [draggedOrderId, setDraggedOrderId] = useState<string | null>(null);
    const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);

    // Replaces useEffect + manual state
    const { data: orders = [], isLoading } = useQuery<Order[]>({
        queryKey: ['orders'],
        queryFn: () => OrderWebService.getAll(),
    });

    const filteredOrders = orders.filter(
        (o) =>
            o.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            o.id.includes(searchTerm)
    );

    // Replaces blocking mutating sequences and triggers background refetch or optimistic upgrade
    const updateStatusMutation = useMutation({
        mutationFn: ({ id, newStatus }: { id: string; newStatus: string }) =>
            OrderWebService.updateStatus(id, newStatus),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['orders'] });
        },
    });

    const handleStatusUpdate = (id: string, newStatus: string) => {
        updateStatusMutation.mutate({ id, newStatus });
    };

    if (isLoading) {
        return (
            <div className="p-8 h-screen flex flex-col">
                <div className="h-16 w-64 bg-slate-200 dark:bg-slate-800 rounded-2xl animate-pulse mb-12" />
                <div className="flex-1 flex gap-6">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="min-w-[300px] flex-1 flex flex-col bg-slate-100 dark:bg-slate-800/30 rounded-3xl p-4">
                            <div className="flex items-center gap-3 mb-6 px-2">
                                <div className="w-10 h-10 rounded-xl bg-slate-200 dark:bg-slate-700 animate-pulse" />
                                <div className="h-4 w-20 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
                            </div>
                            <div className="space-y-4">
                                {[1, 2].map(j => (
                                    <div key={j} className="bg-bg-card p-6 rounded-2xl border border-border-main">
                                        <div className="h-3 w-12 bg-slate-200 dark:bg-slate-700 rounded animate-pulse mb-3" />
                                        <div className="h-5 w-32 bg-slate-200 dark:bg-slate-700 rounded animate-pulse mb-2" />
                                        <div className="h-4 w-24 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="p-8 h-screen flex flex-col transition-colors duration-300">
            <header className="mb-12 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-text-primary">Gestão de Pedidos</h1>
                    <p className="text-text-secondary">Acompanhe e mova os pedidos pelo processo produtivo.</p>
                </div>

                <div className="flex bg-bg-card p-2 rounded-xl border border-border-main items-center gap-2 max-w-sm w-full">
                    <Search size={20} className="text-text-secondary ml-2" />
                    <input
                        type="text"
                        placeholder="Pesquisar pedido ou cliente..."
                        className="bg-transparent outline-none text-sm text-text-primary flex-1"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </header>

            <div className="flex-1 flex gap-6 overflow-x-auto pb-8">
                {COLUMNS.map((col) => {
                    const columnOrders = filteredOrders.filter(o => o.status === col.id);
                    return (
                        <div
                            key={col.id}
                            onDragOver={(e) => {
                                e.preventDefault();
                                setDragOverColumn(col.id);
                            }}
                            onDragLeave={() => setDragOverColumn(null)}
                            onDrop={(e) => {
                                e.preventDefault();
                                const orderId = e.dataTransfer.getData('text/plain');
                                if (orderId && orderId === draggedOrderId && col.id !== orders.find(o => o.id === orderId)?.status) {
                                    handleStatusUpdate(orderId, col.id);
                                }
                                setDraggedOrderId(null);
                                setDragOverColumn(null);
                            }}
                            className={`min-w-[300px] flex-1 flex flex-col bg-bg-card/50 dark:bg-slate-900/30 rounded-3xl p-4 border transition-all ${dragOverColumn === col.id ? 'border-puculuxa-orange ring-2 ring-puculuxa-orange/20 bg-puculuxa-orange/5' : 'border-border-main'
                                }`}
                        >
                            <div className="flex items-center gap-3 mb-6 px-2">
                                <div className={`${col.color} p-2 rounded-xl text-white shadow-sm`}>
                                    <col.icon size={20} />
                                </div>
                                <h3 className="font-bold text-text-primary">{col.title}</h3>
                                <span className="ml-auto bg-bg-card px-2 py-0.5 rounded-full text-[10px] font-bold border border-border-main text-text-secondary">
                                    {columnOrders.length}
                                </span>
                            </div>

                            <div className="space-y-4 flex-1">
                                {columnOrders.map(order => (
                                    <div
                                        key={order.id}
                                        draggable
                                        onDragStart={(e) => {
                                            setDraggedOrderId(order.id);
                                            e.dataTransfer.setData('text/plain', order.id);
                                        }}
                                        onDragEnd={() => {
                                            setDraggedOrderId(null);
                                            setDragOverColumn(null);
                                        }}
                                        className={`bg-bg-card p-6 rounded-2xl shadow-sm border border-border-main group transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 hover:border-puculuxa-orange/20 relative cursor-grab active:cursor-grabbing ${draggedOrderId === order.id ? 'opacity-50 scale-95 border-puculuxa-orange/50 shadow-none' : ''
                                            }`}
                                    >

                                        {/* Eye view details button (visible on hover) */}
                                        <button
                                            onClick={() => setSelectedOrder(order)}
                                            className="absolute top-4 right-4 bg-slate-100 dark:bg-slate-800 p-2 rounded-xl text-text-secondary opacity-0 group-hover:opacity-100 transition-opacity hover:text-puculuxa-orange"
                                        >
                                            <Eye size={16} />
                                        </button>

                                        <div className="flex justify-between items-start mb-4">
                                            <span className="text-[10px] font-bold text-text-secondary bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">#{order.id.slice(-4)}</span>
                                            <span className="font-black text-puculuxa-orange text-lg mr-8">Kz {order.total?.toFixed(2)}</span>
                                        </div>
                                        <div className="flex items-center gap-3 mb-3">
                                            <div className="w-8 h-8 rounded-full bg-puculuxa-orange/10 flex items-center justify-center text-puculuxa-orange font-bold text-xs">
                                                {order.customerName?.charAt(0) || '?'}
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-text-primary text-sm leading-tight">{order.customerName}</h4>
                                                <p className="text-xs text-text-secondary">{order.eventType}</p>
                                            </div>
                                        </div>

                                        <div className="flex gap-2 pt-4 border-t border-border-main overflow-x-auto">
                                            {COLUMNS.filter(c => c.id !== order.status).map(statusCol => (
                                                <button
                                                    key={statusCol.id}
                                                    onClick={() => handleStatusUpdate(order.id, statusCol.id)}
                                                    className="bg-slate-50 dark:bg-slate-800 hover:bg-puculuxa-orange/10 px-3 py-1.5 rounded-lg text-[9px] font-bold text-text-secondary hover:text-puculuxa-orange transition-all border border-border-main hover:border-puculuxa-orange/30"
                                                    title={`Mover para ${statusCol.title}`}
                                                >
                                                    {statusCol.title}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Order Details Modal */}
            {selectedOrder && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex justify-center items-center p-4">
                    <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl animate-fade-in-up border border-slate-200 dark:border-slate-800">
                        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
                            <div>
                                <h3 className="font-bold text-xl text-slate-800 dark:text-slate-100 flex items-center gap-2">
                                    Pedido #{selectedOrder.id.substring(0, 8)}
                                </h3>
                                <p className="text-slate-500 text-sm">{new Date(selectedOrder.createdAt).toLocaleString('pt-BR')}</p>
                            </div>
                            <button onClick={() => setSelectedOrder(null)} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors text-slate-500">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-8 space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-1">Cliente</p>
                                    <p className="font-semibold text-slate-800 dark:text-slate-200">{selectedOrder.customerName}</p>
                                </div>
                                <div>
                                    <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-1">Status</p>
                                    <span className="bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full text-xs font-bold text-slate-700 dark:text-slate-300">
                                        {COLUMNS.find(c => c.id === selectedOrder.status)?.title}
                                    </span>
                                </div>
                            </div>

                            <div>
                                <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-1">Tipo de Evento</p>
                                <p className="font-semibold text-slate-800 dark:text-slate-200 bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400 px-4 py-3 rounded-xl inline-block border border-orange-100 dark:border-orange-500/20">
                                    {selectedOrder.eventType}
                                </p>
                            </div>

                            <div className="border-t border-slate-100 dark:border-slate-800 pt-6">
                                <div className="flex justify-between items-center">
                                    <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">Total do Pedido</p>
                                    <p className="text-3xl font-black text-puculuxa-orange">
                                        Kz {selectedOrder.total.toLocaleString('pt-BR')}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
