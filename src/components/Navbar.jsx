/* eslint-disable react-hooks/refs */
import React, { useRef, useState, useEffect } from 'react';
import gsap from 'gsap';
import { ArrowRight, Sun, Moon } from 'lucide-react';
import { cn } from '../utils/cn';
import { useTheme } from '../context/useTheme';
import { useHaptics } from '../hooks/useHaptics';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const MagneticLink = ({ children, className, onMagnetMove, onMagnetLeave }) => {
  const containerRef = useRef(null);
  const elementRef = useRef(null);

  const handleMouseMove = (e) => {
    if (!containerRef.current || !elementRef.current) return;
    if (window.matchMedia("(pointer: coarse)").matches) return; // Disable on touch devices
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    
    // Calculate magnetic pull (max 8px translation for tabs)
    const xMove = (x / (rect.width / 2)) * 8;
    const yMove = (y / (rect.height / 2)) * 8;

    gsap.to(elementRef.current, {
      x: xMove,
      y: yMove,
      duration: 0.4,
      ease: "power3.out",
      overwrite: "auto"
    });

    if (onMagnetMove) onMagnetMove(xMove, yMove);
  };

  const handleMouseLeave = () => {
    if (!elementRef.current) return;
    gsap.to(elementRef.current, {
      x: 0,
      y: 0,
      duration: 0.7,
      ease: "elastic.out(1, 0.3)",
      overwrite: "auto"
    });

    if (onMagnetLeave) onMagnetLeave();
  };

  // We clone the child element to attach the ref and style to it transparently
  const child = React.Children.only(children);
  const clonedChild = React.cloneElement(child, {
    ref: (node) => {
      elementRef.current = node;
      // Preserve original ref from the child if it exists
      const { ref } = child;
      if (typeof ref === 'function') {
        ref(node);
      } else if (ref !== null && ref !== undefined) {
        ref.current = node;
      }
    },
    style: { ...child.props.style, willChange: 'transform' }
  });

  return (
    <div 
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={cn("relative z-10 flex items-center justify-center cursor-pointer", className)}
    >
      {clonedChild}
    </div>
  );
};

const NavLink = ({ children, onClick, className, tabName, isActive, linkRef, onMagnetMove, onMagnetLeave }) => {
  const haptics = useHaptics();
  
  const handleClick = (e) => {
    haptics.selection();
    if (onClick) onClick(e);
  };

  return (
    <MagneticLink 
      onMagnetMove={isActive ? onMagnetMove : undefined} 
      onMagnetLeave={isActive ? onMagnetLeave : undefined}
    >
      <button 
        ref={linkRef}
        onClick={handleClick}
        data-tab={tabName}
        className={className}
      >
        {children}
      </button>
    </MagneticLink>
  );
};

const ThemeToggle = ({ theme, toggleTheme }) => {
  const haptics = useHaptics();
  
  const handleClick = (e) => {
    haptics.light();
    toggleTheme(e);
  };

  return (
    <button
      onClick={handleClick}
      className="group relative flex items-center justify-center w-9 h-9 rounded-full hover:bg-slate-500/10 active:scale-90 transition-all text-current overflow-hidden"
      aria-label="Toggle Theme"
      title="Toggle Theme"
    >
      <Sun 
        size={18} 
        className={cn(
          "absolute transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)]", 
          theme === 'dark' ? "rotate-0 scale-100 opacity-100 group-hover:rotate-90" : "-rotate-180 scale-0 opacity-0"
        )} 
      />
      <Moon 
        size={18} 
        className={cn(
          "absolute transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)]", 
          theme === 'dark' ? "rotate-180 scale-0 opacity-0" : "rotate-0 scale-100 opacity-100 group-hover:-rotate-12 group-hover:scale-110"
        )} 
      />
    </button>
  );
};

const Navbar = ({ currentTab, onNavigate }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navRef = useRef(null);
  const menuRef = useRef(null);
  const indicatorRef = useRef(null);
  const pillContainerRef = useRef(null);
  const homeRef = useRef(null);
  const esportsRef = useRef(null);
  const meetingsRef = useRef(null);
  const { theme, toggleTheme } = useTheme();
  const haptics = useHaptics();

  const tabRefs = { home: homeRef, esports: esportsRef, meetings: meetingsRef };

  // Helper: read current CSS variable values (theme-aware)
  const getThemeColors = () => {
    const style = getComputedStyle(document.documentElement);
    return {
      scrolledBg: style.getPropertyValue('--color-nav-scrolled-bg').trim(),
      scrolledBorder: style.getPropertyValue('--color-nav-scrolled-border').trim(),
      scrolledText: style.getPropertyValue('--color-nav-scrolled-text').trim(),
      heroText: style.getPropertyValue('--color-nav-hero-text').trim(),
      isDark: document.documentElement.getAttribute('data-theme') === 'dark',
    };
  };

  useEffect(() => {
    const applyScrolledStyle = () => {
      const colors = getThemeColors();
      gsap.set(navRef.current, { backgroundColor: colors.scrolledBg, backdropFilter: 'blur(32px)', borderColor: colors.scrolledBorder, color: colors.scrolledText });
      gsap.set('.nav-logo', { filter: colors.isDark ? 'brightness(0) invert(1)' : 'brightness(1) invert(0)' });
      gsap.set('.nav-link', { color: colors.scrolledText });
      gsap.set('.nav-pill', { backgroundColor: colors.isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)', borderColor: colors.scrolledBorder });
    };
    applyScrolledStyle();
  }, [currentTab, isMenuOpen, theme]);

  const indicatorBaseX = useRef(0);

  // Morphing pill indicator
  useEffect(() => {
    const activeRef = tabRefs[currentTab];
    if (!activeRef?.current || !indicatorRef.current || !pillContainerRef.current) return;
    
    // Maintain current magnet position if active
    const currentX = gsap.getProperty(activeRef.current, "x") || 0;
    const currentY = gsap.getProperty(activeRef.current, "y") || 0;
    
    // Temporarily clear to measure base layout
    gsap.set(activeRef.current, { x: 0, y: 0 });
    
    const containerRect = pillContainerRef.current.getBoundingClientRect();
    const activeRect = activeRef.current.getBoundingClientRect();
    
    indicatorBaseX.current = activeRect.left - containerRect.left;
    
    // Restore magnet position immediately
    gsap.set(activeRef.current, { x: currentX, y: currentY });

    gsap.to(indicatorRef.current, {
      x: indicatorBaseX.current + currentX,
      y: currentY,
      width: activeRect.width,
      height: activeRect.height,
      duration: 0.4,
      ease: 'power3.out',
      overwrite: 'auto'
    });
  }, [currentTab, theme]);

  const handleMagnetMove = (xMove, yMove) => {
    if (!indicatorRef.current) return;
    gsap.to(indicatorRef.current, {
      x: indicatorBaseX.current + xMove,
      y: yMove,
      duration: 0.4,
      ease: "power3.out",
      overwrite: "auto"
    });
  };

  const handleMagnetLeave = () => {
    if (!indicatorRef.current) return;
    gsap.to(indicatorRef.current, {
      x: indicatorBaseX.current,
      y: 0,
      duration: 0.7,
      ease: "elastic.out(1, 0.3)",
      overwrite: "auto"
    });
  };

  // Dropdown animation
  useEffect(() => {
    if (isMenuOpen) {
      gsap.set(menuRef.current, { pointerEvents: 'auto', visibility: 'visible' });
      gsap.to(menuRef.current, { height: 'auto', duration: 0.5, ease: 'expo.out' });
      gsap.to('.mobile-nav-item', { opacity: 1, y: 0, duration: 0.4, stagger: 0.05, delay: 0.1, ease: 'power2.out' });
    } else {
      gsap.to('.mobile-nav-item', { opacity: 0, y: -10, duration: 0.2, ease: 'power2.in' });
      gsap.to(menuRef.current, { 
        height: 0, 
        duration: 0.4, 
        ease: 'power3.inOut', 
        delay: 0.1,
        onComplete: () => {
          if (menuRef.current) gsap.set(menuRef.current, { pointerEvents: 'none', visibility: 'hidden' });
        }
      });
    }
  }, [isMenuOpen]);

  const handleNavClick = (tab) => {
    haptics.selection();
    onNavigate(tab);
    setIsMenuOpen(false);
  };

  const toggleMenu = () => {
    haptics.light();
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <nav ref={navRef} className="fixed top-6 left-1/2 -translate-x-1/2 z-40 flex flex-col px-6 py-3 w-[90%] max-w-5xl rounded-[2.5rem] md:rounded-full transition-all duration-300 border border-transparent overflow-hidden">
      <div className="flex items-center justify-between w-full h-12 shrink-0">
        <div className="flex items-center gap-3 cursor-pointer z-10" onClick={() => handleNavClick('home')}>
          <img src="/logo-transparent.png" className="nav-logo h-10 w-10 sm:h-12 sm:w-12 object-contain transition-all !text-transparent" alt="" />
        </div>

        <div ref={pillContainerRef} className="hidden md:flex items-center absolute left-1/2 -translate-x-1/2 gap-2 rounded-full p-1 nav-pill border border-transparent transition-colors duration-300">
          {/* Morphing active indicator */}
          <div ref={indicatorRef} className="absolute top-1 left-0 h-8 bg-accent/15 border border-accent/20 rounded-full pointer-events-none z-0" style={{ width: 0 }}></div>
          <NavLink linkRef={homeRef} onMagnetMove={handleMagnetMove} onMagnetLeave={handleMagnetLeave} tabName="home" isActive={currentTab === 'home'} onClick={() => handleNavClick('home')} className={cn("nav-link relative z-10 px-4 py-2 font-roboto font-semibold tracking-wide text-sm rounded-full transition-colors", currentTab === 'home' ? "font-bold text-accent" : "")}>Home</NavLink>
          <NavLink linkRef={esportsRef} onMagnetMove={handleMagnetMove} onMagnetLeave={handleMagnetLeave} tabName="esports" isActive={currentTab === 'esports'} onClick={() => handleNavClick('esports')} className={cn("nav-link relative z-10 px-4 py-2 font-roboto font-semibold tracking-wide text-sm rounded-full transition-colors", currentTab === 'esports' ? "font-bold text-accent" : "")}>Esports</NavLink>
          <NavLink linkRef={meetingsRef} onMagnetMove={handleMagnetMove} onMagnetLeave={handleMagnetLeave} tabName="meetings" isActive={currentTab === 'meetings'} onClick={() => handleNavClick('meetings')} className={cn("nav-link relative z-10 px-4 py-2 font-roboto font-semibold tracking-wide text-sm rounded-full transition-colors", currentTab === 'meetings' ? "font-bold text-accent" : "")}>Meetings</NavLink>
        </div>

        {/* Right side: Actions (Desktop) & Hamburger (Mobile) */}
        <div className="flex items-center gap-2 sm:gap-4 ml-auto shrink-0 z-10 relative">
          <ThemeToggle theme={theme} toggleTheme={toggleTheme} />

          <MagneticLink className="hidden md:flex">
            <a href="https://discord.gg/HZ2bQsmaSK" target="_blank" rel="noreferrer" className="magnetic-btn bg-[#5865F2] hover:bg-[#4752C4] text-white px-5 py-2 rounded-full font-sans font-semibold text-sm flex items-center gap-2 w-fit overflow-hidden">
              <span className="relative z-10 transition-colors duration-300">Join Discord</span>
              <ArrowRight size={16} className="relative z-10 transition-colors duration-300" />
              
              {/* Hover overlay inside button */}
              <div className="absolute inset-0 bg-background/20 translate-y-[100%] group-hover:translate-y-0 transition-transform duration-300" />
            </a>
          </MagneticLink>

          <button
            className="md:hidden w-8 h-8 flex flex-col justify-center items-center gap-1.5 z-50 relative ml-2 touch-manipulation"
            onClick={toggleMenu}
            aria-label="Toggle menu"
          >
            <span className={cn("block w-6 h-[2px] rounded-full transition-transform duration-300 origin-center bg-current", isMenuOpen ? "translate-y-[8px] rotate-45" : "")}></span>
            <span className={cn("block w-6 h-[2px] rounded-full transition-opacity duration-300 bg-current", isMenuOpen ? "opacity-0" : "")}></span>
            <span className={cn("block w-6 h-[2px] rounded-full transition-transform duration-300 origin-center bg-current", isMenuOpen ? "-translate-y-[8px] -rotate-45" : "")}></span>
          </button>
        </div>
      </div>

      {/* Dropdown Menu (Mobile/Tablet) */}
      <div 
        ref={menuRef} 
        className="w-full h-0 md:hidden flex flex-col items-center justify-start font-mono z-0 overflow-hidden invisible pointer-events-none"
      >
        <div className="flex flex-col items-center justify-center gap-2 w-full pt-4 pb-2">
          <button onClick={() => handleNavClick('home')} className={cn("mobile-nav-item w-[85%] py-4 rounded-2xl opacity-0 -translate-y-2 text-xl font-bold transition-all touch-manipulation flex items-center justify-center", currentTab === 'home' ? "bg-accent/10 text-accent" : "text-primary hover:bg-slate-500/5")}>Home</button>
          <button onClick={() => handleNavClick('esports')} className={cn("mobile-nav-item w-[85%] py-4 rounded-2xl opacity-0 -translate-y-2 text-xl font-bold transition-all touch-manipulation flex items-center justify-center", currentTab === 'esports' ? "bg-accent/10 text-accent" : "text-primary hover:bg-slate-500/5")}>Esports</button>
          <button onClick={() => handleNavClick('meetings')} className={cn("mobile-nav-item w-[85%] py-4 rounded-2xl opacity-0 -translate-y-2 text-xl font-bold transition-all touch-manipulation flex items-center justify-center", currentTab === 'meetings' ? "bg-accent/10 text-accent" : "text-primary hover:bg-slate-500/5")}>Meetings</button>
          
          <div className="w-[90%] h-[1px] bg-slate-500/10 my-2 mobile-nav-item opacity-0"></div>

          <a href="https://discord.gg/HZ2bQsmaSK" target="_blank" rel="noreferrer" 
             onClick={() => haptics.light()}
             className="mobile-nav-item opacity-0 -translate-y-2 bg-[#5865F2] text-white px-8 py-4 rounded-2xl font-sans font-bold w-[85%] flex items-center justify-center gap-3 active:scale-95 transition-all overflow-hidden group touch-manipulation shadow-lg shadow-indigo-500/20">
            <span className="relative z-10 whitespace-nowrap">Join Discord</span>
            <ArrowRight size={20} className="relative z-10" />
          </a>
        </div>
      </div>

    </nav>
  );
};

export default Navbar;
