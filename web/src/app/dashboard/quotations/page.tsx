'use client';

import React, { useState } from 'react';
import { ChefHat, CheckCircle, XCircle, Download, Search, Loader2 } from 'lucide-react';
import { QuotationWebService, Quotation } from '@/services/quotationService';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export default function QuotationsPage() {
    const queryClient = useQueryClient();
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');

    const { data: quotations = [], isLoading } = useQuery<Quotation[]>({
        queryKey: ['quotations'],
        queryFn: () => QuotationWebService.getAll(),
    });

    const updateStatusMutation = useMutation({
        mutationFn: ({ id, status }: { id: string; status: string }) => QuotationWebService.updateStatus(id, status),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['quotations'] });
            toast.success('Status do orçamento atualizado com sucesso!');
        },
        onError: () => {
            toast.error('Erro ao atualizar o status do orçamento.');
        }
    });

    const handleApprove = (id: string) => updateStatusMutation.mutate({ id, status: 'APPROVED' });
    const handleReject = (id: string) => updateStatusMutation.mutate({ id, status: 'REJECTED' });

    const filteredQuotations = quotations.filter(q => {
        const matchSearch = q.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            q.eventType?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchStatus = statusFilter === 'all' || q.status === statusFilter;
        return matchSearch && matchStatus;
    });

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'APPROVED': return <span className="px-3 py-1 bg-green-500/10 text-green-500 font-bold text-xs uppercase tracking-widest rounded-full">Aprovado</span>;
            case 'REJECTED': return <span className="px-3 py-1 bg-red-500/10 text-red-500 font-bold text-xs uppercase tracking-widest rounded-full">Rejeitado</span>;
            default: return <span className="px-3 py-1 bg-yellow-500/10 text-yellow-500 font-bold text-xs uppercase tracking-widest rounded-full">Pendente</span>;
        }
    };

    return (
        <div className="p-8 transition-colors duration-300">
            <header className="flex justify-between items-center mb-12">
                <div>
                    <h1 className="text-3xl font-bold text-text-primary">Gestão de Orçamentos</h1>
                    <p className="text-text-secondary">Avalie, aprove ou rejeite solicitações de orçamento.</p>
                </div>
            </header>

            <div className="space-y-4 mb-8">
                <div className="flex gap-4">
                    <div className="flex-1 bg-bg-card p-4 rounded-xl border border-border-main flex items-center gap-2">
                        <Search size={20} className="text-text-secondary" />
                        <input
                            type="text"
                            placeholder="Buscar por cliente ou tipo de evento..."
                            className="flex-1 outline-none text-sm bg-transparent text-text-primary"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
                {/* Status Filter Pills */}
                <div className="flex flex-wrap gap-2 items-center">
                    {[{ value: 'all', label: 'Todos' }, { value: 'PENDING', label: 'Pendentes' }, { value: 'APPROVED', label: 'Aprovados' }, { value: 'REJECTED', label: 'Rejeitados' }].map(({ value, label }) => (
                        <button
                            key={value}
                            onClick={() => setStatusFilter(value)}
                            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${statusFilter === value
                                ? 'bg-puculuxa-orange text-white shadow-puculuxa'
                                : 'bg-bg-card border border-border-main text-text-secondary hover:border-puculuxa-orange hover:text-puculuxa-orange'
                                }`}
                        >
                            {label}
                        </button>
                    ))}
                    <span className="ml-auto text-xs text-text-secondary font-bold">
                        {filteredQuotations.length} orçamento{filteredQuotations.length !== 1 ? 's' : ''}
                    </span>
                </div>
            </div>

            <div className="bg-bg-card rounded-2xl border border-border-main shadow-sm overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 dark:bg-slate-800/50 text-text-secondary uppercase text-[10px] font-bold tracking-widest border-b border-border-main">
                        <tr>
                            <th className="p-6">Orçamento ID</th>
                            <th className="p-6">Cliente</th>
                            <th className="p-6">Evento</th>
                            <th className="p-6">Total Estimado</th>
                            <th className="p-6">Data</th>
                            <th className="p-6">Status</th>
                            <th className="p-6 text-right">Ações</th>
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
                        ) : filteredQuotations.map((quotation) => (
                            <tr key={quotation.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                                <td className="p-6 font-mono text-xs text-text-secondary">
                                    #{quotation.id.substring(0, 8)}
                                </td>
                                <td className="p-6">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-puculuxa-orange/10 flex items-center justify-center text-puculuxa-orange font-bold text-xs">
                                            {quotation.customerName?.charAt(0) || '?'}
                                        </div>
                                        <div>
                                            <p className="font-bold text-text-primary leading-tight">{quotation.customerName || 'Anónimo'}</p>
                                            <p className="text-[10px] text-text-secondary">{quotation.customerPhone || 'Sem info'}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="p-6">
                                    <div className="flex items-center gap-2">
                                        <ChefHat size={16} className="text-text-secondary" />
                                        <span className="font-medium text-text-primary text-sm">{quotation.eventType}</span>
                                    </div>
                                    <p className="text-[10px] text-text-secondary mt-1">{quotation.guestCount} convidados</p>
                                </td>
                                <td className="p-6 font-black text-puculuxa-orange">
                                    Kz {quotation.total?.toFixed(2)}
                                </td>
                                <td className="p-6 text-sm text-text-secondary">
                                    {new Date(quotation.createdAt).toLocaleDateString('pt-BR')}
                                </td>
                                <td className="p-6">
                                    {getStatusBadge(quotation.status)}
                                </td>
                                <td className="p-6 text-right flex justify-end gap-2">
                                    {quotation.status === 'PENDING' && (
                                        <>
                                            <button
                                                onClick={() => handleApprove(quotation.id)}
                                                className="p-2 bg-green-500/10 text-green-500 hover:bg-green-500 hover:text-white rounded-xl transition-colors"
                                                title="Aprovar"
                                            >
                                                <CheckCircle size={18} />
                                            </button>
                                            <button
                                                onClick={() => handleReject(quotation.id)}
                                                className="p-2 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-xl transition-colors"
                                                title="Rejeitar"
                                            >
                                                <XCircle size={18} />
                                            </button>
                                        </>
                                    )}
                                    <a
                                        href={QuotationWebService.getPdfUrl(quotation.id)}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="p-2 bg-slate-100 dark:bg-slate-800 text-text-secondary hover:text-text-primary hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors flex items-center gap-1"
                                        title="Baixar PDF"
                                    >
                                        <Download size={18} />
                                    </a>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
