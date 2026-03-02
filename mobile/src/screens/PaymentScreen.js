import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, Platform } from 'react-native';
import { ChevronLeft, CreditCard, Upload, CheckCircle, FileText } from 'lucide-react-native';
import { Theme, T } from '../theme';
import { ApiService } from '../services/api';
import { useCartStore } from '../store/cartStore';
import { useToastStore } from '../store/toastStore';
import { PremiumButton } from '../components/ui/PremiumButton';
import { formatKz, humanizeError } from '../utils/errorMessages';
import * as ImagePicker from 'expo-image-picker';

export const PaymentScreen = ({ route, navigation }) => {
    const { orderData } = route.params;
    const [method, setMethod] = useState('MULTICAIXA');
    const [receiptUri, setReceiptUri] = useState(null);
    const [loading, setLoading] = useState(false);
    const { clearCart } = useCartStore();
    const { show } = useToastStore();

    const pickReceipt = async () => {
        let result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.8 });
        if (!result.canceled) setReceiptUri(result.assets[0].uri);
    };

    const handleConfirmPayment = async () => {
        if (method === 'TRANSFERENCIA' && !receiptUri) {
            show({ type: 'warning', message: 'Anexa o comprovativo de transferência.' });
            return;
        }
        setLoading(true);
        try {
            let receiptUrl = null;
            if (receiptUri) {
                const res = await ApiService.uploadQuotationImage(receiptUri);
                receiptUrl = res.url;
            }
            await ApiService.postOrder({ ...orderData, paymentMethod: method, paymentReceipt: receiptUrl, status: 'PENDENTE' });
            clearCart();
            show({ type: 'success', message: 'Pagamento recebido! Vamos preparar o teu pedido.' });
            navigation.reset({ index: 0, routes: [{ name: 'HomeTab' }] });
        } catch (error) {
            show({ type: 'error', message: humanizeError(error) });
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} accessibilityLabel="Voltar">
                    <ChevronLeft size={22} color={Theme.colors.primary} />
                </TouchableOpacity>
                <Text style={styles.title}>Pagamento</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                {/* Total card */}
                <View style={styles.totalCard}>
                    <Text style={styles.totalLabel}>Total a Pagar</Text>
                    <Text style={styles.totalValue}>{formatKz(orderData.total)}</Text>
                </View>

                <Text style={styles.sectionTitle}>Método de Pagamento</Text>

                {/* Multicaixa */}
                <TouchableOpacity
                    style={[styles.methodCard, method === 'MULTICAIXA' ? styles.methodCardActive : null]}
                    onPress={() => setMethod('MULTICAIXA')}
                    activeOpacity={0.8}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: method === 'MULTICAIXA' }}
                >
                    <View style={styles.methodHeader}>
                        <CreditCard size={22} color={method === 'MULTICAIXA' ? Theme.colors.primary : Theme.colors.textSecondary} />
                        <Text style={[styles.methodTitle, method === 'MULTICAIXA' ? { color: Theme.colors.primary } : null]}>Pagamento por Referência</Text>
                        <View style={[styles.radio, method === 'MULTICAIXA' ? styles.radioActive : null]}>
                            {method === 'MULTICAIXA' ? <View style={styles.radioInner} /> : null}
                        </View>
                    </View>
                    {method === 'MULTICAIXA' ? (
                        <View style={styles.refDetails}>
                            <Text style={styles.refCode}>Entidade: 00123</Text>
                            <Text style={styles.refCode}>Referência: 987 654 321</Text>
                            <Text style={styles.refHint}>Paga no Multicaixa Express e o sistema aprova automaticamente em 5 minutos.</Text>
                        </View>
                    ) : null}
                </TouchableOpacity>

                {/* Transferência */}
                <TouchableOpacity
                    style={[styles.methodCard, method === 'TRANSFERENCIA' ? styles.methodCardActive : null]}
                    onPress={() => setMethod('TRANSFERENCIA')}
                    activeOpacity={0.8}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: method === 'TRANSFERENCIA' }}
                >
                    <View style={styles.methodHeader}>
                        <FileText size={22} color={method === 'TRANSFERENCIA' ? Theme.colors.primary : Theme.colors.textSecondary} />
                        <Text style={[styles.methodTitle, method === 'TRANSFERENCIA' ? { color: Theme.colors.primary } : null]}>Transferência Bancária</Text>
                        <View style={[styles.radio, method === 'TRANSFERENCIA' ? styles.radioActive : null]}>
                            {method === 'TRANSFERENCIA' ? <View style={styles.radioInner} /> : null}
                        </View>
                    </View>
                    {method === 'TRANSFERENCIA' ? (
                        <View style={styles.refDetails}>
                            <Text style={styles.refCode}>IBAN: AO06.0000.0000.0000.0000.0</Text>
                            <Text style={styles.refCode}>Banco BAI — Puculuxa Lda</Text>
                            <TouchableOpacity style={styles.uploadBtn} onPress={pickReceipt} accessibilityLabel="Anexar comprovativo">
                                {receiptUri ? (
                                    <>
                                        <CheckCircle size={18} color={Theme.colors.success} />
                                        <Text style={[styles.uploadText, { color: Theme.colors.success }]}>Comprovativo Anexado</Text>
                                    </>
                                ) : (
                                    <>
                                        <Upload size={18} color={Theme.colors.textTertiary} />
                                        <Text style={styles.uploadText}>Anexar Comprovativo</Text>
                                    </>
                                )}
                            </TouchableOpacity>
                        </View>
                    ) : null}
                </TouchableOpacity>
            </ScrollView>

            <View style={styles.footer}>
                <PremiumButton title="Confirmar Pagamento" onPress={handleConfirmPayment} size="lg" loading={loading} />
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Theme.colors.background },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 56, paddingHorizontal: 20, paddingBottom: 14, backgroundColor: Theme.colors.surfaceElevated, borderBottomWidth: 1, borderBottomColor: Theme.colors.border },
    backBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: Theme.colors.surface, justifyContent: 'center', alignItems: 'center' },
    title: { ...T.h3, color: Theme.colors.primary },
    content: { padding: 20, paddingBottom: 100 },
    totalCard: { backgroundColor: Theme.colors.primary, padding: 24, borderRadius: Theme.radius.lg, alignItems: 'center', marginBottom: 28, ...Theme.elevation.md },
    totalLabel: { fontFamily: T.body.fontFamily, color: 'rgba(255,255,255,0.8)', fontSize: 15, marginBottom: 6 },
    totalValue: { fontFamily: 'Merriweather_700Bold', color: Theme.colors.white, fontSize: 32 },
    sectionTitle: { ...T.h3, marginBottom: 16 },
    methodCard: { backgroundColor: Theme.colors.surfaceElevated, borderRadius: Theme.radius.lg, padding: 18, marginBottom: 14, borderWidth: 2, borderColor: 'transparent', ...Theme.elevation.xs },
    methodCardActive: { borderColor: Theme.colors.primary, backgroundColor: Theme.colors.primaryGhost },
    methodHeader: { flexDirection: 'row', alignItems: 'center' },
    methodTitle: { flex: 1, marginLeft: 14, fontFamily: 'Poppins_600SemiBold', fontSize: 15, color: Theme.colors.textPrimary },
    radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: Theme.colors.borderStrong, justifyContent: 'center', alignItems: 'center' },
    radioActive: { borderColor: Theme.colors.primary },
    radioInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: Theme.colors.primary },
    refDetails: { marginTop: 14, paddingTop: 14, borderTopWidth: 1, borderTopColor: Theme.colors.border },
    refCode: { fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace', fontSize: 14, fontWeight: 'bold', color: Theme.colors.textPrimary, marginBottom: 6 },
    refHint: { ...T.bodySmall, marginTop: 8, lineHeight: 20 },
    uploadBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: Theme.colors.surface, padding: 14, borderRadius: Theme.radius.md, marginTop: 14, borderWidth: 1.5, borderColor: Theme.colors.border, borderStyle: 'dashed', gap: 8 },
    uploadText: { fontFamily: 'Poppins_500Medium', fontSize: 13, color: Theme.colors.textSecondary },
    footer: { padding: 20, paddingBottom: 28, backgroundColor: Theme.colors.surfaceElevated, borderTopWidth: 1, borderTopColor: Theme.colors.border },
});
