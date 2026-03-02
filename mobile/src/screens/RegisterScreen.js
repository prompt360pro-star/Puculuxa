import React, { useState, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Animated,
    Dimensions,
    TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { User, Mail, Phone, Lock, ArrowRight, Check } from 'lucide-react-native';
import { Theme, T } from '../theme';
import { useAuthStore } from '../store/authStore';
import { useToastStore } from '../store/toastStore';
import { PremiumButton } from '../components/ui/PremiumButton';
import { PremiumInput } from '../components/ui/PremiumInput';
import { humanizeError } from '../utils/errorMessages';

const { width } = Dimensions.get('window');

// Barra de força da password
const PasswordStrength = ({ password }) => {
    let strength = 0;
    if (password.length >= 6) strength++;
    if (password.length >= 10) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;

    const colors = ['#F44336', '#F44336', '#FF9800', '#FFC107', '#4CAF50'];
    const labels = ['', 'Fraca', 'Razoável', 'Boa', 'Forte'];
    const level = Math.min(strength, 4);

    if (!password) return null;

    return (
        <View style={strengthStyles.container}>
            <View style={strengthStyles.barTrack}>
                {[0, 1, 2, 3].map(i => (
                    <View
                        key={i}
                        style={[
                            strengthStyles.barSegment,
                            { backgroundColor: i < level ? colors[level] : Theme.colors.border },
                        ]}
                    />
                ))}
            </View>
            <Text style={[strengthStyles.label, { color: colors[level] }]}>{labels[level]}</Text>
        </View>
    );
};

const strengthStyles = StyleSheet.create({
    container: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: -12, marginBottom: 12 },
    barTrack: { flexDirection: 'row', flex: 1, gap: 4 },
    barSegment: { flex: 1, height: 3, borderRadius: 2 },
    label: { fontFamily: T.bodySmall.fontFamily, fontSize: 11 },
});

export default function RegisterScreen({ navigation }) {
    const [step, setStep] = useState(1);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [emailError, setEmailError] = useState('');
    const [passwordError, setPasswordError] = useState('');

    const { register, loading } = useAuthStore();
    const { show } = useToastStore();
    const slideAnim = useRef(new Animated.Value(0)).current;

    const validateEmail = (text) => {
        setEmail(text);
        if (text && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text)) {
            setEmailError('Formato de email inválido');
        } else {
            setEmailError('');
        }
    };

    const goToStep2 = () => {
        if (!name.trim()) {
            show({ type: 'warning', message: 'Preenche o teu nome.' });
            return;
        }
        if (!email.trim() || emailError) {
            show({ type: 'warning', message: 'Insere um email válido.' });
            return;
        }
        Animated.timing(slideAnim, {
            toValue: -width,
            duration: 300,
            useNativeDriver: true,
        }).start(() => setStep(2));
    };

    const goBackToStep1 = () => {
        setStep(1);
        Animated.timing(slideAnim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
        }).start();
    };

    const handleRegister = async () => {
        if (!phone.trim()) {
            show({ type: 'warning', message: 'Insere o teu número de telefone.' });
            return;
        }
        if (password.length < 6) {
            setPasswordError('A password deve ter pelo menos 6 caracteres');
            return;
        }
        if (password !== confirmPassword) {
            setPasswordError('As passwords não coincidem');
            return;
        }
        setPasswordError('');

        try {
            await register({ name: name.trim(), email: email.trim(), phone: `+244${phone.replace(/\D/g, '')}`, password });
            show({ type: 'success', message: 'Conta criada! Faz login para continuar.' });
            navigation.navigate('Login');
        } catch (error) {
            show({ type: 'error', message: humanizeError(error) });
        }
    };

    return (
        <View style={styles.container}>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
                <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
                    {/* Header */}
                    <LinearGradient
                        colors={[Theme.colors.gradientStart, Theme.colors.gradientMid, Theme.colors.gradientEnd]}
                        style={styles.header}
                    >
                        <Text style={styles.brand}>Puculuxa</Text>
                        <Text style={styles.headerTitle}>Criar a tua conta</Text>
                        <Text style={styles.headerSubtitle}>Em poucos passos, começas a encomendar</Text>
                    </LinearGradient>

                    {/* Step Indicator */}
                    <View style={styles.stepRow}>
                        <View style={[styles.stepDot, step >= 1 ? styles.stepActive : null]}>
                            {step > 1 ? <Check size={12} color={Theme.colors.white} /> : <Text style={styles.stepNum}>1</Text>}
                        </View>
                        <View style={[styles.stepLine, step > 1 ? styles.stepLineActive : null]} />
                        <View style={[styles.stepDot, step >= 2 ? styles.stepActive : null]}>
                            <Text style={styles.stepNum}>2</Text>
                        </View>
                    </View>

                    {/* Form Card */}
                    <View style={styles.card}>
                        {step === 1 ? (
                            <>
                                <Text style={styles.stepTitle}>Quem és?</Text>
                                <PremiumInput label="Nome completo" value={name} onChangeText={setName} placeholder="O teu nome" icon={<User />} autoComplete="name" />
                                <PremiumInput label="E-mail" value={email} onChangeText={validateEmail} error={emailError} placeholder="nome@exemplo.com" keyboardType="email-address" autoCapitalize="none" icon={<Mail />} />
                                <PremiumButton title="Continuar →" onPress={goToStep2} variant="primary" size="lg" />
                            </>
                        ) : (
                            <>
                                <Text style={styles.stepTitle}>Segurança</Text>
                                <View style={styles.phoneRow}>
                                    <View style={styles.phonePrefix}>
                                        <Text style={styles.phonePrefixText}>+244</Text>
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <PremiumInput label="Telefone" value={phone} onChangeText={setPhone} placeholder="923 456 789" keyboardType="phone-pad" maxLength={12} icon={<Phone />} />
                                    </View>
                                </View>
                                <PremiumInput label="Password" value={password} onChangeText={(t) => { setPassword(t); setPasswordError(''); }} placeholder="Mínimo 6 caracteres" secureTextEntry icon={<Lock />} error={passwordError} />
                                <PasswordStrength password={password} />
                                <PremiumInput label="Confirmar password" value={confirmPassword} onChangeText={setConfirmPassword} placeholder="Repetir a password" secureTextEntry icon={<Lock />} />
                                <View style={{ gap: 12 }}>
                                    <PremiumButton title="Criar Conta" onPress={handleRegister} variant="primary" size="lg" loading={loading} />
                                    <PremiumButton title="← Voltar" onPress={goBackToStep1} variant="ghost" size="md" />
                                </View>
                            </>
                        )}
                    </View>

                    {/* Login link */}
                    <View style={styles.loginRow}>
                        <Text style={styles.loginText}>Já tens conta? </Text>
                        <TouchableOpacity onPress={() => navigation.navigate('Login')} accessibilityRole="link" accessibilityLabel="Fazer login">
                            <Text style={styles.loginLink}>Fazer login</Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Theme.colors.background },
    scrollContent: { flexGrow: 1 },
    header: {
        paddingTop: 60,
        paddingBottom: 36,
        alignItems: 'center',
        borderBottomLeftRadius: 32,
        borderBottomRightRadius: 32,
    },
    brand: { fontFamily: 'Pacifico_400Regular', fontSize: 22, color: 'rgba(255,255,255,0.7)', marginBottom: 8 },
    headerTitle: { ...T.h2, color: Theme.colors.white, marginBottom: 4 },
    headerSubtitle: { ...T.bodySmall, color: 'rgba(255,255,255,0.65)' },
    stepRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 20,
        gap: 0,
    },
    stepDot: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: Theme.colors.border,
        justifyContent: 'center',
        alignItems: 'center',
    },
    stepActive: {
        backgroundColor: Theme.colors.primary,
    },
    stepNum: {
        fontFamily: T.button.fontFamily,
        fontSize: 12,
        color: Theme.colors.white,
    },
    stepLine: {
        width: 60,
        height: 2,
        backgroundColor: Theme.colors.border,
    },
    stepLineActive: {
        backgroundColor: Theme.colors.primary,
    },
    stepTitle: {
        ...T.h3,
        textAlign: 'center',
        marginBottom: 24,
    },
    card: {
        backgroundColor: Theme.colors.surfaceElevated,
        marginHorizontal: 20,
        borderRadius: Theme.radius.xl,
        padding: 28,
        ...Theme.elevation.lg,
    },
    phoneRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 8,
    },
    phonePrefix: {
        backgroundColor: Theme.colors.surface,
        borderRadius: Theme.radius.md,
        borderWidth: 1.5,
        borderColor: Theme.colors.borderStrong,
        paddingHorizontal: 14,
        height: 56,
        justifyContent: 'center',
        marginTop: 0,
    },
    phonePrefixText: {
        ...T.body,
        color: Theme.colors.textSecondary,
        fontFamily: 'Poppins_600SemiBold',
    },
    loginRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 28,
    },
    loginText: { ...T.body, color: Theme.colors.textSecondary },
    loginLink: { ...T.body, fontFamily: 'Poppins_600SemiBold', color: Theme.colors.primary },
});
