/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useMemo } from 'react';
import { isMobileUser, isCoarsePointer } from '../utils/mobile';

// ---------------------------------------------------------------------------
// React context — lets components consume isMobileUser via hook without
// recalculating on every render.
// ---------------------------------------------------------------------------

const MobileContext = createContext({ isMobile: isMobileUser, isCoarse: isCoarsePointer });

export function MobileProvider({ children }) {
  const value = useMemo(() => ({ isMobile: isMobileUser, isCoarse: isCoarsePointer }), []);
  return <MobileContext.Provider value={value}>{children}</MobileContext.Provider>;
}

/**
 * `useMobile()` — returns `{ isMobile, isCoarse }`.
 * Backed by the static constants above — no media-query listeners,
 * no re-renders; it's just context.
 */
export function useMobile() {
  return useContext(MobileContext);
}

