import React, { useMemo } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity, Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Settings, Heart, Bell, HelpCircle, LogOut, ChevronRight, ClipboardList, Star, Package } from 'lucide-react-native';
import { Theme, T } from '../theme';
import { useAuthStore } from '../store/authStore';
import { useToastStore } from '../store/toastStore';

// Badge de lealdade
function getLoyaltyBadge(orderCount) {
    if (orderCount >= 10) return { emoji: '💎', label: 'Diamante', color: '#B388FF' };
    if (orderCount >= 5) return { emoji: '⭐', label: 'Estrela', color: '#FFD700' };
    return { emoji: '🌱', label: 'Novo', color: Theme.colors.secondary };
}

const MenuItem = ({ icon: IconComp, label, onPress, color, badge }) => (
    <TouchableOpacity
        style={mi.container}
        onPress={onPress}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel={label}
    >
        <View style={[mi.iconWrap, { backgroundColor: color || Theme.colors.primaryGhost }]}>
            <IconComp size={18} color={color ? Theme.colors.white : Theme.colors.primary} />
        </View>
        <Text style={mi.label}>{label}</Text>
        <View style={{ flex: 1 }} />
        {badge ? <View style={mi.badge}><Text style={mi.badgeText}>{badge}</Text></View> : null}
        <ChevronRight size={16} color={Theme.colors.textTertiary} />
    </TouchableOpacity>
);

const mi = StyleSheet.create({
    container: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 14, paddingHorizontal: 4 },
    iconWrap: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
    label: { ...T.body, fontFamily: 'Poppins_500Medium' },
    badge: { backgroundColor: Theme.colors.primaryGhost, paddingHorizontal: 8, paddingVertical: 2, borderRadius: Theme.radius.full, marginRight: 8 },
    badgeText: { fontFamily: T.bodySmall.fontFamily, fontSize: 11, color: Theme.colors.primary },
});

export const ProfileScreen = ({ navigation }) => {
    const { user, logout } = useAuthStore();
    const { show } = useToastStore();

    const initials = useMemo(() => {
        if (!user?.name) return '?';
        return user.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
    }, [user?.name]);

    const loyalty = getLoyaltyBadge(user?.orderCount || 0);

    const handleLogout = async () => {
        await logout();
        show({ type: 'info', message: 'Sessão terminada.' });
    };

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            {/* Header */}
            <LinearGradient
                colors={[Theme.colors.gradientStart, Theme.colors.gradientMid, Theme.colors.gradientEnd]}
                style={styles.header}
            >
                <View style={styles.avatarCircle}>
                    <Text style={styles.avatarText}>{initials}</Text>
                </View>
                <Text style={styles.userName}>{user?.name || 'Utilizador'}</Text>
                <Text style={styles.userEmail}>{user?.email || ''}</Text>
                <View style={styles.loyaltyBadge}>
                    <Text style={{ fontSize: 14 }}>{loyalty.emoji}</Text>
                    <Text style={[styles.loyaltyText, { color: loyalty.color }]}>{loyalty.label}</Text>
                </View>
            </LinearGradient>

            {/* Stats */}
            <View style={styles.statsRow}>
                <View style={styles.statItem}>
                    <Text style={styles.statValue}>{user?.orderCount || 0}</Text>
                    <Text style={styles.statLabel}>Pedidos</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                    <Text style={styles.statValue}>{user?.quotationCount || 0}</Text>
                    <Text style={styles.statLabel}>Orçamentos</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                    <Text style={styles.statValue}>{loyalty.emoji}</Text>
                    <Text style={styles.statLabel}>Nível</Text>
                </View>
            </View>

            {/* Menu */}
            <View style={styles.menuSection}>
                <MenuItem icon={Settings} label="Editar Perfil" onPress={() => navigation.navigate('EditProfile')} />
                <MenuItem icon={Heart} label="Favoritos" onPress={() => navigation.navigate('Favorites')} />
                <MenuItem icon={ClipboardList} label="Histórico de Pedidos" onPress={() => navigation.navigate('OrderHistory')} />
                <MenuItem icon={Bell} label="Notificações" onPress={() => navigation.navigate('Notifications')} />
                <MenuItem icon={HelpCircle} label="Ajuda & Suporte" onPress={() => { }} />
            </View>

            <View style={styles.menuSection}>
                <MenuItem icon={LogOut} label="Terminar Sessão" onPress={handleLogout} color={Theme.colors.error} />
            </View>

            <Text style={styles.version}>Puculuxa v1.0.0</Text>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Theme.colors.background },
    content: { paddingBottom: 32 },
    header: {
        alignItems: 'center',
        paddingTop: 60,
        paddingBottom: 32,
        borderBottomLeftRadius: 32,
        borderBottomRightRadius: 32,
    },
    avatarCircle: {
        width: 72,
        height: 72,
        borderRadius: 36,
        backgroundColor: 'rgba(255,255,255,0.25)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.4)',
    },
    avatarText: { fontFamily: 'Merriweather_700Bold', fontSize: 24, color: Theme.colors.white },
    userName: { fontFamily: 'Merriweather_700Bold', fontSize: 20, color: Theme.colors.white, marginBottom: 4 },
    userEmail: { ...T.bodySmall, color: 'rgba(255,255,255,0.7)' },
    loyaltyBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10, backgroundColor: 'rgba(255,255,255,0.15)', paddingHorizontal: 14, paddingVertical: 5, borderRadius: Theme.radius.full },
    loyaltyText: { fontFamily: 'Poppins_600SemiBold', fontSize: 12 },
    statsRow: {
        flexDirection: 'row',
        backgroundColor: Theme.colors.surfaceElevated,
        marginHorizontal: 20,
        marginTop: -16,
        borderRadius: Theme.radius.lg,
        padding: 16,
        ...Theme.elevation.sm,
    },
    statItem: { flex: 1, alignItems: 'center' },
    statValue: { fontFamily: 'Merriweather_700Bold', fontSize: 20, color: Theme.colors.primary },
    statLabel: { ...T.bodySmall, marginTop: 4 },
    statDivider: { width: 1, backgroundColor: Theme.colors.border },
    menuSection: {
        backgroundColor: Theme.colors.surfaceElevated,
        marginHorizontal: 20,
        marginTop: 20,
        borderRadius: Theme.radius.lg,
        paddingHorizontal: 16,
        ...Theme.elevation.xs,
    },
    version: { ...T.bodySmall, textAlign: 'center', marginTop: 24 },
});
