import React, { useRef, useState, useEffect } from 'react';
import gsap from 'gsap';
import { Settings, Plus, Trash2, CloudUpload, ChevronDown, ChevronLeft, ChevronRight, ChevronUp, Calendar } from 'lucide-react';
import { db, auth, googleProvider } from '../firebase';
import { writeBatch, doc, getDoc } from 'firebase/firestore';
import { signInWithEmailAndPassword, signInWithPopup, signOut, setPersistence, browserLocalPersistence, browserSessionPersistence } from 'firebase/auth';
import { useTheme } from '../context/useTheme';
import { useHaptics } from '../hooks/useHaptics';
import { cn } from '../utils/cn';
import { CustomAnimatedDatePicker, CustomTimePicker, CustomDropdown } from '../ui/FormControls';
import AnimatedInput from '../ui/AnimatedInput';
import confetti from 'canvas-confetti';

/* ─── Custom Number Stepper ─── */
const NumberStepper = ({ value, onChange, label, color = 'accent' }) => {
  const inc = () => {
    const newVal = (Number(value) || 0) + 1;
    onChange({ target: { value: newVal } });
  };
  const dec = () => {
    const newVal = Math.max(0, (Number(value) || 0) - 1);
    onChange({ target: { value: newVal } });
  };

  const bgClass = color === 'green' ? 'bg-green-500/10 border-green-500/20' : color === 'red' ? 'bg-red-500/10 border-red-500/20' : 'bg-accent/10 border-accent/20';
  const textClass = color === 'green' ? 'text-green-600' : color === 'red' ? 'text-red-500' : 'text-accent';

  return (
    <div className="flex flex-col items-center gap-1.5">
      <span className="text-[10px] font-mono font-bold text-slate/40 uppercase tracking-widest">{label}</span>
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
  'Super Smash Bros', 'Rocket League', 'Marvel Rivals', 'Madden NFL 25',
  'Splatoon', 'Mario Kart', 'League of Legends'
];
const TIME_OPTIONS = [
  '3:00 PM', '3:30 PM', '4:00 PM', '4:30 PM', '5:00 PM', '5:30 PM', '6:00 PM', '6:30 PM', '7:00 PM'
];
const TYPE_OPTIONS = ['PlayVS Rank', 'Scrimmage', 'Tournament', 'Casual'];

/* ═════════════════════════════════════════════════════ */
/*  ADMIN DASHBOARD                                      */
/* ═════════════════════════════════════════════════════ */

const AdminDashboard = ({ isAdmin, onClose, gamesList, setGamesList, standings, setStandings, authenticatedUser, authInitialized }) => {
  const { theme } = useTheme();
  const [isAuthenticated, setIsAuthenticated] = useState(!!authenticatedUser);
  const [email, setEmail] = useState(authenticatedUser?.email || '');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveErrorMsg, setSaveErrorMsg] = useState('');
  const [adminTab, setAdminTab] = useState('schedule');
  const [rememberMe, setRememberMe] = useState(false);
  const haptics = useHaptics();

  const overlayRef = useRef(null);
  const modalRef = useRef(null);
  const tabContentRef = useRef(null);

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

  // Sync local state with prop
  useEffect(() => {
    if (authenticatedUser) {
      setIsAuthenticated(true);
      setEmail(authenticatedUser.email);
    } else {
      setIsAuthenticated(false);
    }
  }, [authenticatedUser]);

  if (!isAdmin) return null;

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) { setErrorMsg('Email and Password required.'); return; }
    setIsAuthenticating(true);
    setErrorMsg('');
    const authExpiry = rememberMe ? Date.now() + 30 * 24 * 60 * 60 * 1000 : 0;
    try {
      haptics.light();
      await setPersistence(auth, rememberMe ? browserLocalPersistence : browserSessionPersistence);
      await signInWithEmailAndPassword(auth, email, password);
      if (rememberMe) {
        localStorage.setItem('auth_expiry', String(authExpiry));
      } else {
        localStorage.removeItem('auth_expiry');
      }
      haptics.success();
    } catch {
      haptics.error();
      setErrorMsg('Access Denied. Invalid Credentials.');
      setPassword('');
    } finally { setIsAuthenticating(false); }
  };

  // ─── AUTHENTICATION HANDLERS ──────────────────────────────────────────

  const handleGoogleSignIn = async () => {
    setIsAuthenticating(true);
    setErrorMsg('');
    const authExpiry = rememberMe ? Date.now() + 30 * 24 * 60 * 60 * 1000 : 0;
    
    try {
      haptics.light();
      // Apply persistence based on "Remember Me"
      await setPersistence(auth, rememberMe ? browserLocalPersistence : browserSessionPersistence);
      
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

      // Sync 30-day session marker
      if (rememberMe) {
        localStorage.setItem('auth_expiry', String(authExpiry));
      } else {
        localStorage.removeItem('auth_expiry');
      }

      haptics.success();
      setEmail(result.user.email);
      setIsAuthenticated(true);
    } catch (_err) {
      haptics.error();
      setErrorMsg(_err.code === 'auth/popup-closed-by-user' ? 'Sign-in cancelled.' : 'Authentication failed.');
    } finally { setIsAuthenticating(false); }
  };

  const handleLogout = async () => {
    haptics.rigid();
    if (overlayRef.current) {
      // Animated exit
      gsap.to(overlayRef.current, {
        opacity: 0, y: 20, filter: 'blur(10px)', duration: 0.5, ease: 'power2.in',
        onComplete: async () => {
          await signOut(auth);
          setIsAuthenticated(false);
          onClose();
        }
      });
    } else {
      await signOut(auth);
      setIsAuthenticated(false);
      onClose();
    }
  };

  // ─── DATA PERSISTENCE ──────────────────────────────────────────────────

  const handleSaveToCloud = async () => {
    setIsSaving(true);
    setSaveErrorMsg('');
    try {
      haptics.medium();
      const batch = writeBatch(db);
      // Batch update the global data document
      batch.set(doc(db, "global", "data"), { gamesList, standings });
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

  // ─── LIST MANIPULATION ────────────────────────────────────────────────

  const handleAddGame = () => { 
    haptics.selection(); 
    setGamesList([...gamesList, { id: Date.now(), game: 'Super Smash Bros', opponent: 'TBD', date: '', time: '3:30 PM', type: 'PlayVS Rank' }]); 
  };
  
  const updateGame = (id, field, value) => {
    setGamesList(gamesList.map(g => g.id === id ? { ...g, [field]: value } : g));
  };

  const deleteGame = (id) => { 
    haptics.light(); 
    setGamesList(gamesList.filter(g => g.id !== id)); 
  };

  const handleAddStanding = () => { 
    haptics.selection(); 
    setStandings([...standings, { id: Date.now(), team: 'New Team', game: 'Super Smash Bros', wins: 0, losses: 0, leagueRank: '', leagueName: 'Georgia' }]); 
  };

  const updateStanding = (id, field, value) => {
    setStandings(standings.map(s => s.id === id ? { ...s, [field]: (field === 'wins' || field === 'losses') ? Number(value) : value } : s));
  };

  const deleteStanding = (id) => { 
    haptics.light(); 
    setStandings(standings.filter(s => s.id !== id)); 
  };

  // ─── UI HELPERS ────────────────────────────────────────────────────────

  const btnClass = cn(
    "text-white font-sans font-bold transition-transform active:scale-95 flex items-center justify-center gap-2",
    theme === 'dark' ? 'bg-[rgb(0,56,168)] hover:bg-[rgb(0,46,138)]' : 'bg-[#0A0A0A] hover:bg-[#1a1a1a]'
  );

  const handleClose = () => {
    if (overlayRef.current) {
      gsap.to(overlayRef.current, { opacity: 0, scale: 0.95, duration: 0.3, ease: 'power2.in', onComplete: onClose });
    } else { onClose(); }
  };

  return (
    <div
      ref={overlayRef}
      className={cn("fixed inset-0 z-50 backdrop-blur-2xl overflow-y-auto p-6 flex flex-col items-center min-h-screen", theme === 'dark' ? "bg-accent/40" : "bg-primary/95")}
      onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}
    >
      {!isAuthenticated ? (
        <div ref={modalRef} className="max-w-md w-full bg-background rounded-[2rem] p-10 relative shadow-2xl border border-slate/20 flex flex-col items-center my-auto min-h-[400px]">
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
              <div className="w-16 h-16 bg-accent/10 rounded-2xl flex items-center justify-center text-accent mb-6"><Settings size={32} /></div>
              <h2 className="font-sans font-bold text-2xl text-primary mb-2">Restricted Access</h2>
              <p className="font-sans text-slate text-sm mb-8 text-center bg-accent/5 p-3 rounded-xl border border-accent/10">Please enter the system password to access the Esports Dashboard controls.</p>

          <form onSubmit={handleLoginSubmit} className="w-full flex flex-col gap-4">
            <AnimatedInput
              type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Admin Email"
              className={cn("w-full border text-center bg-primary/5 tracking-widest", errorMsg ? "border-red-500" : "border-slate/20")}
              error={!!errorMsg}
            />
            <AnimatedInput
              type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="System Password"
              className={cn("w-full border text-center bg-primary/5 tracking-widest", errorMsg ? "border-red-500" : "border-slate/20")}
              error={!!errorMsg}
            />
            {errorMsg && <span className="font-mono text-xs text-red-500 text-center -mt-2">{errorMsg}</span>}
            
            <div className="flex flex-col items-center gap-4 mt-2 w-full bg-slate/5 p-4 rounded-2xl border border-slate/10 animate-glide-in">
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
                    "w-6 h-6 rounded-lg border-2 transition-all duration-300 flex items-center justify-center shadow-sm",
                    rememberMe ? "border-accent bg-accent" : "border-slate/20 bg-background group-hover:border-accent/40"
                  )}>
                    <div className={cn(
                      "w-3 h-2 border-l-2 border-b-2 border-white -rotate-45 mb-1 transition-all duration-300",
                      rememberMe ? "opacity-100 scale-100" : "opacity-0 scale-50"
                    )} />
                  </div>
                </div>
                <span className="font-sans text-sm font-bold text-slate/70 group-hover:text-primary transition-colors select-none">Stay signed in for 30 days</span>
              </label>
              <div className="flex flex-col items-center text-center gap-1">
                <span className="font-mono text-[9px] text-accent/40 font-bold uppercase tracking-[0.2em]">Security Protocol</span>
                <p className="font-sans text-[10px] text-slate/40 leading-relaxed max-w-[280px]">
                  Your authentication will persist across browser restarts for 1 month. Only enable this on secure, private devices.
                </p>
              </div>
            </div>

            <button type="submit" disabled={isAuthenticating} className={cn(btnClass, "w-full px-6 py-3 rounded-xl h-[48px] touch-manipulation", isAuthenticating && "opacity-70 cursor-not-allowed")}>
              {isAuthenticating ? <span className="w-5 h-5 border-2 border-background/30 border-t-background rounded-full animate-spin"></span> : 'Authenticate'}
            </button>
          </form>

          <div className="flex items-center gap-4 w-full my-4">
            <div className="flex-1 h-px bg-slate/10"></div>
            <span className="font-mono text-[10px] text-slate/40 tracking-widest uppercase">Or</span>
            <div className="flex-1 h-px bg-slate/10"></div>
          </div>

          <button
            type="button" onClick={handleGoogleSignIn} disabled={isAuthenticating}
            className={cn("w-full magnetic-btn bg-background border border-slate/20 text-primary px-6 py-3 rounded-xl font-sans font-bold transition-all active:scale-95 text-center flex justify-center items-center h-[48px] hover:border-accent hover:text-accent hover:shadow-md gap-3", isAuthenticating && "opacity-70 cursor-not-allowed")}
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            Continue with Google
          </button>
        </>
      )}
    </div>
  ) : (
        <div ref={modalRef} className="max-w-6xl w-full bg-background rounded-3xl p-8 relative shadow-2xl my-auto border border-slate/20">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
            <div className="flex items-center gap-3">
              <Settings className="text-accent shrink-0" size={32} />
              <div className="flex flex-col">
                <h2 className="font-sans font-bold text-3xl text-primary tracking-tight leading-none">System Admin</h2>
                <div className="flex items-center gap-3">
                  <span className="font-mono text-[11px] text-slate/50 mt-1 uppercase tracking-wider">{email}</span>
                  <button 
                    onClick={handleLogout}
                    className="font-mono text-[10px] text-red-500/60 hover:text-red-500 uppercase tracking-widest px-2 py-0.5 rounded-md hover:bg-red-500/5 transition-all mt-1"
                  >
                    Logout
                  </button>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {saveErrorMsg && <span className="font-mono text-xs text-red-500">{saveErrorMsg}</span>}
              {saveSuccess && <span className="font-mono text-xs text-green-500 flex items-center gap-1"><CloudUpload size={14} /> Synced to cloud</span>}
              <button onClick={handleSaveToCloud} disabled={isSaving} className={cn(btnClass, "px-4 py-2 rounded-xl text-sm")}>
                {isSaving ? <span className="w-4 h-4 border-2 border-background/30 border-t-background rounded-full animate-spin"></span> : <><CloudUpload size={16} /> Publish to Live Site</>}
              </button>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mb-8 bg-slate/5 p-1.5 rounded-2xl w-fit">
            <button onClick={() => setAdminTab('schedule')} className={cn("px-6 py-2 rounded-xl font-sans font-semibold text-sm transition-all", adminTab === 'schedule' ? "bg-background text-primary shadow-sm border border-slate/10" : "text-slate/60 hover:text-primary")}>Match Schedule</button>
            <button onClick={() => setAdminTab('standings')} className={cn("px-6 py-2 rounded-xl font-sans font-semibold text-sm transition-all", adminTab === 'standings' ? "bg-background text-primary shadow-sm border border-slate/10" : "text-slate/60 hover:text-primary")}>Live Standings</button>
            <button onClick={() => setAdminTab('rankings')} className={cn("px-6 py-2 rounded-xl font-sans font-semibold text-sm transition-all", adminTab === 'rankings' ? "bg-background text-primary shadow-sm border border-slate/10" : "text-slate/60 hover:text-primary")}>Global Rankings</button>
          </div>

          <div ref={tabContentRef} className="flex flex-col gap-12">
            {/* ─── SCHEDULE EDITOR ─── */}
            {adminTab === 'schedule' && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-sans font-semibold text-xl text-primary">Esports Schedule</h3>
                  <button onClick={handleAddGame} className="text-accent hover:bg-accent/10 p-2 rounded-xl transition-colors flex items-center gap-1 font-mono text-xs"><Plus size={16} /> ADD EVENT</button>
                </div>
                {gamesList.length === 0 ? (
                  <div className="text-center py-8 text-slate/50 font-mono text-sm border border-dashed border-slate/20 rounded-xl">No games scheduled.</div>
                ) : (
                  <div className="flex flex-col gap-3 max-h-[450px] overflow-y-auto pr-2 custom-scrollbar pb-40">
                    {gamesList.map((g, index) => (
                      <div key={g.id} className="grid grid-cols-1 lg:grid-cols-[40px_1fr_1fr_1fr_1.5fr_40px] items-center gap-4 bg-slate/5 p-4 rounded-2xl border border-slate/10 relative group w-full">
                        {/* 1. Index */}
                        <span className="font-mono text-xs text-slate/40 text-center hidden lg:block">{index + 1}</span>
                        
                        {/* 2. Game Selection */}
                        <div className="flex items-center justify-between w-full lg:w-auto gap-2">
                          <span className="lg:hidden font-mono text-xs text-slate/40 w-4">{index + 1}</span>
                          <div className="flex-1 w-full">
                            <CustomDropdown
                              value={g.game}
                              onChange={(val) => updateGame(g.id, 'game', val)}
                              options={GAME_OPTIONS}
                              placeholder="Game"
                            />
                          </div>
                          <button onClick={() => deleteGame(g.id)} className="lg:hidden text-slate/40 hover:text-red-500 transition-colors p-2 rounded-lg hover:bg-red-500/10"><Trash2 size={18} /></button>
                        </div>
                        
                        {/* 3. Opponent */}
                        <div className="flex items-center gap-2 w-full lg:w-auto">
                          <span className="text-slate/40 text-[10px] font-mono shrink-0 uppercase tracking-tighter w-4 text-center">VS</span>
                          <AnimatedInput
                            value={g.opponent} onChange={(e) => updateGame(g.id, 'opponent', e.target.value)}
                            className="border border-slate/20 flex-1 hover:border-slate/40 bg-background h-10 rounded-xl"
                            placeholder="Opponent"
                          />
                        </div>

                        {/* 4. Match Type */}
                        <div className="w-full lg:w-auto">
                          <div className="w-full">
                            <CustomDropdown
                              value={g.type}
                              onChange={(val) => updateGame(g.id, 'type', val)}
                              options={TYPE_OPTIONS}
                              placeholder="Type"
                            />
                          </div>
                        </div>

                        {/* 5. Date & Time */}
                        <div className="flex items-center gap-2 w-full lg:w-auto">
                          <div className="flex-1">
                            <CustomAnimatedDatePicker
                              value={g.date}
                              onChange={(val) => updateGame(g.id, 'date', val)}
                            />
                          </div>
                          <div className="w-32 shrink-0">
                            <CustomTimePicker
                              value={g.time}
                              onChange={(val) => updateGame(g.id, 'time', val)}
                            />
                          </div>
                        </div>

                        {/* 6. Delete Action (Desktop) */}
                        <button onClick={() => deleteGame(g.id)} className="hidden lg:flex text-slate/40 hover:text-red-500 transition-all p-2 rounded-lg hover:bg-red-500/10 items-center justify-center translate-x-1">
                          <Trash2 size={18} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ─── STANDINGS EDITOR ─── */}
            {adminTab === 'standings' && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-sans font-semibold text-xl text-primary">Live Standings</h3>
                  <button onClick={handleAddStanding} className="text-accent hover:bg-accent/10 p-2 rounded-xl transition-colors flex items-center gap-1 font-mono text-xs"><Plus size={16} /> ADD TEAM</button>
                </div>
                {standings.length === 0 ? (
                  <div className="text-center py-8 text-slate/50 font-mono text-sm border border-dashed border-slate/20 rounded-xl">No standings data.</div>
                ) : (
                  <div className="flex flex-col gap-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                    {standings.map((s, index) => (
                      <div key={s.id} className="flex flex-col sm:flex-row items-start sm:items-center gap-4 bg-slate/5 p-4 rounded-2xl border border-slate/10">
                        <div className="flex items-center justify-between w-full sm:w-auto gap-3">
                          <span className="font-mono text-xs text-slate/40 w-4">{index + 1}</span>
                          <AnimatedInput
                            value={s.team} onChange={(e) => updateStanding(s.id, 'team', e.target.value)}
                            className="border border-slate/20 flex-1 hover:border-slate/40 bg-background h-10"
                            placeholder="Team Name"
                          />
                          <button onClick={() => deleteStanding(s.id)} className="sm:hidden text-slate/40 hover:text-red-500 transition-colors p-2 rounded-lg hover:bg-red-500/10"><Trash2 size={18} /></button>
                        </div>
                        <div className="flex items-center justify-between w-full sm:w-auto gap-4">
                          <div className="flex items-center gap-6">
                            <NumberStepper color="green" label="W" value={s.wins} onChange={(e) => updateStanding(s.id, 'wins', e.target.value)} />
                            <NumberStepper color="red" label="L" value={s.losses} onChange={(e) => updateStanding(s.id, 'losses', e.target.value)} />
                          </div>
                          <button onClick={() => deleteStanding(s.id)} className="hidden sm:block text-slate/40 hover:text-red-500 transition-colors p-2 rounded-lg hover:bg-red-500/10"><Trash2 size={18} /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            
            {/* ─── RANKINGS / LEAGUE EDITOR ─── */}
            {adminTab === 'rankings' && (
              <div className="animate-glide-in">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex flex-col">
                    <h3 className="font-sans font-semibold text-xl text-primary">League Rankings</h3>
                    <p className="font-sans text-slate/50 text-xs">Manage PlayVS league standings and regional placements.</p>
                  </div>
                  <button onClick={handleAddStanding} className="text-accent hover:bg-accent/10 p-2 rounded-xl transition-colors flex items-center gap-1 font-mono text-xs"><Plus size={16} /> ADD TEAM</button>
                </div>
                
                <div className="bg-slate/5 border border-slate/10 rounded-2xl overflow-hidden">
                  <div className="max-h-[500px] overflow-y-auto custom-scrollbar">
                    <table className="w-full text-left border-collapse">
                      <thead className="sticky top-0 bg-background z-10 border-b border-slate/10">
                        <tr>
                          <th className="p-4 font-mono text-[10px] text-slate/40 uppercase tracking-widest bg-slate/5">Team Name</th>
                          <th className="p-4 font-mono text-[10px] text-slate/40 uppercase tracking-widest text-center bg-slate/5">League Rank</th>
                          <th className="p-4 font-mono text-[10px] text-slate/40 uppercase tracking-widest bg-slate/5">League / Region</th>
                          <th className="p-4 font-mono text-[10px] text-slate/40 uppercase tracking-widest text-center bg-slate/5">W-L</th>
                          <th className="p-4 font-mono text-[10px] text-slate/40 uppercase tracking-widest text-right bg-slate/5">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate/5">
                        {standings.map((s) => (
                          <tr key={s.id} className="hover:bg-primary/[0.02] transition-colors group">
                            <td className="p-3">
                              <div className="flex flex-col gap-2">
                                <CustomDropdown 
                                  value={s.game} 
                                  onChange={(val) => updateStanding(s.id, 'game', val)}
                                  options={GAME_OPTIONS}
                                  placeholder="Select Game"
                                />
                                <AnimatedInput 
                                  value={s.team} 
                                  onChange={(e) => updateStanding(s.id, 'team', e.target.value)}
                                  className="border border-slate/10 bg-background h-10 rounded-lg text-sm font-bold"
                                  placeholder="Team Name (e.g. Varsity)"
                                />
                              </div>
                            </td>
                            <td className="p-3 w-32">
                              <div className="relative">
                                <span className={cn("absolute left-3 top-1/2 -translate-y-1/2 font-mono text-xs text-slate/40", s.leagueRank && "text-accent font-bold")}>#</span>
                                <input 
                                  type="text"
                                  value={s.leagueRank || ''}
                                  onChange={(e) => updateStanding(s.id, 'leagueRank', e.target.value)}
                                  className="w-full pl-6 pr-3 py-2 bg-background border border-slate/10 rounded-lg font-mono text-sm text-center outline-none focus:border-accent transition-colors"
                                  placeholder="--"
                                />
                              </div>
                            </td>
                            <td className="p-3">
                              <AnimatedInput 
                                value={s.leagueName || ''} 
                                onChange={(e) => updateStanding(s.id, 'leagueName', e.target.value)}
                                className="border border-slate/10 bg-background h-10 rounded-lg text-sm"
                                placeholder="e.g. Georgia / PlayVS"
                              />
                            </td>
                            <td className="p-3">
                              <div className="flex items-center justify-center gap-2">
                                <NumberStepper color="green" label="W" value={s.wins} onChange={(e) => updateStanding(s.id, 'wins', e.target.value)} />
                                <NumberStepper color="red" label="L" value={s.losses} onChange={(e) => updateStanding(s.id, 'losses', e.target.value)} />
                              </div>
                            </td>
                            <td className="p-3 text-right">
                              <button onClick={() => deleteStanding(s.id)} className="text-slate/20 hover:text-red-500 transition-all p-2 rounded-lg hover:bg-red-500/10 opacity-0 group-hover:opacity-100">
                                <Trash2 size={16} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {standings.length === 0 && (
                    <div className="p-12 text-center text-slate/40 font-mono text-sm">No standings data. Click Add Team to begin.</div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
