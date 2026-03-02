import React, { useState, useRef, useEffect } from 'react';
import { View, TextInput, Text, StyleSheet, Animated } from 'react-native';
import { AlertCircle, CheckCircle, Eye, EyeOff } from 'lucide-react-native';
import { TouchableOpacity } from 'react-native';
import { Theme, T } from '../../theme';

export const PremiumInput = ({
    label,
    value,
    onChangeText,
    placeholder,
    error,
    valid,
    icon,
    secureTextEntry,
    keyboardType,
    maxLength,
    multiline,
    style,
    ...rest
}) => {
    const [focused, setFocused] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const labelAnim = useRef(new Animated.Value(value ? 1 : 0)).current;
    const borderAnim = useRef(new Animated.Value(0)).current;
    const errorAnim = useRef(new Animated.Value(0)).current;

    const hasValue = value && value.length > 0;
    const isLifted = focused || hasValue;

    useEffect(() => {
        Animated.timing(labelAnim, {
            toValue: isLifted ? 1 : 0,
            duration: 200,
            useNativeDriver: false,
        }).start();
        Animated.timing(borderAnim, {
            toValue: focused ? 1 : 0,
            duration: 200,
            useNativeDriver: false,
        }).start();
    }, [focused, hasValue]);

    useEffect(() => {
        Animated.timing(errorAnim, {
            toValue: error ? 1 : 0,
            duration: 200,
            useNativeDriver: false,
        }).start();
    }, [error]);

    const labelTranslateY = labelAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [16, -8],
    });
    const labelScale = labelAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [1, 0.85],
    });
    const labelColor = labelAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [Theme.colors.textTertiary, error ? Theme.colors.error : Theme.colors.primary],
    });
    const borderColor = borderAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [error ? Theme.colors.error : Theme.colors.borderStrong, Theme.colors.primary],
    });
    const errorTranslateY = errorAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [-4, 0],
    });

    const iconColor = focused ? Theme.colors.primary : Theme.colors.textTertiary;

    return (
        <View style={[styles.wrapper, style]}>
            <Animated.View style={[styles.container, { borderColor }]}>
                {icon ? (
                    <View style={styles.iconLeft}>
                        {React.cloneElement(icon, { size: 18, color: iconColor })}
                    </View>
                ) : null}
                <View style={styles.inputWrap}>
                    {label ? (
                        <Animated.Text
                            style={[
                                styles.label,
                                {
                                    transform: [{ translateY: labelTranslateY }, { scale: labelScale }],
                                    color: labelColor,
                                },
                            ]}
                            pointerEvents="none"
                        >
                            {label}
                        </Animated.Text>
                    ) : null}
                    <TextInput
                        style={[styles.input, multiline ? styles.multiline : null]}
                        value={value}
                        onChangeText={onChangeText}
                        placeholder={isLifted ? placeholder : ''}
                        placeholderTextColor={Theme.colors.textTertiary}
                        onFocus={() => setFocused(true)}
                        onBlur={() => setFocused(false)}
                        secureTextEntry={secureTextEntry && !showPassword}
                        keyboardType={keyboardType}
                        maxLength={maxLength}
                        multiline={multiline}
                        accessibilityLabel={label || placeholder}
                        {...rest}
                    />
                </View>
                {secureTextEntry ? (
                    <TouchableOpacity
                        style={styles.iconRight}
                        onPress={() => setShowPassword(!showPassword)}
                        accessibilityRole="button"
                        accessibilityLabel={showPassword ? 'Esconder password' : 'Mostrar password'}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                        {showPassword
                            ? <EyeOff size={18} color={Theme.colors.textTertiary} />
                            : <Eye size={18} color={Theme.colors.textTertiary} />}
                    </TouchableOpacity>
                ) : null}
                {!focused && valid && !error ? (
                    <View style={styles.iconRight}>
                        <CheckCircle size={18} color={Theme.colors.success} />
                    </View>
                ) : null}
            </Animated.View>
            {error ? (
                <Animated.View style={[styles.errorRow, { opacity: errorAnim, transform: [{ translateY: errorTranslateY }] }]}>
                    <AlertCircle size={12} color={Theme.colors.error} />
                    <Text style={styles.errorText}>{error}</Text>
                </Animated.View>
            ) : null}
        </View>
    );
};

const styles = StyleSheet.create({
    wrapper: { marginBottom: 20 },
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Theme.colors.surfaceElevated,
        borderRadius: Theme.radius.md,
        borderWidth: 1.5,
        paddingHorizontal: 16,
        minHeight: 56,
    },
    iconLeft: { marginRight: 12 },
    iconRight: { marginLeft: 8 },
    inputWrap: { flex: 1, justifyContent: 'center' },
    label: {
        position: 'absolute',
        left: 0,
        fontFamily: T.bodySmall.fontFamily,
        fontSize: T.bodySmall.fontSize,
    },
    input: {
        fontFamily: T.body.fontFamily,
        fontSize: T.body.fontSize,
        color: Theme.colors.textPrimary,
        paddingVertical: 16,
        paddingTop: 22,
    },
    multiline: {
        minHeight: 80,
        textAlignVertical: 'top',
    },
    errorRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginTop: 6,
        paddingLeft: 4,
    },
    errorText: {
        fontFamily: T.bodySmall.fontFamily,
        fontSize: 12,
        color: Theme.colors.error,
    },
});
