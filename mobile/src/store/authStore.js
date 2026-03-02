import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ApiService } from '../services/api';

/**
 * Decoder JWT seguro para Hermes (sem atob).
 */
function decodeJwtPayload(token) {
    try {
        const part = token.split('.')[1];
        if (!part) return null;
        const base64 = part.replace(/-/g, '+').replace(/_/g, '/');
        const padded = base64.padEnd(base64.length + (4 - base64.length % 4) % 4, '=');
        let output = '';
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
        let i = 0;
        while (i < padded.length) {
            const c1 = chars.indexOf(padded[i++]);
            const c2 = chars.indexOf(padded[i++]);
            const c3 = chars.indexOf(padded[i++]);
            const c4 = chars.indexOf(padded[i++]);
            output += String.fromCharCode((c1 << 2) | (c2 >> 4));
            if (c3 !== 64) output += String.fromCharCode(((c2 & 15) << 4) | (c3 >> 2));
            if (c4 !== 64) output += String.fromCharCode(((c3 & 3) << 6) | c4);
        }
        return JSON.parse(output);
    } catch {
        return null;
    }
}

/**
 * Verifica se o token JWT expirou.
 */
function isTokenExpired(token) {
    const payload = decodeJwtPayload(token);
    if (!payload || !payload.exp) return true;
    return Date.now() >= payload.exp * 1000;
}

export const useAuthStore = create((set, get) => ({
    user: null,
    isAuthenticated: false,
    loading: false,

    login: async (email, password) => {
        set({ loading: true });
        try {
            const data = await ApiService.login(email, password);
            set({ user: data.user, isAuthenticated: true, loading: false });
            return data;
        } catch (error) {
            set({ loading: false });
            throw error;
        }
    },

    register: async (userData) => {
        set({ loading: true });
        try {
            await ApiService.register(userData);
            set({ loading: false });
        } catch (error) {
            set({ loading: false });
            throw error;
        }
    },

    logout: async () => {
        await ApiService.logout();
        set({ user: null, isAuthenticated: false });
    },

    restoreSession: async () => {
        try {
            const token = await AsyncStorage.getItem('puculuxa_token');
            if (token && !isTokenExpired(token)) {
                const user = await ApiService.getUser();
                if (user) {
                    set({ user, isAuthenticated: true });
                    return;
                }
            }
            // Token expirado ou inválido — limpar
            set({ user: null, isAuthenticated: false });
        } catch {
            set({ user: null, isAuthenticated: false });
        }
    },
}));
