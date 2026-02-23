import { COLORS, SPACING, RADIUS, SHADOWS, FONTS } from '@puculuxa/shared';

export const Theme = {
    colors: COLORS,
    spacing: SPACING,
    radius: RADIUS,
    shadows: SHADOWS,
    fonts: {
        title: 'Pacifico_400Regular',     // Mapped to loaded font
        subtitle: 'Merriweather_700Bold', // Mapped to loaded font
        body: 'Poppins_400Regular',       // Mapped to loaded font
        // We could use FONTS.brand here if we mapped the string 'Pacifico' to the loaded font object key dynamicallly
        // For now, we keep the mapping explicit but could verify against FONTS.brand
    },
};
