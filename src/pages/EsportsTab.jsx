import React, { useEffect, useState } from 'react';
import { IconGamepad } from '../components/icons/SvgIcons';
import { EventAddToCalendar } from '../components/EventAddToCalendar';
import { GameIcon } from '../components/SharedUI';
import { formatGameDate } from '../utils/gameUtils';
import { LiveStandings } from '../components/LiveStandings';
import { GlobalRankingsPanel } from '../components/Esports/GlobalRankingsPanel';
import { cn } from '../utils/cn';
import { EditableSiteText } from '../components/content/EditableSiteText';

const EsportsTab = ({ gamesList, standings, rankings, dataLoaded = true, siteContent, setSiteContent, contentEditor }) => {
  const [rosterFilter, setRosterFilter] = useState('ALL');
  const [cardDensity, setCardDensity] = useState(() => {
    if (typeof window === 'undefined') return 'comfortable';
    return window.localStorage.getItem('esportsCardDensity') || 'comfortable';
  });
  const compactCards = cardDensity === 'compact';

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem('esportsCardDensity', cardDensity);
  }, [cardDensity]);

  const heading = siteContent?.esports?.heading || 'Campbell';
  const headingAccent = siteContent?.esports?.headingAccent || 'eSpartans.';
  const description = siteContent?.esports?.description || 'The official PlayVS competitive core of Campbell CTRL. View upcoming schedules, match results, and live team standings across all active rosters.';

  return (
    <div className="pt-32 pb-24 px-4 sm:px-6 md:px-16 max-w-7xl mx-auto min-h-screen">
      <div className="tab-header mb-16">
        <h1 className="font-sans font-bold text-5xl md:text-7xl text-primary tracking-tighter mb-4">
          <EditableSiteText as="span" contentKey="esports.heading" fallback={heading} siteContent={siteContent} setSiteContent={setSiteContent} editor={contentEditor} />{' '}
          <EditableSiteText as="span" contentKey="esports.headingAccent" fallback={headingAccent} siteContent={siteContent} setSiteContent={setSiteContent} editor={contentEditor} className="text-accent font-drama italic" />
        </h1>
        <EditableSiteText as="p" contentKey="esports.description" fallback={description} siteContent={siteContent} setSiteContent={setSiteContent} editor={contentEditor} className="font-sans text-slate text-lg max-w-2xl" />
        <div className="md:hidden mt-4 flex items-center gap-2">
          <span className="text-[9px] font-mono uppercase tracking-[0.15em] text-slate/40">Card Density</span>
          <button onClick={() => setCardDensity('comfortable')} className={cn('px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold uppercase border', !compactCards ? 'border-accent bg-accent/10 text-accent' : 'border-slate/10 text-slate/60')}>Comfortable</button>
          <button onClick={() => setCardDensity('compact')} className={cn('px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold uppercase border', compactCards ? 'border-accent bg-accent/10 text-accent' : 'border-slate/10 text-slate/60')}>Compact</button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch mb-12">
        {/* Full Schedule Feed */}
        <div className={cn("esports-card lg:col-span-7 bg-background rounded-[2rem] border border-slate/10 shadow-xl", compactCards ? "p-4 sm:p-6" : "p-5 sm:p-8")}>
          <div className="flex items-center gap-3 mb-8 pb-6 border-b border-slate/10">
            <IconGamepad className="text-accent" size={28} />
            <EditableSiteText as="h2" contentKey="esports.scheduleHeading" fallback="PlayVS Schedule" siteContent={siteContent} setSiteContent={setSiteContent} editor={contentEditor} className="font-sans font-bold text-2xl text-primary" />
          </div>
          <div className="flex flex-col gap-4">
            {!dataLoaded ? (
              <div className="flex flex-col gap-3 animate-pulse" aria-live="polite">
                {Array.from({ length: 4 }).map((_, idx) => (
                  <div key={idx} className="h-16 rounded-2xl bg-slate/10" />
                ))}
              </div>
            ) : gamesList.length > 0 ? (
              gamesList.map((game) => {
                const displayTitle = game.game ? `${game.game} vs ${game.opponent}` : game.title;
                return (
                  <div key={game.id} className={cn("group flex flex-col sm:flex-row sm:items-center justify-between bg-primary/5 rounded-2xl border border-transparent hover:border-slate/10 transition-colors", compactCards ? "p-3.5" : "p-5")}>
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
                      <span className={cn("font-mono text-slate px-4 py-2 bg-background rounded-lg border border-slate/10 opacity-70 group-hover:opacity-100 transition-opacity", compactCards ? "text-xs" : "text-sm")}>
                        {formatGameDate(game.date, game.time)}
                      </span>
                      <EventAddToCalendar event={game} eventType="game" />
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="py-20 text-center bg-primary/[0.02] rounded-3xl border border-dashed border-slate/20">
                <IconGamepad className="mx-auto text-slate/20 mb-4" size={48} />
                <EditableSiteText as="h3" contentKey="esports.emptyHeading" fallback="No upcoming events" siteContent={siteContent} setSiteContent={setSiteContent} editor={contentEditor} className="font-sans font-bold text-xl text-primary/60" />
                <EditableSiteText as="p" contentKey="esports.emptyDescription" fallback="Check back later for new match schedules." siteContent={siteContent} setSiteContent={setSiteContent} editor={contentEditor} className="font-sans text-slate/40 text-sm mt-1" />
              </div>
            )}
          </div>
        </div>

        {/* Live Standings Panel (Reused) */}
        <div className="esports-card lg:col-span-5">
          <div className="h-full">
            {!dataLoaded ? (
              <div className="h-full min-h-[280px] rounded-[2rem] bg-slate/10 animate-pulse" />
            ) : (
              <LiveStandings standings={standings} fullHeight rosterFilter={rosterFilter} onRosterFilterChange={setRosterFilter} siteContent={siteContent} setSiteContent={setSiteContent} contentEditor={contentEditor} />
            )}
          </div>
        </div>
      </div>

      {/* Global Rankings Panel */}
      <div className="esports-card w-full">
        {!dataLoaded ? (
          <div className="h-[360px] rounded-[2rem] bg-slate/10 animate-pulse" />
        ) : (
          <GlobalRankingsPanel standingsSource={standings} rankings={rankings} rosterFilter={rosterFilter} onRosterFilterChange={setRosterFilter} siteContent={siteContent} setSiteContent={setSiteContent} contentEditor={contentEditor} />
        )}
      </div>
    </div>
  );
};

export default EsportsTab;
