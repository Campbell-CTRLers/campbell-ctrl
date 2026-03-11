import React, { useRef, useState, useEffect } from 'react';
import gsap from 'gsap';
import { GameIcon, formatGameDate } from '../SharedUI';
import { cn } from '../../utils/cn';

export const TelemetryTypewriter = ({ gamesList }) => {
  const [phase, setPhase] = useState('loading'); // 'loading' | 'revealing' | 'done'
  const [visibleCount, setVisibleCount] = useState(0);
  const containerRef = useRef(null);

  useEffect(() => {
    // Phase 1: Show loading shimmer for 1.5s
    const loadTimer = setTimeout(() => {
      setPhase('revealing');
    }, 1500);

    return () => clearTimeout(loadTimer);
  }, []);

  useEffect(() => {
    if (phase !== 'revealing') return;
    if (visibleCount >= gamesList.length) {
      setPhase('done');
      return;
    }

    const revealTimer = setTimeout(() => {
      setVisibleCount(prev => prev + 1);
    }, 400);

    return () => clearTimeout(revealTimer);
  }, [phase, visibleCount, gamesList.length]);

  // Animate each card as it appears
  useEffect(() => {
    if (phase === 'loading' || !containerRef.current) return;
    const cards = containerRef.current.querySelectorAll('.feed-card');
    cards.forEach((card, i) => {
      if (i === visibleCount - 1) {
        gsap.fromTo(card,
          { y: 20, opacity: 0, scale: 0.97 },
          { y: 0, opacity: 1, scale: 1, duration: 0.4, ease: 'back.out(1.4)' }
        );
      }
    });
  }, [visibleCount, phase]);

  return (
    <div className="bg-background rounded-[2rem] p-8 border border-slate/10 shadow-xl flex flex-col h-[380px] group">
      {/* Header */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-2">
          <div className={cn(
            "w-2 h-2 rounded-full",
            phase === 'done' ? "bg-green-500" : "bg-accent animate-pulse"
          )}></div>
          <span className="font-mono text-xs font-bold text-accent uppercase tracking-widest">
            {phase === 'loading' ? 'Syncing...' : phase === 'revealing' ? 'Loading Feed' : 'PlayVS Feed'}
          </span>
        </div>
        <h3 className="font-sans font-bold text-2xl text-primary">Campbell CTRL eSpartans</h3>
        <p className="font-roboto text-slate/80 text-sm mt-1">Upcoming matches and scrimmages.</p>
      </div>

      {/* Feed Area */}
      <div className="flex-1 overflow-hidden relative" ref={containerRef}>
        {/* Loading shimmer */}
        {phase === 'loading' && (
          <div className="flex flex-col gap-2">
            {[0, 1, 2].map(i => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-slate/5 animate-pulse" style={{ animationDelay: `${i * 0.15}s` }}>
                <div className="w-8 h-8 rounded-lg bg-slate/10 flex-shrink-0"></div>
                <div className="flex-1 space-y-1.5">
                  <div className="h-3 bg-slate/10 rounded-full w-3/4"></div>
                  <div className="h-2.5 bg-slate/8 rounded-full w-1/2"></div>
                </div>
                <div className="h-5 w-16 bg-slate/8 rounded-full"></div>
              </div>
            ))}
          </div>
        )}

        {/* Revealed items */}
        {phase !== 'loading' && (
          <div className="flex flex-col gap-2 overflow-y-auto custom-scrollbar h-full pr-1">
            {gamesList.length > 0 ? (
              gamesList.slice(0, visibleCount).map((g, i) => {
                const displayTitle = g.game ? `${g.game} vs ${g.opponent}` : g.title;
                const dateStr = formatGameDate(g.date, g.time);
                const matchType = (g.type || 'MATCH').toUpperCase();

                return (
                  <div
                    key={g.id || i}
                    className="feed-card p-3 rounded-xl bg-slate/[0.03] border border-slate/[0.06] hover:bg-slate/[0.06] transition-colors"
                    style={{ opacity: 0 }}
                  >
                    {/* Top: Icon + Title */}
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-md bg-slate/5 flex items-center justify-center flex-shrink-0 border border-slate/10">
                        <GameIcon game={g.game || g.title} size={16} />
                      </div>
                      <p className="font-roboto text-sm font-semibold text-primary leading-tight">{displayTitle}</p>
                    </div>

                    {/* Bottom: Date left, Badge right */}
                    <div className="flex items-end justify-between mt-1.5 pl-[calc(1.75rem+0.625rem)]">
                      <div className="font-mono text-[11px] text-slate/60 leading-tight">
                        {dateStr ? (
                          <>
                            <span>{dateStr.split(' - ')[0]}</span>
                            {dateStr.split(' - ')[1] && <><br /><span>{dateStr.split(' - ')[1]}</span></>}
                          </>
                        ) : 'TBD'}
                      </div>
                      <span className={cn(
                        "text-[9px] font-mono font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full",
                        matchType === 'SCRIMMAGE'
                          ? "bg-amber-500/10 text-amber-600"
                          : matchType === 'PLAYVS RANK'
                            ? "bg-accent/10 text-accent"
                            : "bg-slate/10 text-slate"
                      )}>
                        {matchType === 'PLAYVS RANK' ? 'PLAYVS' : matchType}
                      </span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="h-full flex flex-col items-center justify-center opacity-50">
                <p className="font-mono text-[10px] uppercase tracking-widest">No Active Events</p>
                <p className="font-roboto text-[11px] mt-1 text-center">Stand by for updates.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
