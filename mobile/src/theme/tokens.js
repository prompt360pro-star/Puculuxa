/**
 * Premium Tokens — Puculuxa (Noir Patisserie Ledger)
 * Geometria, Cores, Espaçamento e Tipografia de Base
 */

export const TOKENS = {
    colors: {
        background: '#0B0B0C',
        surface: '#131316',
        surface2: '#18181B',
        border: '#242428',
        text: '#F5F5F5',
        muted: '#A1A1AA',
        red: '#DC2626',     // Puculuxa Core
        gold: '#C6A75E',    // Luxo/Acentos
        success: '#10B981',
        warning: '#F59E0B',
        danger: '#EF4444',
        
        // Aliases para compatibilidade legada
        primary: '#DC2626',
        primaryDark: '#B91C1C',
        secondary: '#C6A75E',
        textPrimary: '#F5F5F5',
        textSecondary: '#A1A1AA',
        textTertiary: '#6B7280',
        textInverse: '#FFFFFF',
    },
    radius: {
        card: 20,
        soft: 12,
        pill: 999,
        // Legado
        sm: 8,
        md: 12,
        lg: 20,
        full: 9999,
    },
    spacing: {
        px: 1,
        0: 0,
        1: 4,
        2: 8,
        3: 12,
        4: 16,
        5: 20,
        6: 24,
        8: 32,
        10: 40,
        12: 48,
        16: 64,
    },
    shadowElite: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    typographyScale: {
        h1: { fontSize: 32, lineHeight: 40, letterSpacing: -0.5 },
        h2: { fontSize: 24, lineHeight: 32, letterSpacing: -0.3 },
        h3: { fontSize: 18, lineHeight: 26, letterSpacing: -0.1 },
        body: { fontSize: 15, lineHeight: 24, letterSpacing: 0 },
        small: { fontSize: 13, lineHeight: 20, letterSpacing: 0 },
        caption: { fontSize: 11, lineHeight: 16, letterSpacing: 0.5 },
    }
};
