import { useContext } from 'react';
import { MobileContext } from '../context/mobileContext';

/**
 * `useMobile()` — returns `{ isMobile, isCoarse }`.
 * No media-query listeners, no re-renders; backed by static context.
 */
export function useMobile() {
  return useContext(MobileContext);
}
