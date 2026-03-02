import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, Share } from 'react-native';
import { ChevronLeft, Heart, ShoppingCart, Share2 } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { Theme, T } from '../theme';
import { useCartStore } from '../store/cartStore';
import { useFavoritesStore } from '../store/favoritesStore';
import { useToastStore } from '../store/toastStore';
import { PremiumButton } from '../components/ui/PremiumButton';
import { formatKz } from '../utils/errorMessages';

export const FavoritesScreen = () => {
    const navigation = useNavigation();
    const { favorites, toggle } = useFavoritesStore();
    const addItem = useCartStore((s) => s.addItem);
    const { show } = useToastStore();

    const handleShareWishlist = async () => {
        if (favorites.length === 0) return;
        try {
            const itemsList = favorites.map(f => `- ${f.name}`).join('\n');
            await Share.share({
                message: `💖 A minha Lista de Desejos Puculuxa:\n\n${itemsList}\n\nDescobre mais em puculuxa.com!`,
            });
        } catch { }
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
                {item.category ? <Text style={styles.category}>{item.category}</Text> : null}
                <Text style={styles.price}>
                    {item.price ? formatKz(item.price) : 'Sob consulta'}
                </Text>
            </View>
            <View style={styles.actions}>
                <TouchableOpacity
                    style={[styles.iconBtn, { backgroundColor: Theme.colors.errorBg }]}
                    onPress={() => {
                        toggle(item);
                        show({ type: 'info', message: 'Removido dos favoritos' });
                    }}
                    accessibilityLabel="Remover dos favoritos"
                >
                    <Heart size={18} color="#E57373" fill="#E57373" />
                </TouchableOpacity>
                {item.price ? (
                    <TouchableOpacity
                        style={[styles.iconBtn, { backgroundColor: Theme.colors.primaryGhost }]}
                        onPress={() => {
                            addItem(item);
                            show({ type: 'success', message: `${item.name} adicionado ao carrinho!` });
                        }}
                        accessibilityLabel="Adicionar ao carrinho"
                    >
                        <ShoppingCart size={18} color={Theme.colors.primary} />
                    </TouchableOpacity>
                ) : null}
            </View>
        </View>
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} accessibilityLabel="Voltar">
                    <ChevronLeft size={22} color={Theme.colors.primary} />
                </TouchableOpacity>
                <Text style={styles.title}>Os Meus Favoritos</Text>
                {favorites.length > 0 ? (
                    <TouchableOpacity onPress={handleShareWishlist} style={styles.shareBtn} accessibilityLabel="Partilhar lista">
                        <Share2 size={20} color={Theme.colors.primary} />
                    </TouchableOpacity>
                ) : <View style={{ width: 40 }} />}
            </View>

            {favorites.length === 0 ? (
                <View style={styles.empty}>
                    <Text style={{ fontSize: 48, marginBottom: 16 }}>💔</Text>
                    <Text style={styles.emptyTitle}>Sem favoritos ainda</Text>
                    <Text style={styles.emptyText}>
                        Guarda os teus produtos preferidos tocando no ❤️ no catálogo.
                    </Text>
                    <PremiumButton
                        title="Explorar Catálogo"
                        onPress={() => navigation.navigate('Home')}
                        size="md"
                        style={{ marginTop: 24 }}
                    />
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
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Theme.colors.background },
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingTop: 56, paddingHorizontal: 20, paddingBottom: 12,
    },
    backBtn: {
        width: 40, height: 40, borderRadius: 12,
        backgroundColor: Theme.colors.surfaceElevated, justifyContent: 'center', alignItems: 'center',
        ...Theme.elevation.xs,
    },
    title: { ...T.h3, color: Theme.colors.primary },
    shareBtn: {
        width: 40, height: 40, borderRadius: 12,
        backgroundColor: Theme.colors.surfaceElevated, justifyContent: 'center', alignItems: 'center',
        ...Theme.elevation.xs,
    },
    list: { paddingHorizontal: 20, paddingBottom: 32 },
    card: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: Theme.colors.surfaceElevated, borderRadius: Theme.radius.lg, padding: 14,
        marginBottom: 12, ...Theme.elevation.xs,
    },
    image: { width: 60, height: 60, borderRadius: 14, marginRight: 14 },
    imagePlaceholder: { backgroundColor: Theme.colors.surface, justifyContent: 'center', alignItems: 'center' },
    info: { flex: 1 },
    name: { fontFamily: 'Poppins_600SemiBold', fontSize: 14, color: Theme.colors.textPrimary, marginBottom: 2 },
    category: { ...T.bodySmall, fontSize: 11, marginBottom: 4 },
    price: { ...T.price, fontSize: 15 },
    actions: { gap: 8 },
    iconBtn: {
        width: 36, height: 36, borderRadius: 10,
        justifyContent: 'center', alignItems: 'center',
    },
    empty: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32 },
    emptyTitle: { ...T.h3, textAlign: 'center', marginBottom: 8 },
    emptyText: { ...T.body, color: Theme.colors.textSecondary, textAlign: 'center', lineHeight: 22 },
});
