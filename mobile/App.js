import React, { useState, useEffect } from 'react';
import { View, Text, Platform, LogBox } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
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

// Screens
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

// Core
import { useAuthStore } from './src/store/authStore';
import { QueryProvider } from './src/providers/QueryProvider';
import { ErrorBoundary } from './src/components/ErrorBoundary';
import { ToastProvider } from './src/components/ui/Toast';
import { CustomTabBar } from './src/components/navigation/CustomTabBar';
import { Theme } from './src/theme';

import * as Device from 'expo-device';
import Constants from 'expo-constants';

LogBox.ignoreLogs([
    'Unable to activate keep awake',
    'InteractionManager has been deprecated',
]);

// === Push Notifications ===
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

async function registerForPushNotificationsAsync() {
    if (!Notifications || isExpoGo || !Device.isDevice) return null;
    try {
        const { status } = await Notifications.getPermissionsAsync();
        let finalStatus = status;
        if (status !== 'granted') {
            const { status: s } = await Notifications.requestPermissionsAsync();
            finalStatus = s;
        }
        if (finalStatus !== 'granted') return null;
        const token = (await Notifications.getExpoPushTokenAsync({ projectId: 'puculuxa-mobile' })).data;
        if (Platform.OS === 'android') {
            Notifications.setNotificationChannelAsync('default', {
                name: 'default',
                importance: Notifications.AndroidImportance.MAX,
                vibrationPattern: [0, 250, 250, 250],
            });
        }
        return token;
    } catch {
        return null;
    }
}

// === Navigators ===
const AuthStack = createStackNavigator();
const HomeStack = createStackNavigator();
const CatalogStack = createStackNavigator();
const OrdersStack = createStackNavigator();
const ProfileStack = createStackNavigator();
const Tab = createBottomTabNavigator();

const screenOptions = { headerShown: false };

// Tab Stacks
function HomeTabScreen() {
    return (
        <HomeStack.Navigator screenOptions={screenOptions}>
            <HomeStack.Screen name="Home" component={HomeScreen} />
            <HomeStack.Screen name="ProductDetail" component={ProductDetailScreen} />
            <HomeStack.Screen name="Cart" component={CartScreen} />
            <HomeStack.Screen name="Payment" component={PaymentScreen} />
            <HomeStack.Screen name="CakeDesigner" component={CakeDesignerScreen} />
            <HomeStack.Screen name="Chat" component={ChatScreen} />
        </HomeStack.Navigator>
    );
}

function CatalogTabScreen() {
    return (
        <CatalogStack.Navigator screenOptions={screenOptions}>
            <CatalogStack.Screen name="Catalog" component={HomeScreen} />
            <CatalogStack.Screen name="CatalogProductDetail" component={ProductDetailScreen} />
        </CatalogStack.Navigator>
    );
}

function OrdersTabScreen() {
    return (
        <OrdersStack.Navigator screenOptions={screenOptions}>
            <OrdersStack.Screen name="OrderHistory" component={OrderHistoryScreen} />
            <OrdersStack.Screen name="OrderTracking" component={OrderTrackingScreen} />
        </OrdersStack.Navigator>
    );
}

function ProfileTabScreen() {
    return (
        <ProfileStack.Navigator screenOptions={screenOptions}>
            <ProfileStack.Screen name="Profile" component={ProfileScreen} />
            <ProfileStack.Screen name="EditProfile" component={EditProfileScreen} />
            <ProfileStack.Screen name="Favorites" component={FavoritesScreen} />
            <ProfileStack.Screen name="Notifications" component={NotificationsScreen} />
        </ProfileStack.Navigator>
    );
}

// Main App Tabs
function AppTabs() {
    return (
        <Tab.Navigator
            tabBar={(props) => <CustomTabBar {...props} />}
            screenOptions={{ headerShown: false }}
        >
            <Tab.Screen name="HomeTab" component={HomeTabScreen} />
            <Tab.Screen name="CatalogTab" component={CatalogTabScreen} />
            <Tab.Screen name="QuotationTab" component={QuotationWizard} />
            <Tab.Screen name="OrdersTab" component={OrdersTabScreen} />
            <Tab.Screen name="ProfileTab" component={ProfileTabScreen} />
        </Tab.Navigator>
    );
}

// Auth Stack
function AuthNavigator() {
    return (
        <AuthStack.Navigator screenOptions={screenOptions}>
            <AuthStack.Screen name="Splash" component={SplashScreen} />
            <AuthStack.Screen name="Login" component={LoginScreen} />
            <AuthStack.Screen name="Register" component={RegisterScreen} />
        </AuthStack.Navigator>
    );
}

// === App Root ===
export default function App() {
    const [fontsLoaded, setFontsLoaded] = useState(false);
    const { isAuthenticated, restoreSession } = useAuthStore();

    useEffect(() => {
        async function init() {
            try {
                await Font.loadAsync({
                    Pacifico_400Regular,
                    Merriweather_400Regular,
                    Merriweather_700Bold,
                    Poppins_400Regular,
                    Poppins_500Medium,
                    Poppins_600SemiBold,
                });
                setFontsLoaded(true);
            } catch (e) {
                console.warn('Font loading error:', e);
                setFontsLoaded(true); // Proceed with system fonts
            }
        }
        init();
        restoreSession();
        registerForPushNotificationsAsync();
    }, []);

    if (!fontsLoaded) return null;

    return (
        <ErrorBoundary>
            <SafeAreaProvider>
                <QueryProvider>
                    <ToastProvider>
                        <NavigationContainer>
                            {isAuthenticated ? <AppTabs /> : <AuthNavigator />}
                        </NavigationContainer>
                    </ToastProvider>
                </QueryProvider>
            </SafeAreaProvider>
        </ErrorBoundary>
    );
}
