import React, { useEffect, useState } from 'react';
import { isMobileUser } from '../utils/mobile';
import { ThemeContext } from './themeContext';

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    // Read from DOM (set by inline FOIC script)
    return document.documentElement.getAttribute('data-theme') || 'light';
  });

  const toggleTheme = (e) => {
    const next = theme === 'light' ? 'dark' : 'light';

    // On mobile, skip the expensive View Transition radial wipe.
    // CSS transitions on :root handle the visual fade automatically.
    if (isMobileUser || !document.startViewTransition || !e) {
      setTheme(next);
      document.documentElement.setAttribute('data-theme', next);
      localStorage.setItem('theme', next);
      return;
    }

    // Desktop: radial wipe from click origin
    const x = e.clientX ?? window.innerWidth / 2;
    const y = e.clientY ?? window.innerHeight / 2;
    const endRadius = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y));

    const transition = document.startViewTransition(() => {
      setTheme(next);
      document.documentElement.setAttribute('data-theme', next);
      localStorage.setItem('theme', next);
    });

    transition.ready.then(() => {
      document.documentElement.animate(
        { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${endRadius}px at ${x}px ${y}px)`] },
        { duration: 500, easing: 'ease-in-out', pseudoElement: '::view-transition-new(root)', fill: 'both' }
      );
    });
  };

  // Listen for system preference changes (only if user hasn't manually overridden)
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e) => {
      if (!localStorage.getItem('theme')) {
        const sys = e.matches ? 'dark' : 'light';
        setTheme(sys);
        document.documentElement.setAttribute('data-theme', sys);
      }
    };
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
