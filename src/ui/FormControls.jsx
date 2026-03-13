import React, { useState, useRef, useEffect, useCallback } from 'react';
import ReactDOM from 'react-dom';
import { Clock } from 'lucide-react';
import { IconCalendar, IconChevronLeft, IconChevronRight, IconChevronDown } from '../components/icons/SvgIcons';
import { cn } from '../utils/cn';
import { useHaptics } from '../hooks/useHaptics';
import AnimatedInput from './AnimatedInput';

// ----------------------------------------------------
// PORTAL DROPDOWN — renders outside overflow containers
// ----------------------------------------------------
const DropdownPortal = ({ children, anchorRef, isOpen, onClose, minWidth }) => {
  const [pos, setPos] = useState({ top: 0, left: 0, width: 0 });
  const portalRef = useRef(null);

  const reposition = useCallback(() => {
    if (anchorRef.current && isOpen) {
      const rect = anchorRef.current.getBoundingClientRect();
      const vw = window.innerWidth;
      const dropW = Math.max(minWidth || rect.width, rect.width);
      const spaceRight = vw - rect.left;
      const left = spaceRight < dropW ? Math.max(8, rect.right - dropW) : rect.left;
      setPos({
        top: rect.bottom + window.scrollY + 6,
        left: left + window.scrollX,
        width: dropW,
      });
    }
  }, [anchorRef, isOpen, minWidth]);

  useEffect(() => { reposition(); }, [isOpen, reposition]);

  useEffect(() => {
    if (!isOpen) return;
    window.addEventListener('scroll', reposition, true);
    window.addEventListener('resize', reposition);
    return () => {
      window.removeEventListener('scroll', reposition, true);
      window.removeEventListener('resize', reposition);
    };
  }, [isOpen, reposition]);

  useEffect(() => {
    if (!isOpen) return;
    const handleClick = (e) => {
      if (portalRef.current && !portalRef.current.contains(e.target) &&
          anchorRef.current && !anchorRef.current.contains(e.target)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [isOpen, onClose, anchorRef]);

  if (!isOpen) return null;

  return ReactDOM.createPortal(
    <div
      ref={portalRef}
      style={{ position: 'absolute', top: pos.top, left: pos.left, width: pos.width, zIndex: 9999 }}
    >
      {children}
    </div>,
    document.body
  );
};

// ----------------------------------------------------
// CUSTOM DATE PICKER
// ----------------------------------------------------
export const CustomAnimatedDatePicker = ({ value, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);
  const haptics = useHaptics();
  const realToday = new Date();

  const [currentDate, setCurrentDate] = useState(() => {
    const d = value ? new Date(value + 'T00:00:00') : new Date();
    return d.toString() === 'Invalid Date' ? new Date() : d;
  });

  const displayDate = value ? new Date(value + 'T00:00:00') : null;
  const isValidDisplayDate = displayDate && displayDate.toString() !== 'Invalid Date';
  const formattedDisplay = isValidDisplayDate
    ? displayDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : 'Add Date';

  const openCalendar = () => {
    if (isOpen) { setIsOpen(false); return; }
    haptics.selection();
    setIsOpen(true);
  };

  const selectDate = (day, specificDate = null) => {
    const targetDate = specificDate || currentDate;
    const newDateStr = `${targetDate.getFullYear()}-${String(targetDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    onChange(newDateStr);
    setIsOpen(false);
  };

  const goToToday = (e) => {
    e.stopPropagation();
    haptics.light();
    setCurrentDate(new Date());
    selectDate(realToday.getDate(), new Date());
  };

  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const getFirstDayOfMonth = () => {
    const day = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
    return day === 0 ? 6 : day - 1;
  };
  const firstDayOfMonth = getFirstDayOfMonth();
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const prevMonth = (e) => { e.stopPropagation(); setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1)); };
  const nextMonth = (e) => { e.stopPropagation(); setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1)); };

  return (
    <div className="relative flex-1" ref={containerRef}>
      <button
        type="button"
        onClick={openCalendar}
        className={cn(
          "w-full bg-background border rounded-xl px-3 py-2 font-mono text-xs outline-none flex items-center justify-between transition-colors touch-manipulation active:scale-[0.98]",
          isOpen ? "border-accent text-primary" : "border-slate/20 hover:border-slate/50 text-slate",
          !isValidDisplayDate && "text-slate/60 italic"
        )}
      >
        <span>{formattedDisplay}</span>
        <IconCalendar size={14} className={isOpen ? "text-accent" : "text-slate"} />
      </button>

      <DropdownPortal anchorRef={containerRef} isOpen={isOpen} onClose={() => setIsOpen(false)} minWidth={288}>
        <div className="w-72 bg-background border border-slate/20 rounded-2xl shadow-2xl p-4">
          <div className="flex items-center justify-between mb-4">
            <button type="button" onClick={(e) => { haptics.selection(); prevMonth(e); }} className="p-1 hover:bg-slate/10 rounded-full transition-colors touch-manipulation"><IconChevronLeft size={16} /></button>
            <div className="flex flex-col items-center">
              <span className="font-sans font-bold text-sm text-primary leading-tight">
                {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
              </span>
              <button type="button" onClick={goToToday} className="text-[10px] font-mono text-blue-500 hover:text-blue-400 mt-0.5 transition-colors">
                Go to Today
              </button>
            </div>
            <button type="button" onClick={(e) => { haptics.selection(); nextMonth(e); }} className="p-1 hover:bg-slate/10 rounded-full transition-colors touch-manipulation"><IconChevronRight size={16} /></button>
          </div>
          <div className="grid grid-cols-7 gap-1 mb-2">
            {['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'].map(d => (
              <div key={d} className="text-center font-mono text-[10px] text-slate/60 font-medium">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {Array(firstDayOfMonth).fill(null).map((_, i) => <div key={`e-${i}`} />)}
            {Array(daysInMonth).fill(null).map((_, i) => {
              const day = i + 1;
              const isSelected = isValidDisplayDate && displayDate.getDate() === day && displayDate.getMonth() === currentDate.getMonth() && displayDate.getFullYear() === currentDate.getFullYear();
              const isToday = realToday.getDate() === day && realToday.getMonth() === currentDate.getMonth() && realToday.getFullYear() === currentDate.getFullYear();
              return (
                <button key={day} type="button" onClick={() => { haptics.light(); selectDate(day); }}
                  className={cn("h-8 rounded-lg flex items-center justify-center font-mono text-xs transition-all",
                    isSelected ? "bg-accent text-background font-bold shadow-md scale-110 z-10" : "hover:bg-slate/10 text-primary",
                    isToday && !isSelected && "text-blue-500 font-bold border border-blue-500/30"
                  )}
                >
                  {day}
                </button>
              );
            })}
          </div>
        </div>
      </DropdownPortal>
    </div>
  );
};

// ----------------------------------------------------
// CUSTOM TIME PICKER
// ----------------------------------------------------
export const CustomTimePicker = ({ value, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);
  const haptics = useHaptics();

  const parseTime = (val) => {
    if (!val) return { hour: 4, minute: 0, period: 'PM' };
    const match = val.match(/^(\d{1,2}):(\d{2})\s?(AM|PM)$/i);
    if (match) return { hour: parseInt(match[1]), minute: parseInt(match[2]), period: match[3].toUpperCase() };
    return { hour: 4, minute: 0, period: 'PM' };
  };

  const [selectedHour, setSelectedHour] = useState(() => parseTime(value).hour);
  const [selectedMinute, setSelectedMinute] = useState(() => parseTime(value).minute);
  const [selectedPeriod, setSelectedPeriod] = useState(() => parseTime(value).period);

  const commitTime = (h, m, p) => {
    const displayM = m < 10 ? `0${m}` : `${m}`;
    onChange(`${h}:${displayM} ${p}`);
  };

  const openPicker = () => {
    if (isOpen) { setIsOpen(false); return; }
    haptics.selection();
    setIsOpen(true);
    const parsed = parseTime(value);
    setSelectedHour(parsed.hour);
    setSelectedMinute(parsed.minute);
    setSelectedPeriod(parsed.period);
  };

  const selectHour = (h) => { setSelectedHour(h); commitTime(h, selectedMinute, selectedPeriod); };
  const selectMinute = (m) => { setSelectedMinute(m); commitTime(selectedHour, m, selectedPeriod); };
  const togglePeriod = (explicit) => {
    const newP = explicit || (selectedPeriod === 'AM' ? 'PM' : 'AM');
    setSelectedPeriod(newP);
    commitTime(selectedHour, selectedMinute, newP);
  };

  const hours = Array.from({ length: 12 }, (_, i) => i + 1);
  const minutes = [0, 15, 30, 45];

  return (
    <div className="relative flex-1" ref={containerRef}>
      <button
        type="button"
        onClick={openPicker}
        className={cn(
          "w-full bg-background border rounded-xl px-3 py-2 font-mono text-xs outline-none flex items-center justify-between gap-2 transition-colors touch-manipulation active:scale-[0.98]",
          isOpen ? "border-accent text-primary" : "border-slate/20 hover:border-slate/50 text-slate",
          !value && "text-slate/60 italic"
        )}
      >
        <span>{value || '4:00 PM'}</span>
        <Clock size={14} className={isOpen ? "text-accent" : "text-slate"} />
      </button>

      <DropdownPortal anchorRef={containerRef} isOpen={isOpen} onClose={() => setIsOpen(false)} minWidth={220}>
        <div className="w-[220px] bg-background border border-slate/20 rounded-xl shadow-2xl p-3">
          <div className="flex items-center justify-between mb-2 pb-2 border-b border-slate/10">
            <span className="font-mono text-[10px] uppercase tracking-widest text-slate/50">Select Time</span>
            <button type="button"
              onClick={() => { haptics.success(); commitTime(4, 0, 'PM'); setSelectedHour(4); setSelectedMinute(0); setSelectedPeriod('PM'); }}
              className="px-2 py-0.5 bg-accent/10 hover:bg-accent/20 text-accent rounded-md font-mono text-[10px] font-bold transition-colors"
            >4:00 PM</button>
          </div>
          <div className="flex gap-2">
            <div className="flex-1">
              <div className="text-center font-mono text-[10px] uppercase tracking-wider text-slate/40 mb-1">Hr</div>
              <div className="max-h-[160px] overflow-y-auto custom-scrollbar flex flex-col gap-0.5">
                {hours.map(h => (
                  <button key={h} type="button" onClick={() => { haptics.light(); selectHour(h); }}
                    className={cn("w-full py-1.5 text-center font-mono text-sm rounded-lg transition-colors",
                      selectedHour === h ? "bg-accent/10 text-accent font-bold" : "text-primary hover:bg-slate/5"
                    )}
                  >{h}</button>
                ))}
              </div>
            </div>
            <div className="flex items-center"><span className="font-mono text-lg text-slate/30 font-bold">:</span></div>
            <div className="flex-1">
              <div className="text-center font-mono text-[10px] uppercase tracking-wider text-slate/40 mb-1">Min</div>
              <div className="flex flex-col gap-0.5">
                {minutes.map(m => (
                  <button key={m} type="button" onClick={() => { haptics.light(); selectMinute(m); }}
                    className={cn("w-full py-1.5 text-center font-mono text-sm rounded-lg transition-colors",
                      selectedMinute === m ? "bg-accent/10 text-accent font-bold" : "text-primary hover:bg-slate/5"
                    )}
                  >{m < 10 ? `0${m}` : m}</button>
                ))}
              </div>
            </div>
            <div className="flex flex-col items-center justify-center gap-1 ml-1">
              <div className="text-[10px] mb-1">&nbsp;</div>
              <button type="button" onClick={() => { haptics.selection(); togglePeriod('AM'); }}
                className={cn("px-2 py-1.5 rounded-lg font-mono text-xs font-bold transition-colors touch-manipulation active:scale-95",
                  selectedPeriod === 'AM' ? "bg-accent/10 text-accent" : "text-slate/40 hover:bg-slate/5"
                )}
              >AM</button>
              <button type="button" onClick={() => { haptics.selection(); togglePeriod('PM'); }}
                className={cn("px-2 py-1.5 rounded-lg font-mono text-xs font-bold transition-colors touch-manipulation active:scale-95",
                  selectedPeriod === 'PM' ? "bg-accent/10 text-accent" : "text-slate/40 hover:bg-slate/5"
                )}
              >PM</button>
            </div>
          </div>
        </div>
      </DropdownPortal>
    </div>
  );
};

// ----------------------------------------------------
// CUSTOM DROPDOWN (GAMES & MATCH TYPES)
// ----------------------------------------------------
export const CustomDropdown = ({ value, onChange, options, placeholder, isEditable = false }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [customValue, setCustomValue] = useState("");
  const containerRef = useRef(null);
  // Lazy initializer: merges any user-saved presets from localStorage into the
  // initial options list. The initializer runs only once at mount, which is
  // intentional — `options` and `placeholder` are always module-level constants
  // (GAME_OPTIONS, LEAGUE_OPTIONS…) and never change between renders. If they
  // did change, the parent should remount this component with a new `key`.
  const [currentOptions, setCurrentOptions] = useState(() => {
    try {
      const saved = localStorage.getItem(`custom_presets_${placeholder}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        return [...new Set([...options.filter(o => o !== "OTHER"), ...parsed, "OTHER"])];
      }
    } catch (e) { console.error("Failed to parse presets", e); }
    return options;
  });
  const haptics = useHaptics();

  const openDropdown = () => {
    if (isOpen) { setIsOpen(false); return; }
    haptics.selection();
    setIsOpen(true);
  };

  const selectOption = (opt) => {
    haptics.light();
    onChange(opt);
    if (opt !== "OTHER") setIsOpen(false);
  };

  const handleCustomSubmit = (e) => {
    e.preventDefault();
    if (customValue.trim()) {
      const newVal = customValue.trim();
      const newPresets = [...currentOptions.filter(o => o !== "OTHER" && !options.includes(o)), newVal];
      const merged = [...new Set([...options.filter(o => o !== "OTHER"), ...newPresets, "OTHER"])];
      setCurrentOptions(merged);
      localStorage.setItem(`custom_presets_${placeholder}`, JSON.stringify(newPresets));
      onChange(newVal);
      setCustomValue("");
      haptics.success();
      setIsOpen(false);
    }
  };

  const displayValue = value === "OTHER" ? "Custom..." : value;

  return (
    <div className="relative flex-1 min-w-0" ref={containerRef}>
      <button
        type="button"
        onClick={openDropdown}
        className={cn(
          "w-full bg-background border rounded-xl px-3 py-2 font-mono text-xs outline-none flex items-center justify-between transition-colors",
          isOpen ? "border-accent text-primary" : "border-slate/20 hover:border-slate/50 text-slate",
          !value && "text-slate/60 italic"
        )}
      >
        <span className="truncate pr-2">{displayValue || placeholder}</span>
        <IconChevronDown size={14} className={isOpen ? "text-accent rotate-180 transition-transform duration-300" : "text-slate transition-transform duration-300"} />
      </button>

      <DropdownPortal anchorRef={containerRef} isOpen={isOpen} onClose={() => setIsOpen(false)} minWidth={200}>
        <div className="bg-background border border-slate/20 rounded-xl shadow-2xl p-2">
          <div className="flex flex-col gap-1 max-h-[240px] overflow-y-auto custom-scrollbar">
            {currentOptions.map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => selectOption(opt)}
                className={cn(
                  "px-3 py-2 text-left font-mono text-xs rounded-lg transition-colors border whitespace-nowrap",
                  value === opt && opt !== "OTHER"
                    ? "bg-accent/10 border-accent/20 text-accent font-bold"
                    : opt === "OTHER"
                      ? "bg-slate/5 border-transparent text-slate-400 mt-2 font-bold hover:bg-slate/10 hover:text-primary"
                      : "bg-transparent border-transparent text-primary hover:bg-slate/5"
                )}
              >
                {opt}
              </button>
            ))}
          </div>
          {isEditable && currentOptions.includes("OTHER") && (
            <div className="mt-3 pt-3 border-t border-slate/10">
              <form onSubmit={handleCustomSubmit} className="flex flex-col gap-2">
                <AnimatedInput
                  value={customValue}
                  onChange={(e) => setCustomValue(e.target.value)}
                  placeholder={`Custom ${placeholder}...`}
                  className="border border-slate/20 w-full h-9 rounded-xl text-sm"
                  mono={false}
                  tracking="normal"
                />
                <button
                  type="submit"
                  disabled={!customValue.trim()}
                  className="w-full bg-accent disabled:opacity-40 text-white py-2 rounded-xl text-xs font-mono font-bold shadow-lg shadow-accent/20 active:scale-95 transition-all"
                >
                  Save as Preset
                </button>
              </form>
            </div>
          )}
        </div>
      </DropdownPortal>
    </div>
  );
};
