import React, { useEffect, useMemo, useRef, useState } from 'react';
import { IconCalendar, IconUsers, IconMapPin, IconClock } from '../components/icons/SvgIcons';
import { CalendarModal } from '../components/CalendarModal';
import { EventAddToCalendar } from '../components/EventAddToCalendar';
import { cn } from '../utils/cn';
import { EditableSiteText } from '../components/content/EditableSiteText';

const DAY_ORDER = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const DAY_FULL = { Mon: 'Monday', Tue: 'Tuesday', Wed: 'Wednesday', Thu: 'Thursday', Fri: 'Friday', Sat: 'Saturday', Sun: 'Sunday' };

function getNextMeetingDay() {
  const jsDay = new Date().getDay();
  const map = [6, 0, 1, 2, 3, 4, 5];
  return map[jsDay];
}

const MeetingsTab = ({ meetings = [], dataLoaded = true, siteContent, setSiteContent, contentEditor }) => {
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [cardDensity, setCardDensity] = useState(() => {
    if (typeof window === 'undefined') return 'comfortable';
    return window.localStorage.getItem('meetingsCardDensity') || 'comfortable';
  });
  const timelineRef = useRef(null);
  const nextMeetingRef = useRef(null);

  const mc = siteContent?.meetings || {};
  const headingAccent = mc.headingAccent || 'Meetings.';
  const description = mc.description || 'Where the community comes together. We practice, discuss strategies, and hang out every week after school.';
  const whoDesc = mc.whoDesc || 'Anyone from complete beginners to varsity level competitors.';

  const meetingsByDay = useMemo(() => {
    const map = {};
    DAY_ORDER.forEach(d => { map[d] = []; });
    meetings.forEach(m => {
      const days = Array.isArray(m.days) ? m.days : (m.days ? [m.days] : []);
      days.forEach(d => {
        if (map[d]) map[d].push(m);
      });
    });
    return map;
  }, [meetings]);

  const activeDays = useMemo(() =>
    DAY_ORDER.filter(d => meetingsByDay[d]?.length > 0),
    [meetingsByDay]
  );

  const stats = useMemo(() => {
    let totalMeetings = activeDays.length;
    let totalMinutes = 0;
    const locationSet = new Set();

    meetings.forEach(m => {
      const days = Array.isArray(m.days) ? m.days : (m.days ? [m.days] : []);
      if (m.location) locationSet.add(m.location);

      const parseTime = (t) => {
        if (!t) return 0;
        const match = t.match(/(\d{1,2}):?(\d{2})?\s*(AM|PM)?/i);
        if (!match) return 0;
        let h = parseInt(match[1], 10);
        const min = parseInt(match[2], 10) || 0;
        const pm = (match[3] || '').toUpperCase() === 'PM';
        if (pm && h < 12) h += 12;
        if (!pm && h === 12) h = 0;
        return h * 60 + min;
      };

      const startMin = parseTime(m.startTime);
      const endMin = parseTime(m.endTime);
      if (endMin > startMin) {
        totalMinutes += (endMin - startMin) * days.length;
      }
    });

    const hours = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;

    return {
      meetingsPerWeek: totalMeetings,
      totalTime: hours > 0 ? `${hours}h${mins > 0 ? ` ${mins}m` : ''}` : `${mins}m`,
      locations: [...locationSet],
    };
  }, [meetings, activeDays]);

  const todayIdx = getNextMeetingDay();
  const compactCards = cardDensity === 'compact';

  const hasMeetings = meetings.length > 0;

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem('meetingsCardDensity', cardDensity);
  }, [cardDensity]);

  const scrollToNode = (nodeRef) => {
    nodeRef.current?.scrollIntoView?.({ behavior: 'smooth', block: 'start' });
  };

  const renderSkeleton = () => (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 animate-pulse">
      <div className="lg:col-span-7 xl:col-span-8 flex flex-col gap-4">
        {Array.from({ length: 4 }).map((_, idx) => (
          <div key={idx} className="flex gap-4">
            <div className="w-10 h-10 rounded-full bg-slate/10 shrink-0" />
            <div className="flex-1 bg-slate/10 rounded-2xl h-28" />
          </div>
        ))}
      </div>
      <div className="lg:col-span-5 xl:col-span-4 flex flex-col gap-4">
        <div className="h-36 bg-slate/10 rounded-[2rem]" />
        <div className="h-28 bg-slate/10 rounded-2xl" />
        <div className="h-28 bg-slate/10 rounded-2xl" />
      </div>
    </div>
  );

  return (
    <div className="pt-32 pb-24 px-4 sm:px-6 md:px-16 max-w-7xl mx-auto min-h-screen">
      <div className="tab-header mb-12 md:mb-16">
        <h1 className="font-sans font-bold text-5xl md:text-7xl text-primary tracking-tighter mb-4">
          <EditableSiteText as="span" contentKey="meetings.headingPrefix" fallback="Club" siteContent={siteContent} setSiteContent={setSiteContent} editor={contentEditor} /> <EditableSiteText as="span" contentKey="meetings.headingAccent" fallback={headingAccent} siteContent={siteContent} setSiteContent={setSiteContent} editor={contentEditor} className="text-accent font-drama italic" />
        </h1>
        <EditableSiteText as="p" contentKey="meetings.description" fallback={description} siteContent={siteContent} setSiteContent={setSiteContent} editor={contentEditor} className="font-roboto text-slate/80 text-lg max-w-2xl" />
      </div>
      <div className="md:hidden sticky top-[5.25rem] z-20 -mx-2 px-2 mb-5">
        <div className="rounded-2xl border border-slate/10 bg-background/95 backdrop-blur-md p-2.5 shadow-lg">
          <div className="grid grid-cols-3 gap-2">
            <button onClick={() => scrollToNode(timelineRef)} className="min-h-[42px] rounded-xl border border-slate/10 bg-slate/5 text-[10px] font-mono font-bold uppercase tracking-wide">This Week</button>
            <button onClick={() => scrollToNode(nextMeetingRef)} className="min-h-[42px] rounded-xl border border-slate/10 bg-slate/5 text-[10px] font-mono font-bold uppercase tracking-wide">Next Meeting</button>
            <button onClick={() => setIsCalendarOpen(true)} className="min-h-[42px] rounded-xl border border-accent/25 bg-accent/10 text-accent text-[10px] font-mono font-bold uppercase tracking-wide">Add Calendar</button>
          </div>
          <div className="mt-2 flex items-center gap-2">
            <span className="text-[9px] font-mono uppercase tracking-[0.15em] text-slate/40">Density</span>
            <button onClick={() => setCardDensity('comfortable')} className={cn('px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold uppercase border', !compactCards ? 'border-accent bg-accent/10 text-accent' : 'border-slate/10 text-slate/60')}>Comfortable</button>
            <button onClick={() => setCardDensity('compact')} className={cn('px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold uppercase border', compactCards ? 'border-accent bg-accent/10 text-accent' : 'border-slate/10 text-slate/60')}>Compact</button>
          </div>
        </div>
      </div>

      {!dataLoaded ? renderSkeleton() : hasMeetings ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
          {/* Timeline */}
          <div className="lg:col-span-7 xl:col-span-8" ref={timelineRef}>
            <div className="flex flex-col">
              {DAY_ORDER.map((day, i) => {
                const dayMeetings = meetingsByDay[day];
                const hasEvents = dayMeetings.length > 0;
                const isToday = i === todayIdx;
                const isLast = i === DAY_ORDER.length - 1;

                return (
                  <div key={day} className="flex gap-4 sm:gap-6">
                    {/* Timeline spine */}
                    <div className="flex flex-col items-center w-12 sm:w-16 shrink-0">
                      <div
                        className={cn(
                          'w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center border-2 transition-colors shrink-0',
                          hasEvents
                            ? 'bg-accent/15 border-accent text-accent'
                            : isToday
                              ? 'bg-slate/10 border-slate/30 text-slate/60'
                              : 'bg-transparent border-slate/10 text-slate/30'
                        )}
                      >
                        <span className={cn(
                          'font-mono text-[10px] sm:text-xs font-bold uppercase',
                          hasEvents ? 'text-accent' : ''
                        )}>
                          {day}
                        </span>
                      </div>
                      {!isLast && (
                        <div className={cn(
                          'w-px flex-1 min-h-[16px]',
                          hasEvents ? 'bg-accent/20' : 'bg-slate/10'
                        )} />
                      )}
                    </div>

                    {/* Content */}
                    <div className={cn(
                      'flex-1 min-w-0',
                      hasEvents ? 'pb-4' : 'pb-3',
                      !isLast && !hasEvents && 'pb-3'
                    )}>
                      {hasEvents ? (
                        <div className="flex flex-col gap-3 pt-0.5">
                          <span className="font-sans font-bold text-sm text-primary/50 hidden sm:block">
                            {DAY_FULL[day]}{isToday ? ' — Today' : ''}
                          </span>
                          {dayMeetings.map((m, idx) => (
                            <div
                              key={`${day}-${m.id}`}
                              ref={i === todayIdx && idx === 0 ? nextMeetingRef : null}
                              className={cn(
                                "bg-background rounded-2xl border border-slate/10 shadow-sm hover:shadow-md hover:border-slate/20 transition-all",
                                compactCards ? "p-3.5 sm:p-4" : "p-4 sm:p-5"
                              )}
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0 flex-1">
                                  <div className="flex flex-wrap items-center gap-1.5 mb-2">
                                    <span className="inline-flex items-center gap-1.5 text-[11px] text-slate/70 bg-slate/5 border border-slate/10 rounded-full px-2.5 py-1">
                                      <IconClock size={14} className="text-accent shrink-0" />
                                      <span className="font-mono text-xs font-bold">
                                        {m.startTime && m.endTime
                                          ? `${m.startTime} – ${m.endTime}`
                                          : 'Time TBD'}
                                      </span>
                                    </span>
                                    {m.location ? (
                                      <span className="inline-flex items-center gap-1.5 text-[11px] text-slate/70 bg-slate/5 border border-slate/10 rounded-full px-2.5 py-1">
                                        <IconMapPin size={14} className="text-accent shrink-0" />
                                        {m.location}
                                      </span>
                                    ) : null}
                                  </div>
                                  <h4 className={cn("font-sans font-bold text-primary leading-tight", compactCards ? "text-[15px]" : "text-base sm:text-lg")}>
                                    {m.title || 'Meeting'}
                                  </h4>
                                  {m.description && (
                                    <p className={cn("font-roboto text-slate/60 leading-relaxed", compactCards ? "text-xs mt-1.5" : "text-sm mt-2")}>
                                      {m.description}
                                    </p>
                                  )}
                                </div>
                              </div>
                              <div className={compactCards ? "mt-2.5" : "mt-3"}>
                                <EventAddToCalendar event={m} eventType="meeting" fullWidth />
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className={cn(
                          'flex items-center h-10 sm:h-12',
                        )}>
                          <span className={cn(
                            'font-sans text-sm',
                            isToday ? 'text-slate/50 font-medium' : 'text-slate/25'
                          )}>
                            {DAY_FULL[day]}{isToday ? ' — Today' : ''}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Info Dashboard */}
          <div className="lg:col-span-5 xl:col-span-4 flex flex-col gap-4">
            {/* Weekly Stats */}
            <div className="bg-contrast-bg text-contrast-text rounded-[2rem] p-6 sm:p-8 relative overflow-hidden shadow-xl">
              <div className="absolute top-0 right-0 w-40 h-40 bg-accent/20 rounded-full blur-[60px] -mr-10 -mt-10" />
              <div className="relative z-10">
                <EditableSiteText as="h3" contentKey="meetings.weeklyOverview" fallback="Weekly Overview" siteContent={siteContent} setSiteContent={setSiteContent} editor={contentEditor} className="font-mono text-[10px] font-bold uppercase tracking-widest text-contrast-text/50 mb-5" />
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="font-display font-bold text-3xl sm:text-4xl text-contrast-text">
                      {stats.meetingsPerWeek}
                    </div>
                    <div className="font-roboto text-xs text-contrast-text/50 mt-1">
                      {stats.meetingsPerWeek === 1 ? 'day / week' : 'days / week'}
                    </div>
                  </div>
                  <div>
                    <div className="font-display font-bold text-3xl sm:text-4xl text-contrast-text">
                      {stats.totalTime}
                    </div>
                    <div className="font-roboto text-xs text-contrast-text/50 mt-1">
                      total / week
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Locations */}
            {stats.locations.length > 0 && (
              <div className="bg-background rounded-2xl border border-slate/10 p-5 sm:p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-9 h-9 rounded-full bg-accent/10 flex items-center justify-center shrink-0">
                    <IconMapPin size={16} className="text-accent" />
                  </div>
                <EditableSiteText as="h3" contentKey="meetings.whereWeMeet" fallback="Where We Meet" siteContent={siteContent} setSiteContent={setSiteContent} editor={contentEditor} className="font-sans font-bold text-sm text-primary" />
                </div>
                <div className="flex flex-col gap-2">
                  {stats.locations.map(loc => (
                    <div
                      key={loc}
                      className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate/5"
                    >
                      <span className="font-roboto text-sm text-primary">{loc}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Who Can Join */}
            <div className="bg-background rounded-2xl border border-slate/10 p-5 sm:p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 rounded-full bg-accent/10 flex items-center justify-center shrink-0">
                  <IconUsers size={16} className="text-accent" />
                </div>
                <EditableSiteText as="h3" contentKey="meetings.whoCanJoinHeading" fallback="Who Can Join" siteContent={siteContent} setSiteContent={setSiteContent} editor={contentEditor} className="font-sans font-bold text-sm text-primary" />
              </div>
              <EditableSiteText as="p" contentKey="meetings.whoCanJoinDesc" fallback={whoDesc} siteContent={siteContent} setSiteContent={setSiteContent} editor={contentEditor} className="font-roboto text-sm text-slate/70 leading-relaxed" />
            </div>

            {/* Meetings list for reference */}
            <div className="bg-background rounded-2xl border border-slate/10 p-5 sm:p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 rounded-full bg-accent/10 flex items-center justify-center shrink-0">
                  <IconCalendar size={16} className="text-accent" />
                </div>
                <EditableSiteText as="h3" contentKey="meetings.allMeetingsHeading" fallback="All Meetings" siteContent={siteContent} setSiteContent={setSiteContent} editor={contentEditor} className="font-sans font-bold text-sm text-primary" />
              </div>
              <div className="flex flex-col gap-2">
                {meetings.map(m => (
                  <div key={m.id} className="px-3 py-2 rounded-xl bg-slate/5">
                    <div className="font-sans font-bold text-sm text-primary">{m.title || 'Meeting'}</div>
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      {Array.isArray(m.days) && m.days.map(d => (
                        <span
                          key={d}
                          className="font-mono text-[10px] font-bold uppercase px-1.5 py-0.5 rounded-md bg-accent/10 text-accent"
                        >
                          {d}
                        </span>
                      ))}
                      <span className="font-mono text-[10px] text-slate/50">
                        {m.startTime && m.endTime ? `${m.startTime}–${m.endTime}` : ''}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Empty state */
        <div className="flex flex-col items-center justify-center text-center py-20 max-w-md mx-auto">
          <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center text-accent mb-6">
            <IconCalendar size={28} />
          </div>
          <EditableSiteText as="h2" contentKey="meetings.emptyHeading" fallback="No Meetings Scheduled" siteContent={siteContent} setSiteContent={setSiteContent} editor={contentEditor} className="font-sans font-bold text-2xl text-primary mb-2" />
          <EditableSiteText as="p" contentKey="meetings.emptyDescription" fallback="Check back soon — meeting times and locations will be posted here." siteContent={siteContent} setSiteContent={setSiteContent} editor={contentEditor} className="font-roboto text-slate/60 text-sm mb-8" />
          <button
            onClick={() => setIsCalendarOpen(true)}
            className="bg-accent text-white px-6 py-3 rounded-full font-sans font-bold text-sm shadow-lg shadow-accent/20 hover:shadow-accent/40 transition-all active:scale-[0.98]"
          >
            <EditableSiteText as="span" contentKey="meetings.emptyAddCalendar" fallback="Add to Calendar" siteContent={siteContent} setSiteContent={setSiteContent} editor={contentEditor} />
          </button>
        </div>
      )}

      <CalendarModal open={isCalendarOpen} onClose={() => setIsCalendarOpen(false)} />
    </div>
  );
};

export default MeetingsTab;
