import { useCallback, useRef } from 'react';
import { haptics } from '../utils/haptics';

/**
 * Custom hook to easily trigger haptic feedback in React components.
 * Automatically handles standard patterns.
 */
export const useHaptics = () => {
    const editTickRef = useRef(0);
    const dragTickRef = useRef(0);

    const throttled = useCallback((ref, ms, fn) => {
        const now = Date.now();
        if (now - ref.current < ms) return;
        ref.current = now;
        fn();
    }, []);

    const triggerSoft = useCallback(() => haptics.soft(), []);
    const triggerSelection = useCallback(() => haptics.selection(), []);
    const triggerLight = useCallback(() => haptics.light(), []);
    const triggerMedium = useCallback(() => haptics.medium(), []);
    const triggerHeavy = useCallback(() => haptics.heavy(), []);
    const triggerRigid = useCallback(() => haptics.rigid(), []);
    const triggerSuccess = useCallback(() => haptics.success(), []);
    const triggerWarning = useCallback(() => haptics.warning(), []);
    const triggerError = useCallback(() => haptics.error(), []);
    const triggerTabSwitch = useCallback(() => haptics.soft(), []);
    const triggerToggle = useCallback(() => haptics.light(), []);
    const triggerEditSelect = useCallback(() => haptics.selection(), []);
    const triggerEditType = useCallback(() => {
        throttled(editTickRef, 90, () => haptics.soft());
    }, [throttled]);
    const triggerDragStart = useCallback(() => haptics.rigid(), []);
    const triggerDragStep = useCallback(() => {
        throttled(dragTickRef, 60, () => haptics.light());
    }, [throttled]);
    const triggerDragEnd = useCallback(() => haptics.soft(), []);
    const triggerSaveStart = useCallback(() => haptics.medium(), []);
    const triggerSaveSuccess = useCallback(() => haptics.success(), []);
    const triggerSaveError = useCallback(() => haptics.error(), []);
    const triggerDestructive = useCallback(() => haptics.heavy(), []);
    const triggerOpenPanel = useCallback(() => haptics.medium(), []);
    const triggerClosePanel = useCallback(() => haptics.soft(), []);

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
        tabSwitch: triggerTabSwitch,
        toggle: triggerToggle,
        editSelect: triggerEditSelect,
        editType: triggerEditType,
        dragStart: triggerDragStart,
        dragStep: triggerDragStep,
        dragEnd: triggerDragEnd,
        saveStart: triggerSaveStart,
        saveSuccess: triggerSaveSuccess,
        saveError: triggerSaveError,
        destructive: triggerDestructive,
        openPanel: triggerOpenPanel,
        closePanel: triggerClosePanel,
        supported: haptics.isSupported,
    };
};

export default useHaptics;
