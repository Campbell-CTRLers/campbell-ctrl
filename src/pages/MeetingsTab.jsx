import React, { useState, useMemo } from 'react';
import { IconCalendar, IconUsers, IconMapPin, IconClock } from '../components/icons/SvgIcons';
import { CalendarModal } from '../components/CalendarModal';
import { EventAddToCalendar } from '../components/EventAddToCalendar';
import { cn } from '../utils/cn';

const DAY_ORDER = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const DAY_FULL = { Mon: 'Monday', Tue: 'Tuesday', Wed: 'Wednesday', Thu: 'Thursday', Fri: 'Friday', Sat: 'Saturday', Sun: 'Sunday' };

function getNextMeetingDay() {
  const jsDay = new Date().getDay();
  const map = [6, 0, 1, 2, 3, 4, 5];
  return map[jsDay];
}

const MeetingsTab = ({ meetings = [], siteContent }) => {
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

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

  const hasMeetings = meetings.length > 0;

  return (
    <div className="pt-32 pb-24 px-4 sm:px-6 md:px-16 max-w-7xl mx-auto min-h-screen">
      <div className="tab-header mb-12 md:mb-16">
        <h1 className="font-sans font-bold text-5xl md:text-7xl text-primary tracking-tighter mb-4">
          Club <span className="text-accent font-drama italic">{headingAccent}</span>
        </h1>
        <p className="font-roboto text-slate/80 text-lg max-w-2xl">{description}</p>
      </div>

      {hasMeetings ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
          {/* Timeline */}
          <div className="lg:col-span-7 xl:col-span-8">
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
                          {dayMeetings.map(m => (
                            <div
                              key={`${day}-${m.id}`}
                              className="bg-background rounded-2xl border border-slate/10 p-4 sm:p-5 shadow-sm hover:shadow-md hover:border-slate/20 transition-all"
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0 flex-1">
                                  <h4 className="font-sans font-bold text-base sm:text-lg text-primary leading-tight">
                                    {m.title || 'Meeting'}
                                  </h4>
                                  <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-3 mt-2">
                                    <span className="flex items-center gap-1.5 text-sm text-slate/70">
                                      <IconClock size={14} className="text-accent shrink-0" />
                                      <span className="font-mono text-xs font-bold">
                                        {m.startTime && m.endTime
                                          ? `${m.startTime} – ${m.endTime}`
                                          : 'Time TBD'}
                                      </span>
                                    </span>
                                    {m.location && (
                                      <span className="flex items-center gap-1.5 text-sm text-slate/70">
                                        <IconMapPin size={14} className="text-accent shrink-0" />
                                        {m.location}
                                      </span>
                                    )}
                                  </div>
                                  {m.description && (
                                    <p className="font-roboto text-sm text-slate/60 mt-2 leading-relaxed">
                                      {m.description}
                                    </p>
                                  )}
                                </div>
                              </div>
                              <div className="mt-3">
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
                <h3 className="font-mono text-[10px] font-bold uppercase tracking-widest text-contrast-text/50 mb-5">
                  Weekly Overview
                </h3>
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
                  <h3 className="font-sans font-bold text-sm text-primary">Where We Meet</h3>
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
                <h3 className="font-sans font-bold text-sm text-primary">Who Can Join</h3>
              </div>
              <p className="font-roboto text-sm text-slate/70 leading-relaxed">{whoDesc}</p>
            </div>

            {/* Meetings list for reference */}
            <div className="bg-background rounded-2xl border border-slate/10 p-5 sm:p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 rounded-full bg-accent/10 flex items-center justify-center shrink-0">
                  <IconCalendar size={16} className="text-accent" />
                </div>
                <h3 className="font-sans font-bold text-sm text-primary">All Meetings</h3>
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
          <h2 className="font-sans font-bold text-2xl text-primary mb-2">No Meetings Scheduled</h2>
          <p className="font-roboto text-slate/60 text-sm mb-8">
            Check back soon — meeting times and locations will be posted here.
          </p>
          <button
            onClick={() => setIsCalendarOpen(true)}
            className="bg-accent text-white px-6 py-3 rounded-full font-sans font-bold text-sm shadow-lg shadow-accent/20 hover:shadow-accent/40 transition-all active:scale-[0.98]"
          >
            Add to Calendar
          </button>
        </div>
      )}

      <CalendarModal open={isCalendarOpen} onClose={() => setIsCalendarOpen(false)} />
    </div>
  );
};

export default MeetingsTab;
