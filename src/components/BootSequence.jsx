import React, { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { Turnstile } from '@marsidev/react-turnstile';
import { useHaptics } from '../hooks/useHaptics';
import clsx from 'clsx';
import { twMerge } from 'tailwind-merge';

import { cn } from '../utils/cn';

const BootSequence = ({ onComplete }) => {
  const containerRef = useRef(null);
  const logoWrapperRef = useRef(null);
  const progressBarRef = useRef(null);
  const progressTextRef = useRef(null);
  const haptics = useHaptics();

  // CF Verification Refs
  const cfContainerRef = useRef(null);

  const [isVerified, setIsVerified] = useState(false);

  // Use the env variable if provided, otherwise default to Cloudflare's standard "always pass" test key
  const SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY ? import.meta.env.VITE_TURNSTILE_SITE_KEY : '1x00000000000000000000AA';

  useEffect(() => {
    if (sessionStorage.getItem('hasBooted')) {
      onComplete();
      return;
    }

    // Check for verification skip (24 hours)
    const turnstileExpiry = localStorage.getItem('turnstile_expiry');
    if (turnstileExpiry && Date.now() < Number(turnstileExpiry)) {
      handleVerificationSuccess(true);
      return;
    }

    // 0. CF Verification Phase (Animate Container In)
    gsap.to(cfContainerRef.current, { opacity: 1, y: 0, duration: 0.3, ease: 'power2.out' });
  }, [onComplete]);

  const handleVerificationSuccess = (isSkip = false) => {
    setIsVerified(true);
    if (!isSkip) {
      haptics.success();
      // Set expiry for 24 hours from now
      localStorage.setItem('turnstile_expiry', String(Date.now() + 24 * 60 * 60 * 1000));
    }
    
    const tl = gsap.timeline({
      onComplete: () => {
        sessionStorage.setItem('hasBooted', 'true');
        onComplete();
      }
    });

    // Fade out CF container (faster)
    if (cfContainerRef.current) {
      tl.to(cfContainerRef.current, { opacity: 0, y: -20, scale: 0.95, duration: 0.3, ease: 'power2.in' });
    }

    // 1. Fade in logo quickly (faster)
    tl.fromTo(logoWrapperRef.current, 
      { opacity: 0, scale: 0.9, y: 20 }, 
      { opacity: 1, scale: 1, y: 0, duration: 0.4, ease: 'power3.out' },
      "-=0.1"
    );

    // 2. Animate progress bar filling up (much faster)
    tl.to(progressBarRef.current, {
      scaleX: 1,
      duration: 0.5,
      ease: 'power2.inOut',
      onUpdate: function() {
        if (progressTextRef.current) {
          progressTextRef.current.innerText = Math.round(this.progress() * 100) + '%';
        }
      }
    }, "-=0.2");

    // 3. Quick pop on logo
    tl.to(logoWrapperRef.current, {
      scale: 1.05,
      opacity: 0,
      duration: 0.15,
      ease: 'back.in(2)'
    }, "+=0.05");

    // 4. Radial wipe OUT fast
    tl.to(containerRef.current, {
      clipPath: 'circle(0% at 50% 50%)',
      duration: 0.45,
      ease: 'power3.inOut'
    }, "-=0.05");
  };

  if (sessionStorage.getItem('hasBooted')) return null;

  return (
    <div 
      ref={containerRef} 
      className="fixed inset-0 z-[99999] bg-background/95 backdrop-blur-3xl text-primary flex flex-col items-center justify-between py-24 px-8 select-none"
      style={{ clipPath: 'circle(150% at 50% 50%)' }}
    >
      {/* Real Cloudflare Verification Widget */}
      <div 
        ref={cfContainerRef}
        className={cn("absolute inset-0 m-auto w-fit h-fit flex items-center justify-center z-20 pointer-events-auto", isVerified ? 'pointer-events-none' : '')}
        style={{ opacity: 0, transform: 'translateY(10px)' }}
      >
        <div className="bg-background border border-primary/20 shadow-2xl rounded-lg p-6 flex flex-col items-center gap-4 cf-turnstile-wrapper cursor-auto">
          <Turnstile 
            siteKey={SITE_KEY} 
            onSuccess={handleVerificationSuccess}
            options={{ theme: 'auto' }}
          />
          <div className="flex items-center gap-2 pt-3 border-t border-primary/10 mt-1 w-full justify-center">
            <img src="/logo-transparent.png" className="w-4 h-4 opacity-50 block object-contain" style={{ filter: 'var(--logo-filter, brightness(1) invert(0))' }} />
            <span className="font-mono text-[10px] text-primary/40 uppercase tracking-widest">Secured by Campbell CTRL</span>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center w-full" ref={logoWrapperRef} style={{ opacity: 0 }}>
        <img 
          src="/logo-transparent.png" 
          alt="" 
          className="w-32 md:w-48 object-contain !text-transparent" 
          style={{ filter: 'var(--logo-filter, brightness(1) invert(0))' }}
        />
      </div>
      
      <div className="w-full max-w-sm flex flex-col items-center gap-4">
        <div className="w-full flex justify-between font-mono text-xs text-primary/60 uppercase tracking-widest">
          <span>System Boot</span>
          <span ref={progressTextRef}>0%</span>
        </div>
        <div className="w-full h-[2px] bg-primary/10 rounded-full overflow-hidden">
          <div 
            ref={progressBarRef}
            className="w-full h-full bg-accent origin-left"
            style={{ transform: 'scaleX(0)' }}
          ></div>
        </div>
      </div>
    </div>
  );
};

export default BootSequence;
