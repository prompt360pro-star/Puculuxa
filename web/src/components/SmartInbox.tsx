import React from 'react';
import {
    AlertCircle,
    ArrowUpRight,
    Clock,
    DollarSign,
    ChevronRight
} from 'lucide-react';
import { Card } from './ui/Card';
import { Badge } from './ui/Badge';

interface Alert {
    id: string;
    type: 'sales' | 'ops' | 'finance' | 'feedback';
    title: string;
    description: string;
    priority: 'high' | 'medium' | 'low';
    actionLabel: string;
}

const alerts: Alert[] = [
    {
        id: '1',
        type: 'sales',
        title: 'Oportunidade: Casamento VIP',
        description: 'Orçamento de Kz 25k (85% de conversão). Expira em 4h.',
        priority: 'high',
        actionLabel: 'FECHAR CONTRATO'
    },
    {
        id: '2',
        type: 'ops',
        title: 'Estoque Crítico: Farinha Especial',
        description: 'Suprimento atual atende apenas as próximas 48h de produção.',
        priority: 'high',
        actionLabel: 'GERAR PEDIDO'
    },
    {
        id: '3',
        type: 'feedback',
        title: 'Atenção à Experiência',
        description: 'Cliente "Maria Silva" avaliou com 3 estrelas. Requer follow-up.',
        priority: 'medium',
        actionLabel: 'SABER MAIS'
    }
];

export const SmartInbox: React.FC = () => {
    return (
        <Card className="p-0 overflow-hidden border-puculuxa-orange/20 shadow-xl shadow-puculuxa-orange/5 bg-bg-card transition-colors duration-300">
            <div className="p-6 border-b border-border-main flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/20">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-puculuxa-orange/10 rounded-xl flex items-center justify-center text-puculuxa-orange">
                        <AlertCircle size={24} />
                    </div>
                    <div>
                        <h3 className="text-xl font-black text-text-primary tracking-tight">Fila de Decisões</h3>
                        <p className="text-sm text-text-secondary font-medium">Prioridades do Dia</p>
                    </div>
                </div>
                <Badge variant="danger" className="animate-pulse">3 PENDENTES</Badge>
            </div>

            <div className="divide-y divide-border-main bg-bg-card">
                {alerts.map((alert) => (
                    <div key={alert.id} className="p-6 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group relative cursor-pointer">
                        <div className="flex gap-4">
                            <div className={`mt-1 w-2 h-2 rounded-full shrink-0 ${alert.priority === 'high' ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.4)]' : 'bg-amber-500'
                                }`} />

                            <div className="flex-1 space-y-1">
                                <div className="flex items-center justify-between">
                                    <h4 className="font-bold text-text-primary flex items-center gap-2">
                                        {alert.title}
                                        {alert.type === 'sales' && <DollarSign size={14} className="text-puculuxa-olive" />}
                                    </h4>
                                    <span className="text-[10px] font-black text-text-secondary uppercase tracking-widest flex items-center gap-1">
                                        <Clock size={10} />
                                        {alert.priority === 'high' ? 'IMEDIATO' : 'HOJE'}
                                    </span>
                                </div>
                                <p className="text-sm text-text-secondary leading-relaxed font-medium pr-8">
                                    {alert.description}
                                </p>
                                <div className="pt-3 flex items-center gap-3">
                                    <button className="text-xs font-black text-puculuxa-orange hover:text-puculuxa-gold transition-colors flex items-center gap-1 uppercase tracking-wider">
                                        {alert.actionLabel}
                                        <ArrowUpRight size={14} />
                                    </button>
                                </div>
                            </div>
                        </div>
                        <ChevronRight className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-300 group-hover:text-puculuxa-orange group-hover:translate-x-1 transition-all" size={20} />
                    </div>
                ))}
            </div>

            <div className="p-4 bg-bg-card border-t border-border-main text-center">
                <button className="text-xs font-bold text-text-secondary hover:text-puculuxa-orange transition-colors uppercase tracking-widest">
                    Ver todas as decisões pendentes
                </button>
            </div>
        </Card>
    );
};
