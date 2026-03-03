import React, { useMemo, useEffect, useRef, useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Animated, Dimensions, Modal, TextInput, ActivityIndicator, Alert, Share } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { ChevronLeft, CheckCircle, Package, Truck, Home, CreditCard, X, Building, UploadCloud, RefreshCw, AlertCircle } from 'lucide-react-native';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as DocumentPicker from 'expo-document-picker';
import { ApiService } from '../services/api';
import { Theme, T } from '../theme';
import { formatKz, formatDateAO } from '../utils/errorMessages';
import { PremiumButton } from '../components/ui/PremiumButton';
import { Skeleton } from '../components/ui/Skeleton';

const SCREEN_WIDTH = Dimensions.get('window').width;

// Status config for Quotations
const QUOTATION_STATUS_CONFIG = {
    SUBMITTED: { label: 'Enviado', icon: 'paper-plane', color: '#3B82F6', step: 1, desc: 'O seu pedido foi enviado com sucesso.' },
    IN_REVIEW: { label: 'Em Análise', icon: 'eye', color: '#F59E0B', step: 2, desc: 'A nossa equipa está a analisar a viabilidade.' },
    PROPOSAL_SENT: { label: 'Proposta Pronta', icon: 'document-text', color: '#8B5CF6', step: 3, desc: 'Reveja a proposta e diga-nos o que achou.' },
    NEGOTIATING: { label: 'Em Negociação', icon: 'chatbubbles', color: '#EC4899', step: 3, desc: 'A justar os detalhes conforme o seu feedback.' },
    ACCEPTED: { label: 'Aceite', icon: 'checkmark-circle', color: '#10B981', step: 4, desc: 'Tudo acordado! Vamos avançar para a encomenda.' },
    CONVERTED: { label: 'Encomenda Criada', icon: 'cube', color: Theme.colors.success, step: 5, desc: 'Foi gerado o seu pedido final. Acompanhe a entrega.' },
};

const QUOTATION_TIMELINE = [
    { key: 'SUBMITTED' },
    { key: 'IN_REVIEW' },
    { key: 'PROPOSAL_SENT' },
    { key: 'ACCEPTED' },
    { key: 'CONVERTED' },
];

// Financial status config
const FINANCIAL_STATUS_CONFIG = {
    UNPAID: { label: 'Por Pagar', color: '#EF4444', bg: '#EF444420' },
    PARTIALLY_PAID: { label: 'Pago Parcial', color: '#F59E0B', bg: '#F59E0B20' },
    PAID: { label: 'Pago \u2705', color: '#10B981', bg: '#10B98120' },
    IN_CREDIT: { label: 'Crédito', color: '#3B82F6', bg: '#3B82F620' },
    OVERDUE: { label: 'Em Atraso', color: '#DC2626', bg: '#DC262620' },
};

export const OrderTrackingScreen = () => {
    const navigation = useNavigation();
    const route = useRoute();
    const { orderId, quotationId, type } = route.params || {};

    const isQuotation = type === 'quotation';

    // Se for Orçamento, buscamos a lista de quotations da cache ou API e filtramos
    const { data: quotations = [], isLoading: loadingQuotations } = useQuery({
        queryKey: ['myQuotations'],
        queryFn: () => ApiService.getMyQuotations(),
        enabled: isQuotation,
    });

    const quotation = useMemo(() => {
        if (!isQuotation) return null;
        return quotations.find(q => q.id === quotationId);
    }, [quotations, quotationId, isQuotation]);

    // Animação para a badge "Aguarda Confirmação"
    const pulseAnim = useRef(new Animated.Value(1)).current;

    const queryClient = useQueryClient();

    const acceptMutation = useMutation({
        mutationFn: () => ApiService.updateQuotationStatus(quotationId, 'ACCEPTED'),
        onSuccess: () => {
            queryClient.invalidateQueries(['myQuotations']);
            alert('Sucesso: Proposta aceite com sucesso!');
        },
        onError: (err) => {
            alert('Erro: Não foi possível aceitar a proposta. ' + err.message);
        }
    });

    const handleAccept = () => {
        Alert.alert(
            'Confirmar Aceitação',
            'Tem a certeza que deseja aceitar a proposta? A equipa Puculuxa irá avançar com a sua encomenda.',
            [
                { text: 'Cancelar', style: 'cancel' },
                { text: 'Sim, Aceito', style: 'default', onPress: () => acceptMutation.mutate() },
            ]
        );
    };

    useEffect(() => {
        if (isQuotation && quotation?.status === 'ACCEPTED') {
            Animated.loop(
                Animated.sequence([
                    Animated.timing(pulseAnim, { toValue: 0.6, duration: 1000, useNativeDriver: true }),
                    Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true })
                ])
            ).start();
        }
    }, [isQuotation, quotation?.status]);

    // ═══════════════════════════════════════════════
    // QUOTATION FLOW (unchanged)
    // ═══════════════════════════════════════════════
    if (isQuotation) {
        if (loadingQuotations || !quotation) {
            return (
                <View style={styles.container}>
                    <View style={styles.header}>
                        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} accessibilityLabel="Voltar">
                            <ChevronLeft size={22} color={Theme.colors.white} />
                        </TouchableOpacity>
                        <Text style={styles.title}>Rastreio de Orçamento</Text>
                        <View style={{ width: 40 }} />
                    </View>
                    <View style={{ padding: 20, gap: 16 }}>
                        <Skeleton width="100%" height={100} borderRadius={16} />
                        <Skeleton width="100%" height={300} borderRadius={16} />
                    </View>
                </View>
            );
        }

        const config = QUOTATION_STATUS_CONFIG[quotation.status] || QUOTATION_STATUS_CONFIG.SUBMITTED;
        const currentStep = config.step;
        const displayPrice = quotation.versions?.length > 0 ? quotation.versions[0].price : quotation.estimatedTotal;

        return (
            <View style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} accessibilityLabel="Voltar">
                        <ChevronLeft size={22} color={Theme.colors.white} />
                    </TouchableOpacity>
                    <Text style={styles.title}>Rastreio</Text>
                    <View style={{ width: 40 }} />
                </View>

                <ScrollView contentContainerStyle={styles.content}>
                    <View style={styles.metaCard}>
                        <Text style={styles.metaTitle}>{quotation.eventType.charAt(0).toUpperCase() + quotation.eventType.slice(1)}</Text>
                        <View style={styles.metaRow}>
                            <Text style={styles.metaLabel}>Data do Evento:</Text>
                            <Text style={styles.metaValue}>{quotation.eventDate ? formatDateAO(quotation.eventDate) : 'A definir'}</Text>
                        </View>
                        <View style={styles.metaRow}>
                            <Text style={styles.metaLabel}>Convidados:</Text>
                            <Text style={styles.metaValue}>{quotation.guestCount}</Text>
                        </View>
                        {quotation.complements?.length > 0 && (
                            <View style={styles.metaRow}>
                                <Text style={styles.metaLabel}>Complementos:</Text>
                                <Text style={styles.metaValue}>{quotation.complements.map(c => c.name).join(', ')}</Text>
                            </View>
                        )}
                        <View style={[styles.metaRow, { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#2A2A2A' }]}>
                            <Text style={[styles.metaLabel, { fontSize: 16 }]}>Orçamento (Aprox.):</Text>
                            <Text style={styles.metaPrice}>{formatKz(displayPrice)}</Text>
                        </View>
                    </View>

                    {quotation.status === 'PROPOSAL_SENT' && (
                        <View style={{ marginBottom: 24, gap: 12 }}>
                            <PremiumButton
                                title={acceptMutation.isPending ? "A processar..." : "\u2705 Aceitar Proposta"}
                                size="md"
                                disabled={acceptMutation.isPending}
                                onPress={handleAccept}
                                style={{ backgroundColor: '#10B981', borderColor: '#059669' }}
                            />
                            <PremiumButton
                                title="\u2b07\ufe0f Descarregar Proposta (PDF)"
                                size="md"
                                onPress={() => {
                                    const { Linking } = require('react-native');
                                    const { API_CONFIG } = require('../config/api.config');
                                    Linking.openURL(`${API_CONFIG.BASE_URL}/quotations/${quotationId}/pdf`);
                                }}
                                style={{ backgroundColor: '#1F2937', borderColor: '#374151' }}
                            />
                        </View>
                    )}

                    {quotation.status === 'ACCEPTED' && (
                        <Animated.View style={[styles.pulseBadge, { opacity: pulseAnim }]}>
                            <Ionicons name="alert-circle" size={20} color="#F59E0B" style={{ marginRight: 8 }} />
                            <Text style={styles.pulseText}>Aguarda Confirmação Final</Text>
                        </Animated.View>
                    )}

                    <Text style={styles.sectionTitle}>Progresso</Text>

                    <View style={styles.timeline}>
                        {QUOTATION_TIMELINE.map((item, index) => {
                            const stepCfg = QUOTATION_STATUS_CONFIG[item.key];
                            let activeCfg = stepCfg;
                            if (item.key === 'PROPOSAL_SENT' && quotation.status === 'NEGOTIATING') {
                                activeCfg = QUOTATION_STATUS_CONFIG.NEGOTIATING;
                            }

                            const isCompleted = activeCfg.step < currentStep;
                            const isCurrent = activeCfg.step === currentStep;
                            const isFuture = activeCfg.step > currentStep;
                            const isLast = index === QUOTATION_TIMELINE.length - 1;

                            return (
                                <View key={item.key} style={styles.stepContainer}>
                                    <View style={styles.stepLeft}>
                                        <View style={[
                                            styles.iconBox,
                                            isFuture ? styles.iconBoxFuture : { backgroundColor: `${activeCfg.color}20` },
                                            isCurrent && { borderWidth: 1, borderColor: activeCfg.color }
                                        ]}>
                                            <Ionicons
                                                name={activeCfg.icon}
                                                size={18}
                                                color={isFuture ? '#6B7280' : activeCfg.color}
                                            />
                                        </View>
                                        {!isLast && <View style={[styles.timelineLine, isCompleted ? { backgroundColor: activeCfg.color } : { backgroundColor: '#2A2A2A' }]} />}
                                    </View>
                                    <View style={styles.stepRight}>
                                        <Text style={[styles.stepTitle, (isCompleted || isCurrent) ? { color: '#FFFFFF' } : { color: '#6B7280' }]}>
                                            {activeCfg.label}
                                        </Text>
                                        <Text style={[styles.stepDesc, (isCompleted || isCurrent) ? { color: '#9CA3AF' } : { color: '#4B5563' }]}>
                                            {activeCfg.desc}
                                        </Text>
                                    </View>
                                </View>
                            );
                        })}
                    </View>
                </ScrollView>
            </View>
        );
    }

    // ═══════════════════════════════════════════════════════════════
    // ORDER FLOW — Real data + Multicaixa Express + Bank Transfer (FASE 10B)
    // ═══════════════════════════════════════════════════════════════
    return <OrderPaymentFlow orderId={orderId} />;
};

// ─── Separate component for order payment flow (clean hook usage) ───
const OrderPaymentFlow = ({ orderId }) => {
    const navigation = useNavigation();
    const queryClient = useQueryClient();

    // State
    const [payModalVisible, setPayModalVisible] = useState(false);
    const [phoneNumber, setPhoneNumber] = useState('');
    const [paymentInitiated, setPaymentInitiated] = useState(false);

    // Bank Transfer State
    const [activeTransferInfo, setActiveTransferInfo] = useState(null); // { payment, invoice, bankDetails }
    const pollTimerRef = useRef(null);
    const pollCountRef = useRef(0);

    // ── Fetch real order data ──
    const { data: order, isLoading: loadingOrder, refetch: refetchOrder, isRefetching: isRefetchingOrder } = useQuery({
        queryKey: ['order', orderId],
        queryFn: () => ApiService.getOrderById(orderId),
        enabled: !!orderId,
    });

    // ── Fetch payments for this order ──
    const { data: payments = [], refetch: refetchPayments, isRefetching: isRefetchingPayments } = useQuery({
        queryKey: ['payments', orderId],
        queryFn: () => ApiService.getPaymentsByOrder(orderId),
        enabled: !!orderId,
    });

    // ── GPO Mutation ──
    const gpoMutation = useMutation({
        mutationFn: ({ oid, phone }) => ApiService.initiateGpoPayment(oid, phone),
        onSuccess: () => {
            setPayModalVisible(false);
            setPaymentInitiated(true);
            setActiveTransferInfo(null);
            startGpoPolling();
            Alert.alert(
                'Pedido Enviado \u2705',
                'Confirme o pagamento na app Multicaixa Express do seu telemóvel.',
                [{ text: 'OK' }]
            );
        },
        onError: (err) => {
            Alert.alert('Erro no Pagamento', err.message || 'Tente novamente.');
        },
    });

    // ── Bank Transfer Mutation ──
    const transferMutation = useMutation({
        mutationFn: (oid) => ApiService.createBankTransfer(oid),
        onSuccess: (data) => {
            // Guardar info para renderizar painel IBAN
            setActiveTransferInfo(data);
            setPaymentInitiated(false); // Reset GPO state if any
        },
        onError: (err) => {
            Alert.alert('Erro na Transferência', err.message || 'Não foi possível gerar os dados.');
        }
    });

    // ── Upload Proof Mutation ──
    const uploadMutation = useMutation({
        mutationFn: ({ paymentId, fileUri, fileName, mimeType }) =>
            ApiService.uploadPaymentProof(paymentId, fileUri, fileName, mimeType),
        onSuccess: () => {
            Alert.alert('Submetido \u2705', 'Comprovativo enviado. Aguarde validação da tesouraria.');
            handleManualRefresh();
        },
        onError: (err) => {
            Alert.alert('Erro no Upload', err.message || 'Não foi possível enviar o comprovativo.');
        }
    });

    // ── Polling para GPO: refetch every 5s for 60s ──
    const startGpoPolling = useCallback(() => {
        pollCountRef.current = 0;
        pollTimerRef.current = setInterval(async () => {
            pollCountRef.current += 1;
            await refetchOrder();
            await refetchPayments();

            const freshOrder = queryClient.getQueryData(['order', orderId]);
            if (freshOrder?.financialStatus === 'PAID' || pollCountRef.current >= 12) {
                clearInterval(pollTimerRef.current);
                if (freshOrder?.financialStatus === 'PAID') {
                    setPaymentInitiated(false);
                    Alert.alert('Pagamento Confirmado \u2705', 'O seu pagamento Multicaixa foi recebido com sucesso!');
                }
            }
        }, 5000);
    }, [orderId, refetchOrder, refetchPayments, queryClient]);

    // Cleanup
    useEffect(() => {
        return () => {
            if (pollTimerRef.current) clearInterval(pollTimerRef.current);
        };
    }, []);

    // ── Handlers ──
    const handlePayPress = () => {
        setPhoneNumber('244');
        setPayModalVisible(true);
    };

    const handleConfirmPay = () => {
        const cleaned = phoneNumber.replace(/\s/g, '');
        if (!/^244\d{9}$/.test(cleaned)) {
            Alert.alert('Número inválido', 'Insira o número no formato 244XXXXXXXXX (12 dígitos).');
            return;
        }
        gpoMutation.mutate({ oid: orderId, phone: cleaned });
    };

    const handleBankTransferPress = () => {
        transferMutation.mutate(orderId);
    };

    const handleManualRefresh = async () => {
        await refetchOrder();
        await refetchPayments();
    };

    const handleUploadProof = async (paymentId) => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: ['application/pdf', 'image/*'],
                copyToCacheDirectory: true,
            });

            if (result.canceled) return;
            const file = result.assets[0];

            uploadMutation.mutate({
                paymentId,
                fileUri: file.uri,
                fileName: file.name,
                mimeType: file.mimeType || (file.name.endsWith('.pdf') ? 'application/pdf' : 'image/jpeg')
            });
        } catch (error) {
            Alert.alert('Erro', 'Não foi possível selecionar o ficheiro.');
        }
    };

    const handleShareBankDetails = async () => {
        if (!activeTransferInfo) return;
        const { bankDetails, payment, invoice } = activeTransferInfo;
        const message = `Puculuxa — Detalhes para Transferência\n\n` +
            `Banco: ${bankDetails.bankName}\n` +
            `Beneficiário: ${bankDetails.beneficiary}\n` +
            `IBAN: ${bankDetails.iban}\n` +
            `NIF: ${invoice?.debtorEntityNif || "--"}\n\n` +
            `Valor: ${formatKz(order?.total || 0)}\n` +
            `Referência: ${payment.merchantRef}\n\n` +
            `Agradecemos a preferência!`;

        try {
            await Share.share({ message });
        } catch (error) {
            // Ignore
        }
    };

    // ── Status e Regras de Negócio ──
    const financialStatus = order?.financialStatus || 'UNPAID';
    const statusCfg = FINANCIAL_STATUS_CONFIG[financialStatus] || FINANCIAL_STATUS_CONFIG.UNPAID;
    const isPaid = financialStatus === 'PAID';
    const isCredit = order?.paymentMode === 'GOVERNMENT_CREDIT' || ['IN_CREDIT', 'OVERDUE'].includes(financialStatus);

    const lastPayment = payments.length > 0 ? payments[payments.length - 1] : null;
    const isAwaitingProof = lastPayment && lastPayment.status === 'AWAITING_PROOF' && lastPayment.paymentMethod === 'BANK_TRANSFER';
    const isFailed = lastPayment && lastPayment.status === 'FAILED';
    const isTransferPanelActive = activeTransferInfo != null && !isPaid;

    // Loading
    if (loadingOrder) {
        return (
            <View style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} accessibilityLabel="Voltar">
                        <ChevronLeft size={22} color={Theme.colors.white} />
                    </TouchableOpacity>
                    <Text style={styles.title}>Rastreio da Encomenda</Text>
                    <View style={{ width: 40 }} />
                </View>
                <View style={{ padding: 20, gap: 16 }}>
                    <Skeleton width="100%" height={120} borderRadius={16} />
                    <Skeleton width="100%" height={80} borderRadius={16} />
                    <Skeleton width="100%" height={200} borderRadius={16} />
                </View>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} accessibilityLabel="Voltar">
                    <ChevronLeft size={22} color={Theme.colors.white} />
                </TouchableOpacity>
                <Text style={styles.title}>Rastreio da Encomenda</Text>
                <TouchableOpacity onPress={handleManualRefresh} style={styles.refreshBtn}>
                    <RefreshCw size={20} color={Theme.colors.white} />
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                {/* ── Order Info Card ── */}
                <View style={styles.metaCard}>
                    <Text style={styles.metaTitle}>Encomenda</Text>
                    <View style={styles.metaRow}>
                        <Text style={styles.metaLabel}>Referência:</Text>
                        <Text style={[styles.metaValue, { fontFamily: 'Poppins_600SemiBold' }]}>#{(orderId || '').slice(-8).toUpperCase()}</Text>
                    </View>
                    <View style={styles.metaRow}>
                        <Text style={styles.metaLabel}>Data:</Text>
                        <Text style={styles.metaValue}>{order?.createdAt ? formatDateAO(order.createdAt) : '--'}</Text>
                    </View>
                    <View style={styles.metaRow}>
                        <Text style={styles.metaLabel}>Estado logístico:</Text>
                        <Text style={[styles.metaValue, { color: Theme.colors.success }]}>{order?.status || '--'}</Text>
                    </View>
                    <View style={[styles.metaRow, { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#2A2A2A' }]}>
                        <Text style={[styles.metaLabel, { fontSize: 16 }]}>Total a Pagar:</Text>
                        <Text style={styles.metaPrice}>{formatKz(order?.total || 0)}</Text>
                    </View>
                </View>

                {/* ── Financial Status Card ── */}
                <View style={[styles.financeCard, { borderColor: statusCfg.color + '40' }]}>
                    <View style={styles.financeHeader}>
                        <CreditCard size={18} color={statusCfg.color} />
                        <Text style={[styles.financeTitle, { color: statusCfg.color }]}>Estado Financeiro</Text>
                    </View>
                    <View style={[styles.financeBadge, { backgroundColor: statusCfg.bg }]}>
                        <Text style={[styles.financeBadgeText, { color: statusCfg.color }]}>{statusCfg.label}</Text>
                    </View>
                    {order?.paymentMode && (
                        <Text style={styles.financeMode}>
                            Modo: {order.paymentMode === 'APPYPAY_GPO' ? 'Multicaixa Express' : order.paymentMode === 'BANK_TRANSFER' ? 'Transferência Bancária' : order.paymentMode === 'GOVERNMENT_CREDIT' ? 'Crédito Institucional' : order.paymentMode}
                        </Text>
                    )}
                    {(isRefetchingOrder || isRefetchingPayments) && (
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
                            <ActivityIndicator size="small" color="#9CA3AF" />
                            <Text style={{ color: '#9CA3AF', marginLeft: 8, fontSize: 12 }}>A sincronizar estado...</Text>
                        </View>
                    )}
                </View>

                {/* ── Institutional Credit Informative Panel ── */}
                {isCredit && (
                    <View style={styles.creditCard}>
                        <Building size={24} color="#3B82F6" style={{ marginBottom: 8 }} />
                        <Text style={styles.creditTitle}>Crédito Institucional</Text>
                        <Text style={styles.creditDesc}>Este pedido encontra-se sob acordo de Crédito Institucional. O pagamento será processado via Ordem de Saque / Tesouraria no prazo acordado.</Text>
                    </View>
                )}

                {/* ── Bank Transfer Panel (Active Flow) ── */}
                {isTransferPanelActive && !isCredit && (
                    <View style={styles.transferPanel}>
                        <Text style={styles.transferTitle}>\ud83c\udfe6 Dados de Transferência (BAI)</Text>
                        <Text style={styles.transferSubtitle}>Efetue o pagamento e envie o comprovativo.</Text>

                        <View style={styles.ibanBox}>
                            <View style={styles.ibanRow}>
                                <Text style={styles.ibanLabel}>IBAN</Text>
                                <Text style={styles.ibanValue} selectable>{activeTransferInfo.bankDetails.iban}</Text>
                            </View>
                            <View style={styles.ibanRow}>
                                <Text style={styles.ibanLabel}>Banco</Text>
                                <Text style={styles.ibanValue}>{activeTransferInfo.bankDetails.bankName}</Text>
                            </View>
                            <View style={styles.ibanRow}>
                                <Text style={styles.ibanLabel}>Beneficiário</Text>
                                <Text style={styles.ibanValue}>{activeTransferInfo.bankDetails.beneficiary}</Text>
                            </View>
                            <View style={styles.ibanRow}>
                                <Text style={styles.ibanLabel}>Referência</Text>
                                <Text style={styles.ibanValue} selectable>{activeTransferInfo.payment.merchantRef}</Text>
                            </View>
                        </View>

                        <View style={styles.transferActions}>
                            <TouchableOpacity style={styles.shareBtn} onPress={handleShareBankDetails}>
                                <Text style={styles.shareBtnText}>Copiar / Partilhar Dados</Text>
                            </TouchableOpacity>

                            <PremiumButton
                                title={uploadMutation.isPending ? "A enviar..." : "\ud83d\udcce Enviar Comprovativo"}
                                size="md"
                                disabled={uploadMutation.isPending}
                                onPress={() => handleUploadProof(activeTransferInfo.payment.id)}
                                style={{ backgroundColor: '#10B981', borderColor: '#059669', flex: 1 }}
                            />
                        </View>
                    </View>
                )}

                {/* ── Payment States Feedback ── */}
                {isPaid && (
                    <View style={styles.paidCard}>
                        <CheckCircle size={24} color="#10B981" />
                        <Text style={styles.paidText}>Pagamento confirmado \u2705</Text>
                    </View>
                )}

                {isAwaitingProof && !isPaid && !isTransferPanelActive && (
                    <View style={styles.waitingCard}>
                        <ActivityIndicator size="small" color="#F59E0B" style={{ marginRight: 8 }} />
                        <View style={{ flex: 1 }}>
                            <Text style={styles.waitingTitle}>Aguardando validação da tesouraria</Text>
                            <Text style={styles.waitingDesc}>O comprovativo foi recebido e está em análise.</Text>
                        </View>
                        {/* Permite reenviar caso tenha havido erro / enviar um melhor */}
                        <TouchableOpacity style={styles.microBtn} onPress={() => handleUploadProof(lastPayment.id)}>
                            <UploadCloud size={16} color="#F59E0B" />
                        </TouchableOpacity>
                    </View>
                )}

                {isFailed && !isPaid && (
                    <View style={[styles.waitingCard, { backgroundColor: '#DC262620', borderColor: '#DC262640' }]}>
                        <AlertCircle size={24} color="#DC2626" style={{ marginRight: 8 }} />
                        <View style={{ flex: 1 }}>
                            <Text style={[styles.waitingTitle, { color: '#DC2626' }]}>Pagamento Rejeitado</Text>
                            <Text style={[styles.waitingDesc, { color: '#DC262680' }]}>Motivo: {lastPayment.metadata?.failureReason || 'Comprovativo inválido.'}</Text>
                        </View>
                    </View>
                )}

                {paymentInitiated && !isPaid && (
                    <View style={styles.waitingCard}>
                        <ActivityIndicator size="small" color="#F59E0B" style={{ marginRight: 8 }} />
                        <View style={{ flex: 1 }}>
                            <Text style={styles.waitingTitle}>A iniciar via Multicaixa…</Text>
                            <Text style={styles.waitingDesc}>Confirme o pagamento na app Multicaixa Express.</Text>
                        </View>
                    </View>
                )}

                {/* ── Core Action Buttons ── */}
                {!isPaid && !isCredit && !isTransferPanelActive && !isAwaitingProof && (
                    <View style={{ marginBottom: 24, gap: 12 }}>
                        <PremiumButton
                            title="\ud83d\udcb3 Pagar Agora (Multicaixa Express)"
                            size="md"
                            onPress={handlePayPress}
                            style={{ backgroundColor: '#DC2626', borderColor: '#B91C1C' }}
                            disabled={transferMutation.isPending}
                        />
                        <PremiumButton
                            title={transferMutation.isPending ? "A gerar dados..." : "\ud83c\udfe6 Pagar por Transferência Bancária"}
                            size="md"
                            onPress={handleBankTransferPress}
                            style={{ backgroundColor: '#1F2937', borderColor: '#374151' }}
                            disabled={transferMutation.isPending}
                        />
                    </View>
                )}

                {/* ── Order Timeline ── */}
                <Text style={styles.sectionTitle}>Progresso Logístico</Text>
                <View style={styles.timeline}>
                    {[
                        { id: 1, title: 'Pedido Confirmado', icon: CheckCircle, done: true },
                        { id: 2, title: 'Em Preparação', icon: Package, done: order?.status !== 'PENDING' },
                        { id: 3, title: 'A Caminho', icon: Truck, done: order?.status === 'DELIVERED' || order?.status === 'SHIPPED' },
                        { id: 4, title: 'Entregue', icon: Home, done: order?.status === 'DELIVERED' },
                    ].map((step, index, arr) => {
                        const Icon = step.icon;
                        const isLast = index === arr.length - 1;
                        return (
                            <View key={step.id} style={styles.stepContainer}>
                                <View style={styles.stepLeft}>
                                    <View style={[styles.iconBox, step.done ? { backgroundColor: Theme.colors.primary } : styles.iconBoxFuture]}>
                                        <Icon size={18} color={step.done ? '#FFFFFF' : '#6B7280'} />
                                    </View>
                                    {!isLast && <View style={[styles.timelineLine, step.done ? { backgroundColor: Theme.colors.primary } : { backgroundColor: '#2A2A2A' }]} />}
                                </View>
                                <View style={styles.stepRight}>
                                    <Text style={[styles.stepTitle, step.done ? { color: '#FFFFFF' } : { color: '#6B7280' }]}>{step.title}</Text>
                                </View>
                            </View>
                        );
                    })}
                </View>
            </ScrollView>

            {/* ── Phone Number Modal for GPO ── */}
            <Modal visible={payModalVisible} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalCard}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Multicaixa Express</Text>
                            <TouchableOpacity onPress={() => setPayModalVisible(false)}>
                                <X size={22} color="#9CA3AF" />
                            </TouchableOpacity>
                        </View>

                        <Text style={styles.modalLabel}>Número de telefone</Text>
                        <TextInput
                            style={styles.modalInput}
                            value={phoneNumber}
                            onChangeText={setPhoneNumber}
                            placeholder="244XXXXXXXXX"
                            placeholderTextColor="#6B7280"
                            keyboardType="phone-pad"
                            maxLength={12}
                        />
                        <Text style={styles.modalHint}>Formato: 244 seguido de 9 dígitos</Text>

                        <View style={styles.modalAmountRow}>
                            <Text style={styles.modalAmountLabel}>Valor a pagar:</Text>
                            <Text style={styles.modalAmountValue}>{formatKz(order?.total || 0)}</Text>
                        </View>

                        <TouchableOpacity
                            style={[styles.modalPayBtn, gpoMutation.isPending && { opacity: 0.6 }]}
                            onPress={handleConfirmPay}
                            disabled={gpoMutation.isPending}
                        >
                            {gpoMutation.isPending ? (
                                <ActivityIndicator size="small" color="#FFFFFF" />
                            ) : (
                                <Text style={styles.modalPayBtnText}>Confirmar Pagamento</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0F0F0F' },
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingTop: 56, paddingHorizontal: 20, paddingBottom: 16,
        backgroundColor: '#1A1A1A', borderBottomWidth: 1, borderBottomColor: '#2A2A2A',
    },
    backBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#2A2A2A', justifyContent: 'center', alignItems: 'center' },
    refreshBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#1F2937', justifyContent: 'center', alignItems: 'center' },
    title: { ...T.h3, color: Theme.colors.white },
    content: { padding: 20 },

    metaCard: {
        backgroundColor: '#1A1A1A', padding: 20, borderRadius: 16,
        marginBottom: 24, borderWidth: 1, borderColor: '#2A2A2A'
    },
    metaTitle: { fontFamily: 'Poppins_700Bold', fontSize: 18, color: '#FFFFFF', marginBottom: 12 },
    metaRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8, alignItems: 'flex-start' },
    metaLabel: { fontFamily: 'Poppins_400Regular', fontSize: 14, color: '#9CA3AF', flex: 1 },
    metaValue: { fontFamily: 'Poppins_500Medium', fontSize: 14, color: '#FFFFFF', flex: 1, textAlign: 'right' },
    metaPrice: { fontFamily: 'Poppins_700Bold', fontSize: 22, color: '#DC2626' },

    sectionTitle: { fontFamily: 'Poppins_600SemiBold', fontSize: 16, color: '#FFFFFF', marginBottom: 16 },

    pulseBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FEF3C7', padding: 12, borderRadius: 12, marginBottom: 24, borderWidth: 1, borderColor: '#F59E0B' },
    pulseText: { fontFamily: 'Poppins_600SemiBold', fontSize: 14, color: '#D97706' },

    timeline: { paddingLeft: 8 },
    stepContainer: { flexDirection: 'row', minHeight: 80 },
    stepLeft: { alignItems: 'center', width: 40, marginRight: 16 },
    iconBox: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
    iconBoxFuture: { backgroundColor: '#1F2937' },
    timelineLine: { width: 2, flex: 1, marginVertical: 4 },
    stepRight: { flex: 1, paddingTop: 8 },
    stepTitle: { fontFamily: 'Poppins_600SemiBold', fontSize: 15 },
    stepDesc: { fontFamily: 'Poppins_400Regular', fontSize: 13, marginTop: 4, lineHeight: 18 },

    financeCard: {
        backgroundColor: '#1A1A1A', padding: 16, borderRadius: 16,
        marginBottom: 16, borderWidth: 1,
    },
    financeHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
    financeTitle: { fontFamily: 'Poppins_600SemiBold', fontSize: 14 },
    financeBadge: { alignSelf: 'flex-start', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, marginBottom: 8 },
    financeBadgeText: { fontFamily: 'Poppins_700Bold', fontSize: 13 },
    financeMode: { fontFamily: 'Poppins_400Regular', fontSize: 12, color: '#9CA3AF', marginTop: 2 },

    creditCard: {
        backgroundColor: '#1E3A8A20', padding: 16, borderRadius: 16, marginBottom: 24,
        borderWidth: 1, borderColor: '#3B82F640',
    },
    creditTitle: { fontFamily: 'Poppins_700Bold', fontSize: 15, color: '#3B82F6', marginBottom: 4 },
    creditDesc: { fontFamily: 'Poppins_400Regular', fontSize: 12, color: '#93C5FD', lineHeight: 18 },

    transferPanel: {
        backgroundColor: '#111827', padding: 20, borderRadius: 16, marginBottom: 24,
        borderWidth: 1, borderColor: '#374151',
    },
    transferTitle: { fontFamily: 'Poppins_700Bold', fontSize: 16, color: '#F3F4F6', marginBottom: 4 },
    transferSubtitle: { fontFamily: 'Poppins_400Regular', fontSize: 12, color: '#9CA3AF', marginBottom: 16 },
    ibanBox: { backgroundColor: '#1F2937', padding: 16, borderRadius: 12, marginBottom: 16 },
    ibanRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
    ibanLabel: { fontFamily: 'Poppins_400Regular', fontSize: 13, color: '#9CA3AF' },
    ibanValue: { fontFamily: 'Poppins_600SemiBold', fontSize: 13, color: '#F9FAFB' },
    transferActions: { gap: 12 },
    shareBtn: { paddingVertical: 12, alignItems: 'center', backgroundColor: '#374151', borderRadius: 12 },
    shareBtnText: { fontFamily: 'Poppins_600SemiBold', fontSize: 13, color: '#D1D5DB' },

    waitingCard: {
        flexDirection: 'row', alignItems: 'center', backgroundColor: '#FEF3C720',
        padding: 14, borderRadius: 14, marginBottom: 16, borderWidth: 1, borderColor: '#F59E0B40',
    },
    waitingTitle: { fontFamily: 'Poppins_600SemiBold', fontSize: 13, color: '#F59E0B' },
    waitingDesc: { fontFamily: 'Poppins_400Regular', fontSize: 11, color: '#D9770680', marginTop: 2 },
    microBtn: { padding: 8, backgroundColor: '#F59E0B20', borderRadius: 8 },

    paidCard: {
        flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#10B98120',
        padding: 16, borderRadius: 14, marginBottom: 24, borderWidth: 1, borderColor: '#10B98140',
    },
    paidText: { fontFamily: 'Poppins_700Bold', fontSize: 15, color: '#10B981' },

    modalOverlay: { flex: 1, backgroundColor: '#00000090', justifyContent: 'flex-end' },
    modalCard: {
        backgroundColor: '#1A1A1A', borderTopLeftRadius: 28, borderTopRightRadius: 28,
        paddingHorizontal: 24, paddingTop: 24, paddingBottom: 40,
    },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
    modalTitle: { fontFamily: 'Poppins_700Bold', fontSize: 20, color: '#FFFFFF' },
    modalLabel: { fontFamily: 'Poppins_500Medium', fontSize: 13, color: '#9CA3AF', marginBottom: 8 },
    modalInput: {
        backgroundColor: '#0F0F0F', color: '#FFFFFF', fontFamily: 'Poppins_500Medium',
        fontSize: 18, paddingHorizontal: 16, paddingVertical: 14, borderRadius: 14,
        borderWidth: 1, borderColor: '#2A2A2A', letterSpacing: 1,
    },
    modalHint: { fontFamily: 'Poppins_400Regular', fontSize: 11, color: '#6B7280', marginTop: 6 },
    modalAmountRow: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        backgroundColor: '#0F0F0F', padding: 14, borderRadius: 14, marginTop: 20,
    },
    modalAmountLabel: { fontFamily: 'Poppins_500Medium', fontSize: 14, color: '#9CA3AF' },
    modalAmountValue: { fontFamily: 'Poppins_700Bold', fontSize: 20, color: '#DC2626' },
    modalPayBtn: {
        backgroundColor: '#DC2626', paddingVertical: 16, borderRadius: 16,
        alignItems: 'center', marginTop: 20,
    },
    modalPayBtnText: { fontFamily: 'Poppins_700Bold', fontSize: 16, color: '#FFFFFF' },
});
