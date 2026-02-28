'use client';
/* Stats Page - Puculuxa Admin */

import React, { useState } from 'react';
import { TrendingUp, TrendingDown, DollarSign, ShoppingBag, Users, Star, BarChart3, PieChart } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart as RechartsPieChart,
    Pie,
    Cell
} from 'recharts';
import { useQuery } from '@tanstack/react-query';
import { DashboardService } from '@/services/dashboardService';

const COLORS = ['#f97316', '#84cc16', '#3b82f6', '#a855f7', '#ec4899', '#14b8a6', '#f59e0b'];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-700 shadow-xl">
                <p className="font-bold text-slate-800 dark:text-slate-200 mb-2">{label}</p>
                <div className="space-y-1">
                    <p className="text-orange-500 font-medium">
                        Receita: Kz {payload[0].value.toLocaleString('pt-BR')}
                    </p>
                    {payload[1] && (
                        <p className="text-blue-500 font-medium">
                            Pedidos: {payload[1].value}
                        </p>
                    )}
                </div>
            </div>
        );
    }
    return null;
};

export default function StatsPage() {
    const [activeIndex, setActiveIndex] = useState(0);

    const { data: dashboardData, isLoading } = useQuery({
        queryKey: ['dashboard'],
        queryFn: () => DashboardService.getAll()
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const onPieEnter = (_: any, index: number) => {
        setActiveIndex(index);
    };

    if (isLoading) {
        return <div className="p-8 flex items-center justify-center p-20 animate-pulse">A carregar dados do Analytics...</div>;
    }

    const { stats } = dashboardData || {};

    // Map colors to category data dynamically
    const categoryData = (stats?.categoryData || []).map((cat, i) => ({
        ...cat,
        color: COLORS[i % COLORS.length]
    }));

    const monthlyData = stats?.revenueByMonth || [];

    return (
        <div className="space-y-8 animate-fade-in-up">
            {/* Top KPI Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
                {[
                    { label: 'Receita Total', value: stats?.revenue || 'Kz 0', change: '+12.5%', up: true, icon: DollarSign, accent: 'text-orange-500 bg-orange-500/10' },
                    { label: 'Total Pedidos', value: stats?.counters?.orders?.toString() || '0', change: '+8.2%', up: true, icon: ShoppingBag, accent: 'text-blue-500 bg-blue-500/10' },
                    { label: 'Total Clientes', value: stats?.counters?.users?.toString() || '0', change: '+23%', up: true, icon: Users, accent: 'text-lime-500 bg-lime-500/10' },
                    { label: 'NPS Médio', value: `${stats?.averageRating || '0'}/ 5`, change: '-0.1', up: false, icon: Star, accent: 'text-yellow-500 bg-yellow-500/10' },
                ].map((kpi, i) => (
                    <Card key={i} className="p-6 group hover:-translate-y-1 transition-all duration-300">
                        <div className="flex items-center justify-between mb-4">
                            <div className={`p-3 rounded-2xl ${kpi.accent} group-hover:scale-110 transition-transform duration-500`}>
                                <kpi.icon size={22} />
                            </div>
                            <Badge variant={kpi.up ? 'success' : 'danger'} className="flex items-center gap-1">
                                {kpi.up ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                                {kpi.change}
                            </Badge>
                        </div>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest">{kpi.label}</p>
                        <h3 className="text-3xl font-black text-slate-800 dark:text-slate-100 tracking-tight mt-1">{kpi.value}</h3>
                    </Card>
                ))}
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                {/* Revenue Interactive Area Chart */}
                <Card className="xl:col-span-2 p-8 h-[400px] flex flex-col">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-1">
                                <BarChart3 size={14} />
                                Receita Mensal
                            </div>
                            <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">Evolução Anual 2026</h3>
                        </div>
                        <div className="flex gap-4 text-xs">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-orange-500" />
                                <span className="text-slate-500 dark:text-slate-400 font-bold">Receita (Kz)</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 w-full relative min-h-0">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={monthlyData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#f97316" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" strokeOpacity={0.5} />
                                <XAxis
                                    dataKey="month"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#64748b', fontSize: 12 }}
                                    dy={10}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#64748b', fontSize: 12 }}
                                    tickFormatter={(value) => `${value / 1000}k`}
                                    dx={-10}
                                />
                                <Tooltip content={<CustomTooltip />} />
                                <Area
                                    type="monotone"
                                    dataKey="total"
                                    stroke="#f97316"
                                    strokeWidth={3}
                                    fillOpacity={1}
                                    fill="url(#colorRevenue)"
                                    activeDot={{ r: 6, strokeWidth: 0, fill: '#f97316' }}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </Card>

                {/* Interactive Donut Chart for Categories */}
                <Card className="p-8 h-[400px] flex flex-col">
                    <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-1">
                        <PieChart size={14} />
                        Por Categoria
                    </div>
                    <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2">Distribuição de Vendas</h3>

                    <div className="flex-1 w-full relative min-h-0 -mt-4">
                        <ResponsiveContainer width="100%" height="100%">
                            <RechartsPieChart>
                                <Pie
                                    data={categoryData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={70}
                                    outerRadius={90}
                                    paddingAngle={5}
                                    dataKey="value"
                                    onMouseEnter={onPieEnter}
                                    stroke="none"
                                >
                                    {categoryData.map((entry: { color: string }, index: number) => (
                                        <Cell
                                            key={`cell-${index}`}
                                            fill={entry.color}
                                            opacity={activeIndex === index ? 1 : 0.6}
                                            style={{ transition: 'all 0.3s ease' }}
                                        />
                                    ))}
                                </Pie>
                                <Tooltip
                                    formatter={(value: number | undefined) => [`Kz ${(value || 0).toLocaleString('pt-BR')}`, 'Vendas']}
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                                />
                            </RechartsPieChart>
                        </ResponsiveContainer>

                        {/* Center Text */}
                        {categoryData.length > 0 && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none mt-4">
                                <span className="text-3xl font-black text-slate-800 dark:text-slate-100">
                                    {Math.round((categoryData[activeIndex]?.value || 0) / categoryData.reduce((acc, curr) => acc + curr.value, 0) * 100)}%
                                </span>
                                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 w-24 text-center line-clamp-1">
                                    {categoryData[activeIndex]?.name}
                                </span>
                            </div>
                        )}
                    </div>
                </Card>
            </div>
        </div>
    );
}
