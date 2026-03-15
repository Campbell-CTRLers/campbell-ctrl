import { forwardRef, useMemo, useState } from 'react';
import { IconX, IconTrash, IconCheck, IconMapPin } from '../icons/SvgIcons';
import { CustomAnimatedDatePicker, CustomTimePicker, CustomDropdown } from '../../ui/FormControls';
import AnimatedInput from '../../ui/AnimatedInput';
import RosterPill from './RosterPill';
import NumberStepper from './NumberStepper';
import { getRosterType } from './constants';
import { GAME_OPTIONS, TYPE_OPTIONS, LEAGUE_OPTIONS } from './constants';
import { cn } from '../../utils/cn';
import { buildGoogleMapsSearchUrl, buildMeetingLocationOptions } from '../../utils/locationUtils';

const DAY_OPTIONS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const parseClockToMinutes = (value) => {
  if (!value) return null;
  const m = String(value).trim().match(/^(\d{1,2})(?::(\d{2}))?\s*(AM|PM)?$/i);
  if (!m) return null;
  let h = Number(m[1]);
  const mm = Number(m[2] || 0);
  const suffix = String(m[3] || '').toUpperCase();
  if (suffix === 'PM' && h < 12) h += 12;
  if (suffix === 'AM' && h === 12) h = 0;
  return (h * 60) + mm;
};

const AdminControlSheet = forwardRef(({
  adminTab,
  activeControlId,
  activeControlItem,
  onClose,
  onRosterChange,
  onDelete,
  onConfirm,
  updateGame,
  updateStanding,
  updateRanking,
  updateMeeting,
  meetings = [],
  haptics,
}, ref) => {
  const [step, setStep] = useState('basics');
  const meetingLocationOptions = useMemo(() => buildMeetingLocationOptions(meetings), [meetings]);
  const sheetTitle = adminTab === 'meetings'
    ? (activeControlItem?.title || 'Meeting')
    : (activeControlItem?.game || activeControlItem?.opponent);

  const validation = useMemo(() => {
    if (!activeControlItem) return { notices: [], blocking: false };
    const notices = [];
    let blocking = false;
    if (adminTab === 'meetings') {
      if (!String(activeControlItem.title || '').trim()) notices.push('Meeting title is empty.');
      if (!Array.isArray(activeControlItem.days) || activeControlItem.days.length === 0) notices.push('No meeting days selected.');
      const start = parseClockToMinutes(activeControlItem.startTime || '3:30 PM');
      const end = parseClockToMinutes(activeControlItem.endTime || '5:30 PM');
      if (start != null && end != null && end <= start) {
        notices.push('End time should be after start time.');
        blocking = true;
      }
    }
    if (adminTab === 'schedule' && !String(activeControlItem.opponent || '').trim()) {
      notices.push('Opponent is empty.');
    }
    if (adminTab === 'rankings' && activeControlItem.leagueRank && !/^\d+$/.test(String(activeControlItem.leagueRank))) {
      notices.push('Ranking should be numeric.');
    }
    return { notices, blocking };
  }, [activeControlItem, adminTab]);

  if (!activeControlItem) return null;

  const toggleMeetingDay = (day) => {
    if (!updateMeeting) return;
    const days = Array.isArray(activeControlItem.days) ? [...activeControlItem.days] : [];
    const idx = days.indexOf(day);
    if (idx >= 0) days.splice(idx, 1);
    else days.push(day);
    days.sort((a, b) => DAY_OPTIONS.indexOf(a) - DAY_OPTIONS.indexOf(b));
    updateMeeting(activeControlId, 'days', days);
  };

  const openGoogleMapsLocationSelector = () => {
    const url = buildGoogleMapsSearchUrl(activeControlItem.location);
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div
      className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm flex items-end justify-center"
      onClick={onClose}
    >
      <div
        ref={ref}
        className="fixed inset-x-0 bottom-0 z-[120] bg-background border-t border-slate/15 rounded-t-[2.5rem] p-8 pb-[calc(3rem+env(safe-area-inset-bottom,0px))] shadow-[0_-15px_60px_rgba(0,0,0,0.5)] sm:hidden max-h-[95vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-12 h-1.5 bg-slate/10 rounded-full mx-auto shrink-0" />

        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <span className="font-mono text-[10px] text-accent font-black uppercase tracking-widest leading-none">Control Sheet</span>
            <h3 className="font-sans font-black text-2xl italic uppercase tracking-tighter leading-tight mt-1 truncate max-w-[240px]">
              {sheetTitle}
            </h3>
          </div>
          <button onClick={() => { haptics.light(); onClose(); }} className="w-10 h-10 rounded-2xl bg-slate/5 flex items-center justify-center text-slate">
            <IconX size={20} />
          </button>
        </div>

        <div className="mt-3 rounded-xl border border-slate/10 bg-slate/5 p-1.5 grid grid-cols-2 gap-1.5">
          <button onClick={() => setStep('basics')} className={cn('min-h-[36px] rounded-lg text-[10px] font-mono font-bold uppercase border', step === 'basics' ? 'border-accent bg-accent/10 text-accent' : 'border-transparent text-slate/50')}>Basics</button>
          <button onClick={() => setStep('advanced')} className={cn('min-h-[36px] rounded-lg text-[10px] font-mono font-bold uppercase border', step === 'advanced' ? 'border-accent bg-accent/10 text-accent' : 'border-transparent text-slate/50')}>Advanced</button>
        </div>

        {!!validation.notices.length && (
          <div className="mt-3 rounded-xl border border-amber-500/25 bg-amber-500/10 px-3 py-2">
            {validation.notices.map((notice) => (
              <p key={notice} className="text-[10px] font-mono uppercase tracking-wide text-amber-700">{notice}</p>
            ))}
          </div>
        )}

        <div className="flex flex-col gap-5 pt-3 pb-24">
          {adminTab === 'schedule' ? (
            <>
              {step === 'basics' && (
                <>
                <div className="flex flex-col gap-1.5">
                <label className="font-mono text-[9px] text-slate/40 uppercase pl-1">Target Game</label>
                <CustomDropdown value={activeControlItem.game} onChange={(v) => updateGame(activeControlId, 'game', v)} options={GAME_OPTIONS} placeholder="Game" isEditable />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="font-mono text-[9px] text-slate/40 uppercase pl-1">Rival / Opponent</label>
                <AnimatedInput value={activeControlItem.opponent} onChange={(e) => updateGame(activeControlId, 'opponent', e.target.value)} placeholder="Opponent Name" className="h-12 rounded-2xl bg-slate/5 border-none" mono={false} tracking="normal" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="font-mono text-[9px] text-slate/40 uppercase pl-1">Launch date</label>
                  <CustomAnimatedDatePicker value={activeControlItem.date} onChange={(v) => updateGame(activeControlId, 'date', v)} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="font-mono text-[9px] text-slate/40 uppercase pl-1">Time</label>
                  <CustomTimePicker value={activeControlItem.time} onChange={(v) => updateGame(activeControlId, 'time', v)} />
                </div>
              </div>
                </>
              )}
              {step === 'advanced' && (
                <div className="flex flex-col gap-1.5">
                <label className="font-mono text-[9px] text-slate/40 uppercase pl-1">Match Type</label>
                <CustomDropdown value={activeControlItem.type} onChange={(v) => updateGame(activeControlId, 'type', v)} options={TYPE_OPTIONS} placeholder="Type" isEditable />
              </div>
              )}
            </>
          ) : adminTab === 'standings' ? (
            <>
              {step === 'basics' && (
                <>
              <div className="flex flex-col gap-1.5">
                <label className="font-mono text-[9px] text-slate/40 uppercase pl-1">Team Identity (Game)</label>
                <CustomDropdown value={activeControlItem.game} onChange={(v) => updateStanding(activeControlId, 'game', v)} options={GAME_OPTIONS} placeholder="Game" isEditable />
              </div>
              <div className="grid grid-cols-2 gap-10 py-2">
                <NumberStepper label="Victories" color="green" value={activeControlItem.wins} onChange={(e) => updateStanding(activeControlId, 'wins', e.target.value)} />
                <NumberStepper label="Defeats" color="red" value={activeControlItem.losses} onChange={(e) => updateStanding(activeControlId, 'losses', e.target.value)} />
              </div>
                </>
              )}
            </>
          ) : adminTab === 'meetings' ? (
            <>
              {step === 'basics' && (
                <>
              <div className="flex flex-col gap-1.5">
                <label className="font-mono text-[9px] text-slate/40 uppercase pl-1">Title</label>
                <AnimatedInput value={activeControlItem.title} onChange={(e) => updateMeeting(activeControlId, 'title', e.target.value)} placeholder="Meeting title" className="h-12 rounded-2xl bg-slate/5 border-none" mono={false} tracking="normal" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="font-mono text-[9px] text-slate/40 uppercase pl-1">Days</label>
                <div className="flex flex-wrap gap-2">
                  {DAY_OPTIONS.map((d) => {
                    const active = Array.isArray(activeControlItem.days) && activeControlItem.days.includes(d);
                    return (
                      <button key={d} type="button" onClick={() => { haptics.light(); toggleMeetingDay(d); }} className={cn('px-4 py-2 rounded-xl border text-sm font-mono font-bold transition-all', active ? 'bg-accent border-accent text-white' : 'border-slate/20 text-slate/60')}>
                        {d}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="font-mono text-[9px] text-slate/40 uppercase pl-1">Start</label>
                  <CustomTimePicker value={activeControlItem.startTime || '3:30 PM'} onChange={(v) => updateMeeting(activeControlId, 'startTime', v)} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="font-mono text-[9px] text-slate/40 uppercase pl-1">End</label>
                  <CustomTimePicker value={activeControlItem.endTime || '5:30 PM'} onChange={(v) => updateMeeting(activeControlId, 'endTime', v)} />
                </div>
              </div>
                </>
              )}
              {step === 'advanced' && (
                <>
              <div className="flex flex-col gap-1.5">
                <label className="font-mono text-[9px] text-slate/40 uppercase pl-1">Location</label>
                <div className="grid grid-cols-[1fr_auto] gap-2">
                  <CustomDropdown
                    value={activeControlItem.location || ''}
                    onChange={(value) => updateMeeting(activeControlId, 'location', value)}
                    options={meetingLocationOptions}
                    placeholder="Location"
                    isEditable
                  />
                  <button
                    type="button"
                    onClick={() => { haptics.openPanel?.(); openGoogleMapsLocationSelector(); }}
                    className="h-12 px-3 rounded-xl border border-slate/15 bg-slate/5 text-slate/60 hover:text-accent hover:border-accent/30 transition-colors flex items-center justify-center"
                    aria-label="Open Google Maps location selector"
                  >
                    <IconMapPin size={16} />
                  </button>
                </div>
                <p className="font-mono text-[8px] text-slate/35 uppercase tracking-wide pl-1">
                  Pick from saved locations or search in Google Maps.
                </p>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="font-mono text-[9px] text-slate/40 uppercase pl-1">Description (optional)</label>
                <AnimatedInput value={activeControlItem.description} onChange={(e) => updateMeeting(activeControlId, 'description', e.target.value)} placeholder="Brief description" className="h-12 rounded-2xl bg-slate/5 border-none" mono={false} tracking="normal" />
              </div>
                </>
              )}
            </>
          ) : (
            <>
              {step === 'basics' && (
                <>
              <div className="flex flex-col gap-1.5">
                <label className="font-mono text-[9px] text-slate/40 uppercase pl-1">Game Selection</label>
                <CustomDropdown value={activeControlItem.game} onChange={(v) => updateRanking(activeControlId, 'game', v)} options={GAME_OPTIONS} placeholder="Game" isEditable />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="font-mono text-[9px] text-slate/40 uppercase pl-1">National / Regional Rank</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 font-sans font-black text-red-500 text-lg z-10 leading-none">#</span>
                  <AnimatedInput value={activeControlItem.leagueRank} onChange={(e) => updateRanking(activeControlId, 'leagueRank', e.target.value)} placeholder="1" className="pl-14 h-12 rounded-2xl bg-slate/5 border-none font-black text-lg focus:ring-0" />
                </div>
              </div>
                </>
              )}
              {step === 'advanced' && (
              <div className="flex flex-col gap-1.5">
                <label className="font-mono text-[9px] text-slate/40 uppercase pl-1">League Authority</label>
                <CustomDropdown value={activeControlItem.leagueName} onChange={(v) => updateRanking(activeControlId, 'leagueName', v)} options={LEAGUE_OPTIONS} placeholder="League" isEditable />
              </div>
              )}
            </>
          )}

          {adminTab !== 'meetings' && step === 'advanced' && (
          <div className="flex flex-col gap-2 mt-4 bg-slate/5 p-4 rounded-2xl border border-slate/10">
            <span className="font-sans font-black text-xs text-primary uppercase italic">Roster type</span>
            <span className="font-sans text-[9px] text-slate/40">Varsity, Alternate, or Alternate&apos;s alternate (DEL).</span>
            <div className="pt-1">
              <RosterPill
                value={getRosterType(activeControlItem)}
                onChange={(v) => {
                  haptics.selection();
                  onRosterChange(v);
                }}
                size="md"
              />
            </div>
          </div>
          )}

          <div className="sticky bottom-0 left-0 right-0 mt-4 -mx-1 px-1 py-2 bg-background/95 backdrop-blur-md border-t border-slate/10 grid grid-cols-2 gap-4">
            <button
              onClick={onDelete}
              className="flex-1 bg-red-500/5 text-red-500 border border-red-500/10 font-black py-4 rounded-2xl flex items-center justify-center gap-2 text-xs uppercase italic tracking-tighter"
            >
              <IconTrash size={16} /> Delete Record
            </button>
            <button disabled={validation.blocking} onClick={() => { haptics.success(); onConfirm(); }} className={cn("flex-1 bg-accent text-white font-black py-4 rounded-2xl flex items-center justify-center gap-2 text-xs uppercase italic tracking-tighter shadow-lg shadow-accent/20", validation.blocking && "opacity-50 cursor-not-allowed")}>
              <IconCheck size={18} /> Confirm
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});

AdminControlSheet.displayName = 'AdminControlSheet';

export default AdminControlSheet;
