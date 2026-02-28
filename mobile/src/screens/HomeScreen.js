import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TextInput,
    TouchableOpacity,
    Image,
    Dimensions
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { Search, ShoppingCart, User, UtensilsCrossed, Heart } from 'lucide-react-native';
import { Theme } from '../theme';
import { Skeleton } from '../components/ui/Skeleton';
import { useQuery } from '@tanstack/react-query';
import { ApiService } from '../services/api';
import { useFavoritesStore } from '../store/favoritesStore';


const { width } = Dimensions.get('window');

const EMOJI_MAP = { 'Bolos': 'ðŸŽ‚', 'Salgados': 'ðŸ¥', 'Sobremesas': 'ðŸ®', 'Bebidas': 'ðŸ¥¤', 'Outros': 'ðŸ‘¨â€ðŸ³', 'Todos': 'ðŸŒŸ' };

const CategoryItem = ({ name, active, onPress }) => (
    <TouchableOpacity style={[styles.categoryCard, active && styles.categoryCardActive]} onPress={onPress}>
        <View style={[styles.categoryIconContainer, active && styles.categoryIconActive]}>
            <Text style={{ fontSize: 24 }}>{EMOJI_MAP[name] || 'ðŸ°'}</Text>
        </View>
        <Text style={[styles.categoryText, active && styles.categoryTextActive]}>{name}</Text>
    </TouchableOpacity>
);

const ProductCard = ({ product }) => {
    const navigation = useNavigation();
    const { toggle, isFavorite } = useFavoritesStore();
    const faved = isFavorite(product.id);
    return (
        <TouchableOpacity
            style={styles.productCard}
            activeOpacity={0.9}
            onPress={() => navigation.navigate('ProductDetail', { product })}
        >
            {product.image
                ? <Image source={{ uri: product.image }} style={styles.productImage} />
                : <View style={[styles.productImage, { backgroundColor: '#fef3e2', justifyContent: 'center', alignItems: 'center' }]}>
                    <Text style={{ fontSize: 36 }}>ðŸŽ‚</Text>
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
        </View>
    );
};


export const HomeScreen = () => {
    const navigation = useNavigation();
    const [searchTerm, setSearchTerm] = React.useState('');
    const [selectedCategory, setSelectedCategory] = React.useState('Todos');

    const { data: apiProducts = [], isLoading: loading } = useQuery({
        queryKey: ['products'],
        queryFn: ApiService.getProducts,
    });

    const categories = React.useMemo(() => {
        const cats = [...new Set(apiProducts.map(p => p.category).filter(Boolean))];
        return ['Todos', ...cats];
    }, [apiProducts]);

    const filteredProducts = apiProducts.filter(p => {
        const matchSearch = p.name?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchCat = selectedCategory === 'Todos' || p.category === selectedCategory;
        return matchSearch && matchCat;
    });


    const handleStartQuotation = () => {
        navigation.navigate('Quotation');
    };

    const handleOpenProfile = () => {
        navigation.navigate('Profile');
    };

    return (
        <View style={styles.container}>
            <ScrollView showsVerticalScrollIndicator={false}>
                {/* Header Gradient */}
                <LinearGradient
                    colors={[Theme.colors.gradientStart, Theme.colors.gradientMid, Theme.colors.gradientEnd]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.header}
                >
                    <View style={styles.headerTop}>
                        <View style={styles.logoRow}>
                            <Text style={styles.brandTitle}>Puculuxa</Text>
                            <Text style={styles.brandSubtitle}>Cakes & Catering</Text>
                        </View>
                        <View style={styles.headerActions}>
                            <TouchableOpacity style={styles.headerIcon}>
                                <ShoppingCart size={24} color="white" />
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
                            placeholder="O que vocÃª estÃ¡ procurando?"
                            placeholderTextColor={Theme.colors.textSecondary}
                            style={styles.searchInput}
                            value={searchTerm}
                            onChangeText={setSearchTerm}
                        />
                    </View>
                </LinearGradient>

                <View style={styles.content}>
                    {/* Featured Section */}
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Nossas Categorias</Text>
                    </View>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoriesList}>
                        {categories.map((cat) => (
                            <CategoryItem
                                key={cat}
                                name={cat}
                                active={selectedCategory === cat}
                                onPress={() => setSelectedCategory(cat)}
                            />
                        ))}
                    </ScrollView>

                    {/* Product Grid */}
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Mais Populares</Text>
                        <TouchableOpacity>
                            <Text style={styles.seeAll}>Ver todos</Text>
                        </TouchableOpacity>
                    </View>

                    {loading ? (
                        <View style={styles.productGrid}>
                            {[1, 2, 3, 4].map(idx => (
                                <View key={idx} style={styles.productCard}>
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
                    ) : filteredProducts.length === 0 ? (
                        <View style={styles.emptyContainer}>
                            <Text style={{ fontSize: 40 }}>ðŸ§</Text>
                            <Text style={styles.emptyText}>NÃ£o encontramos esse bolo. Mas podemos fazer um especial para vocÃª!</Text>
                            <TouchableOpacity style={styles.emptyButton} onPress={handleStartQuotation}>
                                <Text style={styles.emptyButtonText}>PEDIR ORÃ‡AMENTO PERSONALIZADO</Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <View style={styles.productGrid}>
                            {filteredProducts.map(product => (
                                <ProductCard key={product.id} product={product} />
                            ))}
                        </View>
                    )}
                </View>
            </ScrollView>

            {/* Bottom Navigation Mock */}
            <View style={styles.bottomNav}>
                <TouchableOpacity style={styles.navItem}>
                    <Cake size={24} color={Theme.colors.primary} />
                    <Text style={[styles.navText, { color: Theme.colors.primary }]}>InÃ­cio</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.navItem}>
                    <Star size={24} color={Theme.colors.textSecondary} />
                    <Text style={styles.navText}>CatÃ¡logo</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.navItem} onPress={handleStartQuotation}>
                    <UtensilsCrossed size={24} color={Theme.colors.textSecondary} />
                    <Text style={styles.navText}>Pedido</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.navItem} onPress={handleOpenProfile}>
                    <User size={24} color={Theme.colors.textSecondary} />
                    <Text style={styles.navText}>Perfil</Text>
                </TouchableOpacity>
            </View>
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
