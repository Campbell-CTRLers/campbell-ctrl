import React, { useState, useEffect, useCallback } from 'react';
import { useHaptics } from '../hooks/useHaptics';

const SCROLL_THRESHOLD = 120;

const IconArrowUp = ({ className, size = 20 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width={size} height={size} className={className} fill="currentColor">
    <path d="M4 2C3.44772 2 3 2.44772 3 3C3 3.55228 3.44772 4 4 4H20C20.5523 4 21 3.55228 21 3C21 2.44772 20.5523 2 20 2H4Z" />
    <path d="M6.29289 13.7071C6.68342 14.0976 7.31658 14.0976 7.70711 13.7071L11 10.4142L11 21C11 21.5523 11.4477 22 12 22C12.5523 22 13 21.5523 13 21L13 10.4142L16.2929 13.7071C16.6834 14.0976 17.3166 14.0976 17.7071 13.7071C18.0976 13.3166 18.0976 12.6834 17.7071 12.2929L12.7071 7.29289C12.3166 6.90237 11.6834 6.90237 11.2929 7.29289L6.29289 12.2929C5.90237 12.6834 5.90237 13.3166 6.29289 13.7071Z" />
  </svg>
);

export function ScrollToTop() {
  const haptics = useHaptics();
  const [visible, setVisible] = useState(false);

  const checkScroll = useCallback(() => {
    setVisible(window.scrollY > SCROLL_THRESHOLD);
  }, []);

  useEffect(() => {
    window.addEventListener('scroll', checkScroll, { passive: true });
    checkScroll();
    return () => window.removeEventListener('scroll', checkScroll);
  }, [checkScroll]);

  const scrollToTop = () => {
    haptics.light();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <button
      onClick={scrollToTop}
      aria-label="Scroll to top"
      className={`md:hidden fixed bottom-6 right-6 z-40 w-12 h-12 rounded-2xl bg-background/95 backdrop-blur-md border border-slate/20 shadow-lg flex items-center justify-center text-primary hover:bg-slate/10 active:scale-95 transition-all duration-300 touch-manipulation ${
        visible ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
      }`}
      style={{ paddingBottom: 'env(safe-area-inset-bottom)', marginBottom: 'max(0px, env(safe-area-inset-bottom))' }}
      tabIndex={visible ? 0 : -1}
    >
      <IconArrowUp size={20} />
    </button>
  );
}
