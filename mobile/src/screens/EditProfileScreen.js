import React, { useState } from 'react';
import {
    View, Text, StyleSheet, TextInput, ScrollView,
    TouchableOpacity, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, Image, ToastAndroid
} from 'react-native';
import { ArrowLeft, Save, User, Phone, MapPin, Mail, Camera } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { Theme } from '../theme';
import { useAuthStore } from '../store/authStore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ApiService } from '../services/api';
import * as ImagePicker from 'expo-image-picker';

export const EditProfileScreen = () => {
    const navigation = useNavigation();
    const { user, setUser } = useAuthStore();

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

        if (!result.canceled) {
            setAvatarUri(result.assets[0].uri);
        }
    };

    const handleSave = async () => {
        if (!name.trim()) return Alert.alert('Erro', 'O nome é obrigatório.');
        const phoneClean = phone.replace(/\D/g, '');
        if (phoneClean && phoneClean.length < 9) {
            return Alert.alert('Atenção', 'Número de telefone inválido (mínimo 9 dígitos).');
        }

        setIsSaving(true);
        try {
            const updatedUser = await ApiService.updateProfile({ name, phone, address });
            // Persist update locally
            const stored = await AsyncStorage.getItem('puculuxa_user');
            const parsed = stored ? JSON.parse(stored) : {};
            const merged = { ...parsed, ...updatedUser };
            await AsyncStorage.setItem('puculuxa_user', JSON.stringify(merged));
            if (typeof setUser === 'function') setUser(merged);

            if (Platform.OS === 'android') {
                ToastAndroid.show('Perfil atualizado com sucesso!', ToastAndroid.SHORT);
                navigation.goBack();
            } else {
                Alert.alert('Sucesso', 'Perfil atualizado com sucesso!', [
                    { text: 'OK', onPress: () => navigation.goBack() }
                ]);
            }
        } catch (error) {
            Alert.alert('Erro', 'Não foi possível guardar as alterações. Tente novamente.');
            console.error('EditProfile error:', error);
        } finally {
            setIsSaving(false);
        }
    };

    const Field = ({ icon: Icon, label, value, onChangeText, placeholder, keyboardType = 'default', editable = true }) => (
        <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>{label}</Text>
            <View style={[styles.inputWrapper, !editable && { backgroundColor: '#f0f0f0', borderColor: '#f0f0f0' }]}>
                <Icon size={18} color={Theme.colors.textSecondary} style={styles.inputIcon} />
                <TextInput
                    style={[styles.input, !editable && { color: Theme.colors.textSecondary }]}
                    value={value}
                    onChangeText={onChangeText}
                    placeholder={placeholder}
                    placeholderTextColor="#aaa"
                    keyboardType={keyboardType}
                    editable={editable}
                />
            </View>
        </View>
    );

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={{ flex: 1, backgroundColor: Theme.colors.background }}
        >
            <ScrollView contentContainerStyle={styles.container}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                        <ArrowLeft size={22} color={Theme.colors.primary} />
                    </TouchableOpacity>
                    <Text style={styles.title}>Editar Perfil</Text>
                    <View style={{ width: 40 }} />
                </View>

                {/* Avatar Initials */}
                <View style={styles.avatarSection}>
                    <TouchableOpacity style={styles.avatar} onPress={handlePickAvatar} activeOpacity={0.8}>
                        {avatarUri ? (
                            <Image source={{ uri: avatarUri }} style={{ width: 84, height: 84, borderRadius: 42 }} />
                        ) : (
                            <Text style={styles.avatarText}>
                                {name ? name.charAt(0).toUpperCase() : '?'}
                            </Text>
                        )}
                        <View style={styles.cameraBadge}>
                            <Camera size={14} color="white" />
                        </View>
                    </TouchableOpacity>
                    <Text style={styles.avatarHint}>Toque para alterar a foto</Text>
                </View>

                {/* Form */}
                <View style={styles.form}>
                    <Field
                        icon={Mail}
                        label="Email (Não Editável)"
                        value={user?.email || ''}
                        onChangeText={() => { }}
                        placeholder="Seu email"
                        editable={false}
                    />
                    <Field
                        icon={User}
                        label="Nome completo"
                        value={name}
                        onChangeText={setName}
                        placeholder="Nome e apelido"
                    />
                    <Field
                        icon={Phone}
                        label="Telefone"
                        value={phone}
                        onChangeText={setPhone}
                        placeholder="+244 9XX XXX XXX"
                        keyboardType="phone-pad"
                    />
                    <Field
                        icon={MapPin}
                        label="Endereço de Entrega"
                        value={address}
                        onChangeText={setAddress}
                        placeholder="Rua, Bairro, Município"
                    />
                </View>

                {/* Save Button */}
                <TouchableOpacity
                    style={[styles.saveBtn, isSaving && { opacity: 0.6 }]}
                    onPress={handleSave}
                    disabled={isSaving}
                >
                    {isSaving
                        ? <ActivityIndicator color="white" />
                        : <>
                            <Save size={18} color="white" style={{ marginRight: 8 }} />
                            <Text style={styles.saveBtnText}>Guardar Alterações</Text>
                        </>
                    }
                </TouchableOpacity>
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: { paddingTop: 60, paddingHorizontal: 24, paddingBottom: 40 },
    header: {
        flexDirection: 'row', alignItems: 'center',
        justifyContent: 'space-between', marginBottom: 32,
    },
    backBtn: {
        width: 40, height: 40, borderRadius: 12,
        backgroundColor: Theme.colors.surface,
        justifyContent: 'center', alignItems: 'center',
    },
    title: { fontSize: 20, fontWeight: 'bold', color: Theme.colors.primary },
    avatarSection: { alignItems: 'center', marginBottom: 32 },
    avatar: {
        width: 90, height: 90, borderRadius: 45,
        backgroundColor: Theme.colors.surface,
        justifyContent: 'center', alignItems: 'center',
        borderWidth: 3, borderColor: Theme.colors.primary,
        marginBottom: 8,
    },
    avatarText: { fontSize: 36, fontWeight: 'bold', color: Theme.colors.primary },
    avatarHint: { fontSize: 13, color: Theme.colors.textSecondary, marginTop: 4, fontWeight: '500' },
    cameraBadge: {
        position: 'absolute',
        bottom: -2, right: -2,
        backgroundColor: Theme.colors.primary,
        width: 32, height: 32, borderRadius: 16,
        justifyContent: 'center', alignItems: 'center',
        borderWidth: 3, borderColor: Theme.colors.background
    },
    form: { backgroundColor: 'white', borderRadius: 24, padding: 20, marginBottom: 24, ...Theme.shadows?.light },
    fieldContainer: { marginBottom: 20 },
    fieldLabel: { fontSize: 12, fontWeight: '700', color: Theme.colors.textSecondary, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 },
    inputWrapper: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: '#f8f8f8', borderRadius: 14,
        paddingHorizontal: 14, paddingVertical: 12,
        borderWidth: 1, borderColor: '#ebebeb',
    },
    inputIcon: { marginRight: 10 },
    input: { flex: 1, fontSize: 16, color: '#333' },
    saveBtn: {
        backgroundColor: Theme.colors.primary,
        borderRadius: 18, paddingVertical: 16,
        flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
    },
    saveBtnText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
});
