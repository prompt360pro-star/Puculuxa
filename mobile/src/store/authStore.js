import { create } from 'zustand';
import { ApiService } from '../services/api';

export const useAuthStore = create((set) => ({
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
        const user = await ApiService.getUser();
        if (user) {
            set({ user, isAuthenticated: true });
        }
    }
}));
