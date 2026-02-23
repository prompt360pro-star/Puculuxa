import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Theme } from '../theme';

export const ScallopedButton = ({ title, onPress, type = 'primary', icon }) => {
    const isPrimary = type === 'primary';

    return (
        <TouchableOpacity
            activeOpacity={0.8}
            onPress={onPress}
            style={[styles.container, !isPrimary && styles.secondaryContainer]}
        >
            <LinearGradient
                colors={isPrimary ? [Theme.colors.gradientStart, Theme.colors.gradientEnd] : ['transparent', 'transparent']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[styles.gradient, !isPrimary && styles.secondaryBorder]}
            >
                <View style={styles.content}>
                    {icon && <View style={styles.iconContainer}>{icon}</View>}
                    <Text style={[styles.text, !isPrimary && styles.secondaryText]}>
                        {title}
                    </Text>
                </View>
            </LinearGradient>

            {/* Elemento Decorativo: "Babado" (Simulado com círculos sobrepostos ou SVG) */}
            {/* Para este MVP inicial, usaremos um arredondamento pronunciado e sombra customizada */}
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        borderRadius: Theme.radius.xl,
        overflow: 'hidden',
        ...Theme.shadows.medium,
        marginVertical: Theme.spacing.sm,
    },
    secondaryContainer: {
        shadowOpacity: 0,
        elevation: 0,
        borderWidth: 2,
        borderColor: Theme.colors.secondary,
    },
    gradient: {
        paddingVertical: Theme.spacing.md,
        paddingHorizontal: Theme.spacing.xl,
        justifyContent: 'center',
        alignItems: 'center',
    },
    secondaryBorder: {
        backgroundColor: 'transparent',
    },
    content: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconContainer: {
        marginRight: Theme.spacing.sm,
    },
    text: {
        color: Theme.colors.white,
        fontSize: 16,
        fontFamily: Theme.fonts.bodyMedium,
        fontWeight: '600',
    },
    secondaryText: {
        color: Theme.colors.accent,
    },
});
