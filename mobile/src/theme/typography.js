/**
 * Tipografia Estruturada — Puculuxa Premium Pass
 * Hierarquia funcional clara: cada nível tem propósito.
 */

import { TOKENS } from './tokens';

export const textStyles = {
    h1: {
        fontFamily: 'Fraunces_700Bold',
        fontSize: TOKENS.typographyScale.h1.fontSize,
        lineHeight: TOKENS.typographyScale.h1.lineHeight,
        letterSpacing: TOKENS.typographyScale.h1.letterSpacing,
        color: TOKENS.colors.text,
    },
    h2: {
        fontFamily: 'Fraunces_600SemiBold',
        fontSize: TOKENS.typographyScale.h2.fontSize,
        lineHeight: TOKENS.typographyScale.h2.lineHeight,
        letterSpacing: TOKENS.typographyScale.h2.letterSpacing,
        color: TOKENS.colors.text,
    },
    h3: {
        fontFamily: 'Fraunces_600SemiBold',
        fontSize: TOKENS.typographyScale.h3.fontSize,
        lineHeight: TOKENS.typographyScale.h3.lineHeight,
        letterSpacing: TOKENS.typographyScale.h3.letterSpacing,
        color: TOKENS.colors.text,
    },
    body: {
        fontFamily: 'Inter_400Regular',
        fontSize: TOKENS.typographyScale.body.fontSize,
        lineHeight: TOKENS.typographyScale.body.lineHeight,
        letterSpacing: TOKENS.typographyScale.body.letterSpacing,
        color: TOKENS.colors.text,
    },
    bodyMedium: {
        fontFamily: 'Inter_500Medium',
        fontSize: TOKENS.typographyScale.body.fontSize,
        lineHeight: TOKENS.typographyScale.body.lineHeight,
        letterSpacing: TOKENS.typographyScale.body.letterSpacing,
        color: TOKENS.colors.text,
    },
    bodyBold: {
        fontFamily: 'Inter_700Bold',
        fontSize: TOKENS.typographyScale.body.fontSize,
        lineHeight: TOKENS.typographyScale.body.lineHeight,
        letterSpacing: TOKENS.typographyScale.body.letterSpacing,
        color: TOKENS.colors.text,
    },
    small: {
        fontFamily: 'Inter_400Regular',
        fontSize: TOKENS.typographyScale.small.fontSize,
        lineHeight: TOKENS.typographyScale.small.lineHeight,
        letterSpacing: TOKENS.typographyScale.small.letterSpacing,
        color: TOKENS.colors.muted,
    },
    caption: {
        fontFamily: 'Inter_500Medium',
        fontSize: TOKENS.typographyScale.caption.fontSize,
        lineHeight: TOKENS.typographyScale.caption.lineHeight,
        letterSpacing: TOKENS.typographyScale.caption.letterSpacing,
        color: TOKENS.colors.muted,
        textTransform: 'uppercase',
    },
};

// Aliases para legacy compatibility
export const T = {
    brand: textStyles.h1,
    h1: textStyles.h1,
    h2: textStyles.h2,
    h3: textStyles.h3,
    body: textStyles.body,
    bodySmall: textStyles.small,
    label: textStyles.caption,
    price: { ...textStyles.h2, color: TOKENS.colors.gold },
    priceLarge: { ...textStyles.h1, color: TOKENS.colors.gold },
    button: { ...textStyles.bodyMedium, color: TOKENS.colors.textInverse },
    buttonSmall: { ...textStyles.small, color: TOKENS.colors.textInverse, fontFamily: 'Inter_500Medium' },
};
