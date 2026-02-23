import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Alert,
    ActivityIndicator
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { UserPlus, Mail, Lock, User, ArrowRight } from 'lucide-react-native';
import { COLORS, SPACING, RADIUS, SHADOWS } from '../theme/tokens';
import { useAuthStore } from '../store/authStore';

export default function RegisterScreen({ navigation }) {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const { register, login, loading } = useAuthStore();

    const handleRegister = async () => {
        if (!name || !email || !password) {
            Alert.alert('Erro', 'Por favor, preencha todos os campos.');
            return;
        }

        try {
            await register({ name, email, password });
            Alert.alert('Sucesso', 'Conta criada com sucesso! Fazendo login...', [
                { text: 'OK', onPress: () => login(email, password) }
            ]);
        } catch (error) {
            Alert.alert('Erro no Cadastro', error.message || 'Não foi possível criar a conta.');
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
        >
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.header}>
                    <View style={styles.logoCircle}>
                        <UserPlus size={40} color={COLORS.secondary} />
                    </View>
                    <Text style={styles.title}>Crie sua conta</Text>
                    <Text style={styles.subtitle}>Junte-se à Puculuxa e peça seus doces favoritos com facilidade.</Text>
                </View>

                <View style={styles.form}>
                    <View style={styles.inputContainer}>
                        <User size={20} color={COLORS.textSecondary} style={styles.inputIcon} />
                        <TextInput
                            style={styles.input}
                            placeholder="Nome Completo"
                            value={name}
                            onChangeText={setName}
                        />
                    </View>

                    <View style={styles.inputContainer}>
                        <Mail size={20} color={COLORS.textSecondary} style={styles.inputIcon} />
                        <TextInput
                            style={styles.input}
                            placeholder="E-mail"
                            value={email}
                            onChangeText={setEmail}
                            keyboardType="email-address"
                            autoCapitalize="none"
                        />
                    </View>

                    <View style={styles.inputContainer}>
                        <Lock size={20} color={COLORS.textSecondary} style={styles.inputIcon} />
                        <TextInput
                            style={styles.input}
                            placeholder="Senha"
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry
                        />
                    </View>

                    <TouchableOpacity
                        style={styles.button}
                        onPress={handleRegister}
                        disabled={loading}
                    >
                        <LinearGradient
                            colors={[COLORS.secondary, COLORS.accent]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.gradient}
                        >
                            {loading ? (
                                <ActivityIndicator color="#FFF" />
                            ) : (
                                <View style={styles.buttonContent}>
                                    <Text style={styles.buttonText}>Cadastrar</Text>
                                    <ArrowRight size={20} color="#FFF" />
                                </View>
                            )}
                        </LinearGradient>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.registerLink}
                        onPress={() => navigation.goBack()}
                    >
                        <Text style={styles.registerText}>
                            Já tem uma conta? <Text style={styles.registerTextBold}>Faça Login</Text>
                        </Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    scrollContent: {
        flexGrow: 1,
        padding: SPACING.xl,
        justifyContent: 'center',
    },
    header: {
        alignItems: 'center',
        marginBottom: SPACING.huge,
    },
    logoCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: COLORS.white,
        justifyContent: 'center',
        alignItems: 'center',
        ...SHADOWS.light,
        marginBottom: SPACING.lg,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: COLORS.secondary,
        marginBottom: SPACING.xs,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 16,
        color: COLORS.textSecondary,
        textAlign: 'center',
        paddingHorizontal: SPACING.lg,
    },
    form: {
        width: '100%',
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.white,
        borderRadius: RADIUS.md,
        marginBottom: SPACING.lg,
        paddingHorizontal: SPACING.md,
        height: 55,
        ...SHADOWS.light,
    },
    inputIcon: {
        marginRight: SPACING.md,
    },
    input: {
        flex: 1,
        fontSize: 16,
        color: COLORS.textPrimary,
    },
    button: {
        marginTop: SPACING.md,
        borderRadius: RADIUS.md,
        overflow: 'hidden',
        ...SHADOWS.medium,
    },
    gradient: {
        height: 55,
        justifyContent: 'center',
        alignItems: 'center',
    },
    buttonContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    buttonText: {
        color: '#FFF',
        fontSize: 18,
        fontWeight: 'bold',
        marginRight: SPACING.sm,
    },
    registerLink: {
        marginTop: SPACING.xl,
        alignItems: 'center',
    },
    registerText: {
        fontSize: 15,
        color: COLORS.textSecondary,
    },
    registerTextBold: {
        color: COLORS.secondary,
        fontWeight: 'bold',
    },
});
