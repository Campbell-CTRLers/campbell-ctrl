import React, { useState } from 'react';
import { IconCalendar, IconUsers, IconMapPin, IconMonitor } from '../components/icons/SvgIcons';
import { CalendarModal } from '../components/CalendarModal';
import { EventAddToCalendar } from '../components/EventAddToCalendar';

const MeetingsTab = ({ meetings = [], siteContent }) => {
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  const mc = siteContent?.meetings || {};
  const headingAccent = mc.headingAccent || 'Meetings.';
  const description = mc.description || 'Where the community comes together. We practice, discuss strategies, and hang out every week after school.';
  const featuredTitle = mc.featuredTitle || 'Friday Sessions';
  const featuredBadge = mc.featuredBadge || 'EVERY WEEK';
  const timeDesc = mc.timeDesc || '3:30 PM \u2013 5:30 PM directly after school.';
  const locationDesc = mc.locationDesc || 'The Learning Commons (Library). Follow the glow of monitors.';
  const whoDesc = mc.whoDesc || 'Anyone from complete beginners to varsity level competitors.';

  const primaryMeeting = meetings[0];
  const displayTime = primaryMeeting
    ? `${primaryMeeting.startTime || '3:30 PM'} \u2013 ${primaryMeeting.endTime || '5:30 PM'}`
    : '3:30 \u2013 5:30 PM';
  const displayLocation = primaryMeeting?.location || 'Learning Commons';
  const displayDays = primaryMeeting && Array.isArray(primaryMeeting.days) ? primaryMeeting.days.join(', ') : 'Fri';

  return (
    <div className="pt-32 pb-24 px-6 md:px-16 max-w-7xl mx-auto min-h-screen">
      <div className="tab-header mb-16">
        <h1 className="font-sans font-bold text-5xl md:text-7xl text-primary tracking-tighter mb-4">Club <span className="text-accent font-drama italic">{headingAccent}</span></h1>
        <p className="font-roboto text-slate/80 text-lg max-w-2xl">{description}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Featured card */}
        <div className="meetings-card bg-contrast-bg text-contrast-text rounded-[3rem] p-10 md:p-14 relative overflow-hidden shadow-2xl flex flex-col justify-center">
          <div className="absolute top-0 right-0 w-64 h-64 bg-accent/20 rounded-full blur-[80px] -mr-20 -mt-20" />
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-contrast-text/10 border border-contrast-text/20 font-mono text-xs text-contrast-text/80 mb-8">
              <IconCalendar size={14} /> {featuredBadge}
            </div>
            <h2 className="font-sans font-bold text-4xl md:text-5xl mb-6">{featuredTitle}</h2>
            <div className="flex flex-col gap-6 font-sans">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-background/5 border border-background/10 flex items-center justify-center shrink-0 mt-1">
                  <IconCalendar className="text-accent" size={18} />
                </div>
                <div>
                  <h4 className="font-roboto font-bold text-lg">Time</h4>
                  <p className="font-roboto text-contrast-text/70 leading-relaxed">{timeDesc}</p>
                  {primaryMeeting && (
                    <p className="font-mono text-[11px] text-contrast-text/50 mt-1">{displayDays} {displayTime}</p>
                  )}
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-background/5 border border-background/10 flex items-center justify-center shrink-0 mt-1">
                  <IconMonitor className="text-accent" size={18} />
                </div>
                <div>
                  <h4 className="font-roboto font-bold text-lg">Location</h4>
                  <p className="font-roboto text-contrast-text/70 leading-relaxed">{locationDesc}</p>
                  {primaryMeeting && (
                    <p className="font-mono text-[11px] text-contrast-text/50 mt-1">{displayLocation}</p>
                  )}
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-background/5 border border-background/10 flex items-center justify-center shrink-0 mt-1">
                  <IconUsers className="text-accent" size={18} />
                </div>
                <div>
                  <h4 className="font-roboto font-bold text-lg">Who can join?</h4>
                  <p className="font-roboto text-contrast-text/70 leading-relaxed">{whoDesc}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Calendar cards */}
        <div className="meetings-card flex flex-col gap-6">
          {meetings.length > 0 ? (
            <>
              {/* Dynamic meeting schedule card */}
              <div className="bg-background rounded-[2rem] p-6 border border-slate/10 shadow-xl flex flex-col gap-4">
                <h3 className="font-sans font-bold text-xl text-primary">Meeting Schedule</h3>
                <div className="flex flex-col gap-3">
                  {meetings.map((m) => (
                    <div key={m.id} className="flex flex-col gap-3 p-4 rounded-xl bg-slate/5 border border-slate/10">
                      <div className="min-w-0">
                        <h4 className="font-sans font-bold text-primary">{m.title || 'Meeting'}</h4>
                        <div className="flex flex-wrap items-center gap-2 mt-1 text-sm text-slate/70">
                          <span className="font-mono text-xs font-bold">
                            {Array.isArray(m.days) ? m.days.join(', ') : m.days || '\u2014'}{' '}
                            {m.startTime && m.endTime ? `${m.startTime}\u2013${m.endTime}` : m.time || ''}
                          </span>
                          {m.location && (
                            <span className="flex items-center gap-1">
                              <IconMapPin size={12} />
                              {m.location}
                            </span>
                          )}
                        </div>
                      </div>
                      <EventAddToCalendar event={m} eventType="meeting" fullWidth />
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="bg-background rounded-[2rem] p-8 border border-slate/10 shadow-xl flex flex-col items-center justify-center gap-6 text-center">
              <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center text-accent">
                <IconCalendar size={24} />
              </div>
              <div>
                <h3 className="font-sans font-bold text-xl text-primary mb-1">Add to Calendar</h3>
                <p className="font-roboto text-sm text-slate px-4">Keep the full recurring schedule updated on your devices.</p>
              </div>
              <button
                onClick={() => setIsCalendarOpen(true)}
                className="bg-accent text-white px-6 py-3 rounded-full font-sans font-bold text-sm shadow-lg shadow-accent/20 hover:shadow-accent/40 transition-all active:scale-[0.98]"
              >
                Add to Calendar
              </button>
            </div>
          )}
        </div>
      </div>
      <CalendarModal open={isCalendarOpen} onClose={() => setIsCalendarOpen(false)} />
    </div>
  );
};

export default MeetingsTab;
