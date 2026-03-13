import React, { useState } from 'react';
import { Gamepad2 } from 'lucide-react';
import { EventAddToCalendar } from '../components/EventAddToCalendar';
import { GameIcon } from '../components/SharedUI';
import { formatGameDate } from '../utils/gameUtils';
import { LiveStandings } from '../components/LiveStandings';
import { GlobalRankingsPanel } from '../components/Esports/GlobalRankingsPanel';
import { cn } from '../utils/cn';

const EsportsTab = ({ gamesList, standings, rankings, dataLoaded = true }) => {
  const [rosterFilter, setRosterFilter] = useState('ALL');

  return (
    <div className="pt-32 pb-24 px-4 sm:px-6 md:px-16 max-w-7xl mx-auto min-h-screen">
      <div className="tab-header mb-16">
        <h1 className="font-sans font-bold text-5xl md:text-7xl text-primary tracking-tighter mb-4">Campbell <span className="text-accent font-drama italic">eSpartans.</span></h1>
        <p className="font-sans text-slate text-lg max-w-2xl">The official PlayVS competitive core of Campbell CTRL. View upcoming schedules, match results, and live team standings across all active rosters.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch mb-12">
        {/* Full Schedule Feed */}
        <div className="esports-card lg:col-span-7 bg-background rounded-[2rem] p-5 sm:p-8 border border-slate/10 shadow-xl">
          <div className="flex items-center gap-3 mb-8 pb-6 border-b border-slate/10">
            <Gamepad2 className="text-accent" size={28} />
            <h2 className="font-sans font-bold text-2xl text-primary">PlayVS Schedule</h2>
          </div>
          <div className="flex flex-col gap-4">
            {!dataLoaded ? (
              <div className="flex min-h-[200px] items-center justify-center py-12 text-slate" aria-live="polite">Loading schedule…</div>
            ) : gamesList.length > 0 ? (
              gamesList.map((game) => {
                const displayTitle = game.game ? `${game.game} vs ${game.opponent}` : game.title;
                return (
                  <div key={game.id} className="group flex flex-col sm:flex-row sm:items-center justify-between p-5 bg-primary/5 rounded-2xl border border-transparent hover:border-slate/10 transition-colors">
                    <div className="flex items-center gap-4 mb-3 sm:mb-0">
                      <div className="w-12 h-12 rounded-xl bg-background border border-slate/10 flex items-center justify-center p-1.5 shrink-0 text-accent shadow-sm">
                        <GameIcon game={game.game || game.title} size={24} />
                      </div>
                      <div>
                        <h4 className="font-sans font-bold text-lg text-primary">{displayTitle}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={cn(
                            "text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full shadow-sm",
                            game.type && game.type.toUpperCase() === 'PLAYVS RANK'
                              ? "bg-accent/15 text-accent border border-accent/20"
                              : game.type && game.type.toUpperCase() === 'SCRIMMAGE'
                                ? "bg-amber-500/15 text-amber-700 border border-amber-500/20"
                                : "bg-slate/10 text-slate border border-slate/20"
                          )}>
                            {game.type && game.type.toUpperCase() === 'PLAYVS RANK' ? 'PLAYVS' : (game.type || 'Match').toUpperCase()}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-sm text-slate px-4 py-2 bg-background rounded-lg border border-slate/10 opacity-70 group-hover:opacity-100 transition-opacity">
                        {formatGameDate(game.date, game.time)}
                      </span>
                      <EventAddToCalendar event={game} eventType="game" />
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="py-20 text-center bg-primary/[0.02] rounded-3xl border border-dashed border-slate/20">
                <Gamepad2 className="mx-auto text-slate/20 mb-4" size={48} />
                <h3 className="font-sans font-bold text-xl text-primary/60">No upcoming events</h3>
                <p className="font-sans text-slate/40 text-sm mt-1">Check back later for new match schedules.</p>
              </div>
            )}
          </div>
        </div>

        {/* Live Standings Panel (Reused) */}
        <div className="esports-card lg:col-span-5">
          <div className="h-full"><LiveStandings standings={standings} fullHeight rosterFilter={rosterFilter} onRosterFilterChange={setRosterFilter} /></div>
        </div>
      </div>

      {/* Global Rankings Panel */}
      <div className="esports-card w-full">
        <GlobalRankingsPanel standingsSource={standings} rankings={rankings} rosterFilter={rosterFilter} onRosterFilterChange={setRosterFilter} />
      </div>
    </div>
  );
};

export default EsportsTab;
