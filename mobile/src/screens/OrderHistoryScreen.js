import React, { useState, useCallback, useMemo } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, RefreshControl, SectionList } from 'react-native';
import { ChevronDown, ChevronUp, Package, Clock, CheckCircle, Truck, XCircle, ChevronRight } from 'lucide-react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import { ApiService } from '../services/api';
import { TOKENS, Theme, textStyles } from '../theme';
import { Screen, TopHeader, LedgerCard, StatusBadge, KpiRow, EmptyState, LoadingState, PrimaryButton, FadeInView } from '../components/base/BaseComponents';
import { formatKz, formatDateAO } from '../utils/errorMessages';
import { Text } from 'react-native';

const STATUS_CONFIG = {
    PENDING: { label: 'Pendente', icon: Clock, statusKey: 'PENDING' },
    CONFIRMED: { label: 'Confirmado', icon: CheckCircle, statusKey: 'PAID' },
    IN_PROGRESS: { label: 'Em Preparação', icon: Package, statusKey: 'PAID' },
    DELIVERED: { label: 'Entregue', icon: Truck, statusKey: 'PAID' },
    CANCELLED: { label: 'Cancelado', icon: XCircle, statusKey: 'OVERDUE' }, // Mapping to Danger tone
};

const QUOTATION_STATUS_CONFIG = {
    SUBMITTED: { label: 'Enviado', icon: 'paper-plane', statusKey: 'UNPAID', step: 1 },
    IN_REVIEW: { label: 'Em Análise', icon: 'eye', statusKey: 'PENDING', step: 2 },
    PROPOSAL_SENT: { label: 'Proposta Pronta', icon: 'document-text', statusKey: 'PENDING', step: 3 },
    NEGOTIATING: { label: 'Em Negociação', icon: 'chatbubbles', statusKey: 'PENDING', step: 3 },
    ACCEPTED: { label: 'Aceite', icon: 'checkmark-circle', statusKey: 'PAID', step: 4 },
    CONVERTED: { label: 'Encomenda', icon: 'cube', statusKey: 'PAID', step: 5 },
};

const QUOTATION_TIMELINE_STEPS = [
    { key: 'SUBMITTED', shortLabel: 'Enviado', step: 1 },
    { key: 'IN_REVIEW', shortLabel: 'Análise', step: 2 },
    { key: 'PROPOSAL_SENT', shortLabel: 'Proposta', step: 3 },
    { key: 'ACCEPTED', shortLabel: 'Aceite', step: 4 },
    { key: 'CONVERTED', shortLabel: 'Encomenda', step: 5 },
];

const FILTER_PILLS = ['Todos', 'Pendente', 'Em Preparação', 'Entregue', 'Cancelado'];

// --- Quotation Card ---
const QuotationCard = React.memo(({ quotation }) => {
    const navigation = useNavigation();
    const config = QUOTATION_STATUS_CONFIG[quotation.status] || QUOTATION_STATUS_CONFIG.SUBMITTED;
    const currentStep = config.step;

    let displayPrice = quotation.estimatedTotal;
    if (quotation.versions && quotation.versions.length > 0) {
        displayPrice = quotation.versions[0].price;
    }

    // Lucide/Ionicons interop wrapper for StatusBadge
    const BadgeIcon = ({ size, color, ...props }) => (
        <Ionicons name={config.icon} size={size} color={color} {...props} />
    );

    return (
        <TouchableOpacity 
            activeOpacity={0.9} 
            onPress={() => navigation.navigate('OrderTracking', { quotationId: quotation.id, type: 'quotation' })}
        >
            <LedgerCard>
                <View style={styles.cardHeaderRow}>
                    <StatusBadge status={config.statusKey} label={config.label} icon={BadgeIcon} />
                    <Text style={styles.cardDateText}>{formatDateAO(quotation.createdAt)}</Text>
                </View>

                <View style={styles.cardBody}>
                    <Text style={styles.cardTitle}>{quotation.eventType.charAt(0).toUpperCase() + quotation.eventType.slice(1)}</Text>
                    <Text style={styles.cardSubtitle}>{quotation.guestCount} convidados</Text>
                </View>

                <View style={styles.qTimeline}>
                    {QUOTATION_TIMELINE_STEPS.map((step, index) => {
                        const isCompleted = step.step <= currentStep;
                        const isCurrent = step.step === currentStep;
                        const isPast = step.step < currentStep;
                        const isLast = index === QUOTATION_TIMELINE_STEPS.length - 1;

                        // Premium Noir timeline map
                        const dotColor = isCompleted ? TOKENS.colors.gold : TOKENS.colors.border;
                        const dotSize = isCurrent ? 12 : 8;
                        const containerSize = isCurrent ? 24 : 20;

                        return (
                            <View key={step.key} style={styles.qTimelineStepContainer}>
                                <View style={styles.qTimelineDotContainer}>
                                    <View style={[
                                        styles.qTimelineOuterDot,
                                        { width: containerSize, height: containerSize, borderRadius: containerSize / 2, transform: [{ translateX: -(containerSize / 2) }] },
                                        isCurrent && { borderWidth: 2, borderColor: TOKENS.colors.surface, backgroundColor: dotColor }
                                    ]}>
                                        {!isCurrent && <View style={[styles.qTimelineInnerDot, { backgroundColor: dotColor, width: dotSize, height: dotSize, borderRadius: dotSize / 2 }]} />}
                                    </View>
                                    {!isLast && (
                                        <View style={[styles.qTimelineLine, { backgroundColor: isPast ? TOKENS.colors.gold : TOKENS.colors.border }]} />
                                    )}
                                </View>
                                <Text style={styles.qTimelineLabel}>{step.shortLabel}</Text>
                            </View>
                        );
                    })}
                </View>

                <View style={styles.cardFooter}>
                    <Text style={styles.cardPrice}>{formatKz(displayPrice)}</Text>
                    <ChevronRight size={20} color={TOKENS.colors.muted} />
                </View>
            </LedgerCard>
        </TouchableOpacity>
    );
});

// --- Order Card ---
const OrderCard = React.memo(({ order }) => {
    const [expanded, setExpanded] = useState(false);
    const navigation = useNavigation();
    const config = STATUS_CONFIG[order.status] || STATUS_CONFIG.PENDING;

    return (
        <TouchableOpacity 
            activeOpacity={0.9} 
            onPress={() => setExpanded(!expanded)}
        >
            <LedgerCard>
                <View style={styles.cardHeaderRow}>
                    <StatusBadge status={config.statusKey} label={config.label} icon={config.icon} />
                    <Text style={styles.cardDateText}>{formatDateAO(order.createdAt)}</Text>
                </View>

                <View style={styles.cardBody}>
                    <Text style={styles.cardTitle}>Pedido #{order.id?.toString().slice(-6)}</Text>
                    <Text style={styles.cardSubtitle}>
                        {order.items?.length || 0} {(order.items?.length === 1) ? 'item' : 'items'}
                    </Text>
                </View>

                <View style={styles.cardFooter}>
                    <Text style={styles.cardPrice}>{formatKz(order.total)}</Text>
                    {expanded ? <ChevronUp size={20} color={TOKENS.colors.muted} /> : <ChevronDown size={20} color={TOKENS.colors.muted} />}
                </View>

                {expanded && (
                    <View style={styles.expandedSection}>
                        {(order.status === 'IN_PROGRESS' || order.status === 'CONFIRMED') && (
                            <PrimaryButton
                                title="Acompanhar Pedido"
                                onPress={() => navigation.navigate('OrderTracking', { orderId: order.id, type: 'order' })}
                                size="sm"
                                style={{ marginTop: TOKENS.spacing[4] }}
                            />
                        )}
                    </View>
                )}
            </LedgerCard>
        </TouchableOpacity>
    );
});

// --- Main Screen ---
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
        <View style={{ marginBottom: TOKENS.spacing[4] }}>
            <TopHeader 
                title="Pedidos" 
                subtitle="Histórico e pedidos em curso" 
            />
            <FlatList
                data={FILTER_PILLS}
                horizontal
                showsHorizontalScrollIndicator={false}
                keyExtractor={item => item}
                contentContainerStyle={styles.filterRow}
                renderItem={({ item }) => (
                    <TouchableOpacity
                        style={[styles.filterPill, filter === item && styles.filterPillActive]}
                        onPress={() => setFilter(item)}
                        accessibilityRole="tab"
                        accessibilityState={{ selected: filter === item }}
                    >
                        <Text style={[styles.filterText, filter === item && styles.filterTextActive]}>{item}</Text>
                    </TouchableOpacity>
                )}
            />
        </View>
    ), [filter]);

    if (isLoading) {
        return (
            <Screen>
                {ListHeader}
                <LoadingState title="A carregar histórico..." />
            </Screen>
        );
    }

    return (
        <Screen contentContainerStyle={{ paddingHorizontal: 0 }}>
            <SectionList
                sections={sections}
                keyExtractor={(item) => item.id?.toString()}
                ListHeaderComponent={ListHeader}
                ListEmptyComponent={
                    <EmptyState 
                        title="Sem pedidos" 
                        subtitle="Os teus pedidos e orçamentos aparecerão aqui."
                        actionTitle="Pedir Orçamento"
                        onAction={() => navigation.navigate('QuotationTab')}
                    />
                }
                renderItem={({ item, section, index }) => (
                    <FadeInView delay={Math.min(index * 30, 240)}>
                        <View style={{ paddingHorizontal: TOKENS.spacing[4] }}>
                            {section.type === 'quotation' ? <QuotationCard quotation={item} /> : <OrderCard order={item} />}
                        </View>
                    </FadeInView>
                )}
                renderSectionHeader={({ section }) => (
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>{section.title}</Text>
                        <View style={styles.sectionDivider} />
                    </View>
                )}
                contentContainerStyle={styles.listContent}
                refreshControl={
                    <RefreshControl refreshing={isRefetching} onRefresh={onRefresh} tintColor={TOKENS.colors.gold} />
                }
            />
        </Screen>
    );
};

const styles = StyleSheet.create({
    listContent: { paddingBottom: TOKENS.spacing[12] },
    
    // Filters
    filterRow: { paddingHorizontal: TOKENS.spacing[4], gap: TOKENS.spacing[2] },
    filterPill: { 
        paddingHorizontal: TOKENS.spacing[4], 
        paddingVertical: TOKENS.spacing[2], 
        borderRadius: TOKENS.radius.pill, 
        backgroundColor: TOKENS.colors.surface, 
        borderWidth: 1, 
        borderColor: TOKENS.colors.border 
    },
    filterPillActive: { 
        backgroundColor: TOKENS.colors.surface2, 
        borderColor: TOKENS.colors.text 
    },
    filterText: { 
        ...textStyles.small,
        color: TOKENS.colors.muted 
    },
    filterTextActive: { 
        color: TOKENS.colors.text, 
        fontFamily: 'Inter_500Medium' 
    },

    // Sections
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: TOKENS.spacing[4],
        marginTop: TOKENS.spacing[8],
        marginBottom: TOKENS.spacing[2],
    },
    sectionTitle: {
        ...textStyles.caption,
        color: TOKENS.colors.text,
        marginRight: TOKENS.spacing[3],
    },
    sectionDivider: {
        flex: 1,
        height: 1,
        backgroundColor: TOKENS.colors.border,
    },

    // Card Common
    cardHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: TOKENS.spacing[3],
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
        ...textStyles.small,
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
    expandedSection: {
        paddingTop: TOKENS.spacing[2],
    },

    // Quotation Timeline Mini
    qTimeline: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: TOKENS.spacing[4] },
    qTimelineStepContainer: { alignItems: 'center', flex: 1 },
    qTimelineDotContainer: { flexDirection: 'row', alignItems: 'center', width: '100%', height: 28 },
    qTimelineOuterDot: { justifyContent: 'center', alignItems: 'center', zIndex: 1, position: 'absolute', left: '50%' },
    qTimelineInnerDot: {},
    qTimelineLine: { height: 1, flex: 1, width: '100%', position: 'absolute', left: '50%', top: 13, zIndex: 0 },
    qTimelineLabel: { ...textStyles.caption, fontSize: 9, marginTop: TOKENS.spacing[1], textAlign: 'center', textTransform: 'none' },
});
