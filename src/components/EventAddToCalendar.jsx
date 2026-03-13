import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { Download, X } from 'lucide-react';
import { meetingToIcs, gameToIcs, icsToUrls } from '../utils/calendarUtils';
import iconGoogleCalendar from '../assets/icon-google-calendar.svg';
import iconMicrosoftOutlook from '../assets/icon-microsoft-outlook.svg';
import AppleCalendarIcon from './AppleCalendarIcon';
import { IconCalendar } from './AboutIcons';
import { cn } from '../utils/cn';
import { useHaptics } from '../hooks/useHaptics';

export function EventAddToCalendar({ event, eventType, compact = false, fullWidth = false }) {
  const [open, setOpen] = useState(false);
  const haptics = useHaptics();
  const popoverRef = useRef(null);

  const { googleUrl, outlookUrl, blobUrl, appleDataUri, icsText } = useMemo(() => {
    if (!event) return {};
    const ics = eventType === 'meeting' ? meetingToIcs(event) : gameToIcs(event);
    return icsToUrls(ics);
  }, [event, eventType]);

  useEffect(() => {
    return () => { if (blobUrl) URL.revokeObjectURL(blobUrl); };
  }, [blobUrl]);

  const close = useCallback(() => setOpen(false), []);

  const ready = !!(googleUrl && outlookUrl && blobUrl);
  const filename = event?.title ? `${(event.title || 'event').replace(/\s+/g, '-')}.ics` : 'event.ics';

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  const handleAppleAdd = async (e) => {
    e.preventDefault();
    if (!ready || !icsText) return;
    haptics.light();

    const file = new File([icsText], filename, { type: 'text/calendar' });
    const canShare = navigator.share && (navigator.canShare ? navigator.canShare({ files: [file] }) : false);

    if (canShare) {
      try {
        await navigator.share({ files: [file], title: 'Add to Calendar' });
        close();
        return;
      } catch (err) {
        if (err.name === 'AbortError') return;
      }
    }

    window.location.href = appleDataUri;
    close();
  };

  const handleDownload = () => {
    if (!ready) return;
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = filename;
    a.click();
  };

  const toggle = (e) => {
    e.stopPropagation();
    haptics.light();
    setOpen((o) => !o);
  };

  const providerBtn = 'flex flex-col items-center justify-center gap-2 min-h-[64px] p-4 rounded-2xl border border-slate/10 hover:border-accent/30 hover:bg-accent/5 active:scale-[0.97] transition-all text-center touch-manipulation';

  const calendarOptions = ready && (
    <>
      <div className="grid grid-cols-3 gap-3">
        <a href={googleUrl} target="_blank" rel="noreferrer" onClick={close} className={providerBtn}>
          <img src={iconGoogleCalendar} alt="Google" className="w-9 h-9" />
          <span className="font-mono text-[10px] font-bold text-primary uppercase">Google</span>
        </a>
        <a href={outlookUrl} target="_blank" rel="noreferrer" onClick={close} className={providerBtn}>
          <img src={iconMicrosoftOutlook} alt="Outlook" className="w-9 h-9" />
          <span className="font-mono text-[10px] font-bold text-primary uppercase">Outlook</span>
        </a>
        <button type="button" onClick={handleAppleAdd} className={cn(providerBtn, 'w-full cursor-pointer bg-transparent')}>
          <div className="w-9 h-9 flex items-center justify-center">
            <AppleCalendarIcon className="w-7 h-7" />
          </div>
          <span className="font-mono text-[10px] font-bold text-primary uppercase">Apple</span>
        </button>
      </div>
      <p className="text-center font-sans text-[10px] text-slate/40 leading-relaxed px-2">
        Tip: When Calendar opens, choose which calendar to save to (e.g. iCloud&#8209;Family).
      </p>
      <button
        type="button"
        onClick={handleDownload}
        className="flex items-center justify-center gap-2 min-h-[48px] py-3 rounded-2xl border border-slate/10 hover:border-accent/30 hover:bg-accent/5 font-mono text-xs text-slate hover:text-accent transition-all touch-manipulation active:scale-[0.97]"
      >
        <Download size={14} />
        Download .ics
      </button>
    </>
  );

  return (
    <div ref={popoverRef} className={cn('relative', fullWidth ? 'w-full' : 'inline-block')}>
      <button
        onClick={toggle}
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label="Add to calendar"
        className={cn(
          fullWidth
            ? 'w-full flex items-center justify-center gap-3 min-h-[52px] py-3.5 px-5 rounded-2xl border border-accent/20 bg-accent/5 hover:bg-accent/10 text-accent font-sans font-bold text-sm transition-all touch-manipulation active:scale-[0.98]'
            : cn(
                'flex items-center justify-center rounded-xl border border-slate/10 transition-all touch-manipulation',
                'min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0',
                compact ? 'w-10 h-10 sm:w-8 sm:h-8' : 'w-11 h-11 sm:w-9 sm:h-9',
                'hover:border-accent/30 hover:bg-accent/5 active:scale-95 text-slate hover:text-accent'
              )
        )}
      >
        <IconCalendar size={fullWidth ? 18 : compact ? 16 : 18} className={cn(!fullWidth && 'sm:scale-90')} />
        {fullWidth && <span>Add to Calendar</span>}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm"
          onClick={close}
        >
          <div
            className="w-full max-w-lg bg-background rounded-t-3xl sm:rounded-3xl p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:pb-6 sm:mx-4 flex flex-col gap-4 animate-slide-up shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-sans font-bold text-lg text-primary">Add to Calendar</h3>
              <button
                onClick={close}
                className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-slate/10 text-slate touch-manipulation active:scale-90"
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>
            {calendarOptions}
          </div>
        </div>
      )}
    </div>
  );
}
