import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Dimensions } from 'react-native';
import { Settings, Heart, History, LogOut, ChevronRight, Crown, TrendingUp, ShoppingBag } from 'lucide-react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Theme } from '../theme';
import { useAuthStore } from '../store/authStore';
import { BottomNav } from '../components/ui/BottomNav';

export const ProfileScreen = () => {
    const { user, logout } = useAuthStore();
    const navigation = useNavigation();
    const [stats, setStats] = React.useState({ totalSpent: 125000, orders: 4, tier: 'GOLD', loyaltyPoints: 1250 });

    // Mock refreshing stats when screen focuses
    useFocusEffect(
        React.useCallback(() => {
            // In a real scenario: ApiService.getUserStats().then(setStats)
        }, [])
    );

    const handleLogout = () => {
        Alert.alert('Sair', 'Tem certeza que deseja sair?', [
            { text: 'Cancelar', style: 'cancel' },
            { text: 'Sim', onPress: logout }
        ]);
    };

    const getUserInitials = () => {
        if (!user || !user.name) return '??';
        const parts = user.name.split(' ');
        if (parts.length > 1) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
        return parts[0].substring(0, 2).toUpperCase();
    };

    return (
        <View style={styles.container}>
            <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
                <View style={styles.header}>
                    <View style={styles.avatarContainer}>
                        <View style={styles.avatar}>
                            <Text style={styles.avatarText}>{getUserInitials()}</Text>
                        </View>
                    </View>
                    <Text style={styles.userName}>{user?.name || 'Visitante'}</Text>
                    <Text style={styles.userEmail}>{user?.email || 'Nenhum e-mail vinculado'}</Text>

                    <View style={styles.tierBadge}>
                        <Crown size={16} color="#D4AF37" />
                        <Text style={styles.tierText}>Membro {stats.tier}</Text>
                    </View>
                </View>

                {/* Dashboard Stats */}
                <View style={styles.statsContainer}>
                    <View style={styles.statCard}>
                        <TrendingUp size={24} color={Theme.colors.primary} />
                        <Text style={styles.statValue}>Kz {stats.totalSpent.toLocaleString('pt-BR')}</Text>
                        <Text style={styles.statLabel}>Valor Investido</Text>
                    </View>
                    <View style={styles.statCard}>
                        <ShoppingBag size={24} color="#4CAF50" />
                        <Text style={styles.statValue}>{stats.orders}</Text>
                        <Text style={styles.statLabel}>Pedidos Realizados</Text>
                    </View>
                </View>

                {/* Loyalty Points Banner */}
                <View style={{ marginHorizontal: 20, marginBottom: 24, backgroundColor: Theme.colors.primary, borderRadius: 16, padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <View>
                        <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13, fontWeight: '600', textTransform: 'uppercase' }}>Pontos Puculuxa</Text>
                        <Text style={{ color: 'white', fontSize: 24, fontWeight: 'bold', marginTop: 4 }}>{stats.loyaltyPoints} pts</Text>
                        <Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: 12, marginTop: 4 }}>Equivale a Mzn/Kz {(stats.loyaltyPoints * 10).toLocaleString('pt-BR')} de desconto</Text>
                    </View>
                    <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' }}>
                        <Text style={{ fontSize: 24 }}>✨</Text>
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Minhas Atividades</Text>

                    <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('OrderHistory')}>
                        <View style={[styles.iconBox, { backgroundColor: Theme.colors.surface }]}>
                            <History size={20} color={Theme.colors.primary} />
                        </View>
                        <Text style={styles.menuLabel}>Histórico de Pedidos</Text>
                        <ChevronRight size={20} color={Theme.colors.textSecondary} />
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('Favorites')}>
                        <View style={[styles.iconBox, { backgroundColor: '#FCE4EC' }]}>
                            <Heart size={20} color="#F06292" />
                        </View>
                        <Text style={styles.menuLabel}>Meus Favoritos</Text>
                        <ChevronRight size={20} color={Theme.colors.textSecondary} />
                    </TouchableOpacity>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Configurações</Text>

                    <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('EditProfile')}>
                        <View style={[styles.iconBox, { backgroundColor: '#E8E8E8' }]}>
                            <Settings size={20} color={Theme.colors.textSecondary} />
                        </View>
                        <Text style={styles.menuLabel}>Editar Perfil</Text>
                        <ChevronRight size={20} color={Theme.colors.textSecondary} />
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.menuItem} onPress={handleLogout}>
                        <View style={[styles.iconBox, { backgroundColor: '#FFEBEE' }]}>
                            <LogOut size={20} color="#E57373" />
                        </View>
                        <Text style={styles.menuLabel}>Sair da Conta</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.footer}>
                    <Text style={styles.version}>Puculuxa App v1.0.0</Text>
                </View>
            </ScrollView>
            <BottomNav />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Theme.colors.background,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingTop: 80,
        paddingBottom: 100, // Important padding for BottomNav
    },
    header: {
        alignItems: 'center',
        marginBottom: 32,
    },
    avatarContainer: {
        marginBottom: 16,
        padding: 4,
        backgroundColor: 'white',
        borderRadius: 50,
        ...Theme.shadows.light,
    },
    avatar: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: Theme.colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarText: {
        fontSize: 32,
        color: 'white',
        fontWeight: 'bold',
        fontFamily: Theme.fonts.title,
    },
    userName: {
        fontSize: 24,
        fontWeight: 'bold',
        color: Theme.colors.text,
        marginBottom: 4,
        fontFamily: Theme.fonts.subtitle,
    },
    userEmail: {
        fontSize: 14,
        color: Theme.colors.textSecondary,
    },
    tierBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF8DC', // Vanilla
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        marginTop: 12,
        borderWidth: 1,
        borderColor: '#D4AF37'
    },
    tierText: {
        marginLeft: 8,
        color: '#D4AF37',
        fontWeight: 'bold',
        fontSize: 14
    },
    statsContainer: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        marginBottom: 24,
        justifyContent: 'space-between'
    },
    statCard: {
        backgroundColor: 'white',
        flex: 1,
        borderRadius: 16,
        padding: 16,
        alignItems: 'center',
        ...Theme.shadows.light,
        marginHorizontal: 4
    },
    statValue: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginTop: 8,
        marginBottom: 4
    },
    statLabel: {
        fontSize: 12,
        color: Theme.colors.textSecondary,
        textAlign: 'center'
    },
    section: {
        marginBottom: 24,
        paddingHorizontal: 20,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: Theme.colors.textSecondary,
        marginBottom: 16,
        paddingHorizontal: 4,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'white',
        padding: 16,
        borderRadius: 16,
        marginBottom: 12,
        ...Theme.shadows.light,
    },
    iconBox: {
        width: 40,
        height: 40,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    menuLabel: {
        flex: 1,
        fontSize: 16,
        color: Theme.colors.textSecondary,
    },
    footer: {
        alignItems: 'center',
        marginTop: 20,
    },
    version: {
        fontSize: 12,
        color: Theme.colors.textSecondary,
        opacity: 0.5,
    },
});
