import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const useFavoritesStore = create(
    persist(
        (set, get) => ({
            favorites: [],
            toggle: (product) => {
                const exists = get().favorites.find(p => p.id === product.id);
                set({
                    favorites: exists
                        ? get().favorites.filter(p => p.id !== product.id)
                        : [...get().favorites, product]
                });
            },
            isFavorite: (id) => !!get().favorites.find(p => p.id === id),
        }),
        {
            name: 'puculuxa_favorites',
            storage: createJSONStorage(() => AsyncStorage),
        }
    )
);
