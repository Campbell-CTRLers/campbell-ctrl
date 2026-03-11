import { useCallback } from 'react';
import { haptics } from '../utils/haptics';

/**
 * Custom hook to easily trigger haptic feedback in React components.
 * Automatically handles standard patterns.
 */
export const useHaptics = () => {
    const triggerSoft = useCallback(() => haptics.soft(), []);
    const triggerSelection = useCallback(() => haptics.selection(), []);
    const triggerLight = useCallback(() => haptics.light(), []);
    const triggerMedium = useCallback(() => haptics.medium(), []);
    const triggerHeavy = useCallback(() => haptics.heavy(), []);
    const triggerRigid = useCallback(() => haptics.rigid(), []);
    const triggerSuccess = useCallback(() => haptics.success(), []);
    const triggerWarning = useCallback(() => haptics.warning(), []);
    const triggerError = useCallback(() => haptics.error(), []);

    return {
        soft: triggerSoft,
        selection: triggerSelection,
        light: triggerLight,
        medium: triggerMedium,
        heavy: triggerHeavy,
        rigid: triggerRigid,
        success: triggerSuccess,
        warning: triggerWarning,
        error: triggerError,
    };
};

export default useHaptics;
