import React, { useRef, useState, useEffect, useMemo } from 'react';
import gsap from 'gsap';
import { IconArrowRight, IconSun, IconMoon } from './icons/SvgIcons';
import { cn } from '../utils/cn';
import { useTheme } from '../context/useTheme';
import { useHaptics } from '../hooks/useHaptics';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { EditableSiteText } from './content/EditableSiteText';

gsap.registerPlugin(ScrollTrigger);

const NavLink = ({ children, onClick, className, tabName, isActive, linkRef }) => {
  const haptics = useHaptics();
  
  const handleClick = (e) => {
    haptics.selection();
    if (onClick) onClick(e);
  };

  return (
    <div className="relative z-10 flex items-center justify-center cursor-pointer">
      <button 
        ref={linkRef}
        onClick={handleClick}
        data-tab={tabName}
        className={className}
        aria-current={isActive ? 'page' : undefined}
      >
        {children}
      </button>
    </div>
  );
};

const ThemeToggle = ({ theme, toggleTheme }) => {
  const haptics = useHaptics();
  
  const handleClick = () => {
    haptics.light();
    toggleTheme();
  };

  return (
    <button
      onClick={handleClick}
      className="group relative flex items-center justify-center min-w-[44px] min-h-[44px] w-11 h-11 sm:w-9 sm:h-9 sm:min-w-0 sm:min-h-0 rounded-full hover:bg-slate-500/10 active:scale-90 transition-all text-current overflow-hidden touch-manipulation"
      aria-label="Toggle Theme"
      title="Toggle Theme"
    >
      <IconSun 
        size={18} 
        className={cn(
          "absolute transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)]", 
          theme === 'dark' ? "rotate-0 scale-100 opacity-100 group-hover:rotate-90" : "-rotate-180 scale-0 opacity-0"
        )} 
      />
      <IconMoon 
        size={18} 
        className={cn(
          "absolute transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)]", 
          theme === 'dark' ? "rotate-180 scale-0 opacity-0" : "rotate-0 scale-100 opacity-100 group-hover:-rotate-12 group-hover:scale-110"
        )} 
      />
    </button>
  );
};

const Navbar = ({ currentTab, onNavigate, siteContent = null, setSiteContent, contentEditor, previewStatic = false }) => {
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

  const tabRefs = useMemo(() => ({ home: homeRef, esports: esportsRef, meetings: meetingsRef }), []);

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

  // Morphing pill indicator — position relative to active tab button
  useEffect(() => {
    const activeRef = tabRefs[currentTab];
    if (!activeRef?.current || !indicatorRef.current || !pillContainerRef.current) return;
    
    const container = pillContainerRef.current;
    const containerRect = container.getBoundingClientRect();
    const activeRect = activeRef.current.getBoundingClientRect();
    const x = activeRect.left - containerRect.left;
    const y = activeRect.top - containerRect.top - 1; // nudge up 1px

    gsap.to(indicatorRef.current, {
      x,
      y,
      width: activeRect.width,
      height: activeRect.height,
      duration: 0.4,
      ease: 'power3.out',
      overwrite: 'auto'
    });
  }, [currentTab, theme, tabRefs]);

  // Dropdown animation — GSAP only (no transition-all on items to avoid conflict), consistent start state
  useEffect(() => {
    if (isMenuOpen) {
      gsap.set('.mobile-nav-item', { opacity: 0, y: -6 });
      gsap.to('.mobile-nav-item', { opacity: 1, y: 0, duration: 0.2, stagger: 0.03, delay: 0.05, ease: 'power2.out', overwrite: true });
    } else {
      gsap.to('.mobile-nav-item', { opacity: 0, y: -6, duration: 0.12, ease: 'power2.in', overwrite: true });
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
    <nav ref={navRef} className={cn(
      "flex flex-col px-6 py-3 w-[90%] max-w-5xl rounded-[2.5rem] md:rounded-full transition-all duration-300 border border-transparent overflow-hidden",
      previewStatic ? "sticky top-3 z-20 mx-auto mt-3" : "fixed top-6 left-1/2 -translate-x-1/2 z-40"
    )}>
      <div className="flex items-center justify-between w-full h-12 shrink-0">
        <button type="button" onClick={() => handleNavClick('home')} className="flex items-center gap-3 cursor-pointer z-10 p-0 border-0 bg-transparent" aria-label="Campbell High Esports – home">
          <img src="/logo-transparent.png" className="nav-logo h-10 w-10 sm:h-12 sm:w-12 object-contain transition-all !text-transparent" alt="Campbell High Esports – home" />
        </button>

        <div ref={pillContainerRef} className="hidden md:flex items-center absolute left-1/2 -translate-x-1/2 gap-2 rounded-full p-1 nav-pill border border-transparent transition-colors duration-300">
          {/* Morphing active indicator */}
          <div ref={indicatorRef} className="absolute h-8 bg-accent/15 border border-accent/20 rounded-full pointer-events-none z-0" style={{ width: 0, left: 0, top: 0 }}></div>
          <NavLink linkRef={homeRef} tabName="home" isActive={currentTab === 'home'} onClick={() => handleNavClick('home')} className={cn("nav-link relative z-10 px-4 py-2 font-roboto font-semibold tracking-wide text-sm rounded-full transition-colors", currentTab === 'home' ? "font-bold text-accent" : "")}>
            <EditableSiteText as="span" contentKey="navbar.home" fallback="Home" siteContent={siteContent} setSiteContent={setSiteContent} editor={contentEditor} />
          </NavLink>
          <NavLink linkRef={esportsRef} tabName="esports" isActive={currentTab === 'esports'} onClick={() => handleNavClick('esports')} className={cn("nav-link relative z-10 px-4 py-2 font-roboto font-semibold tracking-wide text-sm rounded-full transition-colors", currentTab === 'esports' ? "font-bold text-accent" : "")}>
            <EditableSiteText as="span" contentKey="navbar.esports" fallback="Esports" siteContent={siteContent} setSiteContent={setSiteContent} editor={contentEditor} />
          </NavLink>
          <NavLink linkRef={meetingsRef} tabName="meetings" isActive={currentTab === 'meetings'} onClick={() => handleNavClick('meetings')} className={cn("nav-link relative z-10 px-4 py-2 font-roboto font-semibold tracking-wide text-sm rounded-full transition-colors", currentTab === 'meetings' ? "font-bold text-accent" : "")}>
            <EditableSiteText as="span" contentKey="navbar.meetings" fallback="Meetings" siteContent={siteContent} setSiteContent={setSiteContent} editor={contentEditor} />
          </NavLink>
        </div>

        {/* Right side: Actions (Desktop) & Hamburger (Mobile) */}
        <div className="flex items-center gap-2 sm:gap-4 ml-auto shrink-0 z-10 relative">
          <ThemeToggle theme={theme} toggleTheme={toggleTheme} />

          <a href="https://discord.gg/HZ2bQsmaSK" target="_blank" rel="noopener noreferrer" className="hidden md:flex bg-[#5865F2] hover:bg-[#4752C4] text-white px-5 py-2 rounded-full font-sans font-semibold text-sm items-center gap-2 w-fit transition-opacity hover:opacity-90">
              <EditableSiteText as="span" contentKey="navbar.joinDiscord" fallback="Join Discord" siteContent={siteContent} setSiteContent={setSiteContent} editor={contentEditor} className="relative z-10 transition-colors duration-300" />
              <IconArrowRight size={16} className="relative z-10 transition-colors duration-300" />
            </a>

          <button
            className="md:hidden min-w-[44px] min-h-[44px] w-11 h-11 flex flex-col justify-center items-center gap-1.5 z-50 relative ml-2 touch-manipulation active:scale-95"
            onClick={toggleMenu}
            aria-label="Toggle menu"
          >
            <span className={cn("block w-6 h-[2px] rounded-full transition-transform duration-200 origin-center bg-current", isMenuOpen ? "translate-y-[8px] rotate-45" : "")}></span>
            <span className={cn("block w-6 h-[2px] rounded-full transition-opacity duration-200 bg-current", isMenuOpen ? "opacity-0" : "")}></span>
            <span className={cn("block w-6 h-[2px] rounded-full transition-transform duration-200 origin-center bg-current", isMenuOpen ? "-translate-y-[8px] -rotate-45" : "")}></span>
          </button>
        </div>
      </div>

      {/* Dropdown Menu (Mobile/Tablet) */}
      <div
        ref={menuRef}
        style={{
          maxHeight: isMenuOpen ? '600px' : '0px',
          transition: 'max-height 0.25s cubic-bezier(0.32, 0.72, 0, 1)',
          pointerEvents: isMenuOpen ? 'auto' : 'none',
        }}
        className="w-full md:hidden flex flex-col items-center justify-start font-mono z-0 overflow-hidden"
      >
        <div className="flex flex-col items-center justify-center gap-2 w-full pt-4 pb-2">
          <button onClick={() => handleNavClick('home')} aria-current={currentTab === 'home' ? 'page' : undefined} className={cn("mobile-nav-item w-[85%] py-4 rounded-2xl text-xl font-bold touch-manipulation flex items-center justify-center", currentTab === 'home' ? "bg-accent/10 text-accent" : "text-primary hover:bg-slate-500/5")}><EditableSiteText as="span" contentKey="navbar.homeMobile" fallback="Home" siteContent={siteContent} setSiteContent={setSiteContent} editor={contentEditor} /></button>
          <button onClick={() => handleNavClick('esports')} aria-current={currentTab === 'esports' ? 'page' : undefined} className={cn("mobile-nav-item w-[85%] py-4 rounded-2xl text-xl font-bold touch-manipulation flex items-center justify-center", currentTab === 'esports' ? "bg-accent/10 text-accent" : "text-primary hover:bg-slate-500/5")}><EditableSiteText as="span" contentKey="navbar.esportsMobile" fallback="Esports" siteContent={siteContent} setSiteContent={setSiteContent} editor={contentEditor} /></button>
          <button onClick={() => handleNavClick('meetings')} aria-current={currentTab === 'meetings' ? 'page' : undefined} className={cn("mobile-nav-item w-[85%] py-4 rounded-2xl text-xl font-bold touch-manipulation flex items-center justify-center", currentTab === 'meetings' ? "bg-accent/10 text-accent" : "text-primary hover:bg-slate-500/5")}><EditableSiteText as="span" contentKey="navbar.meetingsMobile" fallback="Meetings" siteContent={siteContent} setSiteContent={setSiteContent} editor={contentEditor} /></button>
          
          <div className="w-[90%] h-[1px] bg-slate-500/10 my-2 mobile-nav-item" aria-hidden="true" />

          <a href="https://discord.gg/HZ2bQsmaSK" target="_blank" rel="noopener noreferrer" 
             onClick={() => haptics.light()}
             className="mobile-nav-item bg-[#5865F2] text-white px-8 py-4 rounded-2xl font-sans font-bold w-[85%] flex items-center justify-center gap-3 active:scale-95 overflow-hidden group touch-manipulation shadow-lg shadow-indigo-500/20">
            <EditableSiteText as="span" contentKey="navbar.joinDiscordMobile" fallback="Join Discord" siteContent={siteContent} setSiteContent={setSiteContent} editor={contentEditor} className="relative z-10 whitespace-nowrap" />
            <IconArrowRight size={20} className="relative z-10" />
          </a>
        </div>
      </div>

    </nav>
  );
};

export default Navbar;
