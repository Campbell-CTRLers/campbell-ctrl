import React, { useMemo } from 'react';
import { MobileContext } from './mobileContext';
import { isMobileUser, isCoarsePointer } from '../utils/mobile';

export function MobileProvider({ children }) {
  const value = useMemo(() => ({ isMobile: isMobileUser, isCoarse: isCoarsePointer }), []);
  return <MobileContext.Provider value={value}>{children}</MobileContext.Provider>;
}
