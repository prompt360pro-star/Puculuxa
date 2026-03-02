import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CheckCircle, AlertCircle, AlertTriangle, Info, X, Cake } from 'lucide-react-native';
import { useToastStore } from '../../store/toastStore';
import { Theme, T } from '../../theme';

const TOAST_CONFIG = {
    success: { icon: CheckCircle, bg: Theme.colors.successBg, border: Theme.colors.success, iconColor: Theme.colors.success },
    error: { icon: AlertCircle, bg: Theme.colors.errorBg, border: Theme.colors.error, iconColor: Theme.colors.error },
    warning: { icon: AlertTriangle, bg: Theme.colors.warningBg, border: Theme.colors.warning, iconColor: Theme.colors.warning },
    info: { icon: Info, bg: Theme.colors.infoBg, border: Theme.colors.info, iconColor: Theme.colors.info },
    brand: { icon: Cake, bg: Theme.colors.primaryGhost, border: Theme.colors.primary, iconColor: Theme.colors.primary },
};

const ToastItem = ({ toast, index }) => {
    const translateY = useRef(new Animated.Value(-70)).current;
    const opacity = useRef(new Animated.Value(0)).current;
    const { dismiss } = useToastStore();
    const config = TOAST_CONFIG[toast.type] || TOAST_CONFIG.info;
    const IconComponent = config.icon;

    useEffect(() => {
        Animated.parallel([
            Animated.spring(translateY, { toValue: 0, friction: 8, useNativeDriver: true }),
            Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
        ]).start();

        const exitTimer = setTimeout(() => {
            Animated.parallel([
                Animated.timing(translateY, { toValue: -70, duration: 220, useNativeDriver: true }),
                Animated.timing(opacity, { toValue: 0, duration: 220, useNativeDriver: true }),
            ]).start();
        }, toast.duration - 250);

        return () => clearTimeout(exitTimer);
    }, []);

    return (
        <Animated.View
            style={[
                styles.toast,
                { backgroundColor: config.bg, borderLeftColor: config.border },
                { transform: [{ translateY }], opacity, marginTop: index * 4 },
            ]}
        >
            <IconComponent size={18} color={config.iconColor} />
            <Text style={styles.message} numberOfLines={2}>{toast.message}</Text>
            <TouchableOpacity
                onPress={() => dismiss(toast.id)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                accessibilityRole="button"
                accessibilityLabel="Fechar notificação"
            >
                <X size={14} color={Theme.colors.textSecondary} />
            </TouchableOpacity>
        </Animated.View>
    );
};

export const ToastProvider = ({ children }) => {
    const toasts = useToastStore(state => state.toasts);
    let topInset = 0;
    try {
        const insets = useSafeAreaInsets();
        topInset = insets.top;
    } catch (e) {
        topInset = 44;
    }

    return (
        <View style={{ flex: 1 }}>
            {children}
            <View style={[styles.container, { top: topInset + 8 }]} pointerEvents="box-none">
                {toasts.map((toast, i) => (
                    <ToastItem key={toast.id} toast={toast} index={i} />
                ))}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        left: 16,
        right: 16,
        zIndex: 9999,
    },
    toast: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderRadius: Theme.radius.md,
        borderLeftWidth: 4,
        marginBottom: 8,
        ...Theme.elevation.md,
    },
    message: {
        flex: 1,
        fontFamily: T.body.fontFamily,
        fontSize: 14,
        color: Theme.colors.textPrimary,
        lineHeight: 20,
    },
});
