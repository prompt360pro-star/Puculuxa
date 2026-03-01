import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_CONFIG } from '../config/api.config';

const BASE_URL = API_CONFIG.BASE_URL;

const getHeaders = async () => {
    const token = await AsyncStorage.getItem('puculuxa_token');
    return {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : '',
    };
};

export const ApiService = {
    async login(email, password) {
        try {
            const response = await fetch(`${BASE_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Falha no login');
            }

            const data = await response.json();
            await AsyncStorage.setItem('puculuxa_token', data.access_token);
            await AsyncStorage.setItem('puculuxa_user', JSON.stringify(data.user));
            return data;
        } catch (error) {
            console.error('Login Error:', error);
            throw error;
        }
    },

    async register(userData) {
        try {
            const response = await fetch(`${BASE_URL}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(userData),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Erro no cadastro');
            }

            return await response.json();
        } catch (error) {
            console.error('Register Error:', error);
            throw error;
        }
    },

    async logout() {
        await AsyncStorage.removeItem('puculuxa_token');
        await AsyncStorage.removeItem('puculuxa_user');
    },

    async postQuotation(data) {
        try {
            const response = await fetch(`${BASE_URL}/quotations`, {
                method: 'POST',
                headers: await getHeaders(),
                body: JSON.stringify(data),
            });

            if (!response.ok) throw new Error('Falha ao enviar orçamento');
            return await response.json();
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    },

    async uploadQuotationImage(uri) {
        try {
            const formData = new FormData();
            formData.append('file', {
                uri,
                name: 'reference.jpg',
                type: 'image/jpeg'
            });

            const token = await AsyncStorage.getItem('puculuxa_token');
            const response = await fetch(`${BASE_URL}/quotations/upload`, {
                method: 'POST',
                headers: {
                    'Authorization': token ? `Bearer ${token}` : '',
                },
                body: formData,
            });

            if (!response.ok) throw new Error('Falha ao enviar imagem');
            return await response.json();
        } catch (error) {
            console.error('Upload Error:', error);
            throw error;
        }
    },

    async getProducts() {
        const response = await fetch(`${BASE_URL}/products`, {
            headers: await getHeaders(),
        });
        if (!response.ok) throw new Error('Falha ao buscar produtos');
        const result = await response.json();
        // A API Backend agora retorna paginação: { data: [...], meta: {...} }
        return result.data || result;
    },

    async getMyOrders() {
        const response = await fetch(`${BASE_URL}/orders/my`, {
            headers: await getHeaders(),
        });
        if (!response.ok) throw new Error('Falha ao buscar histórico de pedidos');
        return await response.json();
    },

    async getUser() {
        const user = await AsyncStorage.getItem('puculuxa_user');
        return user ? JSON.parse(user) : null;
    },

    async updateProfile(data) {
        const response = await fetch(`${BASE_URL}/auth/profile`, {
            method: 'PATCH',
            headers: await getHeaders(),
            body: JSON.stringify(data),
        });
        if (!response.ok) throw new Error('Falha ao actualizar perfil');
        return await response.json();
    }
};
