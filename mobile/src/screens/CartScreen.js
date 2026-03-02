import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, Switch, TextInput } from 'react-native';
import { ChevronLeft, Trash2, Plus, Minus, ShoppingBag } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { Theme, T } from '../theme';
import { useCartStore } from '../store/cartStore';
import { useToastStore } from '../store/toastStore';
import { PremiumButton } from '../components/ui/PremiumButton';
import { formatKz } from '../utils/errorMessages';

export const CartScreen = () => {
    const navigation = useNavigation();
    const { items, updateQuantity, removeItem, getCartTotal, clearCart } = useCartStore();
    const { show } = useToastStore();
    const [usePoints, setUsePoints] = useState(false);
    const [couponCode, setCouponCode] = useState('');
    const [discountValue, setDiscountValue] = useState(0);

    const subtotal = Number(getCartTotal()) || 0;
    const deliveryFee = subtotal > 0 ? 2500 : 0;
    const pointsDiscount = usePoints ? 5000 : 0;
    const total = Math.max(0, subtotal + deliveryFee - pointsDiscount - discountValue);

    const applyCoupon = () => {
        if (couponCode.toUpperCase() === 'FINAL20') {
            setDiscountValue(subtotal * 0.20);
            show({ type: 'success', message: '20% de desconto aplicado!' });
        } else {
            setDiscountValue(0);
            show({ type: 'warning', message: 'Cupão inválido.' });
        }
    };

    const handleCheckout = () => {
        if (items.length === 0) return;
        const orderData = {
            items: items.map(i => ({
                productId: i.id,
                name: i.name || 'Produto',
                quantity: i.quantity,
                price: parseFloat(String(i.price).replace(/[^0-9,-]+/g, '').replace(',', '.')) || 0,
            })),
            subtotal, deliveryFee, total,
            status: 'PENDENTE',
        };
        navigation.navigate('Payment', { orderData });
    };

    const renderItem = ({ item }) => (
        <View style={styles.cartItem}>
            {item.image ? (
                <Image source={{ uri: item.image }} style={styles.itemImage} />
            ) : (
                <View style={[styles.itemImage, styles.imagePlaceholder]}>
                    <Text style={{ fontSize: 28 }}>🎂</Text>
                </View>
            )}
            <View style={styles.itemInfo}>
                <Text style={styles.itemName} numberOfLines={2}>{item.name}</Text>
                <Text style={styles.itemPrice}>{formatKz(item.price)}</Text>
                <View style={styles.quantityRow}>
                    <TouchableOpacity style={styles.qtyBtn} onPress={() => updateQuantity(item.id, item.quantity - 1)} accessibilityLabel="Diminuir quantidade">
                        <Minus size={14} color={Theme.colors.textSecondary} />
                    </TouchableOpacity>
                    <Text style={styles.qtyText}>{item.quantity}</Text>
                    <TouchableOpacity style={styles.qtyBtn} onPress={() => updateQuantity(item.id, item.quantity + 1)} accessibilityLabel="Aumentar quantidade">
                        <Plus size={14} color={Theme.colors.textSecondary} />
                    </TouchableOpacity>
                </View>
            </View>
            <TouchableOpacity style={styles.deleteBtn} onPress={() => { removeItem(item.id); show({ type: 'info', message: 'Removido do carrinho' }); }} accessibilityLabel="Remover item">
                <Trash2 size={18} color={Theme.colors.error} />
            </TouchableOpacity>
        </View>
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} accessibilityLabel="Voltar">
                    <ChevronLeft size={22} color={Theme.colors.primary} />
                </TouchableOpacity>
                <Text style={styles.title}>O Meu Carrinho</Text>
                <View style={{ width: 40 }} />
            </View>

            {items.length === 0 ? (
                <View style={styles.empty}>
                    <ShoppingBag size={64} color={Theme.colors.borderStrong} style={{ marginBottom: 16 }} />
                    <Text style={styles.emptyTitle}>Carrinho vazio</Text>
                    <Text style={styles.emptyText}>Adiciona delícias ao teu carrinho.</Text>
                    <PremiumButton title="Explorar Catálogo" onPress={() => navigation.navigate('Home')} size="md" style={{ marginTop: 24 }} />
                </View>
            ) : (
                <>
                    <FlatList data={items} renderItem={renderItem} keyExtractor={i => i.id} contentContainerStyle={styles.list} showsVerticalScrollIndicator={false} />
                    <View style={styles.footer}>
                        {/* Points banner */}
                        <View style={styles.pointsBanner}>
                            <View>
                                <Text style={styles.pointsTitle}>Usar Pontos Puculuxa?</Text>
                                <Text style={styles.pointsDesc}>500 pts = -Kz 5.000</Text>
                            </View>
                            <Switch value={usePoints} onValueChange={setUsePoints} trackColor={{ false: Theme.colors.border, true: Theme.colors.primary }} thumbColor={Theme.colors.white} />
                        </View>

                        {/* Coupon */}
                        <View style={styles.couponRow}>
                            <TextInput style={styles.couponInput} placeholder="Código de cupão" placeholderTextColor={Theme.colors.textTertiary} value={couponCode} onChangeText={setCouponCode} />
                            <TouchableOpacity style={styles.couponBtn} onPress={applyCoupon} accessibilityLabel="Aplicar cupão">
                                <Text style={styles.couponBtnText}>Aplicar</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Summary */}
                        <View style={styles.summaryRow}><Text style={styles.summaryLabel}>Subtotal</Text><Text style={styles.summaryValue}>{formatKz(subtotal)}</Text></View>
                        <View style={styles.summaryRow}><Text style={styles.summaryLabel}>Taxa de Entrega</Text><Text style={styles.summaryValue}>{formatKz(deliveryFee)}</Text></View>
                        {usePoints ? <View style={styles.summaryRow}><Text style={styles.summaryLabel}>Pontos</Text><Text style={[styles.summaryValue, { color: Theme.colors.success }]}>-{formatKz(pointsDiscount)}</Text></View> : null}
                        {discountValue > 0 ? <View style={styles.summaryRow}><Text style={styles.summaryLabel}>Cupão</Text><Text style={[styles.summaryValue, { color: Theme.colors.success }]}>-{formatKz(discountValue)}</Text></View> : null}

                        <View style={styles.divider} />
                        <View style={styles.summaryRow}><Text style={styles.totalLabel}>Total</Text><Text style={styles.totalValue}>{formatKz(total)}</Text></View>

                        <PremiumButton title="Finalizar Pedido" onPress={handleCheckout} size="lg" style={{ marginTop: 16 }} />
                    </View>
                </>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Theme.colors.background },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 56, paddingHorizontal: 20, paddingBottom: 12 },
    backBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: Theme.colors.surfaceElevated, justifyContent: 'center', alignItems: 'center', ...Theme.elevation.xs },
    title: { ...T.h3, color: Theme.colors.primary },
    list: { paddingHorizontal: 20, paddingBottom: 16 },
    cartItem: { flexDirection: 'row', backgroundColor: Theme.colors.surfaceElevated, borderRadius: Theme.radius.lg, padding: 12, marginBottom: 12, alignItems: 'center', ...Theme.elevation.xs },
    itemImage: { width: 72, height: 72, borderRadius: 12, marginRight: 14 },
    imagePlaceholder: { backgroundColor: Theme.colors.surface, justifyContent: 'center', alignItems: 'center' },
    itemInfo: { flex: 1 },
    itemName: { fontFamily: 'Poppins_600SemiBold', fontSize: 14, color: Theme.colors.textPrimary, marginBottom: 4 },
    itemPrice: { ...T.price, fontSize: 14, marginBottom: 8 },
    quantityRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: Theme.colors.surface, borderRadius: Theme.radius.sm, paddingHorizontal: 6, paddingVertical: 4, width: 90, justifyContent: 'space-between' },
    qtyBtn: { padding: 4 },
    qtyText: { fontFamily: 'Poppins_600SemiBold', fontSize: 14, color: Theme.colors.textPrimary },
    deleteBtn: { padding: 12 },
    footer: { backgroundColor: Theme.colors.surfaceElevated, padding: 20, borderTopLeftRadius: 24, borderTopRightRadius: 24, ...Theme.elevation.md },
    pointsBanner: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: Theme.colors.surface, padding: 14, borderRadius: Theme.radius.md, marginBottom: 16, borderWidth: 1, borderColor: Theme.colors.border },
    pointsTitle: { fontFamily: 'Poppins_600SemiBold', fontSize: 13, color: Theme.colors.primary },
    pointsDesc: { ...T.bodySmall, fontSize: 11, marginTop: 2 },
    couponRow: { flexDirection: 'row', marginBottom: 16, gap: 8 },
    couponInput: { flex: 1, height: 44, backgroundColor: Theme.colors.surface, borderRadius: Theme.radius.sm, paddingHorizontal: 14, fontFamily: T.body.fontFamily, fontSize: 14, color: Theme.colors.textPrimary, borderWidth: 1, borderColor: Theme.colors.border },
    couponBtn: { height: 44, backgroundColor: Theme.colors.primary, paddingHorizontal: 16, borderRadius: Theme.radius.sm, justifyContent: 'center' },
    couponBtnText: { ...T.buttonSmall, color: Theme.colors.white },
    summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
    summaryLabel: { ...T.bodySmall },
    summaryValue: { ...T.body, fontFamily: 'Poppins_500Medium', fontSize: 14 },
    divider: { height: 1, backgroundColor: Theme.colors.border, marginVertical: 10 },
    totalLabel: { ...T.h3, fontSize: 16 },
    totalValue: { ...T.priceLarge, fontSize: 22 },
    empty: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32 },
    emptyTitle: { ...T.h3, marginBottom: 8, textAlign: 'center' },
    emptyText: { ...T.body, color: Theme.colors.textSecondary, textAlign: 'center' },
});
