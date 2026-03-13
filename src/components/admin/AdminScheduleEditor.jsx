import { Plus, Trash2, ChevronRight } from 'lucide-react';
import { CustomAnimatedDatePicker, CustomTimePicker, CustomDropdown } from '../../ui/FormControls';
import AnimatedInput from '../../ui/AnimatedInput';
import { GameIcon } from '../SharedUI';
import RosterPill from './RosterPill';
import { GAME_OPTIONS } from './constants';
import { getRosterType } from './constants';

const AdminScheduleEditor = ({
  gamesList,
  onAddGame,
  updateGame,
  setGameRoster,
  deleteGame,
  setActiveControlId,
}) => (
  <div className="flex flex-col gap-4">
    <div className="flex items-center justify-between">
      <h3 className="font-sans font-black text-lg sm:text-2xl text-primary italic uppercase tracking-tighter">Esports Schedule</h3>
      <button onClick={onAddGame} className="text-accent bg-accent/5 px-4 py-2 rounded-xl text-[10px] font-mono font-black border border-accent/20 flex items-center gap-2 hover:bg-accent hover:text-white transition-all">
        <Plus size={14} /> ADD EVENT
      </button>
    </div>

    <div className="grid grid-cols-1 gap-3">
      {gamesList.map((g) => (
        <div
          key={g.id}
          onClick={() => window.innerWidth < 768 && setActiveControlId(g.id)}
          className="group flex flex-wrap sm:flex-nowrap items-center gap-4 bg-slate/5 p-4 rounded-3xl border border-slate/10 hover:border-accent/30 transition-all cursor-pointer sm:cursor-default"
        >
          <div className="flex items-center gap-4 flex-1 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-primary/5 flex items-center justify-center border border-slate/10 shrink-0 group-hover:scale-110 transition-transform overflow-hidden">
              <GameIcon game={g.game} size={22} />
            </div>
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-sans font-black text-sm text-primary uppercase italic truncate">{g.game}</span>
                {g.isAlt && !g.isDel && <span className="bg-blue-500 text-white text-[8px] px-1 rounded-sm font-black leading-none py-0.5 shrink-0">ALT</span>}
                {g.isDel && <span className="bg-red-500 text-white text-[8px] px-1 rounded-sm font-black leading-none py-0.5 shrink-0">DEL</span>}
              </div>
              <span className="font-mono text-[9px] text-slate/40 tracking-widest uppercase truncate mt-0.5">VS {g.opponent}</span>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-3 flex-[2]">
            <div className="flex-1 max-w-[180px]">
              <CustomDropdown value={g.game} onChange={(v) => updateGame(g.id, 'game', v)} options={GAME_OPTIONS} placeholder="Game" isEditable />
            </div>
            <div className="flex-1 max-w-[150px]">
              <AnimatedInput value={g.opponent} onChange={(e) => updateGame(g.id, 'opponent', e.target.value)} placeholder="Opponent" className="h-10 rounded-xl pl-5" mono={false} tracking="normal" />
            </div>
            <div className="w-[160px]">
              <CustomAnimatedDatePicker value={g.date} onChange={(v) => updateGame(g.id, 'date', v)} />
            </div>
            <div className="w-[100px] min-w-[100px]">
              <CustomTimePicker value={g.time || '4:00 PM'} onChange={(v) => updateGame(g.id, 'time', v)} />
            </div>
          </div>

          <div className="flex items-center gap-3 ml-auto shrink-0">
            <div className="hidden sm:flex items-center gap-2">
              <RosterPill value={getRosterType(g)} onChange={(v) => setGameRoster(g.id, v)} size="sm" />
              <button onClick={(e) => { e.stopPropagation(); deleteGame(g.id); }} className="p-2 text-slate/20 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all opacity-0 group-hover:opacity-100"><Trash2 size={16} /></button>
            </div>
            <div className="sm:hidden text-slate/30"><ChevronRight size={18} /></div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

export default AdminScheduleEditor;
