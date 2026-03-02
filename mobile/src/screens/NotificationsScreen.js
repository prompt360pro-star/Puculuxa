import React, { useState, useEffect, useCallback } from 'react';
import {
    View, Text, StyleSheet, FlatList, TouchableOpacity,
    RefreshControl, ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ChevronLeft, Bell, Calendar, Package, ShoppingBag, RefreshCw } from 'lucide-react-native';
import { Theme, T } from '../theme';
import { apiClient } from '../config/api.config';

// ─── Types ───
const STATUS_LABELS = {
    PENDING: { label: 'Agendado', color: '#6366F1' },
    SENT_30D: { label: 'Enviado 30d', color: '#F97316' },
    SENT_7D: { label: 'Enviado 7d', color: '#EAB308' },
    SENT_3D: { label: 'Enviado 3d', color: '#EF4444' },
    COMPLETED: { label: 'Concluído', color: '#22C55E' },
};

const EVENT_ICONS = {
    casamento: '💒',
    aniversario: '🎂',
    corporativo: '💼',
    baptizado: '⛪',
    outro: '📋',
};

function formatDate(dateStr) {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    return d.toLocaleDateString('pt-AO', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatRelative(dateStr) {
    if (!dateStr) return '';
    const diff = Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86400000);
    if (diff < 0) return 'Passou';
    if (diff === 0) return 'Hoje!';
    if (diff === 1) return 'Amanhã';
    return `Daqui a ${diff} dias`;
}

// ─── Single Reminder Card ───
function ReminderCard({ item }) {
    const statusCfg = STATUS_LABELS[item.status] || { label: item.status, color: '#888' };
    const icon = EVENT_ICONS[item.eventType] || '📋';
    const daysLabel = formatRelative(item.eventDate);

    return (
        <View style={styles.card}>
            <View style={styles.cardLeft}>
                <Text style={styles.eventIcon}>{icon}</Text>
            </View>
            <View style={styles.cardContent}>
                <View style={styles.cardTop}>
                    <Text style={styles.eventName} numberOfLines={1}>{item.eventName}</Text>
                    <View style={[styles.badge, { backgroundColor: statusCfg.color + '22' }]}>
                        <Text style={[styles.badgeText, { color: statusCfg.color }]}>{statusCfg.label}</Text>
                    </View>
                </View>
                <View style={styles.cardMeta}>
                    <Calendar size={11} color={Theme.colors.textTertiary} />
                    <Text style={styles.metaText}>{formatDate(item.eventDate)}</Text>
                    {daysLabel ? (
                        <Text style={[styles.metaText, { color: Theme.colors.primary, fontWeight: '700', marginLeft: 6 }]}>
                            {daysLabel}
                        </Text>
                    ) : null}
                </View>
                {item.nextReminder && item.status !== 'COMPLETED' && (
                    <View style={styles.cardMeta}>
                        <Bell size={11} color={Theme.colors.textTertiary} />
                        <Text style={styles.metaText}>Próx. lembrete: {formatDate(item.nextReminder)}</Text>
                    </View>
                )}
            </View>
        </View>
    );
}

// ─── Main Screen ───
export const NotificationsScreen = () => {
    const navigation = useNavigation();
    const [reminders, setReminders] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [error, setError] = useState(null);

    const load = useCallback(async (isRefresh = false) => {
        isRefresh ? setIsRefreshing(true) : setIsLoading(true);
        setError(null);
        try {
            const res = await apiClient.get('/auth/reminders');
            setReminders(res.data || []);
        } catch (err) {
            setError('Não foi possível carregar as notificações.');
            console.error('[Notifications] Error:', err);
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    const renderEmpty = () => (
        <View style={styles.empty}>
            <Bell size={52} color={Theme.colors.borderStrong} />
            <Text style={styles.emptyTitle}>Sem lembretes activos</Text>
            <Text style={styles.emptyText}>
                Depois de fazer uma encomenda, receberás lembretes automáticos antes do teu evento.
            </Text>
        </View>
    );

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    style={styles.backBtn}
                    accessibilityLabel="Voltar"
                >
                    <ChevronLeft size={22} color={Theme.colors.primary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Notificações</Text>
                <TouchableOpacity onPress={() => load(true)} style={styles.backBtn} accessibilityLabel="Actualizar">
                    <RefreshCw size={18} color={Theme.colors.primary} />
                </TouchableOpacity>
            </View>

            {/* Content */}
            {isLoading ? (
                <View style={styles.centered}>
                    <ActivityIndicator size="large" color={Theme.colors.primary} />
                    <Text style={styles.loadingText}>A carregar lembretes...</Text>
                </View>
            ) : error ? (
                <View style={styles.centered}>
                    <Text style={styles.errorText}>{error}</Text>
                    <TouchableOpacity onPress={() => load()} style={styles.retryBtn}>
                        <Text style={styles.retryText}>Tentar novamente</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <FlatList
                    data={reminders}
                    keyExtractor={item => item.id}
                    renderItem={({ item }) => <ReminderCard item={item} />}
                    contentContainerStyle={[styles.list, reminders.length === 0 && styles.listEmpty]}
                    ListEmptyComponent={renderEmpty}
                    refreshControl={
                        <RefreshControl
                            refreshing={isRefreshing}
                            onRefresh={() => load(true)}
                            colors={[Theme.colors.primary]}
                            tintColor={Theme.colors.primary}
                        />
                    }
                    ListHeaderComponent={reminders.length > 0 ? (
                        <Text style={styles.sectionTitle}>{reminders.length} lembrete(s) activo(s)</Text>
                    ) : null}
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Theme.colors.background },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: 56,
        paddingHorizontal: 16,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: Theme.colors.border,
    },
    headerTitle: { fontSize: 18, fontWeight: '800', color: Theme.colors.text, fontFamily: T.bold },
    backBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
    list: { paddingHorizontal: 16, paddingBottom: 80, paddingTop: 12 },
    listEmpty: { flexGrow: 1 },
    sectionTitle: { fontSize: 11, fontWeight: '700', color: Theme.colors.textTertiary, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 },
    card: {
        flexDirection: 'row',
        backgroundColor: Theme.colors.card,
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: Theme.colors.border,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 8,
        elevation: 2,
    },
    cardLeft: { width: 44, height: 44, borderRadius: 22, backgroundColor: Theme.colors.primaryGhost, alignItems: 'center', justifyContent: 'center', marginRight: 14 },
    eventIcon: { fontSize: 22 },
    cardContent: { flex: 1 },
    cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
    eventName: { fontSize: 14, fontWeight: '700', color: Theme.colors.text, flex: 1, marginRight: 8, fontFamily: T.semibold },
    badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 99 },
    badgeText: { fontSize: 10, fontWeight: '700' },
    cardMeta: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3 },
    metaText: { fontSize: 11, color: Theme.colors.textTertiary },
    centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
    loadingText: { marginTop: 12, fontSize: 14, color: Theme.colors.textTertiary },
    errorText: { fontSize: 14, color: Theme.colors.error, textAlign: 'center', marginBottom: 16 },
    retryBtn: { paddingHorizontal: 20, paddingVertical: 10, backgroundColor: Theme.colors.primaryGhost, borderRadius: 12 },
    retryText: { fontSize: 14, fontWeight: '700', color: Theme.colors.primary },
    empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40, marginTop: 60 },
    emptyTitle: { fontSize: 18, fontWeight: '800', color: Theme.colors.text, marginTop: 20, marginBottom: 8 },
    emptyText: { fontSize: 13, color: Theme.colors.textTertiary, textAlign: 'center', lineHeight: 20 },
});
