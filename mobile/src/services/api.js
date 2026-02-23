import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE_URL = 'http://localhost:3000';

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

    async getProducts() {
        try {
            const response = await fetch(`${BASE_URL}/products`, {
                headers: await getHeaders(),
            });
            if (!response.ok) return [];
            return await response.json();
        } catch (error) {
            console.error('API Error:', error);
            return [];
        }
    },

    async getUser() {
        const user = await AsyncStorage.getItem('puculuxa_user');
        return user ? JSON.parse(user) : null;
    }
};
