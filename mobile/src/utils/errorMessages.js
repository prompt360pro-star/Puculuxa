/**
 * Mensagens de Erro Humanizadas — Puculuxa
 * Traduz erros técnicos em linguagem amigável (PT-AO).
 */

const ERROR_MAP = {
    'Network request failed': 'Sem ligação à internet. Verifica o teu Wi-Fi.',
    'Invalid credentials': 'Email ou password incorretos.',
    'Unauthorized': 'A sessão expirou. Faz login novamente.',
    'Este e-mail já está registado': 'Este email já tem conta. Faz login!',
    'Token inválido ou expirado': 'A sessão expirou. Faz login novamente.',
    'Forbidden resource': 'Não tens permissão para esta acção.',
    'Internal server error': 'Erro no servidor. A nossa equipa já foi notificada.',
    'Too Many Requests': 'Muitas tentativas. Espera um momento e tenta novamente.',
    'QUEUED': 'Sem internet. O pedido será enviado quando a ligação voltar.',
    'timeout': 'O pedido demorou demasiado. Tenta novamente.',
};

export function humanizeError(error) {
    const msg = error?.message || error?.response?.data?.message || String(error);
    const key = Object.keys(ERROR_MAP).find(k => msg.includes(k));
    return ERROR_MAP[key] || 'Ocorreu um erro. Tenta novamente.';
}

/**
 * Formata preço em Kwanza angolano.
 * Ex: 12500 → "Kz 12.500"
 */
export function formatKz(value) {
    if (value == null || isNaN(value)) return 'Kz 0';
    const num = Math.round(Number(value));
    return `Kz ${num.toLocaleString('pt-AO').replace(/,/g, '.')}`;
}

/**
 * Formata data em formato angolano.
 * Ex: new Date() → "12 de Janeiro de 2026"
 */
export function formatDateAO(date) {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleDateString('pt-PT', { day: 'numeric', month: 'long', year: 'numeric' });
}

/**
 * Formata número de telefone angolano.
 * Ex: "923456789" → "+244 923 456 789"
 */
export function formatPhoneAO(phone) {
    if (!phone) return '';
    const digits = phone.replace(/\D/g, '').replace(/^244/, '');
    if (digits.length !== 9) return phone;
    return `+244 ${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
}
