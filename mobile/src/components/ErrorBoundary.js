import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { AlertTriangle, RotateCcw } from 'lucide-react-native';
import { Theme, T } from '../theme';

/**
 * ErrorBoundary — Class component obrigatório para React Error Boundaries.
 *
 * Uso:
 * <ErrorBoundary>
 *   <App />
 * </ErrorBoundary>
 */
export class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        // Em produção: Sentry.captureException(error, { extra: errorInfo });
        console.error('[ErrorBoundary]', error, errorInfo);
    }

    handleReset = () => {
        this.setState({ hasError: false, error: null });
    };

    render() {
        if (this.state.hasError) {
            return (
                <View style={styles.container}>
                    <View style={styles.iconCircle}>
                        <AlertTriangle size={40} color={Theme.colors.primary} />
                    </View>
                    <Text style={styles.title}>Algo correu mal</Text>
                    <Text style={styles.subtitle}>
                        A nossa equipa já foi notificada.{'\n'}
                        Tenta novamente ou contacta-nos.
                    </Text>
                    <TouchableOpacity
                        style={styles.button}
                        onPress={this.handleReset}
                        accessibilityRole="button"
                        accessibilityLabel="Tentar novamente"
                    >
                        <RotateCcw size={18} color={Theme.colors.textInverse} />
                        <Text style={styles.buttonText}>Tentar novamente</Text>
                    </TouchableOpacity>
                </View>
            );
        }

        return this.props.children;
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Theme.colors.background,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 40,
    },
    iconCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: Theme.colors.primaryGhost,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
    },
    title: {
        ...T.h2,
        textAlign: 'center',
        marginBottom: 12,
    },
    subtitle: {
        ...T.body,
        color: Theme.colors.textSecondary,
        textAlign: 'center',
        marginBottom: 32,
    },
    button: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: Theme.colors.primary,
        paddingHorizontal: 28,
        paddingVertical: 14,
        borderRadius: Theme.radius.full,
    },
    buttonText: {
        ...T.button,
        color: Theme.colors.textInverse,
    },
});
