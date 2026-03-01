import { Platform } from 'react-native';
import * as Device from 'expo-device';

// PONTO ÚNICO DE CONFIGURAÇÃO DE REDE
// O teu IP local atual. Sempre que reiniciares o router e o IP mudar, muda apenas aqui.
const LOCAL_DEV_IP = '192.168.0.21';
const API_PORT = '4001';

const getBaseUrl = () => {
    // 1. Se for uma release em código de produção instalada da store
    if (!__DEV__) {
        return 'https://api.puculuxa.com/api'; // (Substituir pela URL final de prod)
    }

    // 2. Android Emulator (o emulador não conhece o "localhost", usa este túnel especial)
    if (Platform.OS === 'android' && !Device.isDevice) {
        return `http://10.0.2.2:${API_PORT}/api`;
    }

    // 3. iOS Simulator ou Telemóvel Físico via Wi-Fi conectando ao PC (Expo Go)
    return `http://${LOCAL_DEV_IP}:${API_PORT}/api`;
};

export const API_CONFIG = {
    BASE_URL: getBaseUrl(),
};
