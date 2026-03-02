import { COLORS, SPACING, RADIUS, ELEVATION, SHADOWS, FONTS } from '@puculuxa/shared';
import { T } from './typography';

export const Theme = {
    colors: COLORS,
    spacing: SPACING,
    radius: RADIUS,
    elevation: ELEVATION,
    shadows: SHADOWS,
    fonts: {
        title: 'Pacifico_400Regular',
        subtitle: 'Merriweather_700Bold',
        body: 'Poppins_400Regular',
        medium: 'Poppins_500Medium',
        semibold: 'Poppins_600SemiBold',
    },
    typography: T,
};

export { T } from './typography';
