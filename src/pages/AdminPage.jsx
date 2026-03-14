import React, { useRef, useState, useEffect, useMemo, useCallback } from 'react';
import gsap from 'gsap';
import {
  IconSettings, IconCloudUpload, IconCalendar, IconCheck, IconTrophy, IconX,
  IconUsers, IconChart, IconPencilEdit, IconLogOut, IconSun, IconMoon,
  IconChevronLeft, IconMenu, IconEye, IconEyeOff, IconGamepad,
} from '../components/icons/SvgIcons';
import { db, auth, googleProvider } from '../firebase';
import { writeBatch, doc, getDoc } from 'firebase/firestore';
import {
  signInWithPopup, signOut, setPersistence,
  browserLocalPersistence, browserSessionPersistence,
} from 'firebase/auth';
import { useTheme } from '../context/useTheme';
import { useHaptics } from '../hooks/useHaptics';
import { cn } from '../utils/cn';
import confetti from 'canvas-confetti';
import AdminScheduleEditor from '../components/admin/AdminScheduleEditor';
import AdminStandingsEditor from '../components/admin/AdminStandingsEditor';
import AdminRankingsEditor from '../components/admin/AdminRankingsEditor';
import AdminMeetingsEditor from '../components/admin/AdminMeetingsEditor';
import AdminSafetySheet from '../components/admin/AdminSafetySheet';
import AdminControlSheet from '../components/admin/AdminControlSheet';
import AdminContentEditor from '../components/admin/AdminContentEditor';
import { teamKey, sameTeam } from '../components/admin/constants';

const SIDEBAR_TABS = [
  { id: 'schedule', label: 'Schedule', Icon: IconGamepad },
  { id: 'standings', label: 'Standings', Icon: IconTrophy },
  { id: 'rankings', label: 'Rankings', Icon: IconChart },
  { id: 'meetings', label: 'Meetings', Icon: IconUsers },
  { id: 'content', label: 'Site Content', Icon: IconPencilEdit },
];

const AdminPage = ({
  onClose,
  gamesList, setGamesList,
  standings, setStandings,
  rankings, setRankings,
  meetings = [], setMeetings,
  siteContent, setSiteContent,
  authenticatedUser, authInitialized,
}) => {
  const { theme, toggleTheme } = useTheme();
  const haptics = useHaptics();

  const [isAuthenticated, setIsAuthenticated] = useState(!!authenticatedUser);
  const [email, setEmail] = useState(authenticatedUser?.email || '');
  const [errorMsg, setErrorMsg] = useState('');
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveErrorMsg, setSaveErrorMsg] = useState('');
  const [adminTab, setAdminTab] = useState('schedule');
  const [rememberMe, setRememberMe] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const [activeControlId, setActiveControlId] = useState(null);
  const [showSafetySheet, setShowSafetySheet] = useState(false);

  const safetySheetRef = useRef(null);
  const controlSheetRef = useRef(null);
  const tabContentRef = useRef(null);

  const originalDataRef = useRef(null);
  const hasSyncedRef = useRef(false);
  const [isDirty, setIsDirty] = useState(false);
  const [, setAuthError] = useState('');

  useEffect(() => {
    if (!originalDataRef.current) return;
    setIsDirty(
      JSON.stringify(originalDataRef.current) !== JSON.stringify({ gamesList, standings, rankings, meetings, siteContent })
    );
  }, [gamesList, standings, rankings, meetings, siteContent]);

  useEffect(() => {
    if (authenticatedUser) {
      setIsAuthenticated(true);
      setEmail(authenticatedUser.email || '');
    }
  }, [authenticatedUser]);

  useEffect(() => {
    if (!isAuthenticated) {
      setPersistence(auth, rememberMe ? browserLocalPersistence : browserSessionPersistence).catch((error) => {
        console.error(error);
        setAuthError('Could not apply "Remember Me" preference.');
      });
    }
  }, [rememberMe, isAuthenticated]);

  useEffect(() => {
    const expiry = localStorage.getItem('auth_expiry');
    if (expiry && Date.now() > Number(expiry)) {
      signOut(auth);
      localStorage.removeItem('auth_expiry');
      setIsAuthenticated(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated && !saveSuccess && originalDataRef.current) return;
    if (isAuthenticated) {
      originalDataRef.current = JSON.parse(JSON.stringify({ gamesList, standings, rankings, meetings, siteContent }));
      setIsDirty(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, saveSuccess]);

  useEffect(() => {
    if (tabContentRef.current && isAuthenticated) {
      gsap.fromTo(tabContentRef.current, { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.25, ease: 'power3.out' });
    }
  }, [adminTab, isAuthenticated]);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const isMobileView = () => typeof window !== 'undefined' && window.innerWidth < 768;

  // Safety sheet animations
  useEffect(() => {
    if (showSafetySheet && safetySheetRef.current) {
      const d = isMobileView() ? 0.35 : 0.5;
      gsap.fromTo(safetySheetRef.current, { y: '100%' }, { y: '0%', duration: d, ease: 'power3.out' });
    }
  }, [showSafetySheet]);

  const closeSafetySheet = (onDone) => {
    if (!safetySheetRef.current) { setShowSafetySheet(false); onDone?.(); return; }
    const d = isMobileView() ? 0.2 : 0.25;
    gsap.to(safetySheetRef.current, { y: '100%', duration: d, ease: 'power2.in', onComplete: () => { setShowSafetySheet(false); onDone?.(); } });
  };

  useEffect(() => {
    if (activeControlId && controlSheetRef.current) {
      const d = isMobileView() ? 0.35 : 0.5;
      gsap.fromTo(controlSheetRef.current, { y: '100%' }, { y: '0%', duration: d, ease: 'power3.out' });
    }
  }, [activeControlId]);

  const closeControlSheet = () => {
    if (!controlSheetRef.current) { setActiveControlId(null); return; }
    const d = isMobileView() ? 0.2 : 0.25;
    gsap.to(controlSheetRef.current, { y: '100%', duration: d, ease: 'power2.in', onComplete: () => setActiveControlId(null) });
  };

  // Standings <-> Rankings sync
  const syncStandingsWithRankings = useCallback(() => {
    haptics.light();
    const base = Date.now() * 1000;
    const standingKeys = new Set(standings.map(teamKey));
    const rankingKeys = new Set(rankings.map(teamKey));

    const newRankings = [];
    standings.forEach((standing, index) => {
      if (!rankingKeys.has(teamKey(standing))) {
        newRankings.push({ id: base + index, team: 'Campbell eSpartans', game: standing.game, leagueRank: '', leagueName: 'PlayVS', isAlt: standing.isAlt ?? false, isDel: standing.isDel ?? false });
        rankingKeys.add(teamKey(standing));
      }
    });
    const newStandings = [];
    rankings.forEach((ranking, index) => {
      if (!standingKeys.has(teamKey(ranking))) {
        newStandings.push({ id: base + 10000 + index, team: 'Campbell eSpartans', game: ranking.game, wins: 0, losses: 0, leagueRank: '', leagueName: 'PlayVS', isAlt: ranking.isAlt ?? false, isDel: ranking.isDel ?? false });
        standingKeys.add(teamKey(ranking));
      }
    });

    const keysWithStandings = new Set([...standings, ...newStandings].map(teamKey));
    const keysWithRankings = new Set([...rankings, ...newRankings].map(teamKey));
    setRankings([...rankings, ...newRankings].filter((r) => keysWithStandings.has(teamKey(r))));
    setStandings([...standings, ...newStandings].filter((s) => keysWithRankings.has(teamKey(s))));
  }, [standings, rankings, setStandings, setRankings, haptics]);

  const prevLengthsRef = useRef({ standings: 0, rankings: 0 });
  useEffect(() => {
    if (!isAuthenticated) return;
    const sl = standings.length;
    const rl = rankings.length;
    const prev = prevLengthsRef.current;
    const wasEmpty = prev.standings === 0 && prev.rankings === 0;
    const nowHasData = sl > 0 || rl > 0;
    if (!hasSyncedRef.current || (wasEmpty && nowHasData)) {
      syncStandingsWithRankings();
      hasSyncedRef.current = true;
    }
    prevLengthsRef.current = { standings: sl, rankings: rl };
  }, [isAuthenticated, standings, rankings, syncStandingsWithRankings]);

  // Auth
  const handleGoogleSignIn = async () => {
    setIsAuthenticating(true);
    setErrorMsg('');
    const authExpiry = rememberMe ? Date.now() + 30 * 24 * 60 * 60 * 1000 : 0;
    try {
      haptics.light();
      const result = await signInWithPopup(auth, googleProvider);
      const snap = await getDoc(doc(db, 'config', 'admins'));
      const allowedEmails = (snap.exists() ? snap.data().emails || [] : []).map(e => e.toLowerCase());
      const isAuthorized = allowedEmails.includes(result.user.email?.toLowerCase());
      if (!isAuthorized) {
        await signOut(auth);
        haptics.error();
        setErrorMsg('Unauthorized account.');
        return;
      }
      if (rememberMe) localStorage.setItem('auth_expiry', String(authExpiry));
      else localStorage.removeItem('auth_expiry');
      haptics.success();
      setIsAuthenticated(true);
    } catch (_err) {
      haptics.error();
      setErrorMsg(_err.code === 'auth/popup-closed-by-user' ? 'Sign-in cancelled.' : 'Authentication failed.');
    } finally { setIsAuthenticating(false); }
  };

  // Save
  const handleSaveToCloud = async () => {
    setIsSaving(true);
    setSaveErrorMsg('');
    try {
      haptics.medium();
      const batch = writeBatch(db);
      const data = JSON.parse(JSON.stringify({ gamesList, standings, rankings, meetings, siteContent }));
      batch.set(doc(db, 'global', 'data'), data);
      await batch.commit();
      haptics.success();
      confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 }, colors: ['#0038A8', '#FFFFFF', '#000000'] });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch (_err) {
      haptics.error();
      setSaveErrorMsg(_err.message || 'Failed to sync with cloud.');
    } finally { setIsSaving(false); }
  };

  // CRUD handlers
  const handleAddGame = () => {
    haptics.selection();
    const newId = Date.now();
    setGamesList([...gamesList, { id: newId, game: 'Smash Bros', opponent: 'TBD', date: '', time: '4:00 PM', type: 'PlayVS Rank', isAlt: false, isDel: false }]);
    if (isMobileView()) setActiveControlId(newId);
  };
  const updateGame = (id, field, value) => setGamesList(gamesList.map(g => g.id === id ? { ...g, [field]: value } : g));
  const setGameRoster = (id, roster) => {
    const isAlt = roster === 'ALT';
    const isDel = roster === 'DEL';
    setGamesList(gamesList.map((g) => (g.id === id ? { ...g, isAlt, isDel } : g)));
  };
  const deleteGame = (id) => { haptics.light(); setGamesList(gamesList.filter(g => g.id !== id)); if (activeControlId === id) setActiveControlId(null); };

  const handleAddStanding = () => {
    haptics.selection();
    const newId = Date.now() * 1000;
    setStandings([...standings, { id: newId, team: 'Campbell eSpartans', game: 'Smash Bros', wins: 0, losses: 0, leagueRank: '', leagueName: 'PlayVS', isAlt: false, isDel: false }]);
    setRankings([...rankings, { id: newId + 1, team: 'Campbell eSpartans', game: 'Smash Bros', leagueRank: '', leagueName: 'PlayVS', isAlt: false, isDel: false }]);
    if (isMobileView()) setActiveControlId(newId);
  };
  const updateStanding = (id, field, value) => {
    const standing = standings.find((s) => s.id === id);
    if (!standing) return;
    if (field === 'game') setRankings(rankings.map((r) => (sameTeam(r, standing) ? { ...r, game: value } : r)));
    if (field === 'isAlt') setRankings(rankings.map((r) => (sameTeam(r, standing) ? { ...r, isAlt: value } : r)));
    if (field === 'isDel') setRankings(rankings.map((r) => (sameTeam(r, standing) ? { ...r, isDel: value } : r)));
    setStandings(standings.map((s) => (s.id === id ? { ...s, [field]: (field === 'wins' || field === 'losses') ? Number(value) : value } : s)));
  };
  const setStandingRoster = (id, roster) => {
    const standing = standings.find((s) => s.id === id);
    if (!standing) return;
    const isAlt = roster === 'ALT';
    const isDel = roster === 'DEL';
    setStandings(standings.map((s) => (s.id === id ? { ...s, isAlt, isDel } : s)));
    setRankings(rankings.map((r) => (sameTeam(r, standing) ? { ...r, isAlt, isDel } : r)));
  };
  const deleteStanding = (id) => {
    haptics.light();
    const standing = standings.find((s) => s.id === id);
    if (standing) {
      const rankIdx = rankings.findIndex((r) => sameTeam(r, standing));
      if (rankIdx !== -1) setRankings(rankings.filter((_, i) => i !== rankIdx));
    }
    setStandings(standings.filter((s) => s.id !== id));
    if (activeControlId === id) setActiveControlId(null);
  };

  const handleAddRanking = () => {
    haptics.selection();
    const newId = Date.now() * 1000;
    setRankings([...rankings, { id: newId, team: 'Campbell eSpartans', game: 'Smash Bros', leagueRank: '', leagueName: 'PlayVS', isAlt: false, isDel: false }]);
    setStandings([...standings, { id: newId + 1, team: 'Campbell eSpartans', game: 'Smash Bros', wins: 0, losses: 0, leagueRank: '', leagueName: 'PlayVS', isAlt: false, isDel: false }]);
    if (isMobileView()) setActiveControlId(newId);
  };
  const updateRanking = (id, field, value) => {
    const ranking = rankings.find((r) => r.id === id);
    if (!ranking) return;
    if (field === 'game') setStandings(standings.map((s) => (sameTeam(s, ranking) ? { ...s, game: value } : s)));
    if (field === 'isAlt') setStandings(standings.map((s) => (sameTeam(s, ranking) ? { ...s, isAlt: value } : s)));
    if (field === 'isDel') setStandings(standings.map((s) => (sameTeam(s, ranking) ? { ...s, isDel: value } : s)));
    setRankings(rankings.map((r) => (r.id === id ? { ...r, [field]: value } : r)));
  };
  const setRankingRoster = (id, roster) => {
    const ranking = rankings.find((r) => r.id === id);
    if (!ranking) return;
    const isAlt = roster === 'ALT';
    const isDel = roster === 'DEL';
    setRankings(rankings.map((r) => (r.id === id ? { ...r, isAlt, isDel } : r)));
    setStandings(standings.map((s) => (sameTeam(s, ranking) ? { ...s, isAlt, isDel } : s)));
  };
  const deleteRanking = (id) => {
    haptics.light();
    const ranking = rankings.find((r) => r.id === id);
    if (ranking) {
      const standIdx = standings.findIndex((s) => sameTeam(s, ranking));
      if (standIdx !== -1) setStandings(standings.filter((_, i) => i !== standIdx));
    }
    setRankings(rankings.filter((r) => r.id !== id));
    if (activeControlId === id) setActiveControlId(null);
  };

  const handleAddMeeting = () => {
    haptics.selection();
    const newId = Date.now();
    setMeetings([...meetings, { id: newId, title: 'Club Meeting', days: ['Fri'], startTime: '3:30 PM', endTime: '5:30 PM', location: 'Learning Commons', description: '' }]);
    if (isMobileView()) setActiveControlId(newId);
  };
  const updateMeeting = (id, field, value) => setMeetings(meetings.map((m) => (m.id === id ? { ...m, [field]: value } : m)));
  const deleteMeeting = (id) => { haptics.light(); setMeetings(meetings.filter((m) => m.id !== id)); if (activeControlId === id) setActiveControlId(null); };

  const handleCloseAttempt = useCallback(() => {
    haptics.rigid();
    if (isDirty) setShowSafetySheet(true);
    else onClose();
  }, [isDirty, haptics, onClose]);

  const discardAndExit = () => {
    haptics.error();
    closeSafetySheet(onClose);
  };

  useEffect(() => {
    const onKeyDown = (e) => { if (e.key === 'Escape') { e.preventDefault(); handleCloseAttempt(); } };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [handleCloseAttempt]);

  const activeControlItem = useMemo(() => {
    if (!activeControlId) return null;
    return gamesList.find(g => g.id === activeControlId) || standings.find(s => s.id === activeControlId) || rankings.find(r => r.id === activeControlId) || meetings.find(m => m.id === activeControlId);
  }, [activeControlId, gamesList, standings, rankings, meetings]);

  const handleSignOut = async () => {
    haptics.light();
    await signOut(auth);
    localStorage.removeItem('auth_expiry');
    setIsAuthenticated(false);
    onClose();
  };

  // --- LOGIN SCREEN ---
  if (!isAuthenticated) {
    return (
      <div className="fixed inset-0 z-[100] bg-background flex items-center justify-center">
        <div className="max-w-md w-full mx-4 bg-background rounded-[2.5rem] p-8 sm:p-10 relative shadow-2xl border border-slate/20 flex flex-col items-center min-h-[450px]">
          {!authInitialized ? (
            <div className="flex flex-col items-center justify-center gap-6 my-auto">
              <div className="w-12 h-12 border-3 border-accent/20 border-t-accent rounded-full animate-spin" />
              <div className="flex flex-col items-center gap-1">
                <span className="font-mono text-[10px] text-slate/40 uppercase tracking-[0.2em]">Verifying Protocol</span>
                <span className="font-mono text-[9px] text-slate/20 uppercase animate-pulse">Establishing Secure Link...</span>
              </div>
            </div>
          ) : (
            <>
              <button onClick={onClose} className="absolute top-6 right-6 w-10 h-10 flex items-center justify-center rounded-full hover:bg-slate/10 text-slate transition-all" aria-label="Back to site">
                <IconX size={20} />
              </button>
              <div className="w-16 h-16 flex items-center justify-center text-accent mb-4"><IconSettings size={32} /></div>
              <h2 className="font-sans font-bold text-2xl text-primary mb-1 text-center">Admin Access</h2>
              <p className="font-sans text-slate/60 text-xs mb-8 text-center px-6">Sign in with your authorized Google account.</p>
              {errorMsg && <span className="font-mono text-[10px] text-red-500 text-center mb-4">{errorMsg}</span>}
              <button type="button" onClick={handleGoogleSignIn} disabled={isAuthenticating} className="w-full h-[54px] bg-background border border-slate/10 rounded-2xl flex items-center justify-center gap-3 font-bold text-sm hover:border-accent transition-all active:scale-95 shadow-sm text-primary">
                {isAuthenticating
                  ? <div className="w-5 h-5 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
                  : (<><svg viewBox="0 0 24 24" className="w-5 h-5" xmlns="http://www.w3.org/2000/svg"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>Sign in with Google</>)}
              </button>
              <div className="flex flex-col items-center gap-4 mt-4 w-full bg-slate/5 p-4 rounded-2xl border border-slate/10">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <div className="relative">
                    <input type="checkbox" checked={rememberMe} onChange={(e) => { haptics.light(); setRememberMe(e.target.checked); }} className="sr-only" />
                    <div className={cn("w-5 h-5 rounded-md border-2 transition-all duration-300 flex items-center justify-center shadow-sm", rememberMe ? "border-accent bg-accent" : "border-slate/20 bg-background group-hover:border-accent/40")}>
                      <div className={cn("w-2 h-1.5 border-l-2 border-b-2 border-white -rotate-45 mb-0.5 transition-all duration-300", rememberMe ? "opacity-100 scale-100" : "opacity-0 scale-50")} />
                    </div>
                  </div>
                  <span className="font-sans text-xs font-bold text-slate/50 group-hover:text-primary transition-colors select-none">Stay signed in for 30 days</span>
                </label>
                <div className="flex flex-col items-center text-center gap-0.5">
                  <span className="font-mono text-[8px] text-accent/40 font-bold uppercase tracking-[0.2em]">Security Protocol</span>
                  <p className="font-sans text-[9px] text-slate/30 leading-relaxed max-w-[200px]">Authentication persists for 1 month. Enable only on private devices.</p>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  // --- MAIN ADMIN PAGE ---
  return (
    <div className="fixed inset-0 z-[100] bg-background flex flex-col md:flex-row overflow-hidden">
      {/* No mobile top bar — navigation lives entirely in the bottom bar */}

      {/* Desktop sidebar */}
      <aside className={cn("hidden md:flex flex-col border-r border-slate/10 bg-background shrink-0 transition-all duration-300", sidebarCollapsed ? "w-[72px]" : "w-64")}>
        <div className={cn("flex items-center gap-3 p-6 pb-4", sidebarCollapsed && "justify-center px-3")}>
          <div className="w-10 h-10 bg-accent/10 rounded-2xl flex items-center justify-center text-accent shrink-0"><IconSettings size={20} /></div>
          {!sidebarCollapsed && (
            <div className="flex flex-col min-w-0">
              <span className="font-sans font-black text-lg text-primary uppercase tracking-tighter italic leading-none">ADMIN</span>
              <span className="font-mono text-[9px] text-slate/40 mt-1 uppercase tracking-widest truncate">{email}</span>
            </div>
          )}
        </div>

        <nav className="flex flex-col gap-1 px-3 flex-1 mt-2">
          {SIDEBAR_TABS.map(({ id, label, Icon }) => (
            <button key={id} onClick={() => { haptics.selection(); setAdminTab(id); }} className={cn("flex items-center gap-3 px-4 py-3 rounded-xl font-sans font-semibold text-sm transition-all", sidebarCollapsed && "justify-center px-0", adminTab === id ? "bg-accent/10 text-accent" : "text-slate/60 hover:text-primary hover:bg-slate/5")} title={sidebarCollapsed ? label : undefined}>
              <Icon size={18} className="shrink-0" />
              {!sidebarCollapsed && label}
            </button>
          ))}
        </nav>

        <div className={cn("flex flex-col gap-1 p-3 border-t border-slate/10", sidebarCollapsed && "items-center")}>
          <button onClick={() => { haptics.light(); setSidebarCollapsed(!sidebarCollapsed); }} className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm text-slate/40 hover:text-primary hover:bg-slate/5 transition-all" title={sidebarCollapsed ? 'Expand' : 'Collapse'}>
            <IconChevronLeft size={18} className={cn("transition-transform shrink-0", sidebarCollapsed && "rotate-180")} />
            {!sidebarCollapsed && <span className="font-semibold">Collapse</span>}
          </button>
          <button onClick={toggleTheme} className={cn("flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm text-slate/40 hover:text-primary hover:bg-slate/5 transition-all", sidebarCollapsed && "justify-center px-0")} title={theme === 'dark' ? 'Light Mode' : 'Dark Mode'}>
            {theme === 'dark' ? <IconSun size={18} className="shrink-0" /> : <IconMoon size={18} className="shrink-0" />}
            {!sidebarCollapsed && <span className="font-semibold">{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>}
          </button>
          <button onClick={handleCloseAttempt} className={cn("flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm text-slate/40 hover:text-primary hover:bg-slate/5 transition-all", sidebarCollapsed && "justify-center px-0")} title="Back to Site">
            <IconChevronLeft size={18} className="shrink-0" />
            {!sidebarCollapsed && <span className="font-semibold">Back to Site</span>}
          </button>
          <button onClick={handleSignOut} className={cn("flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm text-red-500/40 hover:text-red-500 hover:bg-red-500/5 transition-all", sidebarCollapsed && "justify-center px-0")} title="Sign Out">
            <IconLogOut size={18} className="shrink-0" />
            {!sidebarCollapsed && <span className="font-semibold">Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* Main content area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Desktop top bar */}
        <header className="hidden md:flex items-center justify-between px-8 py-4 border-b border-slate/10 shrink-0">
          <div className="flex items-center gap-3">
            <h1 className="font-sans font-black text-2xl text-primary uppercase tracking-tighter italic">
              {SIDEBAR_TABS.find(t => t.id === adminTab)?.label || 'Admin'}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            {saveErrorMsg && <span className="font-mono text-[9px] text-red-400 max-w-[200px] leading-tight">{saveErrorMsg}</span>}
            <button onClick={handleSaveToCloud} disabled={isSaving} className={cn("px-6 py-2.5 rounded-2xl font-bold text-sm transition-all active:scale-95 flex items-center gap-2", isDirty ? "bg-accent text-white shadow-lg shadow-accent/25" : "bg-slate/10 text-slate", isSaving && "opacity-70 scale-95")}>
              {isSaving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><IconCloudUpload size={16} /><span>Publish</span></>}
              {saveSuccess && <IconCheck size={16} className="text-green-300" />}
            </button>
          </div>
        </header>

        {/* Tab content */}
        <div ref={tabContentRef} className="flex-1 overflow-y-auto custom-scrollbar px-4 sm:px-8 py-6 pb-40 md:pb-8">
          {adminTab === 'schedule' && (
            <AdminScheduleEditor gamesList={gamesList} onAddGame={handleAddGame} updateGame={updateGame} setGameRoster={setGameRoster} deleteGame={deleteGame} setActiveControlId={setActiveControlId} />
          )}
          {adminTab === 'standings' && (
            <AdminStandingsEditor standings={standings} onSync={syncStandingsWithRankings} onAddStanding={handleAddStanding} updateStanding={updateStanding} setStandingRoster={setStandingRoster} deleteStanding={deleteStanding} setActiveControlId={setActiveControlId} />
          )}
          {adminTab === 'rankings' && (
            <AdminRankingsEditor rankings={rankings} onSync={syncStandingsWithRankings} onAddRanking={handleAddRanking} updateRanking={updateRanking} setRankingRoster={setRankingRoster} deleteRanking={deleteRanking} setActiveControlId={setActiveControlId} />
          )}
          {adminTab === 'meetings' && (
            <AdminMeetingsEditor meetings={meetings} onAddMeeting={handleAddMeeting} updateMeeting={updateMeeting} deleteMeeting={deleteMeeting} setActiveControlId={setActiveControlId} />
          )}
          {adminTab === 'content' && (
            <AdminContentEditor siteContent={siteContent} setSiteContent={setSiteContent} isMobile={isMobileView()} />
          )}
        </div>

        {/* Mobile bottom nav */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-background border-t border-slate/15 px-2 pt-3 pb-[calc(2rem+env(safe-area-inset-bottom,0px))] flex items-center justify-around z-40 shadow-[0_-15px_50px_rgba(0,0,0,0.7)] touch-manipulation">
          {SIDEBAR_TABS.map(({ id, label, Icon }) => (
            <button key={id} onClick={() => { haptics.selection(); setAdminTab(id); }} className={cn("flex flex-col items-center gap-1 transition-all text-[8px] font-black uppercase tracking-tighter touch-manipulation", adminTab === id ? "text-accent scale-110" : "text-slate opacity-40")}>
              <Icon size={16} /><span className="leading-none">{label.split(' ')[0]}</span>
            </button>
          ))}
          <button onClick={handleSaveToCloud} disabled={isSaving} className={cn("flex flex-col items-center gap-1 transition-all text-[8px] font-black uppercase tracking-tighter touch-manipulation", isDirty ? "text-accent" : "text-slate opacity-40")}>
            {isSaving ? <div className="w-4 h-4 border-2 border-accent/30 border-t-accent rounded-full animate-spin" /> : <IconCloudUpload size={16} />}
            {saveSuccess ? <span className="leading-none text-green-500">Done</span> : <span className="leading-none">Publish</span>}
          </button>
          <button onClick={handleCloseAttempt} className="flex flex-col items-center gap-1 transition-all text-[8px] font-black uppercase tracking-tighter touch-manipulation text-slate opacity-60">
            <IconX size={16} /><span className="leading-none">Exit</span>
          </button>
        </div>
      </div>

      {/* Safety sheet */}
      {showSafetySheet && (
        <AdminSafetySheet ref={safetySheetRef} onDiscard={discardAndExit} onKeepEditing={() => closeSafetySheet()} onBackdropClick={() => closeSafetySheet()} />
      )}

      {/* Control sheet (mobile editing) */}
      {activeControlId && activeControlItem && (
        <AdminControlSheet
          ref={controlSheetRef}
          adminTab={adminTab}
          activeControlId={activeControlId}
          activeControlItem={activeControlItem}
          onClose={closeControlSheet}
          onRosterChange={(v) => {
            if (adminTab === 'schedule') setGameRoster(activeControlId, v);
            else if (adminTab === 'standings') setStandingRoster(activeControlId, v);
            else setRankingRoster(activeControlId, v);
          }}
          onDelete={() => {
            haptics.rigid();
            if (adminTab === 'schedule') deleteGame(activeControlId);
            else if (adminTab === 'standings') deleteStanding(activeControlId);
            else if (adminTab === 'rankings') deleteRanking(activeControlId);
            else if (adminTab === 'meetings') deleteMeeting(activeControlId);
          }}
          onConfirm={closeControlSheet}
          updateGame={updateGame}
          updateStanding={updateStanding}
          updateRanking={updateRanking}
          updateMeeting={adminTab === 'meetings' ? updateMeeting : undefined}
          haptics={haptics}
        />
      )}
    </div>
  );
};

export default AdminPage;
