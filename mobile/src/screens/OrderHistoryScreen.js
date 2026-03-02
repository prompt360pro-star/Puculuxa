import React, { useState, useCallback, useMemo } from 'react';
import {
    View, Text, StyleSheet, FlatList, TouchableOpacity, LayoutAnimation,
    UIManager, Platform, RefreshControl, SectionList
} from 'react-native';
import { ChevronLeft, ChevronDown, ChevronUp, Package, Clock, CheckCircle, Truck, XCircle, Paperclip, Eye, FileText, MessageCircle, ChevronRight } from 'lucide-react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import { ApiService } from '../services/api';
import { Theme, T } from '../theme';
import { Skeleton } from '../components/ui/Skeleton';
import { PremiumButton } from '../components/ui/PremiumButton';
import { formatKz, formatDateAO } from '../utils/errorMessages';

if (Platform.OS === 'android') {
    UIManager.setLayoutAnimationEnabledExperimental?.(true);
}

// Order Status config (existing)
const STATUS_CONFIG = {
    PENDING: { label: 'Pendente', icon: Clock, bg: Theme.colors.warningBg, color: Theme.colors.warning },
    CONFIRMED: { label: 'Confirmado', icon: CheckCircle, bg: Theme.colors.successBg, color: Theme.colors.success },
    IN_PROGRESS: { label: 'Em Preparação', icon: Package, bg: Theme.colors.infoBg, color: Theme.colors.info },
    DELIVERED: { label: 'Entregue', icon: Truck, bg: Theme.colors.successBg, color: Theme.colors.success },
    CANCELLED: { label: 'Cancelado', icon: XCircle, bg: Theme.colors.errorBg, color: Theme.colors.error },
};

const FILTER_PILLS = ['Todos', 'Pendente', 'Em Preparação', 'Entregue', 'Cancelado'];

// Quotation Status config
const QUOTATION_STATUS_CONFIG = {
    SUBMITTED: { label: 'Enviado', icon: 'paper-plane', color: '#3B82F6', step: 1 },
    IN_REVIEW: { label: 'Em Análise', icon: 'eye', color: '#F59E0B', step: 2 },
    PROPOSAL_SENT: { label: 'Proposta Pronta', icon: 'document-text', color: '#8B5CF6', step: 3 },
    NEGOTIATING: { label: 'Em Negociação', icon: 'chatbubbles', color: '#EC4899', step: 3 },
    ACCEPTED: { label: 'Aceite', icon: 'checkmark-circle', color: '#10B981', step: 4 },
    CONVERTED: { label: 'Encomenda', icon: 'cube', color: Theme.colors.success, step: 5 },
};

const QUOTATION_TIMELINE_STEPS = [
    { key: 'SUBMITTED', shortLabel: 'Enviado', step: 1 },
    { key: 'IN_REVIEW', shortLabel: 'Análise', step: 2 },
    { key: 'PROPOSAL_SENT', shortLabel: 'Proposta', step: 3 },
    { key: 'ACCEPTED', shortLabel: 'Aceite', step: 4 },
    { key: 'CONVERTED', shortLabel: 'Encomenda', step: 5 },
];

const StatusBadge = ({ status }) => {
    const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.PENDING;
    const Ic = cfg.icon;
    return (
        <View style={[sb.container, { backgroundColor: cfg.bg }]}>
            <Ic size={12} color={cfg.color} />
            <Text style={[sb.text, { color: cfg.color }]}>{cfg.label}</Text>
        </View>
    );
};

const sb = StyleSheet.create({
    container: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 4, borderRadius: Theme.radius.full },
    text: { fontFamily: 'Poppins_600SemiBold', fontSize: 11 },
});

// Quotation Card (Section 1)
const QuotationCard = React.memo(({ quotation }) => {
    const navigation = useNavigation();
    const config = QUOTATION_STATUS_CONFIG[quotation.status] || QUOTATION_STATUS_CONFIG.SUBMITTED;
    const currentStep = config.step;

    // Determine price to show
    let displayPrice = quotation.estimatedTotal;
    if (quotation.versions && quotation.versions.length > 0) {
        displayPrice = quotation.versions[0].price; // latest version
    }

    return (
        <TouchableOpacity
            style={styles.quotationCard}
            activeOpacity={0.9}
            onPress={() => navigation.navigate('OrderTracking', { quotationId: quotation.id, type: 'quotation' })}
        >
            <View style={styles.qHeader}>
                <View style={[styles.qBadge, { backgroundColor: `${config.color}20` }]}>
                    <Ionicons name={config.icon} size={14} color={config.color} />
                    <Text style={[styles.qBadgeText, { color: config.color }]}>{config.label}</Text>
                </View>
                <Text style={styles.qDate}>{formatDateAO(quotation.createdAt)}</Text>
            </View>

            <View style={styles.qBody}>
                <Text style={styles.qTitle}>{quotation.eventType.charAt(0).toUpperCase() + quotation.eventType.slice(1)}</Text>
                <Text style={styles.qSubtitle}>{quotation.guestCount} convidados</Text>
            </View>

            <View style={styles.qTimeline}>
                {QUOTATION_TIMELINE_STEPS.map((step, index) => {
                    const isCompleted = step.step <= currentStep;
                    const isCurrent = step.step === currentStep;
                    const isPast = step.step < currentStep;
                    const isLast = index === QUOTATION_TIMELINE_STEPS.length - 1;

                    const dotColor = isCompleted ? config.color : '#374151';
                    const dotSize = isCurrent ? 14 : 10;
                    const containerSize = isCurrent ? 28 : 24;

                    return (
                        <View key={step.key} style={styles.qTimelineStepContainer}>
                            <View style={styles.qTimelineDotContainer}>
                                <View style={[
                                    styles.qTimelineOuterDot,
                                    { width: containerSize, height: containerSize, borderRadius: containerSize / 2 },
                                    isCurrent && { borderWidth: 3, borderColor: Theme.colors.white, backgroundColor: dotColor }
                                ]}>
                                    {!isCurrent && <View style={[styles.qTimelineInnerDot, { backgroundColor: dotColor, width: dotSize, height: dotSize, borderRadius: dotSize / 2 }]} />}
                                </View>
                                {!isLast && (
                                    <View style={[styles.qTimelineLine, { backgroundColor: isPast ? config.color : '#374151' }]} />
                                )}
                            </View>
                            <Text style={styles.qTimelineLabel}>{step.shortLabel}</Text>
                        </View>
                    );
                })}
            </View>

            <View style={styles.qFooter}>
                <Text style={styles.qPrice}>{formatKz(displayPrice)}</Text>
                <ChevronRight size={20} color={Theme.colors.textTertiary} />
            </View>
        </TouchableOpacity>
    );
});


// Order Card (Section 2)
const OrderCard = React.memo(({ order }) => {
    const [expanded, setExpanded] = useState(false);
    const navigation = useNavigation();

    const toggleExpand = () => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setExpanded(!expanded);
    };

    return (
        <TouchableOpacity style={styles.orderCard} onPress={toggleExpand} activeOpacity={0.9} accessibilityRole="button">
            <View style={styles.orderHeader}>
                <View style={{ flex: 1 }}>
                    <Text style={styles.orderId}>Pedido #{order.id?.toString().slice(-6)}</Text>
                    <Text style={styles.orderDate}>{formatDateAO(order.createdAt)}</Text>
                </View>
                <StatusBadge status={order.status} />
                {expanded ? <ChevronUp size={16} color={Theme.colors.textTertiary} /> : <ChevronDown size={16} color={Theme.colors.textTertiary} />}
            </View>

            {expanded ? (
                <View style={styles.orderExpanded}>
                    <View style={styles.orderDetailRow}>
                        <Text style={styles.orderDetailLabel}>Total</Text>
                        <Text style={styles.orderDetailValue}>{formatKz(order.total)}</Text>
                    </View>
                    {order.items?.length > 0 ? (
                        <View style={styles.orderDetailRow}>
                            <Text style={styles.orderDetailLabel}>Items</Text>
                            <Text style={styles.orderDetailValue}>{order.items.length}</Text>
                        </View>
                    ) : null}
                    {order.status === 'IN_PROGRESS' || order.status === 'CONFIRMED' ? (
                        <PremiumButton
                            title="Acompanhar Pedido"
                            onPress={() => navigation.navigate('OrderTracking', { orderId: order.id, type: 'order' })}
                            variant="ghost"
                            size="sm"
                            style={{ marginTop: 12 }}
                        />
                    ) : null}
                </View>
            ) : null}
        </TouchableOpacity>
    );
});

export const OrderHistoryScreen = ({ navigation }) => {
    const [filter, setFilter] = useState('Todos');

    const { data: orders = [], isLoading: isLoadingOrders, refetch: refetchOrders, isRefetching: isRefetchingOrders } = useQuery({
        queryKey: ['myOrders'],
        queryFn: () => ApiService.getMyOrders(),
        staleTime: 2 * 60 * 1000,
    });

    const { data: quotations = [], isLoading: isLoadingQuotations, refetch: refetchQuotations, isRefetching: isRefetchingQuotations } = useQuery({
        queryKey: ['myQuotations'],
        queryFn: () => ApiService.getMyQuotations(),
        staleTime: 60 * 1000,
    });

    const activeQuotations = useMemo(() => {
        return quotations.filter(q => q.status !== 'CONVERTED' && q.status !== 'REJECTED' && q.status !== 'EXPIRED');
    }, [quotations]);

    const filteredOrders = useMemo(() => {
        if (filter === 'Todos') return orders;
        return orders.filter(o => {
            const cfg = STATUS_CONFIG[o.status];
            return cfg?.label === filter;
        });
    }, [orders, filter]);

    const isLoading = isLoadingOrders || isLoadingQuotations;
    const isRefetching = isRefetchingOrders || isRefetchingQuotations;

    const onRefresh = useCallback(() => {
        refetchOrders();
        refetchQuotations();
    }, [refetchOrders, refetchQuotations]);

    // Build SectionList data
    const sections = [];
    if (activeQuotations.length > 0) {
        sections.push({
            title: 'Orçamentos em Curso',
            type: 'quotation',
            data: activeQuotations,
        });
    }
    if (filteredOrders.length > 0 || filter !== 'Todos') {
        sections.push({
            title: 'Encomendas Confirmadas',
            type: 'order',
            data: filteredOrders,
        });
    }

    const ListHeader = useMemo(() => (
        <>
            <LinearGradient colors={[Theme.colors.gradientStart, Theme.colors.gradientEnd]} style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} accessibilityLabel="Voltar">
                    <ChevronLeft size={22} color={Theme.colors.white} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Os Meus Pedidos</Text>
                <View style={{ width: 36 }} />
            </LinearGradient>

            <FlatList
                data={FILTER_PILLS}
                horizontal
                showsHorizontalScrollIndicator={false}
                keyExtractor={item => item}
                contentContainerStyle={styles.filterRow}
                renderItem={({ item }) => (
                    <TouchableOpacity
                        style={[styles.filterPill, filter === item ? styles.filterPillActive : null]}
                        onPress={() => setFilter(item)}
                        accessibilityRole="tab"
                        accessibilityState={{ selected: filter === item }}
                    >
                        <Text style={[styles.filterText, filter === item ? styles.filterTextActive : null]}>{item}</Text>
                    </TouchableOpacity>
                )}
            />
        </>
    ), [filter]);

    const EmptyState = () => (
        <View style={styles.emptyState}>
            <Text style={{ fontSize: 48, marginBottom: 16 }}>📦</Text>
            <Text style={styles.emptyTitle}>Sem pedidos em curso</Text>
            <Text style={styles.emptySubtitle}>Os teus pedidos e orçamentos aparecerão aqui.</Text>
            <PremiumButton title="Pedir Orçamento" onPress={() => navigation.navigate('QuotationTab')} size="md" style={{ marginTop: 24 }} />
        </View>
    );

    return (
        <View style={styles.container}>
            {ListHeader}

            {isLoading ? (
                <View style={{ paddingHorizontal: 20, gap: 12, marginTop: 16 }}>
                    <Skeleton width="100%" height={140} borderRadius={16} />
                    <Skeleton width="100%" height={140} borderRadius={16} />
                </View>
            ) : sections.length === 0 ? (
                <EmptyState />
            ) : (
                <SectionList
                    sections={sections}
                    keyExtractor={(item) => item.id?.toString()}
                    renderItem={({ item, section }) => {
                        if (section.type === 'quotation') {
                            return <QuotationCard quotation={item} />;
                        }
                        return <OrderCard order={item} />;
                    }}
                    renderSectionHeader={({ section }) => {
                        if (section.type === 'order' && activeQuotations.length > 0) {
                            return (
                                <View style={styles.sectionSeparator}>
                                    <View style={styles.sectionSeparatorLine} />
                                    <Text style={styles.sectionSeparatorText}>{section.title}</Text>
                                    <View style={styles.sectionSeparatorLine} />
                                </View>
                            );
                        }
                        return null;
                    }}
                    contentContainerStyle={styles.listContent}
                    refreshControl={
                        <RefreshControl refreshing={isRefetching} onRefresh={onRefresh} colors={[Theme.colors.primary]} tintColor={Theme.colors.primary} />
                    }
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0F0F0F' },
    listContent: { paddingBottom: 32 },
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingTop: 52, paddingBottom: 16, paddingHorizontal: 16,
    },
    backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
    headerTitle: { ...T.h3, color: Theme.colors.white },
    filterRow: { paddingHorizontal: 16, paddingVertical: 14, gap: 8 },
    filterPill: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: Theme.radius.full, backgroundColor: '#1A1A1A', borderWidth: 1, borderColor: '#2A2A2A' },
    filterPillActive: { backgroundColor: Theme.colors.primary, borderColor: Theme.colors.primary },
    filterText: { fontFamily: T.bodySmall.fontFamily, fontSize: 12, color: Theme.colors.textSecondary },
    filterTextActive: { color: Theme.colors.white, fontFamily: 'Poppins_600SemiBold' },

    // Order Card
    orderCard: {
        backgroundColor: '#1A1A1A',
        marginHorizontal: 16,
        marginBottom: 16,
        borderRadius: 16,
        padding: 20,
        borderWidth: 1,
        borderColor: '#2A2A2A',
    },
    orderHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    orderId: { fontFamily: 'Poppins_600SemiBold', fontSize: 14, color: Theme.colors.white },
    orderDate: { ...T.bodySmall, color: Theme.colors.textTertiary, marginTop: 2 },
    orderExpanded: { marginTop: 14, paddingTop: 14, borderTopWidth: 1, borderTopColor: '#2A2A2A' },
    orderDetailRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
    orderDetailLabel: { ...T.bodySmall, color: Theme.colors.textSecondary },
    orderDetailValue: { ...T.body, fontFamily: 'Poppins_500Medium', color: Theme.colors.white },

    // Quotation Card
    quotationCard: {
        backgroundColor: '#1A1A1A',
        marginHorizontal: 16,
        marginBottom: 16,
        borderRadius: 16,
        padding: 20,
        borderWidth: 1,
        borderColor: '#2A2A2A',
    },
    qHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    qBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, gap: 6 },
    qBadgeText: { fontFamily: 'Poppins_600SemiBold', fontSize: 11 },
    qDate: { fontSize: 12, color: '#9CA3AF', fontFamily: 'Poppins_400Regular' },
    qBody: { marginBottom: 16 },
    qTitle: { fontSize: 18, color: '#FFFFFF', fontFamily: 'Poppins_700Bold' },
    qSubtitle: { fontSize: 13, color: '#9CA3AF', fontFamily: 'Poppins_400Regular', marginTop: 2 },
    qTimeline: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16, paddingHorizontal: 4 },
    qTimelineStepContainer: { alignItems: 'center', flex: 1 },
    qTimelineDotContainer: { flexDirection: 'row', alignItems: 'center', width: '100%', height: 28 },
    qTimelineOuterDot: { justifyContent: 'center', alignItems: 'center', zIndex: 1, position: 'absolute', left: '50%', transform: [{ translateX: -12 }] },
    qTimelineInnerDot: {},
    qTimelineLine: { height: 2, flex: 1, width: '100%', position: 'absolute', left: '50%', top: 13, zIndex: 0 },
    qTimelineLabel: { fontSize: 9, color: '#9CA3AF', fontFamily: 'Poppins_500Medium', marginTop: 6, textAlign: 'center' },
    qFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 16, borderTopWidth: 1, borderTopColor: '#2A2A2A' },
    qPrice: { fontSize: 20, color: '#DC2626', fontFamily: 'Poppins_700Bold' },

    sectionSeparator: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 20, marginTop: 24, marginBottom: 12 },
    sectionSeparatorLine: { flex: 1, height: 1, backgroundColor: '#2A2A2A' },
    sectionSeparatorText: { marginHorizontal: 12, fontSize: 14, color: '#9CA3AF', fontFamily: 'Poppins_600SemiBold' },

    emptyState: { alignItems: 'center', paddingVertical: 60, paddingHorizontal: 40 },
    emptyTitle: { ...T.h3, textAlign: 'center', color: Theme.colors.white, marginBottom: 8 },
    emptySubtitle: { ...T.bodySmall, textAlign: 'center', color: Theme.colors.textTertiary },
});
