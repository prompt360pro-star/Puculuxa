import { create } from 'zustand';

export const useToastStore = create((set, get) => ({
    toasts: [],

    show: ({ type = 'info', message, duration = 3500 }) => {
        const id = Date.now() + Math.random();
        const toast = { id, type, message, duration };

        set(state => {
            // Máximo 2 toasts simultâneos
            const current = state.toasts.length >= 2
                ? state.toasts.slice(1)
                : state.toasts;
            return { toasts: [...current, toast] };
        });

        // Auto-remove após duração
        setTimeout(() => {
            set(state => ({
                toasts: state.toasts.filter(t => t.id !== id),
            }));
        }, duration);
    },

    dismiss: (id) => {
        set(state => ({
            toasts: state.toasts.filter(t => t.id !== id),
        }));
    },

    clear: () => set({ toasts: [] }),
}));
