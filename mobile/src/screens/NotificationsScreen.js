import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ChevronLeft, Bell, Gift, Package, Star } from 'lucide-react-native';
import { Theme, T } from '../theme';

const MOCK_NOTIFS = [
    { id: '1', type: 'PROMO', title: '20% de Desconto!', desc: 'Usa o cupão FINAL20 para bolos.', time: 'Há 1 hora', read: false },
    { id: '2', type: 'ORDER', title: 'Encomenda #ORD-123', desc: 'A tua encomenda já está a caminho.', time: 'Há 2 horas', read: false },
    { id: '3', type: 'SYSTEM', title: 'Bem-vindo(a) ao Puculuxa!', desc: 'Obrigado(a) por instalares a nossa app.', time: 'Há 1 dia', read: true },
];

const getIcon = (type) => {
    switch (type) {
        case 'PROMO': return <Gift size={18} color={Theme.colors.primary} />;
        case 'ORDER': return <Package size={18} color={Theme.colors.info} />;
        default: return <Star size={18} color={Theme.colors.textTertiary} />;
    }
};

export const NotificationsScreen = () => {
    const navigation = useNavigation();

    const renderItem = ({ item }) => (
        <TouchableOpacity style={[styles.card, !item.read ? styles.cardUnread : null]} activeOpacity={0.85} accessibilityRole="button">
            <View style={[styles.iconBox, !item.read ? { backgroundColor: Theme.colors.primaryGhost } : null]}>
                {getIcon(item.type)}
            </View>
            <View style={styles.textContainer}>
                <View style={styles.titleRow}>
                    <Text style={[styles.titleText, !item.read ? styles.titleUnread : null]}>{item.title}</Text>
                    <Text style={styles.timeText}>{item.time}</Text>
                </View>
                <Text style={styles.descText} numberOfLines={2}>{item.desc}</Text>
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} accessibilityLabel="Voltar">
                    <ChevronLeft size={22} color={Theme.colors.primary} />
                </TouchableOpacity>
                <Text style={styles.title}>Notificações</Text>
                <View style={{ width: 40 }} />
            </View>

            {MOCK_NOTIFS.length === 0 ? (
                <View style={styles.empty}>
                    <Bell size={48} color={Theme.colors.borderStrong} style={{ marginBottom: 16 }} />
                    <Text style={styles.emptyTitle}>Sem notificações</Text>
                    <Text style={styles.emptyText}>As tuas notificações aparecerão aqui.</Text>
                </View>
            ) : (
                <FlatList
                    data={MOCK_NOTIFS}
                    keyExtractor={item => item.id}
                    renderItem={renderItem}
                    contentContainerStyle={styles.list}
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Theme.colors.background },
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingTop: 56, paddingHorizontal: 20, paddingBottom: 14,
        backgroundColor: Theme.colors.surfaceElevated, borderBottomWidth: 1, borderBottomColor: Theme.colors.border,
    },
    backBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: Theme.colors.surface, justifyContent: 'center', alignItems: 'center' },
    title: { ...T.h3, color: Theme.colors.primary },
    list: { padding: 16 },
    card: {
        flexDirection: 'row', backgroundColor: Theme.colors.surfaceElevated, borderRadius: Theme.radius.lg, padding: 14,
        marginBottom: 10, ...Theme.elevation.xs, alignItems: 'center',
    },
    cardUnread: { backgroundColor: Theme.colors.primaryGhost, borderWidth: 1, borderColor: Theme.colors.primary },
    iconBox: { width: 44, height: 44, borderRadius: 22, backgroundColor: Theme.colors.surface, justifyContent: 'center', alignItems: 'center', marginRight: 14 },
    textContainer: { flex: 1 },
    titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
    titleText: { fontFamily: 'Poppins_500Medium', fontSize: 14, color: Theme.colors.textPrimary },
    titleUnread: { color: Theme.colors.primary, fontFamily: 'Poppins_600SemiBold' },
    timeText: { ...T.bodySmall, fontSize: 11 },
    descText: { ...T.bodySmall, lineHeight: 18 },
    empty: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32 },
    emptyTitle: { ...T.h3, marginBottom: 8 },
    emptyText: { ...T.body, color: Theme.colors.textSecondary, textAlign: 'center' },
});
