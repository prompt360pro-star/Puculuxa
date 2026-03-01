import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, LayoutAnimation, UIManager, Platform } from 'react-native';
import { ChevronLeft, Package, Clock, CheckCircle, XCircle, ChevronDown, ChevronUp } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import { Theme } from '../theme';
import { ApiService } from '../services/api';
import { Skeleton } from '../components/ui/Skeleton';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

const StatusBadge = ({ status }) => {
    let color = '#FFA000';
    let bgColor = '#FFF8E1';
    let label = 'Pendente';
    let Icon = Clock;

    if (status === 'DELIVERED' || status === 'COMPLETED') {
        color = '#4CAF50';
        bgColor = '#E8F5E9';
        label = 'Concluído';
        Icon = CheckCircle;
    } else if (status === 'CANCELLED') {
        color = '#F44336';
        bgColor = '#FFEBEE';
        label = 'Cancelado';
        Icon = XCircle;
    } else if (status === 'APPROVED' || status === 'PRODUCING' || status === 'READY') {
        color = '#2196F3';
        bgColor = '#E3F2FD';
        label = 'Em Progresso';
        Icon = Clock;
    }

    return (
        <View style={[styles.badgeContainer, { backgroundColor: bgColor }]}>
            <Icon size={12} color={color} style={{ marginRight: 4 }} />
            <Text style={[styles.badgeText, { color }]}>{label}</Text>
        </View>
    );
};

export const OrderHistoryScreen = () => {
    const navigation = useNavigation();
    const [activeTab, setActiveTab] = useState('ACTIVE'); // ACTIVE or HISTORY
    const [expandedOrderId, setExpandedOrderId] = useState(null);

    const { data: orders, isLoading, isError, refetch, isRefetching } = useQuery({
        queryKey: ['myOrders'],
        queryFn: ApiService.getMyOrders,
        staleTime: 1000 * 60 * 5, // 5 minutes cache
    });

    const renderOrderItem = ({ item }) => {
        const date = new Date(item.createdAt).toLocaleDateString('pt-BR', {
            day: '2-digit', month: 'short', year: 'numeric'
        });
        const isExpanded = expandedOrderId === item.id;

        const toggleExpand = () => {
            LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
            setExpandedOrderId(isExpanded ? null : item.id);
        };

        return (
            <TouchableOpacity style={styles.orderCard} activeOpacity={0.7} onPress={toggleExpand}>
                <View style={[styles.orderHeader, isExpanded && { borderBottomWidth: 1, borderBottomColor: '#f0f0f0', paddingBottom: 12, marginBottom: 12 }]}>
                    <View style={styles.orderHeaderLeft}>
                        <View style={styles.iconBox}>
                            <Package size={20} color={Theme.colors.primary} />
                        </View>
                        <View>
                            <Text style={styles.orderId}>Pedido #{item.id.slice(0, 8).toUpperCase()}</Text>
                            <Text style={styles.orderDate}>{date}</Text>
                        </View>
                    </View>
                    <StatusBadge status={item.status} />
                </View>

                {!isExpanded ? (
                    <View style={styles.orderDetails}>
                        <Text style={styles.orderItems}>{item.items.length} {item.items.length === 1 ? 'item' : 'itens'}</Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                            <Text style={styles.orderTotal}>Kz {item.total?.toLocaleString('pt-BR') || '0'}</Text>
                            <ChevronDown size={16} color={Theme.colors.textSecondary} />
                        </View>
                    </View>
                ) : (
                    <View style={styles.expandedDetails}>
                        <Text style={{ fontSize: 13, fontWeight: 'bold', color: Theme.colors.textSecondary, marginBottom: 8, textTransform: 'uppercase' }}>Itens do Pedido</Text>
                        {item.items.map((prod, idx) => (
                            <View key={idx} style={styles.expandedItemRow}>
                                <Text style={styles.expandedItemName} numberOfLines={1}>{prod.quantity}x {prod.name}</Text>
                                <Text style={styles.expandedItemPrice}>Kz {(prod.price * prod.quantity).toLocaleString('pt-BR')}</Text>
                            </View>
                        ))}
                        <View style={styles.expandedTotalRow}>
                            <Text style={styles.expandedTotalLabel}>Total</Text>
                            <Text style={styles.expandedTotalValue}>Kz {item.total?.toLocaleString('pt-BR') || '0'}</Text>
                        </View>
                        <View style={{ alignItems: 'center', marginTop: 12 }}>
                            <ChevronUp size={16} color={Theme.colors.textSecondary} />
                        </View>
                    </View>
                )}
            </TouchableOpacity>
        );
    };

    const renderLoadingSkeletons = () => (
        <View style={styles.skeletonContainer}>
            <Skeleton width="100%" height={120} style={{ borderRadius: 20, marginBottom: 16 }} />
            <Skeleton width="100%" height={120} style={{ borderRadius: 20, marginBottom: 16 }} />
            <Skeleton width="100%" height={120} style={{ borderRadius: 20, marginBottom: 16 }} />
        </View>
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <ChevronLeft size={24} color={Theme.colors.textPrimary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Meus Pedidos</Text>
                <View style={{ width: 40 }} /> {/* Placeholder for alignment */}
            </View>

            <View style={styles.tabContainer}>
                <TouchableOpacity style={[styles.tab, activeTab === 'ACTIVE' && styles.tabActive]} onPress={() => setActiveTab('ACTIVE')}>
                    <Text style={[styles.tabText, activeTab === 'ACTIVE' && styles.tabTextActive]}>Em Andamento</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.tab, activeTab === 'HISTORY' && styles.tabActive]} onPress={() => setActiveTab('HISTORY')}>
                    <Text style={[styles.tabText, activeTab === 'HISTORY' && styles.tabTextActive]}>Histórico</Text>
                </TouchableOpacity>
            </View>

            {isLoading ? (
                renderLoadingSkeletons()
            ) : isError ? (
                <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>Não foi possível carregar o histórico.</Text>
                    <TouchableOpacity style={styles.retryButton} onPress={refetch}>
                        <Text style={styles.retryText}>Tentar Novamente</Text>
                    </TouchableOpacity>
                </View>
            ) : orders?.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Package size={64} color={Theme.colors.textSecondary} style={{ opacity: 0.3, marginBottom: 16 }} />
                    <Text style={styles.emptyTitle}>Nenhum pedido</Text>
                    <Text style={styles.emptyText}>Você ainda não fez nenhuma encomenda connosco.</Text>
                </View>
            ) : (
                <FlatList
                    data={orders.filter(o => activeTab === 'ACTIVE' ? (o.status !== 'DELIVERED' && o.status !== 'COMPLETED' && o.status !== 'CANCELLED') : (o.status === 'DELIVERED' || o.status === 'COMPLETED' || o.status === 'CANCELLED'))}
                    keyExtractor={(item) => item.id}
                    renderItem={renderOrderItem}
                    contentContainerStyle={styles.listContainer}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl refreshing={isRefetching} onRefresh={refetch} colors={[Theme.colors.primary]} />
                    }
                    ListEmptyComponent={() => (
                        <View style={[styles.emptyContainer, { marginTop: 40 }]}>
                            <Text style={styles.emptyText}>Não tens pedidos {activeTab === 'ACTIVE' ? 'em andamento' : 'no histórico'}.</Text>
                        </View>
                    )}
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Theme.colors.background,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: 60,
        paddingHorizontal: Theme.spacing.lg,
        paddingBottom: 20,
        backgroundColor: Theme.colors.surface,
        ...Theme.shadows.light,
        zIndex: 10,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: Theme.colors.textPrimary,
    },
    backButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'flex-start',
    },
    listContainer: {
        padding: Theme.spacing.lg,
    },
    skeletonContainer: {
        padding: Theme.spacing.lg,
    },
    orderCard: {
        backgroundColor: Theme.colors.surface,
        borderRadius: 20,
        padding: 16,
        marginBottom: 16,
        ...Theme.shadows.medium,
    },
    orderHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
        paddingBottom: 12,
        marginBottom: 12,
    },
    orderHeaderLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconBox: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: '#FFEBF0',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    orderId: {
        fontSize: 16,
        fontWeight: 'bold',
        color: Theme.colors.textPrimary,
        marginBottom: 2,
    },
    orderDate: {
        fontSize: 12,
        color: Theme.colors.textSecondary,
    },
    badgeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    badgeText: {
        fontSize: 10,
        fontWeight: 'bold',
        textTransform: 'uppercase',
    },
    orderDetails: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    orderItems: {
        fontSize: 14,
        color: Theme.colors.textSecondary,
    },
    orderTotal: {
        fontSize: 16,
        fontWeight: '900',
        color: Theme.colors.primary,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: Theme.colors.textPrimary,
        marginBottom: 8,
    },
    emptyText: {
        fontSize: 14,
        color: Theme.colors.textSecondary,
        textAlign: 'center',
        lineHeight: 20,
    },
    retryButton: {
        marginTop: 16,
        backgroundColor: Theme.colors.primary,
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 8,
    },
    retryText: {
        color: 'white',
        fontWeight: 'bold',
    },
    tabContainer: {
        flexDirection: 'row', backgroundColor: 'white', paddingHorizontal: Theme.spacing.lg,
        paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: '#f0f0f0'
    },
    tab: {
        flex: 1, paddingVertical: 12, alignItems: 'center',
        borderBottomWidth: 2, borderBottomColor: 'transparent'
    },
    tabActive: {
        borderBottomColor: Theme.colors.primary
    },
    tabText: { fontSize: 14, fontWeight: '600', color: Theme.colors.textSecondary },
    tabTextActive: { color: Theme.colors.primary },
    expandedDetails: { marginTop: 8 },
    expandedItemRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
    expandedItemName: { fontSize: 14, color: '#333', flex: 1, marginRight: 16 },
    expandedItemPrice: { fontSize: 14, color: Theme.colors.textSecondary, fontWeight: '500' },
    expandedTotalRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#f0f0f0' },
    expandedTotalLabel: { fontSize: 16, fontWeight: 'bold', color: '#333' },
    expandedTotalValue: { fontSize: 18, fontWeight: 'bold', color: Theme.colors.primary },
});
