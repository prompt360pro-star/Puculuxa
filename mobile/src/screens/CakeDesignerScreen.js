import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Animated, Platform } from 'react-native';
import { ChevronLeft, Plus, Minus, Palette, Layers, ShoppingBag } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { Theme } from '../theme';
import { useCartStore } from '../store/cartStore';

export const CakeDesignerScreen = () => {
    const navigation = useNavigation();
    const { addToCart } = useCartStore();
    const [tiers, setTiers] = useState(2);
    const [color, setColor] = useState('#FFC0CB');

    const COLORS = [
        { name: 'Rosa Pastel', value: '#FFC0CB' },
        { name: 'Branco Baunilha', value: '#FFF8DC' },
        { name: 'Chocolate Escuro', value: '#3B2F2F' },
        { name: 'Azul Tiffany', value: '#81D8D0' },
        { name: 'Ouro Real', value: '#D4AF37' }
    ];

    const handleAddToCart = () => {
        const customCake = {
            id: `cake-${Date.now()}`,
            name: `Bolo Personalizado (${tiers} Andares)`,
            price: 15000 + (tiers * 10000), // Base 15k + 10k per tier
            quantity: 1,
            image: null
        };
        addToCart(customCake);
        navigation.navigate('Cart');
    };

    const renderCakeTiers = () => {
        let cakeTiers = [];
        const baseWidth = 180;
        const widthDecrement = 30;
        const tierHeight = 50;

        for (let i = 0; i < tiers; i++) {
            // i=0 is top tier. The bottom tier must be the widest.
            const currentWidth = baseWidth - ((tiers - 1 - i) * widthDecrement);
            cakeTiers.push(
                <View
                    key={i}
                    style={[
                        styles.piece,
                        {
                            width: Math.max(80, currentWidth),
                            height: tierHeight,
                            backgroundColor: color,
                            zIndex: tiers - i
                        }
                    ]}
                >
                    <View style={styles.pieceShadow} />
                </View>
            );
        }
        return cakeTiers;
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <ChevronLeft size={24} color={Theme.colors.primary} />
                </TouchableOpacity>
                <Text style={styles.title}>Estúdio do Bolo</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content}>

                <View style={styles.previewContainer}>
                    <Text style={styles.previewTitle}>Visualização em Tempo Real</Text>
                    <View style={styles.stage}>
                        <View style={styles.cakeWrapper}>
                            {renderCakeTiers()}
                            <View style={styles.cakeBase} />
                        </View>
                    </View>
                </View>

                <View style={styles.controlsContainer}>
                    <Text style={styles.controlSectionTitle}><Layers size={18} color="#333" /> Andares (1-5)</Text>
                    <View style={styles.tiersControl}>
                        <TouchableOpacity style={[styles.roundBtn, tiers <= 1 && styles.disabledBtn]} onPress={() => setTiers(Math.max(1, tiers - 1))} disabled={tiers <= 1}>
                            <Minus size={20} color={tiers <= 1 ? '#aaa' : 'white'} />
                        </TouchableOpacity>
                        <Text style={styles.tiersValue}>{tiers}</Text>
                        <TouchableOpacity style={[styles.roundBtn, tiers >= 5 && styles.disabledBtn]} onPress={() => setTiers(Math.min(5, tiers + 1))} disabled={tiers >= 5}>
                            <Plus size={20} color={tiers >= 5 ? '#aaa' : 'white'} />
                        </TouchableOpacity>
                    </View>

                    <Text style={[styles.controlSectionTitle, { marginTop: 24 }]}><Palette size={18} color="#333" /> Cobertura Principal</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.colorsScroll}>
                        {COLORS.map((c, idx) => (
                            <TouchableOpacity
                                key={idx}
                                style={[styles.colorSquare, { backgroundColor: c.value }, color === c.value && styles.colorSquareActive]}
                                onPress={() => setColor(c.value)}
                                activeOpacity={0.8}
                            />
                        ))}
                    </ScrollView>
                    <Text style={styles.colorName}>{COLORS.find(c => c.value === color)?.name}</Text>
                </View>

            </ScrollView>

            <View style={styles.footer}>
                <View style={styles.priceRow}>
                    <Text style={styles.priceLabel}>Preço Base Estimado:</Text>
                    <Text style={styles.priceValue}>Kz {(15000 + (tiers * 10000)).toLocaleString('pt-BR')}</Text>
                </View>
                <TouchableOpacity style={styles.addToCartBtn} onPress={handleAddToCart}>
                    <ShoppingBag size={20} color="white" />
                    <Text style={styles.addToCartText}>Adicionar ao Carrinho</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Theme.colors.background },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 60, paddingHorizontal: 24, paddingBottom: 16, backgroundColor: 'white', ...Theme.shadows?.light, zIndex: 10 },
    backBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#f5f5f5', justifyContent: 'center', alignItems: 'center' },
    title: { fontSize: 20, fontWeight: 'bold', color: Theme.colors.primary },
    content: { paddingBottom: 120 },
    previewContainer: { padding: 24, paddingBottom: 0, alignItems: 'center' },
    previewTitle: { fontSize: 14, fontWeight: '600', color: Theme.colors.textSecondary, marginBottom: 16, textTransform: 'uppercase', letterSpacing: 1 },
    stage: { width: '100%', height: 300, backgroundColor: 'white', borderRadius: 24, justifyContent: 'flex-end', alignItems: 'center', paddingBottom: 40, ...Theme.shadows?.medium },
    cakeWrapper: { alignItems: 'center' },
    piece: {
        borderRadius: 8,
        borderBottomLeftRadius: 0,
        borderBottomRightRadius: 0,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.05)',
        marginBottom: -1,
        alignItems: 'center',
        justifyContent: 'flex-end',
        overflow: 'hidden'
    },
    pieceShadow: { width: '100%', height: 8, backgroundColor: 'rgba(0,0,0,0.1)' },
    cakeBase: { width: 220, height: 16, backgroundColor: '#E0E0E0', borderRadius: 8, elevation: 4 },
    controlsContainer: { padding: 24 },
    controlSectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 16, flexDirection: 'row', alignItems: 'center' },
    tiersControl: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', alignSelf: 'flex-start', borderRadius: 24, padding: 8, ...Theme.shadows?.light },
    roundBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: Theme.colors.primary, justifyContent: 'center', alignItems: 'center' },
    disabledBtn: { backgroundColor: '#f0f0f0' },
    tiersValue: { fontSize: 20, fontWeight: 'bold', color: '#333', marginHorizontal: 24 },
    colorsScroll: { flexDirection: 'row' },
    colorSquare: { width: 50, height: 50, borderRadius: 25, marginRight: 16, borderWidth: 3, borderColor: 'white', ...Theme.shadows?.light },
    colorSquareActive: { borderColor: Theme.colors.primary, transform: [{ scale: 1.1 }] },
    colorName: { marginTop: 12, fontSize: 14, color: Theme.colors.textSecondary, fontWeight: '500' },
    footer: { position: 'absolute', bottom: 0, width: '100%', padding: 24, backgroundColor: 'white', borderTopLeftRadius: 24, borderTopRightRadius: 24, ...Theme.shadows?.medium },
    priceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    priceLabel: { fontSize: 14, color: Theme.colors.textSecondary },
    priceValue: { fontSize: 22, fontWeight: 'bold', color: Theme.colors.primary },
    addToCartBtn: { flexDirection: 'row', backgroundColor: Theme.colors.primary, paddingVertical: 16, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
    addToCartText: { color: 'white', fontSize: 16, fontWeight: 'bold', marginLeft: 8 }
});
