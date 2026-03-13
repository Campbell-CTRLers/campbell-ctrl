import { Plus, Trash2, ChevronRight, RefreshCw } from 'lucide-react';
import { CustomDropdown } from '../../ui/FormControls';
import { GameIcon } from '../SharedUI';
import RosterPill from './RosterPill';
import NumberStepper from './NumberStepper';
import { GAME_OPTIONS } from './constants';
import { getRosterType } from './constants';

const AdminStandingsEditor = ({
  standings,
  onSync,
  onAddStanding,
  updateStanding,
  setStandingRoster,
  deleteStanding,
  setActiveControlId,
}) => (
  <div className="flex flex-col gap-4">
    <div className="flex items-center justify-between flex-wrap gap-2">
      <h3 className="font-sans font-black text-lg sm:text-2xl text-primary italic uppercase tracking-tighter">Live Standings</h3>
      <div className="flex items-center gap-2">
        <button onClick={onSync} className="text-slate bg-slate/10 px-3 py-2 rounded-xl text-[10px] font-mono font-black border border-slate/20 flex items-center gap-2 hover:bg-slate/20 hover:border-slate/30 transition-all" title="Add missing teams to the other list and remove orphans so Standings and Rankings stay in sync">
          <RefreshCw size={14} /> SYNC
        </button>
        <button onClick={onAddStanding} className="text-accent bg-accent/5 px-4 py-2 rounded-xl text-[10px] font-mono font-black border border-accent/20 flex items-center gap-2 hover:bg-accent hover:text-white transition-all">
          <Plus size={14} /> ADD TEAM
        </button>
      </div>
    </div>

    <div className="flex flex-col gap-3">
      {standings.map((s) => (
        <div
          key={s.id}
          onClick={() => window.innerWidth < 768 && setActiveControlId(s.id)}
          className="group flex items-center gap-4 bg-slate/5 p-4 rounded-3xl border border-slate/10 hover:border-accent/30 transition-all cursor-pointer sm:cursor-default"
        >
          <div className="flex items-center gap-4 flex-1">
            <div className="w-10 h-10 rounded-2xl bg-primary/5 flex items-center justify-center border border-slate/10 group-hover:scale-110 transition-transform overflow-hidden shrink-0">
              <GameIcon game={s.game} size={22} />
            </div>
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-sans font-black text-sm text-primary uppercase italic truncate">{s.game}</span>
                {s.isAlt && !s.isDel && <span className="bg-blue-500 text-white text-[8px] px-1 rounded-sm font-black leading-none py-0.5 shrink-0">ALT</span>}
                {s.isDel && <span className="bg-red-500 text-white text-[8px] px-1 rounded-sm font-black leading-none py-0.5 shrink-0">DEL</span>}
              </div>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-4 flex-[2]">
            <div className="flex-1 max-w-[280px]">
              <CustomDropdown value={s.game} onChange={(v) => updateStanding(s.id, 'game', v)} options={GAME_OPTIONS} placeholder="Game" isEditable />
            </div>
            <div className="flex items-center gap-4 ml-auto">
              <NumberStepper color="green" value={s.wins} onChange={(e) => updateStanding(s.id, 'wins', e.target.value)} />
              <NumberStepper color="red" value={s.losses} onChange={(e) => updateStanding(s.id, 'losses', e.target.value)} />
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0 ml-auto">
            <div className="hidden sm:flex items-center gap-2">
              <RosterPill value={getRosterType(s)} onChange={(v) => setStandingRoster(s.id, v)} size="sm" />
              <button onClick={(e) => { e.stopPropagation(); deleteStanding(s.id); }} className="p-2 text-slate/20 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all opacity-0 group-hover:opacity-100"><Trash2 size={16} /></button>
            </div>
            <div className="sm:hidden text-slate/30"><ChevronRight size={18} /></div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

export default AdminStandingsEditor;
