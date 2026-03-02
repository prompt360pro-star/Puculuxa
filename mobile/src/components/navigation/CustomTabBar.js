import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Animated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Home, Search, ClipboardList, User, UtensilsCrossed } from 'lucide-react-native';
import { Theme, T } from '../../theme';

const TAB_ICONS = {
    HomeTab: { icon: Home, label: 'Início' },
    CatalogTab: { icon: Search, label: 'Catálogo' },
    QuotationTab: { icon: UtensilsCrossed, label: 'Orçamento' },
    OrdersTab: { icon: ClipboardList, label: 'Pedidos' },
    ProfileTab: { icon: User, label: 'Perfil' },
};

export const CustomTabBar = ({ state, descriptors, navigation }) => {
    const insets = useSafeAreaInsets();

    return (
        <View style={[styles.container, { paddingBottom: Math.max(insets.bottom, 8) }]}>
            {state.routes.map((route, index) => {
                const isFocused = state.index === index;
                const config = TAB_ICONS[route.name] || {};
                const IconComponent = config.icon || Home;
                const isCentral = route.name === 'QuotationTab';

                const onPress = () => {
                    const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
                    if (!isFocused && !event.defaultPrevented) {
                        navigation.navigate(route.name);
                    }
                };

                if (isCentral) {
                    return (
                        <TouchableOpacity
                            key={route.key}
                            onPress={onPress}
                            style={styles.centralButton}
                            accessibilityRole="button"
                            accessibilityLabel="Pedir Orçamento"
                            accessibilityState={{ selected: isFocused }}
                        >
                            <LinearGradient
                                colors={[Theme.colors.primary, Theme.colors.primaryDark]}
                                style={styles.centralGradient}
                            >
                                <UtensilsCrossed size={24} color={Theme.colors.white} />
                            </LinearGradient>
                        </TouchableOpacity>
                    );
                }

                return (
                    <TouchableOpacity
                        key={route.key}
                        onPress={onPress}
                        style={styles.tab}
                        accessibilityRole="tab"
                        accessibilityLabel={config.label}
                        accessibilityState={{ selected: isFocused }}
                    >
                        <IconComponent
                            size={22}
                            color={isFocused ? Theme.colors.primary : Theme.colors.textTertiary}
                            strokeWidth={isFocused ? 2.5 : 1.8}
                        />
                        {isFocused ? (
                            <>
                                <Text style={styles.activeLabel}>{config.label}</Text>
                                <View style={styles.activeDot} />
                            </>
                        ) : null}
                    </TouchableOpacity>
                );
            })}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        backgroundColor: Theme.colors.surfaceElevated,
        borderTopWidth: 1,
        borderTopColor: Theme.colors.border,
        paddingTop: 8,
        alignItems: 'flex-end',
        ...Theme.elevation.sm,
    },
    tab: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 6,
        minHeight: 44,
    },
    activeLabel: {
        fontFamily: T.bodySmall.fontFamily,
        fontSize: 10,
        color: Theme.colors.primary,
        marginTop: 2,
    },
    activeDot: {
        width: 4,
        height: 4,
        borderRadius: 2,
        backgroundColor: Theme.colors.primary,
        marginTop: 3,
    },
    centralButton: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: -20,
    },
    centralGradient: {
        width: 56,
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
        ...Theme.elevation.md,
    },
});
