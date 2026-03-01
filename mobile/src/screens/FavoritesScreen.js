import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, Share } from 'react-native';
import { ArrowLeft, Heart, ShoppingCart, Share2 } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { Theme } from '../theme';
import { useCartStore } from '../store/cartStore';
import { BottomNav } from '../components/ui/BottomNav';

// Simple favorites store — tracks product ids
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

export const FavoritesScreen = () => {
    const navigation = useNavigation();
    const { favorites, toggle } = useFavoritesStore();
    const addItem = useCartStore((s) => s.addItem);

    const handleShareWislist = async () => {
        if (favorites.length === 0) return;
        try {
            const itemsList = favorites.map(f => `- ${f.name}`).join('\n');
            await Share.share({
                message: `💖 Olha a minha Lista de Desejos no Puculuxa:\n\n${itemsList}\n\nFaz o download do app e encomenda já!`,
            });
        } catch (error) {
            console.log(error);
        }
    };

    const renderItem = ({ item }) => (
        <View style={styles.card}>
            {item.image ? (
                <Image source={{ uri: item.image }} style={styles.image} />
            ) : (
                <View style={[styles.image, styles.imagePlaceholder]}>
                    <Text style={{ fontSize: 28 }}>🎂</Text>
                </View>
            )}
            <View style={styles.info}>
                <Text style={styles.name} numberOfLines={2}>{item.name}</Text>
                {item.category && (
                    <Text style={styles.category}>{item.category}</Text>
                )}
                {item.price ? (
                    <Text style={styles.price}>Kz {item.price.toLocaleString('pt-BR')}</Text>
                ) : (
                    <Text style={styles.priceOnRequest}>Sob consulta</Text>
                )}
            </View>
            <View style={styles.actions}>
                <TouchableOpacity
                    style={[styles.icon, { backgroundColor: '#FCE4EC' }]}
                    onPress={() => toggle(item)}
                >
                    <Heart size={18} color="#E57373" fill="#E57373" />
                </TouchableOpacity>
                {item.price && (
                    <TouchableOpacity
                        style={[styles.icon, { backgroundColor: Theme.colors.surface }]}
                        onPress={() => { addItem(item); navigation.goBack(); }}
                    >
                        <ShoppingCart size={18} color={Theme.colors.primary} />
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <ArrowLeft size={22} color={Theme.colors.primary} />
                </TouchableOpacity>
                <Text style={styles.title}>Meus Favoritos</Text>
                {favorites.length > 0 ? (
                    <TouchableOpacity onPress={handleShareWislist} style={styles.shareBtn}>
                        <Share2 size={20} color={Theme.colors.primary} />
                    </TouchableOpacity>
                ) : (
                    <View style={{ width: 40 }} />
                )}
            </View>

            {favorites.length === 0 ? (
                <View style={styles.empty}>
                    <Text style={{ fontSize: 48, marginBottom: 16 }}>💔</Text>
                    <Text style={styles.emptyTitle}>Sem favoritos ainda</Text>
                    <Text style={[styles.emptyText, { marginBottom: 24 }]}>
                        Guarda os teus produtos preferidos tocando no ❤️ no catálogo.
                    </Text>
                    <TouchableOpacity
                        style={{ backgroundColor: Theme.colors.primary, paddingHorizontal: 24, paddingVertical: 14, borderRadius: 12 }}
                        onPress={() => navigation.navigate('Home')}
                    >
                        <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 16 }}>Explorar Catálogo</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <FlatList
                    data={favorites}
                    keyExtractor={(item) => item.id}
                    renderItem={renderItem}
                    contentContainerStyle={styles.list}
                    showsVerticalScrollIndicator={false}
                />
            )}

            <BottomNav />
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Theme.colors.background },
    header: {
        flexDirection: 'row', alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: 60, paddingHorizontal: 24, marginBottom: 16,
    },
    backBtn: {
        width: 40, height: 40, borderRadius: 12,
        backgroundColor: 'white', justifyContent: 'center', alignItems: 'center',
    },
    title: { fontSize: 20, fontWeight: 'bold', color: Theme.colors.primary },
    shareBtn: {
        width: 40, height: 40, borderRadius: 12,
        backgroundColor: '#f5f5f5', justifyContent: 'center', alignItems: 'center',
    },
    list: { paddingHorizontal: 24, paddingBottom: 100 },
    card: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: 'white', borderRadius: 20, padding: 14,
        marginBottom: 12, ...Theme.shadows?.light,
    },
    image: { width: 60, height: 60, borderRadius: 14, marginRight: 14 },
    imagePlaceholder: { backgroundColor: '#fef3e2', justifyContent: 'center', alignItems: 'center' },
    info: { flex: 1 },
    name: { fontSize: 14, fontWeight: 'bold', color: '#333', marginBottom: 2 },
    category: { fontSize: 11, color: '#aaa', marginBottom: 4 },
    price: { fontSize: 16, fontWeight: 'bold', color: Theme.colors.primary },
    priceOnRequest: { fontSize: 12, color: Theme.colors.textSecondary, fontStyle: 'italic' },
    actions: { gap: 8 },
    icon: {
        width: 36, height: 36, borderRadius: 10,
        justifyContent: 'center', alignItems: 'center', marginLeft: 4,
    },
    empty: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32 },
    emptyTitle: { fontSize: 20, fontWeight: 'bold', color: Theme.colors.textSecondary, marginBottom: 8 },
    emptyText: { fontSize: 14, color: Theme.colors.textSecondary, textAlign: 'center', lineHeight: 22 },
});
