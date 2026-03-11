import { WebHaptics } from 'web-haptics';

/**
 * Haptic feedback utility using web-haptics.
 * Optimized for mobile devices with a safe guard for desktop.
 */
const hapticsEngine = typeof window !== 'undefined' ? new WebHaptics() : null;

export const haptics = {
    /** Selection tap */
    selection: () => hapticsEngine?.trigger('selection'),
    
    /** Soft impact */
    soft: () => hapticsEngine?.trigger('soft'),
    
    /** Light impact */
    light: () => hapticsEngine?.trigger('light'),
    
    /** Medium impact */
    medium: () => hapticsEngine?.trigger('medium'),
    
    /** Heavy impact */
    heavy: () => hapticsEngine?.trigger('heavy'),
    
    /** Rigid impact */
    rigid: () => hapticsEngine?.trigger('rigid'),
    
    /** Success sequence */
    success: () => hapticsEngine?.trigger('success'),
    
    /** Warning sequence */
    warning: () => hapticsEngine?.trigger('warning'),
    
    /** Error sequence */
    error: () => hapticsEngine?.trigger('error'),
};

export default haptics;
