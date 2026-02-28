import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const useCartStore = create(
    persist(
        (set, get) => ({
            items: [],
            addItem: (product) => set((state) => {
                const existingItem = state.items.find(item => item.id === product.id);
                if (existingItem) {
                    return {
                        items: state.items.map(item =>
                            item.id === product.id
                                ? { ...item, quantity: item.quantity + 1 }
                                : item
                        )
                    };
                }
                return { items: [...state.items, { ...product, quantity: 1 }] };
            }),
            removeItem: (productId) => set((state) => ({
                items: state.items.filter(item => item.id !== productId)
            })),
            updateQuantity: (productId, quantity) => set((state) => {
                if (quantity <= 0) {
                    return { items: state.items.filter(item => item.id !== productId) };
                }
                return {
                    items: state.items.map(item =>
                        item.id === productId ? { ...item, quantity } : item
                    )
                };
            }),
            clearCart: () => set({ items: [] }),
            getCartTotal: () => {
                const { items } = get();
                return items.reduce((total, item) => {
                    // Remove "Kz " and dots to parse as number
                    const price = typeof item.price === 'string'
                        ? parseFloat(item.price.replace(/[^0-9,-]+/g, "").replace(',', '.'))
                        : item.price;
                    return total + (price * item.quantity);
                }, 0);
            }
        }),
        {
            name: 'puculuxa-cart-storage',
            storage: createJSONStorage(() => AsyncStorage),
        }
    )
);
