import React, { useState, useCallback, useMemo } from 'react';
import {
    View, Text, StyleSheet, FlatList, TouchableOpacity, LayoutAnimation,
    UIManager, Platform, RefreshControl,
} from 'react-native';
import { ChevronLeft, ChevronDown, ChevronUp, Package, Clock, CheckCircle, Truck, XCircle } from 'lucide-react-native';
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

// Status config
const STATUS_CONFIG = {
    PENDING: { label: 'Pendente', icon: Clock, bg: Theme.colors.warningBg, color: Theme.colors.warning },
    CONFIRMED: { label: 'Confirmado', icon: CheckCircle, bg: Theme.colors.successBg, color: Theme.colors.success },
    IN_PROGRESS: { label: 'Em Preparação', icon: Package, bg: Theme.colors.infoBg, color: Theme.colors.info },
    DELIVERED: { label: 'Entregue', icon: Truck, bg: Theme.colors.successBg, color: Theme.colors.success },
    CANCELLED: { label: 'Cancelado', icon: XCircle, bg: Theme.colors.errorBg, color: Theme.colors.error },
};

// Status pills
const FILTER_PILLS = ['Todos', 'Pendente', 'Em Preparação', 'Entregue', 'Cancelado'];

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

// Order Card
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
                            onPress={() => navigation.navigate('OrderTracking', { order })}
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

    const { data: orders = [], isLoading, refetch, isRefetching } = useQuery({
        queryKey: ['myOrders'],
        queryFn: () => ApiService.getMyOrders(),
        staleTime: 2 * 60 * 1000,
    });

    const filteredOrders = useMemo(() => {
        if (filter === 'Todos') return orders;
        return orders.filter(o => {
            const cfg = STATUS_CONFIG[o.status];
            return cfg?.label === filter;
        });
    }, [orders, filter]);

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
            <Text style={styles.emptyTitle}>Sem pedidos ainda</Text>
            <Text style={styles.emptySubtitle}>Os teus pedidos aparecerão aqui.</Text>
            <PremiumButton title="Pedir Orçamento" onPress={() => navigation.navigate('QuotationTab')} size="md" style={{ marginTop: 24 }} />
        </View>
    );

    return (
        <View style={styles.container}>
            <FlatList
                data={filteredOrders}
                keyExtractor={item => item.id?.toString()}
                renderItem={({ item }) => <OrderCard order={item} />}
                ListHeaderComponent={ListHeader}
                ListEmptyComponent={isLoading ? (
                    <View style={{ paddingHorizontal: 20, gap: 12 }}>
                        <Skeleton width="100%" height={80} borderRadius={16} />
                        <Skeleton width="100%" height={80} borderRadius={16} />
                        <Skeleton width="100%" height={80} borderRadius={16} />
                    </View>
                ) : <EmptyState />}
                contentContainerStyle={styles.listContent}
                refreshControl={
                    <RefreshControl refreshing={isRefetching} onRefresh={refetch} colors={[Theme.colors.primary]} tintColor={Theme.colors.primary} />
                }
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Theme.colors.background },
    listContent: { paddingBottom: 32 },
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingTop: 52, paddingBottom: 16, paddingHorizontal: 16,
    },
    backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
    headerTitle: { ...T.h3, color: Theme.colors.white },
    filterRow: { paddingHorizontal: 16, paddingVertical: 14, gap: 8 },
    filterPill: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: Theme.radius.full, backgroundColor: Theme.colors.surfaceElevated, borderWidth: 1, borderColor: Theme.colors.border },
    filterPillActive: { backgroundColor: Theme.colors.primary, borderColor: Theme.colors.primary },
    filterText: { fontFamily: T.bodySmall.fontFamily, fontSize: 12, color: Theme.colors.textSecondary },
    filterTextActive: { color: Theme.colors.white, fontFamily: 'Poppins_600SemiBold' },
    orderCard: {
        backgroundColor: Theme.colors.surfaceElevated,
        marginHorizontal: 20,
        marginBottom: 12,
        borderRadius: Theme.radius.lg,
        padding: 16,
        ...Theme.elevation.xs,
    },
    orderHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    orderId: { fontFamily: 'Poppins_600SemiBold', fontSize: 14, color: Theme.colors.textPrimary },
    orderDate: { ...T.bodySmall, marginTop: 2 },
    orderExpanded: { marginTop: 14, paddingTop: 14, borderTopWidth: 1, borderTopColor: Theme.colors.border },
    orderDetailRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
    orderDetailLabel: { ...T.bodySmall },
    orderDetailValue: { ...T.body, fontFamily: 'Poppins_500Medium' },
    emptyState: { alignItems: 'center', paddingVertical: 60, paddingHorizontal: 40 },
    emptyTitle: { ...T.h3, textAlign: 'center', marginBottom: 8 },
    emptySubtitle: { ...T.bodySmall, textAlign: 'center' },
});
