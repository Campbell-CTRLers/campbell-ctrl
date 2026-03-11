import React, { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ScrollToPlugin } from 'gsap/ScrollToPlugin';
import { onAuthStateChanged } from 'firebase/auth';
import { db, auth } from './firebase';
import { collection, onSnapshot, writeBatch, doc } from 'firebase/firestore';
import { SpeedInsights } from '@vercel/speed-insights/react';
import { Analytics } from '@vercel/analytics/react';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import Navbar from './components/Navbar';
import AdminDashboard from './components/AdminDashboard';
import { useHaptics } from './hooks/useHaptics';
import CustomCursor from './ui/CustomCursor';
import BootSequence from './components/BootSequence';
import Footer from './components/Footer';

// Use shared utility
import { cn } from './utils/cn';

gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);

// ----------------------------------------------------
// COMPONENTS
// ----------------------------------------------------





import HomeTab from './pages/HomeTab';
import EsportsTab from './pages/EsportsTab';
import MeetingsTab from './pages/MeetingsTab';
import LegalTab from './pages/LegalTab';
import { BackdropDecoration } from './components/BackdropDecoration';



export default function App() {
  const getInitialTab = () => {
    const path = window.location.pathname.replace('/', '').toLowerCase();
    const validTabs = ['home', 'esports', 'meetings', 'legal'];
    return validTabs.includes(path) ? path : 'home';
  };

  const [currentTab, setCurrentTab] = useState(getInitialTab);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isBooting, setIsBooting] = useState(() => !sessionStorage.getItem('hasBooted'));
  const haptics = useHaptics();

  useEffect(() => {
    // If we land on '/', rewrite URL to '/home' cleanly without triggering history duplicate
    if (window.location.pathname === '/') {
      window.history.replaceState(null, '', '/home');
    }

    const handlePopState = () => {
      const path = window.location.pathname.replace('/', '').toLowerCase() || 'home';
      if (path !== currentTab) {
        handleTabChange(path, true);
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [currentTab]);

  const handleTabChange = (newTab, isPopState = false) => {
    if (newTab === currentTab || isTransitioning) return;
    haptics.selection();
    setIsTransitioning(true);

    if (!isPopState) {
      window.history.pushState(null, '', `/${newTab}`);
    }

    const tl = gsap.timeline();

    // Simple fade out
    tl.to('#main-content', { opacity: 0, duration: 0.15, ease: 'power2.in' })
      .call(() => {
        window.scrollTo(0, 0);
        setCurrentTab(newTab);
        gsap.set('#main-content', { clearProps: 'all', opacity: 0 });
      })
      // Simple fade in
      .to('#main-content', { opacity: 1, duration: 0.25, ease: 'power2.out' })
      .call(() => {
        setIsTransitioning(false);
        setTimeout(() => ScrollTrigger.refresh(), 50);
      });
  };
  const [isAdmin, setIsAdmin] = useState(false);
  const [authenticatedUser, setAuthenticatedUser] = useState(null);
  const [authInitialized, setAuthInitialized] = useState(false);
  const [gamesList, setGamesList] = useState([]);
  const [standings, setStandings] = useState([]);

// ─── AUTH & DATA LISTENERS ───────────────────────────────────────────

  useEffect(() => {
    const ALLOWED_EMAILS = (import.meta.env.VITE_ADMIN_EMAILS || '').split(',').map(e => e.trim()).filter(Boolean);
    
    // Check for 30-day session expiry
    const authExpiry = localStorage.getItem('auth_expiry');
    if (authExpiry && Date.now() > Number(authExpiry)) {
      auth.signOut();
      localStorage.removeItem('auth_expiry');
    }

    return onAuthStateChanged(auth, (user) => {
      if (user && ALLOWED_EMAILS.includes(user.email)) {
        setAuthenticatedUser(user);
      } else {
        setAuthenticatedUser(null);
      }
      setAuthInitialized(true);
    });
  }, []);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "global", "data"), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        
        // Automated cleanup: remove events older than 3 hours
        const threeHoursAgo = Date.now() - 3 * 60 * 60 * 1000;
        const filteredGames = (data.gamesList || []).filter(game => {
          if (!game.date) return true;
          try {
            const eventTime = new Date(`${game.date} ${game.time || '12:00 PM'}`).getTime();
            return isNaN(eventTime) || eventTime > threeHoursAgo;
          } catch (e) { return true; }
        });

        if (data.gamesList) setGamesList(filteredGames);
        if (data.standings) setStandings(data.standings);
      }
    });
    return () => unsub();
  }, []);

  // ─── RENDER ───────────────────────────────────────────────────────────

  if (isBooting) {
    return (
      <ThemeProvider>
        <BootSequence onComplete={() => setIsBooting(false)} />
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider>
      <div className="bg-background min-h-screen font-sans selection:bg-accent selection:text-background pb-1 relative">
        <BackdropDecoration />
        <CustomCursor />
        
        {/* Navigation Indicator Overlay */}
        <div id="transition-overlay" className="fixed inset-0 z-[100] bg-accent pointer-events-none" style={{ clipPath: 'inset(100% 0 0 0)' }}></div>
        
        <Navbar currentTab={currentTab} onNavigate={handleTabChange} />
        
        <main id="main-content">
          {currentTab === 'home' && <HomeTab gamesList={gamesList} standings={standings} />}
          {currentTab === 'esports' && <EsportsTab gamesList={gamesList} standings={standings} />}
          {currentTab === 'meetings' && <MeetingsTab />}
          {currentTab === 'legal' && <LegalTab />}
        </main>

        <Footer onToggleAdmin={() => setIsAdmin(true)} onNavigate={handleTabChange} />
        
        <AdminDashboard
          isAdmin={isAdmin} 
          onClose={() => setIsAdmin(false)}
          gamesList={gamesList} 
          setGamesList={setGamesList}
          standings={standings} 
          setStandings={setStandings}
          authenticatedUser={authenticatedUser}
          authInitialized={authInitialized}
        />
        
        <SpeedInsights />
        <Analytics />
      </div>
    </ThemeProvider>
  );
}
