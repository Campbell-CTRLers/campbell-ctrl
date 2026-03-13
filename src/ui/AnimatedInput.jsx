import React, { forwardRef } from 'react';
import { cn } from '../utils/cn';

const AnimatedInput = forwardRef(({ value, onChange, placeholder, type = 'text', className, error, mono = true, tracking = 'wider' }, ref) => {
  const trackingClass = tracking === 'widest' ? 'tracking-[0.15em]' : tracking === 'wider' ? 'tracking-wider' : tracking === 'tight' ? 'tracking-tight' : 'tracking-normal';
  return (
    <input
      ref={ref}
      type={type === 'password' ? 'password' : 'text'}
      inputMode={type === 'email' ? 'email' : undefined}
      value={value || ''}
      onChange={onChange}
      placeholder={placeholder}
      aria-invalid={error ? true : undefined}
      className={cn(
        "w-full py-3 px-4 text-sm outline-none rounded-xl bg-primary/5 focus:bg-primary/10 border border-transparent focus:border-slate/20 transition-colors",
        mono ? "font-mono" : "font-sans",
        trackingClass,
        error && "bg-red-500/5 border-red-500/20 focus:border-red-500/40",
        className
      )}
    />
  );
});
AnimatedInput.displayName = 'AnimatedInput';
export default AnimatedInput;
