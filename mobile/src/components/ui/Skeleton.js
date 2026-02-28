import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withTiming,
    interpolateColor,
} from 'react-native-reanimated';
import { Theme } from '../../theme';

export const Skeleton = ({
    width = '100%',
    height = 20,
    borderRadius = Theme.radius.md,
    style
}) => {
    const progress = useSharedValue(0);

    useEffect(() => {
        progress.value = withRepeat(
            withTiming(1, { duration: 1000 }),
            -1, // Infinite
            true // Reverse
        );
    }, []);

    const animatedStyle = useAnimatedStyle(() => {
        const backgroundColor = interpolateColor(
            progress.value,
            [0, 1],
            ['#E2E8F0', '#F1F5F9'] // Slate 200 to Slate 100 
        );

        return { backgroundColor };
    });

    return (
        <Animated.View
            style={[
                styles.skeleton,
                { width, height, borderRadius },
                animatedStyle,
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
