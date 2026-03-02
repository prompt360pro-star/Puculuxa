import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, Alert, ActivityIndicator, Switch, TextInput, Platform } from 'react-native';
import { ArrowLeft, Trash2, Plus, Minus, ShoppingBag } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { Theme } from '../theme';
import { useCartStore } from '../store/cartStore';
import { ApiService } from '../services/api';

export const CartScreen = () => {
    const navigation = useNavigation();
    const { items, updateQuantity, removeItem, getCartTotal, clearCart } = useCartStore();
    const [loading, setLoading] = useState(false);
    const [usePoints, setUsePoints] = useState(false);
    const [couponCode, setCouponCode] = useState('');
    const [discountValue, setDiscountValue] = useState(0);

    const subtotal = Number(getCartTotal()) || 0;
    const deliveryFee = subtotal > 0 ? 2500 : 0; // Taxa fixa Kz 2.500
    const pointsDiscount = usePoints ? 5000 : 0; // Ex: Usa 500pts = Kz 5.000
    const total = Math.max(0, subtotal + deliveryFee - pointsDiscount - discountValue);

    const applyCoupon = () => {
        if (couponCode.toUpperCase() === 'FINAL20') {
            setDiscountValue(subtotal * 0.20);
            Alert.alert('Cupão Aplicado', '20% de desconto ativado!');
        } else {
            setDiscountValue(0);
            Alert.alert('Cupão Inválido', 'O código que inseriu não é válido.');
        }
    };

    const handleCheckout = () => {
        if (items.length === 0) return;
        const orderData = {
            items: items.map(i => ({ productId: i.id, name: i.name || 'Produto sem nome', quantity: i.quantity, price: parseFloat(String(i.price).replace(/[^0-9,-]+/g, "").replace(',', '.')) || 0 })),
            subtotal, deliveryFee, total,
            status: 'PENDENTE'
        };

        navigation.navigate('Payment', { orderData });
    };

    const renderItem = ({ item }) => (
        <View style={styles.cartItem}>
            {item.image ? (
                <Image source={{ uri: item.image }} style={styles.itemImage} fallback={<View style={[styles.itemImage, styles.imagePlaceholder]}><Image source={require('../../assets/logo.jpeg')} style={{ width: 40, height: 40, opacity: 0.3 }} /></View>} />
            ) : (
                <View style={[styles.itemImage, styles.imagePlaceholder]}><Image source={require('../../assets/logo.jpeg')} style={{ width: 40, height: 40, opacity: 0.3 }} /></View>
            )}
            <View style={styles.itemInfo}>
                <Text style={styles.itemName} numberOfLines={2}>{item.name}</Text>
                <Text style={styles.itemPrice}>Kz {item.price ? Number(item.price.toString().replace(/[^0-9,-]+/g, "").replace(',', '.')).toLocaleString('pt-BR') : '0'}</Text>
                <View style={styles.quantityRow}>
                    <TouchableOpacity style={styles.qtyBtn} onPress={() => updateQuantity(item.id, item.quantity - 1)}>
                        <Minus size={16} color={Theme.colors.textSecondary} />
                    </TouchableOpacity>
                    <Text style={styles.qtyText}>{item.quantity}</Text>
                    <TouchableOpacity style={styles.qtyBtn} onPress={() => updateQuantity(item.id, item.quantity + 1)}>
                        <Plus size={16} color={Theme.colors.textSecondary} />
                    </TouchableOpacity>
                </View>
            </View>
            <TouchableOpacity style={styles.deleteBtn} onPress={() => removeItem(item.id)}>
                <Trash2 size={20} color="#E57373" />
            </TouchableOpacity>
        </View>
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <ArrowLeft size={22} color={Theme.colors.primary} />
                </TouchableOpacity>
                <Text style={styles.title}>Meu Carrinho</Text>
                <View style={{ width: 40 }} />
            </View>

            {items.length === 0 ? (
                <View style={styles.empty}>
                    <ShoppingBag size={64} color={Theme.colors.surface} style={{ marginBottom: 16 }} />
                    <Text style={styles.emptyTitle}>Carrinho Vazio</Text>
                    <Text style={styles.emptyText}>Adicione delícias ao seu carrinho para fazer um pedido.</Text>
                    <TouchableOpacity style={styles.exploreBtn} onPress={() => navigation.navigate('Home')}>
                        <Text style={styles.exploreBtnText}>Explorar Catálogo</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <>
                    <FlatList
                        data={items}
                        renderItem={renderItem}
                        keyExtractor={i => i.id}
                        contentContainerStyle={styles.list}
                        showsVerticalScrollIndicator={false}
                    />
                    <View style={styles.footer}>
                        <View style={styles.pointsBanner}>
                            <View>
                                <Text style={styles.pointsTitle}>Usar Pontos Puculuxa?</Text>
                                <Text style={styles.pointsDesc}>Resgatar 500 pts = -Kz 5.000</Text>
                            </View>
                            <Switch
                                value={usePoints}
                                onValueChange={setUsePoints}
                                trackColor={{ false: '#ddd', true: Theme.colors.primary }}
                                thumbColor="white"
                            />
                        </View>
                        <View style={styles.summaryRow}>
                            <Text style={styles.summaryLabel}>Subtotal</Text>
                            <Text style={styles.summaryValue}>Kz {subtotal.toLocaleString('pt-BR')}</Text>
                        </View>
                        <View style={styles.summaryRow}>
                            <Text style={styles.summaryLabel}>Taxa de Entrega</Text>
                            <Text style={styles.summaryValue}>Kz {deliveryFee.toLocaleString('pt-BR')}</Text>
                        </View>
                        {usePoints ? (
                            <View style={styles.summaryRow}>
                                <Text style={styles.summaryLabel}>Desconto (Pontos)</Text>
                                <Text style={[styles.summaryValue, { color: '#4CAF50' }]}>- Kz 5.000</Text>
                            </View>
                        ) : null}
                        <View style={styles.couponContainer}>
                            <TextInput
                                style={styles.couponInput}
                                placeholder="Insira o cupão"
                                value={couponCode}
                                onChangeText={setCouponCode}
                            />
                            <TouchableOpacity style={styles.couponBtn} onPress={applyCoupon}>
                                <Text style={styles.couponBtnText}>Aplicar</Text>
                            </TouchableOpacity>
                        </View>
                        {discountValue > 0 ? (
                            <View style={styles.summaryRow}>
                                <Text style={styles.summaryLabel}>Desconto (Cupão)</Text>
                                <Text style={[styles.summaryValue, { color: '#4CAF50' }]}>- Kz {discountValue.toLocaleString('pt-BR')}</Text>
                            </View>
                        ) : null}
                        <View style={[styles.summaryRow, styles.totalRow]}>
                            <Text style={styles.totalLabel}>Total</Text>
                            <Text style={styles.totalValue}>Kz {total.toLocaleString('pt-BR')}</Text>
                        </View>
                        <TouchableOpacity style={[styles.checkoutBtn, loading && { opacity: 0.7 }]} onPress={handleCheckout} disabled={loading}>
                            {loading ? <ActivityIndicator color="white" /> : <Text style={styles.checkoutText}>Finalizar Pedido</Text>}
                        </TouchableOpacity>
                    </View>
                </>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Theme.colors.background },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 60, paddingHorizontal: 24, marginBottom: 16 },
    backBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: 'white', justifyContent: 'center', alignItems: 'center' },
    title: { fontSize: 20, fontWeight: 'bold', color: Theme.colors.primary },
    list: { paddingHorizontal: 24, paddingBottom: 24 },
    cartItem: { flexDirection: 'row', backgroundColor: 'white', borderRadius: 20, padding: 12, marginBottom: 16, alignItems: 'center', ...Theme.shadows?.light },
    itemImage: { width: 80, height: 80, borderRadius: 12, marginRight: 16 },
    imagePlaceholder: { backgroundColor: '#fef3e2', justifyContent: 'center', alignItems: 'center' },
    itemInfo: { flex: 1, justifyContent: 'center' },
    itemName: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 4 },
    itemPrice: { fontSize: 14, color: Theme.colors.primary, fontWeight: '600', marginBottom: 8 },
    quantityRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8f8f8', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4, width: 90, justifyContent: 'space-between' },
    qtyBtn: { padding: 4 },
    qtyText: { fontSize: 14, fontWeight: 'bold', color: '#333' },
    deleteBtn: { padding: 12 },
    footer: { backgroundColor: 'white', padding: 24, borderTopLeftRadius: 24, borderTopRightRadius: 24, ...Theme.shadows?.medium },
    pointsBanner: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#FFF8DC', padding: 16, borderRadius: 12, marginBottom: 16, borderWidth: 1, borderColor: '#D4AF37' },
    pointsTitle: { fontWeight: 'bold', color: '#D4AF37', fontSize: 14 },
    pointsDesc: { fontSize: 12, color: Theme.colors.textSecondary, marginTop: 4 },
    couponContainer: { flexDirection: 'row', marginBottom: 16, marginTop: 8 },
    couponInput: { flex: 1, height: 44, backgroundColor: '#f0f0f0', borderRadius: 8, paddingHorizontal: 16, marginRight: 8 },
    couponBtn: { height: 44, backgroundColor: Theme.colors.primary, paddingHorizontal: 16, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
    couponBtnText: { color: 'white', fontWeight: 'bold' },
    summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
    summaryLabel: { fontSize: 14, color: Theme.colors.textSecondary },
    summaryValue: { fontSize: 14, color: Theme.colors.textPrimary, fontWeight: '600' },
    totalRow: { marginTop: 8, paddingTop: 16, borderTopWidth: 1, borderTopColor: '#f0f0f0', marginBottom: 24 },
    totalLabel: { fontSize: 16, fontWeight: 'bold', color: '#333' },
    totalValue: { fontSize: 20, fontWeight: 'bold', color: Theme.colors.primary },
    checkoutBtn: { backgroundColor: Theme.colors.primary, borderRadius: 16, paddingVertical: 16, alignItems: 'center' },
    checkoutText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
    empty: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32 },
    emptyTitle: { fontSize: 20, fontWeight: 'bold', color: Theme.colors.textSecondary, marginBottom: 8 },
    emptyText: { fontSize: 14, color: Theme.colors.textSecondary, textAlign: 'center', lineHeight: 22, marginBottom: 24 },
    exploreBtn: { backgroundColor: Theme.colors.primary, paddingHorizontal: 24, paddingVertical: 14, borderRadius: 12 },
    exploreBtnText: { color: 'white', fontWeight: 'bold', fontSize: 16 }
});
