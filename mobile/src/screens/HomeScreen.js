import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    Image,
    Dimensions,
    FlatList,
    StatusBar,
    Animated,
    ActivityIndicator,
    RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { Search, Heart, UtensilsCrossed, X, ArrowRight, Flame } from 'lucide-react-native';
import { Theme, T } from '../theme';
import { ProductCardSkeleton } from '../components/ui/Skeleton';
import { useQuery } from '@tanstack/react-query';
import { ApiService } from '../services/api';
import { useFavoritesStore } from '../store/favoritesStore';
import { useAuthStore } from '../store/authStore';
import { formatKz } from '../utils/errorMessages';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48 - 12) / 2;

// === Categories ===
const CATEGORIES = ['Todos', 'Bolos', 'Doces', 'Salgados', 'Bebidas', 'Catering', 'Sobremesas'];

const CategoryPill = React.memo(({ name, active, onPress }) => (
    <TouchableOpacity
        style={[styles.pill, active ? styles.pillActive : null]}
        onPress={onPress}
        activeOpacity={0.8}
        accessibilityRole="tab"
        accessibilityLabel={`Categoria ${name}`}
        accessibilityState={{ selected: active }}
    >
        <Text style={[styles.pillText, active ? styles.pillTextActive : null]}>{name}</Text>
    </TouchableOpacity>
));

// === Product Card ===
const ProductCard = React.memo(({ product, onPress, onQuote }) => {
    const { toggle, isFavorite } = useFavoritesStore();
    const [imageError, setImageError] = useState(false);
    const faved = isFavorite(product.id);
    const heartScale = useRef(new Animated.Value(1)).current;

    const handleFav = useCallback(() => {
        Animated.sequence([
            Animated.timing(heartScale, { toValue: 1.4, duration: 100, useNativeDriver: true }),
            Animated.timing(heartScale, { toValue: 1, duration: 100, useNativeDriver: true }),
        ]).start();
        toggle(product);
    }, [product]);

    return (
        <TouchableOpacity
            style={styles.productCard}
            activeOpacity={0.9}
            onPress={onPress}
            accessibilityRole="button"
            accessibilityLabel={`${product.name}, ${product.price ? formatKz(product.price) : 'Sob consulta'}`}
        >
            {product.image && !imageError ? (
                <Image source={{ uri: product.image }} style={styles.productImage} onError={() => setImageError(true)} />
            ) : (
                <View style={[styles.productImage, styles.productImagePlaceholder]}>
                    <Text style={{ fontSize: 36 }}>🎂</Text>
                </View>
            )}
            <TouchableOpacity
                style={[styles.favBtn, faved ? styles.favBtnActive : null]}
                onPress={handleFav}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                accessibilityRole="button"
                accessibilityLabel={faved ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
            >
                <Animated.View style={{ transform: [{ scale: heartScale }] }}>
                    <Heart size={14} color={faved ? '#E57373' : Theme.colors.textTertiary} fill={faved ? '#E57373' : 'transparent'} />
                </Animated.View>
            </TouchableOpacity>
            <View style={styles.productInfo}>
                <Text style={styles.productName} numberOfLines={2}>{product.name}</Text>
                <View style={styles.priceRow}>
                    <Text style={styles.productPrice}>
                        {product.price ? formatKz(product.price) : 'Sob consulta'}
                    </Text>
                </View>
            </View>
        </TouchableOpacity>
    );
});

// === Greeting by time ===
function getGreeting() {
    const h = new Date().getHours();
    if (h < 12) return { text: 'Bom dia', emoji: '☀️' };
    if (h < 18) return { text: 'Boa tarde', emoji: '🌤️' };
    return { text: 'Boa noite', emoji: '🌙' };
}

// === Main Screen ===
export const HomeScreen = () => {
    const navigation = useNavigation();
    const user = useAuthStore((s) => s.user);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('Todos');
    const [debouncedSearch, setDebouncedSearch] = useState('');

    // Debounce search
    const searchTimeout = useRef(null);
    const handleSearch = useCallback((text) => {
        setSearchTerm(text);
        if (searchTimeout.current) clearTimeout(searchTimeout.current);
        searchTimeout.current = setTimeout(() => setDebouncedSearch(text), 300);
    }, []);

    const clearSearch = useCallback(() => {
        setSearchTerm('');
        setDebouncedSearch('');
    }, []);

    // Fetch products
    const { data: products = [], isLoading, refetch, isRefetching } = useQuery({
        queryKey: ['products'],
        queryFn: () => ApiService.getProducts(),
        staleTime: 5 * 60 * 1000,
    });

    // Filter + search
    const filteredProducts = useMemo(() => {
        let list = products;
        if (selectedCategory !== 'Todos') {
            list = list.filter(p => p.category === selectedCategory);
        }
        if (debouncedSearch.trim()) {
            const q = debouncedSearch.toLowerCase();
            list = list.filter(p => p.name?.toLowerCase().includes(q) || p.description?.toLowerCase().includes(q));
        }
        return list;
    }, [products, selectedCategory, debouncedSearch]);

    const greeting = getGreeting();
    const firstName = user?.name?.split(' ')[0] || '';

    const handleProductPress = useCallback((product) => {
        navigation.navigate('ProductDetail', { product });
    }, [navigation]);

    const renderProduct = useCallback(({ item }) => (
        <ProductCard
            product={item}
            onPress={() => handleProductPress(item)}
        />
    ), [handleProductPress]);

    const getItemLayout = useCallback((_, index) => ({
        length: 230,
        offset: 230 * Math.floor(index / 2),
        index,
    }), []);

    // === List Header Component ===
    const ListHeader = useMemo(() => (
        <>
            {/* Gradient Header */}
            <LinearGradient
                colors={[Theme.colors.gradientStart, Theme.colors.gradientMid, Theme.colors.gradientEnd]}
                style={styles.header}
            >
                <StatusBar barStyle="light-content" />
                <Text style={styles.greeting}>
                    {greeting.text}, {firstName} {greeting.emoji}
                </Text>
                <Text style={styles.greetingSubtitle}>O que vamos preparar hoje?</Text>

                {/* Search pill */}
                <View style={styles.searchPill}>
                    <Search size={18} color={Theme.colors.textTertiary} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Procurar produtos..."
                        placeholderTextColor={Theme.colors.textTertiary}
                        value={searchTerm}
                        onChangeText={handleSearch}
                        returnKeyType="search"
                        accessibilityLabel="Pesquisar produtos"
                    />
                    {searchTerm.length > 0 ? (
                        <TouchableOpacity onPress={clearSearch} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }} accessibilityLabel="Limpar pesquisa">
                            <X size={16} color={Theme.colors.textTertiary} />
                        </TouchableOpacity>
                    ) : null}
                </View>
            </LinearGradient>

            {/* Categories */}
            <FlatList
                data={CATEGORIES}
                horizontal
                showsHorizontalScrollIndicator={false}
                keyExtractor={(item) => item}
                contentContainerStyle={styles.categoriesRow}
                renderItem={({ item }) => (
                    <CategoryPill name={item} active={selectedCategory === item} onPress={() => setSelectedCategory(item)} />
                )}
            />

            {/* Section title */}
            <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>
                    {selectedCategory === 'Todos' ? 'Produtos em destaque' : selectedCategory}
                </Text>
                <Text style={styles.sectionCount}>
                    {filteredProducts.length} {filteredProducts.length === 1 ? 'produto' : 'produtos'}
                </Text>
            </View>
        </>
    ), [greeting, firstName, searchTerm, selectedCategory, filteredProducts.length]);

    // === Empty State ===
    const EmptyState = () => (
        <View style={styles.emptyState}>
            <Text style={{ fontSize: 48, marginBottom: 16 }}>🔍</Text>
            <Text style={styles.emptyTitle}>Nenhum produto encontrado</Text>
            <Text style={styles.emptySubtitle}>Tenta outra categoria ou pesquisa diferente.</Text>
        </View>
    );

    return (
        <View style={styles.container}>
            <FlatList
                data={filteredProducts}
                numColumns={2}
                renderItem={renderProduct}
                keyExtractor={(item) => item.id}
                ListHeaderComponent={ListHeader}
                ListEmptyComponent={isLoading ? (
                    <View style={styles.skeletonGrid}>
                        {[1, 2, 3, 4].map(i => <ProductCardSkeleton key={i} />)}
                    </View>
                ) : <EmptyState />}
                contentContainerStyle={styles.listContent}
                columnWrapperStyle={styles.columnWrapper}
                getItemLayout={getItemLayout}
                maxToRenderPerBatch={6}
                windowSize={5}
                removeClippedSubviews={true}
                refreshControl={
                    <RefreshControl
                        refreshing={isRefetching}
                        onRefresh={refetch}
                        colors={[Theme.colors.primary]}
                        tintColor={Theme.colors.primary}
                    />
                }
            />

            {/* Floating CTA */}
            <TouchableOpacity
                style={styles.floatingCta}
                onPress={() => navigation.navigate('QuotationTab')}
                activeOpacity={0.9}
                accessibilityRole="button"
                accessibilityLabel="Pedir Orçamento para o meu Evento"
            >
                <LinearGradient
                    colors={[Theme.colors.primary, Theme.colors.primaryDark]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.floatingCtaGradient}
                >
                    <UtensilsCrossed size={18} color={Theme.colors.white} />
                    <Text style={styles.floatingCtaText}>Pedir Orçamento →</Text>
                </LinearGradient>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Theme.colors.background,
    },
    listContent: {
        paddingBottom: 80,
    },

    // Header
    header: {
        paddingTop: 56,
        paddingBottom: 28,
        paddingHorizontal: 20,
        borderBottomLeftRadius: 28,
        borderBottomRightRadius: 28,
    },
    greeting: {
        fontFamily: 'Merriweather_700Bold',
        fontSize: 24,
        color: Theme.colors.white,
        marginBottom: 4,
    },
    greetingSubtitle: {
        ...T.body,
        color: 'rgba(255,255,255,0.7)',
        marginBottom: 20,
    },
    searchPill: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Theme.colors.white,
        borderRadius: Theme.radius.full,
        paddingHorizontal: 16,
        height: 48,
        gap: 10,
        ...Theme.elevation.sm,
    },
    searchInput: {
        flex: 1,
        fontFamily: T.body.fontFamily,
        fontSize: 14,
        color: Theme.colors.textPrimary,
    },

    // Categories
    categoriesRow: {
        paddingHorizontal: 16,
        paddingVertical: 16,
        gap: 8,
    },
    pill: {
        paddingHorizontal: 18,
        paddingVertical: 10,
        borderRadius: Theme.radius.full,
        backgroundColor: Theme.colors.surfaceElevated,
        borderWidth: 1,
        borderColor: Theme.colors.borderStrong,
    },
    pillActive: {
        backgroundColor: Theme.colors.primary,
        borderColor: Theme.colors.primary,
    },
    pillText: {
        fontFamily: T.bodySmall.fontFamily,
        fontSize: 13,
        color: Theme.colors.textSecondary,
    },
    pillTextActive: {
        color: Theme.colors.white,
        fontFamily: 'Poppins_600SemiBold',
    },

    // Section
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        marginBottom: 12,
    },
    sectionTitle: {
        ...T.h3,
    },
    sectionCount: {
        ...T.bodySmall,
    },

    // Product Grid
    columnWrapper: {
        paddingHorizontal: 18,
        gap: 12,
    },
    productCard: {
        flex: 1,
        backgroundColor: Theme.colors.surfaceElevated,
        borderRadius: Theme.radius.lg,
        overflow: 'hidden',
        marginBottom: 12,
        ...Theme.elevation.xs,
    },
    productImage: {
        width: '100%',
        height: 140,
    },
    productImagePlaceholder: {
        backgroundColor: Theme.colors.surface,
        justifyContent: 'center',
        alignItems: 'center',
    },
    favBtn: {
        position: 'absolute',
        top: 8,
        right: 8,
        width: 30,
        height: 30,
        borderRadius: 15,
        backgroundColor: 'rgba(255,255,255,0.9)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    favBtnActive: {
        backgroundColor: 'rgba(255,255,255,0.95)',
    },
    productInfo: {
        padding: 12,
    },
    productName: {
        fontFamily: 'Poppins_600SemiBold',
        fontSize: 13,
        color: Theme.colors.textPrimary,
        marginBottom: 6,
        lineHeight: 18,
    },
    priceRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    productPrice: {
        ...T.price,
        fontSize: 15,
    },

    // Skeleton
    skeletonGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        paddingHorizontal: 18,
        gap: 12,
    },

    // Empty State
    emptyState: {
        alignItems: 'center',
        paddingVertical: 60,
        paddingHorizontal: 40,
    },
    emptyTitle: {
        ...T.h3,
        textAlign: 'center',
        marginBottom: 8,
    },
    emptySubtitle: {
        ...T.bodySmall,
        textAlign: 'center',
    },

    // Floating CTA
    floatingCta: {
        position: 'absolute',
        bottom: 16,
        left: 20,
        right: 20,
        ...Theme.elevation.lg,
    },
    floatingCtaGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        height: 52,
        borderRadius: 26,
    },
    floatingCtaText: {
        ...T.button,
        color: Theme.colors.white,
    },
});
