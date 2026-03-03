import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_CONFIG } from '../config/api.config';

const BASE_URL = API_CONFIG.BASE_URL;

/**
 * Retry automático com backoff exponencial.
 * Só para erros de rede e 5xx — nunca para 4xx (erro do cliente).
 */
const fetchWithRetry = async (url, options, retries = 3, delay = 800) => {
    try {
        const response = await fetch(url, options);
        if (response.status >= 500 && retries > 0) {
            await new Promise(r => setTimeout(r, delay));
            return fetchWithRetry(url, options, retries - 1, delay * 2);
        }
        return response;
    } catch (err) {
        if (retries > 0) {
            await new Promise(r => setTimeout(r, delay));
            return fetchWithRetry(url, options, retries - 1, delay * 2);
        }
        throw err;
    }
};

const getHeaders = async () => {
    const token = await AsyncStorage.getItem('puculuxa_token');
    return {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : '',
    };
};

const fetchWithAuth = async (url, options = {}) => {
    let headers = await getHeaders();
    if (options.headers) {
        headers = { ...headers, ...options.headers };
    }

    let response;
    try {
        response = await fetch(url, { ...options, headers });

        if (!response.ok && response.status !== 401) {
            console.error('[API Error]', {
                url,
                method: options.method || 'GET',
                status: response.status,
            });
        }
    } catch (error) {
        console.error('[Network Error]', {
            url,
            method: options.method || 'GET',
            message: error.message,
        });
        throw error;
    }

    // Automatic Token Refresh Interceptor
    if (response.status === 401) {
        try {
            const refreshToken = await AsyncStorage.getItem('puculuxa_refresh_token');
            const userStr = await AsyncStorage.getItem('puculuxa_user');

            if (refreshToken && userStr) {
                const user = JSON.parse(userStr);
                const refreshRes = await fetch(`${BASE_URL}/auth/refresh`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ userId: user.id, refreshToken })
                });

                if (refreshRes.ok) {
                    const data = await refreshRes.json();
                    await AsyncStorage.setItem('puculuxa_token', data.access_token);
                    if (data.refresh_token) {
                        await AsyncStorage.setItem('puculuxa_refresh_token', data.refresh_token);
                    }

                    // Retry original request with new token
                    headers['Authorization'] = `Bearer ${data.access_token}`;
                    if (options.headers && options.headers['Authorization']) {
                        options.headers['Authorization'] = headers['Authorization'];
                    }
                    response = await fetch(url, { ...options, headers });
                } else {
                    await ApiService.logout();
                }
            } else {
                await ApiService.logout();
            }
        } catch (e) {
            await ApiService.logout();
        }
    }

    return response;
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
            if (data.refresh_token) {
                await AsyncStorage.setItem('puculuxa_refresh_token', data.refresh_token);
            }
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
        await AsyncStorage.removeItem('puculuxa_refresh_token');
        await AsyncStorage.removeItem('puculuxa_user');
    },

    async postQuotation(data) {
        try {
            const response = await fetchWithAuth(`${BASE_URL}/quotations`, {
                method: 'POST',
                body: JSON.stringify(data),
            });

            if (!response.ok) throw new Error('Falha ao enviar orçamento');
            return await response.json();
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    },

    async updateQuotationStatus(id, status) {
        try {
            const response = await fetchWithAuth(`${BASE_URL}/quotations/${id}/status`, {
                method: 'PATCH',
                body: JSON.stringify({ status }),
            });
            if (!response.ok) throw new Error('Falha ao mudar estado da proposta');
            return await response.json();
        } catch (error) {
            console.error('Update Status Error:', error);
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

            // For multipart/form-data, do not set 'Content-Type', let fetch set it with boundary
            const token = await AsyncStorage.getItem('puculuxa_token');
            const response = await fetchWithAuth(`${BASE_URL}/quotations/upload`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'multipart/form-data',
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
        const response = await fetchWithAuth(`${BASE_URL}/products`);
        if (!response.ok) throw new Error('Falha ao buscar produtos');
        const result = await response.json();
        return result.data || result;
    },

    async getMyQuotations() {
        const response = await fetchWithAuth(`${BASE_URL}/quotations/my`);
        if (!response.ok) throw new Error('Falha ao buscar orçamentos em curso');
        return await response.json();
    },

    async getMyOrders() {
        const response = await fetchWithAuth(`${BASE_URL}/orders/my`);
        if (!response.ok) throw new Error('Falha ao buscar histórico de pedidos');
        return await response.json();
    },

    async getUser() {
        const user = await AsyncStorage.getItem('puculuxa_user');
        return user ? JSON.parse(user) : null;
    },

    async postOrder(data) {
        try {
            const response = await fetchWithAuth(`${BASE_URL}/orders`, {
                method: 'POST',
                body: JSON.stringify(data),
            });

            if (!response.ok) throw new Error('Falha ao criar pedido');
            return await response.json();
        } catch (error) {
            console.error('Order API Error:', error);
            throw error;
        }
    },

    async updateProfile(data) {
        const response = await fetchWithAuth(`${BASE_URL}/auth/profile`, {
            method: 'PATCH',
            body: JSON.stringify(data),
        });
        if (!response.ok) throw new Error('Falha ao actualizar perfil');
        return await response.json();
    },

    async getMyMessages() {
        const response = await fetchWithAuth(`${BASE_URL}/chat/my`);
        if (!response.ok) throw new Error('Falha ao buscar mensagens');
        return await response.json();
    },

    async sendChatMessage(text) {
        const response = await fetchWithAuth(`${BASE_URL}/chat/my`, {
            method: 'POST',
            body: JSON.stringify({ text }),
        });
        if (!response.ok) throw new Error('Falha ao enviar mensagem');
        return await response.json();
    },

    async getBlockedDates() {
        // Doesn't need auth according to controller
        const response = await fetch(`${BASE_URL}/quotations/blocked-dates`);
        if (!response.ok) throw new Error('Falha ao buscar datas bloqueadas');
        return await response.json();
    }
};
