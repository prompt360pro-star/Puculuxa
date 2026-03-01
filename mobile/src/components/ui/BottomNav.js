import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Star, UtensilsCrossed, User, Heart, ShoppingCart } from 'lucide-react-native';
import { Theme } from '../../theme';
import { useCartStore } from '../../store/cartStore';

export const BottomNav = () => {
    const navigation = useNavigation();
    const route = useRoute();
    const cartItemsCount = useCartStore((s) => s.items?.length || 0);

    const currentRoute = route.name;

    const navigateTo = (screen) => {
        if (currentRoute !== screen) {
            navigation.navigate(screen);
        }
    };

    return (
        <View style={styles.bottomNav}>
            <TouchableOpacity style={styles.navItem} onPress={() => navigateTo('Home')}>
                <Star size={24} color={currentRoute === 'Home' ? Theme.colors.primary : Theme.colors.textSecondary} />
                <Text style={[styles.navText, currentRoute === 'Home' && { color: Theme.colors.primary }]}>Início</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.navItem} onPress={() => navigateTo('Favorites')}>
                <Heart size={24} color={currentRoute === 'Favorites' ? Theme.colors.primary : Theme.colors.textSecondary} />
                <Text style={[styles.navText, currentRoute === 'Favorites' && { color: Theme.colors.primary }]}>Favoritos</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.navItem} onPress={() => navigateTo('Cart')}>
                <View>
                    <ShoppingCart size={24} color={currentRoute === 'Cart' ? Theme.colors.primary : Theme.colors.textSecondary} />
                    {cartItemsCount > 0 && (
                        <View style={styles.badge}>
                            <Text style={styles.badgeText}>{cartItemsCount}</Text>
                        </View>
                    )}
                </View>
                <Text style={[styles.navText, currentRoute === 'Cart' && { color: Theme.colors.primary }]}>Carrinho</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.navItem} onPress={() => navigateTo('Quotation')}>
                <UtensilsCrossed size={24} color={currentRoute === 'Quotation' ? Theme.colors.primary : Theme.colors.textSecondary} />
                <Text style={[styles.navText, currentRoute === 'Quotation' && { color: Theme.colors.primary }]}>Pedido</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.navItem} onPress={() => navigateTo('Profile')}>
                <User size={24} color={currentRoute === 'Profile' ? Theme.colors.primary : Theme.colors.textSecondary} />
                <Text style={[styles.navText, currentRoute === 'Profile' && { color: Theme.colors.primary }]}>Perfil</Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    bottomNav: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        backgroundColor: 'white',
        paddingVertical: 12,
        paddingBottom: 24, // Para safe area visual
        borderTopWidth: 1,
        borderTopColor: Theme.colors.surface,
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        ...Theme.shadows.medium,
    },
    navItem: {
        alignItems: 'center',
    },
    navText: {
        fontSize: 10,
        fontWeight: '500',
        color: Theme.colors.textSecondary,
        marginTop: 4,
    },
    badge: {
        position: 'absolute', top: -5, right: -10,
        backgroundColor: Theme.colors.primary,
        borderRadius: 10, minWidth: 18, height: 18,
        justifyContent: 'center', alignItems: 'center',
        borderWidth: 1.5, borderColor: 'white'
    },
    badgeText: { color: 'white', fontSize: 9, fontWeight: 'bold' }
});
