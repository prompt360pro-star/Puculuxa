import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TextInput,
    TouchableOpacity,
    Image,
    Dimensions,
    FlatList,
    StatusBar
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { Search, ShoppingCart, User, UtensilsCrossed, Heart, Star, ChevronRight, ChevronDown } from 'lucide-react-native';
import { Theme } from '../theme';
import { Skeleton } from '../components/ui/Skeleton';
import { BottomNav } from '../components/ui/BottomNav';
import { useQuery } from '@tanstack/react-query';
import { ApiService } from '../services/api';
import { useFavoritesStore } from '../store/favoritesStore';
import { useCartStore } from '../store/cartStore';


const { width } = Dimensions.get('window');

const EMOJI_MAP = { 'Bolos': '🎂', 'Salgados': '🥟', 'Sobremesas': '🍮', 'Bebidas': '🍹', 'Catering': '👨‍🍳', 'Decoração': '🎈', 'Doces': '🍬', 'Todos': '🌟' };
const CATEGORY_LIST = ['Todos', 'Bolos', 'Doces', 'Salgados', 'Bebidas', 'Catering', 'Decoração', 'Sobremesas'];

const CategoryItem = ({ name, active, onPress }) => (
    <TouchableOpacity style={[styles.categoryCard, active && styles.categoryCardActive]} onPress={onPress}>
        <View style={[styles.categoryIconContainer, active && styles.categoryIconActive]}>
            <Text style={{ fontSize: 24 }}>{EMOJI_MAP[name] || '🍰'}</Text>
        </View>
        <Text style={[styles.categoryText, active && styles.categoryTextActive]}>{name}</Text>
    </TouchableOpacity>
);

const ProductCard = ({ product }) => {
    const navigation = useNavigation();
    const { toggle, isFavorite } = useFavoritesStore();
    const [imageError, setImageError] = React.useState(false);
    const faved = isFavorite(product.id);
    return (
        <TouchableOpacity
            style={styles.productCard}
            activeOpacity={0.9}
            onPress={() => navigation.navigate('ProductDetail', { product })}
        >
            {product.image && !imageError
                ? <Image source={{ uri: product.image }} style={styles.productImage} onError={() => setImageError(true)} />
                : <View style={[styles.productImage, { backgroundColor: '#fef3e2', justifyContent: 'center', alignItems: 'center' }]}>
                    <Text style={{ fontSize: 36 }}>🎂</Text>
                </View>
            }
            <TouchableOpacity style={[styles.favBtn, faved && styles.favBtnActive]} onPress={() => toggle(product)}>
                <Heart size={14} color={faved ? '#E57373' : '#aaa'} fill={faved ? '#E57373' : 'transparent'} />
            </TouchableOpacity>
            <View style={styles.productInfo}>
                <Text style={styles.productName} numberOfLines={2}>{product.name}</Text>
                <View style={styles.priceRow}>
                    <Text style={styles.productPrice}>
                        {product.price ? `Kz ${Number(product.price).toLocaleString('pt-BR')}` : 'Sob consulta'}
                    </Text>
                    <TouchableOpacity style={styles.addButton} onPress={() => navigation.navigate('Quotation')}>
                        <UtensilsCrossed size={16} color="white" />
                    </TouchableOpacity>
                </View>
            </View>
        </TouchableOpacity>
    );
};

export const HomeScreen = () => {
    const navigation = useNavigation();
    const [searchTerm, setSearchTerm] = React.useState('');
    const [selectedCategory, setSelectedCategory] = React.useState('Todos');
    const [debouncedSearch, setDebouncedSearch] = React.useState('');
    const [sortOrder, setSortOrder] = React.useState('relevance');
    const cartItemsCount = useCartStore((s) => s.items?.length || 0);

    const toggleSort = () => {
        if (sortOrder === 'relevance') setSortOrder('priceAsc');
        else if (sortOrder === 'priceAsc') setSortOrder('priceDesc');
        else setSortOrder('relevance');
    };

    const getSortLabel = () => {
        if (sortOrder === 'priceAsc') return 'Menor Preço';
        if (sortOrder === 'priceDesc') return 'Maior Preço';
        return 'Relevância';
    };

    React.useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(searchTerm), 300);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    const { data: apiProducts = [], isLoading: loading } = useQuery({
        queryKey: ['products'],
        queryFn: ApiService.getProducts,
    });

    const categories = CATEGORY_LIST;

    const filteredProducts = apiProducts.filter(p => {
        const matchSearch = p.name?.toLowerCase().includes(debouncedSearch.toLowerCase());
        const matchCat = selectedCategory === 'Todos' || p.category === selectedCategory;
        return matchSearch && matchCat;
    }).sort((a, b) => {
        if (sortOrder === 'priceAsc') return a.price - b.price;
        if (sortOrder === 'priceDesc') return b.price - a.price;
        return 0;
    });


    const handleStartQuotation = () => {
        navigation.navigate('Quotation');
    };

    const handleOpenProfile = () => {
        navigation.navigate('Profile');
    };

    return (
        <View style={styles.container}>
            <FlatList
                data={filteredProducts}
                keyExtractor={(item) => item.id}
                numColumns={2}
                columnWrapperStyle={{ justifyContent: 'space-between', paddingHorizontal: Theme.spacing.xl, marginBottom: 16 }}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 100 }}
                ListEmptyComponent={
                    loading ? (
                        <View style={[styles.productGrid, { paddingHorizontal: Theme.spacing.xl }]}>
                            {[1, 2, 3, 4].map(idx => (
                                <View key={idx} style={[styles.productCard, { width: (width - Theme.spacing.xl * 2 - 16) / 2 }]}>
                                    <Skeleton width="100%" height={150} borderRadius={0} />
                                    <View style={styles.productInfo}>
                                        <Skeleton width="70%" height={16} style={{ marginBottom: 8 }} />
                                        <View style={styles.priceRow}>
                                            <Skeleton width="40%" height={16} />
                                            <Skeleton width={30} height={30} borderRadius={Theme.radius.md} />
                                        </View>
                                    </View>
                                </View>
                            ))}
                        </View>
                    ) : (
                        <View style={styles.emptyContainer}>
                            <Text style={{ fontSize: 40, marginBottom: 12 }}>🔍</Text>
                            <Text style={[styles.emptyText, { textAlign: 'center' }]}>
                                {debouncedSearch ? "Nenhum produto encontrado" : "Ainda não temos produtos nesta categoria."}
                            </Text>
                        </View>
                    )
                }
                renderItem={({ item }) => (
                    <ProductCard product={item} />
                )}
                ListHeaderComponent={
                    <>
                        {/* Header Gradient */}
                        <LinearGradient
                            colors={[Theme.colors.gradientStart, Theme.colors.gradientMid, Theme.colors.gradientEnd]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.header}
                        >
                            <View style={styles.headerTop}>
                                <View style={styles.logoRow}>
                                    <Image source={require('../../assets/logo.jpeg')} style={styles.headerLogo} />
                                    <View>
                                        <Text style={styles.brandTitle}>Puculuxa</Text>
                                        <Text style={styles.brandSubtitle}>Cakes & Catering</Text>
                                    </View>
                                </View>
                                <View style={styles.headerActions}>
                                    <TouchableOpacity style={styles.headerIcon} onPress={() => navigation.navigate('Cart')}>
                                        <ShoppingCart size={24} color="white" />
                                        {cartItemsCount > 0 && (
                                            <View style={styles.badge}>
                                                <Text style={styles.badgeText}>{cartItemsCount}</Text>
                                            </View>
                                        )}
                                    </TouchableOpacity>
                                    <TouchableOpacity style={styles.headerIcon} onPress={handleOpenProfile}>
                                        <User size={24} color="white" />
                                    </TouchableOpacity>
                                </View>
                            </View>

                            {/* Search Bar with Scalloped feel */}
                            <View style={styles.searchContainer}>
                                <Search size={20} color={Theme.colors.textSecondary} style={styles.searchIcon} />
                                <TextInput
                                    placeholder="O que você está procurando?"
                                    placeholderTextColor={Theme.colors.textSecondary}
                                    style={styles.searchInput}
                                    value={searchTerm}
                                    onChangeText={setSearchTerm}
                                />
                            </View>
                        </LinearGradient>

                        <View style={{ marginTop: 20 }}>
                            {/* Promo Banner */}
                            <View style={{ marginHorizontal: 20, marginBottom: 24, backgroundColor: Theme.colors.accent, borderRadius: 16, padding: 20, flexDirection: 'row', alignItems: 'center' }}>
                                <View style={{ flex: 1 }}>
                                    <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 18, marginBottom: 4 }}>Surpresa de Fim-de-Semana!</Text>
                                    <Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: 13, marginBottom: 12 }}>Use o código FINAL20 para 20% de desconto em bolos clássicos.</Text>
                                    <TouchableOpacity style={{ backgroundColor: 'white', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 8, alignSelf: 'flex-start' }}>
                                        <Text style={{ color: Theme.colors.accent, fontWeight: 'bold', fontSize: 12 }}>COPIAR CÓDIGO</Text>
                                    </TouchableOpacity>
                                </View>
                                <Text style={{ fontSize: 48 }}>🎁</Text>
                            </View>

                            {/* Categorias */}
                            <View style={[styles.section, { flex: 1, paddingBottom: 0 }]}>
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                                    <Text style={styles.sectionTitle}>Nosso Catálogo</Text>
                                    <TouchableOpacity onPress={toggleSort} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                                        <Text style={{ fontSize: 12, color: Theme.colors.primary, fontWeight: 'bold' }}>{getSortLabel()}</Text>
                                        <ChevronDown size={14} color={Theme.colors.primary} />
                                    </TouchableOpacity>
                                </View>
                                <FlatList
                                    data={categories}
                                    horizontal
                                    showsHorizontalScrollIndicator={false}
                                    keyExtractor={(item) => item}
                                    contentContainerStyle={styles.categoriesList}
                                    renderItem={({ item: cat }) => (
                                        <CategoryItem
                                            name={cat}
                                            active={selectedCategory === cat}
                                            onPress={() => setSelectedCategory(cat)}
                                        />
                                    )}
                                />
                            </View>

                            <TouchableOpacity
                                style={{ backgroundColor: '#FFEBF0', borderRadius: 16, padding: 20, marginHorizontal: 20, marginBottom: 24, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
                                onPress={() => navigation.navigate('CakeDesigner')}
                                activeOpacity={0.8}
                            >
                                <View style={{ flex: 1 }}>
                                    <Text style={{ fontSize: 18, fontWeight: 'bold', color: Theme.colors.primary, marginBottom: 4 }}>Crie o Seu Bolo!</Text>
                                    <Text style={{ fontSize: 13, color: Theme.colors.textSecondary }}>Personalize andares e cores no nosso Estúdio 3D.</Text>
                                </View>
                                <Text style={{ fontSize: 40, marginLeft: 16 }}>🎂</Text>
                            </TouchableOpacity>

                            {/* Pacotes e Combos */}
                            <View style={[styles.section, { marginTop: 8 }]}>
                                <Text style={styles.sectionTitle}>Pacotes Especiais</Text>
                                <Text style={{ fontSize: 13, color: Theme.colors.textSecondary, marginBottom: 16 }}>Poupe até 30% com os nossos combos</Text>
                                <ScrollView horizontal showsHorizontalScrollIndicator={false} decelerationRate="fast" snapToInterval={296}>
                                    {[
                                        { title: 'Combo Festa Infantil', price: 'Kz 85.000', img: 'https://images.unsplash.com/photo-1530105832479-e2f4eb78d384?q=80&w=400&auto=format&fit=crop' },
                                        { title: 'Kit Casamento Civil', price: 'Kz 150.000', img: 'https://images.unsplash.com/photo-1542475141-94578b8871ab?q=80&w=400&auto=format&fit=crop' }
                                    ].map((bundle, idx) => (
                                        <View key={idx} style={{ width: 280, borderRadius: 16, marginRight: 16, backgroundColor: 'white', overflow: 'hidden', ...Theme.shadows?.light }}>
                                            <Image source={{ uri: bundle.img }} style={{ width: '100%', height: 140, backgroundColor: '#f0f0f0' }} />
                                            <View style={{ padding: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <View>
                                                    <Text style={{ fontWeight: 'bold', fontSize: 16, color: Theme.colors.primary }}>{bundle.title}</Text>
                                                    <Text style={{ fontSize: 14, color: Theme.colors.textSecondary, marginTop: 4 }}>A partir de {bundle.price}</Text>
                                                </View>
                                                <TouchableOpacity style={{ backgroundColor: '#f0f0f0', padding: 8, borderRadius: 8 }}>
                                                    <Text style={{ fontSize: 20 }}>🛒</Text>
                                                </TouchableOpacity>
                                            </View>
                                        </View>
                                    ))}
                                </ScrollView>
                            </View>

                            {/* Portfólio / Inspirações */}
                            <View style={[styles.section, { marginTop: 8, paddingBottom: 100 }]}>
                                <Text style={styles.sectionTitle}>Galeria Premium</Text>
                                <Text style={{ fontSize: 13, color: Theme.colors.textSecondary, marginBottom: 16 }}>Inspirações dos nossos melhores eventos</Text>
                                <ScrollView horizontal showsHorizontalScrollIndicator={false} decelerationRate="fast" snapToInterval={296}>
                                    {[
                                        'https://images.unsplash.com/photo-1535141192574-5d4897c12636?q=80&w=400&auto=format&fit=crop',
                                        'https://images.unsplash.com/photo-1621303837174-89787a7d4729?q=80&w=400&auto=format&fit=crop',
                                        'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?q=80&w=400&auto=format&fit=crop'
                                    ].map((img, idx) => (
                                        <Image key={idx} source={{ uri: img }} style={{ width: 280, height: 200, borderRadius: 16, marginRight: 16, backgroundColor: '#f0f0f0' }} />
                                    ))}
                                </ScrollView>
                            </View>
                        </View>
                    </>
                }
            />

            {/* Bottom Navigation Mock Replaced with Real Navigation Component */}
            <BottomNav />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Theme.colors.background,
    },
    header: {
        paddingTop: 60,
        paddingBottom: 30,
        paddingHorizontal: Theme.spacing.xl,
        borderBottomLeftRadius: Theme.radius.xl,
        borderBottomRightRadius: Theme.radius.xl,
    },
    headerTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Theme.spacing.xl,
    },
    logoRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    headerLogo: {
        width: 44,
        height: 44,
        borderRadius: 22,
        marginRight: 12,
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.2)'
    },
    brandTitle: {
        fontFamily: Theme.fonts.title,
        fontSize: 32,
        color: 'white',
    },
    brandSubtitle: {
        fontFamily: Theme.fonts.subtitle,
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.9)',
        marginTop: -5,
    },
    headerActions: {
        flexDirection: 'row',
    },
    headerIcon: {
        marginLeft: Theme.spacing.md,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        padding: Theme.spacing.sm,
        borderRadius: Theme.radius.md,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'white',
        borderRadius: Theme.radius.lg,
        paddingHorizontal: Theme.spacing.lg,
        height: 50,
        ...Theme.shadows.light,
    },
    searchIcon: {
        marginRight: Theme.spacing.sm,
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
        color: Theme.colors.textSecondary,
    },
    content: {
        paddingTop: Theme.spacing.xl,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: Theme.spacing.xl,
        marginBottom: Theme.spacing.lg,
    },
    sectionTitle: {
        fontFamily: Theme.fonts.subtitle,
        fontSize: 20,
        color: Theme.colors.accent,
    },
    seeAll: {
        color: Theme.colors.primary,
        fontWeight: '600',
    },
    categoriesList: {
        paddingLeft: Theme.spacing.xl,
        paddingBottom: Theme.spacing.lg,
    },
    categoryCard: {
        alignItems: 'center',
        marginRight: Theme.spacing.lg,
        width: 80,
    },
    categoryIconContainer: {
        width: 60,
        height: 60,
        backgroundColor: Theme.colors.surface,
        borderRadius: Theme.radius.full,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: Theme.spacing.sm,
        borderWidth: 1,
        borderColor: Theme.colors.detail,
    },
    categoryCardActive: {
        // Estilo extra para ativo
    },
    categoryIconActive: {
        backgroundColor: Theme.colors.primary,
        borderColor: Theme.colors.primary,
    },
    categoryText: {
        fontSize: 12,
        color: Theme.colors.textSecondary,
        textAlign: 'center',
    },
    categoryTextActive: {
        color: Theme.colors.primary,
        fontWeight: 'bold',
    },
    productGrid: {
        paddingHorizontal: Theme.spacing.xl,
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        paddingBottom: 100,
    },
    productCard: {
        width: (width - 48 - 16) / 2, // 2 colunas com gutter
        backgroundColor: 'white',
        borderRadius: Theme.radius.lg,
        marginBottom: Theme.spacing.lg,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: Theme.colors.surface,
        ...Theme.shadows.light,
    },
    productImage: {
        width: '100%',
        height: 150,
        backgroundColor: '#f0f0f0',
    },
    favBtn: {
        position: 'absolute',
        top: 8,
        right: 8,
        width: 28,
        height: 28,
        borderRadius: 8,
        backgroundColor: 'rgba(255,255,255,0.85)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    favBtnActive: {
        backgroundColor: '#FCE4EC',
    },
    tagContainer: {
        position: 'absolute',
        top: 8,
        left: 8,
        flexDirection: 'row',
    },
    tag: {
        backgroundColor: 'rgba(232, 245, 233, 0.9)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
        marginRight: 4,
    },
    tagText: {
        fontSize: 10,
        color: Theme.colors.accent,
        fontWeight: 'bold',
    },
    productInfo: {
        padding: Theme.spacing.md,
    },
    productName: {
        fontSize: 14,
        fontWeight: 'bold',
        color: Theme.colors.textSecondary,
        marginBottom: 4,
    },
    priceRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    productPrice: {
        fontSize: 14,
        color: Theme.colors.primary,
        fontWeight: 'bold',
    },
    addButton: {
        backgroundColor: Theme.colors.secondary,
        padding: 6,
        borderRadius: Theme.radius.md,
    },
    bottomNav: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 80,
        backgroundColor: 'white',
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        paddingBottom: 20,
        borderTopWidth: 1,
        borderTopColor: Theme.colors.surface,
        ...Theme.shadows.light,
    },
    navItem: {
        alignItems: 'center',
    },
    navText: {
        fontSize: 10,
        color: Theme.colors.textSecondary,
        marginTop: 4,
    },
    loadingContainer: {
        padding: Theme.spacing.huge,
        alignItems: 'center',
        justifyContent: 'center',
    },
    loadingText: {
        fontFamily: Theme.fonts.subtitle,
        color: Theme.colors.textSecondary,
        fontSize: 14,
        marginTop: Theme.spacing.md,
    },
    emptyContainer: {
        padding: Theme.spacing.huge,
        alignItems: 'center',
        justifyContent: 'center',
    },
    emptyText: {
        fontFamily: Theme.fonts.subtitle,
        color: Theme.colors.textSecondary,
        fontSize: 14,
        textAlign: 'center',
        marginVertical: Theme.spacing.xl,
        paddingHorizontal: Theme.spacing.xl,
    },
    emptyButton: {
        backgroundColor: Theme.colors.primary,
        paddingHorizontal: Theme.spacing.xl,
        paddingVertical: Theme.spacing.md,
        borderRadius: Theme.radius.lg,
    },
    emptyButtonText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 12,
    }
});
