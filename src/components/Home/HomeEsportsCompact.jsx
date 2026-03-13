import React from 'react';
import { GameIcon } from '../SharedUI';
import { formatGameDate } from '../../utils/gameUtils';
import { LiveStandings } from '../LiveStandings';
import { GlobalRankingsPanel } from '../Esports/GlobalRankingsPanel';
import { ChevronRight } from 'lucide-react';
import { cn } from '../../utils/cn';

const CARD_CLASS = "rounded-2xl border border-slate/10 bg-slate/5 p-4 flex flex-col min-h-0";
const HEADER_CLASS = "font-sans font-bold text-sm text-primary uppercase tracking-tight mb-3";

const CtaLink = ({ label, onClick }) =>
  onClick ? (
    <button
      onClick={onClick}
      className="mt-3 pt-3 border-t border-slate/10 min-h-[44px] flex items-center gap-1 font-mono text-[10px] text-slate/60 hover:text-accent transition-colors w-full justify-end touch-manipulation active:scale-[0.98] py-2"
    >
      {label}
      <ChevronRight size={12} />
    </button>
  ) : null;

export const HomeEsportsCompact = ({ gamesList, standings, rankings, dataLoaded, onNavigateToEsports }) => {
  return (
    <section className="w-full py-12 md:py-16 px-6 md:px-16 bg-background">
      <div className="max-w-7xl mx-auto">
        <h2 className="font-sans font-bold text-xl md:text-2xl text-primary mb-2 tracking-tight">
          Schedule, Standings & Rankings
        </h2>
        <p className="text-slate/60 text-sm mb-6">Quick overview — tap Esports for full details.</p>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
          {/* Schedule */}
          <div className={CARD_CLASS}>
            <h3 className={HEADER_CLASS}>Upcoming</h3>
            <div className="flex flex-col gap-2 overflow-y-auto max-h-[280px] custom-scrollbar pr-1 flex-1 min-h-0">
              {!dataLoaded ? (
                <div className="py-8 text-center text-slate text-xs">Loading…</div>
              ) : gamesList.length > 0 ? (
                gamesList.map((g, i) => {
                  const displayTitle = g.game ? `${g.game} vs ${g.opponent}` : g.title;
                  const matchType = (g.type || 'MATCH').toUpperCase();
                  return (
                    <div key={g.id || i} className="flex items-center justify-between gap-2 py-2 border-b border-slate/10 last:border-0">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-7 h-7 rounded-lg bg-background flex items-center justify-center shrink-0 border border-slate/10">
                          <GameIcon game={g.game || g.title} size={14} />
                        </div>
                        <div className="min-w-0">
                          <p className="font-roboto text-xs font-semibold text-primary truncate">{displayTitle}</p>
                          <p className="font-mono text-[10px] text-slate/60">{formatGameDate(g.date, g.time) || 'TBD'}</p>
                        </div>
                      </div>
                      <span className={cn('text-[8px] font-mono font-bold uppercase px-1.5 py-0.5 rounded shrink-0', matchType === 'PLAYVS RANK' ? 'bg-accent/10 text-accent' : matchType === 'SCRIMMAGE' ? 'bg-amber-500/10 text-amber-600' : 'bg-slate/10 text-slate')}>
                        {matchType === 'PLAYVS RANK' ? 'PV' : matchType.slice(0, 3)}
                      </span>
                    </div>
                  );
                })
              ) : (
                <div className="py-6 text-center text-slate/50 text-xs">No upcoming events</div>
              )}
            </div>
            <CtaLink label="View full schedule" onClick={onNavigateToEsports} />
          </div>

          {/* Standings */}
          <div className={CARD_CLASS}>
            <div className="flex-1 min-h-0 flex flex-col overflow-hidden max-h-[280px]">
              <LiveStandings standings={standings} fullHeight compact noCard />
            </div>
            <CtaLink label="View standings" onClick={onNavigateToEsports} />
          </div>

          {/* Global Rankings */}
          <div className={CARD_CLASS}>
            <div className="flex-1 min-h-0 flex flex-col overflow-hidden max-h-[280px]">
              <GlobalRankingsPanel standingsSource={standings} rankings={rankings} compact noCard />
            </div>
            <CtaLink label="Explore rankings" onClick={onNavigateToEsports} />
          </div>
        </div>
      </div>
    </section>
  );
};

