import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

/**
 * Skeleton com shimmer horizontal real.
 * Gradiente animado que varre da esquerda para a direita continuamente.
 *
 * Uso:
 * <Skeleton width={120} height={16} />
 * <Skeleton width="100%" height={200} borderRadius={16} />
 */
export const Skeleton = ({ width = '100%', height = 16, borderRadius = 8, style }) => {
    const shimmerAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const loop = Animated.loop(
            Animated.timing(shimmerAnim, {
                toValue: 1,
                duration: 1400,
                useNativeDriver: true,
            })
        );
        loop.start();
        return () => loop.stop();
    }, []);

    const translateX = shimmerAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [-300, 300],
    });

    return (
        <View style={[styles.base, { width, height, borderRadius }, style]}>
            <Animated.View style={[StyleSheet.absoluteFill, { transform: [{ translateX }] }]}>
                <LinearGradient
                    colors={['#F5EFE0', '#EDE5D0', '#F5EFE0']}
                    start={{ x: 0, y: 0.5 }}
                    end={{ x: 1, y: 0.5 }}
                    style={[StyleSheet.absoluteFill, { width: 600 }]}
                />
            </Animated.View>
        </View>
    );
};

/**
 * Skeleton na forma exacta de um ProductCard
 */
export const ProductCardSkeleton = () => (
    <View style={styles.cardSkeleton}>
        <Skeleton width="100%" height={140} borderRadius={12} />
        <View style={{ padding: 12, gap: 8 }}>
            <Skeleton width="75%" height={14} />
            <Skeleton width="50%" height={12} />
            <Skeleton width="40%" height={18} />
        </View>
    </View>
);

const styles = StyleSheet.create({
    base: {
        backgroundColor: '#F5EFE0',
        overflow: 'hidden',
    },
    cardSkeleton: {
        flex: 1,
        margin: 6,
        borderRadius: 16,
        backgroundColor: '#FFFFFF',
        overflow: 'hidden',
    },
});
