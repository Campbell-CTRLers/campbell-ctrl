import React, { useEffect } from 'react';
import { Turnstile } from '@marsidev/react-turnstile';

/**
 * BootSequence — invisible Cloudflare Turnstile verification.
 *
 * Rendering this component is transparent to the user: no UI appears.
 * Turnstile runs silently in the background. On success (or if the user
 * has already verified within the last 24 hours) we immediately call
 * `onComplete()` and the site loads.
 *
 * The "always pass" invisible test key (1x00000000000000000000BB) is used
 * as a fallback so the site works even without a real site key configured.
 */
const BootSequence = ({ onComplete }) => {
  const SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY || '1x00000000000000000000BB';

  useEffect(() => {
    // Skip if already verified this session
    if (sessionStorage.getItem('hasBooted')) {
      onComplete();
      return;
    }

    // Skip if verified within last 24 hours
    const expiry = localStorage.getItem('turnstile_expiry');
    if (expiry && Date.now() < Number(expiry)) {
      sessionStorage.setItem('hasBooted', 'true');
      onComplete();
    }
  }, [onComplete]);

  const handleSuccess = () => {
    localStorage.setItem('turnstile_expiry', String(Date.now() + 24 * 60 * 60 * 1000));
    sessionStorage.setItem('hasBooted', 'true');
    onComplete();
  };

  // If already verified, render nothing (onComplete fires from useEffect)
  if (sessionStorage.getItem('hasBooted')) return null;

  return (
    // Invisible — renders a hidden iframe managed by Cloudflare, nothing visible
    <Turnstile
      siteKey={SITE_KEY}
      onSuccess={handleSuccess}
      options={{ execution: 'render', appearance: 'interaction-only' }}
      style={{ display: 'none' }}
    />
  );
};

export default BootSequence;
