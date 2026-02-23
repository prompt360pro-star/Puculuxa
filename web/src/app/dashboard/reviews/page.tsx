'use client';

import React, { useEffect, useState } from 'react';
import { Star, Calendar, ShoppingBag } from 'lucide-react';
import { Review } from '@/types';
import { ReviewService } from '@/services/reviewService';

export default function ReviewsPage() {
    const [reviews, setReviews] = useState<Review[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadReviews() {
            try {
                const data = await ReviewService.getAll();
                setReviews(data);
            } catch (error) {
                console.error('Error loading reviews:', error);
            } finally {
                setLoading(false);
            }
        }
        loadReviews();
    }, []);

    const renderStars = (rating: number) => {
        return (
            <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                        key={s}
                        size={16}
                        className={s <= rating ? "fill-puculuxa-gold text-puculuxa-gold" : "text-border-main"}
                    />
                ))}
            </div>
        );
    };

    return (
        <div className="p-8 transition-colors duration-300">
            <header className="mb-12">
                <h1 className="text-3xl font-bold text-text-primary">Avaliações e Feedback</h1>
                <p className="text-text-secondary">O que os clientes estão dizendo sobre a Puculuxa.</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {loading ? (
                    <div className="col-span-full text-center py-12 text-text-secondary">Carregando avaliações...</div>
                ) : reviews.length === 0 ? (
                    <div className="col-span-full text-center py-12 text-text-secondary">Ainda não há avaliações disponíveis.</div>
                ) : reviews.map((review) => (
                    <div key={review.id} className="bg-bg-card p-6 rounded-3xl border border-border-main shadow-sm hover:shadow-md transition-all group">
                        <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-puculuxa-orange/10 flex items-center justify-center text-puculuxa-orange font-bold">
                                    {review.user?.name?.charAt(0).toUpperCase() || 'U'}
                                </div>
                                <div>
                                    <h4 className="font-bold text-text-primary text-sm">{review.user?.name || 'Cliente'}</h4>
                                    <div className="flex items-center gap-2 text-[10px] text-text-secondary">
                                        <Calendar size={10} />
                                        {new Date(review.createdAt).toLocaleDateString('pt-BR')}
                                    </div>
                                </div>
                            </div>
                            {renderStars(review.rating)}
                        </div>

                        <p className="text-sm text-text-secondary mb-6 italic">
                            &quot;{review.comment || 'Sem comentário adicional.'}&quot;
                        </p>

                        <div className="pt-4 border-t border-border-main flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-text-secondary">
                            <div className="flex items-center gap-2">
                                <ShoppingBag size={12} className="text-puculuxa-orange" />
                                Pedido #{review.orderId?.substring(0, 8) || 'N/A'}
                            </div>
                            <span className="bg-puculuxa-orange/10 text-puculuxa-orange px-2 py-1 rounded">Ver Pedido</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
