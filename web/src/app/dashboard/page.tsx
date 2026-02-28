import React from 'react';
import Link from 'next/link';
import {
    Users,
    ArrowRight,
    Star,
    TrendingUp,
    Zap,
    Target,
    BarChart3,
    FileText,
    ChefHat
} from 'lucide-react';
import { DashboardService, DashboardStats, RecentOrder } from '@/services/dashboardService';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import dynamic from 'next/dynamic';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const DashboardHeader = dynamic(() => import('@/components/DashboardHeader').then((mod) => mod.DashboardHeader as any), {
    loading: () => <div className="h-20 bg-slate-100 dark:bg-slate-800 animate-pulse rounded-2xl mb-8"></div>
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const SmartInbox = dynamic(() => import('@/components/SmartInbox').then((mod) => mod.SmartInbox as any), {
    loading: () => <div className="h-64 bg-slate-100 dark:bg-slate-800 animate-pulse rounded-3xl"></div>
});

import { cookies } from 'next/headers';

export default async function DashboardPage() {
    const cookieStore = await cookies();
    const token = cookieStore.get('puculuxa_token')?.value;

    let stats: DashboardStats | null = null;
    let orders: RecentOrder[] = [];

    try {
        const dashboardData = await DashboardService.getAll(token);
        stats = dashboardData.stats;
        orders = dashboardData.orders;
    } catch (error) {
        console.error("Failed to load dashboard data:", error);
    }

    if (!stats) {
        return (
            <div className="p-8 flex items-center justify-center h-[50vh]">
                <p className="text-text-secondary">Erro ao carregar dados do dashboard. Verifique sua conexão.</p>
            </div>
        );
    }

    return (
        <div className="p-8 space-y-10 animate-fade-in-up transition-colors duration-300">
            {/* Executive Header (Client Component) */}
            <DashboardHeader />

            {/* 1. Indicadores-Chave (Bento Grid Premium) */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">

                {/* Cartão de Vendas (Grande) — links para Stats */}
                <Link href="/dashboard/stats" className="col-span-1 md:col-span-2 p-8 border-l-4 border-l-puculuxa-orange bg-bg-card hover:bg-white dark:hover:bg-slate-800/80 hover:shadow-2xl hover:shadow-puculuxa-orange/20 transition-all group duration-500 rounded-2xl block border border-border-main cursor-pointer">
                    <div className="flex items-center justify-between mb-8">
                        <div className="p-4 bg-gradient-to-br from-puculuxa-orange/20 to-puculuxa-gold/20 text-puculuxa-orange rounded-[2rem] group-hover:scale-110 shadow-sm transition-transform duration-500">
                            <Target size={32} strokeWidth={2.5} />
                        </div>
                        <Badge variant="success" className="bg-gradient-to-r from-green-500/10 to-green-400/10 text-green-500 border-green-500/20 px-4 py-1">
                            🚀 {stats.conversionRate} sobre a meta
                        </Badge>
                    </div>
                    <div>
                        <p className="text-text-secondary font-bold text-xs tracking-[0.2em] uppercase">Receita Bruta Mensal</p>
                        <h3 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-text-primary to-text-secondary mt-2 tracking-tighter">{stats.revenue}</h3>
                    </div>
                    <div className="mt-8 h-2.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-puculuxa-orange to-puculuxa-gold w-[82%] rounded-full shadow-glow" />
                    </div>
                    <p className="text-[11px] text-text-secondary mt-4 font-bold flex items-center gap-2">
                        <TrendingUp size={16} className="text-puculuxa-olive" />
                        PREVISÃO DE FECHAMENTO: Kz 165.000
                    </p>
                </Link>

                {/* Cartão de Satisfação — links para Reviews */}
                <Link href="/dashboard/reviews" className="col-span-1 p-8 border-l-4 border-l-puculuxa-olive bg-bg-card hover:bg-white dark:hover:bg-slate-800/80 hover:shadow-2xl hover:shadow-puculuxa-olive/20 transition-all group duration-500 rounded-2xl block border border-border-main cursor-pointer">
                    <div className="flex items-center justify-between mb-8">
                        <div className="p-4 bg-gradient-to-br from-puculuxa-olive/20 to-green-500/10 text-puculuxa-olive rounded-[2rem] group-hover:scale-110 shadow-sm transition-transform duration-500">
                            <Users size={28} strokeWidth={2.5} />
                        </div>
                    </div>
                    <p className="text-text-secondary font-bold text-xs uppercase tracking-widest leading-none">NPS Score</p>
                    <div className="flex items-baseline gap-2 mt-4">
                        <h3 className="text-5xl font-black text-text-primary tracking-tighter">{stats.averageRating}</h3>
                        <span className="text-xl text-text-secondary font-bold">/ 5.0</span>
                    </div>
                    <div className="mt-8 flex gap-1.5 items-end h-10 w-full opacity-80 group-hover:opacity-100 transition-opacity">
                        {[4, 6, 8, 5, 9, 7, 10].map((h, i) => {
                            const heightMap: { [key: number]: string } = { 4: 'h-[40%]', 6: 'h-[60%]', 8: 'h-[80%]', 5: 'h-[50%]', 9: 'h-[90%]', 7: 'h-[70%]', 10: 'h-[100%]' };
                            return <div key={i} className={`flex-1 bg-gradient-to-t from-puculuxa-olive/20 to-puculuxa-olive/40 rounded-t-md group-hover:from-puculuxa-olive/40 group-hover:to-puculuxa-olive transition-all duration-500 ${heightMap[h]} delay-${i * 75}`} />;
                        })}
                    </div>
                    <p className="text-[11px] text-text-secondary mt-4 font-bold flex items-center gap-2 uppercase tracking-widest leading-none">
                        <Star size={14} fill="currentColor" className="text-puculuxa-gold animate-pulse-soft" />
                        {stats.feedbacks} Avaliações
                    </p>
                </Link>

                {/* Cartões Pequenos Empilhados */}
                <div className="col-span-1 flex flex-col gap-6">
                    <Link href="/dashboard/quotations" className="flex-1 p-6 flex flex-col justify-center bg-gradient-to-br from-slate-50 to-white dark:from-slate-800/50 dark:to-slate-900/50 hover:shadow-xl hover:-translate-y-1 transition-all group rounded-2xl border border-border-main block cursor-pointer">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-2xl bg-blue-500/10 text-blue-500 flex items-center justify-center group-hover:rotate-12 transition-transform">
                                <FileText size={24} />
                            </div>
                            <div>
                                <p className="text-[10px] text-text-secondary font-bold uppercase tracking-widest">Novos Orçamentos</p>
                                <h4 className="text-3xl font-black text-text-primary tracking-tight mt-1">{stats.newQuotes}</h4>
                            </div>
                        </div>
                    </Link>

                    <Link href="/dashboard/orders" className="flex-1 p-6 flex flex-col justify-center bg-gradient-to-br from-slate-50 to-white dark:from-slate-800/50 dark:to-slate-900/50 hover:shadow-xl hover:-translate-y-1 transition-all group rounded-2xl border border-border-main block cursor-pointer">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-2xl bg-puculuxa-orange/10 text-puculuxa-orange flex items-center justify-center group-hover:-rotate-12 transition-transform">
                                <ChefHat size={24} />
                            </div>
                            <div>
                                <p className="text-[10px] text-text-secondary font-bold uppercase tracking-widest">Em Produção</p>
                                <h4 className="text-3xl font-black text-text-primary tracking-tight mt-1">{stats.inProduction}</h4>
                            </div>
                        </div>
                    </Link>
                </div>
            </div>

            {/* 2. Alertas e Ações Prioritárias */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                <div className="xl:col-span-2">
                    <SmartInbox />
                </div>

                {/* 3. Projeções e Riscos */}
                <div className="xl:col-span-1">
                    <Card className="p-8 bg-slate-900 text-white border-0 shadow-2xl relative overflow-hidden group h-full">
                        <div className="absolute -right-10 -bottom-10 opacity-5 group-hover:opacity-10 transition-opacity">
                            <BarChart3 size={200} />
                        </div>
                        <div className="relative z-10 h-full flex flex-col">
                            <div className="flex items-center gap-2 text-puculuxa-gold font-black text-[10px] tracking-widest uppercase mb-4">
                                <Zap size={14} fill="currentColor" />
                                Previsão de Demanda
                            </div>
                            <h3 className="text-2xl font-black mb-2 leading-tight">Pico em 15 de Jan</h3>
                            <p className="text-slate-400 font-medium mb-8 text-sm leading-relaxed">
                                Demanda prevista em **+20%**. Ação recomendada: reforçar estoque de insumos críticos.
                            </p>

                            <div className="space-y-4 mb-8 mt-auto">
                                <div className="flex items-center justify-between text-xs">
                                    <span className="text-slate-400 font-bold uppercase tracking-widest">Capacidade Operacional</span>
                                    <span className="font-mono text-puculuxa-gold">92% (CRÍTICA)</span>
                                </div>
                                <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                                    <div className="h-full bg-red-500 w-[92%] rounded-full shadow-[0_0_12px_rgba(239,68,68,0.5)]" />
                                </div>
                            </div>

                            <Button className="w-full bg-white text-slate-900 hover:bg-puculuxa-gold border-0 h-12 font-black tracking-widest uppercase text-xs">
                                REOTIMIZAR ESCALA
                            </Button>
                        </div>
                    </Card>
                </div>
            </div>

            {/* 4. Clientes Estratégicos */}
            <div className="pb-10">
                <Card className="p-0 overflow-hidden flex flex-col bg-bg-card border-border-main shadow-sm">
                    <div className="p-8 border-b border-border-main flex justify-between items-center bg-slate-50/30 dark:bg-slate-800/20">
                        <div>
                            <h3 className="text-2xl font-bold text-text-primary tracking-tight">Carteira Prioritária</h3>
                            <p className="text-sm text-text-secondary font-medium">Contatos sugeridos para follow-up e retenção</p>
                        </div>
                        <button className="px-4 py-2 bg-bg-card border border-border-main rounded-lg text-xs font-black text-text-secondary hover:text-puculuxa-orange hover:border-puculuxa-orange transition-all uppercase tracking-widest">
                            Gerais de Clientes
                        </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 divide-x divide-border-main">
                        {orders.slice(0, 3).map((order: RecentOrder, i: number) => (
                            <div key={i} className="p-8 flex flex-col hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors group cursor-pointer relative">
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center font-black text-text-secondary group-hover:bg-puculuxa-orange/10 group-hover:text-puculuxa-orange transition-colors">
                                        {order.customer.charAt(0)}
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-text-primary leading-none">{order.customer}</h4>
                                        <p className="text-[10px] text-text-secondary font-bold uppercase tracking-widest mt-2 px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded-full inline-block">Score: 9.8 • VIP DIAMANTE</p>
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-sm font-black text-text-primary">{order.total}</p>
                                    <p className="text-[10px] text-puculuxa-olive font-bold uppercase tracking-wide">Potencial de Recompra: ALTO</p>
                                </div>
                                <ArrowRight size={16} className="absolute right-8 bottom-8 text-text-secondary group-hover:text-puculuxa-orange transition-colors" />
                            </div>
                        ))}
                    </div>
                </Card>
            </div>
        </div>
    );
}

