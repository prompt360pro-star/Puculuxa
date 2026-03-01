import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, Platform, LogBox } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import * as Font from 'expo-font';
import {
    Pacifico_400Regular
} from '@expo-google-fonts/pacifico';
import {
    Merriweather_400Regular,
    Merriweather_700Bold
} from '@expo-google-fonts/merriweather';
import {
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold
} from '@expo-google-fonts/poppins';

import { SplashScreen } from './src/screens/SplashScreen';
import { HomeScreen } from './src/screens/HomeScreen';
import { QuotationWizard } from './src/screens/QuotationWizard';
import { OrderHistoryScreen } from './src/screens/OrderHistoryScreen';
import { ProfileScreen } from './src/screens/ProfileScreen';
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import { EditProfileScreen } from './src/screens/EditProfileScreen';
import { FavoritesScreen } from './src/screens/FavoritesScreen';
import { ProductDetailScreen } from './src/screens/ProductDetailScreen';
import { CartScreen } from './src/screens/CartScreen';
import { ChatScreen } from './src/screens/ChatScreen';
import { PaymentScreen } from './src/screens/PaymentScreen';
import { CakeDesignerScreen } from './src/screens/CakeDesignerScreen';
import { OrderTrackingScreen } from './src/screens/OrderTrackingScreen';
import { NotificationsScreen } from './src/screens/NotificationsScreen';
import { useAuthStore } from './src/store/authStore';
import { QueryProvider } from './src/providers/QueryProvider';
import * as Device from 'expo-device';
import Constants from 'expo-constants';

LogBox.ignoreLogs([
    'Unable to activate keep awake',
    'InteractionManager has been deprecated',
]);

const isExpoGo = Constants.appOwnership === 'expo';
let Notifications = null;

if (!isExpoGo) {
    Notifications = require('expo-notifications');
}

if (Notifications) {
    Notifications.setNotificationHandler({
        handleNotification: async () => ({
            shouldShowAlert: true,
            shouldPlaySound: true,
            shouldSetBadge: false,
        }),
    });
}

// Configure simple notification permissions
async function registerForPushNotificationsAsync() {
    let token;

    if (!Notifications) {
        console.log('Push notifications indisponíveis no Expo Go');
        return null;
    }

    if (!isExpoGo && Device.isDevice) {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;
        if (existingStatus !== 'granted') {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
        }
        if (finalStatus !== 'granted') {
            console.log('Failed to get push token for push notification!');
            return;
        }
        token = (await Notifications.getExpoPushTokenAsync({
            projectId: 'puculuxa-mobile', // dummy project id if not using EAS
        })).data;
        console.log('Expo Push Token:', token);

        if (Platform.OS === 'android') {
            Notifications.setNotificationChannelAsync('default', {
                name: 'default',
                importance: Notifications.AndroidImportance.MAX,
                vibrationPattern: [0, 250, 250, 250],
                lightColor: '#FF231F7C',
            });
        }
    } else {
        console.log('Push notifications desativadas silenciosamente (Executando no Expo Go ou Emulador).');
    }
    return token;
}

const Stack = createStackNavigator();

export default function App() {
    const [fontsLoaded, setFontsLoaded] = useState(false);
    const { isAuthenticated, restoreSession } = useAuthStore();

    useEffect(() => {
        async function loadFonts() {
            try {
                await Font.loadAsync({
                    Pacifico_400Regular,
                    Merriweather_400Regular,
                    Merriweather_700Bold,
                    Poppins_400Regular,
                    Poppins_500Medium,
                    Poppins_600SemiBold
                });
                setFontsLoaded(true);
            } catch (e) {
                console.warn(e);
            }
        }
        loadFonts();
        restoreSession();

        // Setup Push Notifications
        registerForPushNotificationsAsync();
    }, []);

    if (!fontsLoaded) {
        return null;
    }

    return (
        <QueryProvider>
            <NavigationContainer>
                <Stack.Navigator screenOptions={{ headerShown: false }}>
                    {!isAuthenticated ? (
                        // Auth Stack
                        <>
                            <Stack.Screen name="Splash" component={SplashScreen} />
                            <Stack.Screen name="Login" component={LoginScreen} />
                            <Stack.Screen name="Register" component={RegisterScreen} />
                        </>
                    ) : (
                        // App Stack
                        <>
                            <Stack.Screen name="Home" component={HomeScreen} />
                            <Stack.Screen name="Quotation" component={QuotationWizard} />
                            <Stack.Screen name="OrderHistory" component={OrderHistoryScreen} />
                            <Stack.Screen name="Profile" component={ProfileScreen} />
                            <Stack.Screen name="EditProfile" component={EditProfileScreen} />
                            <Stack.Screen name="Favorites" component={FavoritesScreen} />
                            <Stack.Screen name="Cart" component={CartScreen} />
                            <Stack.Screen name="Payment" component={PaymentScreen} />
                            <Stack.Screen name="Chat" component={ChatScreen} />
                            <Stack.Screen name="CakeDesigner" component={CakeDesignerScreen} />
                            <Stack.Screen name="ProductDetail" component={ProductDetailScreen} />
                            <Stack.Screen name="OrderTracking" component={OrderTrackingScreen} />
                            <Stack.Screen name="Notifications" component={NotificationsScreen} />
                        </>
                    )}
                </Stack.Navigator>
            </NavigationContainer>
        </QueryProvider>
    );
}
