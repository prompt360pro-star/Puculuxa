import React from 'react';
import {
    TouchableOpacity,
    Text,
    StyleSheet,
    Animated,
    ActivityIndicator,
    View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Theme, T } from '../../theme';

const VARIANTS = {
    primary: {
        gradient: [Theme.colors.primary, Theme.colors.primaryDark],
        text: Theme.colors.textInverse,
    },
    secondary: {
        bg: Theme.colors.secondary,
        text: Theme.colors.textInverse,
    },
    ghost: {
        bg: 'transparent',
        text: Theme.colors.primary,
        border: Theme.colors.primary,
    },
    danger: {
        bg: Theme.colors.error,
        text: Theme.colors.textInverse,
    },
    gold: {
        gradient: [Theme.colors.gold, '#E6C200'],
        text: '#1A1209',
    },
};

const SIZES = {
    sm: { height: 40, paddingHorizontal: 16, ...T.buttonSmall },
    md: { height: 52, paddingHorizontal: 24, ...T.button },
    lg: { height: 60, paddingHorizontal: 32, ...T.button, fontSize: 16 },
};

export const PremiumButton = ({
    title,
    onPress,
    variant = 'primary',
    size = 'md',
    loading = false,
    disabled = false,
    icon,
    style,
}) => {
    const scaleAnim = React.useRef(new Animated.Value(1)).current;
    const v = VARIANTS[variant] || VARIANTS.primary;
    const s = SIZES[size] || SIZES.md;

    const onPressIn = () => {
        Animated.spring(scaleAnim, {
            toValue: 0.97,
            friction: 10,
            tension: 80,
            useNativeDriver: true,
        }).start();
    };

    const onPressOut = () => {
        Animated.spring(scaleAnim, {
            toValue: 1,
            friction: 6,
            tension: 40,
            useNativeDriver: true,
        }).start();
    };

    const content = (
        <View style={[styles.inner, { height: s.height, paddingHorizontal: s.paddingHorizontal }]}>
            {loading ? (
                <ActivityIndicator color={v.text} size="small" />
            ) : (
                <>
                    {icon ? <View style={styles.iconWrap}>{icon}</View> : null}
                    <Text style={[styles.text, { color: v.text, fontSize: s.fontSize || T.button.fontSize, fontFamily: T.button.fontFamily }]}>
                        {title}
                    </Text>
                </>
            )}
        </View>
    );

    const containerStyle = [
        styles.container,
        !v.gradient ? { backgroundColor: v.bg, borderWidth: v.border ? 1.5 : 0, borderColor: v.border } : null,
        { borderRadius: s.height / 2 },
        disabled ? styles.disabled : null,
        style,
    ];

    return (
        <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
            <TouchableOpacity
                onPress={onPress}
                onPressIn={onPressIn}
                onPressOut={onPressOut}
                disabled={disabled || loading}
                activeOpacity={0.9}
                accessibilityRole="button"
                accessibilityLabel={title}
                accessibilityState={{ disabled: disabled || loading, busy: loading }}
            >
                {v.gradient ? (
                    <LinearGradient
                        colors={v.gradient}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={[containerStyle, { overflow: 'hidden' }]}
                    >
                        {content}
                    </LinearGradient>
                ) : (
                    <View style={containerStyle}>
                        {content}
                    </View>
                )}
            </TouchableOpacity>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        ...Theme.elevation.sm,
    },
    inner: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    text: {
        fontFamily: T.button.fontFamily,
        letterSpacing: T.button.letterSpacing,
    },
    iconWrap: {
        marginRight: 4,
    },
    disabled: {
        opacity: 0.45,
    },
});
