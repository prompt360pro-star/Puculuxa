import React, { useState, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Image,
    Animated,
    Dimensions,
    TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Mail, Lock } from 'lucide-react-native';
import { Theme, T } from '../theme';
import { useAuthStore } from '../store/authStore';
import { useToastStore } from '../store/toastStore';
import { PremiumButton } from '../components/ui/PremiumButton';
import { PremiumInput } from '../components/ui/PremiumInput';
import { humanizeError } from '../utils/errorMessages';

const { width } = Dimensions.get('window');

export default function LoginScreen({ navigation }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const { login, loading } = useAuthStore();
    const { show } = useToastStore();
    const shakeAnim = useRef(new Animated.Value(0)).current;

    const triggerShake = () => {
        Animated.sequence([
            Animated.timing(shakeAnim, { toValue: 10, duration: 60, useNativeDriver: true }),
            Animated.timing(shakeAnim, { toValue: -10, duration: 60, useNativeDriver: true }),
            Animated.timing(shakeAnim, { toValue: 8, duration: 60, useNativeDriver: true }),
            Animated.timing(shakeAnim, { toValue: -8, duration: 60, useNativeDriver: true }),
            Animated.timing(shakeAnim, { toValue: 0, duration: 60, useNativeDriver: true }),
        ]).start();
    };

    const handleLogin = async () => {
        if (!email.trim() || !password.trim()) {
            show({ type: 'warning', message: 'Preenche todos os campos.' });
            return;
        }

        try {
            await login(email.trim(), password);
        } catch (error) {
            triggerShake();
            show({ type: 'error', message: humanizeError(error) });
        }
    };

    return (
        <View style={styles.container}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    {/* Header */}
                    <LinearGradient
                        colors={[Theme.colors.gradientStart, Theme.colors.gradientMid, Theme.colors.gradientEnd]}
                        style={styles.header}
                    >
                        <View style={styles.logoCircle}>
                            <Image source={require('../../assets/logo.jpeg')} style={styles.logoImage} />
                        </View>
                        <Text style={styles.brand}>Puculuxa</Text>
                        <Text style={styles.tagline}>O sabor que cria memórias</Text>
                    </LinearGradient>

                    {/* Form Card */}
                    <View style={styles.card}>
                        <Text style={styles.cardTitle}>Entrar na tua conta</Text>

                        <PremiumInput
                            label="E-mail"
                            value={email}
                            onChangeText={setEmail}
                            placeholder="nome@exemplo.com"
                            keyboardType="email-address"
                            autoCapitalize="none"
                            autoComplete="email"
                            icon={<Mail />}
                        />

                        <PremiumInput
                            label="Password"
                            value={password}
                            onChangeText={setPassword}
                            placeholder="A tua password"
                            secureTextEntry
                            autoComplete="password"
                            icon={<Lock />}
                        />

                        <TouchableOpacity
                            style={styles.forgotLink}
                            accessibilityRole="link"
                            accessibilityLabel="Esqueceste a password?"
                        >
                            <Text style={styles.forgotText}>Esqueceste a password?</Text>
                        </TouchableOpacity>

                        <Animated.View style={{ transform: [{ translateX: shakeAnim }] }}>
                            <PremiumButton
                                title="Entrar"
                                onPress={handleLogin}
                                variant="primary"
                                size="lg"
                                loading={loading}
                            />
                        </Animated.View>
                    </View>

                    {/* Register link */}
                    <View style={styles.registerRow}>
                        <Text style={styles.registerText}>Ainda não tens conta? </Text>
                        <TouchableOpacity
                            onPress={() => navigation.navigate('Register')}
                            accessibilityRole="link"
                            accessibilityLabel="Criar conta"
                        >
                            <Text style={styles.registerLink}>Criar conta</Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Theme.colors.background,
    },
    scrollContent: {
        flexGrow: 1,
    },
    header: {
        paddingTop: 60,
        paddingBottom: 40,
        alignItems: 'center',
        borderBottomLeftRadius: 32,
        borderBottomRightRadius: 32,
    },
    logoCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
        marginBottom: 12,
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
        fontSize: 28,
        color: Theme.colors.white,
        marginBottom: 4,
    },
    tagline: {
        fontFamily: 'Merriweather_400Regular',
        fontSize: 13,
        color: 'rgba(255,255,255,0.7)',
        fontStyle: 'italic',
    },
    card: {
        backgroundColor: Theme.colors.surfaceElevated,
        marginHorizontal: 20,
        marginTop: -20,
        borderRadius: Theme.radius.xl,
        padding: 28,
        ...Theme.elevation.lg,
    },
    cardTitle: {
        ...T.h3,
        textAlign: 'center',
        marginBottom: 28,
    },
    forgotLink: {
        alignSelf: 'flex-end',
        marginBottom: 24,
        marginTop: -8,
    },
    forgotText: {
        ...T.bodySmall,
        color: Theme.colors.primary,
    },
    registerRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 28,
    },
    registerText: {
        ...T.body,
        color: Theme.colors.textSecondary,
    },
    registerLink: {
        ...T.body,
        fontFamily: 'Poppins_600SemiBold',
        color: Theme.colors.primary,
    },
});
