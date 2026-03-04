import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, Animated, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TOKENS, textStyles, Theme } from '../../theme';

// --- A) Screen ---
export const Screen = ({ children, scroll = false, style, contentContainerStyle }) => {
    const Container = scroll ? ScrollView : View;
    return (
        <SafeAreaView style={[styles.screen, style]}>
            <Container contentContainerStyle={[scroll && styles.scrollContent, contentContainerStyle]}>
                {children}
            </Container>
        </SafeAreaView>
    );
};

// --- B) TopHeader ---
export const TopHeader = ({ title, subtitle, rightAction, style }) => {
    return (
        <View style={[styles.topHeader, style]}>
            <View style={styles.headerTextContainer}>
                {title && <Text style={styles.headerTitle}>{title}</Text>}
                {subtitle && <Text style={styles.headerSubtitle}>{subtitle}</Text>}
            </View>
            {rightAction && <View style={styles.headerRight}>{rightAction}</View>}
        </View>
    );
};

// --- C) LedgerCard ---
export const LedgerCard = ({ children, style }) => {
    return (
        <View style={[styles.ledgerCardContainer, style]}>
            {/* Fake bottom layer for "stack" feel */}
            <View style={styles.ledgerCardShadowLayer} />
            <View style={styles.ledgerCard}>
                {children}
            </View>
        </View>
    );
};

// --- D) StatusBadge ---
const STATUS_MAP = {
    UNPAID: { bg: TOKENS.colors.surface2, text: TOKENS.colors.muted },
    PAID: { bg: `${TOKENS.colors.success}15`, text: TOKENS.colors.success },
    IN_CREDIT: { bg: `${TOKENS.colors.gold}15`, text: TOKENS.colors.gold },
    OVERDUE: { bg: `${TOKENS.colors.danger}15`, text: TOKENS.colors.danger },
};

export const StatusBadge = ({ status, label, icon: Icon, style }) => {
    const config = STATUS_MAP[status] || STATUS_MAP.UNPAID;
    
    return (
        <View style={[styles.badge, { backgroundColor: config.bg }, style]}>
            {Icon && <Icon size={12} color={config.text} style={{ marginRight: 4 }} />}
            <Text style={[styles.badgeText, { color: config.text }]}>
                {label || status}
            </Text>
        </View>
    );
};

// --- E) KpiRow ---
export const KpiRow = ({ label, value, helper, tone = 'default', style }) => {
    const valueColor = tone === 'gold' ? TOKENS.colors.gold : 
                       tone === 'danger' ? TOKENS.colors.danger : 
                       tone === 'success' ? TOKENS.colors.success : 
                       TOKENS.colors.text;

    return (
        <View style={[styles.kpiRow, style]}>
            <View style={styles.kpiLabelContainer}>
                <Text style={styles.kpiLabel}>{label}</Text>
                {helper && <Text style={styles.kpiHelper}>{helper}</Text>}
            </View>
            <Text style={[styles.kpiValue, { color: valueColor }]}>{value}</Text>
        </View>
    );
};

// --- F) States ---
export const EmptyState = ({ title, subtitle, actionTitle, onAction, style }) => (
    <View style={[styles.stateContainer, style]}>
        <Text style={styles.stateTitle}>{title}</Text>
        {subtitle && <Text style={styles.stateSubtitle}>{subtitle}</Text>}
        {actionTitle && onAction && (
            <GhostButton title={actionTitle} onPress={onAction} style={{ marginTop: TOKENS.spacing[4] }} />
        )}
    </View>
);

export const ErrorState = ({ title = 'Ocorreu um erro', subtitle, actionTitle, onAction, style }) => (
    <View style={[styles.stateContainer, style]}>
        <Text style={[styles.stateTitle, { color: TOKENS.colors.danger }]}>{title}</Text>
        {subtitle && <Text style={styles.stateSubtitle}>{subtitle}</Text>}
        {actionTitle && onAction && (
            <SecondaryButton title={actionTitle} onPress={onAction} style={{ marginTop: TOKENS.spacing[4] }} />
        )}
    </View>
);

export const LoadingState = ({ title = 'A carregar...', style }) => {
    const fadeAnim = useRef(new Animated.Value(0.35)).current;

    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(fadeAnim, { toValue: 0.6, duration: 800, useNativeDriver: true }),
                Animated.timing(fadeAnim, { toValue: 0.35, duration: 800, useNativeDriver: true })
            ])
        ).start();
    }, [fadeAnim]);

    return (
        <View style={[styles.stateContainer, style]}>
            <Animated.View style={{ opacity: fadeAnim, alignItems: 'center' }}>
                <ActivityIndicator size="large" color={TOKENS.colors.gold} />
                {title && <Text style={[styles.stateSubtitle, { marginTop: TOKENS.spacing[4] }]}>{title}</Text>}
            </Animated.View>
        </View>
    );
};

// --- G) Re-export Buttons ---
import { PremiumButton } from '../ui/PremiumButton';
export { PremiumButton };
export const PrimaryButton = (props) => <PremiumButton variant="primary" {...props} />;
export const SecondaryButton = (props) => <PremiumButton variant="secondary" {...props} />;
export const GhostButton = (props) => <PremiumButton variant="ghost" {...props} />;

import { FadeInView } from '../motion/FadeInView';
export { FadeInView };

const styles = StyleSheet.create({
    screen: {
        flex: 1,
        backgroundColor: TOKENS.colors.background,
    },
    scrollContent: {
        paddingHorizontal: TOKENS.spacing[4],
        paddingBottom: TOKENS.spacing[10],
        flexGrow: 1,
    },
    topHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        paddingHorizontal: TOKENS.spacing[4],
        paddingVertical: TOKENS.spacing[6],
    },
    headerTextContainer: {
        flex: 1,
    },
    headerTitle: {
        ...textStyles.h1,
        marginBottom: TOKENS.spacing[1],
        marginLeft: -2, 
    },
    headerSubtitle: {
        ...textStyles.small,
        color: TOKENS.colors.muted,
        marginLeft: TOKENS.spacing[1], 
    },
    headerRight: {
        marginLeft: TOKENS.spacing[4],
        justifyContent: 'center',
    },
    ledgerCardContainer: {
        marginVertical: TOKENS.spacing[2],
        position: 'relative',
    },
    ledgerCardShadowLayer: {
        position: 'absolute',
        top: 4,
        left: 4,
        right: -4,
        bottom: -4,
        backgroundColor: TOKENS.colors.surface2,
        opacity: 0.6,
        borderColor: TOKENS.colors.border,
        borderWidth: 1,
        borderRadius: TOKENS.radius.card,
        zIndex: 0,
    },
    ledgerCard: {
        backgroundColor: TOKENS.colors.surface,
        borderColor: TOKENS.colors.border,
        borderWidth: 1,
        borderRadius: TOKENS.radius.card,
        padding: TOKENS.spacing[4],
        zIndex: 1,
        ...TOKENS.shadowElite,
    },
    badge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: TOKENS.spacing[3],
        paddingVertical: TOKENS.spacing[1],
        borderRadius: TOKENS.radius.pill,
        alignSelf: 'flex-start',
    },
    badgeText: {
        ...textStyles.caption,
    },
    kpiRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: TOKENS.spacing[2],
    },
    kpiLabelContainer: {
        flex: 1,
        paddingRight: TOKENS.spacing[4],
    },
    kpiLabel: {
        ...textStyles.body,
        color: TOKENS.colors.muted,
    },
    kpiHelper: {
        ...textStyles.small,
        color: TOKENS.colors.textTertiary,
        marginTop: 2,
    },
    kpiValue: {
        ...textStyles.h3,
    },
    stateContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: TOKENS.spacing[6],
        minHeight: 200,
    },
    stateTitle: {
        ...textStyles.h3,
        color: TOKENS.colors.text,
        textAlign: 'center',
        marginBottom: TOKENS.spacing[2],
    },
    stateSubtitle: {
        ...textStyles.body,
        color: TOKENS.colors.muted,
        textAlign: 'center',
    },
});
