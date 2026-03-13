import React, { useEffect, useState, useCallback, useRef, lazy, Suspense } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ScrollToPlugin } from 'gsap/ScrollToPlugin';
import { onAuthStateChanged } from 'firebase/auth';
import { db, auth } from './firebase';
import { onSnapshot, doc, getDoc } from 'firebase/firestore';
import { ThemeProvider } from './context/ThemeContext.jsx';
import { MobileProvider } from './context/MobileProvider';
import { useMobile } from './hooks/useMobile';
import Navbar from './components/Navbar';
import AdminDashboard from './components/AdminDashboard';
import { useHaptics } from './hooks/useHaptics';
import CustomCursor from './ui/CustomCursor';
import Footer from './components/Footer';
import { BackdropDecoration } from './components/BackdropDecoration';

// Lazy-load tabs — only the active tab's JS is downloaded
const HomeTab = lazy(() => import('./pages/HomeTab'));
const EsportsTab = lazy(() => import('./pages/EsportsTab'));
const MeetingsTab = lazy(() => import('./pages/MeetingsTab'));
const LegalTab = lazy(() => import('./pages/LegalTab'));

gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);

const VALID_TABS = ['home', 'esports', 'meetings', 'legal', 'admin'];

// Inner component so it can use the useMobile hook (needs MobileProvider above)
function AppInner() {
  const { isMobile } = useMobile();
  const scrollTriggerTimeoutRef = useRef(null);

  const getInitialTab = () => {
    const path = window.location.pathname.replace('/', '').toLowerCase();
    return VALID_TABS.includes(path) ? path : 'home';
  };

  const [currentTab, setCurrentTab] = useState(getInitialTab);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const haptics = useHaptics();

  const handleTabChange = useCallback((newTab, isPopState = false) => {
    if (newTab === currentTab || isTransitioning) return;
    haptics.selection();
    setIsTransitioning(true);

    if (!isPopState) {
      window.history.pushState(null, '', `/${newTab}`);
    }

    if (isMobile) {
      // On mobile: CSS opacity transition is sufficient, avoid GSAP overhead
      window.scrollTo(0, 0);
      setCurrentTab(newTab);
      setIsTransitioning(false);
      return;
    }

    const tl = gsap.timeline();
    tl.to('#main-content', { opacity: 0, duration: 0.15, ease: 'power2.in' })
      .call(() => {
        window.scrollTo(0, 0);
        setCurrentTab(newTab);
        gsap.set('#main-content', { clearProps: 'all', opacity: 0 });
      })
      .to('#main-content', { opacity: 1, duration: 0.25, ease: 'power2.out' })
      .call(() => {
        setIsTransitioning(false);
        if (!isMobile) {
          if (scrollTriggerTimeoutRef.current) clearTimeout(scrollTriggerTimeoutRef.current);
          scrollTriggerTimeoutRef.current = setTimeout(() => {
            ScrollTrigger.refresh();
            scrollTriggerTimeoutRef.current = null;
          }, 150);
        }
      });
  }, [currentTab, isTransitioning, haptics, isMobile]);

  useEffect(() => {
    return () => {
      if (scrollTriggerTimeoutRef.current) clearTimeout(scrollTriggerTimeoutRef.current);
    };
  }, []);

  useEffect(() => {
    // If we land on '/', rewrite URL to '/home' cleanly without triggering history duplicate
    if (window.location.pathname === '/') {
      window.history.replaceState(null, '', '/home');
    }

    const handlePopState = () => {
      const path = window.location.pathname.replace('/', '').toLowerCase() || 'home';
      const resolvedPath = VALID_TABS.includes(path) ? path : 'home';
      if (resolvedPath !== currentTab) {
        handleTabChange(resolvedPath, true);
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [currentTab, handleTabChange]);

  // Dynamic document title per tab
  useEffect(() => {
    const titles = { home: 'Home', esports: 'Esports', meetings: 'Meetings', legal: 'Legal', admin: 'Admin' };
    const segment = titles[currentTab] || 'Home';
    document.title = `${segment} | Campbell CTRL`;
  }, [currentTab]);

  const [isAdmin, setIsAdmin] = useState(false);
  const [authenticatedUser, setAuthenticatedUser] = useState(null);
  const [authInitialized, setAuthInitialized] = useState(false);
  const [gamesList, setGamesList] = useState([]);
  const [standings, setStandings] = useState([]);
  const [rankings, setRankings] = useState([]);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [dataError, setDataError] = useState(null);

// ─── AUTH & DATA LISTENERS ───────────────────────────────────────────

  const authUnsubRef = useRef(null);

  useEffect(() => {
    // Check for 30-day session expiry
    const authExpiry = localStorage.getItem('auth_expiry');
    if (authExpiry && Date.now() > Number(authExpiry)) {
      auth.signOut();
      localStorage.removeItem('auth_expiry');
    }

    let cancelled = false;
    getDoc(doc(db, 'config', 'admins')).then((snap) => {
      if (cancelled) return;
      const allowedEmails = (snap.exists() ? snap.data().emails || [] : [])
        .map(e => e.toLowerCase());
      authUnsubRef.current = onAuthStateChanged(auth, (user) => {
        const isAuthorized = user && allowedEmails.includes(user.email?.toLowerCase());
        setAuthenticatedUser(isAuthorized ? user : null);
        setAuthInitialized(true);
      });
    }).catch(() => {
      if (cancelled) return;
      authUnsubRef.current = onAuthStateChanged(auth, () => {
        setAuthenticatedUser(null);
        setAuthInitialized(true);
      });
    });

    return () => {
      cancelled = true;
      authUnsubRef.current?.();
      authUnsubRef.current = null;
    };
  }, []);

  useEffect(() => {
    const unsub = onSnapshot(
      doc(db, "global", "data"),
      (docSnap) => {
        setDataError(null);
        setDataLoaded(true);
        if (docSnap.exists()) {
          const data = docSnap.data();
          const threeHoursAgo = Date.now() - 3 * 60 * 60 * 1000;
          const filteredGames = (data.gamesList || []).filter(game => {
            if (!game.date) return true;
            try {
              const eventTime = new Date(`${game.date} ${game.time || '12:00 PM'}`).getTime();
              return isNaN(eventTime) || eventTime > threeHoursAgo;
            } catch { return true; }
          });
          if (data.gamesList) setGamesList(filteredGames);
          if (data.standings) setStandings(data.standings);
          if (data.rankings) setRankings(data.rankings);
        }
      },
      (err) => {
        setDataError(err?.message || 'Could not load latest data.');
        setDataLoaded(true);
      }
    );
    return () => unsub();
  }, []);

  // ─── RENDER ───────────────────────────────────────────────────────────

  return (
    <div className="bg-background min-h-screen font-sans selection:bg-accent selection:text-background pb-1 relative">
      <a
        href="#main-content"
        className="hidden md:block fixed left-4 top-4 z-[100] -translate-y-[200%] rounded-lg bg-accent px-4 py-2 text-background font-semibold shadow-lg transition-transform focus:outline-none focus-visible:translate-y-0 focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        Skip to main content
      </a>
      <BackdropDecoration />
      <CustomCursor />

      <Navbar currentTab={currentTab} onNavigate={handleTabChange} />

      {dataError && (
        <div className="sticky top-20 left-0 right-0 z-30 mx-4 max-w-2xl rounded-xl border border-slate/20 bg-slate/10 px-4 py-3 text-center text-sm text-primary md:left-1/2 md:mx-auto md:-translate-x-1/2" role="alert">
          {dataError} Check your connection.
        </div>
      )}

      <main id="main-content" tabIndex={-1}>
        <Suspense fallback={<div className="flex min-h-[40vh] items-center justify-center text-slate" aria-live="polite">Loading…</div>}>
          {currentTab === 'home' && <HomeTab gamesList={gamesList} standings={standings} dataLoaded={dataLoaded} />}
          {currentTab === 'esports' && <EsportsTab gamesList={gamesList} standings={standings} rankings={rankings} dataLoaded={dataLoaded} />}
          {currentTab === 'meetings' && <MeetingsTab />}
          {currentTab === 'legal' && <LegalTab />}
        </Suspense>
      </main>

      <Footer onToggleAdmin={() => setIsAdmin(true)} onNavigate={handleTabChange} />

      <AdminDashboard
        isAdmin={isAdmin || currentTab === 'admin'}
        onClose={() => {
          setIsAdmin(false);
          if (currentTab === 'admin') handleTabChange('home');
        }}
        gamesList={gamesList}
        setGamesList={setGamesList}
        standings={standings}
        setStandings={setStandings}
        rankings={rankings}
        setRankings={setRankings}
        authenticatedUser={authenticatedUser}
        authInitialized={authInitialized}
      />
    </div>
  );
}

export default function App() {
  return (
    <MobileProvider>
      <ThemeProvider>
        <AppInner />
      </ThemeProvider>
    </MobileProvider>
  );
}
