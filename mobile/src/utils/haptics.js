import * as Haptics from 'expo-haptics';

export const hapticLight = async () => {
    try {
        return await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
};

export const hapticMedium = async () => {
    try {
        return await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {}
};

export const hapticSuccess = async () => {
    try {
        return await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {}
};

export const hapticError = async () => {
    try {
        return await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } catch {}
};
