import { WebHaptics } from 'web-haptics';

/**
 * Haptic feedback utility using web-haptics.
 * Optimized for mobile devices with a safe guard for desktop.
 */
const hapticsEngine = typeof window !== 'undefined' ? new WebHaptics() : null;
const supported = Boolean(hapticsEngine);

const safeTrigger = (pattern) => {
  if (!supported) return;
  try {
    hapticsEngine.trigger(pattern);
  } catch {
    // Fail quietly on unsupported platforms.
  }
};

export const haptics = {
    /** Selection tap */
    selection: () => safeTrigger('selection'),
    
    /** Soft impact */
    soft: () => safeTrigger('soft'),
    
    /** Light impact */
    light: () => safeTrigger('light'),
    
    /** Medium impact */
    medium: () => safeTrigger('medium'),
    
    /** Heavy impact */
    heavy: () => safeTrigger('heavy'),
    
    /** Rigid impact */
    rigid: () => safeTrigger('rigid'),
    
    /** Success sequence */
    success: () => safeTrigger('success'),
    
    /** Warning sequence */
    warning: () => safeTrigger('warning'),
    
    /** Error sequence */
    error: () => safeTrigger('error'),

    isSupported: () => supported,
};

export default haptics;
