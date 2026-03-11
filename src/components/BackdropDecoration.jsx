import React from 'react';

export const BackdropDecoration = () => {
  return (
    <div className="fixed inset-0 z-[-1] pointer-events-none overflow-hidden select-none">
      {/* Dynamic Ambient Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-accent/5 blur-[120px] rounded-full animate-pulse-slow" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-primary/5 blur-[120px] rounded-full animate-pulse-slow" style={{ animationDelay: '4s' }} />
      
      {/* Sub-surface Floating Geometry */}
      <div className="absolute top-1/4 left-[5%] w-64 h-64 border border-slate/5 rounded-[3rem] rotate-12 animate-float pointer-events-none" style={{ '--tw-rotate': '12deg' } } />
      <div className="absolute bottom-1/4 right-[5%] w-96 h-96 border border-slate/5 rounded-[4rem] -rotate-12 animate-float pointer-events-none" style={{ animationDelay: '2s', '--tw-rotate': '-12deg' } } />
      
      {/* Micro-Noise Texture Overlay */}
      <div className="absolute inset-0 opacity-[0.02] mix-blend-overlay pointer-events-none" 
           style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }} />

      {/* Grid Trace (Very Subtle) */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" 
           style={{ backgroundImage: `linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)`, backgroundSize: '100px 100px' }} />
    </div>
  );
};
