import React, { useState, useRef, useEffect } from 'react';
import { Calendar, Clock, ChevronLeft, ChevronRight, ChevronDown, Plus } from 'lucide-react';
import gsap from 'gsap';
import { cn } from '../utils/cn';
import { useHaptics } from '../hooks/useHaptics';

// ----------------------------------------------------
// CUSTOM DATE PICKER
// ----------------------------------------------------
export const CustomAnimatedDatePicker = ({ value, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);
  const dropdownRef = useRef(null);
  const haptics = useHaptics();

  const realToday = new Date();

  // Parse YYYY-MM-DD
  const [currentDate, setCurrentDate] = useState(() => {
    const d = value ? new Date(value + 'T00:00:00') : new Date();
    return d.toString() === 'Invalid Date' ? new Date() : d;
  });

  const displayDate = value ? new Date(value + 'T00:00:00') : null;
  const isValidDisplayDate = displayDate && displayDate.toString() !== 'Invalid Date';

  // Format for button
  const formattedDisplay = isValidDisplayDate
    ? displayDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : 'Add Date';

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const openCalendar = () => {
    if (isOpen) {
      setIsOpen(false);
      return;
    }
    haptics.selection();
    setIsOpen(true);
    // Slight delay to allow DOM to render
    setTimeout(() => {
      if (dropdownRef.current) {
        gsap.fromTo(dropdownRef.current,
          { y: 15, opacity: 0, scale: 0.95 },
          { y: 0, opacity: 1, scale: 1, duration: 0.3, ease: 'back.out(1.5)' }
        );
      }
    }, 10);
  };

  const selectDate = (day, specificDate = null) => {
    const targetDate = specificDate || currentDate;
    const newDateStr = `${targetDate.getFullYear()}-${String(targetDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    onChange(newDateStr);

    // Close animation
    if (dropdownRef.current) {
      gsap.to(dropdownRef.current, {
        y: 10, opacity: 0, scale: 0.95, duration: 0.2, ease: 'power2.in', onComplete: () => setIsOpen(false)
      });
    } else {
      setIsOpen(false);
    }
  };

  const goToToday = (e) => {
    e.stopPropagation();
    haptics.light();
    setCurrentDate(new Date());
    selectDate(realToday.getDate(), realToday);
  };

  // Calendar logic
  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  const prevMonth = (e) => {
    e.stopPropagation();
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };
  const nextMonth = (e) => {
    e.stopPropagation();
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  return (
    <div className="relative w-1/2" ref={containerRef}>
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
        <Calendar size={14} className={isOpen ? "text-accent" : "text-slate"} />
      </button>

      {isOpen && (
        <div
          ref={dropdownRef}
          className="absolute z-50 top-full mt-2 w-64 bg-background border border-slate/20 rounded-2xl shadow-2xl p-4 overflow-hidden origin-top-left"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <button type="button" onClick={(e) => { haptics.selection(); prevMonth(e); }} className="p-1 hover:bg-slate/10 rounded-full transition-colors touch-manipulation"><ChevronLeft size={16} /></button>
            <div className="flex flex-col items-center">
              <span className="font-sans font-bold text-sm text-primary leading-tight">
                {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
              </span>
              <button
                type="button"
                onClick={goToToday}
                className="text-[10px] font-mono text-blue-500 hover:text-blue-400 mt-0.5 transition-colors"
              >
                Go to Today
              </button>
            </div>
            <button type="button" onClick={(e) => { haptics.selection(); nextMonth(e); }} className="p-1 hover:bg-slate/10 rounded-full transition-colors touch-manipulation"><ChevronRight size={16} /></button>
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
              <div key={d} className="text-center font-mono text-[10px] text-slate/60 font-medium">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {Array(firstDayOfMonth).fill(null).map((_, i) => (
              <div key={`empty-${i}`} />
            ))}
            {Array(daysInMonth).fill(null).map((_, i) => {
              const day = i + 1;
              const isSelected = isValidDisplayDate && displayDate.getDate() === day && displayDate.getMonth() === currentDate.getMonth() && displayDate.getFullYear() === currentDate.getFullYear();
              const isToday = realToday.getDate() === day && realToday.getMonth() === currentDate.getMonth() && realToday.getFullYear() === currentDate.getFullYear();

              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => { haptics.light(); selectDate(day); }}
                  className={cn(
                    "h-8 rounded-lg flex items-center justify-center font-mono text-xs transition-all relative overflow-hidden",
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
      )}
    </div>
  );
};

// ----------------------------------------------------
// CUSTOM TIME PICKER
// ----------------------------------------------------
export const CustomTimePicker = ({ value, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);
  const dropdownRef = useRef(null);
  const haptics = useHaptics();

  // Parse current value into components
  const parseTime = (val) => {
    if (!val) return { hour: 12, minute: 0, period: 'PM' };
    const match = val.match(/^(\d{1,2}):(\d{2})\s?(AM|PM)$/i);
    if (match) return { hour: parseInt(match[1]), minute: parseInt(match[2]), period: match[3].toUpperCase() };
    return { hour: 12, minute: 0, period: 'PM' };
  };

  const [selectedHour, setSelectedHour] = useState(() => parseTime(value).hour);
  const [selectedMinute, setSelectedMinute] = useState(() => parseTime(value).minute);
  const [selectedPeriod, setSelectedPeriod] = useState(() => parseTime(value).period);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const commitTime = (h, m, p) => {
    const displayM = m < 10 ? `0${m}` : `${m}`;
    onChange(`${h}:${displayM} ${p}`);
  };

  const openPicker = () => {
    if (isOpen) { setIsOpen(false); return; }
    haptics.selection();
    setIsOpen(true);
    // Sync state with value on open
    const parsed = parseTime(value);
    setSelectedHour(parsed.hour);
    setSelectedMinute(parsed.minute);
    setSelectedPeriod(parsed.period);

    setTimeout(() => {
      if (dropdownRef.current) {
        gsap.fromTo(dropdownRef.current,
          { y: 15, opacity: 0, scale: 0.95 },
          { y: 0, opacity: 1, scale: 1, duration: 0.3, ease: 'back.out(1.5)' }
        );
      }
    }, 10);
  };

  const selectHour = (h) => { setSelectedHour(h); commitTime(h, selectedMinute, selectedPeriod); };
  const selectMinute = (m) => { setSelectedMinute(m); commitTime(selectedHour, m, selectedPeriod); };
  const togglePeriod = () => {
    const newP = selectedPeriod === 'AM' ? 'PM' : 'AM';
    setSelectedPeriod(newP);
    commitTime(selectedHour, selectedMinute, newP);
  };

  const hours = Array.from({ length: 12 }, (_, i) => i + 1);
  const minutes = [0, 15, 30, 45];

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={openPicker}
        className={cn(
          "w-full bg-background border rounded-xl px-3 py-2 font-mono text-xs outline-none flex items-center justify-between gap-2 transition-colors touch-manipulation active:scale-[0.98]",
          isOpen ? "border-accent text-primary" : "border-slate/20 hover:border-slate/50 text-slate",
          !value && "text-slate/60 italic"
        )}
      >
        <span>{value || 'Time'}</span>
        <Clock size={14} className={isOpen ? "text-accent" : "text-slate"} />
      </button>

      {isOpen && (
        <div
          ref={dropdownRef}
          className="absolute z-50 top-full mt-2 w-[220px] bg-background border border-slate/20 rounded-xl shadow-2xl p-3 origin-top"
          style={{ right: 0 }}
        >
          {/* Header */}
          <div className="text-center font-mono text-[10px] uppercase tracking-widest text-slate/50 mb-2 pb-2 border-b border-slate/10">Select Time</div>

          <div className="flex gap-2">
            {/* Hour Column */}
            <div className="flex-1">
              <div className="text-center font-mono text-[10px] uppercase tracking-wider text-slate/40 mb-1">Hr</div>
              <div className="max-h-[160px] overflow-y-auto custom-scrollbar flex flex-col gap-0.5">
                {hours.map(h => (
                  <button
                    key={h}
                    type="button"
                    onClick={() => { haptics.light(); selectHour(h); }}
                    className={cn(
                      "w-full py-1.5 text-center font-mono text-sm rounded-lg transition-colors",
                      selectedHour === h
                        ? "bg-accent/10 text-accent font-bold"
                        : "text-primary hover:bg-slate/5"
                    )}
                  >
                    {h}
                  </button>
                ))}
              </div>
            </div>

            {/* Divider */}
            <div className="flex items-center">
              <span className="font-mono text-lg text-slate/30 font-bold">:</span>
            </div>

            {/* Minute Column */}
            <div className="flex-1">
              <div className="text-center font-mono text-[10px] uppercase tracking-wider text-slate/40 mb-1">Min</div>
              <div className="flex flex-col gap-0.5">
                {minutes.map(m => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => { haptics.light(); selectMinute(m); }}
                    className={cn(
                      "w-full py-1.5 text-center font-mono text-sm rounded-lg transition-colors",
                      selectedMinute === m
                        ? "bg-accent/10 text-accent font-bold"
                        : "text-primary hover:bg-slate/5"
                    )}
                  >
                    {m < 10 ? `0${m}` : m}
                  </button>
                ))}
              </div>
            </div>

            {/* AM/PM Toggle */}
            <div className="flex flex-col items-center justify-center gap-1 ml-1">
              <div className="text-center font-mono text-[10px] uppercase tracking-wider text-slate/40 mb-1">&nbsp;</div>
              <button
                type="button"
                onClick={() => { haptics.selection(); togglePeriod(); }}
                className={cn(
                  "px-2 py-1.5 rounded-lg font-mono text-xs font-bold transition-colors touch-manipulation active:scale-95",
                  selectedPeriod === 'AM' ? "bg-accent/10 text-accent" : "text-slate/40 hover:bg-slate/5"
                )}
              >AM</button>
              <button
                type="button"
                onClick={() => { haptics.selection(); togglePeriod(); }}
                className={cn(
                  "px-2 py-1.5 rounded-lg font-mono text-xs font-bold transition-colors touch-manipulation active:scale-95",
                  selectedPeriod === 'PM' ? "bg-accent/10 text-accent" : "text-slate/40 hover:bg-slate/5"
                )}
              >PM</button>
            </div>
          </div>
        </div>
      )}
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
  const dropdownRef = useRef(null);

  // Dynamic options state to allow adding presets
  const [currentOptions, setCurrentOptions] = useState(options);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
        // Reset custom input if closed without saving
        if (value !== "OTHER") setCustomValue("");
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [value]);

  const openDropdown = () => {
    if (isOpen) {
      setIsOpen(false);
      return;
    }
    setIsOpen(true);
    setTimeout(() => {
      if (dropdownRef.current) {
        gsap.fromTo(dropdownRef.current,
          { y: 15, opacity: 0, scale: 0.95 },
          { y: 0, opacity: 1, scale: 1, duration: 0.3, ease: 'back.out(1.5)' }
        );
      }
    }, 10);
  };

  const selectOption = (opt) => {
    onChange(opt);
    if (opt !== "OTHER") {
      closeDropdown();
    } else {
      setTimeout(() => {
        const input = document.getElementById(`custom-input-${placeholder}`);
        if (input) input.focus();
      }, 50);
    }
  };

  const closeDropdown = () => {
    if (dropdownRef.current) {
      gsap.to(dropdownRef.current, {
        y: 10, opacity: 0, scale: 0.95, duration: 0.2, ease: 'power2.in', onComplete: () => setIsOpen(false)
      });
    } else {
      setIsOpen(false);
    }
  };

  const handleCustomSubmit = (e) => {
    e.preventDefault();
    if (customValue.trim()) {
      const newVal = customValue.trim();
      setCurrentOptions([...currentOptions.filter(o => o !== "OTHER"), newVal, "OTHER"]);
      onChange(newVal);
      setCustomValue("");
      closeDropdown();
    }
  };

  const displayValue = value === "OTHER" ? "Custom..." : value;

  return (
    <div className="relative flex-1" ref={containerRef}>
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
        <ChevronDown size={14} className={isOpen ? "text-accent rotate-180 transition-transform duration-300" : "text-slate transition-transform duration-300"} />
      </button>

      {isOpen && (
        <div
          ref={dropdownRef}
          className="absolute z-50 top-full mt-2 w-full min-w-[160px] max-h-[240px] overflow-y-auto custom-scrollbar bg-background border border-slate/20 rounded-xl shadow-2xl p-2 origin-top"
        >
          <div className="flex flex-col gap-1">
            {currentOptions.map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => selectOption(opt)}
                className={cn(
                  "px-3 py-2 text-left font-mono text-xs rounded-lg transition-colors border",
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

            {value === "OTHER" && isEditable && (
              <form onSubmit={handleCustomSubmit} className="mt-2 p-2 bg-slate/5 rounded-lg border border-slate/10 animate-in fade-in zoom-in duration-200">
                <p className="font-mono text-[10px] text-slate/60 mb-1 uppercase tracking-wider">Custom Entry</p>
                <div className="flex gap-2">
                  <input
                    id={`custom-input-${placeholder}`}
                    type="text"
                    value={customValue}
                    onChange={(e) => setCustomValue(e.target.value)}
                    placeholder="Type name..."
                    className="w-full bg-background border border-slate/20 rounded px-2 py-1.5 font-sans text-xs outline-none focus:border-accent"
                  />
                  <button type="submit" className="bg-accent text-background p-1.5 rounded hover:scale-105 transition-transform"><Plus size={14} /></button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
