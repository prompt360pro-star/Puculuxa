import React, { useMemo, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Animated, Dimensions } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { ChevronLeft, CheckCircle, Package, Truck, Home, CreditCard } from 'lucide-react-native';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
            // Refetch the active quotations and close screens or provide feedback
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
                                title={acceptMutation.isPending ? "A processar..." : "✅ Aceitar Proposta"}
                                size="md"
                                disabled={acceptMutation.isPending}
                                onPress={handleAccept}
                                style={{ backgroundColor: '#10B981', borderColor: '#059669' }}
                            />
                            <PremiumButton
                                title="⬇️ Descarregar Proposta (PDF)"
                                size="md"
                                onPress={() => {
                                    const { Linking } = require('react-native');
                                    const { API_CONFIG } = require('../config/api.config');
                                    // Utiliza a route directa do backend para entregar o ficheiro de download no browser do device
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
                            // Se há versão NEGOTIATING a substituir PROPOSAL_SENT
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

    // Fallback: Fluxo de Encomendas Normal (type === 'order')
    // Placeholder estático do histórico existente
    const orderSteps = [
        { id: 1, title: 'Pedido Confirmado', time: '10:00', icon: CheckCircle, completed: true },
        { id: 2, title: 'Em Preparação', time: '10:15', icon: Package, completed: true },
        { id: 3, title: 'A Caminho', time: '11:30', icon: Truck, completed: false },
        { id: 4, title: 'Entregue', time: '--:--', icon: Home, completed: false },
    ];

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} accessibilityLabel="Voltar">
                    <ChevronLeft size={22} color={Theme.colors.white} />
                </TouchableOpacity>
                <Text style={styles.title}>Rastreio da Encomenda</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <View style={[styles.metaCard, { borderColor: '#2A2A2A', borderWidth: 1 }]}>
                    <Text style={styles.metaTitle}>Encomenda #{orderId}</Text>
                    <Text style={[styles.metaValue, { color: Theme.colors.success, fontFamily: 'Poppins_600SemiBold', marginTop: 4 }]}>
                        Entrega Estimada: Hoje, 12:00
                    </Text>
                </View>

                <View style={styles.timeline}>
                    {orderSteps.map((step, index) => {
                        const Icon = step.icon;
                        const isLast = index === orderSteps.length - 1;
                        return (
                            <View key={step.id} style={styles.stepContainer}>
                                <View style={styles.stepLeft}>
                                    <View style={[styles.iconBox, step.completed ? { backgroundColor: Theme.colors.primary } : styles.iconBoxFuture]}>
                                        <Icon size={18} color={step.completed ? '#FFFFFF' : '#6B7280'} />
                                    </View>
                                    {!isLast && <View style={[styles.timelineLine, step.completed ? { backgroundColor: Theme.colors.primary } : { backgroundColor: '#2A2A2A' }]} />}
                                </View>
                                <View style={styles.stepRight}>
                                    <View style={styles.stepInfoRow}>
                                        <Text style={[styles.stepTitle, step.completed ? { color: '#FFFFFF' } : { color: '#6B7280' }]}>{step.title}</Text>
                                        <Text style={{ fontSize: 12, color: '#9CA3AF' }}>{step.time}</Text>
                                    </View>
                                    {step.id === 3 && !step.completed && (
                                        <Text style={[styles.stepDesc, { color: '#9CA3AF' }]}>O estafeta está a caminho do destino.</Text>
                                    )}
                                </View>
                            </View>
                        );
                    })}
                </View>
            </ScrollView>
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
    stepInfoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    stepTitle: { fontFamily: 'Poppins_600SemiBold', fontSize: 15 },
    stepDesc: { fontFamily: 'Poppins_400Regular', fontSize: 13, marginTop: 4, lineHeight: 18 },
});
