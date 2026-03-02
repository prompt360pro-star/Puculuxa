import React, { useState } from 'react';
import {
    View, Text, StyleSheet, ScrollView,
    TouchableOpacity, KeyboardAvoidingView, Platform, Image,
} from 'react-native';
import { ChevronLeft, Save, User, Phone, MapPin, Mail, Camera } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { Theme, T } from '../theme';
import { useAuthStore } from '../store/authStore';
import { useToastStore } from '../store/toastStore';
import { PremiumButton } from '../components/ui/PremiumButton';
import { PremiumInput } from '../components/ui/PremiumInput';
import { ApiService } from '../services/api';
import { humanizeError } from '../utils/errorMessages';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';

export const EditProfileScreen = () => {
    const navigation = useNavigation();
    const { user, setUser } = useAuthStore();
    const { show } = useToastStore();

    const [name, setName] = useState(user?.name || '');
    const [phone, setPhone] = useState(user?.phone || '');
    const [address, setAddress] = useState(user?.address || '');
    const [avatarUri, setAvatarUri] = useState(user?.avatarUrl || null);
    const [isSaving, setIsSaving] = useState(false);

    const handlePickAvatar = async () => {
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
        });
        if (!result.canceled) setAvatarUri(result.assets[0].uri);
    };

    const handleSave = async () => {
        if (!name.trim()) {
            show({ type: 'warning', message: 'O nome é obrigatório.' });
            return;
        }
        const phoneClean = phone.replace(/\D/g, '');
        if (phoneClean && phoneClean.length < 9) {
            show({ type: 'warning', message: 'Número de telefone inválido (mínimo 9 dígitos).' });
            return;
        }

        setIsSaving(true);
        try {
            const updatedUser = await ApiService.updateProfile({ name, phone, address });
            const stored = await AsyncStorage.getItem('puculuxa_user');
            const parsed = stored ? JSON.parse(stored) : {};
            const merged = { ...parsed, ...updatedUser };
            await AsyncStorage.setItem('puculuxa_user', JSON.stringify(merged));
            if (typeof setUser === 'function') setUser(merged);

            show({ type: 'success', message: 'Perfil actualizado com sucesso!' });
            navigation.goBack();
        } catch (error) {
            show({ type: 'error', message: humanizeError(error) });
        } finally {
            setIsSaving(false);
        }
    };

    const initials = name ? name.charAt(0).toUpperCase() : '?';

    return (
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1, backgroundColor: Theme.colors.background }}>
            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} accessibilityLabel="Voltar">
                        <ChevronLeft size={22} color={Theme.colors.primary} />
                    </TouchableOpacity>
                    <Text style={styles.title}>Editar Perfil</Text>
                    <View style={{ width: 40 }} />
                </View>

                {/* Avatar */}
                <View style={styles.avatarSection}>
                    <TouchableOpacity style={styles.avatar} onPress={handlePickAvatar} activeOpacity={0.8} accessibilityLabel="Alterar foto de perfil">
                        {avatarUri ? (
                            <Image source={{ uri: avatarUri }} style={styles.avatarImage} />
                        ) : (
                            <Text style={styles.avatarText}>{initials}</Text>
                        )}
                        <View style={styles.cameraBadge}>
                            <Camera size={14} color={Theme.colors.white} />
                        </View>
                    </TouchableOpacity>
                    <Text style={styles.avatarHint}>Toque para alterar a foto</Text>
                </View>

                {/* Form */}
                <View style={styles.form}>
                    <PremiumInput label="Email (Não Editável)" value={user?.email || ''} onChangeText={() => { }} placeholder="email" editable={false} icon={<Mail />} />
                    <PremiumInput label="Nome completo" value={name} onChangeText={setName} placeholder="O teu nome" icon={<User />} />
                    <PremiumInput label="Telefone" value={phone} onChangeText={setPhone} placeholder="+244 9XX XXX XXX" keyboardType="phone-pad" icon={<Phone />} />
                    <PremiumInput label="Endereço de Entrega" value={address} onChangeText={setAddress} placeholder="Rua, Bairro, Município" icon={<MapPin />} />
                </View>

                <PremiumButton title="Guardar Alterações" onPress={handleSave} size="lg" loading={isSaving} icon={<Save size={18} color={Theme.colors.white} />} />
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    content: { paddingTop: 56, paddingHorizontal: 20, paddingBottom: 40 },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 },
    backBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: Theme.colors.surfaceElevated, justifyContent: 'center', alignItems: 'center', ...Theme.elevation.xs },
    title: { ...T.h3, color: Theme.colors.primary },
    avatarSection: { alignItems: 'center', marginBottom: 28 },
    avatar: {
        width: 90, height: 90, borderRadius: 45,
        backgroundColor: Theme.colors.surface,
        justifyContent: 'center', alignItems: 'center',
        borderWidth: 3, borderColor: Theme.colors.primary, marginBottom: 8,
    },
    avatarImage: { width: 84, height: 84, borderRadius: 42 },
    avatarText: { fontFamily: 'Merriweather_700Bold', fontSize: 36, color: Theme.colors.primary },
    avatarHint: { ...T.bodySmall, marginTop: 4 },
    cameraBadge: {
        position: 'absolute', bottom: -2, right: -2,
        backgroundColor: Theme.colors.primary,
        width: 30, height: 30, borderRadius: 15,
        justifyContent: 'center', alignItems: 'center',
        borderWidth: 3, borderColor: Theme.colors.background,
    },
    form: { backgroundColor: Theme.colors.surfaceElevated, borderRadius: Theme.radius.xl, padding: 20, marginBottom: 24, ...Theme.elevation.sm },
});
