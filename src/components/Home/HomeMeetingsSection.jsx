import React, { useState } from 'react';
import { IconCalendar } from '../AboutIcons';
import { IconMapPin, IconChevronDown, IconChevronUp } from '../icons/SvgIcons';
import { EventAddToCalendar } from '../EventAddToCalendar';

export const HomeMeetingsSection = ({ meetings = [] }) => {
  const [showAll, setShowAll] = useState(false);

  const displayMeetings = showAll ? meetings : meetings.slice(0, 3);
  const hasMore = meetings.length > 3;

  if (meetings.length === 0) {
    return (
      <section className="w-full py-16 md:py-20 px-6 md:px-16 bg-slate/5 border-y border-slate/10">
        <div className="max-w-4xl mx-auto">
          <h2 className="font-sans font-bold text-2xl md:text-3xl text-primary mb-2">
            Club Meetings
          </h2>
          <p className="font-roboto text-slate/60 text-sm">No meetings scheduled. Check back soon.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="w-full py-16 md:py-20 px-6 md:px-16 bg-slate/5 border-y border-slate/10">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h2 className="font-sans font-bold text-2xl md:text-3xl text-primary mb-2">
            Club Meetings
          </h2>
          <p className="font-roboto text-slate/70 text-sm">
            When and where we meet. Add to your calendar to stay updated.
          </p>
        </div>

        <div className="flex flex-col gap-4">
          {displayMeetings.map((m) => (
            <div
              key={m.id}
              className="flex flex-col gap-4 p-5 rounded-2xl bg-background border border-slate/10"
            >
              <div className="flex items-center gap-4 flex-1 min-w-0">
                <div className="w-14 h-14 rounded-xl bg-accent/10 flex items-center justify-center shrink-0">
                  <IconCalendar size={24} className="text-accent" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-sans font-bold text-lg text-primary">{m.title || 'Meeting'}</h3>
                  <div className="flex flex-wrap items-center gap-3 mt-1 text-sm text-slate/70">
                    <span className="font-mono font-bold">
                      {Array.isArray(m.days) ? m.days.join(', ') : m.days || '—'}{' '}
                      {m.startTime && m.endTime ? `${m.startTime}–${m.endTime}` : m.time || ''}
                    </span>
                    {m.location && (
                      <span className="flex items-center gap-1">
                        <IconMapPin size={14} />
                        {m.location}
                      </span>
                    )}
                  </div>
                  {m.description && (
                    <p className="font-roboto text-slate/60 text-sm mt-2">{m.description}</p>
                  )}
                </div>
              </div>
              <EventAddToCalendar event={m} eventType="meeting" fullWidth />
            </div>
          ))}
        </div>

        {hasMore && (
          <button
            onClick={() => setShowAll(!showAll)}
            className="mt-5 min-h-[44px] flex items-center justify-center sm:justify-start gap-2 px-4 py-3 font-sans font-bold text-sm text-accent hover:text-accent/80 transition-colors touch-manipulation active:scale-[0.98] -mx-1 rounded-xl"
          >
            {showAll ? (
              <>
                Show less <IconChevronUp size={16} />
              </>
            ) : (
              <>
                Show all {meetings.length} meetings <IconChevronDown size={16} />
              </>
            )}
          </button>
        )}
      </div>
    </section>
  );
};
