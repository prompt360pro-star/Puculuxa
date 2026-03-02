import React, { useState, useRef, useMemo, useCallback } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, ScrollView,
    TextInput, Linking, Animated, Dimensions, Image, Platform,
    KeyboardAvoidingView,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { ChevronLeft, Calendar, Users, Cake, UtensilsCrossed, CheckCircle, Send } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Theme, T } from '../theme';
import { ApiService } from '../services/api';
import { useAuthStore } from '../store/authStore';
import { useToastStore } from '../store/toastStore';
import { PremiumButton } from '../components/ui/PremiumButton';
import { PremiumInput } from '../components/ui/PremiumInput';
import { formatKz, formatDateAO, humanizeError } from '../utils/errorMessages';
import { enqueueQuotation } from '../utils/offlineQueue';
import * as ImagePicker from 'expo-image-picker';

const { width } = Dimensions.get('window');

// Event types with visual cards (8 tipos — match schema v3.1)
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

// Complements — preços em Kz (match shared COMPLEMENTS catalog)
const COMPLEMENTS = [
    { id: 'cupcakes', label: 'Cupcakes Decorados', price: 1500, type: 'PER_UNIT', icon: '🧁' },
    { id: 'docinhos', label: 'Mesa de Docinhos', price: 800, type: 'PER_GUEST', icon: '🍬' },
    { id: 'salgados', label: 'Salgados Premium', price: 900, type: 'PER_GUEST', icon: '🥟' },
    { id: 'drinks', label: 'Serviço de Bebidas', price: 1000, type: 'PER_GUEST', icon: '🍹' },
    { id: 'decoration', label: 'Decoração Temática', price: 25000, type: 'FIXED', icon: '🎈' },
    { id: 'coffee_break', label: 'Coffee Break', price: 1200, type: 'PER_GUEST', icon: '☕' },
    { id: 'lembrancinhas', label: 'Lembrancinhas', price: 500, type: 'PER_GUEST', icon: '🎁' },
];

// Base prices by event type (per guest, in Kz — match shared BASE_PRICES)
const BASE_PRICE_PER_GUEST = {
    casamento: 2500,
    aniversario: 2000,
    corporativo: 3000,
    baptizado: 1800,
    bodas: 2200,
    baby_shower: 1500,
    graduacao: 1800,
    outro: 2000,
};

// Suggestions per event type (match shared EVENT_SUGGESTIONS)
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

// === Step Indicator ===
const StepIndicator = ({ current, total }) => (
    <View style={si.container}>
        {Array.from({ length: total }, (_, i) => (
            <React.Fragment key={i}>
                <View style={[si.dot, i < current ? si.dotDone : null, i === current ? si.dotCurrent : null]}>
                    {i < current ? <CheckCircle size={14} color={Theme.colors.white} /> : <Text style={si.dotText}>{i + 1}</Text>}
                </View>
                {i < total - 1 ? <View style={[si.line, i < current ? si.lineDone : null]} /> : null}
            </React.Fragment>
        ))}
    </View>
);

const si = StyleSheet.create({
    container: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16 },
    dot: { width: 28, height: 28, borderRadius: 14, backgroundColor: Theme.colors.border, justifyContent: 'center', alignItems: 'center' },
    dotCurrent: { backgroundColor: Theme.colors.primary, ...Theme.elevation.sm },
    dotDone: { backgroundColor: Theme.colors.secondary },
    dotText: { fontFamily: T.button.fontFamily, fontSize: 12, color: Theme.colors.white },
    line: { width: 40, height: 2, backgroundColor: Theme.colors.border },
    lineDone: { backgroundColor: Theme.colors.secondary },
});

// === Event Type Card ===
const EventCard = React.memo(({ item, selected, onPress }) => (
    <TouchableOpacity
        style={[ec.card, selected ? ec.selected : null, { backgroundColor: item.color }]}
        onPress={onPress}
        activeOpacity={0.85}
        accessibilityRole="radio"
        accessibilityLabel={item.label}
        accessibilityState={{ selected }}
    >
        <Text style={ec.icon}>{item.icon}</Text>
        <Text style={ec.label}>{item.label}</Text>
        {selected ? <View style={ec.check}><CheckCircle size={16} color={Theme.colors.white} /></View> : null}
    </TouchableOpacity>
));

const ec = StyleSheet.create({
    card: { width: (width - 60) / 2, aspectRatio: 1.2, borderRadius: Theme.radius.lg, padding: 16, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: 'transparent' },
    selected: { borderColor: Theme.colors.primary },
    icon: { fontSize: 36, marginBottom: 8 },
    label: { fontFamily: 'Poppins_600SemiBold', fontSize: 13, color: Theme.colors.textPrimary, textAlign: 'center' },
    check: { position: 'absolute', top: 8, right: 8, width: 24, height: 24, borderRadius: 12, backgroundColor: Theme.colors.primary, justifyContent: 'center', alignItems: 'center' },
});

// === Complement Chip ===
const ComplementChip = React.memo(({ item, selected, suggested, onPress }) => (
    <TouchableOpacity
        style={[cc.chip, selected ? cc.chipSelected : null]}
        onPress={onPress}
        activeOpacity={0.85}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: selected }}
    >
        <Text style={cc.icon}>{item.icon}</Text>
        <View style={cc.textWrap}>
            <Text style={[cc.label, selected ? cc.labelSelected : null]}>{item.label}</Text>
            <Text style={cc.price}>{formatKz(item.price)}</Text>
        </View>
        {suggested && !selected ? <View style={cc.badge}><Text style={cc.badgeText}>Sugerido</Text></View> : null}
        {selected ? <CheckCircle size={16} color={Theme.colors.secondary} /> : null}
    </TouchableOpacity>
));

const cc = StyleSheet.create({
    chip: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14, paddingHorizontal: 16, borderRadius: Theme.radius.md, backgroundColor: Theme.colors.surfaceElevated, borderWidth: 1.5, borderColor: Theme.colors.border, marginBottom: 10 },
    chipSelected: { borderColor: Theme.colors.secondary, backgroundColor: Theme.colors.secondaryGhost },
    icon: { fontSize: 24 },
    textWrap: { flex: 1 },
    label: { fontFamily: 'Poppins_500Medium', fontSize: 14, color: Theme.colors.textPrimary },
    labelSelected: { color: Theme.colors.secondaryDark },
    price: { ...T.bodySmall, fontSize: 12, marginTop: 2 },
    badge: { backgroundColor: Theme.colors.primaryGhost, paddingHorizontal: 8, paddingVertical: 3, borderRadius: Theme.radius.full },
    badgeText: { fontFamily: T.bodySmall.fontFamily, fontSize: 10, color: Theme.colors.primary },
});

// === MAIN WIZARD ===
export const QuotationWizard = ({ navigation }) => {
    const { user } = useAuthStore();
    const { show } = useToastStore();

    const [step, setStep] = useState(0);
    const [loading, setLoading] = useState(false);
    const [eventType, setEventType] = useState('');
    const [guestCount, setGuestCount] = useState(50);
    const [eventDate, setEventDate] = useState(new Date(Date.now() + 7 * 86400000));
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [selectedComplements, setSelectedComplements] = useState([]);
    const [notes, setNotes] = useState('');
    const [customerName, setCustomerName] = useState(user?.name || '');
    const [customerPhone, setCustomerPhone] = useState(user?.phone || '');
    const [imageUri, setImageUri] = useState(null);

    // Smart pricing calculator (matches shared calculateSmartPrice)
    const pricing = useMemo(() => {
        const basePerGuest = BASE_PRICE_PER_GUEST[eventType] || 2000;
        const base = basePerGuest * guestCount;
        const complementsTotal = selectedComplements.reduce((sum, id) => {
            const c = COMPLEMENTS.find(x => x.id === id);
            if (!c) return sum;
            if (c.type === 'PER_GUEST') return sum + c.price * guestCount;
            if (c.type === 'FIXED') return sum + c.price;
            return sum + c.price; // PER_UNIT
        }, 0);
        const subtotal = base + complementsTotal;
        const tax = Math.round(subtotal * 0.05);
        const total = subtotal + tax;
        // Confidence based on description detail
        const confidence = notes.length > 50 ? 90 : notes.length > 0 ? 85 : 75;
        return { base, complementsTotal, subtotal, tax, total, confidence };
    }, [eventType, guestCount, selectedComplements, notes]);

    const suggestions = SUGGESTIONS[eventType] || [];

    const toggleComplement = useCallback((id) => {
        setSelectedComplements(prev =>
            prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
        );
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
        if (!customerName.trim() || !customerPhone.trim()) {
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
            show({ type: 'success', message: 'Orçamento enviado! Entraremos em contacto.' });
            if (navigation.canGoBack()) navigation.goBack();
        } catch (err) {
            await enqueueQuotation(payload);
            show({ type: 'brand', message: 'Sem internet. O orçamento será enviado quando voltares a estar online.', duration: 5000 });
            if (navigation.canGoBack()) navigation.goBack();
        } finally {
            setLoading(false);
        }
    };

    const openWhatsApp = () => {
        const msg = `Olá Puculuxa! 🎂\n\nGostaria de um orçamento:\n• Evento: ${EVENT_TYPES.find(e => e.id === eventType)?.label || eventType}\n• Convidados: ${guestCount}\n• Data: ${formatDateAO(eventDate)}\n• Estimativa: ${formatKz(pricing.total)}\n\nObrigado(a)!`;
        Linking.openURL(`https://wa.me/244923456789?text=${encodeURIComponent(msg)}`);
    };

    const onDateChange = (event, date) => {
        setShowDatePicker(Platform.OS === 'ios');
        if (date) setEventDate(date);
    };

    // === STEP RENDERERS ===

    const renderStep0 = () => (
        <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Que tipo de evento?</Text>
            <Text style={styles.stepSubtitle}>Escolhe o que melhor descreve o teu evento</Text>
            <View style={styles.eventGrid}>
                {EVENT_TYPES.map(et => (
                    <EventCard key={et.id} item={et} selected={eventType === et.id} onPress={() => setEventType(et.id)} />
                ))}
            </View>
            <View style={styles.stepActions}>
                <PremiumButton title="Continuar →" onPress={goNext} disabled={!eventType} size="lg" />
            </View>
        </View>
    );

    const renderStep1 = () => (
        <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Detalhes do evento</Text>
            <Text style={styles.stepSubtitle}>Quanto mais detalhes, melhor o orçamento</Text>

            {/* Guest count */}
            <View style={styles.guestSection}>
                <View style={styles.guestHeader}>
                    <Users size={20} color={Theme.colors.primary} />
                    <Text style={styles.guestLabel}>Convidados</Text>
                </View>
                <View style={styles.guestControl}>
                    <TouchableOpacity style={styles.guestBtn} onPress={() => adjustGuests(-10)} accessibilityLabel="Menos 10 convidados">
                        <Text style={styles.guestBtnText}>-10</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.guestBtn} onPress={() => adjustGuests(-1)} accessibilityLabel="Menos 1 convidado">
                        <Text style={styles.guestBtnText}>-</Text>
                    </TouchableOpacity>
                    <Text style={styles.guestCount}>{guestCount}</Text>
                    <TouchableOpacity style={styles.guestBtn} onPress={() => adjustGuests(1)} accessibilityLabel="Mais 1 convidado">
                        <Text style={styles.guestBtnText}>+</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.guestBtn} onPress={() => adjustGuests(10)} accessibilityLabel="Mais 10 convidados">
                        <Text style={styles.guestBtnText}>+10</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Date picker */}
            <TouchableOpacity style={styles.dateButton} onPress={() => setShowDatePicker(true)} accessibilityLabel="Escolher data do evento">
                <Calendar size={20} color={Theme.colors.primary} />
                <View style={{ flex: 1 }}>
                    <Text style={styles.dateLabel}>Data do evento</Text>
                    <Text style={styles.dateValue}>{formatDateAO(eventDate)}</Text>
                </View>
            </TouchableOpacity>

            {showDatePicker ? (
                <DateTimePicker
                    value={eventDate}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'inline' : 'default'}
                    minimumDate={new Date(Date.now() + 86400000)}
                    onChange={onDateChange}
                />
            ) : null}

            {/* Description (personalização) */}
            <PremiumInput
                label="Descreve o teu pedido personalizado"
                value={notes}
                onChangeText={setNotes}
                placeholder="Ex: Bolo unicórnio 3 andares, cobertura fondant rosa com estrelas douradas..."
                multiline
                numberOfLines={4}
            />
            {notes.length > 0 ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: -8, marginBottom: 8 }}>
                    <Text style={{ fontSize: 10, color: Theme.colors.textTertiary }}>
                        ✨ Quanto mais detalhes, mais preciso o orçamento ({pricing.confidence}% confiança)
                    </Text>
                </View>
            ) : null}

            {/* Reference image */}
            <TouchableOpacity style={styles.imageButton} onPress={pickImage} accessibilityLabel="Anexar imagem de referência">
                {imageUri ? (
                    <Image source={{ uri: imageUri }} style={styles.refImage} />
                ) : (
                    <View style={styles.imagePlaceholder}>
                        <Cake size={24} color={Theme.colors.textTertiary} />
                        <Text style={styles.imageText}>Anexar imagem de referência</Text>
                    </View>
                )}
            </TouchableOpacity>

            <View style={styles.stepActions}>
                <PremiumButton title="← Voltar" onPress={goBack} variant="ghost" size="md" style={{ flex: 1 }} />
                <PremiumButton title="Continuar →" onPress={goNext} size="md" style={{ flex: 2 }} />
            </View>
        </View>
    );

    const renderStep2 = () => (
        <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Complementos</Text>
            <Text style={styles.stepSubtitle}>Adiciona extras ao teu evento</Text>

            {COMPLEMENTS.map(c => (
                <ComplementChip
                    key={c.id}
                    item={c}
                    selected={selectedComplements.includes(c.id)}
                    suggested={suggestions.includes(c.id)}
                    onPress={() => toggleComplement(c.id)}
                />
            ))}

            <View style={styles.stepActions}>
                <PremiumButton title="← Voltar" onPress={goBack} variant="ghost" size="md" style={{ flex: 1 }} />
                <PremiumButton title="Continuar →" onPress={goNext} size="md" style={{ flex: 2 }} />
            </View>
        </View>
    );

    const renderStep3 = () => (
        <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Resumo do Orçamento</Text>

            {/* Receipt card */}
            <View style={styles.receipt}>
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
                {selectedComplements.length > 0 ? (
                    <View style={styles.receiptRow}>
                        <Text style={styles.receiptLabel}>Complementos</Text>
                        <Text style={styles.receiptValue}>{selectedComplements.length} items</Text>
                    </View>
                ) : null}
                <View style={styles.divider} />
                <View style={styles.receiptRow}>
                    <Text style={styles.receiptLabel}>Base ({guestCount} × {formatKz(BASE_PRICE_PER_GUEST[eventType] || 3500)})</Text>
                    <Text style={styles.receiptValue}>{formatKz(pricing.base)}</Text>
                </View>
                {pricing.complementsTotal > 0 ? (
                    <View style={styles.receiptRow}>
                        <Text style={styles.receiptLabel}>Complementos</Text>
                        <Text style={styles.receiptValue}>{formatKz(pricing.complementsTotal)}</Text>
                    </View>
                ) : null}
                <View style={styles.receiptRow}>
                    <Text style={styles.receiptLabel}>Taxa (5%)</Text>
                    <Text style={styles.receiptValue}>{formatKz(pricing.tax)}</Text>
                </View>
                <View style={styles.divider} />
                <View style={styles.receiptRow}>
                    <Text style={styles.receiptTotalLabel}>Estimativa Total</Text>
                    <Text style={styles.receiptTotalValue}>{formatKz(pricing.total)}</Text>
                </View>
            </View>

            {/* Contact info */}
            <View style={styles.contactSection}>
                <Text style={styles.contactTitle}>Os teus dados</Text>
                <PremiumInput label="Nome" value={customerName} onChangeText={setCustomerName} placeholder="O teu nome" />
                <PremiumInput label="Telefone" value={customerPhone} onChangeText={setCustomerPhone} placeholder="+244 923 456 789" keyboardType="phone-pad" />
            </View>

            <View style={{ gap: 12 }}>
                <PremiumButton title="Enviar Orçamento" onPress={handleSubmit} size="lg" loading={loading} icon={<Send size={18} color={Theme.colors.white} />} />
                <PremiumButton
                    title="Enviar via WhatsApp"
                    onPress={openWhatsApp}
                    variant="ghost"
                    size="md"
                    style={{ borderColor: Theme.colors.whatsapp }}
                />
            </View>

            <View style={[styles.stepActions, { marginTop: 8 }]}>
                <PremiumButton title="← Voltar" onPress={goBack} variant="ghost" size="md" />
            </View>
        </View>
    );

    const steps = [renderStep0, renderStep1, renderStep2, renderStep3];

    return (
        <View style={styles.container}>
            {/* Header */}
            <LinearGradient colors={[Theme.colors.gradientStart, Theme.colors.gradientEnd]} style={styles.header}>
                <TouchableOpacity onPress={goBack} style={styles.backBtn} accessibilityLabel="Voltar" accessibilityRole="button">
                    <ChevronLeft size={22} color={Theme.colors.white} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Pedir Orçamento</Text>
                <View style={{ width: 36 }} />
            </LinearGradient>

            <StepIndicator current={step} total={4} />

            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
                <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
                    {steps[step]()}
                </ScrollView>
            </KeyboardAvoidingView>

            {/* Persistent price estimator — visible on step 1+ */}
            {step > 0 && eventType ? (
                <View style={styles.estimator}>
                    <View>
                        <Text style={styles.estimatorLabel}>Estimativa</Text>
                        <Text style={styles.estimatorPrice}>{formatKz(pricing.total)}</Text>
                    </View>
                    <Text style={styles.estimatorDetail}>{guestCount} convidados</Text>
                </View>
            ) : null}
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Theme.colors.background },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: 52,
        paddingBottom: 16,
        paddingHorizontal: 16,
    },
    backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
    headerTitle: { ...T.h3, color: Theme.colors.white },
    scrollContent: { paddingBottom: 100 },
    stepContainer: { paddingHorizontal: 20, paddingTop: 8 },
    stepTitle: { ...T.h2, marginBottom: 4 },
    stepSubtitle: { ...T.bodySmall, marginBottom: 20 },
    stepActions: { flexDirection: 'row', gap: 12, marginTop: 24 },

    // Event Grid
    eventGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'center' },

    // Guest Section
    guestSection: { backgroundColor: Theme.colors.surfaceElevated, borderRadius: Theme.radius.lg, padding: 20, marginBottom: 20, ...Theme.elevation.xs },
    guestHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
    guestLabel: { ...T.h3, fontSize: 16 },
    guestControl: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12 },
    guestBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: Theme.colors.surface, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: Theme.colors.border },
    guestBtnText: { fontFamily: 'Poppins_600SemiBold', fontSize: 14, color: Theme.colors.textPrimary },
    guestCount: { fontFamily: 'Merriweather_700Bold', fontSize: 32, color: Theme.colors.primary, minWidth: 60, textAlign: 'center' },

    // Date
    dateButton: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: Theme.colors.surfaceElevated, borderRadius: Theme.radius.md, padding: 16, marginBottom: 20, borderWidth: 1, borderColor: Theme.colors.border },
    dateLabel: { ...T.label, marginBottom: 2 },
    dateValue: { ...T.body, fontFamily: 'Poppins_500Medium' },

    // Image
    imageButton: { marginBottom: 8, borderRadius: Theme.radius.md, overflow: 'hidden' },
    imagePlaceholder: { height: 80, backgroundColor: Theme.colors.surface, borderRadius: Theme.radius.md, borderWidth: 1.5, borderColor: Theme.colors.border, borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center', gap: 6, flexDirection: 'row' },
    imageText: { ...T.bodySmall, color: Theme.colors.textTertiary },
    refImage: { width: '100%', height: 120, borderRadius: Theme.radius.md },

    // Receipt
    receipt: { backgroundColor: Theme.colors.surfaceElevated, borderRadius: Theme.radius.lg, padding: 20, marginBottom: 24, ...Theme.elevation.sm },
    receiptRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 6 },
    receiptLabel: { ...T.bodySmall, flex: 1 },
    receiptValue: { ...T.body, fontFamily: 'Poppins_500Medium', textAlign: 'right' },
    divider: { height: 1, backgroundColor: Theme.colors.border, marginVertical: 10 },
    receiptTotalLabel: { ...T.h3, fontSize: 16 },
    receiptTotalValue: { ...T.priceLarge, fontSize: 24 },

    // Contact
    contactSection: { marginBottom: 20 },
    contactTitle: { ...T.h3, fontSize: 16, marginBottom: 16 },

    // Estimator
    estimator: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: Theme.colors.surfaceElevated,
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderTopWidth: 1,
        borderTopColor: Theme.colors.border,
        ...Theme.elevation.md,
    },
    estimatorLabel: { ...T.label },
    estimatorPrice: { ...T.price, fontSize: 20 },
    estimatorDetail: { ...T.bodySmall },
});
