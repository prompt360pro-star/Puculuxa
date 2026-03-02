/**
 * Offline Queue — Puculuxa
 * Guarda orçamentos quando não há internet e reenvia automaticamente.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';

const QUEUE_KEY = 'puculuxa_pending_quotations';

/**
 * Adiciona um orçamento à fila offline.
 */
export async function enqueueQuotation(data) {
    const pending = JSON.parse(await AsyncStorage.getItem(QUEUE_KEY) || '[]');
    pending.push({ ...data, queuedAt: new Date().toISOString() });
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(pending));
}

/**
 * Busca todos os orçamentos na fila.
 */
export async function getPendingQuotations() {
    return JSON.parse(await AsyncStorage.getItem(QUEUE_KEY) || '[]');
}

/**
 * Remove um orçamento da fila após envio com sucesso.
 */
export async function removeFromQueue(index) {
    const pending = JSON.parse(await AsyncStorage.getItem(QUEUE_KEY) || '[]');
    pending.splice(index, 1);
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(pending));
}

/**
 * Limpa toda a fila.
 */
export async function clearQueue() {
    await AsyncStorage.removeItem(QUEUE_KEY);
}

/**
 * Tenta reenviar todos os orçamentos pendentes.
 * Retorna { sent: number, failed: number }
 *
 * @param {function} submitFn - Função que submete o orçamento à API (ex: ApiService.postQuotation)
 */
export async function flushQueue(submitFn) {
    const pending = await getPendingQuotations();
    if (pending.length === 0) return { sent: 0, failed: 0 };

    let sent = 0;
    let failed = 0;

    for (let i = pending.length - 1; i >= 0; i--) {
        try {
            await submitFn(pending[i]);
            await removeFromQueue(i);
            sent++;
        } catch {
            failed++;
        }
    }

    return { sent, failed };
}

/**
 * Inicia listener de conectividade.
 * Quando a internet volta, reenvia orçamentos pendentes.
 *
 * @param {function} submitFn - Função que submete o orçamento à API
 * @param {function} onFlushed - Callback chamado quando orçamentos são reenviados
 * @returns {function} unsubscribe
 */
export function startOfflineListener(submitFn, onFlushed) {
    let wasOffline = false;

    return NetInfo.addEventListener(async (state) => {
        if (state.isConnected && wasOffline) {
            const result = await flushQueue(submitFn);
            if (result.sent > 0 && onFlushed) {
                onFlushed(result);
            }
        }
        wasOffline = !state.isConnected;
    });
}
