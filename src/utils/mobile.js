// ---------------------------------------------------------------------------
// Hybrid mobile detection — evaluated once at module load time so it never
// changes after the initial render and never triggers re-renders.
// ---------------------------------------------------------------------------

const isBrowser = typeof window !== 'undefined';
const hasNavigator = typeof navigator !== 'undefined';

// 1. Screen-width check (≤ 768px)
const isSmallScreen =
  isBrowser && typeof window.matchMedia === 'function'
    ? window.matchMedia('(max-width: 768px)').matches
    : false;

// 2. Touch capability fallback — catches large tablets with wide screens
const isTouchDevice =
  hasNavigator && typeof navigator.maxTouchPoints === 'number'
    ? navigator.maxTouchPoints > 0
    : false;

// 3. Strict User-Agent fallback for iOS & Android
const isMobileUA =
  hasNavigator && typeof navigator.userAgent === 'string'
    ? /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
    : false;

/**
 * `isMobileUser` — true if ANY of the above conditions are met.
 * Use this boolean anywhere you need a static mobile check (no hook needed).
 */
export const isMobileUser = isSmallScreen || isTouchDevice || isMobileUA;

/**
 * `isCoarsePointer` — true when the primary pointer is touch/stylus.
 * Used specifically for cursor-related logic.
 */
export const isCoarsePointer =
  isBrowser && typeof window.matchMedia === 'function'
    ? window.matchMedia('(pointer: coarse)').matches
    : false;
