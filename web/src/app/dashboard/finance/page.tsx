'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
    TrendingUp,
    AlertCircle,
    Clock,
    DollarSign,
    CreditCard,
    Upload,
    ChevronRight,
    RefreshCw,
    Building2,
    CheckCircle,
    PhoneCall,
} from 'lucide-react';
import { getFinanceData, FinanceDashboardData } from '@/services/financeService';

// ─── Utilities ───
const fmt = (n: number) =>
    new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA', maximumFractionDigits: 0 }).format(n);

const FINANCIAL_STATUS_LABELS: Record<string, string> = {
    UNPAID: 'Por Pagar',
    PARTIALLY_PAID: 'Pago Parcial',
    PAID: 'Pago',
    IN_CREDIT: 'Crédito',
    OVERDUE: 'Em Atraso',
};

const FINANCIAL_STATUS_COLORS: Record<string, string> = {
    UNPAID: 'bg-slate-400',
    PARTIALLY_PAID: 'bg-amber-400',
    PAID: 'bg-emerald-500',
    IN_CREDIT: 'bg-blue-500',
    OVERDUE: 'bg-red-500',
};

const AGING_LABELS: Record<string, string> = {
    '0_7': '0–7 dias',
    '8_30': '8–30 dias',
    '31_60': '31–60 dias',
    '61_plus': '61+ dias',
};

const AGING_COLORS: Record<string, string> = {
    '0_7': 'bg-emerald-500',
    '8_30': 'bg-amber-400',
    '31_60': 'bg-orange-500',
    '61_plus': 'bg-red-600',
};

const PAYMENT_METHOD_LABELS: Record<string, string> = {
    APPYPAY_GPO: 'Multicaixa',
    BANK_TRANSFER: 'Transferência',
    GOVERNMENT_CREDIT: 'Crédito Gov.',
    OTHER: 'Outros',
};

// ─── Sub-components ───
function KpiCard({
    icon: Icon,
    label,
    value,
    sub,
    color,
}: {
    icon: React.ElementType;
    label: string;
    value: string;
    sub?: string;
    color: string;
}) {
    return (
        <div className="relative bg-bg-card/80 backdrop-blur-xl border border-white/10 rounded-3xl p-6 flex flex-col gap-3 overflow-hidden group hover:shadow-elite transition-all duration-300">
            <div className={`absolute -top-6 -right-6 w-24 h-24 rounded-full opacity-10 ${color}`} />
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${color} bg-opacity-20 border border-white/10`}>
                <Icon size={22} className="text-white" />
            </div>
            <div>
                <p className="text-xs text-text-secondary uppercase tracking-widest font-semibold">{label}</p>
                <p className="text-2xl font-black text-text-primary mt-1 leading-tight">{value}</p>
                {sub && <p className="text-xs text-text-secondary mt-1">{sub}</p>}
            </div>
        </div>
    );
}

function BarChart({ data, colorMap, labelMap }: { data: Record<string, number>; colorMap: Record<string, string>; labelMap: Record<string, string> }) {
    const total = Object.values(data).reduce((a, b) => a + b, 0) || 1;
    return (
        <div className="space-y-3">
            {Object.entries(data).map(([key, val]) => (
                <div key={key} className="space-y-1">
                    <div className="flex justify-between text-xs text-text-secondary font-medium">
                        <span>{labelMap[key] ?? key}</span>
                        <span>{val}</span>
                    </div>
                    <div className="h-2 bg-bg-main rounded-full overflow-hidden">
                        <div
                            className={`h-full rounded-full transition-all duration-700 ${colorMap[key] ?? 'bg-slate-400'}`}
                            style={{ width: `${(val / total) * 100}%` }}
                        />
                    </div>
                </div>
            ))}
        </div>
    );
}

function StatusBadge({ status }: { status: string }) {
    const color = status === 'SUCCESS' ? 'text-emerald-500 bg-emerald-500/10'
        : status === 'FAILED' ? 'text-red-500 bg-red-500/10'
            : status === 'AWAITING_PROOF' ? 'text-amber-500 bg-amber-500/10'
                : 'text-blue-500 bg-blue-500/10';
    return (
        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${color}`}>{status}</span>
    );
}

// ─── Main Page ───
export default function FinanceDashboard() {
    const [data, setData] = useState<FinanceDashboardData | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

    const load = async (isRefresh = false) => {
        if (isRefresh) setRefreshing(true);
        else setLoading(true);
        setError(null);
        try {
            const result = await getFinanceData();
            setData(result);
            setLastUpdated(new Date());
        } catch {
            setError('Erro ao carregar dados financeiros. Verifique a sua sessão.');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => { load(); }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96 gap-4">
                <div className="w-8 h-8 border-4 border-puculuxa-orange border-t-transparent rounded-full animate-spin" />
                <span className="text-text-secondary font-medium">A carregar dashboard financeiro…</span>
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="flex flex-col items-center justify-center h-96 gap-4">
                <AlertCircle className="text-red-500" size={40} />
                <p className="text-text-secondary">{error ?? 'Sem dados disponíveis'}</p>
                <button onClick={() => load()} className="px-6 py-2 bg-puculuxa-orange text-white rounded-2xl font-bold hover:opacity-90 transition-opacity">
                    Tentar novamente
                </button>
            </div>
        );
    }

    const { kpis, breakdown, actionItems, recent } = data;
    const totalActionItems = actionItems.awaitingProof.length + actionItems.overdueCredits.length;

    return (
        <div className="space-y-6 pb-10 animate-fade-in-up">
            {/* ─── Header ─── */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black text-text-primary">Dashboard Financeiro</h1>
                    <p className="text-text-secondary text-sm mt-1">
                        Visão CFO em tempo real
                        {lastUpdated && <span className="ml-2 opacity-60">· Atualizado {lastUpdated.toLocaleTimeString('pt-PT')}</span>}
                    </p>
                </div>
                <button
                    onClick={() => load(true)}
                    disabled={refreshing}
                    className="flex items-center gap-2 px-5 py-2.5 bg-bg-card border border-white/10 rounded-2xl text-sm font-semibold text-text-secondary hover:text-text-primary hover:border-puculuxa-orange/30 transition-all"
                >
                    <RefreshCw size={15} className={refreshing ? 'animate-spin' : ''} />
                    Atualizar
                </button>
            </div>

            {/* ─── Links Rápidos ─── */}
            <div className="flex gap-4 mb-2">
                <Link
                    href="/dashboard/finance/reconciliation"
                    className="flex-1 bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-700 border border-indigo-200/50 rounded-2xl p-4 flex items-center justify-between transition-colors"
                >
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-600/20 rounded-lg">
                            <Upload className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="font-bold text-sm">Reconciliação</p>
                            <p className="text-xs opacity-80">Aprovar Transferências Bancárias</p>
                        </div>
                    </div>
                    <ChevronRight className="w-5 h-5 opacity-50" />
                </Link>

                <Link
                    href="/dashboard/finance/followups"
                    className="flex-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 border border-amber-200/50 rounded-2xl p-4 flex items-center justify-between transition-colors"
                >
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-amber-500/20 rounded-lg">
                            <PhoneCall className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="font-bold text-sm">CRM Institucional</p>
                            <p className="text-xs opacity-80">Auditar dívidas B2B e Estado</p>
                        </div>
                    </div>
                    <ChevronRight className="w-5 h-5 opacity-50" />
                </Link>
            </div>

            {/* ─── 4 KPI Cards ─── */}
            <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
                <KpiCard
                    icon={DollarSign}
                    label="Cash do Mês"
                    value={fmt(kpis.cashReceivedThisMonth)}
                    sub={`Total acumulado: ${fmt(kpis.cashReceivedTotal)}`}
                    color="bg-emerald-500"
                />
                <KpiCard
                    icon={TrendingUp}
                    label="A Receber"
                    value={fmt(kpis.receivablesOpen)}
                    sub="Pedidos não pagos"
                    color="bg-blue-500"
                />
                <KpiCard
                    icon={CreditCard}
                    label="Exposição Crédito"
                    value={fmt(kpis.creditExposure)}
                    sub="IN_CREDIT + OVERDUE"
                    color="bg-amber-500"
                />
                <KpiCard
                    icon={AlertCircle}
                    label="Vencido"
                    value={fmt(kpis.receivablesOverdue)}
                    sub={`Média pagamento: ${kpis.avgDaysToPay === 'N/A' ? 'N/A' : `${kpis.avgDaysToPay} dias`}`}
                    color="bg-red-500"
                />
            </div>

            {/* ─── Charts Row ─── */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
                {/* Financial Status breakdown */}
                <div className="bg-bg-card/80 backdrop-blur-xl border border-white/10 rounded-3xl p-6">
                    <h3 className="text-sm font-bold text-text-primary mb-4">Estados Financeiros</h3>
                    <BarChart
                        data={breakdown.byFinancialStatus}
                        colorMap={FINANCIAL_STATUS_COLORS}
                        labelMap={FINANCIAL_STATUS_LABELS}
                    />
                </div>

                {/* Aging buckets */}
                <div className="bg-bg-card/80 backdrop-blur-xl border border-white/10 rounded-3xl p-6">
                    <h3 className="text-sm font-bold text-text-primary mb-4">Aging (Dias em Aberto)</h3>
                    <BarChart
                        data={breakdown.agingBuckets}
                        colorMap={AGING_COLORS}
                        labelMap={AGING_LABELS}
                    />
                </div>

                {/* Payment method breakdown */}
                <div className="bg-bg-card/80 backdrop-blur-xl border border-white/10 rounded-3xl p-6">
                    <h3 className="text-sm font-bold text-text-primary mb-4">Por Método de Pagamento</h3>
                    <BarChart
                        data={breakdown.byPaymentMode}
                        colorMap={{ APPYPAY_GPO: 'bg-violet-500', BANK_TRANSFER: 'bg-blue-500', GOVERNMENT_CREDIT: 'bg-amber-500', OTHER: 'bg-slate-400' }}
                        labelMap={PAYMENT_METHOD_LABELS}
                    />
                </div>
            </div>

            {/* ─── Action Items ─── */}
            {totalActionItems > 0 && (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                    {/* Awaiting Proof */}
                    {actionItems.awaitingProof.length > 0 && (
                        <div className="bg-bg-card/80 backdrop-blur-xl border border-amber-500/20 rounded-3xl p-6">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2">
                                    <Upload size={16} className="text-amber-500" />
                                    <h3 className="text-sm font-bold text-text-primary">Comprovativos Pendentes</h3>
                                </div>
                                <span className="text-xs font-bold bg-amber-500/20 text-amber-500 px-2 py-0.5 rounded-full">
                                    {actionItems.awaitingProof.length}
                                </span>
                            </div>
                            <div className="space-y-2">
                                {actionItems.awaitingProof.map((item) => (
                                    <div key={item.paymentId} className="flex items-center justify-between p-3 bg-bg-main/50 rounded-2xl group hover:bg-bg-main transition-colors">
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-semibold text-text-primary truncate">
                                                {item.customerName ?? 'Cliente Desconhecido'}
                                            </p>
                                            <p className="text-xs text-text-secondary">{fmt(item.amount)} · {new Date(item.createdAt).toLocaleDateString('pt-PT')}</p>
                                        </div>
                                        <Link href={`/dashboard/orders/${item.orderId}`}
                                            className="ml-2 p-1.5 rounded-xl text-text-secondary hover:text-puculuxa-orange hover:bg-puculuxa-orange/10 transition-all">
                                            <ChevronRight size={16} />
                                        </Link>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Overdue Credits */}
                    {actionItems.overdueCredits.length > 0 && (
                        <div className="bg-bg-card/80 backdrop-blur-xl border border-red-500/20 rounded-3xl p-6">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2">
                                    <Building2 size={16} className="text-red-500" />
                                    <h3 className="text-sm font-bold text-text-primary">Créditos Vencidos</h3>
                                </div>
                                <span className="text-xs font-bold bg-red-500/20 text-red-500 px-2 py-0.5 rounded-full">
                                    {actionItems.overdueCredits.length}
                                </span>
                            </div>
                            <div className="space-y-2">
                                {actionItems.overdueCredits.map((item) => (
                                    <div key={item.orderId} className="flex items-center justify-between p-3 bg-bg-main/50 rounded-2xl hover:bg-bg-main transition-colors">
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-semibold text-text-primary truncate">
                                                {item.debtorEntityName ?? 'Entidade Desconhecida'}
                                            </p>
                                            <p className="text-xs text-text-secondary">
                                                {item.invoiceNumber && <span className="mr-1">{item.invoiceNumber}</span>}
                                                · {fmt(item.total)}
                                                {item.creditDueDate && <span className="text-red-400"> · Vencido em {new Date(item.creditDueDate).toLocaleDateString('pt-PT')}</span>}
                                            </p>
                                        </div>
                                        <Link href={`/dashboard/orders/${item.orderId}`}
                                            className="ml-2 p-1.5 rounded-xl text-text-secondary hover:text-red-500 hover:bg-red-500/10 transition-all">
                                            <ChevronRight size={16} />
                                        </Link>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* ─── Recent Payments ─── */}
            <div className="bg-bg-card/80 backdrop-blur-xl border border-white/10 rounded-3xl p-6">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <Clock size={16} className="text-puculuxa-orange" />
                        <h3 className="text-sm font-bold text-text-primary">Pagamentos Recentes</h3>
                    </div>
                </div>
                {recent.payments.length === 0 ? (
                    <div className="flex flex-col items-center py-8 text-text-secondary gap-2">
                        <CheckCircle size={28} className="opacity-30" />
                        <span className="text-sm">Nenhum pagamento registado</span>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="text-text-secondary border-b border-white/10">
                                    <th className="pb-3 text-left font-semibold text-xs uppercase tracking-wide">Order</th>
                                    <th className="pb-3 text-left font-semibold text-xs uppercase tracking-wide">Método</th>
                                    <th className="pb-3 text-right font-semibold text-xs uppercase tracking-wide">Valor</th>
                                    <th className="pb-3 text-right font-semibold text-xs uppercase tracking-wide">Estado</th>
                                    <th className="pb-3 text-right font-semibold text-xs uppercase tracking-wide">Data</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {recent.payments.map((p) => (
                                    <tr key={p.id} className="group hover:bg-bg-main/40 transition-colors">
                                        <td className="py-3">
                                            <Link href={`/dashboard/orders/${p.orderId}`} className="font-mono text-xs text-puculuxa-orange hover:underline">
                                                #{p.orderId.slice(-8).toUpperCase()}
                                            </Link>
                                        </td>
                                        <td className="py-3 text-text-secondary">
                                            {PAYMENT_METHOD_LABELS[p.method] ?? p.method}
                                        </td>
                                        <td className="py-3 text-right font-bold text-text-primary">{fmt(p.amount)}</td>
                                        <td className="py-3 text-right">
                                            <StatusBadge status={p.status} />
                                        </td>
                                        <td className="py-3 text-right text-text-secondary text-xs">
                                            {new Date(p.createdAt).toLocaleDateString('pt-PT')}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
