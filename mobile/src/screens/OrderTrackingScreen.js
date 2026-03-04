import React, { useMemo, useEffect, useRef, useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Modal, TextInput, ActivityIndicator, Alert, Share } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { ChevronLeft, CheckCircle, Package, Truck, Home, CreditCard, X, Building, UploadCloud, RefreshCw, AlertCircle } from 'lucide-react-native';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as DocumentPicker from 'expo-document-picker';
import { ApiService } from '../services/api';
import { TOKENS, Theme, textStyles } from '../theme';
import { formatKz, formatDateAO } from '../utils/errorMessages';
import { Screen, TopHeader, LedgerCard, StatusBadge, KpiRow, PrimaryButton, SecondaryButton, LoadingState, FadeInView } from '../components/base/BaseComponents';
import { hapticMedium } from '../utils/haptics';

// --- Configs ---
const QUOTATION_STATUS_CONFIG = {
    SUBMITTED: { label: 'Enviado', icon: 'paper-plane', color: '#3B82F6', step: 1, desc: 'O seu pedido foi enviado com sucesso.', statusKey: 'UNPAID' },
    IN_REVIEW: { label: 'Em Análise', icon: 'eye', color: '#F59E0B', step: 2, desc: 'A nossa equipa está a analisar a viabilidade.', statusKey: 'PENDING' },
    PROPOSAL_SENT: { label: 'Proposta Pronta', icon: 'document-text', color: '#8B5CF6', step: 3, desc: 'Reveja a proposta e diga-nos o que achou.', statusKey: 'PENDING' },
    NEGOTIATING: { label: 'Em Negociação', icon: 'chatbubbles', color: '#EC4899', step: 3, desc: 'A justar os detalhes conforme o seu feedback.', statusKey: 'PENDING' },
    ACCEPTED: { label: 'Aceite', icon: 'checkmark-circle', color: '#10B981', step: 4, desc: 'Tudo acordado! Vamos avançar para a encomenda.', statusKey: 'PAID' },
    CONVERTED: { label: 'Encomenda Criada', icon: 'cube', color: TOKENS.colors.success, step: 5, desc: 'Foi gerado o seu pedido final. Acompanhe a entrega.', statusKey: 'PAID' },
};

const QUOTATION_TIMELINE = [
    { key: 'SUBMITTED' },
    { key: 'IN_REVIEW' },
    { key: 'PROPOSAL_SENT' },
    { key: 'ACCEPTED' },
    { key: 'CONVERTED' },
];

const FINANCIAL_STATUS_CONFIG = {
    UNPAID: { label: 'Por Pagar', tone: 'danger', statusKey: 'UNPAID' },
    PARTIALLY_PAID: { label: 'Pago Parcial', tone: 'warning', statusKey: 'PENDING' },
    PAID: { label: 'Pago ✅', tone: 'success', statusKey: 'PAID' },
    IN_CREDIT: { label: 'Crédito', tone: 'gold', statusKey: 'IN_CREDIT' },
    OVERDUE: { label: 'Em Atraso', tone: 'danger', statusKey: 'OVERDUE' },
};

export const OrderTrackingScreen = () => {
    const navigation = useNavigation();
    const route = useRoute();
    const { orderId, quotationId, type } = route.params || {};
    const isQuotation = type === 'quotation';

    const { data: quotations = [], isLoading: loadingQuotations, refetch: refetchQuotations, isRefetching: isRefetchingQuotations } = useQuery({
        queryKey: ['myQuotations'],
        queryFn: () => ApiService.getMyQuotations(),
        enabled: isQuotation,
    });

    const quotation = useMemo(() => {
        if (!isQuotation) return null;
        return quotations.find(q => q.id === quotationId);
    }, [quotations, quotationId, isQuotation]);

    const pulseAnim = useRef(new Animated.Value(1)).current;
    const queryClient = useQueryClient();

    const acceptMutation = useMutation({
        mutationFn: () => ApiService.updateQuotationStatus(quotationId, 'ACCEPTED'),
        onSuccess: () => {
            queryClient.invalidateQueries(['myQuotations']);
            Alert.alert('Sucesso', 'Proposta aceite com sucesso!');
        },
        onError: (err) => {
            Alert.alert('Erro', 'Não foi possível aceitar a proposta. ' + err.message);
        }
    });

    const handleAccept = () => {
        Alert.alert(
            'Confirmar Aceitação',
            'Tem a certeza que deseja aceitar a proposta? A equipa Puculuxa irá avançar com a sua encomenda.',
            [
                { text: 'Cancelar', style: 'cancel' },
                { text: 'Sim, Aceito', style: 'default', onPress: () => {
                    hapticMedium();
                    acceptMutation.mutate();
                } },
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
    // QUOTATION FLOW
    // ═══════════════════════════════════════════════
    if (isQuotation) {
        if (loadingQuotations || !quotation) {
            return (
                <Screen scroll>
                    <TopHeader 
                        title="Rastreio" 
                        rightAction={
                            <TouchableOpacity onPress={() => navigation.goBack()} accessibilityLabel="Voltar">
                                <ChevronLeft size={24} color={TOKENS.colors.text} />
                            </TouchableOpacity>
                        } 
                    />
                    <LoadingState title="A carregar orçamento..." />
                </Screen>
            );
        }

        const config = QUOTATION_STATUS_CONFIG[quotation.status] || QUOTATION_STATUS_CONFIG.SUBMITTED;
        const currentStep = config.step;
        const displayPrice = quotation.versions?.length > 0 ? quotation.versions[0].price : quotation.estimatedTotal;

        const refreshAction = (
            <View style={{ flexDirection: 'row', gap: TOKENS.spacing[4] }}>
                <TouchableOpacity onPress={() => refetchQuotations()} disabled={isRefetchingQuotations}>
                    <RefreshCw size={24} color={TOKENS.colors.text} style={{ opacity: isRefetchingQuotations ? 0.5 : 1 }} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => navigation.goBack()} accessibilityLabel="Voltar">
                    <ChevronLeft size={24} color={TOKENS.colors.text} />
                </TouchableOpacity>
            </View>
        );

        return (
            <Screen scroll>
                <TopHeader title="Rastreio" rightAction={refreshAction} style={{ paddingHorizontal: 0 }} />

                <FadeInView delay={0}>
                    <LedgerCard>
                        <View style={styles.cardHeaderRow}>
                            <StatusBadge status={config.statusKey} label={config.label} icon={({ size, color }) => <Ionicons name={config.icon} size={size} color={color} />} />
                            <Text style={styles.cardDateText}>{quotation.eventDate ? formatDateAO(quotation.eventDate) : 'A definir'}</Text>
                        </View>
                        <KpiRow label="Tipo de Evento" value={quotation.eventType.charAt(0).toUpperCase() + quotation.eventType.slice(1)} />
                        <KpiRow label="Convidados" value={quotation.guestCount} />
                        {quotation.complements?.length > 0 && (
                            <View style={{ marginBottom: TOKENS.spacing[4] }}>
                                <Text style={styles.kpiLabel}>Complementos:</Text>
                                <Text style={styles.kpiValueSmall}>{quotation.complements.map(c => c.name).join(', ')}</Text>
                            </View>
                        )}
                        <View style={styles.kpiDivider} />
                        <KpiRow label="Orçamento (Aprox.)" value={formatKz(displayPrice)} tone="gold" />
                    </LedgerCard>
                </FadeInView>


                {quotation.status === 'PROPOSAL_SENT' && (
                    <View style={{ marginBottom: TOKENS.spacing[6], gap: TOKENS.spacing[4] }}>
                        <PrimaryButton
                            title={acceptMutation.isPending ? "A processar..." : "Aceitar Proposta"}
                            disabled={acceptMutation.isPending}
                            onPress={handleAccept}
                            style={{ backgroundColor: TOKENS.colors.success }}
                        />
                        <SecondaryButton
                            title="Descarregar Proposta (PDF)"
                            onPress={() => {
                                const { Linking } = require('react-native');
                                const { API_CONFIG } = require('../config/api.config');
                                Linking.openURL(`${API_CONFIG.BASE_URL}/quotations/${quotationId}/pdf`);
                            }}
                        />
                    </View>
                )}

                {quotation.status === 'ACCEPTED' && (
                    <Animated.View style={[styles.pulseBadge, { opacity: pulseAnim }]}>
                        <AlertCircle size={20} color={TOKENS.colors.warning} style={{ marginRight: TOKENS.spacing[2] }} />
                        <Text style={styles.pulseText}>Aguarda Confirmação Final</Text>
                    </Animated.View>
                )}

                <FadeInView delay={30}>
                    <Text style={styles.sectionTitle}>Progresso</Text>
                    <View style={styles.timeline}>
                        {QUOTATION_TIMELINE.map((item, index) => {
                            const stepCfg = QUOTATION_STATUS_CONFIG[item.key];
                            let activeCfg = stepCfg;
                            if (item.key === 'PROPOSAL_SENT' && quotation.status === 'NEGOTIATING') {
                                activeCfg = QUOTATION_STATUS_CONFIG.NEGOTIATING;
                            }

                            const isCompleted = activeCfg.step <= currentStep;
                            const isCurrent = activeCfg.step === currentStep;
                            const isFuture = activeCfg.step > currentStep;
                            const isLast = index === QUOTATION_TIMELINE.length - 1;

                            const dotColor = isCompleted ? TOKENS.colors.gold : TOKENS.colors.border;
                            const iconColor = isCompleted ? TOKENS.colors.textInverse : (isCurrent ? TOKENS.colors.gold : TOKENS.colors.muted);

                            return (
                                <View key={item.key} style={styles.stepContainer}>
                                    <View style={styles.stepLeft}>
                                        <View style={[
                                            styles.iconBox,
                                            isCompleted ? { backgroundColor: TOKENS.colors.gold } : { backgroundColor: TOKENS.colors.surface2 },
                                            isCurrent && { borderWidth: 1, borderColor: TOKENS.colors.gold }
                                        ]}>
                                            <Ionicons name={activeCfg.icon} size={18} color={iconColor} />
                                        </View>
                                        {!isLast && <View style={[styles.timelineLine, { backgroundColor: isCompleted ? TOKENS.colors.gold : TOKENS.colors.border }]} />}
                                    </View>
                                    <View style={styles.stepRight}>
                                        <Text style={[styles.stepTitle, (isCompleted || isCurrent) ? { color: TOKENS.colors.text } : { color: TOKENS.colors.muted }]}>
                                            {activeCfg.label}
                                        </Text>
                                        <Text style={[styles.stepDesc, (isCompleted || isCurrent) ? { color: TOKENS.colors.textTertiary } : { color: `${TOKENS.colors.muted}80` }]}>
                                            {activeCfg.desc}
                                        </Text>
                                    </View>
                                </View>
                            );
                        })}
                    </View>
                </FadeInView>
            </Screen>
        );
    }

    // ═══════════════════════════════════════════════════════════════
    // ORDER FLOW 
    // ═══════════════════════════════════════════════════════════════
    return <OrderPaymentFlow orderId={orderId} />;
};

// ─── Separate component for order payment flow ───
const OrderPaymentFlow = ({ orderId }) => {
    const navigation = useNavigation();
    const queryClient = useQueryClient();

    const [payModalVisible, setPayModalVisible] = useState(false);
    const [phoneNumber, setPhoneNumber] = useState('');
    const [paymentInitiated, setPaymentInitiated] = useState(false);
    const [activeTransferInfo, setActiveTransferInfo] = useState(null); 
    const pollTimerRef = useRef(null);
    const pollCountRef = useRef(0);

    const { data: order, isLoading: loadingOrder, refetch: refetchOrder, isRefetching: isRefetchingOrder } = useQuery({
        queryKey: ['order', orderId],
        queryFn: () => ApiService.getOrderById(orderId),
        enabled: !!orderId,
    });

    const { data: payments = [], refetch: refetchPayments, isRefetching: isRefetchingPayments } = useQuery({
        queryKey: ['payments', orderId],
        queryFn: () => ApiService.getPaymentsByOrder(orderId),
        enabled: !!orderId,
    });

    const gpoMutation = useMutation({
        mutationFn: ({ oid, phone }) => ApiService.initiateGpoPayment(oid, phone),
        onSuccess: () => {
            setPayModalVisible(false);
            setPaymentInitiated(true);
            setActiveTransferInfo(null);
            startGpoPolling();
            Alert.alert('Pedido Enviado ✅', 'Confirme o pagamento na app Multicaixa Express do seu telemóvel.', [{ text: 'OK' }]);
        },
        onError: (err) => {
            Alert.alert('Erro no Pagamento', err.message || 'Tente novamente.');
        },
    });

    const transferMutation = useMutation({
        mutationFn: (oid) => ApiService.createBankTransfer(oid),
        onSuccess: (data) => {
            setActiveTransferInfo(data);
            setPaymentInitiated(false);
        },
        onError: (err) => {
            Alert.alert('Erro na Transferência', err.message || 'Não foi possível gerar os dados.');
        }
    });

    const uploadMutation = useMutation({
        mutationFn: ({ paymentId, fileUri, fileName, mimeType }) =>
            ApiService.uploadPaymentProof(paymentId, fileUri, fileName, mimeType),
        onSuccess: () => {
            Alert.alert('Submetido ✅', 'Comprovativo enviado. Aguarde validação da tesouraria.');
            handleManualRefresh();
        },
        onError: (err) => {
            Alert.alert('Erro no Upload', err.message || 'Não foi possível enviar o comprovativo.');
        }
    });

    const startGpoPolling = useCallback(() => {
        if (pollTimerRef.current) clearInterval(pollTimerRef.current);
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
                    Alert.alert('Pagamento Confirmado ✅', 'O seu pagamento Multicaixa foi recebido com sucesso!');
                }
            }
        }, 5000);
    }, [orderId, refetchOrder, refetchPayments, queryClient]);

    useEffect(() => {
        return () => {
            if (pollTimerRef.current) clearInterval(pollTimerRef.current);
        };
    }, []);

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
        hapticMedium();
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
            hapticMedium();
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
        const bankName = bankDetails.bankName || bankDetails.bank;
        const message = `Puculuxa — Detalhes para Transferência\n\n` +
            `Banco: ${bankName}\n` +
            `Beneficiário: ${bankDetails.beneficiary}\n` +
            `IBAN: ${bankDetails.iban}\n` +
            `NIF: ${bankDetails.nif || "--"}\n\n` +
            `Valor: ${formatKz(order?.total || 0)}\n` +
            `Referência: ${payment.merchantRef}\n\n` +
            `Agradecemos a preferência!`;

        try {
            await Share.share({ message });
        } catch (error) {
            // Ignore
        }
    };

    const financialStatus = order?.financialStatus || 'UNPAID';
    const statusCfg = FINANCIAL_STATUS_CONFIG[financialStatus] || FINANCIAL_STATUS_CONFIG.UNPAID;
    const isPaid = financialStatus === 'PAID';
    const isCredit = order?.paymentMode === 'GOVERNMENT_CREDIT' || ['IN_CREDIT', 'OVERDUE'].includes(financialStatus);

    const lastPayment = payments.length > 0 ? payments[payments.length - 1] : null;
    const paymentMethod = lastPayment?.method || lastPayment?.paymentMethod;
    const isAwaitingProof = lastPayment && lastPayment.status === 'AWAITING_PROOF' && paymentMethod === 'BANK_TRANSFER';
    const isFailed = lastPayment && lastPayment.status === 'FAILED';
    const isTransferPanelActive = activeTransferInfo != null && !isPaid;

    const refreshAction = (
        <View style={{ flexDirection: 'row', gap: TOKENS.spacing[4] }}>
            <TouchableOpacity onPress={handleManualRefresh} disabled={isRefetchingOrder || isRefetchingPayments}>
                <RefreshCw size={24} color={TOKENS.colors.text} style={{ opacity: (isRefetchingOrder || isRefetchingPayments) ? 0.5 : 1 }} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => navigation.goBack()} accessibilityLabel="Voltar">
                <ChevronLeft size={24} color={TOKENS.colors.text} />
            </TouchableOpacity>
        </View>
    );

    if (loadingOrder) {
        return (
            <Screen scroll>
                <TopHeader title="Rastreio" rightAction={refreshAction} style={{ paddingHorizontal: 0 }} />
                <LoadingState title="A carregar encomenda..." />
            </Screen>
        );
    }

    return (
        <Screen scroll>
            <TopHeader title="Rastreio" rightAction={refreshAction} style={{ paddingHorizontal: 0 }} />

            {/* ── Order Info Card ── */}
            <FadeInView delay={0}>
                <LedgerCard>
                    <View style={styles.cardHeaderRow}>
                        <StatusBadge status={statusCfg.statusKey} label={statusCfg.label} />
                        <Text style={styles.cardDateText}>{order?.createdAt ? formatDateAO(order.createdAt) : '--'}</Text>
                    </View>

                    <KpiRow label="Referência" value={`#${(orderId || '').slice(-8).toUpperCase()}`} />
                    <KpiRow label="Estado logístico" value={order?.status || '--'} tone={order?.status === 'DELIVERED' ? 'success' : 'default'} />
                    
                    <View style={styles.kpiDivider} />
                    <KpiRow label="Total a Pagar" value={formatKz(order?.total || 0)} />
                </LedgerCard>
            </FadeInView>

            {/* ── Financial Status Card ── */}
            <FadeInView delay={30}>
                <LedgerCard style={{ marginTop: TOKENS.spacing[4], marginBottom: TOKENS.spacing[6] }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: TOKENS.spacing[2], marginBottom: TOKENS.spacing[4] }}>
                        <CreditCard size={18} color={TOKENS.colors.text} />
                        <Text style={textStyles.h3}>Estado Financeiro</Text>
                    </View>
                    
                    <KpiRow label="Situação" value={statusCfg.label} tone={statusCfg.tone} />
                    
                    {order?.paymentMode && (
                        <Text style={[textStyles.small, { color: TOKENS.colors.muted, marginTop: TOKENS.spacing[2] }]}>
                            Modo: {order.paymentMode === 'APPYPAY_GPO' ? 'Multicaixa Express' : order.paymentMode === 'BANK_TRANSFER' ? 'Transferência Bancária' : order.paymentMode === 'GOVERNMENT_CREDIT' ? 'Crédito Institucional' : order.paymentMode}
                        </Text>
                    )}
                    {(isRefetchingOrder || isRefetchingPayments) && (
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: TOKENS.spacing[2] }}>
                            <ActivityIndicator size="small" color={TOKENS.colors.muted} />
                            <Text style={[textStyles.small, { color: TOKENS.colors.muted, marginLeft: TOKENS.spacing[2] }]}>A sincronizar estado...</Text>
                        </View>
                    )}
                </LedgerCard>
            </FadeInView>

            {/* ── Institutional Credit Informative Panel ── */}
            {isCredit && (
                <FadeInView delay={60}>
                    <View style={styles.creditCard}>
                        <Building size={24} color={TOKENS.colors.gold} style={{ marginBottom: TOKENS.spacing[2] }} />
                        <Text style={styles.creditTitle}>Crédito Institucional</Text>
                        <Text style={styles.creditDesc}>Este pedido encontra-se sob acordo de Crédito Institucional. O pagamento será processado via Ordem de Saque / Tesouraria no prazo acordado.</Text>
                    </View>
                </FadeInView>
            )}

            {/* ── Bank Transfer Panel (Active Flow) ── */}
            {isTransferPanelActive && !isCredit && (
                <FadeInView delay={60}>
                    <LedgerCard style={{ marginBottom: TOKENS.spacing[6] }}>
                        <Text style={textStyles.h3}>🏦 Dados de Transferência (BAI)</Text>
                        <Text style={[textStyles.body, { color: TOKENS.colors.muted, marginBottom: TOKENS.spacing[4] }]}>Efetue o pagamento e envie o comprovativo.</Text>

                        <View style={styles.ibanBox}>
                            <View style={styles.ibanRow}>
                                <Text style={styles.ibanLabel}>IBAN</Text>
                                <Text style={styles.ibanValue} selectable>{activeTransferInfo.bankDetails.iban}</Text>
                            </View>
                            <View style={styles.ibanRow}>
                                <Text style={styles.ibanLabel}>Banco</Text>
                                <Text style={styles.ibanValue}>{activeTransferInfo.bankDetails.bankName || activeTransferInfo.bankDetails.bank}</Text>
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
                            <SecondaryButton title="Copiar / Partilhar Dados" onPress={handleShareBankDetails} />
                            <PrimaryButton
                                title={uploadMutation.isPending ? "A enviar..." : "📎 Enviar Comprovativo"}
                                disabled={uploadMutation.isPending}
                                onPress={() => handleUploadProof(activeTransferInfo.payment.id)}
                                style={{ backgroundColor: TOKENS.colors.success }}
                            />
                        </View>
                    </LedgerCard>
                </FadeInView>
            )}

            {/* ── Payment States Feedback ── */}
            {isPaid && (
                <FadeInView delay={60}>
                    <View style={styles.paidCard}>
                        <CheckCircle size={24} color={TOKENS.colors.success} />
                        <Text style={styles.paidText}>Pagamento confirmado ✅</Text>
                    </View>
                </FadeInView>
            )}

            {isAwaitingProof && !isPaid && !isTransferPanelActive && (
                <View style={styles.waitingCard}>
                    <ActivityIndicator size="small" color={TOKENS.colors.gold} style={{ marginRight: TOKENS.spacing[2] }} />
                    <View style={{ flex: 1 }}>
                        <Text style={styles.waitingTitle}>Aguardando validação da tesouraria</Text>
                        <Text style={styles.waitingDesc}>O comprovativo foi recebido e está em análise.</Text>
                    </View>
                    <TouchableOpacity style={styles.microBtn} onPress={() => handleUploadProof(lastPayment.id)}>
                        <UploadCloud size={16} color={TOKENS.colors.gold} />
                    </TouchableOpacity>
                </View>
            )}

            {isFailed && !isPaid && (
                <View style={[styles.waitingCard, { backgroundColor: `${TOKENS.colors.danger}20`, borderColor: `${TOKENS.colors.danger}40` }]}>
                    <AlertCircle size={24} color={TOKENS.colors.danger} style={{ marginRight: TOKENS.spacing[2] }} />
                    <View style={{ flex: 1 }}>
                        <Text style={[styles.waitingTitle, { color: TOKENS.colors.danger }]}>Pagamento Rejeitado</Text>
                        <Text style={[styles.waitingDesc, { color: `${TOKENS.colors.danger}80` }]}>Motivo: {lastPayment.metadata?.failureReason || 'Comprovativo inválido.'}</Text>
                    </View>
                </View>
            )}

            {paymentInitiated && !isPaid && (
                <View style={styles.waitingCard}>
                    <ActivityIndicator size="small" color={TOKENS.colors.gold} style={{ marginRight: TOKENS.spacing[2] }} />
                    <View style={{ flex: 1 }}>
                        <Text style={styles.waitingTitle}>A iniciar via Multicaixa…</Text>
                        <Text style={styles.waitingDesc}>Confirme o pagamento na app Multicaixa Express.</Text>
                    </View>
                </View>
            )}

            {/* ── Core Action Buttons ── */}
            {!isPaid && !isCredit && !isTransferPanelActive && !isAwaitingProof && (
                <View style={{ marginBottom: TOKENS.spacing[6], gap: TOKENS.spacing[4] }}>
                    <PrimaryButton
                        title="💳 Pagar Agora (Multicaixa)"
                        onPress={handlePayPress}
                        disabled={transferMutation.isPending}
                    />
                    <SecondaryButton
                        title={transferMutation.isPending ? "A gerar dados..." : "🏦 Pagar por Transferência Bancária"}
                        onPress={handleBankTransferPress}
                        disabled={transferMutation.isPending}
                    />
                </View>
            )}

            {/* ── Order Timeline ── */}
            <FadeInView delay={90}>
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
                        const isCompleted = step.done;

                        const dotColor = isCompleted ? TOKENS.colors.gold : TOKENS.colors.border;
                        const iconColor = isCompleted ? TOKENS.colors.textInverse : TOKENS.colors.muted;

                        return (
                            <View key={step.id} style={styles.stepContainer}>
                                <View style={styles.stepLeft}>
                                    <View style={[styles.iconBox, isCompleted ? { backgroundColor: TOKENS.colors.gold } : { backgroundColor: TOKENS.colors.surface2 }]}>
                                        <Icon size={18} color={iconColor} />
                                    </View>
                                    {!isLast && <View style={[styles.timelineLine, { backgroundColor: isCompleted ? TOKENS.colors.gold : TOKENS.colors.border }]} />}
                                </View>
                                <View style={styles.stepRight}>
                                    <Text style={[styles.stepTitle, isCompleted ? { color: TOKENS.colors.text } : { color: TOKENS.colors.muted }]}>{step.title}</Text>
                                </View>
                            </View>
                        );
                    })}
                </View>
            </FadeInView>

            {/* ── Phone Number Modal for GPO ── */}
            <Modal visible={payModalVisible} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalCard}>
                        <View style={styles.modalHeader}>
                            <Text style={textStyles.h2}>Multicaixa Express</Text>
                            <TouchableOpacity onPress={() => setPayModalVisible(false)} hitSlop={10}>
                                <X size={24} color={TOKENS.colors.muted} />
                            </TouchableOpacity>
                        </View>

                        <Text style={[textStyles.bodyMedium, { color: TOKENS.colors.muted, marginBottom: TOKENS.spacing[2] }]}>Número de telefone</Text>
                        <TextInput
                            style={styles.modalInput}
                            value={phoneNumber}
                            onChangeText={setPhoneNumber}
                            placeholder="244XXXXXXXXX"
                            placeholderTextColor={TOKENS.colors.textTertiary}
                            keyboardType="phone-pad"
                            maxLength={12}
                        />
                        <Text style={[textStyles.small, { color: TOKENS.colors.textTertiary, marginTop: TOKENS.spacing[2] }]}>Formato: 244 seguido de 9 dígitos</Text>

                        <View style={styles.modalAmountRow}>
                            <Text style={[textStyles.bodyMedium, { color: TOKENS.colors.muted }]}>Valor a pagar:</Text>
                            <Text style={Theme.typography.priceLarge}>{formatKz(order?.total || 0)}</Text>
                        </View>

                        <PrimaryButton
                            title="Confirmar Pagamento"
                            onPress={handleConfirmPay}
                            loading={gpoMutation.isPending}
                            disabled={gpoMutation.isPending}
                            style={{ marginTop: TOKENS.spacing[6] }}
                        />
                    </View>
                </View>
            </Modal>
        </Screen>
    );
};

const styles = StyleSheet.create({
    cardHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: TOKENS.spacing[4],
    },
    cardDateText: {
        ...textStyles.caption,
        textTransform: 'none',
    },
    cardBody: {
        marginBottom: TOKENS.spacing[4],
    },
    cardTitle: {
        ...textStyles.h3,
        marginBottom: TOKENS.spacing[1],
    },
    cardSubtitle: {
        ...textStyles.body,
        color: TOKENS.colors.muted,
    },
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: TOKENS.spacing[4],
        borderTopWidth: 1,
        borderTopColor: TOKENS.colors.border,
    },
    cardPrice: {
        ...textStyles.h2,
        color: TOKENS.colors.gold,
    },
    kpiLabel: {
        ...textStyles.body,
        color: TOKENS.colors.muted,
    },
    kpiValueSmall: {
        ...textStyles.body,
        fontFamily: 'Fraunces_600SemiBold',
    },
    kpiDivider: {
        height: 1,
        backgroundColor: TOKENS.colors.border,
        marginVertical: TOKENS.spacing[3],
    },

    sectionTitle: { ...textStyles.h3, marginBottom: TOKENS.spacing[4] },

    pulseBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: `${TOKENS.colors.warning}15`, padding: TOKENS.spacing[3], borderRadius: TOKENS.radius.soft, marginBottom: TOKENS.spacing[6], borderWidth: 1, borderColor: TOKENS.colors.warning },
    pulseText: { ...textStyles.bodyMedium, color: TOKENS.colors.warning },

    timeline: { paddingLeft: TOKENS.spacing[2], marginBottom: TOKENS.spacing[6] },
    stepContainer: { flexDirection: 'row', minHeight: 80 },
    stepLeft: { alignItems: 'center', width: 40, marginRight: TOKENS.spacing[4] },
    iconBox: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
    timelineLine: { width: 2, flex: 1, marginVertical: TOKENS.spacing[1] },
    stepRight: { flex: 1, paddingTop: TOKENS.spacing[2] },
    stepTitle: { ...textStyles.bodyBold },
    stepDesc: { ...textStyles.small, marginTop: TOKENS.spacing[1], lineHeight: 20 },

    qTimeline: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: TOKENS.spacing[4] },
    qTimelineStepContainer: { alignItems: 'center', flex: 1 },
    qTimelineDotContainer: { flexDirection: 'row', alignItems: 'center', width: '100%', height: 28 },
    qTimelineOuterDot: { justifyContent: 'center', alignItems: 'center', zIndex: 1, position: 'absolute', left: '50%', transform: [{ translateX: -12 }] },
    qTimelineInnerDot: {},
    qTimelineLine: { height: 1, flex: 1, width: '100%', position: 'absolute', left: '50%', top: 13, zIndex: 0 },
    qTimelineLabel: { ...textStyles.caption, fontSize: 9, marginTop: TOKENS.spacing[1], textAlign: 'center', textTransform: 'none' },

    creditCard: {
        backgroundColor: `${TOKENS.colors.gold}15`, padding: TOKENS.spacing[4], borderRadius: TOKENS.radius.card, marginBottom: TOKENS.spacing[6],
        borderWidth: 1, borderColor: `${TOKENS.colors.gold}40`,
    },
    creditTitle: { ...textStyles.h3, color: TOKENS.colors.gold, marginBottom: TOKENS.spacing[1] },
    creditDesc: { ...textStyles.small, color: TOKENS.colors.gold, opacity: 0.8 },

    ibanBox: { backgroundColor: TOKENS.colors.surface2, padding: TOKENS.spacing[4], borderRadius: TOKENS.radius.soft, marginBottom: TOKENS.spacing[4] },
    ibanRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: TOKENS.spacing[2] },
    ibanLabel: { ...textStyles.small, color: TOKENS.colors.muted },
    ibanValue: { ...textStyles.bodyBold, color: TOKENS.colors.textInverse, fontFamily: 'monospace' }, // Uses system monospace for numbers
    transferActions: { gap: TOKENS.spacing[3] },

    waitingCard: {
        flexDirection: 'row', alignItems: 'center', backgroundColor: `${TOKENS.colors.gold}15`,
        padding: TOKENS.spacing[4], borderRadius: TOKENS.radius.soft, marginBottom: TOKENS.spacing[4], borderWidth: 1, borderColor: `${TOKENS.colors.gold}40`,
    },
    waitingTitle: { ...textStyles.bodyBold, color: TOKENS.colors.gold },
    waitingDesc: { ...textStyles.small, color: TOKENS.colors.gold, opacity: 0.8, marginTop: 2 },
    microBtn: { padding: TOKENS.spacing[2], backgroundColor: `${TOKENS.colors.gold}20`, borderRadius: TOKENS.radius.soft },

    paidCard: {
        flexDirection: 'row', alignItems: 'center', gap: TOKENS.spacing[2], backgroundColor: `${TOKENS.colors.success}15`,
        padding: TOKENS.spacing[4], borderRadius: TOKENS.radius.soft, marginBottom: TOKENS.spacing[6], borderWidth: 1, borderColor: `${TOKENS.colors.success}40`,
    },
    paidText: { ...textStyles.bodyBold, color: TOKENS.colors.success },

    modalOverlay: { flex: 1, backgroundColor: '#000000B3', justifyContent: 'flex-end' },
    modalCard: {
        backgroundColor: TOKENS.colors.surface, borderTopLeftRadius: 28, borderTopRightRadius: 28,
        paddingHorizontal: TOKENS.spacing[6], paddingTop: TOKENS.spacing[6], paddingBottom: TOKENS.spacing[10],
    },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: TOKENS.spacing[6] },
    modalInput: {
        backgroundColor: TOKENS.colors.background, color: TOKENS.colors.text, fontFamily: 'monospace',
        fontSize: 20, paddingHorizontal: TOKENS.spacing[4], paddingVertical: TOKENS.spacing[4], borderRadius: TOKENS.radius.soft,
        borderWidth: 1, borderColor: TOKENS.colors.border, letterSpacing: 2,
    },
    modalAmountRow: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        backgroundColor: TOKENS.colors.background, padding: TOKENS.spacing[4], borderRadius: TOKENS.radius.soft, marginTop: TOKENS.spacing[5],
    },
});
