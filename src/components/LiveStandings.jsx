import React, { useMemo } from 'react';
import { Trophy } from 'lucide-react';
import { GameIcon } from './SharedUI';
import { SegmentGroup, ROSTER_OPTIONS } from './Esports/GlobalRankingsPanel';
import { cn } from '../utils/cn';

const CARD_HEADER_CLASS = "font-sans font-bold text-sm text-primary uppercase tracking-tight";

export function LiveStandings({ standings, fullHeight, rosterFilter = 'ALL', onRosterFilterChange, compact, noCard }) {
  const sortedStandings = useMemo(() => {
    let list = [...standings];
    if (rosterFilter === 'VARSITY') list = list.filter((s) => !s.isAlt && !s.isDel);
    if (rosterFilter === 'ALT') list = list.filter((s) => s.isAlt && !s.isDel);
    if (rosterFilter === 'DEL') list = list.filter((s) => s.isDel);
    return list.sort((a, b) => {
      if (b.wins !== a.wins) return b.wins - a.wins;
      if (a.losses !== b.losses) return a.losses - b.losses;
      return a.team.localeCompare(b.team);
    });
  }, [standings, rosterFilter]);

  const header = (
    <div className={cn("flex justify-between items-start", compact ? "mb-3" : "mb-4")}>
      <div>
        <h3 className={cn(compact && noCard ? CARD_HEADER_CLASS : "font-display font-bold text-primary tracking-tight", compact && !noCard ? "text-sm" : compact ? "" : "text-2xl mb-2")}>CTRL Standings</h3>
        {!compact && <p className="font-roboto text-slate/80 text-sm">Win-loss records across all titles.</p>}
      </div>
      {!compact && <Trophy className="text-accent opacity-80" size={32} />}
    </div>
  );

  const rosterFilterUI = onRosterFilterChange && (
    <div className={cn("flex flex-wrap items-center gap-2 mb-3", !compact && "pb-4 border-b border-slate/10")}>
      <SegmentGroup label="Roster" options={ROSTER_OPTIONS} value={rosterFilter} onChange={onRosterFilterChange} />
    </div>
  );

  const content = (
    <>
      {header}
      {rosterFilterUI}
      <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar flex flex-col gap-2 min-h-0">
        {sortedStandings.map((team, idx) => (
          <div key={team.id} className={cn(
            "bg-primary/5 rounded-lg flex items-center",
            compact ? "p-2" : "p-3 hover:bg-primary/10"
          )}>
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <span className="font-mono text-slate text-[10px] opacity-50 w-3 shrink-0">{idx + 1}.</span>
              <div className={cn("rounded-md bg-slate/10 flex items-center justify-center shrink-0", compact ? "w-6 h-6 p-1" : "w-8 h-8 sm:w-10 sm:h-10 p-1.5")}>
                <GameIcon game={team.game} size={compact ? 14 : 20} />
              </div>
              <span className="font-roboto font-semibold text-primary truncate flex items-center gap-1" style={{ fontSize: compact ? 11 : 14 }}>
                {team.game}
                {team.isAlt && !team.isDel && <span className="text-[8px] font-mono font-bold bg-blue-500/10 text-blue-600 px-1 rounded uppercase shrink-0">ALT</span>}
                {team.isDel && <span className="text-[8px] font-mono font-bold bg-red-500/10 text-red-600 px-1 rounded uppercase shrink-0">DEL</span>}
              </span>
            </div>
            <div className="flex gap-1 font-mono text-[10px] shrink-0">
              <span className="bg-green-500/10 text-green-700 px-1.5 py-0.5 rounded min-w-[28px] text-center font-bold">{team.wins}W</span>
              <span className="bg-red-500/10 text-red-700 px-1.5 py-0.5 rounded min-w-[28px] text-center font-bold">{team.losses}L</span>
            </div>
          </div>
        ))}
        {sortedStandings.length === 0 && (
          <div className="h-full flex items-center justify-center font-mono text-xs text-slate/50">No data available.</div>
        )}
      </div>
    </>
  );

  if (compact && noCard) {
    return <div className="flex flex-col h-full min-h-0">{content}</div>;
  }

  return (
    <div className={cn(
      "bg-background rounded-2xl border border-slate/10 flex flex-col",
      compact ? "p-4 shadow-sm" : "p-5 sm:p-8 shadow-xl",
      fullHeight ? "h-full" : "h-[380px]"
    )}>
      {content}
    </div>
  );
}
