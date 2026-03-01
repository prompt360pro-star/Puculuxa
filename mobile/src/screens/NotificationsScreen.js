import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ArrowLeft, Bell, Gift, Package, Star } from 'lucide-react-native';
import { Theme } from '../theme';

const MOCK_NOTIFS = [
    { id: '1', type: 'PROMO', title: '20% de Desconto!', desc: 'Use o cupão FINAL20 para bolos.', time: 'Há 1 hora', read: false },
    { id: '2', type: 'ORDER', title: 'Encomenda #ORD-123', desc: 'A sua encomenda já está a caminho.', time: 'Há 2 horas', read: false },
    { id: '3', type: 'SYSTEM', title: 'Bem-vindo(a) ao Puculuxa!', desc: 'Obrigado por instalar a nossa aplicação.', time: 'Há 1 dia', read: true },
];

const getIcon = (type) => {
    switch (type) {
        case 'PROMO': return <Gift size={20} color={Theme.colors.accent} />;
        case 'ORDER': return <Package size={20} color={Theme.colors.primary} />;
        default: return <Star size={20} color="#666" />;
    }
};

export const NotificationsScreen = () => {
    const navigation = useNavigation();

    const renderItem = ({ item }) => (
        <TouchableOpacity style={[styles.card, !item.read && styles.cardUnread]}>
            <View style={[styles.iconBox, !item.read && { backgroundColor: Theme.colors.surface }]}>
                {getIcon(item.type)}
            </View>
            <View style={styles.textContainer}>
                <View style={styles.titleRow}>
                    <Text style={[styles.titleText, !item.read && styles.titleUnread]}>{item.title}</Text>
                    <Text style={styles.timeText}>{item.time}</Text>
                </View>
                <Text style={styles.descText} numberOfLines={2}>{item.desc}</Text>
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <ArrowLeft size={22} color={Theme.colors.primary} />
                </TouchableOpacity>
                <Text style={styles.title}>Notificações</Text>
                <View style={{ width: 40 }} />
            </View>

            <FlatList
                data={MOCK_NOTIFS}
                keyExtractor={item => item.id}
                renderItem={renderItem}
                contentContainerStyle={styles.list}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Theme.colors.background },
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingTop: 60, paddingHorizontal: 24, paddingBottom: 16,
        backgroundColor: 'white', ...Theme.shadows?.light
    },
    backBtn: {
        width: 40, height: 40, borderRadius: 12, backgroundColor: '#f5f5f5',
        justifyContent: 'center', alignItems: 'center',
    },
    title: { fontSize: 18, fontWeight: 'bold', color: Theme.colors.primary },
    list: { padding: 16 },
    card: {
        flexDirection: 'row', backgroundColor: 'white', borderRadius: 16, padding: 16,
        marginBottom: 12, ...Theme.shadows?.light, alignItems: 'center'
    },
    cardUnread: { backgroundColor: '#FFFAED', borderColor: Theme.colors.primary, borderWidth: 1 },
    iconBox: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#f5f5f5', justifyContent: 'center', alignItems: 'center', marginRight: 16 },
    textContainer: { flex: 1 },
    titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
    titleText: { fontSize: 15, fontWeight: '600', color: '#333' },
    titleUnread: { color: Theme.colors.primary, fontWeight: 'bold' },
    timeText: { fontSize: 12, color: '#aaa' },
    descText: { fontSize: 13, color: '#666', lineHeight: 18 }
});
