import React, { useEffect, useState, lazy, Suspense } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ScrollToPlugin } from 'gsap/ScrollToPlugin';
import { onAuthStateChanged } from 'firebase/auth';
import { db, auth } from './firebase';
import { onSnapshot, doc, getDoc } from 'firebase/firestore';
import { ThemeProvider } from './context/ThemeContext';
import { MobileProvider, useMobile } from './hooks/useMobile';
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



// Inner component so it can use the useMobile hook (needs MobileProvider above)
function AppInner() {
  const { isMobile } = useMobile();

  const getInitialTab = () => {
    const path = window.location.pathname.replace('/', '').toLowerCase();
    const validTabs = ['home', 'esports', 'meetings', 'legal'];
    return validTabs.includes(path) ? path : 'home';
  };

  const [currentTab, setCurrentTab] = useState(getInitialTab);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const haptics = useHaptics();

  const handleTabChange = (newTab, isPopState = false) => {
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
        setTimeout(() => ScrollTrigger.refresh(), 50);
      });
  };

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

  const [isAdmin, setIsAdmin] = useState(false);
  const [authenticatedUser, setAuthenticatedUser] = useState(null);
  const [authInitialized, setAuthInitialized] = useState(false);
  const [gamesList, setGamesList] = useState([]);
  const [standings, setStandings] = useState([]);

// ─── AUTH & DATA LISTENERS ───────────────────────────────────────────

  useEffect(() => {
    // Check for 30-day session expiry
    const authExpiry = localStorage.getItem('auth_expiry');
    if (authExpiry && Date.now() > Number(authExpiry)) {
      auth.signOut();
      localStorage.removeItem('auth_expiry');
    }

    let unsubAuth;
    getDoc(doc(db, 'config', 'admins')).then((snap) => {
      const allowedEmails = (snap.exists() ? snap.data().emails || [] : [])
        .map(e => e.toLowerCase());

      unsubAuth = onAuthStateChanged(auth, (user) => {
        const isAuthorized = user && allowedEmails.includes(user.email?.toLowerCase());
        setAuthenticatedUser(isAuthorized ? user : null);
        setAuthInitialized(true);
      });
    }).catch(() => {
      unsubAuth = onAuthStateChanged(auth, () => {
        setAuthenticatedUser(null);
        setAuthInitialized(true);
      });
    });

    return () => unsubAuth?.();
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
          } catch { return true; }
        });

        if (data.gamesList) setGamesList(filteredGames);
        if (data.standings) setStandings(data.standings);
      }
    });
    return () => unsub();
  }, []);

  // ─── RENDER ───────────────────────────────────────────────────────────

  return (
    <div className="bg-background min-h-screen font-sans selection:bg-accent selection:text-background pb-1 relative">
      <BackdropDecoration />
      <CustomCursor />

      <Navbar currentTab={currentTab} onNavigate={handleTabChange} />

      <main id="main-content">
        <Suspense fallback={null}>
          {currentTab === 'home' && <HomeTab gamesList={gamesList} standings={standings} />}
          {currentTab === 'esports' && <EsportsTab gamesList={gamesList} standings={standings} />}
          {currentTab === 'meetings' && <MeetingsTab />}
          {currentTab === 'legal' && <LegalTab />}
        </Suspense>
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
