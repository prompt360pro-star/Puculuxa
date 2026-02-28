import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Image,
    Dimensions,
    Share,
    Alert
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { ArrowLeft, Heart, Share2, Star, UtensilsCrossed, Tag, Info } from 'lucide-react-native';
import { Theme } from '../theme';
import { useFavoritesStore } from '../store/favoritesStore';

const { width } = Dimensions.get('window');

export const ProductDetailScreen = ({ route }) => {
    const navigation = useNavigation();
    const { product } = route.params || {};
    const { toggle, isFavorite } = useFavoritesStore();
    const faved = product ? isFavorite(product.id) : false;

    if (!product) {
        return (
            <View style={styles.errorContainer}>
                <Text style={styles.errorIcon}>😕</Text>
                <Text style={styles.errorText}>Produto não encontrado.</Text>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Text style={styles.backBtnText}>Voltar</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const handleShare = async () => {
        try {
            await Share.share({
                message: `🎂 Olha este produto incrível no Puculuxa!\n\n${product.name}\nA partir de Kz ${Number(product.price || 0).toLocaleString('pt-BR')}\n\nBaixe o app e peça já o seu orçamento!`,
            });
        } catch {
            Alert.alert('Erro', 'Não foi possível partilhar.');
        }
    };

    const handleQuote = () => {
        navigation.navigate('Quotation');
    };

    return (
        <View style={styles.container}>
            {/* Hero Image */}
            <View style={styles.imageWrapper}>
                {product.image ? (
                    <Image source={{ uri: product.image }} style={styles.heroImage} resizeMode="cover" />
                ) : (
                    <View style={[styles.heroImage, styles.placeholderImage]}>
                        <Text style={styles.placeholderEmoji}>🎂</Text>
                    </View>
                )}
                <LinearGradient
                    colors={['transparent', 'rgba(0,0,0,0.55)']}
                    style={styles.imageOverlay}
                />
                {/* Overlay Action Bar */}
                <View style={styles.topBar}>
                    <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.goBack()}>
                        <ArrowLeft size={22} color="white" />
                    </TouchableOpacity>
                    <View style={styles.topBarRight}>
                        <TouchableOpacity style={styles.iconBtn} onPress={handleShare}>
                            <Share2 size={20} color="white" />
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.iconBtn, faved && styles.iconBtnActive]}
                            onPress={() => toggle(product)}
                        >
                            <Heart size={20} color={faved ? '#E57373' : 'white'} fill={faved ? '#E57373' : 'transparent'} />
                        </TouchableOpacity>
                    </View>
                </View>
                {product.category && (
                    <View style={styles.categoryBadge}>
                        <Tag size={12} color={Theme.colors.primary} />
                        <Text style={styles.categoryText}>{product.category}</Text>
                    </View>
                )}
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {/* Product Name + Price */}
                <View style={styles.header}>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.productName}>{product.name}</Text>
                        <View style={styles.ratingRow}>
                            {[1, 2, 3, 4, 5].map(i => (
                                <Star key={i} size={14} color={i <= 4 ? Theme.colors.primary : '#ddd'} fill={i <= 4 ? Theme.colors.primary : '#ddd'} />
                            ))}
                            <Text style={styles.ratingText}> 4.8 (47 avaliações)</Text>
                        </View>
                    </View>
                    <View style={styles.priceTag}>
                        <Text style={styles.priceLabel}>A partir de</Text>
                        <Text style={styles.priceValue}>
                            Kz {product.price ? Number(product.price).toLocaleString('pt-BR') : '—'}
                        </Text>
                    </View>
                </View>

                {/* Description */}
                {product.description ? (
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Info size={16} color={Theme.colors.textSecondary} />
                            <Text style={styles.sectionTitle}>Descrição</Text>
                        </View>
                        <Text style={styles.descriptionText}>{product.description}</Text>
                    </View>
                ) : null}

                {/* Details */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <UtensilsCrossed size={16} color={Theme.colors.textSecondary} />
                        <Text style={styles.sectionTitle}>Detalhes</Text>
                    </View>
                    <View style={styles.detailsGrid}>
                        <View style={styles.detailItem}>
                            <Text style={styles.detailIcon}>📦</Text>
                            <Text style={styles.detailLabel}>Disponibilidade</Text>
                            <Text style={styles.detailValue}>Sob Encomenda</Text>
                        </View>
                        <View style={styles.detailItem}>
                            <Text style={styles.detailIcon}>⏱</Text>
                            <Text style={styles.detailLabel}>Prazo</Text>
                            <Text style={styles.detailValue}>3–5 dias úteis</Text>
                        </View>
                        <View style={styles.detailItem}>
                            <Text style={styles.detailIcon}>🎁</Text>
                            <Text style={styles.detailLabel}>Personalização</Text>
                            <Text style={styles.detailValue}>Incluída</Text>
                        </View>
                        <View style={styles.detailItem}>
                            <Text style={styles.detailIcon}>🌍</Text>
                            <Text style={styles.detailLabel}>Entrega</Text>
                            <Text style={styles.detailValue}>Luanda</Text>
                        </View>
                    </View>
                </View>

                <View style={{ height: 120 }} />
            </ScrollView>

            {/* Bottom CTA */}
            <View style={styles.footer}>
                <TouchableOpacity style={styles.quoteButton} onPress={handleQuote} activeOpacity={0.85}>
                    <LinearGradient
                        colors={[Theme.colors.gradientStart, Theme.colors.gradientEnd]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.quoteGradient}
                    >
                        <UtensilsCrossed size={20} color="white" />
                        <Text style={styles.quoteText}>PEDIR ORÇAMENTO</Text>
                    </LinearGradient>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Theme.colors.background },
    imageWrapper: { width, height: 300, position: 'relative' },
    heroImage: { width: '100%', height: '100%' },
    placeholderImage: { backgroundColor: '#fef3e2', justifyContent: 'center', alignItems: 'center' },
    placeholderEmoji: { fontSize: 64 },
    imageOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 120 },
    topBar: {
        position: 'absolute', top: 48, left: 0, right: 0,
        flexDirection: 'row', justifyContent: 'space-between',
        alignItems: 'center', paddingHorizontal: Theme.spacing.xl,
    },
    topBarRight: { flexDirection: 'row', gap: 8 },
    iconBtn: {
        width: 40, height: 40, borderRadius: 20,
        backgroundColor: 'rgba(0,0,0,0.35)',
        justifyContent: 'center', alignItems: 'center',
    },
    iconBtnActive: { backgroundColor: 'rgba(229,115,115,0.2)' },
    categoryBadge: {
        position: 'absolute', bottom: 16, left: Theme.spacing.xl,
        flexDirection: 'row', alignItems: 'center', gap: 4,
        backgroundColor: 'white', paddingHorizontal: 12, paddingVertical: 6,
        borderRadius: Theme.radius.full,
    },
    categoryText: { fontSize: 12, fontWeight: 'bold', color: Theme.colors.primary },
    content: { flex: 1 },
    header: {
        flexDirection: 'row', alignItems: 'flex-start',
        padding: Theme.spacing.xl, paddingBottom: 8,
    },
    productName: {
        fontFamily: Theme.fonts.subtitle,
        fontSize: 24, fontWeight: 'bold',
        color: Theme.colors.accent, flex: 1,
    },
    ratingRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
    ratingText: { fontSize: 12, color: Theme.colors.textSecondary, marginLeft: 4 },
    priceTag: { alignItems: 'flex-end', minWidth: 100 },
    priceLabel: { fontSize: 10, color: Theme.colors.textSecondary, fontWeight: '600', textTransform: 'uppercase' },
    priceValue: { fontSize: 20, fontWeight: 'bold', color: Theme.colors.primary, marginTop: 2 },
    section: { paddingHorizontal: Theme.spacing.xl, paddingVertical: Theme.spacing.md },
    sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
    sectionTitle: { fontSize: 16, fontWeight: 'bold', color: Theme.colors.accent },
    descriptionText: { fontSize: 15, color: Theme.colors.textSecondary, lineHeight: 24 },
    detailsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
    detailItem: {
        width: (width - Theme.spacing.xl * 2 - 12) / 2,
        backgroundColor: 'white', borderRadius: Theme.radius.lg,
        padding: 16, alignItems: 'center',
        ...Theme.shadows.light,
    },
    detailIcon: { fontSize: 24, marginBottom: 8 },
    detailLabel: { fontSize: 11, color: Theme.colors.textSecondary, fontWeight: '600', textTransform: 'uppercase', textAlign: 'center' },
    detailValue: { fontSize: 13, fontWeight: 'bold', color: Theme.colors.accent, marginTop: 4, textAlign: 'center' },
    footer: {
        position: 'absolute', bottom: 0, left: 0, right: 0,
        padding: Theme.spacing.xl, paddingBottom: 40,
        backgroundColor: 'white', borderTopWidth: 1, borderTopColor: Theme.colors.surface,
    },
    quoteButton: { borderRadius: Theme.radius.full, overflow: 'hidden', ...Theme.shadows.medium },
    quoteGradient: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        gap: 12, paddingVertical: 18,
    },
    quoteText: { color: 'white', fontSize: 16, fontWeight: 'bold', letterSpacing: 1 },
    errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
    errorIcon: { fontSize: 48, marginBottom: 12 },
    errorText: { fontSize: 18, color: Theme.colors.textSecondary, marginBottom: 20 },
    backBtn: { backgroundColor: Theme.colors.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: Theme.radius.full },
    backBtnText: { color: 'white', fontWeight: 'bold' },
});
