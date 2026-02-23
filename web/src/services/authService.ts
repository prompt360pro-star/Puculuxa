import { API_BASE_URL } from '@/config';

const BASE_URL = API_BASE_URL;

export const AuthWebService = {
    async login(email: string, pass: string) {
        try {
            const response = await fetch(`${BASE_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password: pass }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Falha no login');
            }

            const data = await response.json();
            localStorage.setItem('puculuxa_token', data.access_token);
            localStorage.setItem('puculuxa_user', JSON.stringify(data.user));

            // Cookie para o Middleware do Next.js
            document.cookie = `puculuxa_token=${data.access_token}; path=/; max-age=86400; SameSite=Lax`;

            return data;
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        }
    },

    logout() {
        localStorage.removeItem('puculuxa_token');
        localStorage.removeItem('puculuxa_user');
        document.cookie = 'puculuxa_token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
        window.location.href = '/login';
    },

    getToken() {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('puculuxa_token');
        }
        return null;
    },

    getUser() {
        if (typeof window !== 'undefined') {
            const user = localStorage.getItem('puculuxa_user');
            return user ? JSON.parse(user) : null;
        }
        return null;
    },

    isAuthenticated() {
        return !!this.getToken();
    },

    async getUsers() {
        const token = this.getToken();
        const response = await fetch(`${BASE_URL}/auth/users`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) throw new Error('Falha ao carregar usuários');
        return response.json();
    }
};
