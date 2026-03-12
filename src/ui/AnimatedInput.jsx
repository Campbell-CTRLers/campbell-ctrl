import React, { useRef, useState } from 'react';
import { cn } from '../utils/cn';

const InlineCaret = ({ error }) => (
  <span className="inline-block relative w-0 h-5 align-middle">
    <span className={cn(
      "absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-5 rounded-full transition-all duration-100 ease-out animate-pulse shrink-0 z-20",
      error ? "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]" : "bg-accent shadow-[0_0_8px_rgba(var(--color-accent),0.6)]"
    )} />
  </span>
);

export default function AnimatedInput({ value, onChange, placeholder, type = 'text', className, error, mono = true, tracking = 'wider' }) {
  const inputRef = useRef(null);
  const scrollContainer = useRef(null);

  const [selStart, setSelStart] = useState(0);
  const [selEnd, setSelEnd] = useState(0);
  const [isFocused, setIsFocused] = useState(false);

  const safeValue = value || '';
  const isPassword = type === 'password';
  const displayValue = isPassword ? '•'.repeat(safeValue.length) : safeValue;

  const isCentered = typeof className === 'string' && className.includes('text-center');

  const syncScroll = () => {
    if (!inputRef.current || !scrollContainer.current) return;
    scrollContainer.current.style.transform = `translateX(-${inputRef.current.scrollLeft}px)`;
  };

  const updateSelection = () => {
    if (!inputRef.current) return;
    setSelStart(inputRef.current.selectionStart || 0);
    setSelEnd(inputRef.current.selectionEnd || 0);
    syncScroll();
  };

  const trackingClass = tracking === 'widest' ? 'tracking-[0.15em]' : tracking === 'wider' ? 'tracking-wider' : tracking === 'tight' ? 'tracking-tight' : 'tracking-normal';

  // Selection state is kept current by event handlers (onFocus/onClick/onKeyUp/onSelect)
  // — no useEffect needed.

  return (
    <div className={cn(
      "relative flex items-center rounded-xl transition-all duration-300 overflow-hidden w-full",
      error ? "bg-red-500/5" : "bg-primary/5 focus-within:bg-primary/10",
      className
    )}>
      
      {/* 1. Underlying Animated Text & Caret Layer */}
      <div 
        className={cn(
          "absolute inset-0 pointer-events-none flex items-center z-0 overflow-hidden",
          className?.match(/(p[lxryt-]|p-)\S+/g)?.join(' ') || "px-4"
        )}
        aria-hidden="true"
      >
        <div 
          ref={scrollContainer} 
          className={cn(
            "w-full block text-sm text-primary whitespace-pre transition-transform duration-75 ease-out",
            mono ? "font-mono" : "font-sans",
            trackingClass,
            isCentered ? "text-center" : "text-left"
          )}
        >
          {displayValue ? (
            <>
              {displayValue.split('').map((char, i) => {
                const isSelected = isFocused && i >= selStart && i < selEnd;
                const showCaretBefore = isFocused && selStart === selEnd && i === selStart;
                return (
                  <React.Fragment key={i}>
                    {showCaretBefore && <InlineCaret error={error} />}
                    <span 
                      className={cn(
                        "inline-block transition-colors duration-100",
                        !isSelected && "animate-glide-in",
                        isSelected && "bg-accent text-background"
                      )}
                    >
                      {char === ' ' ? '\u00A0' : char}
                    </span>
                  </React.Fragment>
                );
              })}
              {/* Caret at the very end */}
              {isFocused && selStart === selEnd && selStart === displayValue.length && <InlineCaret error={error} />}
            </>
          ) : (
            <>
              {isFocused && <InlineCaret error={error} />}
              <span className="text-slate/40 transition-opacity duration-300">
                 {placeholder}
              </span>
            </>
          )}
        </div>
      </div>

      {/* 2. The Real Input (Invisible but functional) */}
      <input
        ref={inputRef}
        type={type === 'password' ? 'password' : 'text'}
        inputMode={type === 'email' ? 'email' : undefined}
        value={safeValue}
        onChange={(e) => { onChange(e); updateSelection(); }}
        onClick={updateSelection}
        onKeyUp={updateSelection}
        onSelect={updateSelection}
        onScroll={syncScroll}
        onFocus={() => { setIsFocused(true); updateSelection(); }}
        onBlur={() => setIsFocused(false)}
        className={cn(
          "w-full h-full py-3 text-sm outline-none bg-transparent z-20 relative cursor-none opacity-0 block",
          mono ? "font-mono" : "font-sans",
          trackingClass,
          className?.match(/(p[lxryt-]|p-)\S+/g)?.join(' ') || "px-4",
          isCentered ? "text-center" : "text-left"
        )}
      />
    </div>
  );
}
