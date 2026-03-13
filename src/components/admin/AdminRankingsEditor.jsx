import { Plus, Trash2, ChevronRight, RefreshCw } from 'lucide-react';
import { CustomDropdown } from '../../ui/FormControls';
import AnimatedInput from '../../ui/AnimatedInput';
import { GameIcon } from '../SharedUI';
import RosterPill from './RosterPill';
import { GAME_OPTIONS, LEAGUE_OPTIONS } from './constants';
import { getRosterType } from './constants';

const AdminRankingsEditor = ({
  rankings,
  onSync,
  onAddRanking,
  updateRanking,
  setRankingRoster,
  deleteRanking,
  setActiveControlId,
}) => (
  <div className="flex flex-col gap-4">
    <div className="flex items-center justify-between flex-wrap gap-2">
      <h3 className="font-sans font-black text-lg sm:text-2xl text-primary italic uppercase tracking-tighter">Global Rankings</h3>
      <div className="flex items-center gap-2">
        <button onClick={onSync} className="text-slate bg-slate/10 px-3 py-2 rounded-xl text-[10px] font-mono font-black border border-slate/20 flex items-center gap-2 hover:bg-slate/20 hover:border-slate/30 transition-all" title="Add missing teams to the other list and remove orphans so Standings and Rankings stay in sync">
          <RefreshCw size={14} /> SYNC
        </button>
        <button onClick={onAddRanking} className="text-accent bg-accent/5 px-4 py-2 rounded-xl text-[10px] font-mono font-black border border-accent/20 flex items-center gap-2 hover:bg-accent hover:text-white transition-all">
          <Plus size={14} /> ADD TEAM
        </button>
      </div>
    </div>

    <div className="bg-slate/5 rounded-[2rem] border border-slate/10 overflow-hidden hidden sm:block">
      <table className="w-full text-left border-collapse">
        <thead className="bg-[#0b0c10]/40 border-b border-slate/10">
          <tr>
            <th className="p-4 w-12">&nbsp;</th>
            <th className="p-4 font-mono text-[9px] text-slate/40 uppercase tracking-[0.2em] italic">Game</th>
            <th className="p-4 font-mono text-[9px] text-slate/40 uppercase tracking-[0.2em] italic">Rank</th>
            <th className="p-4 font-mono text-[9px] text-slate/40 uppercase tracking-[0.2em] italic">League</th>
            <th className="p-4 text-center w-28">Roster</th>
            <th className="p-4 text-center">&nbsp;</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate/5">
          {rankings.map((s) => (
            <tr key={s.id} className="group hover:bg-primary/[0.02] transition-all">
              <td className="p-4 w-12">
                <div className="w-10 h-10 rounded-xl bg-primary/5 flex items-center justify-center border border-slate/10 overflow-hidden">
                  <GameIcon game={s.game} size={20} />
                </div>
              </td>
              <td className="p-4 min-w-[200px]">
                <div className="flex items-center gap-2">
                  <CustomDropdown value={s.game} onChange={(v) => updateRanking(s.id, 'game', v)} options={GAME_OPTIONS} placeholder="Game" isEditable />
                  {s.isAlt && !s.isDel && <span className="bg-blue-500 text-white text-[8px] px-1 rounded-sm font-black leading-none py-0.5 shrink-0">ALT</span>}
                  {s.isDel && <span className="bg-red-500 text-white text-[8px] px-1 rounded-sm font-black leading-none py-0.5 shrink-0">DEL</span>}
                </div>
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
              <td className="p-4 text-center">
                <RosterPill value={getRosterType(s)} onChange={(v) => setRankingRoster(s.id, v)} size="sm" />
              </td>
              <td className="p-4 w-16 text-right">
                <button onClick={() => deleteRanking(s.id)} className="p-2 text-slate/20 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all opacity-0 group-hover:opacity-100"><Trash2 size={16} /></button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>

    <div className="sm:hidden flex flex-col gap-4 pb-24">
      {rankings.map((s) => (
        <div key={s.id} onClick={() => setActiveControlId(s.id)} className="group flex items-center justify-between bg-slate/5 p-4 rounded-3xl border border-slate/10 active:bg-slate/10 transition-colors">
          <div className="flex items-center gap-4 flex-1 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-primary/5 flex items-center justify-center border border-slate/10 overflow-hidden shrink-0">
              <GameIcon game={s.game} size={22} />
            </div>
            <span className="font-sans font-black text-2xl text-red-500 min-w-[1.5rem] tracking-tighter">#{s.leagueRank || '--'}</span>
            <div className="flex flex-col min-w-0 gap-0.5">
              <div className="flex items-center gap-2">
                <span className="font-sans font-black text-sm text-primary italic uppercase leading-none truncate">{s.game}</span>
                {s.isAlt && !s.isDel && <span className="bg-blue-500 text-white text-[8px] px-1 rounded-sm font-black leading-none py-0.5 shrink-0">ALT</span>}
                {s.isDel && <span className="bg-red-500 text-white text-[8px] px-1 rounded-sm font-black leading-none py-0.5 shrink-0">DEL</span>}
              </div>
              <span className="font-mono text-[9px] text-slate/40 uppercase tracking-widest truncate">{s.leagueName}</span>
            </div>
          </div>
          <ChevronRight size={18} className="text-slate/30 shrink-0 ml-2" />
        </div>
      ))}
    </div>
  </div>
);

export default AdminRankingsEditor;
