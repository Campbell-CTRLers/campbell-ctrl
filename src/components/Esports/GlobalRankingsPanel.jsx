import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { Trophy, Search, X, Globe, ShieldCheck } from 'lucide-react';
import { GameIcon } from '../SharedUI';
import { cn } from '../../utils/cn';
import { useHaptics } from '../../hooks/useHaptics';
import AnimatedInput from '../../ui/AnimatedInput';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

// ─── Constants & Styles ──────────────────────────────────────────────────────
const SORT_OPTIONS = [
  { id: 'rank-asc',  label: '#↑', field: 'leagueRank', order: 'asc'  },
  { id: 'rank-desc', label: '#↓', field: 'leagueRank', order: 'desc' },
  { id: 'name-asc',  label: 'A→Z', field: 'game',      order: 'asc'  },
  { id: 'name-desc', label: 'Z→A', field: 'game',      order: 'desc' },
];

const ROSTER_OPTIONS = ['ALL', 'VARSITY', 'ALT'];

const simplifyGameName = (name) => {
  if (!name) return "";
  let n = name;
  if (/smash\s+bros/i.test(n)) return "Smash Bros";
  if (/mario\s+kart/i.test(n)) return "Mario Kart 8";
  if (/madden/i.test(n)) return "Madden";
  if (/pokemon|pokémon/i.test(n)) return "Pokémon";
  if (/street\s+fighter/i.test(n)) return "Street Fighter";
  if (/marvel\s+rivals/i.test(n)) return "Marvel Rivals";
  if (/rocket\s+league/i.test(n)) return "Rocket League";
  if (/splatoon/i.test(n)) return "Splatoon 3";
  return n;
};

const SEED_DATA = [
  { id: '1',  game: 'Rocket League',    leagueName: 'Georgia PlayVS', leagueRank: '1'  },
  { id: '2',  game: 'Smash Bros',       leagueName: 'GEF / PlayVS',  leagueRank: '4'  },
  { id: '3',  game: 'Marvel Rivals',    leagueName: 'PlayVS',        leagueRank: '2'  },
  { id: '4',  game: 'Splatoon 3',       leagueName: 'PlayVS',        leagueRank: '8'  },
  { id: '5',  game: 'Street Fighter 6', leagueName: 'PlayVS',        leagueRank: '12' },
  { id: '6',  game: 'Mario Kart 8',     leagueName: 'Georgia',       leagueRank: '3'  },
  { id: '7',  game: 'Smash Bros',       leagueName: 'PlayVS',        leagueRank: '1', isAlt: true },
  { id: '8',  game: 'Pokémon UNITE',    leagueName: 'Georgia PlayVS',leagueRank: '6'  },
  { id: '9',  game: 'Madden NFL 26',    leagueName: 'PlayVS',        leagueRank: '5'  },
  { id: '10', game: 'Madden NFL 26',    leagueName: 'Georgia',       leagueRank: '2', isAlt: true },
];

/**
 * SLIDING SEGMENT GROUP
 * Uses useGSAP for robust animation of the background pill.
 */
const SegmentGroup = React.memo(({ label, options, value, onChange, accentFn }) => {
  const containerRef = useRef(null);
  const pillRef      = useRef(null);
  const haptics      = useHaptics();

  const getColors = (id) => {
    // Defaulting to blue as requested by user
    return { bg: 'rgba(59, 130, 246, 0.12)', border: 'rgba(59, 130, 246, 0.35)', text: '#3b82f6' };
  };

  // The actual animation logic
  useGSAP(() => {
    if (!containerRef.current || !pillRef.current) return;
    
    // Find the button with data-id that matches our current value
    const buttons = Array.from(containerRef.current.querySelectorAll('[data-id]'));
    const btn = buttons.find(b => b.getAttribute('data-id') === value);
    
    if (btn) {
      const colors = getColors(value);
      
      // Morph the pill to the button's position and size
      gsap.to(pillRef.current, {
        x: btn.offsetLeft,
        width: btn.offsetWidth,
        backgroundColor: colors.bg,
        borderColor: colors.border,
        duration: 0.45,
        ease: "back.out(1.6)", // "Hust" effect spring
        opacity: 1,
        overwrite: "auto"
      });
    }
  }, { scope: containerRef, dependencies: [value, options] });

  return (
    <div className="flex items-center gap-1.5 bg-primary/5 border border-slate/10 rounded-xl px-2 py-1">
      {label && (
        <span className="font-mono text-[8px] text-slate/30 uppercase tracking-widest shrink-0 pr-0.5">
          {label}
        </span>
      )}
      <div ref={containerRef} className="relative flex items-center">
        {/* The sliding pill bg */}
        <div
          ref={pillRef}
          className="absolute top-0 h-full rounded-lg border pointer-events-none opacity-0 will-change-transform"
          style={{ transform: 'translateX(0)', width: 0 }}
        />
        
        {options.map((opt) => {
          const id = typeof opt === 'object' ? opt.id : opt;
          const lbl = typeof opt === 'object' ? opt.label : opt;
          const active = id === value;
          const colors = getColors(id);
          
          return (
            <button
              key={id}
              data-id={id}
              onClick={() => { haptics.light(); if (id !== value) onChange(id); }}
              className={cn(
                'relative z-10 px-2.5 py-1 rounded-lg text-[10px] sm:text-[9px] font-mono font-black tracking-tight transition-all duration-300 active:scale-95 hover:bg-slate/5',
                active ? "" : "text-slate/40 hover:text-primary"
              )}
              style={{ color: active ? colors.text : undefined }}
            >
              {lbl}
            </button>
          );
        })}
      </div>
    </div>
  );
});

// ─── Main Component ───────────────────────────────────────────────────────────
export const GlobalRankingsPanel = ({ standings = [] }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeLeague, setActiveLeague] = useState('ALL');
  const [activeType, setActiveType] = useState('ALL');
  const [activeSortId, setActiveSortId] = useState('rank-asc');
  
  const haptics = useHaptics();
  const mobileInputRef = useRef(null);

  const data = useMemo(() => standings && standings.length > 0 ? standings : SEED_DATA, [standings]);

  useEffect(() => {
    if (mobileOpen) setTimeout(() => mobileInputRef.current?.focus(), 150);
  }, [mobileOpen]);

  const leagueOptions = useMemo(() => {
    const ls = Array.from(new Set(data.map(s => s.leagueName).filter(Boolean)));
    return ['ALL', ...ls];
  }, [data]);

  const activeSort = useMemo(() => SORT_OPTIONS.find(s => s.id === activeSortId) ?? SORT_OPTIONS[0], [activeSortId]);

  const filtered = useMemo(() => {
    const q = searchQuery.toLowerCase();
    let r = data.filter(item => {
      const ms = !q || (item.game || '').toLowerCase().includes(q);
      const ml = activeLeague === 'ALL' || item.leagueName === activeLeague;
      const mt = activeType === 'ALL'
              || (activeType === 'ALT' && item.isAlt)
              || (activeType === 'VARSITY' && !item.isAlt);
      return ms && ml && mt;
    });
    
    r.sort((a, b) => {
      let vA = a[activeSort.field], vB = b[activeSort.field];
      if (activeSort.field === 'leagueRank') { vA = parseInt(vA)||999; vB = parseInt(vB)||999; }
      const c = typeof vA === 'string' ? vA.localeCompare(vB) : vA - vB;
      return activeSort.order === 'asc' ? c : -c;
    });
    return r;
  }, [data, searchQuery, activeLeague, activeType, activeSort]);

  const hasFilters = activeLeague !== 'ALL' || activeType !== 'ALL' || activeSortId !== 'rank-asc';
  
  const reset = useCallback(() => {
    haptics.light();
    setSearchQuery('');
    setActiveLeague('ALL');
    setActiveType('ALL');
    setActiveSortId('rank-asc');
  }, [haptics]);

  // Stable handlers for SegmentGroups
  const handleLeague = useCallback((v) => setActiveLeague(v), []);
  const handleType = useCallback((v) => setActiveType(v), []);
  const handleSort = useCallback((v) => setActiveSortId(v), []);

  return (
    <div className="bg-background rounded-[2.5rem] p-5 sm:p-8 border border-slate/15 shadow-2xl flex flex-col h-full min-h-[550px]">
      
      {/* ── Header Row ── */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex flex-col">
          <h2 className="font-sans font-black text-2xl text-primary flex items-center gap-2.5 italic">
            <Trophy className="text-accent" size={24} />
            GLOBAL RANKINGS
          </h2>
          <span className="font-mono text-[9px] text-slate/40 tracking-[0.2em] uppercase mt-1 hidden sm:block">
            Cross-Roster Regional Leaderboard
          </span>
        </div>

        {/* Desktop Search */}
        <div className="hidden sm:block w-[180px] focus-within:w-[260px] transition-all duration-500 ease-out">
          <AnimatedInput
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search teams..."
            className="border border-slate/10 hover:border-slate/20 focus-within:border-accent/40 h-10 rounded-2xl text-xs bg-slate/5"
          />
        </div>

        {/* Mobile Search Toggle */}
        <button
          onClick={() => { haptics.medium(); setMobileOpen(true); }}
          className="sm:hidden w-12 h-12 rounded-2xl bg-primary/5 flex items-center justify-center text-slate border border-slate/10"
        >
          <Search size={20} />
        </button>
      </div>

      {/* ── Filter Bar (Desktop) ── */}
      <div className="hidden sm:flex flex-wrap items-center gap-2.5 mb-6 pb-6 border-b border-slate/10">
        <SegmentGroup label="League" options={leagueOptions} value={activeLeague} onChange={handleLeague} />
        <SegmentGroup label="Roster" options={ROSTER_OPTIONS} value={activeType}   onChange={handleType} accentFn={(id) => id === 'ALT' ? 'blue' : 'accent'} />
        <SegmentGroup label="Sort By" options={SORT_OPTIONS}   value={activeSortId} onChange={handleSort} />
        
        {hasFilters && (
          <button onClick={reset} className="ml-2 font-mono text-[8px] font-bold text-slate/30 border-b border-slate/20 hover:text-accent hover:border-accent transition-all uppercase tracking-widest pb-px">
            Reset All
          </button>
        )}
      </div>

      {/* ── Mobile Overlay (Now full-page) ── */}
      {mobileOpen && (
        <div className="sm:hidden fixed inset-0 z-[100] bg-background backdrop-blur-3xl flex flex-col p-6 pt-[calc(1rem+env(safe-area-inset-top,0px))] pb-[calc(1rem+env(safe-area-inset-bottom,0px))] gap-6 overflow-y-auto animate-in fade-in slide-in-from-bottom-5 duration-300">
          
          {/* Search & Actions at Top */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <AnimatedInput
                  ref={mobileInputRef}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Find a game..."
                  className="border-slate/10 h-12 rounded-2xl text-base bg-primary/5"
                  mono={false}
                  tracking="normal"
                />
              </div>
              <button 
                onClick={() => { haptics.light(); setMobileOpen(false); }} 
                className="w-12 h-12 rounded-2xl bg-primary/5 flex items-center justify-center text-slate border border-slate/10"
              >
                <X size={20} />
              </button>
            </div>
            <button 
              onClick={() => { haptics.success(); setMobileOpen(false); }} 
              className="w-full bg-blue-500 text-white font-mono font-black text-xs py-3.5 rounded-2xl shadow-xl shadow-blue-500/20 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              VIEW {filtered.length} RANKINGS
            </button>
          </div>

          <div className="h-px bg-slate/10" />

          {/* Filters Secondary */}
          <div className="flex flex-col gap-5">
            <SegmentGroup label="League" options={leagueOptions} value={activeLeague} onChange={handleLeague} />
            <SegmentGroup label="Roster" options={ROSTER_OPTIONS} value={activeType}   onChange={handleType} />
            <SegmentGroup label="Order"  options={SORT_OPTIONS}   value={activeSortId} onChange={handleSort} />
          </div>

          <div className="mt-auto opacity-20 pointer-events-none">
            <div className="flex flex-col items-center gap-2">
              <Trophy size={40} className="text-slate/20" />
              <span className="font-mono text-[8px] uppercase tracking-[0.3em]">Campbell Esports</span>
            </div>
          </div>
        </div>
      )}

      {/* ── Mobile Active Status ── */}
      {!mobileOpen && hasFilters && (
        <div className="sm:hidden flex items-center gap-2 mb-4 flex-wrap">
          <span className="font-mono text-[8px] text-slate/30 uppercase font-black">ACTIVE:</span>
          {activeLeague !== 'ALL' && <span className="text-[9px] font-mono font-black text-accent bg-accent/10 px-2 py-1 rounded-lg">{activeLeague}</span>}
          {activeType !== 'ALL'   && <span className="text-[9px] font-mono font-black text-blue-500 bg-blue-500/10 px-2 py-1 rounded-lg">{activeType}</span>}
          {activeSortId !== 'rank-asc' && <span className="text-[9px] font-mono font-black text-primary/50 bg-primary/5 px-2 py-1 rounded-lg">{activeSort.label}</span>}
          <button onClick={reset} className="ml-auto text-slate/30"><X size={12} /></button>
        </div>
      )}

      {/* ── Table Board ── */}
      <div className="flex-1 overflow-x-auto custom-scrollbar">
        <table className="w-full text-left border-collapse min-w-[320px]">
          <thead className="hidden sm:table-header-group">
            <tr className="border-b border-slate/10">
              <th className="pb-4 font-mono text-[9px] text-slate/30 uppercase tracking-[0.2em] pl-3">Pos</th>
              <th className="pb-4 font-mono text-[9px] text-slate/30 uppercase tracking-[0.2em]">Competitor</th>
              <th className="pb-4 font-mono text-[9px] text-slate/30 uppercase tracking-[0.2em] text-center">Placement</th>
              <th className="pb-4 font-mono text-[9px] text-slate/30 uppercase tracking-[0.2em] text-right pr-3">Category</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate/5">
            {filtered.length > 0 ? (
              filtered.map((team, idx) => (
                <tr key={team.id} className="group hover:bg-primary/[0.03] transition-all duration-300">
                  <td className="py-5 pl-3 font-mono text-xs text-slate/20 hidden sm:table-cell">{idx + 1}</td>
                  
                  <td className="py-4 sm:py-5">
                    <div className="flex items-center gap-4">
                      <div className="w-11 h-11 rounded-2xl bg-primary/5 flex items-center justify-center border border-slate/10 shrink-0 text-accent group-hover:scale-105 group-hover:shadow-lg group-hover:shadow-accent/5 transition-all duration-500">
                        <GameIcon game={team.game} size={24} />
                      </div>
                      <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-sans font-black text-base text-primary tracking-tight truncate leading-none uppercase italic">{simplifyGameName(team.game)}</span>
                          {team.isAlt && <span className="text-[7px] font-mono font-black bg-blue-500 text-white px-1.5 py-0.5 rounded-md shadow-sm">ALT</span>}
                        </div>
                        <span className="font-mono text-[9px] text-slate/40 uppercase tracking-widest mt-1.5">{team.leagueName}</span>
                      </div>
                    </div>
                  </td>

                  <td className="py-4 sm:py-5 px-4 text-right sm:text-center">
                    <div className="flex flex-col items-end sm:items-center">
                      <span className="font-sans font-black text-2xl sm:text-3xl text-red-500 tabular-nums">#{team.leagueRank || '--'}</span>
                      <span className="sm:hidden font-mono text-[8px] text-slate/40 uppercase font-black tracking-tighter mt-0.5">{team.leagueName}</span>
                    </div>
                  </td>

                  <td className="py-5 pr-3 text-right hidden sm:table-cell">
                    {team.isAlt ? (
                      <span className="inline-flex items-center gap-1.5 font-mono text-[9px] font-black text-blue-500 bg-blue-500/10 px-3 py-1.5 rounded-xl border border-blue-500/20 shadow-sm shadow-blue-500/5">
                        <ShieldCheck size={11} /> ALTERNATE
                      </span>
                    ) : (
                      <span className="font-mono text-[9px] font-black text-slate/30 bg-primary/5 px-3 py-1.5 rounded-xl border border-slate/10">VARSITY</span>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="4" className="py-24 text-center">
                  <div className="flex flex-col items-center gap-4 text-slate/20">
                    <Globe size={48} className="animate-pulse opacity-50" />
                    <p className="font-mono text-[10px] items-center uppercase tracking-[0.3em] font-black">Zero Matching Records</p>
                    <button onClick={reset} className="text-accent text-[9px] font-mono font-black bg-accent/5 px-4 py-2 rounded-xl border border-accent/20 hover:bg-accent hover:text-white transition-all">Clear All Filters</button>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
