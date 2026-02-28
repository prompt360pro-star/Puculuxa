import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { ChevronLeft, Package, Clock, CheckCircle, XCircle } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import { Theme } from '../theme';
import { ApiService } from '../services/api';
import { Skeleton } from '../components/ui/Skeleton';

const StatusBadge = ({ status }) => {
    let color = '#FFA000';
    let bgColor = '#FFF8E1';
    let label = 'Pendente';
    let Icon = Clock;

    if (status === 'COMPLETED') {
        color = '#4CAF50';
        bgColor = '#E8F5E9';
        label = 'Concluído';
        Icon = CheckCircle;
    } else if (status === 'CANCELLED') {
        color = '#F44336';
        bgColor = '#FFEBEE';
        label = 'Cancelado';
        Icon = XCircle;
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

    const { data: orders, isLoading, isError, refetch, isRefetching } = useQuery({
        queryKey: ['myOrders'],
        queryFn: ApiService.getMyOrders,
        staleTime: 1000 * 60 * 5, // 5 minutes cache
    });

    const renderOrderItem = ({ item }) => {
        const date = new Date(item.createdAt).toLocaleDateString('pt-BR', {
            day: '2-digit', month: 'short', year: 'numeric'
        });

        return (
            <TouchableOpacity style={styles.orderCard} activeOpacity={0.7}>
                <View style={styles.orderHeader}>
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

                <View style={styles.orderDetails}>
                    <Text style={styles.orderItems}>
                        {item.items.length} {item.items.length === 1 ? 'item' : 'itens'}
                    </Text>
                    <Text style={styles.orderTotal}>Kz {item.total.toLocaleString('pt-BR')}</Text>
                </View>
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
                <Text style={styles.headerTitle}>Histórico de Pedidos</Text>
                <View style={{ width: 40 }} /> {/* Placeholder for alignment */}
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
                    data={orders}
                    keyExtractor={(item) => item.id}
                    renderItem={renderOrderItem}
                    contentContainerStyle={styles.listContainer}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl refreshing={isRefetching} onRefresh={refetch} colors={[Theme.colors.primary]} />
                    }
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
});
