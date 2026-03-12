import React, { useRef, useState, useEffect, useMemo } from 'react';
import gsap from 'gsap';
import { Settings, Plus, Trash2, CloudUpload, ChevronDown, ChevronRight, ChevronUp, Calendar, X, AlertTriangle, Check, Trophy } from 'lucide-react';
import { db, auth, googleProvider } from '../firebase';
import { writeBatch, doc, getDoc } from 'firebase/firestore';
import { signInWithEmailAndPassword, signInWithPopup, signOut, setPersistence, browserLocalPersistence, browserSessionPersistence } from 'firebase/auth';
import { useTheme } from '../context/useTheme';
import { useHaptics } from '../hooks/useHaptics';
import { cn } from '../utils/cn';
import { CustomAnimatedDatePicker, CustomTimePicker, CustomDropdown } from '../ui/FormControls';
import AnimatedInput from '../ui/AnimatedInput';
import { GameIcon } from './SharedUI';
import confetti from 'canvas-confetti';

/* ─── Custom Number Stepper ─── */
const NumberStepper = ({ value, onChange, label, color = 'accent' }) => {
  const haptics = useHaptics();
  const inc = () => {
    haptics.selection();
    const newVal = (Number(value) || 0) + 1;
    onChange({ target: { value: newVal } });
  };
  const dec = () => {
    haptics.selection();
    const newVal = Math.max(0, (Number(value) || 0) - 1);
    onChange({ target: { value: newVal } });
  };

  const bgClass = color === 'green' ? 'bg-green-500/10 border-green-500/20' : color === 'red' ? 'bg-red-500/10 border-red-500/20' : 'bg-accent/10 border-accent/20';
  const textClass = color === 'green' ? 'text-green-600' : color === 'red' ? 'text-red-500' : 'text-accent';

  return (
    <div className="flex flex-col items-center gap-1.5 font-sans">
      {label && <span className="text-[10px] font-mono font-bold text-slate/40 uppercase tracking-widest">{label}</span>}
      <div className={cn("flex items-center gap-2 p-1.5 rounded-2xl border bg-background shadow-sm transition-all hover:shadow-md", bgClass)}>
        <button 
          type="button" 
          onClick={dec} 
          className="w-8 h-8 flex items-center justify-center rounded-xl bg-slate/5 hover:bg-slate/10 text-slate/60 hover:text-primary transition-all active:scale-90"
        >
          <ChevronDown size={14} />
        </button>
        <div className={cn("w-10 text-center font-mono font-bold text-lg select-none", textClass)}>
          {value}
        </div>
        <button 
          type="button" 
          onClick={inc} 
          className="w-8 h-8 flex items-center justify-center rounded-xl bg-slate/5 hover:bg-slate/10 text-slate/60 hover:text-primary transition-all active:scale-90"
        >
          <ChevronUp size={14} />
        </button>
      </div>
    </div>
  );
};

/* ─── GAME OPTIONS ─── */
const GAME_OPTIONS = [
  "Rocket League", "Smash Bros", "Marvel Rivals", "Splatoon 3",
  "Street Fighter", "Mario Kart 8 Deluxe",
  "Pokémon UNITE", "Madden NFL", "OTHER"
];
const TYPE_OPTIONS = ['PlayVS Rank', 'Scrimmage', 'Tournament', 'Casual', 'OTHER'];
const LEAGUE_OPTIONS = ['PlayVS', 'Georgia', 'Georgia PlayVS', 'OTHER'];

/* ═════════════════════════════════════════════════════ */
/*  ADMIN DASHBOARD                                      */
/* ═════════════════════════════════════════════════════ */

const AdminDashboard = ({ isAdmin, onClose, gamesList, setGamesList, standings, setStandings, rankings, setRankings, authenticatedUser, authInitialized }) => {
  const { theme } = useTheme();
  const [isAuthenticated, setIsAuthenticated] = useState(!!authenticatedUser);
  const [email, setEmail] = useState(authenticatedUser?.email || '');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [, setSaveErrorMsg] = useState('');
  const [adminTab, setAdminTab] = useState('schedule');
  const [rememberMe, setRememberMe] = useState(false);

  // --- MOBILE UI STATE ---
  const [activeControlId, setActiveControlId] = useState(null); // ID of item being edited in bottom sheet
  const [showSafetySheet, setShowSafetySheet] = useState(false);
  
  const haptics = useHaptics();
  const overlayRef = useRef(null);
  const modalRef = useRef(null);
  const tabContentRef = useRef(null);
  const safetySheetRef = useRef(null);
  const controlSheetRef = useRef(null);

  // TRACK ORIGINAL DATA for dirty check
  const originalDataRef = useRef(null);
  const [isDirty, setIsDirty] = useState(false);
  const [, setAuthError] = useState('');

  // Recompute dirty flag whenever data changes (safe: runs after render, not during)
  useEffect(() => {
    if (!originalDataRef.current) return;
    setIsDirty(
      JSON.stringify(originalDataRef.current) !== JSON.stringify({ gamesList, standings, rankings })
    );
  }, [gamesList, standings, rankings]);

  // Sync internal state with prop (needed for Firebase init on refresh)
  useEffect(() => {
    if (authenticatedUser) {
      setIsAuthenticated(true);
      setEmail(authenticatedUser.email || '');
    }
  }, [authenticatedUser]);

  // Proactively set persistence when "Remember Me" changes or modal opens to avoid race conditions
  useEffect(() => {
    if (!isAuthenticated && isAdmin) {
      setPersistence(auth, rememberMe ? browserLocalPersistence : browserSessionPersistence).catch((error) => {
        console.error(error);
        setAuthError('We could not apply your “Remember Me” preference. You may be signed out when you close the browser.');
      });
    }
  }, [rememberMe, isAuthenticated, isAdmin]);

  // CHECK FOR SESSION EXPIRY ON MOUNT
  useEffect(() => {
    const expiry = localStorage.getItem('auth_expiry');
    if (expiry && Date.now() > Number(expiry)) {
      signOut(auth);
      localStorage.removeItem('auth_expiry');
      setIsAuthenticated(false);
    }
  }, []);

  // Sync initial ref only once or after save
  useEffect(() => {
    if (isAdmin && isAuthenticated && !saveSuccess && originalDataRef.current) return;
    if (isAdmin && isAuthenticated) {
      originalDataRef.current = JSON.parse(JSON.stringify({ gamesList, standings, rankings }));
      setIsDirty(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin, isAuthenticated, saveSuccess]);

  // Entrance anim
  useEffect(() => {
    if (isAdmin) {
      document.body.style.overflow = 'hidden';
      let ctx = gsap.context(() => {
        gsap.fromTo(overlayRef.current, { opacity: 0 }, { opacity: 1, duration: 0.3, ease: 'power2.out' });
        gsap.fromTo(modalRef.current, { y: 30, opacity: 0, scale: 0.95 }, { y: 0, opacity: 1, scale: 1, duration: 0.5, ease: 'back.out(1.2)', delay: 0.1 });
      });
      return () => { document.body.style.overflow = 'auto'; ctx.revert(); };
    }
  }, [isAdmin, isAuthenticated]);

  // Tab switch internal anim
  useEffect(() => {
    if (tabContentRef.current && isAdmin && isAuthenticated) {
      gsap.fromTo(tabContentRef.current, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.3, ease: 'power3.out' });
    }
  }, [adminTab, isAdmin, isAuthenticated]);

  // Unsaved changes sheet anim
  useEffect(() => {
    if (showSafetySheet) {
      gsap.fromTo(safetySheetRef.current, 
        { y: '100%' }, 
        { y: '0%', duration: 0.5, ease: 'power4.out' }
      );
    }
  }, [showSafetySheet]);

  // Selection/Control sheet anim
  useEffect(() => {
    if (activeControlId) {
      gsap.fromTo(controlSheetRef.current, 
        { y: '100%' }, 
        { y: '0%', duration: 0.5, ease: 'power4.out' }
      );
    }
  }, [activeControlId]);

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) { setErrorMsg('Email and Password required.'); return; }
    setIsAuthenticating(true);
    setErrorMsg('');
    const authExpiry = rememberMe ? Date.now() + 30 * 24 * 60 * 60 * 1000 : 0;
    try {
      haptics.light();
      await signInWithEmailAndPassword(auth, email, password);
      if (rememberMe) {
        localStorage.setItem('auth_expiry', String(authExpiry));
      } else {
        localStorage.removeItem('auth_expiry');
      }
      haptics.success();
    } catch (err) {
      console.error('Email/password login failed:', err);
      haptics.error();
      setErrorMsg('Access Denied. Invalid Credentials.');
      setPassword('');
    } finally { setIsAuthenticating(false); }
  };

  const handleGoogleSignIn = async () => {
    setIsAuthenticating(true);
    setErrorMsg('');
    const authExpiry = rememberMe ? Date.now() + 30 * 24 * 60 * 60 * 1000 : 0;
    try {
      haptics.light();
      const result = await signInWithPopup(auth, googleProvider);
      
      // Verify authorization against Firestore admin list (case-insensitive)
      const snap = await getDoc(doc(db, 'config', 'admins'));
      const allowedEmails = (snap.exists() ? snap.data().emails || [] : []).map(e => e.toLowerCase());
      const isAuthorized = allowedEmails.includes(result.user.email?.toLowerCase());
      
      if (!isAuthorized) {
        await signOut(auth);
        haptics.error();
        setErrorMsg('Unauthorized account.');
        return;
      }
      if (rememberMe) {
        localStorage.setItem('auth_expiry', String(authExpiry));
      } else {
        localStorage.removeItem('auth_expiry');
      }
      haptics.success();
      setIsAuthenticated(true);
    } catch (_err) {
      haptics.error();
      setErrorMsg(_err.code === 'auth/popup-closed-by-user' ? 'Sign-in cancelled.' : 'Authentication failed.');
    } finally { setIsAuthenticating(false); }
  };

  const handleSaveToCloud = async () => {
    setIsSaving(true);
    setSaveErrorMsg('');
    try {
      haptics.medium();
      const batch = writeBatch(db);
      batch.set(doc(db, "global", "data"), { gamesList, standings, rankings });
      await batch.commit();
      haptics.success();
      confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 }, colors: ['#0038A8', '#FFFFFF', '#000000'] });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch (_err) {
      haptics.error();
      setSaveErrorMsg(_err.message || 'Failed to sync with cloud database.');
    } finally { setIsSaving(false); }
  };

  // ─── HANDLERS ────────────────────────────────────────────────────────
  const handleAddGame = () => { 
    haptics.selection(); 
    const newId = Date.now();
    setGamesList([...gamesList, { id: newId, game: 'Smash Bros', opponent: 'TBD', date: '', time: '4:00 PM', type: 'PlayVS Rank', isAlt: false }]); 
    if (window.innerWidth < 768) setActiveControlId(newId);
  };
  const updateGame = (id, field, value) => setGamesList(gamesList.map(g => g.id === id ? { ...g, [field]: value } : g));
  const deleteGame = (id) => { haptics.light(); setGamesList(gamesList.filter(g => g.id !== id)); if (activeControlId === id) setActiveControlId(null); };

  const handleAddStanding = () => { 
    haptics.selection(); 
    const newId = Date.now();
    setStandings([...standings, { id: newId, team: 'Campbell eSpartans', game: 'Smash Bros', wins: 0, losses: 0, leagueRank: '', leagueName: 'PlayVS', isAlt: false }]); 
    if (window.innerWidth < 768) setActiveControlId(newId);
  };
  const updateStanding = (id, field, value) => {
    setStandings(standings.map(s => s.id === id ? { ...s, [field]: (field === 'wins' || field === 'losses') ? Number(value) : value } : s));
  };
  const deleteStanding = (id) => { haptics.light(); setStandings(standings.filter(s => s.id !== id)); if (activeControlId === id) setActiveControlId(null); };

  const handleAddRanking = () => { 
    haptics.selection(); 
    const newId = Date.now();
    setRankings([...rankings, { id: newId, team: 'Campbell eSpartans', game: 'Smash Bros', leagueRank: '', leagueName: 'PlayVS', isAlt: false }]); 
    if (window.innerWidth < 768) setActiveControlId(newId);
  };
  const updateRanking = (id, field, value) => {
    setRankings(rankings.map(r => r.id === id ? { ...r, [field]: value } : r));
  };
  const deleteRanking = (id) => { haptics.light(); setRankings(rankings.filter(r => r.id !== id)); if (activeControlId === id) setActiveControlId(null); };

  const handleCloseAttempt = () => {
    haptics.rigid();
    if (isDirty) {
      setShowSafetySheet(true);
    } else {
      handleClose();
    }
  };

  const handleClose = () => {
    if (overlayRef.current) {
      gsap.to(overlayRef.current, { opacity: 0, scale: 0.95, duration: 0.3, ease: 'power2.in', onComplete: onClose });
    } else { onClose(); }
  };

  const discardAndExit = () => {
    haptics.error();
    setShowSafetySheet(false);
    handleClose();
  };

  const btnClass = cn(
    "text-white font-sans font-bold transition-transform active:scale-95 flex items-center justify-center gap-2",
    theme === 'dark' ? 'bg-[rgb(0,56,168)] hover:bg-[rgb(0,46,138)]' : 'bg-[#0A0A0A] hover:bg-[#1a1a1a]'
  );

  const activeControlItem = useMemo(() => {
    if (!activeControlId) return null;
    return gamesList.find(g => g.id === activeControlId) || standings.find(s => s.id === activeControlId) || rankings.find(r => r.id === activeControlId);
  }, [activeControlId, gamesList, standings, rankings]);

  if (!isAdmin) return null;

  return (
    <div
      ref={overlayRef}
      className={cn(
        "fixed inset-0 z-[100] backdrop-blur-3xl overflow-y-auto flex flex-col items-center min-h-screen font-sans transition-colors duration-500",
        isAuthenticated ? "p-0 sm:p-6" : "p-4 sm:p-6",
        theme === 'dark' ? "bg-background/100 sm:bg-accent/40" : "bg-background/100 sm:bg-primary/95"
      )}
      onClick={(e) => { if (e.target === e.currentTarget) handleCloseAttempt(); }}
    >
      {!isAuthenticated ? (
        /* --- LOGIN MODAL --- */
        <div ref={modalRef} className="max-w-md w-full bg-background rounded-[2.5rem] p-8 sm:p-10 relative shadow-2xl border border-slate/20 flex flex-col items-center my-auto min-h-[450px]">
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
              <div className="w-16 h-16 flex items-center justify-center text-accent mb-4"><Settings size={32} /></div>
              <h2 className="font-sans font-bold text-2xl text-primary mb-1 text-center">Admin Access</h2>
              <p className="font-sans text-slate/60 text-xs mb-8 text-center px-6">Restricted system zone. Input credentials.</p>
              <form onSubmit={handleLoginSubmit} className="w-full flex flex-col gap-4">
                <AnimatedInput type="text" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" className="w-full border text-center bg-primary/5 h-12 rounded-2xl" error={!!errorMsg} />
                <AnimatedInput type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" className="w-full border text-center bg-primary/5 h-12 rounded-2xl" error={!!errorMsg} />
                {errorMsg && <span className="font-mono text-[10px] text-red-500 text-center">{errorMsg}</span>}
                <button type="submit" disabled={isAuthenticating} className={cn(btnClass, "w-full py-3.5 rounded-2xl h-[54px]")}>
                  {isAuthenticating ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Enter Dashboard'}
                </button>

                <div className="flex flex-col items-center gap-4 mt-2 w-full bg-slate/5 p-4 rounded-2xl border border-slate/10">
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <div className="relative">
                      <input 
                        type="checkbox" 
                        checked={rememberMe} 
                        onChange={(e) => {
                          haptics.light();
                          setRememberMe(e.target.checked);
                        }}
                        className="sr-only"
                      />
                      <div className={cn(
                        "w-5 h-5 rounded-md border-2 transition-all duration-300 flex items-center justify-center shadow-sm",
                        rememberMe ? "border-accent bg-accent" : "border-slate/20 bg-background group-hover:border-accent/40"
                      )}>
                        <div className={cn(
                          "w-2 h-1.5 border-l-2 border-b-2 border-white -rotate-45 mb-0.5 transition-all duration-300",
                          rememberMe ? "opacity-100 scale-100" : "opacity-0 scale-50"
                        )} />
                      </div>
                    </div>
                    <span className="font-sans text-xs font-bold text-slate/50 group-hover:text-primary transition-colors select-none">Stay signed in for 30 days</span>
                  </label>

                  <div className="flex flex-col items-center text-center gap-0.5">
                    <span className="font-mono text-[8px] text-accent/40 font-bold uppercase tracking-[0.2em]">Security Protocol</span>
                    <p className="font-sans text-[9px] text-slate/30 leading-relaxed max-w-[200px]">
                      Authentication persists for 1 month. Enable only on private devices.
                    </p>
                  </div>
                </div>
              </form>
              <div className="flex items-center gap-4 w-full my-6 text-slate/20 font-mono text-[10px] uppercase">
                <div className="flex-1 h-px bg-current"></div><span>Or</span><div className="flex-1 h-px bg-current"></div>
              </div>
              <button type="button" onClick={handleGoogleSignIn} disabled={isAuthenticating} className="w-full h-[54px] bg-background border border-slate/10 rounded-2xl flex items-center justify-center gap-3 font-bold text-sm hover:border-accent transition-all active:scale-95 shadow-sm">
                <svg viewBox="0 0 24 24" className="w-5 h-5" xmlns="http://www.w3.org/2000/svg"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                Google Protocol
              </button>
            </>
          )}
        </div>
      ) : (
        /* --- MAIN DASHBOARD MODAL --- */
        <div ref={modalRef} className="max-w-6xl w-full bg-background sm:rounded-3xl p-0 sm:p-8 pt-[max(1rem,env(safe-area-inset-top))] relative shadow-2xl sm:my-auto border-t sm:border border-slate/15 flex flex-col h-full sm:h-auto overflow-hidden sm:max-h-[85vh]">
          
          {/* TOP BAR / HEADER */}
          <div className="flex items-center justify-between mb-6 sm:mb-8 shrink-0 px-6 sm:px-0 mt-4 sm:mt-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-accent/10 rounded-2xl flex items-center justify-center text-accent">
                <Settings size={22} className="sm:hidden" />
                <Settings size={28} className="hidden sm:block" />
              </div>
              <div className="flex flex-col">
                <h2 className="font-sans font-black text-xl sm:text-3xl text-primary leading-none uppercase tracking-tighter italic">ADMIN DASH</h2>
                <span className="font-mono text-[8px] sm:text-[10px] text-slate/40 mt-1 uppercase tracking-widest">{email}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button 
                onClick={handleSaveToCloud} 
                disabled={isSaving} 
                className={cn(
                  "p-2.5 sm:px-4 sm:py-2 rounded-2xl text-white font-bold text-sm transition-all active:scale-90 flex items-center gap-2",
                  isDirty ? "bg-accent shadow-lg shadow-accent/25" : "bg-slate/10 text-slate",
                  isSaving && "opacity-70 scale-95"
                )}
              >
                {isSaving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><CloudUpload size={18} /><span className="hidden sm:inline">PUBLISH!</span></>}
                {saveSuccess && <Check size={16} className="text-green-300 ml-1" />}
              </button>
              
              <button 
                onClick={handleCloseAttempt}
                className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-slate/5 flex items-center justify-center text-slate hover:bg-red-500/10 hover:text-red-500 transition-all border border-slate/10 active:scale-90"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* TAB BAR - DESKTOP ONLY */}
          <div className="hidden sm:flex flex-wrap gap-2 mb-8 bg-slate/5 p-1.5 rounded-2xl w-fit border border-slate/10">
            <button onClick={() => setAdminTab('schedule')} className={cn("px-6 py-2.5 rounded-xl font-sans font-bold text-sm transition-all", adminTab === 'schedule' ? "bg-background text-primary shadow-md border border-slate/10" : "text-slate/60 hover:text-primary hover:bg-background/50")}>Schedule</button>
            <button onClick={() => setAdminTab('standings')} className={cn("px-6 py-2.5 rounded-xl font-sans font-bold text-sm transition-all", adminTab === 'standings' ? "bg-background text-primary shadow-md border border-slate/10" : "text-slate/60 hover:text-primary hover:bg-background/50")}>Standings</button>
            <button onClick={() => setAdminTab('rankings')} className={cn("px-6 py-2.5 rounded-xl font-sans font-bold text-sm transition-all", adminTab === 'rankings' ? "bg-background text-primary shadow-md border border-slate/10" : "text-slate/60 hover:text-primary hover:bg-background/50")}>Rankings</button>
          </div>

          {/* MAIN CONTENT AREA */}
          <div ref={tabContentRef} className="flex-1 overflow-y-auto custom-scrollbar px-6 sm:px-0 pb-64 sm:pb-64">
            
            {/* ─── SCHEDULE EDITOR ─── */}
            {adminTab === 'schedule' && (
              <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="flex items-center justify-between">
                  <h3 className="font-sans font-black text-lg sm:text-2xl text-primary italic uppercase tracking-tighter">Esports Schedule</h3>
                  <button onClick={handleAddGame} className="text-accent bg-accent/5 px-4 py-2 rounded-xl text-[10px] font-mono font-black border border-accent/20 flex items-center gap-2 hover:bg-accent hover:text-white transition-all">
                    <Plus size={14} /> ADD EVENT
                  </button>
                </div>

                <div className="grid grid-cols-1 gap-3">
                  {gamesList.map((g) => (
                    <div 
                      key={g.id} 
                      onClick={() => window.innerWidth < 768 && setActiveControlId(g.id)}
                      className="group flex flex-wrap sm:flex-nowrap items-center gap-4 bg-slate/5 p-4 rounded-3xl border border-slate/10 hover:border-accent/30 transition-all cursor-pointer sm:cursor-default"
                    >
                      {/* Summary View (Always visible) */}
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        <div className="w-10 h-10 rounded-2xl bg-primary/5 flex items-center justify-center border border-slate/10 shrink-0 group-hover:scale-110 transition-transform overflow-hidden">
                          <GameIcon game={g.game} size={22} />
                        </div>
                        <div className="flex flex-col min-w-0">
                          <div className="flex items-center gap-2">
                             <span className="font-sans font-black text-sm text-primary uppercase italic truncate">{g.game}</span>
                             {g.isAlt && <span className="bg-blue-500 text-white text-[8px] px-1 rounded-sm font-black leading-none py-0.5 shrink-0">ALT</span>}
                          </div>
                          <span className="font-mono text-[9px] text-slate/40 tracking-widest uppercase truncate mt-0.5">VS {g.opponent}</span>
                        </div>
                      </div>

                      {/* Desktop Only Fields */}
                      <div className="hidden sm:flex items-center gap-3 flex-[2]">
                        <div className="flex-1 max-w-[180px]">
                          <CustomDropdown value={g.game} onChange={(v) => updateGame(g.id, 'game', v)} options={GAME_OPTIONS} placeholder="Game" isEditable />
                        </div>
                        <div className="flex-1 max-w-[150px]">
                          <AnimatedInput value={g.opponent} onChange={(e) => updateGame(g.id, 'opponent', e.target.value)} placeholder="Opponent" className="h-10 rounded-xl pl-5" mono={false} tracking="normal" />
                        </div>
                        <div className="w-[160px]">
                          <CustomAnimatedDatePicker value={g.date} onChange={(v) => updateGame(g.id, 'date', v)} />
                        </div>
                      </div>

                      {/* Right Icons/Toggles (Desktop View) */}
                      <div className="flex items-center gap-3 ml-auto shrink-0">
                        <div className="hidden sm:flex items-center gap-2">
                           <button onClick={() => updateGame(g.id, 'isAlt', !g.isAlt)} className={cn("px-2.5 py-1 rounded-lg font-mono text-[9px] font-black border transition-all", g.isAlt ? "bg-blue-500 border-blue-500 text-white" : "text-slate/30 border-slate/10 hover:text-primary")}>ALT</button>
                           <button onClick={(e) => { e.stopPropagation(); deleteGame(g.id); }} className="p-2 text-slate/20 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all opacity-0 group-hover:opacity-100"><Trash2 size={16} /></button>
                        </div>
                        <div className="sm:hidden text-slate/30"><ChevronRight size={18} /></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ─── STANDINGS EDITOR ─── */}
            {adminTab === 'standings' && (
              <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="flex items-center justify-between">
                  <h3 className="font-sans font-black text-lg sm:text-2xl text-primary italic uppercase tracking-tighter">Live Standings</h3>
                  <button onClick={handleAddStanding} className="text-accent bg-accent/5 px-4 py-2 rounded-xl text-[10px] font-mono font-black border border-accent/20 flex items-center gap-2 hover:bg-accent hover:text-white transition-all">
                    <Plus size={14} /> ADD TEAM
                  </button>
                </div>

                <div className="flex flex-col gap-3">
                  {standings.map((s) => (
                    <div 
                      key={s.id} 
                      onClick={() => window.innerWidth < 768 && setActiveControlId(s.id)}
                      className="group flex items-center gap-4 bg-slate/5 p-4 rounded-3xl border border-slate/10 hover:border-accent/30 transition-all cursor-pointer sm:cursor-default"
                    >
                      <div className="flex items-center gap-4 flex-1">
                        <div className="w-10 h-10 rounded-2xl bg-primary/5 flex items-center justify-center border border-slate/10 group-hover:scale-110 transition-transform overflow-hidden shrink-0">
                          <GameIcon game={s.game} size={22} />
                        </div>
                        <div className="flex flex-col min-w-0">
                          <div className="flex items-center gap-2">
                             <span className="font-sans font-black text-sm text-primary uppercase italic truncate">{s.game}</span>
                             {s.isAlt && <span className="bg-blue-500 text-white text-[8px] px-1 rounded-sm font-black leading-none py-0.5 shrink-0">ALT</span>}
                          </div>
                        </div>
                      </div>

                      {/* Desktop Only Edit Fields */}
                      <div className="hidden sm:flex items-center gap-4 flex-[2]">
                        <div className="flex-1 max-w-[280px]">
                           <CustomDropdown value={s.game} onChange={(v) => updateStanding(s.id, 'game', v)} options={GAME_OPTIONS} placeholder="Game" isEditable />
                        </div>
                        <div className="flex items-center gap-4 ml-auto">
                          <NumberStepper color="green" value={s.wins} onChange={(e) => updateStanding(s.id, 'wins', e.target.value)} />
                          <NumberStepper color="red" value={s.losses} onChange={(e) => updateStanding(s.id, 'losses', e.target.value)} />
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0 ml-auto">
                        <div className="hidden sm:flex items-center gap-2">
                           <button onClick={() => updateStanding(s.id, 'isAlt', !s.isAlt)} className={cn("px-2.5 py-1 rounded-lg font-mono text-[9px] font-black border transition-all", s.isAlt ? "bg-blue-500 border-blue-500 text-white" : "text-slate/30 border-slate/10 hover:text-primary")}>ALT</button>
                           <button onClick={(e) => { e.stopPropagation(); deleteStanding(s.id); }} className="p-2 text-slate/20 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all opacity-0 group-hover:opacity-100"><Trash2 size={16} /></button>
                        </div>
                        <div className="sm:hidden text-slate/30"><ChevronRight size={18} /></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ─── RANKINGS EDITOR ─── */}
            {adminTab === 'rankings' && (
              <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="flex items-center justify-between">
                  <h3 className="font-sans font-black text-lg sm:text-2xl text-primary italic uppercase tracking-tighter">Global Rankings</h3>
                  <button onClick={handleAddRanking} className="text-accent bg-accent/5 px-4 py-2 rounded-xl text-[10px] font-mono font-black border border-accent/20 flex items-center gap-2 hover:bg-accent hover:text-white transition-all">
                    <Plus size={14} /> ADD TEAM
                  </button>
                </div>

                <div className="bg-slate/5 rounded-[2rem] border border-slate/10 overflow-hidden hidden sm:block">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-[#0b0c10]/40 border-b border-slate/10">
                      <tr>
                        <th className="p-4 w-12">&nbsp;</th>
                        <th className="p-4 font-mono text-[9px] text-slate/40 uppercase tracking-[0.2em] italic">Game</th>
                        <th className="p-4 font-mono text-[9px] text-slate/40 uppercase tracking-[0.2em] italic">Rank</th>
                        <th className="p-4 font-mono text-[9px] text-slate/40 uppercase tracking-[0.2em] italic">League</th>
                        <th className="p-4 text-center">&nbsp;</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate/5">
                      {rankings.map(s => (
                        <tr key={s.id} className="group hover:bg-primary/[0.02] transition-all">
                          <td className="p-4 w-12">
                             <div className="w-10 h-10 rounded-xl bg-primary/5 flex items-center justify-center border border-slate/10 overflow-hidden">
                                <GameIcon game={s.game} size={20} />
                             </div>
                          </td>
                           <td className="p-4 min-w-[200px]">
                              <CustomDropdown value={s.game} onChange={(v) => updateRanking(s.id, 'game', v)} options={GAME_OPTIONS} placeholder="Game" isEditable />
                           </td>
                           <td className="p-4 w-28">
                              <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono text-xs text-red-500 font-bold">#</span>
                                <AnimatedInput value={s.leagueRank} onChange={(e) => updateRanking(s.id, 'leagueRank', e.target.value)} className="pl-6 h-10 w-full text-center" placeholder="1" />
                              </div>
                           </td>
                           <td className="p-4">
                              <CustomDropdown value={s.leagueName} onChange={(v) => updateRanking(s.id, 'leagueName', v)} options={LEAGUE_OPTIONS} placeholder="League" isEditable />
                           </td>
                           <td className="p-4 w-16 text-right">
                              <button onClick={() => deleteRanking(s.id)} className="p-2 text-slate/20 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all opacity-0 group-hover:opacity-100"><Trash2 size={16} /></button>
                           </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Ranking Cards */}
                <div className="sm:hidden flex flex-col gap-3">
                   {rankings.map(s => (
                      <div key={s.id} onClick={() => setActiveControlId(s.id)} className="group flex items-center justify-between bg-slate/5 p-4 rounded-3xl border border-slate/10">
                         <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-2xl bg-primary/5 flex items-center justify-center border border-slate/10 overflow-hidden shrink-0">
                               <GameIcon game={s.game} size={22} />
                            </div>
                            <span className="font-sans font-black text-2xl text-red-500 min-w-[1.5rem] tracking-tighter">#{s.leagueRank || '--'}</span>
                            <div className="flex flex-col min-w-0">
                               <div className="flex items-center gap-2">
                                  <span className="font-sans font-black text-sm text-primary italic uppercase leading-none truncate">{s.game}</span>
                                  {s.isAlt && <span className="bg-blue-500 text-white text-[8px] px-1 rounded-sm font-black leading-none py-0.5 shrink-0">ALT</span>}
                               </div>
                               <span className="font-mono text-[9px] text-slate/40 mt-1 uppercase tracking-widest truncate">{s.leagueName}</span>
                            </div>
                         </div>
                         <ChevronRight size={18} className="text-slate/20" />
                      </div>
                   ))}
                </div>
              </div>
            )}
          </div>

          {/* MOBILE BOTTOM NAVIGATION */}
          <div className="sm:hidden fixed bottom-0 left-0 right-0 bg-background border-t border-slate/15 px-6 pt-5 pb-[calc(3rem+env(safe-area-inset-bottom,0px))] flex items-center justify-around z-40 shadow-[0_-15px_50px_rgba(0,0,0,0.7)] touch-none">
             <button onClick={() => { haptics.selection(); setAdminTab('schedule'); }} className={cn("flex flex-col items-center gap-1.5 transition-all text-[10px] font-black uppercase tracking-tighter", adminTab === 'schedule' ? "text-accent scale-110" : "text-slate/40")}>
                <Calendar size={20} /><span className="leading-none">Schedule</span>
             </button>
              <button onClick={() => { haptics.selection(); setAdminTab('standings'); }} className={cn("flex flex-col items-center gap-1.5 transition-all text-[10px] font-black uppercase tracking-tighter", adminTab === 'standings' ? "text-accent scale-110" : "text-slate/40")}>
                <Trophy size={20} />
                <span className="leading-none">Standings</span>
              </button>
             <button onClick={() => { haptics.selection(); setAdminTab('rankings'); }} className={cn("flex flex-col items-center gap-1.5 transition-all text-[10px] font-black uppercase tracking-tighter", adminTab === 'rankings' ? "text-accent scale-110" : "text-slate/40")}>
                <Settings size={20} /><span className="leading-none">Rankings</span>
             </button>
          </div>
        </div>
      )}

      {/* ── SAFETY SHEET (Option 1) ── */}
      {showSafetySheet && (
        <div 
          className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4"
          onClick={() => setShowSafetySheet(false)}
        >
           <div 
            ref={safetySheetRef}
            className="w-full sm:max-w-sm bg-background border-t sm:border border-slate/15 rounded-t-[3rem] sm:rounded-[2.5rem] p-8 pb-[calc(3rem+env(safe-area-inset-bottom,0px))] sm:pb-10 flex flex-col items-center gap-6 shadow-2xl relative"
            onClick={e => e.stopPropagation()}
          >
            <div className="w-12 h-1.5 bg-slate/10 rounded-full mb-2 sm:hidden" />
            <div className="w-16 h-16 bg-red-500/10 rounded-3xl flex items-center justify-center text-red-500">
               <AlertTriangle size={32} />
            </div>
            <div className="text-center">
               <h3 className="font-sans font-black text-xl italic uppercase tracking-tighter leading-none mb-2">Unsaved Data Alert</h3>
               <p className="font-sans text-slate/50 text-xs px-4">Changes were detected. Discarding will permanently erase local buffer.</p>
            </div>
            <div className="flex flex-col w-full gap-3">
               <button onClick={discardAndExit} className="w-full bg-red-500 text-white font-black py-4 rounded-2xl shadow-lg shadow-red-500/20 active:scale-95 transition-all italic tracking-tighter uppercase text-sm">Discard & Exit</button>
               <button onClick={() => setShowSafetySheet(false)} className="w-full bg-slate/5 text-slate font-black py-4 rounded-2xl active:scale-95 transition-all uppercase text-sm tracking-tighter">Keep Editing</button>
            </div>
          </div>
        </div>
      )}

      {/* ── CONTROL SHEET (Option B) ── */}
      {activeControlId && activeControlItem && (
        <div 
          className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm flex items-end justify-center"
          onClick={() => setActiveControlId(null)}
        >
          <div 
            ref={controlSheetRef} 
            className="fixed inset-x-0 bottom-0 z-[120] bg-background border-t border-slate/15 rounded-t-[2.5rem] p-8 pb-[calc(3rem+env(safe-area-inset-bottom,0px))] shadow-[0_-15px_60px_rgba(0,0,0,0.5)] sm:hidden max-h-[95vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <div className="w-12 h-1.5 bg-slate/10 rounded-full mx-auto shrink-0" />
            
            <div className="flex items-center justify-between">
               <div className="flex flex-col">
                  <span className="font-mono text-[10px] text-accent font-black uppercase tracking-widest leading-none">Control Sheet</span>
                  <h3 className="font-sans font-black text-2xl italic uppercase tracking-tighter leading-tight mt-1 truncate max-w-[240px]">
                    {activeControlItem.game || activeControlItem.opponent}
                  </h3>
               </div>
               <button onClick={() => { haptics.light(); setActiveControlId(null); }} className="w-10 h-10 rounded-2xl bg-slate/5 flex items-center justify-center text-slate">
                  <X size={20} />
               </button>
            </div>

            <div className="flex flex-col gap-5 pt-2">
               {/* Context Specific Fields */}
               {adminTab === 'schedule' ? (
                 <>
                    <div className="flex flex-col gap-1.5">
                       <label className="font-mono text-[9px] text-slate/40 uppercase pl-1">Target Game</label>
                       <CustomDropdown value={activeControlItem.game} onChange={(v) => updateGame(activeControlId, 'game', v)} options={GAME_OPTIONS} placeholder="Game" isEditable />
                    </div>
                    <div className="flex flex-col gap-1.5">
                       <label className="font-mono text-[9px] text-slate/40 uppercase pl-1">Rival / Opponent</label>
                       <AnimatedInput value={activeControlItem.opponent} onChange={(e) => updateGame(activeControlId, 'opponent', e.target.value)} placeholder="Opponent Name" className="h-12 rounded-2xl bg-slate/5 border-none" mono={false} tracking="normal" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                       <div className="flex flex-col gap-1.5">
                          <label className="font-mono text-[9px] text-slate/40 uppercase pl-1">Launch date</label>
                          <CustomAnimatedDatePicker value={activeControlItem.date} onChange={(v) => updateGame(activeControlId, 'date', v)} />
                       </div>
                       <div className="flex flex-col gap-1.5">
                          <label className="font-mono text-[9px] text-slate/40 uppercase pl-1">Time</label>
                          <CustomTimePicker value={activeControlItem.time} onChange={(v) => updateGame(activeControlId, 'time', v)} />
                       </div>
                    </div>
                    <div className="flex flex-col gap-1.5">
                       <label className="font-mono text-[9px] text-slate/40 uppercase pl-1">Match Type</label>
                       <CustomDropdown value={activeControlItem.type} onChange={(v) => updateGame(activeControlId, 'type', v)} options={TYPE_OPTIONS} placeholder="Type" isEditable />
                    </div>
                 </>
               ) : adminTab === 'standings' ? (
                 <>
                    <div className="flex flex-col gap-1.5">
                       <label className="font-mono text-[9px] text-slate/40 uppercase pl-1">Team Identity (Game)</label>
                       <CustomDropdown value={activeControlItem.game} onChange={(v) => updateStanding(activeControlId, 'game', v)} options={GAME_OPTIONS} placeholder="Game" isEditable />
                    </div>
                    <div className="grid grid-cols-2 gap-10 py-2">
                       <NumberStepper label="Victories" color="green" value={activeControlItem.wins} onChange={(e) => updateStanding(activeControlId, 'wins', e.target.value)} />
                       <NumberStepper label="Defeats" color="red" value={activeControlItem.losses} onChange={(e) => updateStanding(activeControlId, 'losses', e.target.value)} />
                    </div>
                 </>
               ) : (
                 <>
                    <div className="flex flex-col gap-1.5">
                       <label className="font-mono text-[9px] text-slate/40 uppercase pl-1">Game Selection</label>
                       <CustomDropdown value={activeControlItem.game} onChange={(v) => updateRanking(activeControlId, 'game', v)} options={GAME_OPTIONS} placeholder="Game" isEditable />
                    </div>
                    <div className="flex flex-col gap-1.5">
                       <label className="font-mono text-[9px] text-slate/40 uppercase pl-1">National / Regional Rank</label>
                       <div className="relative">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 font-sans font-black text-red-500 text-lg z-10 leading-none">#</span>
                           <AnimatedInput value={activeControlItem.leagueRank} onChange={(e) => updateRanking(activeControlId, 'leagueRank', e.target.value)} placeholder="1" className="pl-14 h-12 rounded-2xl bg-slate/5 border-none font-black text-lg focus:ring-0" />
                       </div>
                    </div>
                    <div className="flex flex-col gap-1.5">
                       <label className="font-mono text-[9px] text-slate/40 uppercase pl-1">League Authority</label>
                       <CustomDropdown value={activeControlItem.leagueName} onChange={(v) => updateRanking(activeControlId, 'leagueName', v)} options={LEAGUE_OPTIONS} placeholder="League" isEditable />
                    </div>
                 </>
               )}

               {/* SHARED CONTROLS */}
               <div className="flex items-center justify-between gap-4 mt-4 bg-slate/5 p-4 rounded-2xl border border-slate/10">
                  <div className="flex flex-col gap-0.5">
                     <span className="font-sans font-black text-xs text-primary uppercase italic">Alternate Roster</span>
                     <span className="font-sans text-[9px] text-slate/40 max-w-[120px]">Enable for non-varsity team metrics.</span>
                  </div>
                  <button 
                    onClick={() => {
                        haptics.selection();
                        if (adminTab === 'schedule') updateGame(activeControlId, 'isAlt', !activeControlItem.isAlt);
                        else if (adminTab === 'standings') updateStanding(activeControlId, 'isAlt', !activeControlItem.isAlt);
                        else updateRanking(activeControlId, 'isAlt', !activeControlItem.isAlt);
                    }} 
                    className={cn(
                        "px-6 py-2.5 rounded-xl font-mono text-xs font-black border transition-all shadow-sm",
                        activeControlItem.isAlt ? "bg-blue-500 border-blue-500 text-white" : "bg-background border-slate/10 text-slate/20"
                    )}
                  >
                    {activeControlItem.isAlt ? 'ACTIVE' : 'OFF'}
                  </button>
               </div>

               <div className="grid grid-cols-2 gap-4 mt-4">
                  <button 
                    onClick={() => { haptics.rigid(); if (adminTab === 'schedule') deleteGame(activeControlId); else if (adminTab === "standings") deleteStanding(activeControlId); else deleteRanking(activeControlId); }}
                    className="flex-1 bg-red-500/5 text-red-500 border border-red-500/10 font-black py-4 rounded-2xl flex items-center justify-center gap-2 text-xs uppercase italic tracking-tighter"
                  >
                    <Trash2 size={16} /> Delete Record
                  </button>
                  <button onClick={() => { haptics.success(); setActiveControlId(null); }} className="flex-1 bg-accent text-white font-black py-4 rounded-2xl flex items-center justify-center gap-2 text-xs uppercase italic tracking-tighter shadow-lg shadow-accent/20">
                    <Check size={18} /> Confirm
                  </button>
               </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
