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
import { LogIn, Mail, Lock, ArrowRight } from 'lucide-react-native';
import { Theme } from '../theme';
import { useAuthStore } from '../store/authStore';

export default function LoginScreen({ navigation }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const { login, loading } = useAuthStore();

    const handleLogin = async () => {
        if (!email || !password) {
            Alert.alert('Erro', 'Por favor, preencha todos os campos.');
            return;
        }

        try {
            await login(email, password);
            // O estado global será atualizado e a navegação deve reagir no App.js
        } catch (error) {
            Alert.alert('Erro de Login', error.message || 'Verifique suas credenciais.');
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
                        <LogIn size={40} color={Theme.colors.primary} />
                    </View>
                    <Text style={styles.title}>Bem-vindo de volta!</Text>
                    <Text style={styles.subtitle}>Acesse sua conta para gerenciar seus pedidos e orçamentos.</Text>
                </View>

                <View style={styles.form}>
                    <View style={styles.inputContainer}>
                        <Mail size={20} color={Theme.colors.textSecondary} style={styles.inputIcon} />
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
                        <Lock size={20} color={Theme.colors.textSecondary} style={styles.inputIcon} />
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
                        onPress={handleLogin}
                        disabled={loading}
                    >
                        <LinearGradient
                            colors={[Theme.colors.primary, Theme.colors.secondary]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.gradient}
                        >
                            {loading ? (
                                <ActivityIndicator color="#FFF" />
                            ) : (
                                <View style={styles.buttonContent}>
                                    <Text style={styles.buttonText}>Entrar</Text>
                                    <ArrowRight size={20} color="#FFF" />
                                </View>
                            )}
                        </LinearGradient>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.registerLink}
                        onPress={() => navigation.navigate('Register')}
                    >
                        <Text style={styles.registerText}>
                            Não tem uma conta? <Text style={styles.registerTextBold}>Cadastre-se</Text>
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
        backgroundColor: Theme.colors.background,
    },
    scrollContent: {
        flexGrow: 1,
        padding: Theme.spacing.xl,
        justifyContent: 'center',
    },
    header: {
        alignItems: 'center',
        marginBottom: Theme.spacing.huge,
    },
    logoCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: 'white',
        justifyContent: 'center',
        alignItems: 'center',
        ...Theme.shadows.light,
        marginBottom: Theme.spacing.lg,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: Theme.colors.primary,
        marginBottom: Theme.spacing.xs,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 16,
        color: Theme.colors.textSecondary,
        textAlign: 'center',
        paddingHorizontal: Theme.spacing.lg,
    },
    form: {
        width: '100%',
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'white',
        borderRadius: Theme.radius.md,
        marginBottom: Theme.spacing.lg,
        paddingHorizontal: Theme.spacing.md,
        height: 55,
        ...Theme.shadows.light,
    },
    inputIcon: {
        marginRight: Theme.spacing.md,
    },
    input: {
        flex: 1,
        fontSize: 16,
        color: Theme.colors.textPrimary,
    },
    button: {
        marginTop: Theme.spacing.md,
        borderRadius: Theme.radius.md,
        overflow: 'hidden',
        ...Theme.shadows.medium,
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
        marginRight: Theme.spacing.sm,
    },
    registerLink: {
        marginTop: Theme.spacing.xl,
        alignItems: 'center',
    },
    registerText: {
        fontSize: 15,
        color: Theme.colors.textSecondary,
    },
    registerTextBold: {
        color: Theme.colors.primary,
        fontWeight: 'bold',
    },
});
