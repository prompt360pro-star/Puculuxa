import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text } from 'react-native';
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
import { ProfileScreen } from './src/screens/ProfileScreen';
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import { useAuthStore } from './src/store/authStore';

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
    }, []);

    if (!fontsLoaded) {
        return null;
    }

    return (
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
                        <Stack.Screen name="Profile" component={ProfileScreen} />
                    </>
                )}
            </Stack.Navigator>
        </NavigationContainer>
    );
}
