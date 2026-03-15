import React, { useEffect, useRef, useState, useCallback } from 'react';
import AppleCalendarIcon from './AppleCalendarIcon';
import { createPortal } from 'react-dom';
import gsap from 'gsap';
import { IconX } from './icons/SvgIcons';
import { cn } from '../utils/cn';
import inPersonMeetingIcs from '../assets/in-person-meeting.ics?url';
import iconGoogleCalendar from '../assets/icon-google-calendar.svg';
import iconMicrosoftOutlook from '../assets/icon-microsoft-outlook.svg';
import { useHaptics } from '../hooks/useHaptics';
import { icsToUrls, openNativeAppWithFallback, downloadIcsFile } from '../utils/calendarUtils';

export function CalendarOptions({ compact = false, titleId }) {
  const containerRef = useRef(null);
  const haptics = useHaptics();
  const [googleUrl, setGoogleUrl] = useState('');
  const [outlookUrl, setOutlookUrl] = useState('');
  const [icsText, setIcsText] = useState('');
  const [outlookNativeUrl, setOutlookNativeUrl] = useState('');

  useEffect(() => {
    let active = true;
    fetch(inPersonMeetingIcs)
      .then(r => {
        if (!r.ok) {
          throw new Error(`Failed to load calendar data: ${r.status} ${r.statusText}`);
        }
        return r.text();
      })
      .then(text => {
        if (!active) return;
        const urls = icsToUrls(text);
        setGoogleUrl(urls.googleUrl || '');
        setOutlookUrl(urls.outlookUrl || '');
        setOutlookNativeUrl(urls.outlookNativeUrl || '');
        setIcsText(text);
        
      })
      .catch(err => {
        console.error('Failed to initialize calendar options:', err);
        if (active) setIcsText('');
      });
    return () => { active = false; };
  }, []);

  const ready = !!(googleUrl && outlookUrl && icsText);
  const handleAppleAdd = (e) => {
    e.preventDefault();
    if (!ready) return;
    haptics.openPanel?.();
    downloadIcsFile(icsText, 'campbell-ctrl-meeting.ics');
  };

  const handleOutlookAdd = (e) => {
    e.preventDefault();
    if (!ready) return;
    haptics.openPanel?.();
    openNativeAppWithFallback(outlookNativeUrl, outlookUrl);
  };

  return (
    <div 
      ref={containerRef} 
      className={cn(
        "flex flex-col gap-6",
        !compact && "bg-background rounded-[3rem] p-10 border border-slate/10 shadow-xl overflow-hidden"
      )}
    >
      <div className="text-center mb-2">
        <h3 id={titleId} className="font-sans font-bold text-2xl text-primary mb-1">Add to Calendar</h3>
        <p className="font-sans text-slate text-[10px] uppercase tracking-[0.2em] opacity-40">Select your provider</p>
      </div>

      <div className="grid grid-cols-3 gap-3" role="group" aria-label="Calendar provider options">
        <a
          href={ready ? googleUrl : undefined}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(
            'flex flex-col items-center gap-3 p-4 rounded-2xl border border-slate/10 transition-all duration-300 group text-center',
            ready ? 'hover:border-accent/30 hover:bg-primary/5 cursor-pointer bg-slate/[0.02]' : 'opacity-40 pointer-events-none'
          )}
        >
          <img src={iconGoogleCalendar} alt="Google" className="w-10 h-10 group-hover:scale-110 transition-transform" />
          <span className="font-sans font-semibold text-primary text-[10px] uppercase tracking-wider">Google</span>
        </a>
        <button
          type="button"
          onClick={handleOutlookAdd}
          className={cn(
            'flex flex-col items-center gap-3 p-4 rounded-2xl border border-slate/10 transition-all duration-300 group text-center',
            ready ? 'hover:border-accent/30 hover:bg-primary/5 cursor-pointer bg-slate/[0.02]' : 'opacity-40 pointer-events-none'
          )}
        >
          <img src={iconMicrosoftOutlook} alt="Outlook" className="w-10 h-10 group-hover:scale-110 transition-transform" />
          <span className="font-sans font-semibold text-primary text-[10px] uppercase tracking-wider">Outlook</span>
        </button>
        <button
          type="button"
          onClick={handleAppleAdd}
          className={cn(
            'flex flex-col items-center gap-3 p-4 rounded-2xl border border-slate/10 transition-all duration-300 group text-center bg-transparent cursor-pointer',
            ready ? 'hover:border-accent/30 hover:bg-primary/5 bg-slate/[0.02]' : 'opacity-40 pointer-events-none'
          )}
        >
          <div className="w-10 h-10 group-hover:scale-110 transition-transform">
            <AppleCalendarIcon />
          </div>
          <span className="font-sans font-semibold text-primary text-[10px] uppercase tracking-wider">Apple</span>
        </button>
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
  const previousActiveRef = useRef(null);
  const handleCloseRef = useRef(() => {});

  useEffect(() => {
    if (!open) return;
    previousActiveRef.current = document.activeElement;
    haptics.selection();
    const bd = backdropRef.current;
    const panel = panelRef.current;
    if (!bd || !panel) return;
    gsap.fromTo(bd, { opacity: 0 }, { opacity: 1, duration: BACKDROP_FADE_IN_DURATION, ease: BACKDROP_EASE_IN });
    gsap.fromTo(panel,
      { opacity: 0, scale: 0.85, y: 40 },
      { opacity: 1, scale: 1, y: 0, duration: PANEL_ENTER_DURATION, ease: PANEL_EASE_IN }
    );
    const t = setTimeout(() => panel.focus?.(), 150);
    return () => clearTimeout(t);
  }, [open, haptics]);

  const handleClose = useCallback(() => {
    haptics.light();
    previousActiveRef.current?.focus?.();
    const bd = backdropRef.current;
    const panel = panelRef.current;
    if (!bd || !panel) { onClose(); return; }
    const tl = gsap.timeline({ onComplete: () => onClose() });
    tl.to(panel, { opacity: 0, scale: 0.9, y: 24, duration: PANEL_EXIT_DURATION, ease: PANEL_EASE_OUT }, 0);
    tl.to(bd, { opacity: 0, duration: BACKDROP_FADE_OUT_DURATION, ease: BACKDROP_EASE_OUT }, 0);
  }, [haptics, onClose]);

  useEffect(() => {
    handleCloseRef.current = handleClose;
  }, [handleClose]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        handleCloseRef.current();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open]);

  if (!open) return null;

  return createPortal(
    <div
      ref={backdropRef}
      className="fixed inset-0 z-50 flex items-center justify-center p-6"
      style={{ backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)' }}
      onMouseDown={(e) => { if (e.target === e.currentTarget) handleClose(); }}
    >
      <div ref={panelRef} role="dialog" aria-modal="true" aria-labelledby="calendar-modal-title" tabIndex={-1} className="bg-background rounded-[2.5rem] border border-slate/15 shadow-2xl p-4 flex flex-col w-[90vw] max-w-sm overflow-hidden">
        <div className="flex items-center justify-end p-2 mb-[-20px] relative z-20">
          <button type="button" onClick={handleClose} aria-label="Close calendar options" className="text-slate/40 hover:text-primary transition-colors p-2 bg-slate/5 rounded-full touch-manipulation active:scale-95">
            <IconX size={18} />
          </button>
        </div>
        <div className="p-4">
          <CalendarOptions compact titleId="calendar-modal-title" />
        </div>
      </div>
    </div>,
    document.body
  );
}
