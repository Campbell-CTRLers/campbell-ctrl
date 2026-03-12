import { createContext } from 'react';
import { isMobileUser, isCoarsePointer } from '../utils/mobile';

export const MobileContext = createContext({ isMobile: isMobileUser, isCoarse: isCoarsePointer });
