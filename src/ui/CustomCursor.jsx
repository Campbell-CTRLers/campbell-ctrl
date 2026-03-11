import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { isCoarsePointer } from '../utils/mobile';

/**
 * CustomCursor — clean circle cursor for desktop only.
 *
 * Changes vs previous version:
 * - Motion blur trails removed entirely (no trail divs, no history array)
 * - Cursor morphing (bounding-box snap) ONLY on <button> and <a> elements
 *   — content cards, step sections etc. keep the default 24px circle
 * - Hidden globally if the device uses a coarse pointer (mobile/tablet)
 */
export default function CustomCursor() {
  const cursorRef = useRef(null);

  useEffect(() => {
    // Don't run on touch/mobile devices
    if (isCoarsePointer) return;

    const cursor = cursorRef.current;
    if (!cursor) return;

    const mouse = { x: -500, y: -500 };
    let hasMoved = false;
    const hoveredEl = { current: null };

    const xSet = gsap.quickSetter(cursor, 'x', 'px');
    const ySet = gsap.quickSetter(cursor, 'y', 'px');

    const onMouseMove = (e) => {
      if (!hasMoved) {
        hasMoved = true;
        document.body.style.cursor = 'none';
        document.querySelectorAll('a, button, input, textarea')
          .forEach(el => { el.style.cursor = 'none'; });
      }
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    };

    const render = () => {
      const el = hoveredEl.current;

      if (el) {
        const tag = el.tagName;
        const rect = el.getBoundingClientRect();
        const st = window.getComputedStyle(el);
        const radius = st.borderRadius;

        if (tag === 'INPUT' || tag === 'TEXTAREA') {
          // Thin caret shape over inputs
          xSet(mouse.x);
          ySet(mouse.y);
          gsap.to(cursor, { width: 4, height: 22, borderRadius: 99, opacity: 0.7, duration: 0.12, ease: 'power3.out', overwrite: 'auto' });
          return;
        }

        if (tag === 'BUTTON' || tag === 'A') {
          // Snap to the element's bounding box — only for real interactive elements
          gsap.to(cursor, {
            width: rect.width,
            height: rect.height,
            borderRadius: radius,
            x: rect.left + rect.width / 2,
            y: rect.top + rect.height / 2,
            opacity: 0.25,
            duration: 0.08,
            ease: 'power2.out',
            overwrite: true,
          });
          return;
        }
      }

      // Default: clean 24px circle follows the mouse
      xSet(mouse.x);
      ySet(mouse.y);
      gsap.to(cursor, {
        width: 24,
        height: 24,
        borderRadius: 99,
        opacity: 1,
        duration: 0.15,
        ease: 'power3.out',
        overwrite: true,
      });
    };

    gsap.ticker.add(render);
    window.addEventListener('mousemove', onMouseMove);

    const onEnter = (e) => { hoveredEl.current = e.currentTarget; };
    const onLeave = () => { hoveredEl.current = null; };

    const setupInteractables = () => {
      document.querySelectorAll('a, button, input, textarea').forEach(el => {
        el.removeEventListener('mouseenter', onEnter);
        el.removeEventListener('mouseleave', onLeave);
        el.addEventListener('mouseenter', onEnter);
        el.addEventListener('mouseleave', onLeave);
        if (hasMoved) el.style.cursor = 'none';
      });
    };

    setupInteractables();

    let debounce;
    const observer = new MutationObserver(() => {
      if (hoveredEl.current && !document.body.contains(hoveredEl.current)) {
        hoveredEl.current = null;
      }
      clearTimeout(debounce);
      debounce = setTimeout(setupInteractables, 100);
    });
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      gsap.ticker.remove(render);
      document.body.style.cursor = 'auto';
      observer.disconnect();
    };
  }, []);

  // Render nothing on coarse-pointer (touch) devices
  if (isCoarsePointer) return null;

  return (
    <div
      ref={cursorRef}
      className="cursor-main-bg fixed top-0 left-0 w-6 h-6 z-[999999] pointer-events-none"
      style={{
        borderRadius: '99px',
        transform: 'translate(-50%, -50%)',
        transition: 'background 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease',
      }}
    />
  );
}
