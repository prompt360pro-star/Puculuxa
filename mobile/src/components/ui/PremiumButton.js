import React from 'react';
import {
    TouchableOpacity,
    Text,
    StyleSheet,
    Animated,
    ActivityIndicator,
    View,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { TOKENS, textStyles, Theme } from '../../theme';

const VARIANTS = {
    primary: {
        bg: TOKENS.colors.red,
        text: TOKENS.colors.textInverse,
        border: null,
    },
    secondary: {
        bg: TOKENS.colors.surface2,
        text: TOKENS.colors.text,
        border: TOKENS.colors.border,
    },
    ghost: {
        bg: 'transparent',
        text: TOKENS.colors.red,
        border: null,
    },
    danger: {
        bg: TOKENS.colors.danger,
        text: TOKENS.colors.textInverse,
        border: null,
    },
    gold: {
        bg: TOKENS.colors.gold,
        text: '#1A1209', // Dark contrast for gold
        border: null,
    },
};

const SIZES = {
    sm: { height: 40, paddingHorizontal: TOKENS.spacing[4], ...textStyles.small },
    md: { height: 52, paddingHorizontal: TOKENS.spacing[6], ...textStyles.bodyMedium },
    lg: { height: 60, paddingHorizontal: TOKENS.spacing[8], ...textStyles.bodyMedium, fontSize: 16 },
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
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        Animated.spring(scaleAnim, {
            toValue: 0.96,
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
                    <Text style={[styles.text, { color: v.text, fontSize: s.fontSize, fontFamily: s.fontFamily }]}>
                        {title}
                    </Text>
                </>
            )}
        </View>
    );

    const containerStyle = [
        styles.container,
        { 
            backgroundColor: v.bg, 
            borderWidth: v.border ? 1.5 : 0, 
            borderColor: v.border 
        },
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
                <View style={containerStyle}>
                    {content}
                </View>
            </TouchableOpacity>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        ...TOKENS.shadowElite,
    },
    inner: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: TOKENS.spacing[2],
    },
    text: {
        letterSpacing: 0.3,
    },
    iconWrap: {
        marginRight: TOKENS.spacing[1],
    },
    disabled: {
        opacity: 0.45,
    },
});
