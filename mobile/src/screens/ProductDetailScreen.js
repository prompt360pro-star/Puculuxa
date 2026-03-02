import React, { useState, useCallback, useRef } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity, Image,
    Dimensions, Animated, Share, StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronLeft, Heart, Share2, Star, ShoppingCart, UtensilsCrossed } from 'lucide-react-native';
import { Theme, T } from '../theme';
import { useFavoritesStore } from '../store/favoritesStore';
import { useCartStore } from '../store/cartStore';
import { useToastStore } from '../store/toastStore';
import { PremiumButton } from '../components/ui/PremiumButton';
import { formatKz } from '../utils/errorMessages';

const { width, height } = Dimensions.get('window');
const HERO_HEIGHT = height * 0.45;

export const ProductDetailScreen = ({ route, navigation }) => {
    const { product } = route.params;
    const { toggle, isFavorite } = useFavoritesStore();
    const { addItem } = useCartStore();
    const { show } = useToastStore();
    const faved = isFavorite(product.id);
    const [imageError, setImageError] = useState(false);
    const heartScale = useRef(new Animated.Value(1)).current;
    const scrollY = useRef(new Animated.Value(0)).current;

    const handleFav = useCallback(() => {
        Animated.sequence([
            Animated.timing(heartScale, { toValue: 1.3, duration: 100, useNativeDriver: true }),
            Animated.timing(heartScale, { toValue: 1, duration: 100, useNativeDriver: true }),
        ]).start();
        toggle(product);
        show({ type: faved ? 'info' : 'brand', message: faved ? 'Removido dos favoritos' : 'Adicionado aos favoritos ❤️' });
    }, [product, faved]);

    const handleAddToCart = useCallback(() => {
        addItem(product);
        show({ type: 'success', message: `${product.name} adicionado ao carrinho!` });
    }, [product]);

    const handleShare = useCallback(async () => {
        try {
            await Share.share({ message: `Vê este produto da Puculuxa: ${product.name} — ${formatKz(product.price)}` });
        } catch { }
    }, [product]);

    const headerOpacity = scrollY.interpolate({
        inputRange: [0, HERO_HEIGHT - 120],
        outputRange: [0, 1],
        extrapolate: 'clamp',
    });

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />

            {/* Animated header bg */}
            <Animated.View style={[styles.headerBg, { opacity: headerOpacity }]} />

            {/* Nav bar */}
            <View style={styles.navBar}>
                <TouchableOpacity style={styles.navBtn} onPress={() => navigation.goBack()} accessibilityLabel="Voltar">
                    <ChevronLeft size={22} color={Theme.colors.white} />
                </TouchableOpacity>
                <View style={styles.navRight}>
                    <TouchableOpacity style={styles.navBtn} onPress={handleShare} accessibilityLabel="Partilhar">
                        <Share2 size={18} color={Theme.colors.white} />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.navBtn} onPress={handleFav} accessibilityLabel={faved ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}>
                        <Animated.View style={{ transform: [{ scale: heartScale }] }}>
                            <Heart size={18} color={faved ? '#E57373' : Theme.colors.white} fill={faved ? '#E57373' : 'transparent'} />
                        </Animated.View>
                    </TouchableOpacity>
                </View>
            </View>

            <Animated.ScrollView
                onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: false })}
                scrollEventThrottle={16}
                showsVerticalScrollIndicator={false}
            >
                {/* Hero Image */}
                {product.image && !imageError ? (
                    <Image source={{ uri: product.image }} style={styles.heroImage} onError={() => setImageError(true)} />
                ) : (
                    <View style={[styles.heroImage, styles.heroPlaceholder]}>
                        <Text style={{ fontSize: 72 }}>🎂</Text>
                    </View>
                )}
                <LinearGradient
                    colors={['transparent', 'rgba(255,254,247,0.6)', Theme.colors.background]}
                    style={styles.heroOverlay}
                />

                {/* Content Card */}
                <View style={styles.content}>
                    {/* Category pill */}
                    {product.category ? (
                        <View style={styles.categoryPill}>
                            <Text style={styles.categoryText}>{product.category}</Text>
                        </View>
                    ) : null}

                    <Text style={styles.productName}>{product.name}</Text>

                    {/* Price */}
                    <Text style={styles.productPrice}>
                        {product.price ? formatKz(product.price) : 'Sob consulta'}
                    </Text>

                    {/* Description */}
                    {product.description ? (
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Descrição</Text>
                            <Text style={styles.description}>{product.description}</Text>
                        </View>
                    ) : null}

                    {/* Details Grid */}
                    <View style={styles.detailsGrid}>
                        {product.servings ? (
                            <View style={styles.detailItem}>
                                <Text style={styles.detailValue}>{product.servings}</Text>
                                <Text style={styles.detailLabel}>Porções</Text>
                            </View>
                        ) : null}
                        {product.preparationTime ? (
                            <View style={styles.detailItem}>
                                <Text style={styles.detailValue}>{product.preparationTime}</Text>
                                <Text style={styles.detailLabel}>Preparação</Text>
                            </View>
                        ) : null}
                        {product.weight ? (
                            <View style={styles.detailItem}>
                                <Text style={styles.detailValue}>{product.weight}</Text>
                                <Text style={styles.detailLabel}>Peso</Text>
                            </View>
                        ) : null}
                    </View>

                    {/* Spacer for actions */}
                    <View style={{ height: 100 }} />
                </View>
            </Animated.ScrollView>

            {/* Fixed action bar */}
            <View style={styles.actionBar}>
                <PremiumButton
                    title="Adicionar ao Carrinho"
                    onPress={handleAddToCart}
                    variant="ghost"
                    size="md"
                    icon={<ShoppingCart size={18} color={Theme.colors.primary} />}
                    style={{ flex: 1 }}
                />
                <PremiumButton
                    title="Pedir Orçamento"
                    onPress={() => navigation.navigate('QuotationTab')}
                    size="md"
                    icon={<UtensilsCrossed size={18} color={Theme.colors.white} />}
                    style={{ flex: 1.2 }}
                />
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Theme.colors.background },
    navBar: {
        position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10,
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        paddingTop: 48, paddingHorizontal: 16, paddingBottom: 8,
    },
    headerBg: {
        position: 'absolute', top: 0, left: 0, right: 0, height: 100, zIndex: 9,
        backgroundColor: Theme.colors.primary,
    },
    navBtn: {
        width: 38, height: 38, borderRadius: 19,
        backgroundColor: 'rgba(0,0,0,0.25)', justifyContent: 'center', alignItems: 'center',
    },
    navRight: { flexDirection: 'row', gap: 10 },
    heroImage: { width, height: HERO_HEIGHT },
    heroPlaceholder: { backgroundColor: Theme.colors.surface, justifyContent: 'center', alignItems: 'center' },
    heroOverlay: { position: 'absolute', top: HERO_HEIGHT - 80, left: 0, right: 0, height: 80 },
    content: { paddingHorizontal: 20, marginTop: -24, backgroundColor: Theme.colors.background, borderTopLeftRadius: 24, borderTopRightRadius: 24 },
    categoryPill: { alignSelf: 'flex-start', backgroundColor: Theme.colors.primaryGhost, paddingHorizontal: 12, paddingVertical: 4, borderRadius: Theme.radius.full, marginBottom: 10, marginTop: 20 },
    categoryText: { ...T.label, color: Theme.colors.primary },
    productName: { ...T.h1, marginBottom: 8 },
    productPrice: { ...T.priceLarge, marginBottom: 20 },
    section: { marginBottom: 20 },
    sectionTitle: { ...T.h3, marginBottom: 8 },
    description: { ...T.body, lineHeight: 24 },
    detailsGrid: { flexDirection: 'row', gap: 12, marginBottom: 20 },
    detailItem: { flex: 1, backgroundColor: Theme.colors.surfaceElevated, borderRadius: Theme.radius.md, padding: 14, alignItems: 'center', ...Theme.elevation.xs },
    detailValue: { fontFamily: 'Merriweather_700Bold', fontSize: 18, color: Theme.colors.primary, marginBottom: 4 },
    detailLabel: { ...T.bodySmall },
    actionBar: {
        position: 'absolute', bottom: 0, left: 0, right: 0,
        flexDirection: 'row', gap: 10,
        paddingHorizontal: 16, paddingVertical: 12, paddingBottom: 28,
        backgroundColor: Theme.colors.surfaceElevated,
        borderTopWidth: 1, borderTopColor: Theme.colors.border,
        ...Theme.elevation.lg,
    },
});
