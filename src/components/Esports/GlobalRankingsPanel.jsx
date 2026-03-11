import React, { useState, useMemo } from 'react';
import { Trophy, Search, ChevronUp, ChevronDown, Filter } from 'lucide-react';
import { GameIcon } from '../SharedUI';

export const GlobalRankingsPanel = ({ standings = [] }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState('wins'); // 'team' | 'wins' | 'losses' | 'pct'
  const [sortOrder, setSortOrder] = useState('desc');

  // Process data for global rankings (e.g. calculating Win %)
  const data = useMemo(() => {
    return (standings || []).map(s => {
      const total = s.wins + s.losses;
      const pct = total > 0 ? (s.wins / total) * 100 : 0;
      return { ...s, pct: pct.toFixed(1) };
    });
  }, [standings]);

  // Filter and Sort logic
  const filteredData = useMemo(() => {
    let result = data.filter(item => 
      item.team.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.game && item.game.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    result.sort((a, b) => {
      let valA = a[sortField];
      let valB = b[sortField];

      if (sortField === 'pct') {
        valA = parseFloat(valA);
        valB = parseFloat(valB);
      }

      if (sortOrder === 'asc') {
        return typeof valA === 'string' ? valA.localeCompare(valB) : valA - valB;
      } else {
        return typeof valA === 'string' ? valB.localeCompare(valA) : valB - valA;
      }
    });

    return result;
  }, [data, searchQuery, sortField, sortOrder]);

  const toggleSort = (field) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  return (
    <div className="bg-background rounded-[2rem] p-8 border border-slate/10 shadow-xl flex flex-col h-full min-h-[500px]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="font-sans font-bold text-2xl text-primary flex items-center gap-2">
            <Trophy className="text-accent" size={24} />
            Global Rankings
          </h2>
          <p className="font-sans text-slate text-sm mt-1">Aggregated performance across all Campbell rosters.</p>
        </div>
        
        {/* Search Bar */}
        <div className="relative group min-w-[240px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate/40 group-focus-within:text-accent transition-colors" size={18} />
          <input 
            type="text"
            placeholder="Search game or team..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-primary/5 border border-slate/20 rounded-xl py-2.5 pl-10 pr-4 font-sans text-sm outline-none focus:border-accent/40 focus:ring-4 focus:ring-accent/5 transition-all text-primary"
          />
        </div>
      </div>

      {/* Rankings Table */}
      <div className="flex-1 overflow-x-auto custom-scrollbar">
        <table className="w-full text-left border-collapse min-w-[600px]">
          <thead>
            <tr className="border-b border-slate/10">
              <th className="pb-4 font-mono text-[10px] text-slate/40 uppercase tracking-widest pl-2">Rank</th>
              <th 
                className="pb-4 font-mono text-[10px] text-slate/40 uppercase tracking-widest cursor-pointer hover:text-primary transition-colors pr-4"
                onClick={() => toggleSort('team')}
              >
                <div className="flex items-center gap-1">
                  Team {sortField === 'team' && (sortOrder === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />)}
                </div>
              </th>
              <th 
                className="pb-4 font-mono text-[10px] text-slate/40 uppercase tracking-widest text-center cursor-pointer hover:text-primary transition-colors px-4"
                onClick={() => toggleSort('wins')}
              >
                <div className="flex items-center justify-center gap-1">
                  W {sortField === 'wins' && (sortOrder === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />)}
                </div>
              </th>
              <th 
                className="pb-4 font-mono text-[10px] text-slate/40 uppercase tracking-widest text-center cursor-pointer hover:text-primary transition-colors px-4"
                onClick={() => toggleSort('losses')}
              >
                <div className="flex items-center justify-center gap-1">
                  L {sortField === 'losses' && (sortOrder === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />)}
                </div>
              </th>
              <th 
                className="pb-4 font-mono text-[10px] text-accent uppercase tracking-widest text-right cursor-pointer hover:text-accent/80 transition-colors pr-2"
                onClick={() => toggleSort('pct')}
              >
                <div className="flex items-center justify-end gap-1">
                  Win % {sortField === 'pct' && (sortOrder === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />)}
                </div>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate/5">
            {filteredData.map((team, idx) => (
              <tr key={team.id} className="group hover:bg-primary/[0.02] transition-colors">
                <td className="py-6 pl-2 font-mono text-sm text-slate/40">
                  {idx + 1}
                </td>
                <td className="py-6 pr-4">
                  <div className="flex flex-col">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-slate/5 flex items-center justify-center border border-slate/10 shrink-0 text-accent group-hover:scale-110 transition-transform">
                        <GameIcon game={team.game || team.team} size={24} />
                      </div>
                      <div className="flex flex-col">
                        <span className="font-sans font-bold text-lg text-primary group-hover:text-accent transition-colors truncate">
                          {team.team}
                        </span>
                        <span className="font-mono text-[10px] text-slate/40 uppercase tracking-widest font-bold">{team.game || 'Competitor'}</span>
                      </div>
                    </div>
                    {team.leagueRank && (
                      <div className="flex items-center gap-2 mt-2.5 ml-[52px]">
                        <span className="font-mono text-[10px] bg-red-500/10 text-red-600 px-2 py-0.5 rounded-md font-bold border border-red-500/10 animate-glide-in">
                          #{team.leagueRank}
                        </span>
                        <span className="font-sans text-[10px] text-slate/50 font-bold uppercase tracking-wider">
                          in {team.leagueName || 'Georgia / PlayVS'}
                        </span>
                      </div>
                    )}
                  </div>
                </td>
                <td className="py-6 px-4 text-center font-mono text-base font-bold text-green-600">
                  {team.wins}
                </td>
                <td className="py-6 px-4 text-center font-mono text-base font-bold text-red-500">
                  {team.losses}
                </td>
                <td className="py-6 pr-2 text-right">
                  <span className="font-mono text-base font-bold text-primary bg-primary/5 px-3 py-1.5 rounded-lg border border-slate/10 shadow-sm">
                    {team.pct}%
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        </div>
    </div>
  );
};
