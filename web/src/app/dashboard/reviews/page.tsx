'use client';

import React, { useState } from 'react';
import { Star, Calendar, ShoppingBag, MessageSquare, Search, Send, CheckCircle } from 'lucide-react';
import { ReviewService } from '@/services/reviewService';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface Review {
    id: string;
    userId: string;
    orderId: string;
    rating: number;
    comment?: string;
    adminReply?: string;
    repliedAt?: string;
    createdAt: string;
    user?: { name: string; email?: string };
}

export default function ReviewsPage() {
    const queryClient = useQueryClient();
    const [searchTerm, setSearchTerm] = useState('');
    const [replyingTo, setReplyingTo] = useState<string | null>(null);
    const [replyText, setReplyText] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const PAGE_SIZE = 8;

    const { data: reviews = [], isLoading } = useQuery<Review[]>({
        queryKey: ['reviews'],
        queryFn: () => ReviewService.getAll(),
    });

    const replyMutation = useMutation({
        mutationFn: ({ id, adminReply }: { id: string; adminReply: string }) =>
            ReviewService.replyToFeedback(id, adminReply),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['reviews'] });
            setReplyingTo(null);
            setReplyText('');
        }
    });

    const filteredReviews = reviews.filter(r =>
        r.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.comment?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const totalPages = Math.max(1, Math.ceil(filteredReviews.length / PAGE_SIZE));
    const paginatedReviews = filteredReviews.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
    const handleSearch = (term: string) => { setSearchTerm(term); setCurrentPage(1); };

    const avgRating = reviews.length > 0
        ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)
        : '—';

    const renderStars = (rating: number) => (
        <div className="flex gap-0.5">
            {[1, 2, 3, 4, 5].map((s) => (
                <Star
                    key={s}
                    size={14}
                    className={s <= rating ? 'fill-puculuxa-gold text-puculuxa-gold' : 'text-slate-200 dark:text-slate-700'}
                />
            ))}
        </div>
    );

    return (
        <div className="p-8 transition-colors duration-300">
            <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-text-primary">Avaliações e Feedback</h1>
                    <p className="text-text-secondary">O que os clientes estão dizendo sobre a Puculuxa.</p>
                </div>

                <div className="flex bg-bg-card p-2 rounded-xl border border-border-main items-center gap-2 max-w-sm w-full">
                    <Search size={20} className="text-text-secondary ml-2" />
                    <input
                        type="text"
                        placeholder="Pesquisar cliente ou comentário..."
                        className="bg-transparent outline-none text-sm text-text-primary flex-1"
                        value={searchTerm}
                        onChange={(e) => handleSearch(e.target.value)}
                    />
                </div>
            </header>

            {/* KPI Bar */}
            <div className="grid grid-cols-3 gap-4 mb-8">
                <div className="bg-bg-card border border-border-main rounded-2xl p-5 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-yellow-500/10 flex items-center justify-center">
                        <Star size={22} className="text-yellow-500 fill-yellow-500" />
                    </div>
                    <div>
                        <p className="text-xs font-bold uppercase tracking-widest text-text-secondary">Média Geral</p>
                        <p className="text-3xl font-black text-text-primary">{avgRating}<span className="text-sm font-normal text-text-secondary"> /5</span></p>
                    </div>
                </div>
                <div className="bg-bg-card border border-border-main rounded-2xl p-5 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
                        <MessageSquare size={22} className="text-blue-500" />
                    </div>
                    <div>
                        <p className="text-xs font-bold uppercase tracking-widest text-text-secondary">Total</p>
                        <p className="text-3xl font-black text-text-primary">{reviews.length}</p>
                    </div>
                </div>
                <div className="bg-bg-card border border-border-main rounded-2xl p-5 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center">
                        <CheckCircle size={22} className="text-green-500" />
                    </div>
                    <div>
                        <p className="text-xs font-bold uppercase tracking-widest text-text-secondary">Respondidas</p>
                        <p className="text-3xl font-black text-text-primary">{reviews.filter(r => r.adminReply).length}</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {isLoading ? (
                    <>
                        {[1, 2, 3].map(i => (
                            <div key={i} className="bg-bg-card p-6 rounded-3xl border border-border-main animate-pulse">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700" />
                                    <div className="space-y-2">
                                        <div className="h-4 w-24 bg-slate-200 dark:bg-slate-700 rounded" />
                                        <div className="h-3 w-16 bg-slate-200 dark:bg-slate-700 rounded" />
                                    </div>
                                </div>
                                <div className="h-4 w-full bg-slate-200 dark:bg-slate-700 rounded mb-2" />
                                <div className="h-4 w-3/4 bg-slate-200 dark:bg-slate-700 rounded" />
                            </div>
                        ))}
                    </>
                ) : filteredReviews.length === 0 ? (
                    <div className="col-span-full flex flex-col items-center justify-center py-20 text-text-secondary">
                        <div className="w-20 h-20 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-6">
                            <MessageSquare size={32} className="text-slate-400" />
                        </div>
                        <p className="text-lg font-bold mb-1">Sem avaliações encontradas</p>
                        <p className="text-sm">Tente ajustar o filtro de pesquisa.</p>
                    </div>
                ) : paginatedReviews.map((review) => (
                    <div key={review.id} className="bg-bg-card p-6 rounded-3xl border border-border-main shadow-sm hover:shadow-md transition-all flex flex-col">
                        {/* Header */}
                        <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-puculuxa-orange/10 flex items-center justify-center text-puculuxa-orange font-bold text-sm">
                                    {review.user?.name?.charAt(0).toUpperCase() || 'U'}
                                </div>
                                <div>
                                    <h4 className="font-bold text-text-primary text-sm">{review.user?.name || 'Cliente'}</h4>
                                    <div className="flex items-center gap-1.5 text-[10px] text-text-secondary">
                                        <Calendar size={10} />
                                        {new Date(review.createdAt).toLocaleDateString('pt-BR')}
                                    </div>
                                </div>
                            </div>
                            {renderStars(review.rating)}
                        </div>

                        {/* Comment */}
                        <p className="text-sm text-text-secondary italic flex-1 mb-4">
                            &quot;{review.comment || 'Sem comentário adicional.'}&quot;
                        </p>

                        {/* Admin Reply (if exists) */}
                        {review.adminReply && (
                            <div className="bg-puculuxa-orange/5 border border-puculuxa-orange/20 rounded-xl p-3 mb-4">
                                <p className="text-[10px] font-bold uppercase tracking-widest text-puculuxa-orange mb-1">Resposta da Puculuxa</p>
                                <p className="text-xs text-text-secondary">{review.adminReply}</p>
                            </div>
                        )}

                        {/* Reply Box (inline) */}
                        {replyingTo === review.id ? (
                            <div className="flex gap-2 mt-2">
                                <input
                                    type="text"
                                    className="flex-1 bg-slate-50 dark:bg-slate-800 border border-border-main rounded-xl px-3 py-2 text-sm outline-none focus:border-puculuxa-orange text-text-primary"
                                    placeholder="Escreva a sua resposta..."
                                    value={replyText}
                                    onChange={(e) => setReplyText(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && replyText.trim() && replyMutation.mutate({ id: review.id, adminReply: replyText.trim() })}
                                    autoFocus
                                />
                                <button
                                    onClick={() => replyMutation.mutate({ id: review.id, adminReply: replyText.trim() })}
                                    disabled={!replyText.trim() || replyMutation.isPending}
                                    className="bg-puculuxa-orange text-white p-2.5 rounded-xl hover:bg-puculuxa-orange/90 disabled:opacity-40 transition-all"
                                    title="Enviar resposta"
                                >
                                    <Send size={16} />
                                </button>
                                <button
                                    onClick={() => { setReplyingTo(null); setReplyText(''); }}
                                    className="text-text-secondary px-3 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold transition-colors"
                                >
                                    Cancelar
                                </button>
                            </div>
                        ) : (
                            <div className="pt-4 border-t border-border-main flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-text-secondary">
                                <div className="flex items-center gap-2">
                                    <ShoppingBag size={12} className="text-puculuxa-orange" />
                                    Pedido #{review.orderId?.substring(0, 8) || 'N/A'}
                                </div>
                                <button
                                    onClick={() => setReplyingTo(review.id)}
                                    className="bg-puculuxa-orange/10 text-puculuxa-orange px-3 py-1.5 rounded-lg hover:bg-puculuxa-orange/20 transition-colors"
                                >
                                    {review.adminReply ? 'Editar Resposta' : 'Responder'}
                                </button>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between mt-8 px-2">
                    <span className="text-xs text-text-secondary font-bold">
                        Página {currentPage} de {totalPages} &middot; {filteredReviews.length} avaliações
                    </span>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                            disabled={currentPage === 1}
                            className="px-4 py-2 text-xs font-bold rounded-xl bg-bg-card border border-border-main text-text-secondary hover:border-puculuxa-orange hover:text-puculuxa-orange disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                        >
                            ← Anterior
                        </button>
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                            <button
                                key={page}
                                onClick={() => setCurrentPage(page)}
                                className={`w-9 h-9 text-xs font-bold rounded-xl transition-all ${page === currentPage
                                        ? 'bg-puculuxa-orange text-white shadow-puculuxa'
                                        : 'bg-bg-card border border-border-main text-text-secondary hover:border-puculuxa-orange'
                                    }`}
                            >
                                {page}
                            </button>
                        ))}
                        <button
                            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                            disabled={currentPage === totalPages}
                            className="px-4 py-2 text-xs font-bold rounded-xl bg-bg-card border border-border-main text-text-secondary hover:border-puculuxa-orange hover:text-puculuxa-orange disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                        >
                            Próximo →
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
