import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Settings, Heart, History, LogOut, ChevronRight } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { Theme } from '../theme';
import { useAuthStore } from '../store/authStore';

export const ProfileScreen = () => {
    const { user, logout } = useAuthStore();
    const navigation = useNavigation();

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
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            <View style={styles.header}>
                <View style={styles.avatarContainer}>
                    <View style={styles.avatar}>
                        <Text style={styles.avatarText}>{getUserInitials()}</Text>
                    </View>
                </View>
                <Text style={styles.userName}>{user?.name || 'Visitante'}</Text>
                <Text style={styles.userEmail}>{user?.email || 'Nenhum e-mail vinculado'}</Text>
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
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Theme.colors.background,
    },
    content: {
        paddingTop: 80,
        paddingBottom: 40,
    },
    header: {
        alignItems: 'center',
        marginBottom: 40,
    },
    avatarContainer: {
        width: 100,
        height: 100,
        borderRadius: 50,
        borderWidth: 3,
        borderColor: Theme.colors.primary,
        padding: 4,
        marginBottom: 16,
    },
    avatar: {
        flex: 1,
        backgroundColor: Theme.colors.surface,
        borderRadius: 50,
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarText: {
        fontSize: 32,
        fontWeight: 'bold',
        color: Theme.colors.primary,
    },
    userName: {
        fontSize: 24,
        fontWeight: 'bold',
        color: Theme.colors.textSecondary,
    },
    userEmail: {
        fontSize: 14,
        color: Theme.colors.textSecondary,
        opacity: 0.7,
    },
    section: {
        backgroundColor: 'white',
        marginHorizontal: Theme.spacing.xl,
        borderRadius: 24,
        padding: 24,
        marginBottom: 24,
        ...Theme.shadows.light,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: Theme.colors.accent,
        marginBottom: 20,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
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
