import { AuthWebService } from './authService';
import { API_BASE_URL } from '@/config';

const BASE_URL = API_BASE_URL;

const getHeaders = () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${AuthWebService.getToken()}`
});

import { Order } from '@/types';

export const OrderWebService = {
    async getAll(page: number = 1, limit: number = 20): Promise<Order[]> {
        try {
            const response = await fetch(`${BASE_URL}/orders?page=${page}&limit=${limit}`, {
                headers: getHeaders()
            });
            const result = await response.json();
            return result.data || [];
        } catch (error) {
            console.error('Error fetching orders:', error);
            return [];
        }
    },

    async updateStatus(id: string, status: string) {
        const response = await fetch(`${BASE_URL}/orders/${id}/status`, {
            method: 'PATCH',
            headers: getHeaders(),
            body: JSON.stringify({ status }),
        });
        return await response.json();
    }
};
