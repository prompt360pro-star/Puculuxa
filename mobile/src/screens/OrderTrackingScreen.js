import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Animated, Platform } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { ArrowLeft, CheckCircle, Package, Truck, Home } from 'lucide-react-native';
import { Theme } from '../theme';

export const OrderTrackingScreen = () => {
    const navigation = useNavigation();
    const route = useRoute();
    const { orderId } = route.params || { orderId: 'ORD-12345' };

    // Simple visual steps
    const steps = [
        { id: 1, title: 'Pedido Confirmado', time: '10:00', icon: CheckCircle, completed: true },
        { id: 2, title: 'Em Preparação', time: '10:15', icon: Package, completed: true },
        { id: 3, title: 'A Caminho', time: '11:30', icon: Truck, completed: false },
        { id: 4, title: 'Entregue', time: '--:--', icon: Home, completed: false },
    ];

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <ArrowLeft size={22} color={Theme.colors.primary} />
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
                                        <Icon size={20} color={step.completed ? 'white' : Theme.colors.textSecondary} />
                                    </View>
                                    {!isLast && (
                                        <View style={[styles.line, step.completed ? styles.lineActive : styles.lineInactive]} />
                                    )}
                                </View>
                                <View style={styles.stepRight}>
                                    <View style={styles.stepInfo}>
                                        <Text style={[styles.stepTitle, step.completed && styles.stepTitleActive]}>{step.title}</Text>
                                        <Text style={styles.stepTime}>{step.time}</Text>
                                    </View>
                                    {step.id === 3 && !step.completed && (
                                        <Text style={styles.stepDesc}>O estafeta está perto do destino.</Text>
                                    )}
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
        paddingTop: 60, paddingHorizontal: 24, paddingBottom: 16,
        backgroundColor: 'white', ...Theme.shadows?.light
    },
    backBtn: {
        width: 40, height: 40, borderRadius: 12, backgroundColor: '#f5f5f5',
        justifyContent: 'center', alignItems: 'center',
    },
    title: { fontSize: 18, fontWeight: 'bold', color: Theme.colors.primary },
    content: { padding: 24 },
    orderMeta: {
        backgroundColor: 'white', padding: 20, borderRadius: 16, marginBottom: 24,
        ...Theme.shadows?.light, alignItems: 'center'
    },
    orderIdTitle: { fontSize: 20, fontWeight: 'bold', color: '#333', marginBottom: 4 },
    orderEta: { fontSize: 14, color: Theme.colors.primary, fontWeight: '600' },
    timeline: { paddingLeft: 8 },
    stepContainer: { flexDirection: 'row', minHeight: 80 },
    stepLeft: { alignItems: 'center', width: 40, marginRight: 16 },
    iconBox: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
    iconBoxActive: { backgroundColor: Theme.colors.primary },
    iconBoxInactive: { backgroundColor: '#e0e0e0' },
    line: { width: 2, flex: 1, marginVertical: 4 },
    lineActive: { backgroundColor: Theme.colors.primary },
    lineInactive: { backgroundColor: '#e0e0e0' },
    stepRight: { flex: 1, paddingTop: 8 },
    stepInfo: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    stepTitle: { fontSize: 16, fontWeight: '600', color: Theme.colors.textSecondary },
    stepTitleActive: { color: '#333', fontWeight: 'bold' },
    stepTime: { fontSize: 14, color: Theme.colors.textSecondary },
    stepDesc: { fontSize: 13, color: '#666', marginTop: 4, fontStyle: 'italic' }
});
