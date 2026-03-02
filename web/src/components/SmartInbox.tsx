'use client';

import React from 'react';
import {
    AlertTriangle,
    ArrowUpRight,
    Clock,
    CheckCircle,
    ChevronRight,
    Search
} from 'lucide-react';
import { Card } from './ui/Card';
import { Badge } from './ui/Badge';
import { DashboardRealData } from '@/services/dashboardService';
import { useRouter } from 'next/navigation';

interface SmartInboxProps {
    actionItems: DashboardRealData['actionItems'];
}

export const SmartInbox: React.FC<SmartInboxProps> = ({ actionItems }) => {
    const router = useRouter();

    const { expiringIn24h, slaBreached, pendingReview, awaitingResponse } = actionItems;

    const totalUrgent = expiringIn24h.length + slaBreached.length;

    const handleAction = (id: string) => {
        router.push(`/dashboard/quotations/${id}`);
    };

    return (
        <Card className="p-0 overflow-hidden border-puculuxa-orange/20 shadow-xl shadow-puculuxa-orange/5 bg-bg-card transition-colors duration-300">
            <div className="p-6 border-b border-border-main flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/20">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-puculuxa-orange/10 rounded-xl flex items-center justify-center text-puculuxa-orange">
                        <AlertTriangle size={24} />
                    </div>
                    <div>
                        <h3 className="text-xl font-black text-text-primary tracking-tight">Fila de Decisões</h3>
                        <p className="text-sm text-text-secondary font-medium">Prioridades do Dia (SLA em Risco)</p>
                    </div>
                </div>
                {totalUrgent > 0 && (
                    <Badge variant="danger" className="animate-pulse">{totalUrgent} URGENTES</Badge>
                )}
            </div>

            <div className="divide-y divide-border-main bg-bg-card max-h-[400px] overflow-y-auto">
                {totalUrgent === 0 ? (
                    <div className="p-12 flex flex-col items-center justify-center text-center">
                        <CheckCircle size={48} className="text-emerald-500 mb-4 opacity-80" />
                        <h4 className="text-lg font-bold text-text-primary">Tudo em dia!</h4>
                        <p className="text-sm text-text-secondary mt-1">Nenhum orçamento em risco de SLA.</p>
                    </div>
                ) : (
                    <>
                        {slaBreached.map((item) => (
                            <div key={item.id} onClick={() => handleAction(item.id)} className="p-6 bg-red-50 dark:bg-red-500/5 hover:bg-red-100 dark:hover:bg-red-500/10 border-l-4 border-l-red-500 transition-colors group relative cursor-pointer">
                                <div className="flex gap-4">
                                    <div className="mt-1 w-2 h-2 rounded-full shrink-0 bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.4)]" />
                                    <div className="flex-1 space-y-1">
                                        <div className="flex items-center justify-between">
                                            <h4 className="font-bold text-text-primary flex items-center gap-2">
                                                {item.customerName ? `${item.eventType} de ${item.customerName}` : item.eventType}
                                            </h4>
                                            <span className="text-[10px] font-black text-red-600 bg-red-100 dark:bg-red-500/20 dark:text-red-400 px-2 py-0.5 rounded uppercase tracking-widest flex items-center gap-1">
                                                <AlertTriangle size={10} />
                                                SLA EXPIRADO
                                            </span>
                                        </div>
                                        <p className="text-sm text-text-secondary leading-relaxed font-medium pr-8">
                                            O limite de resposta ({new Date(item.slaDeadline).toLocaleString('pt-BR')}) já foi ultrapassado.
                                        </p>
                                        <div className="pt-3 flex items-center gap-3">
                                            <button className="text-xs font-black text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-colors flex items-center gap-1 uppercase tracking-wider focus:outline-none">
                                                RESPONDER IMEDIATAMENTE
                                                <ArrowUpRight size={14} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                                <ChevronRight className="absolute right-6 top-1/2 -translate-y-1/2 text-red-300 group-hover:text-red-500 group-hover:translate-x-1 transition-all" size={20} />
                            </div>
                        ))}

                        {expiringIn24h.map((item) => (
                            <div key={item.id} onClick={() => handleAction(item.id)} className="p-6 hover:bg-amber-50 dark:hover:bg-amber-500/5 border-l-4 border-l-amber-400 transition-colors group relative cursor-pointer">
                                <div className="flex gap-4">
                                    <div className="mt-1 w-2 h-2 rounded-full shrink-0 bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.4)]" />
                                    <div className="flex-1 space-y-1">
                                        <div className="flex items-center justify-between">
                                            <h4 className="font-bold text-text-primary flex items-center gap-2">
                                                {item.customerName ? `${item.eventType} de ${item.customerName}` : item.eventType}
                                            </h4>
                                            <span className="text-[10px] font-black text-amber-600 bg-amber-100 dark:bg-amber-500/20 dark:text-amber-400 px-2 py-0.5 rounded uppercase tracking-widest flex items-center gap-1">
                                                <Clock size={10} />
                                                EXPIRA EM BREVE
                                            </span>
                                        </div>
                                        <p className="text-sm text-text-secondary leading-relaxed font-medium pr-8">
                                            Expira em {new Date(item.slaDeadline).toLocaleString('pt-BR')}.
                                        </p>
                                        <div className="pt-3 flex items-center gap-3">
                                            <button className="text-xs font-black text-amber-600 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300 transition-colors flex items-center gap-1 uppercase tracking-wider focus:outline-none">
                                                VER ORÇAMENTO
                                                <ArrowUpRight size={14} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                                <ChevronRight className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-300 group-hover:text-amber-500 group-hover:translate-x-1 transition-all" size={20} />
                            </div>
                        ))}
                    </>
                )}
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-800/20 border-t border-border-main flex justify-between items-center text-xs font-medium text-text-secondary">
                <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1.5"><Search size={14} className="text-puculuxa-olive" /> {pendingReview} aguardam análise</span>
                    <span className="flex items-center gap-1.5"><Clock size={14} className="text-puculuxa-orange" /> {awaitingResponse} aguardam resposta</span>
                </div>
            </div>
        </Card>
    );
};
