import { COLORS, SPACING, RADIUS, ELEVATION, SHADOWS } from '@puculuxa/shared';
import { textStyles, T } from './typography';
import { TOKENS } from './tokens';

// Mantém o shape da Theme clássica (legado) + injeta TOKENS novos
export const Theme = {
    colors: { ...COLORS, ...TOKENS.colors },
    spacing: { ...SPACING, ...TOKENS.spacing },
    radius: { ...RADIUS, ...TOKENS.radius },
    elevation: ELEVATION,
    shadowElite: TOKENS.shadowElite,
    shadows: SHADOWS,
    fonts: {
        title: 'Fraunces_700Bold',
        subtitle: 'Fraunces_600SemiBold',
        body: 'Inter_400Regular',
        medium: 'Inter_500Medium',
        semibold: 'Inter_700Bold', // mapped to bold to keep consistency with the new stack
    },
    typography: T,
};

export { T, textStyles, TOKENS };
