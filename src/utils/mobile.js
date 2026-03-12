// ---------------------------------------------------------------------------
// Hybrid mobile detection — evaluated once at module load time so it never
// changes after the initial render and never triggers re-renders.
// ---------------------------------------------------------------------------

// 1. Screen-width check (≤ 768px)
const isSmallScreen = window.matchMedia('(max-width: 768px)').matches;

// 2. Touch capability fallback — catches large tablets with wide screens
const isTouchDevice = navigator.maxTouchPoints > 0;

// 3. Strict User-Agent fallback for iOS & Android
const isMobileUA = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

/**
 * `isMobileUser` — true if ANY of the above conditions are met.
 * Use this boolean anywhere you need a static mobile check (no hook needed).
 */
export const isMobileUser = isSmallScreen || isTouchDevice || isMobileUA;

/**
 * `isCoarsePointer` — true when the primary pointer is touch/stylus.
 * Used specifically for cursor-related logic.
 */
export const isCoarsePointer = window.matchMedia('(pointer: coarse)').matches;
