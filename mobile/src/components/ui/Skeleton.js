import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { Theme } from '../../theme';

export const Skeleton = ({
    width = '100%',
    height = 20,
    borderRadius = Theme.radius.md,
    style
}) => {
    const progress = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const animation = Animated.loop(
            Animated.sequence([
                Animated.timing(progress, {
                    toValue: 1,
                    duration: 1000,
                    useNativeDriver: false, // Color interpolation cannot use native driver
                }),
                Animated.timing(progress, {
                    toValue: 0,
                    duration: 1000,
                    useNativeDriver: false,
                })
            ])
        );
        animation.start();

        return () => animation.stop();
    }, [progress]);

    const backgroundColor = progress.interpolate({
        inputRange: [0, 1],
        outputRange: ['#E2E8F0', '#F1F5F9'] // Slate 200 to Slate 100 
    });

    return (
        <Animated.View
            style={[
                styles.skeleton,
                { width, height, borderRadius, backgroundColor },
                style
            ]}
        />
    );
};

const styles = StyleSheet.create({
    skeleton: {
        overflow: 'hidden',
    },
});
