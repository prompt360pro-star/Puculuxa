"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FONTS = exports.SHADOWS = exports.ELEVATION = exports.RADIUS = exports.SPACING = exports.COLORS = void 0;
exports.COLORS = {
    primary: '#FF8C42',
    primaryDark: '#E8721F',
    primaryLight: '#FFB380',
    primaryGhost: '#FFF3EC',
    secondary: '#8BAE3E',
    secondaryDark: '#6B8E23',
    secondaryLight: '#B5D16A',
    secondaryGhost: '#F0F7E0',
    gold: '#FFD700',
    goldLight: '#FFF4B0',
    gradientStart: '#FF8C42',
    gradientMid: '#E8721F',
    gradientEnd: '#D4651A',
    background: '#FFFEF7',
    surface: '#FFF8E1',
    surfaceElevated: '#FFFFFF',
    border: '#F0EDE3',
    borderStrong: '#E0D9C8',
    textHero: '#1A1209',
    textPrimary: '#3D3020',
    textSecondary: '#8D8174',
    textTertiary: '#B8B0A5',
    textInverse: '#FFFFFF',
    textBrand: '#FF8C42',
    success: '#4CAF50',
    successBg: '#E8F5E9',
    warning: '#FF9800',
    warningBg: '#FFF3E0',
    error: '#F44336',
    errorBg: '#FFEBEE',
    info: '#2196F3',
    infoBg: '#E3F2FD',
    overlay: 'rgba(26, 18, 9, 0.6)',
    white: '#FFFFFF',
    black: '#000000',
    transparent: 'transparent',
    whatsapp: '#25D366',
};
exports.SPACING = {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    xxl: 32,
    huge: 48,
};
exports.RADIUS = {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    xxl: 32,
    full: 9999,
};
exports.ELEVATION = {
    none: {},
    xs: {
        shadowColor: '#C4A882',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.10,
        shadowRadius: 4,
        elevation: 1,
    },
    sm: {
        shadowColor: '#C4A882',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.12,
        shadowRadius: 8,
        elevation: 2,
    },
    md: {
        shadowColor: '#FF8C42',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 16,
        elevation: 4,
    },
    lg: {
        shadowColor: '#FF8C42',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.20,
        shadowRadius: 24,
        elevation: 8,
    },
};
exports.SHADOWS = {
    light: exports.ELEVATION.sm,
    medium: exports.ELEVATION.md,
};
exports.FONTS = {
    brand: 'Pacifico',
    brandSecondary: 'Merriweather',
    body: 'Poppins',
    ui: 'Inter',
    uiDisplay: 'Playfair Display',
};
//# sourceMappingURL=tokens.js.map