import { AuthWebService } from './authService';
import { API_BASE_URL } from '@/config';

const BASE_URL = `${API_BASE_URL}/feedbacks`;

export const ReviewService = {
    async getAll() {
        try {
            const token = AuthWebService.getToken();
            const response = await fetch(BASE_URL, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Falha ao buscar avaliações');
            }

            const data = await response.json();
            // Garante que o retorno seja sempre um array para evitar erro .map is not a function
            return Array.isArray(data) ? data : [];
        } catch (error) {
            console.error('ReviewService.getAll error:', error);
            return [];
        }
    },

    async create(feedbackData: { orderId: string, rating: number, comment?: string }) {
        const token = AuthWebService.getToken();
        const response = await fetch(BASE_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(feedbackData)
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Falha ao enviar avaliação');
        }

        return response.json();
    },

    async replyToFeedback(id: string, adminReply: string) {
        const token = AuthWebService.getToken();
        const response = await fetch(`${BASE_URL}/${id}/reply`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ adminReply })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Falha ao responder avaliação');
        }

        return response.json();
    }
};
