import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { ChevronLeft, CheckCircle, Package, Truck, Home } from 'lucide-react-native';
import { Theme, T } from '../theme';

export const OrderTrackingScreen = () => {
    const navigation = useNavigation();
    const route = useRoute();
    const { orderId } = route.params || { orderId: 'ORD-12345' };

    const steps = [
        { id: 1, title: 'Pedido Confirmado', time: '10:00', icon: CheckCircle, completed: true },
        { id: 2, title: 'Em Preparação', time: '10:15', icon: Package, completed: true },
        { id: 3, title: 'A Caminho', time: '11:30', icon: Truck, completed: false },
        { id: 4, title: 'Entregue', time: '--:--', icon: Home, completed: false },
    ];

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} accessibilityLabel="Voltar">
                    <ChevronLeft size={22} color={Theme.colors.primary} />
                </TouchableOpacity>
                <Text style={styles.title}>Rastreio</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.orderMeta}>
                    <Text style={styles.orderIdTitle}>Encomenda #{orderId}</Text>
                    <Text style={styles.orderEta}>Entrega Estimada: Hoje, 12:00</Text>
                </View>

                <View style={styles.timeline}>
                    {steps.map((step, index) => {
                        const Icon = step.icon;
                        const isLast = index === steps.length - 1;
                        return (
                            <View key={step.id} style={styles.stepContainer}>
                                <View style={styles.stepLeft}>
                                    <View style={[styles.iconBox, step.completed ? styles.iconBoxActive : styles.iconBoxInactive]}>
                                        <Icon size={18} color={step.completed ? Theme.colors.white : Theme.colors.textTertiary} />
                                    </View>
                                    {!isLast ? <View style={[styles.line, step.completed ? styles.lineActive : styles.lineInactive]} /> : null}
                                </View>
                                <View style={styles.stepRight}>
                                    <View style={styles.stepInfo}>
                                        <Text style={[styles.stepTitle, step.completed ? styles.stepTitleActive : null]}>{step.title}</Text>
                                        <Text style={styles.stepTime}>{step.time}</Text>
                                    </View>
                                    {step.id === 3 && !step.completed ? (
                                        <Text style={styles.stepDesc}>O estafeta está a caminho do destino.</Text>
                                    ) : null}
                                </View>
                            </View>
                        );
                    })}
                </View>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Theme.colors.background },
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingTop: 56, paddingHorizontal: 20, paddingBottom: 14,
        backgroundColor: Theme.colors.surfaceElevated, borderBottomWidth: 1, borderBottomColor: Theme.colors.border,
    },
    backBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: Theme.colors.surface, justifyContent: 'center', alignItems: 'center' },
    title: { ...T.h3, color: Theme.colors.primary },
    content: { padding: 20 },
    orderMeta: {
        backgroundColor: Theme.colors.surfaceElevated, padding: 20, borderRadius: Theme.radius.lg,
        marginBottom: 24, ...Theme.elevation.sm, alignItems: 'center',
    },
    orderIdTitle: { fontFamily: 'Merriweather_700Bold', fontSize: 18, color: Theme.colors.textPrimary, marginBottom: 4 },
    orderEta: { ...T.body, color: Theme.colors.primary, fontFamily: 'Poppins_600SemiBold', fontSize: 14 },
    timeline: { paddingLeft: 8 },
    stepContainer: { flexDirection: 'row', minHeight: 80 },
    stepLeft: { alignItems: 'center', width: 40, marginRight: 16 },
    iconBox: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
    iconBoxActive: { backgroundColor: Theme.colors.primary },
    iconBoxInactive: { backgroundColor: Theme.colors.border },
    line: { width: 2, flex: 1, marginVertical: 4 },
    lineActive: { backgroundColor: Theme.colors.primary },
    lineInactive: { backgroundColor: Theme.colors.border },
    stepRight: { flex: 1, paddingTop: 8 },
    stepInfo: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    stepTitle: { ...T.body, fontFamily: 'Poppins_500Medium', color: Theme.colors.textTertiary },
    stepTitleActive: { color: Theme.colors.textPrimary, fontFamily: 'Poppins_600SemiBold' },
    stepTime: { ...T.bodySmall },
    stepDesc: { ...T.bodySmall, fontStyle: 'italic', marginTop: 4 },
});
