import React, { useState, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform, KeyboardAvoidingView, Image, Linking } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Calendar, Users, Cake, CheckCircle, Send, Plus, Minus } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { TOKENS, Theme, textStyles } from '../theme';
import { ApiService } from '../services/api';
import { BRAND } from '../config/brand';
import { useAuthStore } from '../store/authStore';
import { Screen, TopHeader, LedgerCard, PremiumButton, PrimaryButton, SecondaryButton, GhostButton, FadeInView } from '../components/base/BaseComponents';
import { hapticMedium, hapticSuccess, hapticError } from '../utils/haptics';
import { PremiumInput } from '../components/ui/PremiumInput';
import { formatKz, formatDateAO } from '../utils/errorMessages';
import { enqueueQuotation } from '../utils/offlineQueue';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

// --- Configs (Business Logic Unchanged) ---
const EVENT_TYPES = [
    { id: 'aniversario', label: 'Aniversário', icon: '🎂', color: '#FFE0B2' },
    { id: 'casamento', label: 'Casamento', icon: '💒', color: '#F8BBD0' },
    { id: 'corporativo', label: 'Corporativo', icon: '🏢', color: '#BBDEFB' },
    { id: 'baptizado', label: 'Baptizado', icon: '⛪', color: '#C8E6C9' },
    { id: 'bodas', label: 'Bodas', icon: '💍', color: '#E1BEE7' },
    { id: 'baby_shower', label: 'Baby Shower', icon: '👶', color: '#B3E5FC' },
    { id: 'graduacao', label: 'Graduação', icon: '🎓', color: '#D1C4E9' },
    { id: 'outro', label: 'Outro', icon: '📋', color: '#CFD8DC' },
];

const COMPLEMENTS = [
    { id: 'cupcakes', label: 'Cupcakes Decorados', price: 1500, type: 'PER_UNIT', icon: '🧁' },
    { id: 'docinhos', label: 'Mesa de Docinhos', price: 800, type: 'PER_GUEST', icon: '🍬' },
    { id: 'salgados', label: 'Salgados Premium', price: 900, type: 'PER_GUEST', icon: '🥟' },
    { id: 'drinks', label: 'Serviço de Bebidas', price: 1000, type: 'PER_GUEST', icon: '🍹' },
    { id: 'decoration', label: 'Decoração Temática', price: 25000, type: 'FIXED', icon: '🎈' },
    { id: 'coffee_break', label: 'Coffee Break', price: 1200, type: 'PER_GUEST', icon: '☕' },
    { id: 'lembrancinhas', label: 'Lembrancinhas', price: 500, type: 'PER_GUEST', icon: '🎁' },
];

const BASE_PRICE_PER_GUEST = {
    casamento: 2500, aniversario: 2000, corporativo: 3000, baptizado: 1800,
    bodas: 2200, baby_shower: 1500, graduacao: 1800, outro: 2000,
};

const SUGGESTIONS = {
    casamento: ['cupcakes', 'docinhos', 'drinks', 'decoration'],
    aniversario: ['cupcakes', 'docinhos'],
    corporativo: ['coffee_break', 'salgados', 'drinks'],
    baptizado: ['docinhos', 'lembrancinhas'],
    bodas: ['cupcakes', 'docinhos', 'drinks'],
    baby_shower: ['cupcakes', 'docinhos', 'lembrancinhas'],
    graduacao: ['salgados', 'drinks'],
    outro: ['docinhos'],
};

// --- Components ---
const StepIndicator = ({ current, total }) => (
    <View style={si.container}>
        {Array.from({ length: total }, (_, i) => {
            const isCompleted = i < current;
            const isCurrent = i === current;
            return (
                <React.Fragment key={i}>
                    <View style={[si.dot, isCompleted && si.dotDone, isCurrent && si.dotCurrent]}>
                        {isCompleted ? <CheckCircle size={14} color={TOKENS.colors.background} /> : <Text style={[si.dotText, isCurrent && { color: TOKENS.colors.background }]}>{i + 1}</Text>}
                    </View>
                    {i < total - 1 && <View style={[si.line, isCompleted && si.lineDone]} />}
                </React.Fragment>
            );
        })}
    </View>
);

const si = StyleSheet.create({
    container: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: TOKENS.spacing[6] },
    dot: { width: 28, height: 28, borderRadius: 14, backgroundColor: TOKENS.colors.surface2, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: TOKENS.colors.border },
    dotCurrent: { backgroundColor: TOKENS.colors.text, borderColor: TOKENS.colors.text },
    dotDone: { backgroundColor: TOKENS.colors.gold, borderColor: TOKENS.colors.gold },
    dotText: { ...textStyles.bodyBold, fontSize: 12, color: TOKENS.colors.muted },
    line: { width: 40, height: 2, backgroundColor: TOKENS.colors.surface2 },
    lineDone: { backgroundColor: TOKENS.colors.gold },
});

const EventCard = React.memo(({ item, selected, onPress }) => (
    <TouchableOpacity
        style={[ec.card, selected && ec.selected]}
        onPress={onPress}
        activeOpacity={0.9}
        accessibilityRole="radio"
        accessibilityLabel={item.label}
        accessibilityState={{ selected }}
    >
        <Text style={ec.icon}>{item.icon}</Text>
        <Text style={ec.label}>{item.label}</Text>
        {selected && <View style={ec.check}><CheckCircle size={16} color={TOKENS.colors.background} /></View>}
    </TouchableOpacity>
));

const ec = StyleSheet.create({
    card: { width: '47%', aspectRatio: 1.1, borderRadius: TOKENS.radius.card, padding: TOKENS.spacing[4], justifyContent: 'center', alignItems: 'center', backgroundColor: TOKENS.colors.surface, borderWidth: 1, borderColor: TOKENS.colors.border },
    selected: { borderColor: TOKENS.colors.gold, backgroundColor: `${TOKENS.colors.gold}15` }, // Subtle gold tint
    icon: { fontSize: 32, marginBottom: TOKENS.spacing[2] },
    label: { ...textStyles.bodyMedium, color: TOKENS.colors.text, textAlign: 'center' },
    check: { position: 'absolute', top: 8, right: 8, width: 24, height: 24, borderRadius: 12, backgroundColor: TOKENS.colors.gold, justifyContent: 'center', alignItems: 'center' },
});

const ComplementChip = React.memo(({ item, selected, suggested, onPress }) => (
    <TouchableOpacity
        style={[cc.chip, selected && cc.chipSelected]}
        onPress={onPress}
        activeOpacity={0.9}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: selected }}
    >
        <Text style={cc.icon}>{item.icon}</Text>
        <View style={cc.textWrap}>
            <Text style={[cc.label, selected && cc.labelSelected]}>{item.label}</Text>
            <Text style={cc.price}>{formatKz(item.price)} <Text style={cc.priceSuffix}>({item.type === 'PER_GUEST' ? 'por pessoa' : item.type === 'PER_UNIT' ? 'unidade' : 'fixo'})</Text></Text>
        </View>
        {suggested && !selected && <View style={cc.badge}><Text style={cc.badgeText}>Sugerido</Text></View>}
        {selected && <CheckCircle size={20} color={TOKENS.colors.gold} />}
    </TouchableOpacity>
));

const cc = StyleSheet.create({
    chip: { flexDirection: 'row', alignItems: 'center', gap: TOKENS.spacing[3], padding: TOKENS.spacing[4], borderRadius: TOKENS.radius.card, backgroundColor: TOKENS.colors.surface, borderWidth: 1, borderColor: TOKENS.colors.border, marginBottom: TOKENS.spacing[3] },
    chipSelected: { borderColor: TOKENS.colors.gold, backgroundColor: `${TOKENS.colors.gold}10` },
    icon: { fontSize: 24 },
    textWrap: { flex: 1 },
    label: { ...textStyles.bodyMedium, color: TOKENS.colors.text },
    labelSelected: { color: TOKENS.colors.gold },
    price: { ...textStyles.small, color: TOKENS.colors.textTertiary, marginTop: TOKENS.spacing[1] },
    priceSuffix: { ...textStyles.caption, color: TOKENS.colors.muted },
    badge: { backgroundColor: `${TOKENS.colors.primary}20`, paddingHorizontal: TOKENS.spacing[2], paddingVertical: 2, borderRadius: TOKENS.radius.pill },
    badgeText: { ...textStyles.caption, color: TOKENS.colors.primary },
});

// --- Main Wizard ---
export const QuotationWizard = () => {
    const navigation = useNavigation();
    const { user } = useAuthStore();
    const { show } = useToastStore();

    const [step, setStep] = useState(0);
    const [loading, setLoading] = useState(false);
    
    // Form State
    const [eventType, setEventType] = useState('');
    const [guestCount, setGuestCount] = useState(50);
    const [eventDate, setEventDate] = useState(new Date(Date.now() + 7 * 86400000));
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [selectedComplements, setSelectedComplements] = useState([]);
    const [notes, setNotes] = useState('');
    const [customerName, setCustomerName] = useState(user?.name || '');
    const [customerPhone, setCustomerPhone] = useState(user?.phone || '');
    const [imageUri, setImageUri] = useState(null);

    // Pricing Calculation
    const pricing = useMemo(() => {
        const basePerGuest = BASE_PRICE_PER_GUEST[eventType] || 2000;
        const base = basePerGuest * guestCount;
        const complementsTotal = selectedComplements.reduce((sum, id) => {
            const c = COMPLEMENTS.find(x => x.id === id);
            if (!c) return sum;
            if (c.type === 'PER_GUEST') return sum + c.price * guestCount;
            if (c.type === 'FIXED') return sum + c.price;
            return sum + c.price;
        }, 0);
        const subtotal = base + complementsTotal;
        const tax = Math.round(subtotal * 0.05);
        const total = subtotal + tax;
        const confidence = notes.length > 50 ? 90 : notes.length > 0 ? 85 : 75;
        return { base, complementsTotal, subtotal, tax, total, confidence };
    }, [eventType, guestCount, selectedComplements, notes]);

    const suggestions = SUGGESTIONS[eventType] || [];

    const toggleComplement = useCallback((id) => {
        setSelectedComplements(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    }, []);

    const adjustGuests = useCallback((delta) => {
        setGuestCount(prev => Math.max(10, Math.min(500, prev + delta)));
    }, []);

    const goNext = () => { if (step < 3) setStep(step + 1); };
    const goBack = () => { if (step > 0) setStep(step - 1); else if (navigation.canGoBack()) navigation.goBack(); };

    const pickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.8 });
        if (!result.canceled) setImageUri(result.assets[0].uri);
    };

    const handleSubmit = async () => {
        hapticMedium();
        if (!customerName.trim() || !customerPhone.trim()) {
            hapticError();
            show({ type: 'warning', message: 'Preenche o nome e telefone.' });
            return;
        }
        setLoading(true);
        const payload = {
            eventType,
            guestCount,
            date: eventDate.toISOString(),
            description: notes || undefined,
            complements: selectedComplements.map(id => {
                const c = COMPLEMENTS.find(x => x.id === id);
                return c ? { name: c.label, type: c.type, unitPrice: c.price, quantity: c.type === 'PER_GUEST' ? guestCount : 1 } : null;
            }).filter(Boolean),
            customerName: customerName.trim(),
            customerPhone: customerPhone.trim(),
        };

        try {
            if (imageUri) {
                try { await ApiService.uploadQuotationImage(imageUri); } catch { }
            }
            await ApiService.postQuotation(payload);
            hapticSuccess();
            show({ type: 'success', message: 'Orçamento enviado! Entraremos em contacto.' });
            if (navigation.canGoBack()) navigation.goBack();
        } catch (err) {
            await enqueueQuotation(payload);
            hapticMedium();
            show({ type: 'warning', message: 'Offline. O orçamento será enviado quando voltares a estar online.', duration: 5000 });
            if (navigation.canGoBack()) navigation.goBack();
        } finally {
            setLoading(false);
        }
    };

    const openWhatsApp = () => {
        const msg = `Olá Puculuxa! 🎂\n\nGostaria de um orçamento:\n• Evento: ${EVENT_TYPES.find(e => e.id === eventType)?.label || eventType}\n• Convidados: ${guestCount}\n• Data: ${formatDateAO(eventDate)}\n• Estimativa: ${formatKz(pricing.total)}\n\nObrigado(a)!`;
        Linking.openURL(`https://wa.me/${BRAND.whatsappPhone}?text=${encodeURIComponent(msg)}`);
    };

    const onDateChange = (event, date) => {
        setShowDatePicker(Platform.OS === 'ios');
        if (date) setEventDate(date);
    };

    // --- Steps Renderers ---
    const renderStep0 = () => (
        <FadeInView delay={0}>
            <View style={styles.stepContainer}>
                <Text style={textStyles.h2}>Que tipo de evento?</Text>
                <Text style={[textStyles.body, { color: TOKENS.colors.muted, marginBottom: TOKENS.spacing[6] }]}>Escolha a categoria principal da sua celebração</Text>
                
                <View style={styles.eventGrid}>
                    {EVENT_TYPES.map(et => (
                        <EventCard key={et.id} item={et} selected={eventType === et.id} onPress={() => setEventType(et.id)} />
                    ))}
                </View>

                <View style={styles.bottomActions}>
                    <PrimaryButton title="Continuar" onPress={goNext} disabled={!eventType} />
                </View>
            </View>
        </FadeInView>
    );

    const renderStep1 = () => (
        <FadeInView delay={0}>
            <View style={styles.stepContainer}>
                <Text style={textStyles.h2}>Detalhes Importantes</Text>
                <Text style={[textStyles.body, { color: TOKENS.colors.muted, marginBottom: TOKENS.spacing[6] }]}>Alguns dados para afinar o seu orçamento</Text>

                <LedgerCard style={{ marginBottom: TOKENS.spacing[6] }}>
                    <View style={styles.guestHeader}>
                        <Users size={20} color={TOKENS.colors.text} />
                        <Text style={textStyles.h3}>Número de Convidados</Text>
                    </View>
                    
                    <View style={styles.guestControl}>
                        <TouchableOpacity style={styles.guestBtn} onPress={() => adjustGuests(-10)}>
                            <Text style={styles.guestBtnText}>-10</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.guestBtn} onPress={() => adjustGuests(-1)}>
                            <Minus size={20} color={TOKENS.colors.textInverse} />
                        </TouchableOpacity>
                        
                        <Text style={styles.guestCount}>{guestCount}</Text>
                        
                        <TouchableOpacity style={styles.guestBtn} onPress={() => adjustGuests(1)}>
                            <Plus size={20} color={TOKENS.colors.textInverse} />
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.guestBtn} onPress={() => adjustGuests(10)}>
                            <Text style={styles.guestBtnText}>+10</Text>
                        </TouchableOpacity>
                    </View>
                </LedgerCard>

                <TouchableOpacity style={styles.dateButton} onPress={() => setShowDatePicker(true)}>
                    <Calendar size={24} color={TOKENS.colors.gold} />
                    <View style={{ flex: 1 }}>
                        <Text style={styles.dateLabel}>Data do Evento</Text>
                        <Text style={styles.dateValue}>{formatDateAO(eventDate)}</Text>
                    </View>
                </TouchableOpacity>

                {showDatePicker && (
                    <DateTimePicker
                        value={eventDate}
                        mode="date"
                        display={Platform.OS === 'ios' ? 'inline' : 'default'}
                        minimumDate={new Date(Date.now() + 86400000)}
                        onChange={onDateChange}
                    />
                )}

                <View style={{ marginBottom: TOKENS.spacing[6] }}>
                    <PremiumInput
                        label="Detalhes ou Temática"
                        value={notes}
                        onChangeText={setNotes}
                        placeholder="Descreva cores, temas ou pedidos especiais..."
                        multiline
                        numberOfLines={4}
                    />
                </View>

                <TouchableOpacity style={styles.imageButton} onPress={pickImage}>
                    {imageUri ? (
                        <Image source={{ uri: imageUri }} style={styles.refImage} />
                    ) : (
                        <View style={styles.imagePlaceholder}>
                            <Cake size={24} color={TOKENS.colors.muted} />
                            <Text style={[textStyles.small, { color: TOKENS.colors.muted, marginTop: TOKENS.spacing[2] }]}>Anexar imagem de inspiração (Opcional)</Text>
                        </View>
                    )}
                </TouchableOpacity>

                <View style={[styles.bottomActions, { flexDirection: 'row', gap: TOKENS.spacing[4] }]}>
                    <GhostButton title="Voltar" onPress={goBack} style={{ flex: 1 }} />
                    <PrimaryButton title="Continuar" onPress={goNext} style={{ flex: 2 }} />
                </View>
            </View>
        </FadeInView>
    );

    const renderStep2 = () => (
        <FadeInView delay={0}>
            <View style={styles.stepContainer}>
                <Text style={textStyles.h2}>Aperfeiçoe o menu</Text>
                <Text style={[textStyles.body, { color: TOKENS.colors.muted, marginBottom: TOKENS.spacing[6] }]}>Adicione complementos para enriquecer a festa</Text>

                {COMPLEMENTS.map(c => (
                    <ComplementChip
                        key={c.id}
                        item={c}
                        selected={selectedComplements.includes(c.id)}
                        suggested={suggestions.includes(c.id)}
                        onPress={() => toggleComplement(c.id)}
                    />
                ))}

                <View style={[styles.bottomActions, { flexDirection: 'row', gap: TOKENS.spacing[4], marginTop: TOKENS.spacing[6] }]}>
                    <GhostButton title="Voltar" onPress={goBack} style={{ flex: 1 }} />
                    <PrimaryButton title="Continuar" onPress={goNext} style={{ flex: 2 }} />
                </View>
            </View>
        </FadeInView>
    );

    const renderStep3 = () => (
        <FadeInView delay={0}>
            <View style={styles.stepContainer}>
                <Text style={textStyles.h2}>Resumo do Pedido</Text>
                <Text style={[textStyles.body, { color: TOKENS.colors.muted, marginBottom: TOKENS.spacing[6] }]}>Verifique se está tudo correto</Text>

                <LedgerCard style={{ marginBottom: TOKENS.spacing[8] }}>
                    <View style={styles.receiptRow}>
                        <Text style={styles.receiptLabel}>Evento</Text>
                        <Text style={styles.receiptValue}>{EVENT_TYPES.find(e => e.id === eventType)?.label || eventType}</Text>
                    </View>
                    <View style={styles.receiptRow}>
                        <Text style={styles.receiptLabel}>Convidados</Text>
                        <Text style={styles.receiptValue}>{guestCount}</Text>
                    </View>
                    <View style={styles.receiptRow}>
                        <Text style={styles.receiptLabel}>Data</Text>
                        <Text style={styles.receiptValue}>{formatDateAO(eventDate)}</Text>
                    </View>
                    {selectedComplements.length > 0 && (
                        <View style={styles.receiptRow}>
                            <Text style={styles.receiptLabel}>Complementos</Text>
                            <Text style={styles.receiptValue}>{selectedComplements.length} items</Text>
                        </View>
                    )}
                    
                    <View style={styles.divider} />
                    
                    <View style={styles.receiptRow}>
                        <Text style={styles.receiptLabel}>Base</Text>
                        <Text style={styles.receiptValue}>{formatKz(pricing.base)}</Text>
                    </View>
                    {pricing.complementsTotal > 0 && (
                        <View style={styles.receiptRow}>
                            <Text style={styles.receiptLabel}>Complementos</Text>
                            <Text style={styles.receiptValue}>{formatKz(pricing.complementsTotal)}</Text>
                        </View>
                    )}
                    <View style={styles.receiptRow}>
                        <Text style={styles.receiptLabel}>IVA (5%)</Text>
                        <Text style={styles.receiptValue}>{formatKz(pricing.tax)}</Text>
                    </View>
                    
                    <View style={styles.divider} />
                    
                    <View style={styles.receiptRow}>
                        <Text style={[textStyles.h3, { color: TOKENS.colors.text }]}>Estimativa Total</Text>
                        <Text style={Theme.typography.priceLarge}>{formatKz(pricing.total)}</Text>
                    </View>
                </LedgerCard>

                <Text style={[textStyles.h3, { marginBottom: TOKENS.spacing[4] }]}>Os teus dados</Text>
                <View style={{ gap: TOKENS.spacing[4], marginBottom: TOKENS.spacing[8] }}>
                    <PremiumInput label="Nome Completo" value={customerName} onChangeText={setCustomerName} placeholder="Como gosta de ser chamado" />
                    <PremiumInput label="Telefone" value={customerPhone} onChangeText={setCustomerPhone} placeholder="+244" keyboardType="phone-pad" />
                </View>

                <View style={{ gap: TOKENS.spacing[4] }}>
                    <PrimaryButton 
                        title="Enviar Pedido de Orçamento" 
                        onPress={handleSubmit} 
                        loading={loading} 
                        icon={<Send size={20} color={TOKENS.colors.background} />} 
                    />
                    <SecondaryButton
                        title="Tratar pelo WhatsApp (Rápido)"
                        onPress={openWhatsApp}
                    />
                    <GhostButton title="Voltar para editar" onPress={goBack} />
                </View>
            </View>
        </FadeInView>
    );

    const steps = [renderStep0, renderStep1, renderStep2, renderStep3];

    return (
        <Screen contentContainerStyle={{ paddingHorizontal: 0 }}>
            <TopHeader 
                title="Novo Pedido" 
                rightAction={
                    <TouchableOpacity onPress={goBack} accessibilityLabel="Fechar">
                        <Ionicons name="close" size={28} color={TOKENS.colors.text} />
                    </TouchableOpacity>
                } 
            />
            
            <StepIndicator current={step} total={4} />

            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
                <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
                    {steps[step]()}
                </ScrollView>
            </KeyboardAvoidingView>

            {/* Persistent Estimator Bar */}
            {step > 0 && eventType && step < 3 && (
                <View style={styles.estimator}>
                    <View>
                        <Text style={styles.estimatorLabel}>Estimativa Atual</Text>
                        <Text style={styles.estimatorPrice}>{formatKz(pricing.total)}</Text>
                    </View>
                    <Text style={styles.estimatorDetail}>{guestCount} convidados</Text>
                </View>
            )}
        </Screen>
    );
};

const styles = StyleSheet.create({
    scrollContent: { paddingBottom: TOKENS.spacing[12] + 80 }, // extra spacing for estimator
    stepContainer: { paddingHorizontal: TOKENS.spacing[4] },
    bottomActions: { marginTop: TOKENS.spacing[8] },

    eventGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: TOKENS.spacing[3], justifyContent: 'space-between' },

    guestHeader: { flexDirection: 'row', alignItems: 'center', gap: TOKENS.spacing[2], marginBottom: TOKENS.spacing[6], justifyContent: 'center' },
    guestControl: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: TOKENS.spacing[3] },
    guestBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: TOKENS.colors.surface2, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: TOKENS.colors.border },
    guestBtnText: { ...textStyles.bodyBold, color: TOKENS.colors.textInverse },
    guestCount: { fontFamily: 'Fraunces_700Bold', fontSize: 36, color: TOKENS.colors.gold, minWidth: 80, textAlign: 'center' },

    dateButton: { flexDirection: 'row', alignItems: 'center', gap: TOKENS.spacing[4], backgroundColor: TOKENS.colors.surface, borderRadius: TOKENS.radius.card, padding: TOKENS.spacing[4], marginBottom: TOKENS.spacing[6], borderWidth: 1, borderColor: TOKENS.colors.border },
    dateLabel: { ...textStyles.small, color: TOKENS.colors.muted, marginBottom: TOKENS.spacing[1] },
    dateValue: { ...textStyles.bodyMedium, color: TOKENS.colors.text },

    imageButton: { marginBottom: TOKENS.spacing[6], borderRadius: TOKENS.radius.card, overflow: 'hidden' },
    imagePlaceholder: { height: 120, backgroundColor: TOKENS.colors.surface, borderRadius: TOKENS.radius.card, borderWidth: 1.5, borderColor: TOKENS.colors.border, borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center' },
    refImage: { width: '100%', height: 160, borderRadius: TOKENS.radius.card },

    receiptRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: TOKENS.spacing[2] },
    receiptLabel: { ...textStyles.body, color: TOKENS.colors.muted },
    receiptValue: { ...textStyles.bodyMedium, color: TOKENS.colors.textInverse },
    divider: { height: 1, backgroundColor: TOKENS.colors.border, marginVertical: TOKENS.spacing[3] },

    estimator: { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: TOKENS.colors.surface, paddingVertical: TOKENS.spacing[4], paddingHorizontal: TOKENS.spacing[6], borderTopWidth: 1, borderTopColor: TOKENS.colors.border, ...TOKENS.shadowElite },
    estimatorLabel: { ...textStyles.caption, color: TOKENS.colors.muted },
    estimatorPrice: { ...textStyles.h3, color: TOKENS.colors.gold },
    estimatorDetail: { ...textStyles.small, color: TOKENS.colors.text },
});
