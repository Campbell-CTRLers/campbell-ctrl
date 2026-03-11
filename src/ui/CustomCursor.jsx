import React, { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';

export default function CustomCursor({ theme }) {
  const cursorRef = useRef(null);
  const trailsRef = useRef([]);
  const hoveredEl = useRef(null);

  const trailCount = 5;
  const [trailDivs] = useState([...Array(trailCount)].map((_, i) => i));

  useEffect(() => {
    // Disable custom cursor on all touch-based/coarse pointer devices (Tablets, Phones)
    if (window.matchMedia("(pointer: coarse)").matches) return;
    
    const cursor = cursorRef.current;
    const trails = trailsRef.current;
    
    // Start off-screen and invisible until first real mouse movement
    const mouse = { x: -500, y: -500 };
    let hasMoved = false;
    const history = [];
    for (let i = 0; i < trailCount; i++) history.push({ x: mouse.x, y: mouse.y });
    
    const xSet = gsap.quickSetter(cursor, "x", "px");
    const ySet = gsap.quickSetter(cursor, "y", "px");
    
    const trailSets = trails.map(t => ({
      x: gsap.quickSetter(t, "x", "px"),
      y: gsap.quickSetter(t, "y", "px")
    }));

    // Keep native cursor visible until the mouse actually moves
    const onMouseMove = (e) => {
      if (!hasMoved) {
        hasMoved = true;
        document.body.style.cursor = 'none';
        // Apply cursor:none to already-registered interactables
        document.querySelectorAll('a, button, input, textarea, .nav-link, .interactive-hover, .magnetic-btn, .mobile-nav-item, .footer-link, .cf-turnstile-wrapper')
          .forEach(el => { el.style.cursor = 'none'; });
      }
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    };
    
    const render = () => {
      history.unshift({ x: mouse.x, y: mouse.y });
      history.pop();
      
      if (hoveredEl.current) {
        const rect = hoveredEl.current.getBoundingClientRect();
        const st = window.getComputedStyle(hoveredEl.current);
        const radius = st.borderRadius;
        const tag = hoveredEl.current.tagName;

        if (tag === 'INPUT' || tag === 'TEXTAREA') {
          xSet(mouse.x);
          ySet(mouse.y);

          // Morph shape into a simple rounded pill matching the caret
          gsap.to(cursor, {
            width: 6,
            height: 20,
            borderRadius: 99,
            clearProps: 'clipPath',
            duration: 0.15,
            ease: 'power3.out',
            overwrite: 'auto'
          });
          
          trails.forEach(t => { if (t) t.style.opacity = '0'; });
          
          trailSets.forEach((t, i) => {
            t.x(history[i].x);
            t.y(history[i].y);
          });
        } else if (hoveredEl.current.classList.contains('cf-turnstile-wrapper') || hoveredEl.current.closest('.cf-turnstile-wrapper')) {
          // Hide custom cursor completely for iframes/turnstile
          gsap.to(cursor, {
            opacity: 0,
            duration: 0.15,
            ease: 'power3.out',
            overwrite: 'auto'
          });
          
          trails.forEach(t => { if (t) t.style.opacity = '0'; });
          
          // DO NOT translate the custom cursor here to prevent it from getting stuck on screen edge
          // The native cursor handles the rest.
        } else {
          // Standard magnetic hover for buttons/links -> Exact 1:1 pixel match bounding box
          gsap.to(cursor, {
            width: rect.width,
            height: rect.height,
            borderRadius: radius,
            x: rect.left + rect.width / 2,
            y: rect.top + rect.height / 2,
            clearProps: 'clipPath',
            duration: 0.08,
            ease: 'power2.out',
            overwrite: true
          });
          
          trails.forEach(t => { if (t) t.style.opacity = '0'; });
        }
        
      } else {
        xSet(mouse.x);
        ySet(mouse.y);
        
        gsap.to(cursor, {
          width: 24,
          height: 24,
          opacity: 1,
          borderRadius: 99,
          clearProps: 'clipPath',
          duration: 0.15,
          ease: 'power3.out',
          overwrite: true
        });
        
        trails.forEach((t, i) => { if (t) t.style.opacity = String(1 - ((i + 1) / (trailCount + 1))); });
        
        trailSets.forEach((t, i) => {
          t.x(history[i].x);
          t.y(history[i].y);
        });
      }
    };
    
    gsap.ticker.add(render);
    window.addEventListener("mousemove", onMouseMove);

    const addHoverState = (e) => {
      hoveredEl.current = e.currentTarget;
    };

    const removeHoverState = () => {
      hoveredEl.current = null;
    };

    const setupInteractiveElements = () => {
      const interactables = document.querySelectorAll('a, button, input, textarea, .nav-link, .interactive-hover, .magnetic-btn, .mobile-nav-item, .footer-link, .cf-turnstile-wrapper');
      interactables.forEach(el => {
        el.removeEventListener('mouseenter', addHoverState);
        el.removeEventListener('mouseleave', removeHoverState);
        
        el.addEventListener('mouseenter', addHoverState);
        el.addEventListener('mouseleave', removeHoverState);
        
        // Only suppress native cursor once the user has used a mouse
        if (hasMoved) el.style.cursor = 'none';
      });
    };

    setupInteractiveElements();

    let debounceTimer;
    const observer = new MutationObserver(() => {
      // Clear stale hover ref if element was removed from DOM
      if (hoveredEl.current && !document.body.contains(hoveredEl.current)) {
        hoveredEl.current = null;
      }
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(setupInteractiveElements, 100);
    });
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      gsap.ticker.remove(render);
      document.body.style.cursor = 'auto';
      observer.disconnect();
    };
  }, [theme]); 

  return (
    <div>
      {/* Motion blur shadow trails */}
      {trailDivs.map(i => (
        <div 
          key={i}
          ref={el => trailsRef.current[i] = el}
          className="cursor-trail fixed top-0 left-0 w-6 h-6 rounded-full pointer-events-none z-[999999]"
          style={{ 
            transform: 'translate(-50%, -50%)', 
            opacity: 1 - ((i + 1) / (trailCount + 1)),
            transition: 'background 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease'
          }}
        />
      ))}
      
      {/* Main cursor - shadow style with subtle border */}
      <div 
        ref={cursorRef} 
        className="cursor-main-bg fixed top-0 left-0 w-6 h-6 z-[999999] pointer-events-none flex flex-col justify-between items-center" 
        style={{ 
          borderRadius: '99px',
          transform: 'translate(-50%, -50%)', 
          x: -100, y: -100,
          transition: 'background 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease'
        }}
      >
      </div>
    </div>
  );
}
