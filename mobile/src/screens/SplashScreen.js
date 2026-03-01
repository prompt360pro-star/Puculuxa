import React, { useEffect } from 'react';
import { View, StyleSheet, Animated, Dimensions, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Theme } from '../theme';

const { width } = Dimensions.get('window');

export const SplashScreen = ({ navigation }) => {
    const fadeAnim = new Animated.Value(0);
    const scaleAnim = new Animated.Value(0.8);

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 2000,
                useNativeDriver: true,
            }),
            Animated.spring(scaleAnim, {
                toValue: 1,
                friction: 4,
                useNativeDriver: true,
            }),
        ]).start();

        // Simula carregamento e navega para Login (o estado de auth do App.js redireciona para Home se logado)
        const timer = setTimeout(() => {
            navigation.replace('Login');
        }, 3000);

        return () => clearTimeout(timer);
    }, []);

    return (
        <LinearGradient
            colors={[Theme.colors.gradientStart, Theme.colors.gradientEnd]}
            style={styles.container}
        >
            <Animated.View style={[styles.logoContainer, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
                {/* Usaremos um placeholder visual até termos o arquivo do logo */}
                <View style={styles.placeholderLogo}>
                    <Image source={require('../../assets/logo.jpeg')} style={styles.logoImage} />
                </View>
            </Animated.View>
        </LinearGradient>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    logoContainer: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    placeholderLogo: {
        width: width * 0.5,
        height: width * 0.5,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        borderRadius: Theme.radius.full,
        padding: Theme.spacing.lg,
        borderColor: 'white',
        borderStyle: 'dotted',
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
    },
    logoImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
        borderRadius: Theme.radius.full,
    }
});
