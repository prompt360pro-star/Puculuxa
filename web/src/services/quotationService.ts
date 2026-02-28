import { AuthWebService } from './authService';
import { API_BASE_URL } from '@/config';

const BASE_URL = API_BASE_URL;

const getHeaders = () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${AuthWebService.getToken()}`
});

export interface Quotation {
    id: string;
    eventType: string;
    guestCount: number;
    eventDate: string | null;
    total: number;
    status: string;
    customerName: string | null;
    customerPhone: string | null;
    createdAt: string;
}

export const QuotationWebService = {
    async getAll(): Promise<Quotation[]> {
        try {
            const response = await fetch(`${BASE_URL}/quotations`, {
                headers: getHeaders()
            });
            return await response.json();
        } catch (error) {
            console.error('Error fetching quotations:', error);
            return [];
        }
    },

    async updateStatus(id: string, status: string) {
        const response = await fetch(`${BASE_URL}/quotations/${id}/status`, {
            method: 'PATCH',
            headers: getHeaders(),
            body: JSON.stringify({ status }),
        });
        return await response.json();
    },

    getPdfUrl(id: string) {
        return `${BASE_URL}/quotations/${id}/pdf`;
    }
};
