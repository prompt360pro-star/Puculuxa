'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { reconciliationService } from '@/services/reconciliationService';
import { FileText, CheckCircle, XCircle, AlertTriangle, ExternalLink, Calendar, MessageCircle } from 'lucide-react';
import Link from 'next/link';

function formatKz(value: number) {
    return new Intl.NumberFormat('pt-AO', {
        style: 'currency',
        currency: 'AOA',
        minimumFractionDigits: 2,
    }).format(value || 0);
}

export default function ReconciliationPage() {
    const queryClient = useQueryClient();
    const [pageAwaiting, setPageAwaiting] = useState(1);
    const [pageOverdue, setPageOverdue] = useState(1);

    // Modal states
    const [rejectPaymentId, setRejectPaymentId] = useState<string | null>(null);
    const [rejectReason, setRejectReason] = useState('');

    // Queries
    const { data: awaitingData, isLoading: loadingAwaiting } = useQuery({
        queryKey: ['awaiting-proof', pageAwaiting],
        queryFn: () => reconciliationService.getAwaitingProofPayments(pageAwaiting, 20),
        refetchInterval: 30000,
    });

    const { data: overdueData, isLoading: loadingOverdue } = useQuery({
        queryKey: ['overdue-credits', pageOverdue],
        queryFn: () => reconciliationService.getOverdueCredits(pageOverdue, 20),
        refetchInterval: 60000,
    });

    // Mutations
    const validateMutation = useMutation({
        mutationFn: ({ paymentId, approved, reason }: { paymentId: string, approved: boolean, reason?: string }) =>
            reconciliationService.validatePayment(paymentId, approved, reason),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['awaiting-proof'] });
            queryClient.invalidateQueries({ queryKey: ['finance-data'] });
            setRejectPaymentId(null);
            setRejectReason('');
            alert('Sucesso: Validação concluída.');
        },
        onError: (err: any) => {
            alert('Erro ao validar pagamento: ' + err.message);
        }
    });

    const markPaidMutation = useMutation({
        mutationFn: (orderId: string) => reconciliationService.markCreditPaid(orderId, 'Pagamento recebido (ordem de saque)'),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['overdue-credits'] });
            queryClient.invalidateQueries({ queryKey: ['finance-data'] });
            alert('Sucesso: Crédito marcado como liquidado!');
        },
        onError: (err: any) => {
            alert('Erro ao liquidar crédito: ' + err.message);
        }
    });

    // Handlers
    const handleApprove = (paymentId: string) => {
        if (confirm('Tem a certeza que deseja APROVAR este comprovativo? O pedido será marcado como pago.')) {
            validateMutation.mutate({ paymentId, approved: true });
        }
    };

    const handleReject = () => {
        if (!rejectPaymentId || !rejectReason.trim()) return;
        validateMutation.mutate({ paymentId: rejectPaymentId, approved: false, reason: rejectReason });
    };

    const handleMarkCreditPaid = (orderId: string) => {
        if (confirm('Marcar este crédito institucional como pago? Isto gera um recibo oficial e remove o crédito da fila.')) {
            markPaidMutation.mutate(orderId);
        }
    };

    return (
        <div className="flex-1 p-8 pb-32">
            <header className="mb-8">
                <h1 className="text-3xl font-black text-text-primary tracking-tight">Reconciliação</h1>
                <p className="text-sm font-medium text-text-secondary mt-1">
                    Validação de comprovativos bancários e liquidação de créditos institucionais.
                </p>
            </header>

            {/* A) Comprovativos Pendentes */}
            <section className="mb-12">
                <div className="flex items-center gap-2 mb-6">
                    <FileText className="text-blue-500" size={24} />
                    <h2 className="text-xl font-bold text-text-primary">Comprovativos Pendentes (Transferências)</h2>
                </div>

                <div className="bg-bg-card border border-border-main rounded-2xl overflow-hidden shadow-sm">
                    {loadingAwaiting ? (
                        <div className="p-8 text-center text-text-secondary font-medium">A carregar retidos...</div>
                    ) : awaitingData?.data?.length === 0 ? (
                        <div className="p-8 text-center text-text-secondary">Nenhum comprovativo para validar neste momento.</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm whitespace-nowrap">
                                <thead className="bg-slate-50 dark:bg-white/5 border-b border-border-main text-text-secondary font-semibold">
                                    <tr>
                                        <th className="px-6 py-4">Data</th>
                                        <th className="px-6 py-4">Cliente / Fatura</th>
                                        <th className="px-6 py-4">Referência</th>
                                        <th className="px-6 py-4 text-right">Valor</th>
                                        <th className="px-6 py-4 text-center">Ficheiro</th>
                                        <th className="px-6 py-4 text-right">Ação</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border-main">
                                    {awaitingData?.data?.map((p) => (
                                        <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="font-medium text-text-primary">
                                                    {new Date(p.createdAt).toLocaleDateString('pt-PT')}
                                                </div>
                                                <div className="text-xs text-text-secondary">
                                                    {new Date(p.createdAt).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="font-bold text-text-primary">{p.customerName || 'Cliente Puculuxa'}</div>
                                                <div className="text-xs font-semibold px-2 py-0.5 mt-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-md inline-block">
                                                    {p.invoiceNumber || 'N/A'}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 font-mono text-xs text-text-secondary">{p.merchantRef}</td>
                                            <td className="px-6 py-4 text-right font-black text-puculuxa-orange">
                                                {formatKz(p.amount)}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                {p.proofUrl ? (
                                                    <a
                                                        href={p.proofUrl}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:hover:bg-blue-900/40 dark:text-blue-400 rounded-lg text-xs font-bold transition-colors"
                                                    >
                                                        <ExternalLink size={14} /> Abrir
                                                    </a>
                                                ) : (
                                                    <span className="text-xs text-text-secondary">-</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => setRejectPaymentId(p.id)}
                                                        disabled={validateMutation.isPending}
                                                        className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                                        title="Rejeitar"
                                                    >
                                                        <XCircle size={20} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleApprove(p.id)}
                                                        disabled={validateMutation.isPending}
                                                        className="p-2 text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                                                        title="Aprovar"
                                                    >
                                                        <CheckCircle size={20} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            {/* Pagination Awaiting */}
                            {awaitingData?.meta && awaitingData.meta.lastPage > 1 && (
                                <div className="px-6 py-4 border-t border-border-main flex justify-end gap-2">
                                    <button
                                        disabled={pageAwaiting === 1}
                                        onClick={() => setPageAwaiting(p => p - 1)}
                                        className="px-3 py-1 text-sm bg-slate-100 dark:bg-slate-800 rounded disabled:opacity-50"
                                    >
                                        Retroceder
                                    </button>
                                    <span className="px-3 py-1 text-sm text-text-secondary">Página {pageAwaiting} de {awaitingData.meta.lastPage}</span>
                                    <button
                                        disabled={pageAwaiting === awaitingData.meta.lastPage}
                                        onClick={() => setPageAwaiting(p => p + 1)}
                                        className="px-3 py-1 text-sm bg-slate-100 dark:bg-slate-800 rounded disabled:opacity-50"
                                    >
                                        Avançar
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </section>

            {/* B) Crédito Institucional Vencido */}
            <section>
                <div className="flex items-center gap-2 mb-6">
                    <AlertTriangle className="text-red-500" size={24} />
                    <h2 className="text-xl font-bold text-text-primary">Crédito Institucional (Em Atraso)</h2>
                </div>

                {loadingOverdue ? (
                    <div className="text-text-secondary">A consultar dívidas vencidas...</div>
                ) : overdueData?.data?.length === 0 ? (
                    <div className="bg-bg-card border border-border-main rounded-2xl p-8 text-center text-text-secondary">
                        <CheckCircle className="mx-auto mb-3 text-green-500" size={32} />
                        Sem créditos em atraso.
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {overdueData?.data?.map((credit) => {
                            const daysOverdue = Math.floor((new Date().getTime() - new Date(credit.creditDueDate).getTime()) / (1000 * 3600 * 24));

                            return (
                                <div key={credit.id} className="bg-bg-card border border-red-500/30 rounded-2xl p-6 shadow-sm flex flex-col">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex items-center gap-2">
                                            <span className="px-2.5 py-1 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 text-[10px] font-black tracking-widest uppercase rounded">
                                                Vencido (Há {daysOverdue} dias)
                                            </span>
                                        </div>
                                        <span className="text-xs font-bold text-slate-500 border border-slate-200 dark:border-slate-700 px-2 py-1 rounded">
                                            {credit.invoices?.[0]?.invoiceNumber || 'N/A'}
                                        </span>
                                    </div>

                                    <h3 className="font-bold text-text-primary text-lg mb-1 leading-tight line-clamp-2">
                                        {credit.debtorEntityName || 'Gestor ou Entidade Desconhecida'}
                                    </h3>

                                    <div className="flex items-center gap-2 text-sm text-text-secondary mb-4">
                                        <Calendar size={14} />
                                        <span>Venceu a: {new Date(credit.creditDueDate).toLocaleDateString('pt-PT')}</span>
                                    </div>

                                    <div className="mt-auto pt-4 border-t border-border-main flex items-center justify-between gap-2">
                                        <span className="text-xl font-black text-puculuxa-orange">
                                            {formatKz(credit.total)}
                                        </span>

                                        <div className="flex items-center gap-2">
                                            <Link
                                                href={`/dashboard/finance/followups?orderId=${credit.id}`}
                                                className="flex items-center gap-1.5 px-3 py-2 border border-green-300 text-green-700 bg-green-50 hover:bg-green-100 text-xs font-bold rounded-xl transition-colors"
                                                title="Abrir painel WhatsApp para este crédito"
                                            >
                                                <MessageCircle size={14} /> WhatsApp
                                            </Link>
                                            <button
                                                onClick={() => handleMarkCreditPaid(credit.id)}
                                                disabled={markPaidMutation.isPending}
                                                className="px-4 py-2 bg-text-primary text-bg-main text-sm font-bold rounded-xl hover:bg-text-secondary transition-colors disabled:opacity-50"
                                            >
                                                Liquidar
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Pagination Overdue */}
                {overdueData?.meta && overdueData.meta.lastPage > 1 && (
                    <div className="mt-6 flex justify-center gap-2">
                        <button
                            disabled={pageOverdue === 1}
                            onClick={() => setPageOverdue(p => p - 1)}
                            className="px-4 py-2 text-sm bg-bg-card border border-border-main rounded-lg disabled:opacity-50"
                        >
                            Retroceder
                        </button>
                        <span className="px-4 py-2 text-sm text-text-secondary font-medium">
                            Página {pageOverdue} de {overdueData.meta.lastPage}
                        </span>
                        <button
                            disabled={pageOverdue === overdueData.meta.lastPage}
                            onClick={() => setPageOverdue(p => p + 1)}
                            className="px-4 py-2 text-sm bg-bg-card border border-border-main rounded-lg disabled:opacity-50"
                        >
                            Avançar
                        </button>
                    </div>
                )}
            </section>

            {/* Reject Modal */}
            {rejectPaymentId && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-bg-card w-full max-w-md rounded-3xl p-8 border border-border-main shadow-2xl relative">
                        <button
                            onClick={() => { setRejectPaymentId(null); setRejectReason(''); }}
                            className="absolute top-6 right-6 text-text-secondary hover:text-text-primary transition-colors"
                        >
                            <XCircle size={24} />
                        </button>

                        <div className="mb-6">
                            <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-2xl flex items-center justify-center mb-4">
                                <AlertTriangle size={24} />
                            </div>
                            <h2 className="text-xl font-bold text-text-primary">Rejeitar Comprovativo</h2>
                            <p className="text-sm text-text-secondary mt-1">Este pagamento ficará marcado como FAILED. O cliente terá de submeter novamente.</p>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-text-primary mb-2">Motivo da Rejeição (Obrigatório)</label>
                                <textarea
                                    className="w-full bg-slate-50 dark:bg-slate-900/50 border border-border-main rounded-xl p-4 text-sm focus:outline-none focus:border-puculuxa-orange focus:ring-1 focus:ring-puculuxa-orange transition-all min-h-[100px] resize-none pb-2 text-text-primary"
                                    placeholder="Ex: Ficheiro ilegível, valor incorreto..."
                                    value={rejectReason}
                                    onChange={(e) => setRejectReason(e.target.value)}
                                    autoFocus
                                />
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button
                                    onClick={() => { setRejectPaymentId(null); setRejectReason(''); }}
                                    className="flex-1 py-3 px-4 bg-slate-100 dark:bg-white/5 font-bold text-text-secondary rounded-xl hover:bg-slate-200 dark:hover:bg-white/10 transition-colors"
                                    disabled={validateMutation.isPending}
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleReject}
                                    disabled={validateMutation.isPending || !rejectReason.trim()}
                                    className="flex-1 py-3 px-4 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition-colors disabled:opacity-50"
                                >
                                    {validateMutation.isPending ? 'A rejeitar...' : 'Confirmar Rejeição'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
