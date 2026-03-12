import React, { useEffect, useRef, useState } from 'react';
import AppleCalendarIcon from './AppleCalendarIcon';
import { createPortal } from 'react-dom';
import gsap from 'gsap';
import { X, Download } from 'lucide-react';
import { cn } from '../utils/cn';
import inPersonMeetingIcs from '../assets/in-person-meeting.ics?url';
import iconGoogleCalendar from '../assets/icon-google-calendar.svg';
import iconMicrosoftOutlook from '../assets/icon-microsoft-outlook.svg';
import { useHaptics } from '../hooks/useHaptics';

export function CalendarOptions({ compact = false }) {
  const containerRef = useRef(null);
  const [googleUrl, setGoogleUrl] = useState('');
  const [outlookUrl, setOutlookUrl] = useState('');
  const [appleUrl, setAppleUrl] = useState('');
  const [blobUrl, setBlobUrl] = useState('');

  useEffect(() => {
    let active = true;
    let createdUrl = '';
    fetch(inPersonMeetingIcs)
      .then(r => {
        if (!r.ok) {
          throw new Error(`Failed to load calendar data: ${r.status} ${r.statusText}`);
        }
        return r.text();
      })
      .then(text => {
        if (!active) return;
        const unfolded = text.replace(/\r?\n[ \t]/g, '');
        const veventMatch = unfolded.match(/BEGIN:VEVENT([\s\S]*?)END:VEVENT/);
        const vevent = veventMatch ? veventMatch[1] : unfolded;
        const get = key => {
          const m = vevent.match(new RegExp('^' + key + '[^:]*:(.+)', 'm'));
          return m ? m[1].trim() : '';
        };
        const dtstart = get('DTSTART');
        const dtend = get('DTEND');
        const rrule = get('RRULE');
        const summary = get('SUMMARY');
        const location = get('LOCATION').replace(/\\,/g, ',').replace(/\\n/g, ' ');
        
        const googleParams = new URLSearchParams({ action: 'TEMPLATE', text: summary, dates: `${dtstart}/${dtend}`, location });
        if (rrule) googleParams.set('recur', `RRULE:${rrule}`);
        setGoogleUrl(`https://calendar.google.com/calendar/render?${googleParams}`);

        const outlookParams = new URLSearchParams({
          path: '/calendar/action/compose',
          rru: 'addevent',
          subject: summary,
          startdt: dtstart,
          enddt: dtend,
          location: location,
          allday: 'false'
        });
        setOutlookUrl(`https://outlook.office.com/calendar/0/deeplink/compose?${outlookParams}`);

        const blob = new Blob([text], { type: 'text/calendar;charset=utf-8' });
        createdUrl = URL.createObjectURL(blob);
        setBlobUrl(createdUrl);
        
        const absIcsUrl = new URL('/in-person-meeting.ics', window.location.origin).href;
        setAppleUrl(absIcsUrl.replace(/^https?/, 'webcal'));
      })
      .catch(err => {
        // Log the error so failures are not silent; state remains in a safe default.
        console.error('Failed to initialize calendar options:', err);
        if (active && createdUrl) {
          URL.revokeObjectURL(createdUrl);
        }
      });
    return () => { active = false; if (createdUrl) URL.revokeObjectURL(createdUrl); };
  }, []);

  const ready = !!(googleUrl && outlookUrl && appleUrl && blobUrl);
  const filename = 'in-person-meeting.ics';
  
  const calendarProviders = [
    { label: 'Google',   href: googleUrl,  target: '_blank', icon: iconGoogleCalendar },
    { label: 'Outlook',  href: outlookUrl, target: '_blank', icon: iconMicrosoftOutlook },
    { label: 'Apple',    href: appleUrl,   target: null,     icon: AppleCalendarIcon },
  ];

  return (
    <div 
      ref={containerRef} 
      className={cn(
        "flex flex-col gap-6",
        !compact && "bg-background rounded-[3rem] p-10 border border-slate/10 shadow-xl overflow-hidden"
      )}
    >
      <div className="text-center mb-2">
        <h3 className="font-sans font-bold text-2xl text-primary mb-1">Add to Calendar</h3>
        <p className="font-sans text-slate text-[10px] uppercase tracking-[0.2em] opacity-40">Select your provider</p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {calendarProviders.map(({ label, href, target, icon }) => (
          <a
            key={label}
            href={ready ? href : undefined}
            target={target ?? undefined}
            rel={target ? 'noreferrer' : undefined}
            className={cn(
              'flex flex-col items-center gap-3 p-4 rounded-2xl border border-slate/10 transition-all duration-300 group text-center',
              ready ? 'hover:border-accent/30 hover:bg-primary/5 cursor-pointer bg-slate/[0.02]' : 'opacity-40 pointer-events-none'
            )}
          >
            {typeof icon === 'string' ? (
              <img src={icon} alt={label} className="w-10 h-10 group-hover:scale-110 transition-transform" />
            ) : (
              <div className="w-10 h-10 group-hover:scale-110 transition-transform">
                {React.createElement(icon)}
              </div>
            )}
            <span className="font-sans font-semibold text-primary text-[10px] uppercase tracking-wider">{label}</span>
          </a>
        ))}
      </div>

      <div className="flex justify-center pt-2">
        <a 
          href={ready ? blobUrl : undefined} 
          download={filename}
          className={cn(
            "flex items-center gap-2 px-6 py-2.5 rounded-full border border-transparent hover:border-slate/10 hover:bg-slate/5 transition-all duration-300 group",
            !ready && "opacity-0 pointer-events-none"
          )}
        >
          <span className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-slate/40 group-hover:text-primary transition-colors">
            <Download size={14} className="group-hover:scale-110 transition-transform" />
            Download .ics
          </span>
        </a>
      </div>
    </div>
  );
}

const BACKDROP_FADE_IN_DURATION = 0.3;
const BACKDROP_FADE_OUT_DURATION = 0.3;
const PANEL_ENTER_DURATION = 0.45;
const PANEL_EXIT_DURATION = 0.25;
const BACKDROP_EASE_IN = 'power2.out';
const BACKDROP_EASE_OUT = 'power2.in';
const PANEL_EASE_IN = 'back.out(1.6)';
const PANEL_EASE_OUT = 'power2.in';

export function CalendarModal({ open, onClose }) {
  const backdropRef = useRef(null);
  const panelRef = useRef(null);
  const haptics = useHaptics();
  const [animating, setAnimating] = useState(false);

  // Entry animation — runs after the portal mounts when open becomes true
  useEffect(() => {
    if (!open) return;
    haptics.selection();
    const bd = backdropRef.current;
    const panel = panelRef.current;
    if (!bd || !panel) return;
    gsap.fromTo(bd, { opacity: 0 }, { opacity: 1, duration: BACKDROP_FADE_IN_DURATION, ease: BACKDROP_EASE_IN });
    gsap.fromTo(panel,
      { opacity: 0, scale: 0.85, y: 40 },
      { opacity: 1, scale: 1, y: 0, duration: PANEL_ENTER_DURATION, ease: PANEL_EASE_IN }
    );
  }, [open, haptics]);

  // Exit animation — animate out then unmount
  const handleClose = () => {
    haptics.light();
    const bd = backdropRef.current;
    const panel = panelRef.current;
    if (!bd || !panel) { onClose(); return; }
    setAnimating(true);
    gsap.to(panel, { opacity: 0, scale: 0.9, y: 24, duration: PANEL_EXIT_DURATION, ease: PANEL_EASE_OUT });
    gsap.to(bd, { opacity: 0, duration: BACKDROP_FADE_OUT_DURATION, ease: BACKDROP_EASE_OUT, onComplete: () => { setAnimating(false); onClose(); } });
  };

  if (!open && !animating) return null;

  return createPortal(
    <div
      ref={backdropRef}
      className="fixed inset-0 z-50 flex items-center justify-center p-6"
      style={{ backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)' }}
      onMouseDown={(e) => { if (e.target === e.currentTarget) handleClose(); }}
    >
      <div ref={panelRef} className="bg-background rounded-[2.5rem] border border-slate/15 shadow-2xl p-4 flex flex-col w-[90vw] max-w-sm overflow-hidden">
        <div className="flex items-center justify-end p-2 mb-[-20px] relative z-20">
          <button onClick={handleClose} className="text-slate/40 hover:text-primary transition-colors p-2 bg-slate/5 rounded-full touch-manipulation active:scale-95">
            <X size={18} />
          </button>
        </div>
        <div className="p-4">
          <CalendarOptions compact />
        </div>
      </div>
    </div>,
    document.body
  );
}
