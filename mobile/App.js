import React, { useState, useEffect } from 'react';
import { View, Text, Platform, LogBox } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as Font from 'expo-font';
import {
    Inter_400Regular,
    Inter_500Medium,
    Inter_700Bold,
} from '@expo-google-fonts/inter';
import {
    Fraunces_600SemiBold,
    Fraunces_700Bold,
} from '@expo-google-fonts/fraunces';
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

import { initPushNotifications, addNotificationReceivedListener, addNotificationResponseListener, clearBadge } from './src/services/pushNotificationService';

LogBox.ignoreLogs([
    'Unable to activate keep awake',
    'InteractionManager has been deprecated',
]);



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

    // Push notifications: init after auth, sync token with backend
    useEffect(() => {
        if (isAuthenticated) {
            initPushNotifications().catch((e) =>
                console.log('[Push] Init skipped:', e.message)
            );
            clearBadge().catch(() => { });
        }
    }, [isAuthenticated]);

    // Notification listeners
    useEffect(() => {
        const receivedSub = addNotificationReceivedListener((notification) => {
            console.log('[Push] Notificação recebida:', notification.request.content.title);
        });
        const responseSub = addNotificationResponseListener((response) => {
            console.log('[Push] Utilizador tocou na notificação:', response.notification.request.content.title);
            // TODO: navegar para ecrã relevante com base em data.screen
        });
        return () => {
            receivedSub.remove();
            responseSub.remove();
        };
    }, []);

    useEffect(() => {
        async function init() {
            try {
                await Font.loadAsync({
                    Inter_400Regular,
                    Inter_500Medium,
                    Inter_700Bold,
                    Fraunces_600SemiBold,
                    Fraunces_700Bold,
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
