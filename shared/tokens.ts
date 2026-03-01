/**
 * Design Tokens - Puculuxa Cakes & Catering
 * Centralized source of truth for brand identity.
 */

export const COLORS = {
    // Primárias (Logo adaptado para Dark Premium)
    primary: '#D4AF37',      // Dourado Premium
    secondary: '#1C1C1E',    // Cinza Muito Escuro
    accent: '#B8860B',       // Dark Goldenrod

    // Gradientes
    gradientStart: '#D4AF37',
    gradientMid: '#B8860B',
    gradientEnd: '#8B6508',

    // Complementares
    background: '#121212',   // Fundo Preencido
    surface: '#1E1E1E',      // Fundo Cartões/Containers
    detail: '#2C2C2E',       // Detalhes / Borders
    positive: '#223322',     // Verde Dark para Sucesso
    textSecondary: '#A0A0A5', // Cinza Claro (Readable on Dark)
    textPrimary: '#FFFFFF',   // Branco Puro
    white: '#1E1E1E',         // Revestindo White com Surface para adaptação rápida
    black: '#000000',
};

export const SPACING = {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    xxl: 32,
    huge: 48,
};

export const RADIUS = {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    full: 9999,
};

export const SHADOWS = {
    light: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 2,
    },
    medium: {
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 4,
    },
};

export const FONTS = {
    // Consumer / Brand Fonts
    brand: 'Pacifico',
    brandSecondary: 'Merriweather',
    body: 'Poppins',

    // Admin / UI Fonts
    ui: 'Inter',
    uiDisplay: 'Playfair Display',
};
