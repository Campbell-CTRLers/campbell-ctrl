import React, { useState } from 'react';
import { CalendarModal } from './CalendarModal';
import { cn } from '../utils/cn';

export function ClubMeetings() {
  const [popupOpen, setPopupOpen] = useState(false);
  const days = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  return (
    <div className="bg-background rounded-[2rem] p-8 border border-slate/10 shadow-xl flex flex-col h-[380px] justify-between relative">
      <div>
        <h3 className="font-sans font-bold text-2xl text-primary mb-1">Club Meetings</h3>
        <p className="font-roboto text-slate/80 text-sm">Every week in the Learning Commons.</p>
      </div>

      <div className="flex flex-col items-center gap-4 my-auto">
        <div className="time-badge bg-accent/10 border border-accent/20 rounded-full px-5 py-1.5">
          <span className="font-mono text-sm font-bold text-accent tracking-widest uppercase">Fridays</span>
        </div>

        <div className="time-display flex items-center gap-3">
          <span className="font-roboto font-bold text-4xl text-primary tracking-tight">3:30</span>
          <div className="w-4 h-[2px] bg-slate/20 rounded-full" />
          <span className="font-roboto font-bold text-4xl text-primary tracking-tight">5:30</span>
          <span className="font-mono text-sm text-slate/60 mt-2">PM</span>
        </div>

        <div className="time-location flex items-center gap-1.5 text-slate/50">
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" /><circle cx="12" cy="10" r="3" /></svg>
          <span className="font-roboto text-xs">Learning Commons</span>
        </div>
      </div>

      <div className="relative">
        <div className="grid grid-cols-7 gap-2 mb-3">
          {days.map((d, i) => (
            <div
              key={i}
              className={cn(
                "w-full aspect-square rounded-md border flex items-center justify-center font-mono text-xs",
                i === 5
                  ? "day-fri bg-accent/15 border-accent/30 text-accent font-bold"
                  : "border-slate/20 text-slate"
              )}
            >
              {d}
            </div>
          ))}
        </div>
        <button
          onClick={() => setPopupOpen(o => !o)}
          className="btn-save bg-[#0038A8] text-white w-full sm:w-auto px-5 py-3.5 sm:py-2.5 rounded-full font-roboto text-sm sm:text-xs font-bold uppercase tracking-wider block shadow-lg shadow-[#0038A8]/20 hover:shadow-[#0038A8]/40 transition-shadow duration-300"
        >
          Save Schedule
        </button>
      </div>
      <CalendarModal open={popupOpen} onClose={() => setPopupOpen(false)} />
    </div>
  );
}
