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
import Footer from './components/Footer';
import { BackdropDecoration } from './components/BackdropDecoration';
import { ScrollToTop } from './components/ScrollToTop';
import { IconCalendar, IconGamepad } from './components/icons/SvgIcons';

// Lazy-load tabs — only the active tab's JS is downloaded
const HomeTab = lazy(() => import('./pages/HomeTab'));
const EsportsTab = lazy(() => import('./pages/EsportsTab'));
const MeetingsTab = lazy(() => import('./pages/MeetingsTab'));
const LegalTab = lazy(() => import('./pages/LegalTab'));
const AdminPage = lazy(() => import('./pages/AdminPage'));

gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);

const VALID_TABS = ['home', 'esports', 'meetings', 'legal', 'admin'];
const MOBILE_PRIMARY_TABS = ['home', 'esports', 'meetings'];

const PullToRefreshIndicator = ({ pullDistance = 0, refreshing = false }) => (
  <div
    className="md:hidden fixed left-1/2 -translate-x-1/2 z-50 pointer-events-none transition-all duration-150"
    style={{ top: `max(0.5rem, ${Math.min(84, pullDistance)}px)` }}
    aria-hidden
  >
    <div className="px-3 py-1.5 rounded-full border border-slate/15 bg-background/90 backdrop-blur-md text-[10px] font-mono uppercase tracking-[0.2em] text-slate/60">
      {refreshing ? 'Refreshing' : pullDistance > 75 ? 'Release to refresh' : 'Pull to refresh'}
    </div>
  </div>
);

const MobileQuickTabBar = ({
  currentTab,
  onNavigate,
  collapsed,
  onToggleCollapsed,
  installAvailable = false,
  onInstall,
}) => {
  const haptics = useHaptics();
  const tabs = [
    { id: 'home', label: 'Home', icon: 'H' },
    { id: 'esports', label: 'Esports', Icon: IconGamepad },
    { id: 'meetings', label: 'Meetings', Icon: IconCalendar },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 pb-[max(0.5rem,env(safe-area-inset-bottom,0px))] px-3 pointer-events-none">
      <div className="pointer-events-auto rounded-2xl border border-slate/15 bg-background/95 backdrop-blur-xl shadow-[0_-10px_35px_rgba(0,0,0,0.22)]">
        {!collapsed && (
          <div className="grid grid-cols-3 gap-1 px-2 pt-2 pb-1.5">
            {tabs.map(({ id, label, Icon, icon }) => {
              const active = currentTab === id;
              return (
                <button
                  key={id}
                  onClick={() => { haptics.selection(); onNavigate(id); }}
                  className={active
                    ? 'min-h-[46px] rounded-xl bg-accent/12 border border-accent/25 text-accent flex flex-col items-center justify-center gap-0.5'
                    : 'min-h-[46px] rounded-xl border border-transparent text-slate/60 flex flex-col items-center justify-center gap-0.5'
                  }
                  aria-current={active ? 'page' : undefined}
                >
                  {Icon ? <Icon size={15} /> : <span className="font-mono text-xs font-black">{icon}</span>}
                  <span className="text-[10px] font-mono font-black uppercase tracking-wide">{label}</span>
                </button>
              );
            })}
          </div>
        )}
        <div className="flex items-center justify-center border-t border-slate/10">
          <button
            onClick={onToggleCollapsed}
            className="w-full min-h-[36px] text-[9px] font-mono font-bold uppercase tracking-[0.2em] text-slate/40"
          >
            {collapsed ? 'Open Quick Tabs' : 'Hide Quick Tabs'}
          </button>
        </div>
        {installAvailable && !collapsed && (
          <div className="px-2 pb-2">
            <button
              onClick={onInstall}
              className="w-full min-h-[36px] rounded-xl border border-accent/25 bg-accent/10 text-accent text-[10px] font-mono font-bold uppercase tracking-wide"
            >
              Install app
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// Inner component so it can use the useMobile hook (needs MobileProvider above)
function AppInner() {
  const { isMobile } = useMobile();
  const scrollTriggerTimeoutRef = useRef(null);
  const swipeRef = useRef({ startX: 0, startY: 0, active: false, atTop: false });
  const pullTriggeredRef = useRef(false);

  const getInitialTab = () => {
    const path = window.location.pathname.replace('/', '').toLowerCase();
    return VALID_TABS.includes(path) ? path : 'home';
  };

  const [currentTab, setCurrentTab] = useState(getInitialTab);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [mobileTabBarCollapsed, setMobileTabBarCollapsed] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.localStorage.getItem('mobileQuickTabsCollapsed') === '1';
  });
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [deferredInstallPrompt, setDeferredInstallPrompt] = useState(null);
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

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem('mobileQuickTabsCollapsed', mobileTabBarCollapsed ? '1' : '0');
  }, [mobileTabBarCollapsed]);

  useEffect(() => {
    const onBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredInstallPrompt(e);
    };
    const onAppInstalled = () => setDeferredInstallPrompt(null);
    window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt);
    window.addEventListener('appinstalled', onAppInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt);
      window.removeEventListener('appinstalled', onAppInstalled);
    };
  }, []);

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
  const [meetings, setMeetings] = useState([]);
  const [siteContent, setSiteContent] = useState(null);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [dataError, setDataError] = useState(null);

// ─── AUTH & DATA LISTENERS ───────────────────────────────────────────

  const authUnsubRef = useRef(null);

  useEffect(() => {
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
          setMeetings(data.meetings || []);
          if (data.siteContent) setSiteContent(data.siteContent);
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

  if (currentTab === 'admin') {
    return (
      <Suspense fallback={<div className="fixed inset-0 z-[100] bg-background flex items-center justify-center text-slate">Loading admin…</div>}>
        <AdminPage
          onClose={() => handleTabChange('home')}
          gamesList={gamesList}
          setGamesList={setGamesList}
          standings={standings}
          setStandings={setStandings}
          rankings={rankings}
          setRankings={setRankings}
          meetings={meetings}
          setMeetings={setMeetings}
          siteContent={siteContent}
          setSiteContent={setSiteContent}
          authenticatedUser={authenticatedUser}
          authInitialized={authInitialized}
        />
      </Suspense>
    );
  }

  const onMainTouchStart = (e) => {
    if (!isMobile || currentTab === 'legal') return;
    if (!e.touches?.length) return;
    const t = e.touches[0];
    swipeRef.current.active = true;
    swipeRef.current.startX = t.clientX;
    swipeRef.current.startY = t.clientY;
    swipeRef.current.atTop = window.scrollY <= 0;
    pullTriggeredRef.current = false;
  };

  const onMainTouchMove = (e) => {
    if (!isMobile || !swipeRef.current.active) return;
    const t = e.touches?.[0];
    if (!t) return;
    const dy = t.clientY - swipeRef.current.startY;
    if (swipeRef.current.atTop && dy > 0 && !pullTriggeredRef.current) {
      setPullDistance(Math.min(dy, 110));
    }
  };

  const onMainTouchEnd = (e) => {
    if (!isMobile || !swipeRef.current.active) return;
    const touch = e.changedTouches?.[0];
    if (!touch) return;
    const dx = touch.clientX - swipeRef.current.startX;
    const dy = touch.clientY - swipeRef.current.startY;
    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);

    if (pullDistance > 80 && swipeRef.current.atTop && !pullTriggeredRef.current) {
      pullTriggeredRef.current = true;
      setIsRefreshing(true);
      haptics.medium();
      window.location.reload();
      return;
    }

    if (absDx > 65 && absDx > absDy * 1.35) {
      const idx = MOBILE_PRIMARY_TABS.indexOf(currentTab);
      if (idx !== -1) {
        if (dx < 0 && idx < MOBILE_PRIMARY_TABS.length - 1) handleTabChange(MOBILE_PRIMARY_TABS[idx + 1]);
        if (dx > 0 && idx > 0) handleTabChange(MOBILE_PRIMARY_TABS[idx - 1]);
      }
    }

    swipeRef.current.active = false;
    setPullDistance(0);
    if (isRefreshing) setIsRefreshing(false);
  };

  const handleInstallApp = async () => {
    if (!deferredInstallPrompt) return;
    haptics.medium();
    deferredInstallPrompt.prompt();
    const choice = await deferredInstallPrompt.userChoice;
    if (choice?.outcome === 'accepted') {
      setDeferredInstallPrompt(null);
    }
  };

  return (
    <div className="bg-background min-h-screen font-sans selection:bg-accent selection:text-background pb-1 relative">
      {isMobile && pullDistance > 0 && <PullToRefreshIndicator pullDistance={pullDistance} refreshing={isRefreshing} />}
      <a
        href="#main-content"
        className="hidden md:block fixed left-4 top-4 z-[100] -translate-y-[200%] rounded-lg bg-accent px-4 py-2 text-background font-semibold shadow-lg transition-transform focus:outline-none focus-visible:translate-y-0 focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        Skip to main content
      </a>
      <BackdropDecoration />

      <Navbar currentTab={currentTab} onNavigate={handleTabChange} siteContent={siteContent} setSiteContent={setSiteContent} />

      {dataError && (
        <div className="sticky top-20 left-0 right-0 z-30 mx-4 max-w-2xl rounded-xl border border-slate/20 bg-slate/10 px-4 py-3 text-center text-sm text-primary md:left-1/2 md:mx-auto md:-translate-x-1/2" role="alert">
          {dataError} Check your connection.
        </div>
      )}

      <main
        id="main-content"
        tabIndex={-1}
        onTouchStart={onMainTouchStart}
        onTouchMove={onMainTouchMove}
        onTouchEnd={onMainTouchEnd}
        className={isMobile && !mobileTabBarCollapsed ? 'pb-24' : ''}
      >
        <Suspense fallback={<div className="flex min-h-[40vh] items-center justify-center text-slate" aria-live="polite">Loading…</div>}>
          {currentTab === 'home' && <HomeTab gamesList={gamesList} standings={standings} rankings={rankings} meetings={meetings} siteContent={siteContent} setSiteContent={setSiteContent} dataLoaded={dataLoaded} onNavigateToEsports={() => handleTabChange('esports')} />}
          {currentTab === 'esports' && <EsportsTab gamesList={gamesList} standings={standings} rankings={rankings} dataLoaded={dataLoaded} siteContent={siteContent} setSiteContent={setSiteContent} />}
          {currentTab === 'meetings' && <MeetingsTab meetings={meetings} dataLoaded={dataLoaded} siteContent={siteContent} setSiteContent={setSiteContent} />}
          {currentTab === 'legal' && <LegalTab siteContent={siteContent} setSiteContent={setSiteContent} />}
        </Suspense>
      </main>

      <Footer onToggleAdmin={() => handleTabChange('admin')} onNavigate={handleTabChange} siteContent={siteContent} setSiteContent={setSiteContent} />
      {isMobile && currentTab !== 'legal' && (
        <MobileQuickTabBar
          currentTab={currentTab}
          onNavigate={handleTabChange}
          collapsed={mobileTabBarCollapsed}
          onToggleCollapsed={() => setMobileTabBarCollapsed((v) => !v)}
          installAvailable={Boolean(deferredInstallPrompt)}
          onInstall={handleInstallApp}
        />
      )}

      <ScrollToTop />

      <AdminDashboard
        isAdmin={isAdmin}
        onClose={() => setIsAdmin(false)}
        gamesList={gamesList}
        setGamesList={setGamesList}
        standings={standings}
        setStandings={setStandings}
        rankings={rankings}
        setRankings={setRankings}
        meetings={meetings}
        setMeetings={setMeetings}
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
