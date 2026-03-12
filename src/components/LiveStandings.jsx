import React from 'react';
import { Trophy } from 'lucide-react';
import { GameIcon } from './SharedUI';
import { cn } from '../utils/cn';

export function LiveStandings({ standings, fullHeight }) {
  const sortedStandings = [...standings].sort((a, b) => {
    if (b.wins !== a.wins) return b.wins - a.wins;
    if (a.losses !== b.losses) return a.losses - b.losses;
    return a.team.localeCompare(b.team);
  });

  return (
    <div className={cn("bg-background rounded-[2rem] p-5 sm:p-8 border border-slate/10 shadow-xl flex flex-col group", fullHeight ? "h-full" : "h-[380px]")}>
      <div className="flex justify-between items-start mb-6">
        <div>
          <h3 className="font-display font-bold text-2xl text-primary mb-2 tracking-tight">CTRL Standings</h3>
          <p className="font-roboto text-slate/80 text-sm">Win-loss records across all titles.</p>
        </div>
        <Trophy className="text-accent opacity-80" size={32} />
      </div>
      <div className="flex-1 overflow-y-auto pr-3 custom-scrollbar flex flex-col gap-3 p-2 -m-2">
        {sortedStandings.map((team, idx) => (
          <div key={team.id} className="bg-primary/5 rounded-xl p-3 flex items-center transition-transform hover:scale-[1.04] hover:shadow-lg hover:bg-primary/10">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <span className="font-mono text-slate text-xs opacity-50 w-4 shrink-0">{idx + 1}.</span>
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-slate/10 flex items-center justify-center p-1.5 shrink-0">
                <GameIcon game={team.game} size={20} />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="font-roboto font-semibold text-primary text-sm truncate flex items-center gap-2 transition-colors">
                  {team.game}
                  {team.isAlt && (
                    <span className="text-[9px] font-mono font-bold bg-blue-500/10 text-blue-600 px-1.5 py-0.5 rounded-md uppercase tracking-tighter shadow-sm border border-blue-500/10">ALT</span>
                  )}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1 sm:gap-2 font-mono text-xs ml-4 shrink-0">
              <span className="bg-green-500/10 text-green-700 px-2 py-1 rounded-md min-w-[38px] text-center font-bold">{team.wins}W</span>
              <span className="bg-red-500/10 text-red-700 px-2 py-1 rounded-md min-w-[38px] text-center font-bold">{team.losses}L</span>
            </div>
          </div>
        ))}
        {sortedStandings.length === 0 && (
          <div className="h-full flex items-center justify-center font-mono text-xs text-slate/50">No data available.</div>
        )}
      </div>
    </div>
  );
}
