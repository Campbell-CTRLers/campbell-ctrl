import React, { useEffect, useState } from 'react';
import { ThemeContext } from './themeContext';

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    // Read from DOM (set by inline FOIC script)
    return document.documentElement.getAttribute('data-theme') || 'light';
  });

  const toggleTheme = () => {
    const next = theme === 'light' ? 'dark' : 'light';
    setTheme(next);
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
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
