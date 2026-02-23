import { AuthWebService } from './authService';
import { API_BASE_URL } from '@/config';

const BASE_URL = API_BASE_URL;

const getHeaders = () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${AuthWebService.getToken()}`
});

import { Product } from '@/types';

export const ProductWebService = {
    async getAll(): Promise<Product[]> {
        try {
            const response = await fetch(`${BASE_URL}/products`, {
                headers: getHeaders()
            });
            return await response.json();
        } catch (error) {
            console.error('Error fetching products:', error);
            return [];
        }
    },

    async create(product: Partial<Product>) {
        const response = await fetch(`${BASE_URL}/products`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(product),
        });
        return await response.json();
    },

    async update(id: string, product: Partial<Product>) {
        const response = await fetch(`${BASE_URL}/products/${id}`, {
            method: 'PATCH',
            headers: getHeaders(),
            body: JSON.stringify(product),
        });
        return await response.json();
    },

    async delete(id: string) {
        const response = await fetch(`${BASE_URL}/products/${id}`, {
            method: 'DELETE',
            headers: getHeaders(),
        });
        return await response.json();
    },

    async uploadImage(file: File) {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch(`${BASE_URL}/products/upload`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${AuthWebService.getToken()}`
            },
            body: formData,
        });
        return await response.json();
    }
};
