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
import { Theme } from '../theme';
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
                        <UserPlus size={40} color={Theme.colors.secondary} />
                    </View>
                    <Text style={styles.title}>Crie sua conta</Text>
                    <Text style={styles.subtitle}>Junte-se à Puculuxa e peça seus doces favoritos com facilidade.</Text>
                </View>

                <View style={styles.form}>
                    <View style={styles.inputContainer}>
                        <User size={20} color={Theme.colors.textSecondary} style={styles.inputIcon} />
                        <TextInput
                            style={styles.input}
                            placeholder="Nome Completo"
                            value={name}
                            onChangeText={setName}
                        />
                    </View>

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
                        onPress={handleRegister}
                        disabled={loading}
                    >
                        <LinearGradient
                            colors={[Theme.colors.secondary, Theme.colors.accent]}
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
        color: Theme.colors.secondary,
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
        color: Theme.colors.secondary,
        fontWeight: 'bold',
    },
});
