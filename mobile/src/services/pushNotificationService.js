/**
 * PushNotificationService — Puculuxa Mobile
 *
 * expo-notifications foi removido do Expo Go no SDK 53+.
 * Este serviço faz lazy-import condicional para não crashar em Expo Go.
 * Em Development Build, funciona normalmente.
 */

import * as Device from 'expo-device';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { apiClient } from '../config/api.config';

const PUSH_TOKEN_KEY = '@puculuxa:push_token';

// ─── Detect Expo Go ───
const IS_EXPO_GO =
    Constants.appOwnership === 'expo' ||
    Constants.executionEnvironment === 'storeClient';

// ─── Lazy-load notifications module (not available in Expo Go SDK 53+) ───
let Notifications = null;

if (!IS_EXPO_GO) {
    try {
        Notifications = require('expo-notifications');
        // Handler global (mostrar notificação em foreground)
        Notifications.setNotificationHandler({
            handleNotification: async () => ({
                shouldShowBanner: true,
                shouldShowList: true,
                shouldPlaySound: true,
                shouldSetBadge: true,
            }),
        });
    } catch (e) {
        console.warn('[Push] expo-notifications não disponível neste ambiente:', e.message);
    }
}

// ─── Registar permissões e obter Push Token ───
export async function registerForPushNotificationsAsync() {
    if (IS_EXPO_GO || !Notifications) {
        console.log('[Push] Skipping push registration in Expo Go (SDK 53+)');
        return null;
    }

    if (!Device.isDevice) {
        console.warn('[Push] Notificações apenas funcionam em dispositivo real.');
        return null;
    }

    try {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;

        if (existingStatus !== 'granted') {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
        }

        if (finalStatus !== 'granted') {
            console.warn('[Push] Permissão negada pelo utilizador.');
            return null;
        }

        // Canal Android (obrigatório a partir de Android 8+)
        if (Platform.OS === 'android') {
            await Notifications.setNotificationChannelAsync('puculuxa_default', {
                name: 'Puculuxa',
                importance: Notifications.AndroidImportance.MAX,
                vibrationPattern: [0, 250, 250, 250],
                lightColor: '#F97316',
                sound: 'default',
            });
            await Notifications.setNotificationChannelAsync('puculuxa_reminders', {
                name: 'Lembretes de Eventos',
                importance: Notifications.AndroidImportance.HIGH,
                vibrationPattern: [0, 500, 250, 500],
                lightColor: '#F97316',
                sound: 'default',
            });
        }

        // Obter ou usar token em cache
        const cached = await AsyncStorage.getItem(PUSH_TOKEN_KEY);
        if (cached) return cached;

        const { data: token } = await Notifications.getExpoPushTokenAsync({
            projectId: process.env.EXPO_PUBLIC_PROJECT_ID || 'puculuxa',
        });

        await AsyncStorage.setItem(PUSH_TOKEN_KEY, token);
        return token;
    } catch (err) {
        console.error('[Push] Erro ao registar notificações:', err.message);
        return null;
    }
}

// ─── Enviar token ao backend para registo ───
export async function syncPushTokenWithBackend(token) {
    try {
        await apiClient.post('/auth/push-token', { token });
        console.log('[Push] Token sincronizado com backend:', token.substring(0, 20) + '...');
    } catch (err) {
        console.error('[Push] Falha ao sincronizar token:', err);
    }
}

// ─── Inicializar tudo (chamar no App.js / root layout) ───
export async function initPushNotifications() {
    if (IS_EXPO_GO || !Notifications) {
        console.log('[Push] Expo Go detectado — push notifications desactivadas. Usa development build para testar push.');
        return;
    }

    const token = await registerForPushNotificationsAsync();
    if (token) {
        await syncPushTokenWithBackend(token);
    }
}

// ─── Listener de notificação recebida (foreground) ───
export function addNotificationReceivedListener(handler) {
    if (!Notifications) return { remove: () => {} };
    return Notifications.addNotificationReceivedListener(handler);
}

// ─── Listener de resposta (utilizador tocou na notificação) ───
export function addNotificationResponseListener(handler) {
    if (!Notifications) return { remove: () => {} };
    return Notifications.addNotificationResponseReceivedListener(handler);
}

// ─── Limpar badge ───
export async function clearBadge() {
    if (!Notifications) return;
    await Notifications.setBadgeCountAsync(0);
}

// ─── Agendar notificação local (teste / fallback) ───
export async function scheduleLocalNotification(title, body, secondsFromNow = 5) {
    if (!Notifications) return;
    await Notifications.scheduleNotificationAsync({
        content: { title, body, sound: 'default', color: '#F97316' },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: secondsFromNow },
    });
}
