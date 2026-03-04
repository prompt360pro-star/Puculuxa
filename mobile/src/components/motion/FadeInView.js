import React, { useEffect, useRef } from 'react';
import { Animated, View } from 'react-native';
import { REDUCE_MOTION } from '../../config/accessibility';

export const FadeInView = ({ children, delay = 0, fromY = 8, duration = 260, style }) => {
    const opacity = useRef(new Animated.Value(0)).current;
    const translateY = useRef(new Animated.Value(fromY)).current;

    useEffect(() => {
        if (REDUCE_MOTION) return;
        
        // Cap the delay to max 240ms to avoid long waits on large lists
        const safeDelay = Math.min(delay, 240);

        Animated.parallel([
            Animated.timing(opacity, {
                toValue: 1,
                duration: duration,
                delay: safeDelay,
                useNativeDriver: true,
            }),
            Animated.timing(translateY, {
                toValue: 0,
                duration: duration,
                delay: safeDelay,
                useNativeDriver: true,
            })
        ]).start();
    }, [opacity, translateY, delay, duration, fromY]);

    if (REDUCE_MOTION) {
        return <View style={style}>{children}</View>;
    }

    return (
        <Animated.View style={[{ opacity, transform: [{ translateY }] }, style]}>
            {children}
        </Animated.View>
    );
};
