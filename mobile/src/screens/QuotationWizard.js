import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Alert, Linking, Animated, Dimensions } from 'react-native';
import { ChevronRight, ChevronLeft, CheckCircle, Calculator, Sparkles, Wand2, User, Image as ImageIcon } from 'lucide-react-native';
import { Theme } from '../theme';
import { calculateQuotation, EVENT_TYPES } from '@puculuxa/shared';
import { ApiService } from '../services/api';
import { useAuthStore } from '../store/authStore';
import * as ImagePicker from 'expo-image-picker';

const { width } = Dimensions.get('window');

export const QuotationWizard = ({ navigation }) => {
    const { user } = useAuthStore();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        eventType: EVENT_TYPES.BIRTHDAY,
        guestCount: '',
        date: '',
        complements: [],
        customerName: user?.name || '',
        customerPhone: user?.phone || '',
    });
    const [imageUri, setImageUri] = useState(null);


    // Animation values
    const fadeAnim = useRef(new Animated.Value(1)).current;
    const slideAnim = useRef(new Animated.Value(0)).current;

    const COMPLEMENTS_LIST = [
        { id: 'CUPCAKES', label: 'Cupcakes Decorados', price: 15.00, icon: '🧁' },
        { id: 'SWEETS', label: 'Mesa de Doces Finos', price: 25.00, icon: '🍬' },
        { id: 'SALTY', label: 'Kit Salgados Premium', price: 45.00, icon: '🥟' },
        { id: 'DRINKS', label: 'Bebidas Tropicais', price: 20.00, icon: '🍹' },
    ];

    useEffect(() => {
        animateTransition();
    }, [step]);

    const animateTransition = () => {
        fadeAnim.setValue(0);
        slideAnim.setValue(50);

        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 400,
                useNativeDriver: true,
            }),
            Animated.spring(slideAnim, {
                toValue: 0,
                friction: 8,
                tension: 40,
                useNativeDriver: true,
            })
        ]).start();
    };

    const toggleComplement = (id) => {
        setFormData(prev => ({
            ...prev,
            complements: prev.complements.includes(id)
                ? prev.complements.filter(c => c !== id)
                : [...prev.complements, id]
        }));
    };

    const handleNext = () => {
        if (step < 4) setStep(step + 1);
        else handleSubmit();
    };

    const handleBack = () => {
        if (step > 1) setStep(step - 1);
        else navigation.goBack();
    };

    const shareToWhatsApp = (quotation) => {
        const message = `Olá! Acabei de gerar um orçamento no app Puculuxa:%0A%0A` +
            `*Evento:* ${quotation.eventType}%0A` +
            `*Convidados:* ${quotation.guestCount}%0A` +
            `*Total Estimado:* Kz ${quotation.total.toLocaleString('pt-BR')}%0A%0A` +
            `Gostaria de confirmar os detalhes e receber o PDF formal.`;

        const url = `whatsapp://send?phone=+244923000000&text=${message}`;
        Linking.openURL(url).catch(() => {
            Alert.alert('Erro', 'Certifique-se de que o WhatsApp está instalado.');
        });
    };

    const pickImage = async () => {
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.8,
        });

        if (!result.canceled) {
            setImageUri(result.assets[0].uri);
        }
    };

    const handleSubmit = async () => {
        setLoading(true);
        try {
            const calculation = calculateQuotation({
                eventType: formData.eventType,
                guestCount: parseInt(formData.guestCount) || 0,
                complements: formData.complements
            });

            let referenceImage = null;
            if (imageUri) {
                const uploadRes = await ApiService.uploadQuotationImage(imageUri);
                referenceImage = uploadRes.url;
            }

            const response = await ApiService.postQuotation({
                ...formData,
                referenceImage,
                ...calculation
            });

            if (response.id) {
                Alert.alert(
                    "Sucesso!",
                    "Seu orçamento foi enviado. Deseja confirmar agora via WhatsApp?",
                    [
                        { text: "Depois", onPress: () => navigation.navigate('Home') },
                        {
                            text: "Confirmar via WhatsApp", onPress: () => {
                                shareToWhatsApp(response);
                                navigation.navigate('Home');
                            }
                        }
                    ]
                );
            }
        } catch (error) {
            Alert.alert('Erro', 'Não foi possível enviar o orçamento. Tente novamente.');
        } finally {
            setLoading(false);
        }
    };

    const renderHeader = () => (
        <View style={styles.header}>
            <View style={styles.progressBarContainer}>
                {[1, 2, 3, 4].map(s => (
                    <View key={s} style={styles.progressStepWrapper}>
                        <View style={[
                            styles.progressStep,
                            s <= step && styles.progressStepActive,
                            s === step && styles.progressStepCurrent
                        ]} />
                    </View>
                ))}
            </View>
            <Text style={styles.headerTitle}>
                {step === 1 && "Tipo de Evento"}
                {step === 2 && "Detalhes"}
                {step === 3 && "Complementos"}
                {step === 4 && "Resumo"}
            </Text>
        </View>
    );

    const renderSmartSuggestion = () => {
        if (step !== 3) return null;
        return (
            <View style={styles.smartBadge}>
                <Sparkles size={16} color={Theme.colors.primary} />
                <Text style={styles.smartText}>Sugestão IA: Adicione doces finos para casamentos!</Text>
            </View>
        );
    };

    const renderStep = () => {
        return (
            <Animated.View style={[
                styles.stepContent,
                {
                    opacity: fadeAnim,
                    transform: [{ translateY: slideAnim }]
                }
            ]}>
                {step === 1 && (
                    <View>
                        <Text style={styles.stepTitle}>Qual o seu evento?</Text>
                        {Object.entries(EVENT_TYPES).map(([key, value]) => (
                            <TouchableOpacity
                                key={key}
                                style={[styles.optionCard, formData.eventType === value && styles.optionCardActive]}
                                onPress={() => setFormData({ ...formData, eventType: value })}
                                activeOpacity={0.7}
                            >
                                <Text style={[styles.optionText, formData.eventType === value && styles.optionTextActive]}>
                                    {value.charAt(0).toUpperCase() + value.slice(1)}
                                </Text>
                                {formData.eventType === value && <CheckCircle size={20} color={Theme.colors.primary} />}
                            </TouchableOpacity>
                        ))}
                    </View>
                )}

                {step === 2 && (
                    <View>
                        <Text style={styles.stepTitle}>Quantos convidados?</Text>
                        <TextInput
                            style={styles.input}
                            keyboardType="numeric"
                            placeholder="Ex: 50"
                            placeholderTextColor={Theme.colors.textSecondary + '80'}
                            value={formData.guestCount}
                            onChangeText={(text) => setFormData({ ...formData, guestCount: text })}
                        />
                        <Text style={styles.stepTitle}>Data do Evento</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="DD/MM/AAAA"
                            placeholderTextColor={Theme.colors.textSecondary + '80'}
                            value={formData.date}
                            onChangeText={(text) => setFormData({ ...formData, date: text })}
                        />

                        <Text style={styles.stepTitle}>Imagem de Referência (Opcional)</Text>
                        <TouchableOpacity style={styles.imagePickerButton} onPress={pickImage} activeOpacity={0.8}>
                            <ImageIcon size={24} color={Theme.colors.primary} />
                            <Text style={styles.imagePickerText}>
                                {imageUri ? 'Imagem Selecionada (Tocar para Mudar)' : 'Selecionar Imagem de Inspiração'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                )}

                {step === 3 && (
                    <View>
                        <Text style={styles.stepTitle}>Experiências Extras</Text>
                        {renderSmartSuggestion()}
                        {COMPLEMENTS_LIST.map(item => (
                            <TouchableOpacity
                                key={item.id}
                                style={[styles.optionCard, formData.complements.includes(item.id) && styles.optionCardActive]}
                                onPress={() => toggleComplement(item.id)}
                                activeOpacity={0.8}
                            >
                                <View style={styles.optionRow}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                        <Text style={{ fontSize: 24, marginRight: 12 }}>{item.icon}</Text>
                                        <Text style={[styles.optionText, formData.complements.includes(item.id) && styles.optionTextActive]}>
                                            {item.label}
                                        </Text>
                                    </View>
                                    <View style={[styles.checkbox, formData.complements.includes(item.id) && styles.checkboxActive]} />
                                </View>
                            </TouchableOpacity>
                        ))}
                    </View>
                )}

                {step === 4 && (
                    <View>
                        <View style={{ alignItems: 'center', marginBottom: 24 }}>
                            <Wand2 size={48} color={Theme.colors.primary} />
                            <Text style={styles.magicTitle}>Orçamento Gerado!</Text>
                        </View>

                        <View style={styles.summaryCard}>
                            <View style={styles.summaryRow}>
                                <Text style={styles.summaryLabel}>Evento</Text>
                                <Text style={styles.summaryValue}>{formData.eventType}</Text>
                            </View>
                            <View style={styles.summaryRow}>
                                <Text style={styles.summaryLabel}>Convidados</Text>
                                <Text style={styles.summaryValue}>{formData.guestCount}</Text>
                            </View>
                            {imageUri && (
                                <View style={styles.summaryRow}>
                                    <Text style={styles.summaryLabel}>Imagem de Referência</Text>
                                    <Text style={styles.summaryValue}>Anexada ✅</Text>
                                </View>
                            )}

                            <View style={styles.divider} />

                            {(() => {
                                const calc = calculateQuotation({
                                    eventType: formData.eventType,
                                    guestCount: parseInt(formData.guestCount) || 0,
                                    complements: formData.complements
                                });
                                return (
                                    <View>
                                        <View style={styles.totalRow}>
                                            <Text style={styles.totalLabel}>Total Estimado</Text>
                                            <Text style={styles.totalValue}>Kz {calc.total.toLocaleString()}</Text>
                                        </View>
                                    </View>
                                );
                            })()}
                        </View>
                        <Text style={styles.disclaimer}>
                            Este valor é uma estimativa inteligente baseada em eventos similares.
                        </Text>
                    </View>
                )}
            </Animated.View>
        );
    };

    return (
        <View style={styles.container}>
            {renderHeader()}

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {renderStep()}
            </ScrollView>

            <View style={styles.footer}>
                <TouchableOpacity onPress={handleBack} style={styles.backButton}>
                    <ChevronLeft size={24} color={Theme.colors.textSecondary} />
                </TouchableOpacity>

                <TouchableOpacity onPress={handleNext} style={styles.nextButton}>
                    <Text style={styles.nextText}>{step === 4 ? 'Finalizar Pedido' : 'Continuar'}</Text>
                    {step < 4 ? <ChevronRight size={20} color="white" /> : <CheckCircle size={20} color="white" />}
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Theme.colors.background,
    },
    header: {
        paddingTop: 60,
        paddingHorizontal: Theme.spacing.xl,
        paddingBottom: 20,
        backgroundColor: Theme.colors.background,
        zIndex: 10,
    },
    progressBarContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    progressStepWrapper: {
        flex: 1,
        height: 6,
        marginHorizontal: 4,
        backgroundColor: Theme.colors.surface, // track color
        borderRadius: 3,
        overflow: 'hidden',
    },
    progressStep: {
        height: '100%',
        backgroundColor: Theme.colors.surface,
    },
    progressStepActive: {
        backgroundColor: Theme.colors.primary,
    },
    progressStepCurrent: {
        backgroundColor: Theme.colors.accent,
    },
    headerTitle: {
        fontFamily: Theme.fonts.brandSecondary,
        fontSize: 28,
        color: Theme.colors.secondary,
    },
    scrollContent: {
        padding: Theme.spacing.xl,
        paddingBottom: 100,
    },
    stepContent: {
        flex: 1,
    },
    stepTitle: {
        fontFamily: Theme.fonts.body,
        fontWeight: 'bold',
        fontSize: 20,
        color: Theme.colors.textPrimary, // Fixed: using textPrimary
        marginBottom: Theme.spacing.lg,
    },
    smartBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Theme.colors.surface,
        padding: 12,
        borderRadius: Theme.radius.lg,
        marginBottom: 20,
        borderLeftWidth: 3,
        borderLeftColor: Theme.colors.primary,
    },
    smartText: {
        marginLeft: 8,
        color: Theme.colors.primary,
        fontSize: 14,
        fontWeight: '600',
    },
    optionCard: {
        backgroundColor: 'white',
        padding: Theme.spacing.lg,
        borderRadius: Theme.radius.xl,
        marginBottom: Theme.spacing.md,
        borderWidth: 1,
        borderColor: 'transparent',
        ...Theme.shadows.light,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    optionCardActive: {
        borderColor: Theme.colors.primary,
        backgroundColor: '#FFF8F0', // lighter primary
    },
    optionRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        flex: 1,
        alignItems: 'center',
    },
    optionText: {
        fontSize: 16,
        color: Theme.colors.textSecondary,
        fontWeight: '500',
    },
    optionTextActive: {
        color: Theme.colors.primary,
        fontWeight: 'bold',
    },
    input: {
        backgroundColor: 'white',
        height: 56,
        borderRadius: Theme.radius.lg,
        paddingHorizontal: Theme.spacing.lg,
        fontSize: 16,
        marginBottom: Theme.spacing.xl,
        borderWidth: 1,
        borderColor: Theme.colors.surface,
        color: Theme.colors.textPrimary,
        ...Theme.shadows.light,
    },
    imagePickerButton: {
        backgroundColor: 'white',
        height: 56,
        borderRadius: Theme.radius.lg,
        paddingHorizontal: Theme.spacing.lg,
        marginBottom: Theme.spacing.xl,
        borderWidth: 1,
        borderColor: Theme.colors.primary + '40',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        ...Theme.shadows.light,
    },
    imagePickerText: {
        fontSize: 16,
        color: Theme.colors.primary,
        fontWeight: '500',
        marginLeft: 12,
    },
    checkbox: {
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: Theme.colors.textSecondary,
    },
    checkboxActive: {
        backgroundColor: Theme.colors.primary,
        borderColor: Theme.colors.primary,
    },
    summaryCard: {
        backgroundColor: 'white',
        borderRadius: Theme.radius.xl,
        padding: 24,
        ...Theme.shadows.medium,
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    summaryLabel: {
        color: Theme.colors.textSecondary,
        fontSize: 15,
    },
    summaryValue: {
        color: Theme.colors.textPrimary,
        fontWeight: '600',
        fontSize: 15,
    },
    divider: {
        height: 1,
        backgroundColor: Theme.colors.surface,
        marginVertical: 16,
    },
    totalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    totalLabel: {
        fontSize: 18,
        fontWeight: 'bold',
        color: Theme.colors.textSecondary,
    },
    totalValue: {
        fontSize: 24,
        fontWeight: 'bold',
        color: Theme.colors.primary,
    },
    magicTitle: {
        fontSize: 24,
        fontFamily: Theme.fonts.brand,
        color: Theme.colors.primary,
        marginTop: 12,
    },
    disclaimer: {
        textAlign: 'center',
        marginTop: 20,
        color: Theme.colors.textSecondary,
        fontSize: 12,
        opacity: 0.7,
    },
    footer: {
        flexDirection: 'row',
        padding: Theme.spacing.xl,
        paddingBottom: 40,
        backgroundColor: 'white',
        borderTopWidth: 1,
        borderTopColor: Theme.colors.surface,
        justifyContent: 'space-between',
        alignItems: 'center',
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
    },
    backButton: {
        padding: 12,
        borderRadius: Theme.radius.full,
        backgroundColor: Theme.colors.surface,
    },
    nextButton: {
        backgroundColor: Theme.colors.primary,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 32,
        paddingVertical: 16,
        borderRadius: Theme.radius.full,
        ...Theme.shadows.medium,
    },
    nextText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
        marginRight: 8,
    },
});
