import React from 'react';
import { IconPlus, IconTrash, IconChevronRight, IconMapPin } from '../icons/SvgIcons';
import { cn } from '../../utils/cn';
import { CustomTimePicker, CustomDropdown } from '../../ui/FormControls';
import AnimatedInput from '../../ui/AnimatedInput';
import { useHaptics } from '../../hooks/useHaptics';
import { buildGoogleMapsSearchUrl, buildMeetingLocationOptions } from '../../utils/locationUtils';

const DAY_OPTIONS = [
  { id: 'Mon', label: 'Mon' },
  { id: 'Tue', label: 'Tue' },
  { id: 'Wed', label: 'Wed' },
  { id: 'Thu', label: 'Thu' },
  { id: 'Fri', label: 'Fri' },
  { id: 'Sat', label: 'Sat' },
  { id: 'Sun', label: 'Sun' },
];

const AdminMeetingsEditor = ({
  meetings,
  onAddMeeting,
  updateMeeting,
  deleteMeeting,
  setActiveControlId,
  searchQuery = '',
}) => {
  const haptics = useHaptics();
  const query = String(searchQuery || '').trim().toLowerCase();
  const visibleMeetings = query
    ? meetings.filter((m) => `${m.title || ''} ${m.location || ''} ${Array.isArray(m.days) ? m.days.join(' ') : m.days || ''}`.toLowerCase().includes(query))
    : meetings;
  const locationOptions = buildMeetingLocationOptions(meetings);
  const locationOptionsKey = locationOptions.join('|');

  const toggleDay = (meetingId, dayId) => {
    haptics.light();
    const m = meetings.find((x) => x.id === meetingId);
    if (!m) return;
    const days = Array.isArray(m.days) ? [...m.days] : [];
    const idx = days.indexOf(dayId);
    if (idx >= 0) days.splice(idx, 1);
    else days.push(dayId);
    days.sort((a, b) => DAY_OPTIONS.findIndex((d) => d.id === a) - DAY_OPTIONS.findIndex((d) => d.id === b));
    updateMeeting(meetingId, 'days', days);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h3 className="font-sans font-black text-lg sm:text-2xl text-primary italic uppercase tracking-tighter">
          Club Meetings
        </h3>
        <button
          onClick={onAddMeeting}
          className="text-accent bg-accent/5 px-4 py-2 rounded-xl text-[10px] font-mono font-black border border-accent/20 flex items-center gap-2 hover:bg-accent hover:text-white transition-all"
        >
          <IconPlus size={14} /> ADD MEETING
        </button>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {visibleMeetings.map((m) => (
          <div
            key={m.id}
            onClick={() => window.innerWidth < 768 && setActiveControlId(m.id)}
            className="group flex flex-wrap sm:flex-nowrap items-center gap-4 bg-slate/5 p-4 rounded-3xl border border-slate/10 hover:border-accent/30 transition-all cursor-pointer sm:cursor-default"
          >
            <div className="flex items-center gap-4 flex-1 min-w-0">
              <div className="flex flex-col min-w-0">
                <span className="font-sans font-black text-sm text-primary truncate">
                  {m.title || 'Untitled Meeting'}
                </span>
                <span className="font-mono text-[9px] text-slate/40 tracking-widest uppercase truncate mt-0.5">
                  {Array.isArray(m.days) ? m.days.join(', ') : m.days || '—'} {m.startTime}–{m.endTime}
                </span>
              </div>
            </div>

            <div className="hidden sm:flex items-center gap-3 flex-[2] flex-wrap">
              <div className="flex-1 min-w-[140px] max-w-[200px]">
                <AnimatedInput
                  value={m.title}
                  onChange={(e) => updateMeeting(m.id, 'title', e.target.value)}
                  placeholder="Title"
                  className="h-10 rounded-xl pl-4"
                  mono={false}
                  tracking="normal"
                />
              </div>
              <div className="flex gap-1">
                {DAY_OPTIONS.map((d) => {
                  const active = Array.isArray(m.days) && m.days.includes(d.id);
                  return (
                    <button
                      key={d.id}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleDay(m.id, d.id);
                      }}
                      className={cn(
                        'w-8 h-8 rounded-lg border text-[10px] font-mono font-bold transition-all',
                        active
                          ? 'bg-accent border-accent text-white'
                          : 'border-slate/20 text-slate/50 hover:border-slate/40'
                      )}
                    >
                      {d.label.slice(0, 1)}
                    </button>
                  );
                })}
              </div>
              <div className="w-[90px]">
                <CustomTimePicker
                  value={m.startTime || '3:30 PM'}
                  onChange={(v) => updateMeeting(m.id, 'startTime', v)}
                />
              </div>
              <div className="w-[90px]">
                <CustomTimePicker
                  value={m.endTime || '5:30 PM'}
                  onChange={(v) => updateMeeting(m.id, 'endTime', v)}
                />
              </div>
              <div className="flex-1 min-w-[120px] max-w-[180px]">
                <div className="flex items-center gap-2">
                  <CustomDropdown
                    key={`meeting-location-${m.id}-${locationOptionsKey}`}
                    value={m.location || ''}
                    onChange={(value) => updateMeeting(m.id, 'location', value)}
                    options={locationOptions}
                    placeholder="Location"
                    isEditable
                  />
                  <button
                    type="button"
                    onClick={() => {
                      haptics.openPanel?.();
                      window.open(buildGoogleMapsSearchUrl(m.location), '_blank', 'noopener,noreferrer');
                    }}
                    className="w-10 h-10 rounded-xl border border-slate/15 bg-slate/5 text-slate/60 hover:text-accent hover:border-accent/30 transition-colors flex items-center justify-center"
                    aria-label="Open Google Maps location selector"
                  >
                    <IconMapPin size={16} />
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 ml-auto shrink-0">
              <div className="hidden sm:flex items-center gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteMeeting(m.id);
                  }}
                  className="p-2 text-slate/20 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                >
                  <IconTrash size={16} />
                </button>
              </div>
              <div className="sm:hidden text-slate/30">
                <IconChevronRight size={18} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminMeetingsEditor;
