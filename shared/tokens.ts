/**
 * Design Tokens - Puculuxa Cakes & Catering
 * Centralized source of truth for brand identity.
 */

export const COLORS = {
    // Primárias (Logo)
    primary: '#FF8C42',      // Laranja Vibrante
    secondary: '#8BAE3E',    // Verde Lima
    accent: '#6B8E23',       // Verde Oliva

    // Gradientes
    gradientStart: '#FF8C42',
    gradientMid: '#FFD700',  // Amarelo-Ouro
    gradientEnd: '#8BAE3E',

    // Complementares
    background: '#FFFEF7',   // Branco Cremoso (Baunilha)
    surface: '#FFF8E1',      // Bege Suave
    detail: '#FFD8B8',       // Laranja Pastel
    positive: '#E8F5E9',     // Verde Menta
    textSecondary: '#8D8174', // Cinza Quente
    textPrimary: '#6B8E23',   // Verde Oliva (para subtítulos)
    white: '#FFFFFF',
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
