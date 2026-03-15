import React, { useRef, useEffect, useMemo } from 'react';
import gsap from 'gsap';
import { IconArrowRight, IconCalendar, IconDiscord, IconGamepad, IconHome, IconSun, IconMoon } from './icons/SvgIcons';
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
  const navRef = useRef(null);
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
  }, [currentTab, theme]);

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

  const handleNavClick = (tab) => {
    haptics.selection();
    onNavigate(tab);
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

        <div className="md:hidden absolute left-1/2 -translate-x-1/2 flex items-center gap-1 rounded-full border border-slate/10 bg-slate/5 px-1.5 py-1">
          <button
            onClick={() => handleNavClick('home')}
            aria-current={currentTab === 'home' ? 'page' : undefined}
            aria-label="Home"
            className={cn(
              "min-w-[38px] min-h-[38px] rounded-full flex items-center justify-center touch-manipulation transition-all",
              currentTab === 'home' ? "bg-accent/12 text-accent border border-accent/30" : "text-slate/60"
            )}
          >
            <IconHome size={16} />
          </button>
          <button
            onClick={() => handleNavClick('esports')}
            aria-current={currentTab === 'esports' ? 'page' : undefined}
            aria-label="Esports"
            className={cn(
              "min-w-[38px] min-h-[38px] rounded-full flex items-center justify-center touch-manipulation transition-all",
              currentTab === 'esports' ? "bg-accent/12 text-accent border border-accent/30" : "text-slate/60"
            )}
          >
            <IconGamepad size={16} />
          </button>
          <button
            onClick={() => handleNavClick('meetings')}
            aria-current={currentTab === 'meetings' ? 'page' : undefined}
            aria-label="Meetings"
            className={cn(
              "min-w-[38px] min-h-[38px] rounded-full flex items-center justify-center touch-manipulation transition-all",
              currentTab === 'meetings' ? "bg-accent/12 text-accent border border-accent/30" : "text-slate/60"
            )}
          >
            <IconCalendar size={16} />
          </button>
        </div>

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

        {/* Right side actions */}
        <div className="flex items-center gap-2 sm:gap-4 ml-auto shrink-0 z-10 relative">
          <ThemeToggle theme={theme} toggleTheme={toggleTheme} />

          <a href="https://discord.gg/HZ2bQsmaSK" target="_blank" rel="noopener noreferrer" className="hidden md:flex bg-[#5865F2] hover:bg-[#4752C4] text-white px-5 py-2 rounded-full font-sans font-semibold text-sm items-center gap-2 w-fit transition-opacity hover:opacity-90">
              <EditableSiteText as="span" contentKey="navbar.joinDiscord" fallback="Join Discord" siteContent={siteContent} setSiteContent={setSiteContent} editor={contentEditor} className="relative z-10 transition-colors duration-300" />
              <IconArrowRight size={16} className="relative z-10 transition-colors duration-300" />
            </a>
          <a
            href="https://discord.gg/HZ2bQsmaSK"
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => haptics.light()}
            aria-label="Join Discord"
            className="md:hidden min-w-[38px] min-h-[38px] rounded-full bg-[#5865F2]/10 border border-[#5865F2]/20 text-[#5865F2] flex items-center justify-center touch-manipulation"
          >
            <IconDiscord size={16} />
          </a>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
