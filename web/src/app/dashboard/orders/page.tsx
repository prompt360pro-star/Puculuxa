'use client';

import React, { useEffect, useState } from 'react';
import { Clock, CheckCircle, ChefHat, PackageCheck, Loader2 } from 'lucide-react';
import { OrderWebService } from '@/services/orderService';
import { Order } from '@/types';

const COLUMNS = [
    { id: 'PENDING', title: 'Aguardando', icon: Clock, color: 'bg-yellow-500' },
    { id: 'APPROVED', title: 'Aprovados', icon: CheckCircle, color: 'bg-blue-500' },
    { id: 'PRODUCING', title: 'Em Produção', icon: ChefHat, color: 'bg-puculuxa-orange' },
    { id: 'READY', title: 'Prontos', icon: PackageCheck, color: 'bg-puculuxa-lime' },
];

export default function OrdersPage() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadOrders = async () => {
            // setLoading(true); // Initial state covers first load.
            const data = await OrderWebService.getAll();
            setOrders(data);
            setLoading(false);
        };
        loadOrders();
    }, []);



    const handleStatusUpdate = async (id: string, newStatus: string) => {
        setLoading(true);
        await OrderWebService.updateStatus(id, newStatus);
        const data = await OrderWebService.getAll();
        setOrders(data);
        setLoading(false);
    };

    if (loading) {
        return (
            <div className="p-8 flex items-center justify-center h-screen">
                <Loader2 className="animate-spin text-primary w-12 h-12" />
            </div>
        );
    }

    return (
        <div className="p-8 h-screen flex flex-col transition-colors duration-300">
            <header className="mb-12">
                <h1 className="text-3xl font-bold text-text-primary">Gestão de Pedidos</h1>
                <p className="text-text-secondary">Acompanhe e mova os pedidos pelo processo produtivo.</p>
            </header>

            <div className="flex-1 flex gap-6 overflow-x-auto pb-8">
                {COLUMNS.map((col) => {
                    const columnOrders = orders.filter(o => o.status === col.id);
                    return (
                        <div key={col.id} className="min-w-[300px] flex-1 flex flex-col bg-bg-card/50 dark:bg-slate-900/30 rounded-3xl p-4 border border-border-main">
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
                                    <div key={order.id} className="bg-bg-card p-6 rounded-2xl shadow-sm border border-border-main group transition-all hover:shadow-md">
                                        <div className="flex justify-between items-start mb-4">
                                            <span className="text-[10px] font-bold text-text-secondary opacity-50">#{order.id.slice(-4)}</span>
                                            <span className="font-bold text-puculuxa-orange">Kz {order.total?.toFixed(2)}</span>
                                        </div>
                                        <h4 className="font-bold text-text-primary mb-1">{order.customerName}</h4>
                                        <p className="text-sm text-text-secondary mb-4">{order.eventType}</p>

                                        <div className="flex gap-2 pt-4 border-t border-border-main overflow-x-auto scroller-hidden">
                                            {COLUMNS.filter(c => c.id !== order.status).map(statusCol => (
                                                <button
                                                    key={statusCol.id}
                                                    onClick={() => handleStatusUpdate(order.id, statusCol.id)}
                                                    className="bg-bg-main dark:bg-slate-800 hover:bg-puculuxa-orange/10 px-2 py-1 rounded-lg text-[8px] font-bold text-text-secondary hover:text-puculuxa-orange transition-all border border-border-main"
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
        </div>
    );
}
