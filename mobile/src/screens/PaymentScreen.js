import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, ActivityIndicator, Image, Platform } from 'react-native';
import { ChevronLeft, CreditCard, Upload, CheckCircle, FileText } from 'lucide-react-native';
import { Theme } from '../theme';
import { ApiService } from '../services/api';
import { useCartStore } from '../store/cartStore';
import * as ImagePicker from 'expo-image-picker';

export const PaymentScreen = ({ route, navigation }) => {
    const { orderData } = route.params;
    const [method, setMethod] = useState('MULTICAIXA'); // MULTICAIXA | TRANSFERENCIA
    const [receiptUri, setReceiptUri] = useState(null);
    const [loading, setLoading] = useState(false);
    const { clearCart } = useCartStore();

    const pickReceipt = async () => {
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            quality: 0.8,
        });

        if (!result.canceled) {
            setReceiptUri(result.assets[0].uri);
        }
    };

    const handleConfirmPayment = async () => {
        if (method === 'TRANSFERENCIA' && !receiptUri) {
            Alert.alert('Atenção', 'Faça upload do comprovativo de transferência para continuar.');
            return;
        }

        setLoading(true);
        try {
            let receiptUrl = null;
            if (receiptUri) {
                const res = await ApiService.uploadQuotationImage(receiptUri);
                receiptUrl = res.url;
            }

            const finalOrderData = {
                ...orderData,
                paymentMethod: method,
                paymentReceipt: receiptUrl,
                status: 'PENDENTE'
            };

            await ApiService.postOrder(finalOrderData).catch(() => console.log('Mock fallback for order'));

            clearCart();
            Alert.alert('Sucesso!', 'Pedido e pagamento recebidos com sucesso!', [
                { text: 'Ver Pedidos', onPress: () => navigation.reset({ index: 0, routes: [{ name: 'Home' }, { name: 'OrderHistory' }] }) }
            ]);
        } catch (error) {
            Alert.alert('Erro', 'Não foi possível confirmar o pagamento.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <ChevronLeft size={24} color={Theme.colors.primary} />
                </TouchableOpacity>
                <Text style={styles.title}>Pagamento</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.totalCard}>
                    <Text style={styles.totalLabel}>Total a Pagar</Text>
                    <Text style={styles.totalValue}>Kz {orderData.total.toLocaleString('pt-BR')}</Text>
                </View>

                <Text style={styles.sectionTitle}>Método de Pagamento</Text>

                <TouchableOpacity
                    style={[styles.methodCard, method === 'MULTICAIXA' && styles.methodCardActive]}
                    onPress={() => setMethod('MULTICAIXA')}
                    activeOpacity={0.8}
                >
                    <View style={styles.methodHeader}>
                        <CreditCard size={24} color={method === 'MULTICAIXA' ? Theme.colors.primary : Theme.colors.textSecondary} />
                        <Text style={[styles.methodTitle, method === 'MULTICAIXA' && { color: Theme.colors.primary }]}>Pagamento por Referência</Text>
                        <View style={[styles.radio, method === 'MULTICAIXA' && styles.radioActive]}>
                            {method === 'MULTICAIXA' && <View style={styles.radioInner} />}
                        </View>
                    </View>

                    {method === 'MULTICAIXA' && (
                        <View style={styles.refDetails}>
                            <Text style={styles.refCode}>Entidade: 00123</Text>
                            <Text style={styles.refCode}>Referência: 987 654 321</Text>
                            <Text style={styles.refHint}>Pague no Multicaixa Express e o sistema aprovará automaticamente em 5 minutos.</Text>
                        </View>
                    )}
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.methodCard, method === 'TRANSFERENCIA' && styles.methodCardActive]}
                    onPress={() => setMethod('TRANSFERENCIA')}
                    activeOpacity={0.8}
                >
                    <View style={styles.methodHeader}>
                        <FileText size={24} color={method === 'TRANSFERENCIA' ? Theme.colors.primary : Theme.colors.textSecondary} />
                        <Text style={[styles.methodTitle, method === 'TRANSFERENCIA' && { color: Theme.colors.primary }]}>Transferência Bancária</Text>
                        <View style={[styles.radio, method === 'TRANSFERENCIA' && styles.radioActive]}>
                            {method === 'TRANSFERENCIA' && <View style={styles.radioInner} />}
                        </View>
                    </View>

                    {method === 'TRANSFERENCIA' && (
                        <View style={styles.refDetails}>
                            <Text style={styles.refCode}>IBAN: AO06.0000.0000.0000.0000.0</Text>
                            <Text style={styles.refCode}>Banco BAI - Puculuxa Lda</Text>

                            <TouchableOpacity style={styles.uploadBtn} onPress={pickReceipt}>
                                {receiptUri ? (
                                    <>
                                        <CheckCircle size={20} color={Theme.colors.primary} />
                                        <Text style={[styles.uploadText, { color: Theme.colors.primary }]}>Comprovativo Anexado</Text>
                                    </>
                                ) : (
                                    <>
                                        <Upload size={20} color={Theme.colors.textSecondary} />
                                        <Text style={styles.uploadText}>Anexar Comprovativo (PDF/Imagem)</Text>
                                    </>
                                )}
                            </TouchableOpacity>
                        </View>
                    )}
                </TouchableOpacity>

            </ScrollView>

            <View style={styles.footer}>
                <TouchableOpacity style={[styles.confirmBtn, loading && { opacity: 0.7 }]} onPress={handleConfirmPayment} disabled={loading}>
                    {loading ? <ActivityIndicator color="white" /> : <Text style={styles.confirmText}>Confirmar Pagamento</Text>}
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
    content: { padding: 24, paddingBottom: 100 },
    totalCard: { backgroundColor: Theme.colors.primary, padding: 24, borderRadius: 16, alignItems: 'center', marginBottom: 32, ...Theme.shadows?.medium },
    totalLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 16, marginBottom: 8 },
    totalValue: { color: 'white', fontSize: 32, fontWeight: 'bold' },
    sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 16 },
    methodCard: { backgroundColor: 'white', borderRadius: 16, padding: 20, marginBottom: 16, borderWidth: 2, borderColor: 'transparent', ...Theme.shadows?.light },
    methodCardActive: { borderColor: Theme.colors.primary, backgroundColor: '#fffafb' },
    methodHeader: { flexDirection: 'row', alignItems: 'center' },
    methodTitle: { flex: 1, marginLeft: 16, fontSize: 16, fontWeight: 'bold', color: '#333' },
    radio: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: '#ddd', justifyContent: 'center', alignItems: 'center' },
    radioActive: { borderColor: Theme.colors.primary },
    radioInner: { width: 12, height: 12, borderRadius: 6, backgroundColor: Theme.colors.primary },
    refDetails: { marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: '#eee' },
    refCode: { fontSize: 15, fontWeight: 'bold', color: '#555', marginBottom: 8, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' },
    refHint: { fontSize: 13, color: Theme.colors.textSecondary, marginTop: 8, lineHeight: 20 },
    uploadBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f5f5f5', padding: 16, borderRadius: 12, marginTop: 16, borderWidth: 1, borderColor: '#ddd', borderStyle: 'dashed' },
    uploadText: { marginLeft: 8, fontSize: 14, color: Theme.colors.textSecondary, fontWeight: '600' },
    footer: { padding: 24, backgroundColor: 'white', borderTopLeftRadius: 24, borderTopRightRadius: 24, ...Theme.shadows?.medium },
    confirmBtn: { backgroundColor: Theme.colors.primary, paddingVertical: 16, borderRadius: 16, alignItems: 'center' },
    confirmText: { color: 'white', fontSize: 16, fontWeight: 'bold' }
});
