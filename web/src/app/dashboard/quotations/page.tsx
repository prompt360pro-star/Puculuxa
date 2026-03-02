'use client';

import React, { useState } from 'react';
import {
    ChefHat, CheckCircle, XCircle, Download, Search, Loader2,
    Clock, AlertTriangle, Send, ArrowRight, Eye, FileText,
    Users, Calendar, MessageSquare, ChevronDown, ChevronUp,
    Sparkles, Timer, ShoppingCart, X, Star
} from 'lucide-react';
import { QuotationWebService, Quotation, PaginatedResponse, AdminBrief } from '@/services/quotationService';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

// ─── Response Templates ───
const RESPONSE_TEMPLATES = [
    { label: '📋 Proposta Padrão', text: 'Obrigado pelo seu pedido! Com base nas suas especificações, preparámos a seguinte proposta. O preço inclui todos os itens selecionados, decoração e entrega. Estamos ao dispor para qualquer ajuste.' },
    { label: '🎂 Bolo Personalizado', text: 'Temos todo o gosto em criar o bolo dos seus sonhos! O valor inclui design personalizado, ingredientes premium e decoração artesanal. A entrega será feita no local do evento.' },
    { label: '🍰 Evento Completo', text: 'Para o seu evento, sugerimos o pacote completo que inclui mesa de doces, bolo principal e opções de bebidas. Garantimos qualidade premium e apresentação impecável.' },
    { label: '💬 Negociação', text: 'Compreendemos o seu pedido de ajuste. Revimos a proposta e apresentamos uma nova versão com as alterações solicitadas. Esperamos que corresponda às suas expectativas.' },
];

// ─── SLA Helpers ───
function getSlaStatus(slaDeadline: string | null, status: string) {
    if (!slaDeadline || ['ACCEPTED', 'REJECTED', 'EXPIRED', 'CONVERTED'].includes(status)) {
        return { label: '—', color: 'text-gray-400', bg: '', icon: null, urgent: false };
    }
    const now = new Date();
    const deadline = new Date(slaDeadline);
    const diffMs = deadline.getTime() - now.getTime();
    const diffMin = Math.floor(diffMs / 60000);

    if (diffMs < 0) return { label: 'SLA Ultrapassado', color: 'text-red-600', bg: 'bg-red-500/10', icon: AlertTriangle, urgent: true };
    if (diffMin < 30) return { label: `${diffMin}min restantes`, color: 'text-red-500', bg: 'bg-red-500/10', icon: Timer, urgent: true };
    if (diffMin < 120) return { label: `${Math.floor(diffMin / 60)}h ${diffMin % 60}min`, color: 'text-amber-500', bg: 'bg-amber-500/10', icon: Clock, urgent: false };
    return { label: `${Math.floor(diffMin / 60)}h`, color: 'text-green-500', bg: 'bg-green-500/10', icon: Clock, urgent: false };
}

function getEventUrgency(eventDate: string | null) {
    if (!eventDate) return { label: 'Sem data', badge: 'bg-gray-200 text-gray-600' };
    const days = Math.ceil((new Date(eventDate).getTime() - Date.now()) / 86400000);
    if (days < 0) return { label: 'Passado', badge: 'bg-gray-200 text-gray-600' };
    if (days <= 3) return { label: `🔴 ${days}d`, badge: 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400' };
    if (days <= 7) return { label: `🟡 ${days}d`, badge: 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400' };
    return { label: `🟢 ${days}d`, badge: 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400' };
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
    DRAFT: { label: 'Rascunho', color: 'text-gray-500', bg: 'bg-gray-500/10' },
    SUBMITTED: { label: 'Submetido', color: 'text-blue-500', bg: 'bg-blue-500/10' },
    IN_REVIEW: { label: 'Em Análise', color: 'text-purple-500', bg: 'bg-purple-500/10' },
    PROPOSAL_SENT: { label: 'Proposta Enviada', color: 'text-indigo-500', bg: 'bg-indigo-500/10' },
    NEGOTIATING: { label: 'Negociação', color: 'text-amber-500', bg: 'bg-amber-500/10' },
    ACCEPTED: { label: 'Aceite', color: 'text-green-600', bg: 'bg-green-500/10' },
    REJECTED: { label: 'Rejeitado', color: 'text-red-500', bg: 'bg-red-500/10' },
    EXPIRED: { label: 'Expirado', color: 'text-gray-400', bg: 'bg-gray-400/10' },
    CONVERTED: { label: 'Convertido', color: 'text-emerald-600', bg: 'bg-emerald-500/10' },
};

const EVENT_LABELS: Record<string, string> = {
    casamento: '💒 Casamento', aniversario: '🎂 Aniversário', corporativo: '💼 Corporativo',
    baptizado: '⛪ Baptizado', bodas: '💍 Bodas', baby_shower: '👶 Baby Shower',
    graduacao: '🎓 Graduação', outro: '📋 Outro',
};

function formatKz(value: number) {
    return `Kz ${value.toLocaleString('pt-AO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// ─── Intelligence Brief Panel (standalone so useQuery is at component top-level) ───
function BriefPanel({ quotationId }: { quotationId: string }) {
    const { data: brief, isLoading } = useQuery<AdminBrief | null>({
        queryKey: ['brief', quotationId],
        queryFn: () => QuotationWebService.getBrief(quotationId),
        staleTime: 5 * 60 * 1000,
    });

    return (
        <div className="mt-4 pt-4 border-t border-border-main">
            <h4 className="font-bold text-text-primary text-sm flex items-center gap-2 mb-3">
                <Sparkles size={14} className="text-puculuxa-orange" /> Brief do Motor de Inteligência
            </h4>
            {isLoading ? (
                <div className="flex items-center gap-2 text-xs text-text-secondary">
                    <Loader2 size={12} className="animate-spin" /> A carregar análise...
                </div>
            ) : brief ? (
                <>
                    <div className="grid grid-cols-4 gap-4">
                        <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-border-main text-center">
                            <p className="text-[10px] font-bold text-text-secondary mb-1">COMPLEXIDADE</p>
                            <div className="flex justify-center gap-1">
                                {Array.from({ length: 5 }).map((_, i) => (
                                    <Star key={i} size={12} fill={i < brief.complexityScore ? '#F97316' : 'none'} className={i < brief.complexityScore ? 'text-puculuxa-orange' : 'text-gray-300'} />
                                ))}
                            </div>
                            <p className="text-xs text-text-secondary mt-1">{brief.complexityScore}/5</p>
                        </div>
                        <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-border-main">
                            <p className="text-[10px] font-bold text-text-secondary mb-1">PERFIL CLIENTE</p>
                            <p className="text-sm font-black text-text-primary">{brief.clientProfile.tier}</p>
                            <p className="text-[10px] text-text-secondary">{brief.clientProfile.totalOrders} pedidos · {brief.clientProfile.isRecurring ? '🔄 Recorrente' : '🆕 Novo'}</p>
                        </div>
                        <div className={`rounded-xl p-4 border ${brief.feasibility.isPossible ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-500/30' : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-500/30'}`}>
                            <p className="text-[10px] font-bold text-text-secondary mb-1">VIABILIDADE</p>
                            <p className={`text-sm font-black ${brief.feasibility.isPossible ? 'text-green-600' : 'text-red-600'}`}>
                                {brief.feasibility.isPossible ? '✅ Possível' : '⛔ Inviável'}
                            </p>
                            <p className="text-[10px] text-text-secondary">{brief.feasibility.daysUntilEvent}d · {brief.feasibility.currentLoad}% cozinha</p>
                        </div>
                        <div className="bg-puculuxa-orange/5 rounded-xl p-4 border border-puculuxa-orange/20">
                            <p className="text-[10px] font-bold text-text-secondary mb-1">PREÇO SUGERIDO IA</p>
                            <p className="text-sm font-black text-puculuxa-orange">{brief.estimatedPrice}</p>
                            {brief.suggestedProducts[0] && (
                                <p className="text-[10px] text-text-secondary mt-1">💡 {brief.suggestedProducts[0].name}</p>
                            )}
                        </div>
                    </div>
                    {brief.summary && (
                        <div className="mt-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl p-4 border border-indigo-200 dark:border-indigo-500/30">
                            <p className="text-xs text-indigo-700 dark:text-indigo-300">{brief.summary}</p>
                        </div>
                    )}
                </>
            ) : (
                <p className="text-xs text-text-secondary">Brief indisponível.</p>
            )}
        </div>
    );
}

// ─── Main Page ───
export default function QuotationsPage() {
    const queryClient = useQueryClient();
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [page, setPage] = useState(1);
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [proposalModal, setProposalModal] = useState<{ quotationId: string; currentPrice: number } | null>(null);

    // ─── Query ───
    const { data: response, isLoading } = useQuery<PaginatedResponse<Quotation>>({
        queryKey: ['quotations', page, statusFilter],
        queryFn: () => QuotationWebService.getAll(page, 20, statusFilter !== 'all' ? statusFilter : undefined),
        refetchInterval: 30000, // Auto-refresh every 30s for SLA updates
    });

    const quotations = response?.data || [];
    const meta = response?.meta || { total: 0, page: 1, limit: 20, lastPage: 1 };

    const filteredQuotations = quotations.filter(q =>
        !searchTerm ||
        q.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        q.eventType?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        q.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // ─── Mutations ───
    const updateStatusMutation = useMutation({
        mutationFn: ({ id, status, reason }: { id: string; status: string; reason?: string }) =>
            QuotationWebService.updateStatus(id, status, reason),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['quotations'] });
            toast.success('Status actualizado!');
        },
        onError: (err: Error) => toast.error(err.message || 'Erro ao actualizar status.'),
    });

    const sendProposalMutation = useMutation({
        mutationFn: ({ id, price, response, changes }: { id: string; price: number; response?: string; changes?: string }) =>
            QuotationWebService.sendProposal(id, price, response, changes),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['quotations'] });
            setProposalModal(null);
            toast.success('Proposta enviada ao cliente!');
        },
        onError: (err: Error) => toast.error(err.message || 'Erro ao enviar proposta.'),
    });

    const convertMutation = useMutation({
        mutationFn: (id: string) => QuotationWebService.convertToOrder(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['quotations'] });
            toast.success('Pedido criado com sucesso!');
        },
        onError: (err: Error) => toast.error(err.message || 'Erro ao converter em pedido.'),
    });

    // ─── Stats Bar ───
    const stats = {
        pending: quotations.filter(q => ['SUBMITTED', 'IN_REVIEW'].includes(q.status)).length,
        slaBreached: quotations.filter(q => {
            if (!q.slaDeadline) return false;
            return new Date(q.slaDeadline).getTime() < Date.now() && !['ACCEPTED', 'REJECTED', 'EXPIRED', 'CONVERTED'].includes(q.status);
        }).length,
        proposals: quotations.filter(q => q.status === 'PROPOSAL_SENT').length,
        negotiating: quotations.filter(q => q.status === 'NEGOTIATING').length,
    };

    const STATUS_FILTERS = [
        { value: 'all', label: 'Todos' },
        { value: 'SUBMITTED', label: `Novos (${stats.pending})` },
        { value: 'IN_REVIEW', label: 'Em Análise' },
        { value: 'PROPOSAL_SENT', label: `Propostas (${stats.proposals})` },
        { value: 'NEGOTIATING', label: `Negociação (${stats.negotiating})` },
        { value: 'ACCEPTED', label: 'Aceites' },
        { value: 'CONVERTED', label: 'Convertidos' },
        { value: 'REJECTED', label: 'Rejeitados' },
        { value: 'EXPIRED', label: 'Expirados' },
    ];

    return (
        <div className="p-8 transition-colors duration-300">
            {/* Header */}
            <header className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-text-primary">Gestão de Orçamentos</h1>
                    <p className="text-text-secondary">Pipeline inteligente — responda em tempo, converta com confiança.</p>
                </div>
            </header>

            {/* KPI Cards */}
            <div className="grid grid-cols-4 gap-4 mb-8">
                <div className="bg-bg-card rounded-2xl border border-border-main p-5 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
                        <FileText size={22} className="text-blue-500" />
                    </div>
                    <div>
                        <p className="text-2xl font-black text-text-primary">{meta.total}</p>
                        <p className="text-xs text-text-secondary font-medium">Total Orçamentos</p>
                    </div>
                </div>
                <div className={`bg-bg-card rounded-2xl border p-5 flex items-center gap-4 ${stats.slaBreached > 0 ? 'border-red-300 dark:border-red-500/40' : 'border-border-main'}`}>
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${stats.slaBreached > 0 ? 'bg-red-500/10' : 'bg-green-500/10'}`}>
                        <AlertTriangle size={22} className={stats.slaBreached > 0 ? 'text-red-500' : 'text-green-500'} />
                    </div>
                    <div>
                        <p className={`text-2xl font-black ${stats.slaBreached > 0 ? 'text-red-500' : 'text-green-500'}`}>{stats.slaBreached}</p>
                        <p className="text-xs text-text-secondary font-medium">SLA Ultrapassados</p>
                    </div>
                </div>
                <div className="bg-bg-card rounded-2xl border border-border-main p-5 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center">
                        <MessageSquare size={22} className="text-amber-500" />
                    </div>
                    <div>
                        <p className="text-2xl font-black text-text-primary">{stats.negotiating}</p>
                        <p className="text-xs text-text-secondary font-medium">Em Negociação</p>
                    </div>
                </div>
                <div className="bg-bg-card rounded-2xl border border-border-main p-5 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                        <ShoppingCart size={22} className="text-emerald-500" />
                    </div>
                    <div>
                        <p className="text-2xl font-black text-emerald-600">{quotations.filter(q => q.status === 'CONVERTED').length}</p>
                        <p className="text-xs text-text-secondary font-medium">Convertidos</p>
                    </div>
                </div>
            </div>

            {/* Search + Filters */}
            <div className="space-y-4 mb-6">
                <div className="bg-bg-card p-4 rounded-xl border border-border-main flex items-center gap-2">
                    <Search size={20} className="text-text-secondary" />
                    <input
                        type="text"
                        placeholder="Buscar por cliente, evento ou descrição..."
                        className="flex-1 outline-none text-sm bg-transparent text-text-primary"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex flex-wrap gap-2 items-center">
                    {STATUS_FILTERS.map(({ value, label }) => (
                        <button
                            key={value}
                            onClick={() => { setStatusFilter(value); setPage(1); }}
                            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${statusFilter === value
                                ? 'bg-puculuxa-orange text-white shadow-puculuxa'
                                : 'bg-bg-card border border-border-main text-text-secondary hover:border-puculuxa-orange hover:text-puculuxa-orange'
                                }`}
                        >
                            {label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Table */}
            <div className="bg-bg-card rounded-2xl border border-border-main shadow-sm overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 dark:bg-slate-800/50 text-text-secondary uppercase text-[10px] font-bold tracking-widest border-b border-border-main">
                        <tr>
                            <th className="p-5">Cliente</th>
                            <th className="p-5">Evento</th>
                            <th className="p-5">Valor</th>
                            <th className="p-5">Urgência</th>
                            <th className="p-5">SLA</th>
                            <th className="p-5">Status</th>
                            <th className="p-5 text-right">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border-main">
                        {isLoading ? (
                            <tr>
                                <td colSpan={7} className="p-12 text-center text-text-secondary">
                                    <div className="flex flex-col items-center gap-2">
                                        <Loader2 className="animate-spin text-puculuxa-orange" />
                                        <span>Carregando orçamentos...</span>
                                    </div>
                                </td>
                            </tr>
                        ) : filteredQuotations.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="p-12 text-center text-text-secondary">
                                    Nenhum orçamento encontrado.
                                </td>
                            </tr>
                        ) : filteredQuotations.map((q) => {
                            const sla = getSlaStatus(q.slaDeadline, q.status);
                            const urgency = getEventUrgency(q.eventDate);
                            const statusCfg = STATUS_CONFIG[q.status] || STATUS_CONFIG.DRAFT;
                            const isExpanded = expandedId === q.id;
                            const latestVersion = q.versions?.[0];
                            const displayPrice = latestVersion?.price || q.estimatedTotal;

                            return (
                                <React.Fragment key={q.id}>
                                    <tr
                                        className={`hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors cursor-pointer ${sla.urgent ? 'bg-red-50/50 dark:bg-red-900/10' : ''}`}
                                        onClick={() => setExpandedId(isExpanded ? null : q.id)}
                                    >
                                        {/* Cliente */}
                                        <td className="p-5">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-full bg-puculuxa-orange/10 flex items-center justify-center text-puculuxa-orange font-bold text-xs">
                                                    {q.customerName?.charAt(0) || '?'}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-text-primary text-sm leading-tight">{q.customerName || 'Anónimo'}</p>
                                                    <p className="text-[10px] text-text-secondary">{q.customerPhone || '—'}</p>
                                                </div>
                                            </div>
                                        </td>
                                        {/* Evento */}
                                        <td className="p-5">
                                            <p className="font-medium text-text-primary text-sm">{EVENT_LABELS[q.eventType] || q.eventType}</p>
                                            <p className="text-[10px] text-text-secondary">{q.guestCount} convidados</p>
                                        </td>
                                        {/* Valor */}
                                        <td className="p-5 font-black text-puculuxa-orange text-sm">
                                            {formatKz(displayPrice)}
                                        </td>
                                        {/* Urgência */}
                                        <td className="p-5">
                                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${urgency.badge}`}>
                                                {urgency.label}
                                            </span>
                                        </td>
                                        {/* SLA */}
                                        <td className="p-5">
                                            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold ${sla.bg} ${sla.color}`}>
                                                {sla.icon && <sla.icon size={12} />}
                                                {sla.label}
                                            </div>
                                        </td>
                                        {/* Status */}
                                        <td className="p-5">
                                            <span className={`px-3 py-1 ${statusCfg.bg} ${statusCfg.color} font-bold text-[10px] uppercase tracking-widest rounded-full`}>
                                                {statusCfg.label}
                                            </span>
                                        </td>
                                        {/* Actions */}
                                        <td className="p-5 text-right">
                                            <div className="flex justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                                                {/* Review */}
                                                {q.status === 'SUBMITTED' && (
                                                    <button
                                                        onClick={() => updateStatusMutation.mutate({ id: q.id, status: 'IN_REVIEW' })}
                                                        className="p-2 bg-purple-500/10 text-purple-500 hover:bg-purple-500 hover:text-white rounded-xl transition-colors"
                                                        title="Iniciar Análise"
                                                    >
                                                        <Eye size={16} />
                                                    </button>
                                                )}
                                                {/* Send Proposal */}
                                                {['IN_REVIEW', 'NEGOTIATING'].includes(q.status) && (
                                                    <button
                                                        onClick={() => setProposalModal({ quotationId: q.id, currentPrice: displayPrice })}
                                                        className="p-2 bg-indigo-500/10 text-indigo-500 hover:bg-indigo-500 hover:text-white rounded-xl transition-colors"
                                                        title="Enviar Proposta"
                                                    >
                                                        <Send size={16} />
                                                    </button>
                                                )}
                                                {/* Convert to Order */}
                                                {q.status === 'ACCEPTED' && (
                                                    <button
                                                        onClick={() => convertMutation.mutate(q.id)}
                                                        className="p-2 bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-white rounded-xl transition-colors"
                                                        title="Converter em Pedido"
                                                    >
                                                        <ShoppingCart size={16} />
                                                    </button>
                                                )}
                                                {/* Reject */}
                                                {['SUBMITTED', 'IN_REVIEW', 'PROPOSAL_SENT', 'NEGOTIATING'].includes(q.status) && (
                                                    <button
                                                        onClick={() => updateStatusMutation.mutate({ id: q.id, status: 'REJECTED', reason: 'Rejeitado pelo admin' })}
                                                        className="p-2 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-xl transition-colors"
                                                        title="Rejeitar"
                                                    >
                                                        <XCircle size={16} />
                                                    </button>
                                                )}
                                                {/* PDF */}
                                                <a
                                                    href={QuotationWebService.getPdfUrl(q.id)}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="p-2 bg-slate-100 dark:bg-slate-800 text-text-secondary hover:text-text-primary rounded-xl transition-colors"
                                                    title="PDF"
                                                >
                                                    <Download size={16} />
                                                </a>
                                                {/* Expand */}
                                                <button className="p-2 text-text-secondary hover:text-text-primary rounded-xl transition-colors">
                                                    {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                                </button>
                                            </div>
                                        </td>
                                    </tr>

                                    {/* Expanded Detail Row */}
                                    {isExpanded && (
                                        <tr>
                                            <td colSpan={7} className="p-0">
                                                <div className="bg-slate-50/50 dark:bg-slate-800/20 border-t border-border-main p-6">
                                                    <div className="grid grid-cols-3 gap-6">
                                                        {/* Left: Details */}
                                                        <div className="space-y-4">
                                                            <h4 className="font-bold text-text-primary text-sm flex items-center gap-2">
                                                                <FileText size={14} /> Detalhes do Pedido
                                                            </h4>
                                                            {q.description && (
                                                                <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-border-main">
                                                                    <p className="text-xs text-text-secondary mb-1 font-bold">Descrição personalizada:</p>
                                                                    <p className="text-sm text-text-primary">&ldquo;{q.description}&rdquo;</p>
                                                                </div>
                                                            )}
                                                            <div className="text-xs text-text-secondary space-y-1">
                                                                <p><strong>Fonte:</strong> {q.source}</p>
                                                                <p><strong>Complexidade:</strong> {q.complexityScore ? `${q.complexityScore}/5` : 'N/A'}</p>
                                                                <p><strong>Data evento:</strong> {q.eventDate ? new Date(q.eventDate).toLocaleDateString('pt-AO') : 'Não definida'}</p>
                                                                <p><strong>Criado:</strong> {new Date(q.createdAt).toLocaleString('pt-AO')}</p>
                                                            </div>
                                                            {/* Complements */}
                                                            {q.complements && q.complements.length > 0 && (
                                                                <div>
                                                                    <p className="text-xs font-bold text-text-secondary mb-2">Complementos:</p>
                                                                    {q.complements.map(c => (
                                                                        <div key={c.id} className="flex justify-between text-xs text-text-primary py-1">
                                                                            <span>{c.name} ×{c.quantity}</span>
                                                                            <span className="font-bold">{formatKz(c.subtotal)}</span>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </div>

                                                        {/* Center: Version Timeline */}
                                                        <div className="space-y-4">
                                                            <h4 className="font-bold text-text-primary text-sm flex items-center gap-2">
                                                                <Clock size={14} /> Histórico de Versões
                                                            </h4>
                                                            {q.versions && q.versions.length > 0 ? (
                                                                <div className="space-y-3">
                                                                    {q.versions.map((v) => (
                                                                        <div key={v.id} className={`bg-white dark:bg-slate-800 rounded-xl p-4 border ${v.status === 'PENDING' ? 'border-indigo-300 dark:border-indigo-500/40' : 'border-border-main'}`}>
                                                                            <div className="flex justify-between items-center mb-2">
                                                                                <span className="text-xs font-bold text-text-primary">v{v.version}</span>
                                                                                <span className={`text-xs font-bold ${v.status === 'PENDING' ? 'text-indigo-500' : v.status === 'ACCEPTED' ? 'text-green-500' : 'text-gray-400'}`}>
                                                                                    {v.status === 'PENDING' ? '⏳ Aguarda' : v.status === 'ACCEPTED' ? '✅ Aceite' : '↩️ Substituída'}
                                                                                </span>
                                                                            </div>
                                                                            <p className="text-sm font-black text-puculuxa-orange">{formatKz(v.price)}</p>
                                                                            {v.response && <p className="text-xs text-text-secondary mt-1">{v.response}</p>}
                                                                            <p className="text-[10px] text-text-secondary mt-2">{v.changedBy} · {new Date(v.createdAt).toLocaleString('pt-AO')}</p>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            ) : (
                                                                <p className="text-xs text-text-secondary">Sem versões registadas.</p>
                                                            )}
                                                        </div>

                                                        {/* Right: Notes + Audit */}
                                                        <div className="space-y-4">
                                                            <h4 className="font-bold text-text-primary text-sm flex items-center gap-2">
                                                                <MessageSquare size={14} /> Notas & Auditoria
                                                            </h4>
                                                            {q.notes && (
                                                                <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-4 border border-amber-200 dark:border-amber-500/30">
                                                                    <p className="text-xs font-bold text-amber-700 mb-1">📝 Notas internas:</p>
                                                                    <p className="text-sm text-text-primary">{q.notes}</p>
                                                                </div>
                                                            )}
                                                            {q.auditLog && q.auditLog.length > 0 && (
                                                                <div className="space-y-2">
                                                                    <p className="text-xs font-bold text-text-secondary">Histórico:</p>
                                                                    {q.auditLog.map(a => (
                                                                        <div key={a.id} className="text-[10px] text-text-secondary flex gap-2 items-start">
                                                                            <span className="mt-0.5">•</span>
                                                                            <div>
                                                                                <span className="font-bold">{a.fromStatus}</span> → <span className="font-bold">{a.toStatus}</span>
                                                                                {a.reason && <span> — {a.reason}</span>}
                                                                                <br />
                                                                                <span>{new Date(a.createdAt).toLocaleString('pt-AO')}</span>
                                                                            </div>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* Intelligence Brief Panel */}
                                                    <BriefPanel quotationId={q.id} />
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </React.Fragment>
                            );
                        })}
                    </tbody>
                </table>

                {/* Pagination */}
                {meta.lastPage > 1 && (
                    <div className="flex items-center justify-between p-4 border-t border-border-main">
                        <span className="text-xs text-text-secondary">{meta.total} orçamento(s)</span>
                        <div className="flex gap-2">
                            <button
                                disabled={page <= 1}
                                onClick={() => setPage(p => p - 1)}
                                className="px-4 py-2 rounded-xl text-xs font-bold bg-bg-card border border-border-main text-text-secondary hover:border-puculuxa-orange disabled:opacity-50"
                            >
                                Anterior
                            </button>
                            <span className="px-4 py-2 text-xs font-bold text-text-primary">{page} / {meta.lastPage}</span>
                            <button
                                disabled={page >= meta.lastPage}
                                onClick={() => setPage(p => p + 1)}
                                className="px-4 py-2 rounded-xl text-xs font-bold bg-bg-card border border-border-main text-text-secondary hover:border-puculuxa-orange disabled:opacity-50"
                            >
                                Próximo
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* ─── Proposal Modal ─── */}
            {proposalModal && (
                <ProposalModal
                    quotationId={proposalModal.quotationId}
                    currentPrice={proposalModal.currentPrice}
                    onClose={() => setProposalModal(null)}
                    onSubmit={(price, response, changes) => {
                        sendProposalMutation.mutate({ id: proposalModal.quotationId, price, response, changes });
                    }}
                    isLoading={sendProposalMutation.isPending}
                />
            )}
        </div>
    );
}

// ─── Proposal Modal Component ───
function ProposalModal({ quotationId, currentPrice, onClose, onSubmit, isLoading }: {
    quotationId: string;
    currentPrice: number;
    onClose: () => void;
    onSubmit: (price: number, response?: string, changes?: string) => void;
    isLoading: boolean;
}) {
    const [price, setPrice] = useState(String(currentPrice));
    const [response, setResponse] = useState('');
    const [changes, setChanges] = useState('');

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-bg-card rounded-2xl border border-border-main shadow-2xl w-full max-w-lg overflow-hidden">
                <div className="flex justify-between items-center p-6 border-b border-border-main">
                    <h3 className="text-lg font-bold text-text-primary flex items-center gap-2">
                        <Send size={18} className="text-puculuxa-orange" />
                        Enviar Proposta
                    </h3>
                    <button onClick={onClose} title="Fechar" aria-label="Fechar modal" className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                        <X size={18} className="text-text-secondary" />
                    </button>
                </div>

                <div className="p-6 space-y-5">
                    {/* Price */}
                    <div>
                        <label className="block text-xs font-bold text-text-secondary mb-2">Preço da Proposta (Kz)</label>
                        <input
                            id="proposal-price"
                            type="number"
                            value={price}
                            onChange={(e) => setPrice(e.target.value)}
                            placeholder="Ex: 250000"
                            title="Preço da proposta em Kz"
                            aria-label="Preço da proposta em Kz"
                            className="w-full px-4 py-3 rounded-xl border border-border-main bg-transparent text-lg font-black text-puculuxa-orange outline-none focus:border-puculuxa-orange transition-colors"
                        />
                    </div>

                    {/* Templates */}
                    <div>
                        <label className="block text-xs font-bold text-text-secondary mb-2">Templates de Resposta</label>
                        <div className="flex flex-wrap gap-2">
                            {RESPONSE_TEMPLATES.map((t) => (
                                <button
                                    key={t.label}
                                    onClick={() => setResponse(t.text)}
                                    className="px-3 py-1.5 rounded-lg text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-text-secondary hover:bg-puculuxa-orange/10 hover:text-puculuxa-orange transition-colors"
                                >
                                    {t.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Response Message */}
                    <div>
                        <label className="block text-xs font-bold text-text-secondary mb-2">Mensagem ao Cliente</label>
                        <textarea
                            value={response}
                            onChange={(e) => setResponse(e.target.value)}
                            rows={4}
                            className="w-full px-4 py-3 rounded-xl border border-border-main bg-transparent text-sm text-text-primary outline-none focus:border-puculuxa-orange transition-colors resize-none"
                            placeholder="Escreva ou selecione um template acima..."
                        />
                    </div>

                    {/* Changes Summary */}
                    <div>
                        <label className="block text-xs font-bold text-text-secondary mb-2">Resumo das Alterações (interno)</label>
                        <input
                            type="text"
                            value={changes}
                            onChange={(e) => setChanges(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl border border-border-main bg-transparent text-sm text-text-primary outline-none focus:border-puculuxa-orange transition-colors"
                            placeholder="Ex: Ajustado preço dos cupcakes, adicionou decoração..."
                        />
                    </div>
                </div>

                <div className="flex gap-3 p-6 border-t border-border-main">
                    <button
                        onClick={onClose}
                        className="flex-1 px-4 py-3 rounded-xl text-sm font-bold bg-slate-100 dark:bg-slate-800 text-text-secondary hover:bg-slate-200 transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={() => onSubmit(Number(price), response, changes)}
                        disabled={isLoading || !price}
                        className="flex-1 px-4 py-3 rounded-xl text-sm font-bold bg-puculuxa-orange text-white hover:bg-puculuxa-orange/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                        Enviar Proposta
                    </button>
                </div>
            </div>
        </div>
    );
}
