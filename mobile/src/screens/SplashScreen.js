import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Theme, T } from '../theme';

const { width } = Dimensions.get('window');

export const SplashScreen = ({ navigation }) => {
    const logoScale = useRef(new Animated.Value(0.85)).current;
    const logoOpacity = useRef(new Animated.Value(0)).current;
    const subtitleOpacity = useRef(new Animated.Value(0)).current;
    const taglineOpacity = useRef(new Animated.Value(0)).current;
    const progressWidth = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        // Logo entrance — spring scale + fade
        Animated.parallel([
            Animated.spring(logoScale, {
                toValue: 1,
                friction: 4,
                useNativeDriver: true,
            }),
            Animated.timing(logoOpacity, {
                toValue: 1,
                duration: 600,
                useNativeDriver: true,
            }),
        ]).start();

        // Subtitle delayed
        Animated.timing(subtitleOpacity, {
            toValue: 1,
            duration: 500,
            delay: 300,
            useNativeDriver: true,
        }).start();

        // Tagline delayed
        Animated.timing(taglineOpacity, {
            toValue: 1,
            duration: 500,
            delay: 600,
            useNativeDriver: true,
        }).start();

        // Progress bar — fill 0→100% in 2200ms
        Animated.timing(progressWidth, {
            toValue: 1,
            duration: 2200,
            delay: 400,
            useNativeDriver: false,
        }).start();

        // Navigate after 2800ms
        const timer = setTimeout(() => {
            navigation.replace('Login');
        }, 2800);

        return () => clearTimeout(timer);
    }, []);

    const barWidth = progressWidth.interpolate({
        inputRange: [0, 1],
        outputRange: ['0%', '100%'],
    });

    return (
        <LinearGradient
            colors={[Theme.colors.gradientStart, Theme.colors.gradientMid, Theme.colors.gradientEnd]}
            style={styles.container}
        >
            {/* Logo + Brand */}
            <Animated.View style={[styles.logoContainer, { opacity: logoOpacity, transform: [{ scale: logoScale }] }]}>
                <View style={styles.logoCircle}>
                    <Image source={require('../../assets/logo.jpeg')} style={styles.logoImage} />
                </View>
                <Text style={styles.brand}>Puculuxa</Text>
            </Animated.View>

            {/* Subtitle */}
            <Animated.Text style={[styles.subtitle, { opacity: subtitleOpacity }]}>
                Cakes & Catering
            </Animated.Text>

            {/* Tagline */}
            <Animated.Text style={[styles.tagline, { opacity: taglineOpacity }]}>
                Cada momento merece ser doce.
            </Animated.Text>

            {/* Progress bar */}
            <View style={styles.progressTrack}>
                <Animated.View style={[styles.progressFill, { width: barWidth }]} />
            </View>
        </LinearGradient>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 40,
    },
    logoContainer: {
        alignItems: 'center',
        marginBottom: 12,
    },
    logoCircle: {
        width: width * 0.28,
        height: width * 0.28,
        borderRadius: width * 0.14,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
        marginBottom: 16,
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.3)',
    },
    logoImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    brand: {
        fontFamily: 'Pacifico_400Regular',
        fontSize: 40,
        color: Theme.colors.white,
        textShadowColor: 'rgba(0,0,0,0.2)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 8,
    },
    subtitle: {
        fontFamily: 'Poppins_500Medium',
        fontSize: 16,
        color: 'rgba(255,255,255,0.85)',
        letterSpacing: 2,
        textTransform: 'uppercase',
        marginTop: 4,
    },
    tagline: {
        fontFamily: 'Merriweather_400Regular',
        fontSize: 14,
        color: 'rgba(255,255,255,0.65)',
        fontStyle: 'italic',
        marginTop: 12,
    },
    progressTrack: {
        position: 'absolute',
        bottom: 80,
        left: 60,
        right: 60,
        height: 1.5,
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderRadius: 1,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        backgroundColor: 'rgba(255,255,255,0.6)',
        borderRadius: 1,
    },
});
