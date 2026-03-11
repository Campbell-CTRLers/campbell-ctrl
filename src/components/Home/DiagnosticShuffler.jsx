import React, { useState, useEffect } from 'react';

export const DiagnosticShuffler = () => {
  const cards = ["Members Chat", "Esports General", "Clips", "Off Topic"];
  const [activeIdx, setActiveIdx] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIdx(prev => (prev + 1) % cards.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [cards.length]);

  return (
    <div className="bg-background rounded-[2rem] p-8 border border-slate/10 shadow-xl flex flex-col h-[380px] justify-between relative overflow-hidden group">
      <div>
        <h3 className="font-sans font-bold text-2xl text-primary mb-2">Join the Discord</h3>
        <p className="font-roboto text-slate/80 text-sm">Chat, find games, and connect with the team.</p>
      </div>
      <div className="relative h-[180px] w-full flex items-center justify-center">
        {cards.map((label, i) => {
          const isTop = i === activeIdx;
          const isSecond = i === (activeIdx + 1) % cards.length;

          let y = 40, scale = 0.8, opacity = 0, zIndex = 0;
          if (isTop) { y = 0; scale = 1; opacity = 1; zIndex = 20; }
          else if (isSecond) { y = 15; scale = 0.9; opacity = 0.6; zIndex = 10; }

          return (
            <div
              key={label}
              className="absolute w-[80%] bg-primary text-background rounded-2xl p-4 shadow-lg flex items-center gap-4 transition-all duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)] border border-slate/30"
              style={{ transform: `translateY(${y}px) scale(${scale})`, opacity, zIndex }}
            >
              <div className="w-10 h-10 rounded-full bg-[#5865F2]/60 flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-white" viewBox="0 -28.5 256 256" fill="currentColor"><path d="M216.856 16.597A208.502 208.502 0 00164.042 0c-2.275 4.113-4.933 9.645-6.766 14.046-19.692-2.961-39.203-2.961-58.533 0-1.832-4.4-4.55-9.933-6.846-14.046a207.809 207.809 0 00-52.855 16.638C5.618 67.147-3.443 116.4 1.087 164.956c22.169 16.555 43.653 26.612 64.775 33.193A161.094 161.094 0 0079.735 175.3a136.413 136.413 0 01-21.846-10.632 108.636 108.636 0 005.356-4.237c42.122 19.702 87.89 19.702 129.51 0a131.66 131.66 0 005.355 4.237 136.07 136.07 0 01-21.886 10.653c4.006 8.02 8.638 15.67 13.873 22.848 21.142-6.58 42.646-16.637 64.815-33.213 5.316-56.288-9.08-105.09-38.056-148.36zM85.474 135.095c-12.645 0-23.015-11.805-23.015-26.18s10.149-26.2 23.015-26.2c12.867 0 23.236 11.824 23.015 26.2.02 14.375-10.148 26.18-23.015 26.18zm85.051 0c-12.645 0-23.014-11.805-23.014-26.18s10.148-26.2 23.014-26.2c12.867 0 23.236 11.824 23.015 26.2 0 14.375-10.148 26.18-23.015 26.18z" /></svg>
              </div>
              <span className="font-roboto text-sm font-medium">{label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
