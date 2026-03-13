/**
 * Convert meeting/game data to ICS and calendar URLs
 */

const DAY_TO_ICS = { Mon: 'MO', Tue: 'TU', Wed: 'WE', Thu: 'TH', Fri: 'FR', Sat: 'SA', Sun: 'SU' };
const TZ = 'America/New_York';

function parseTimeTo24(timeStr) {
  if (!timeStr) return { h: 15, m: 30 };
  const m = timeStr.match(/(\d{1,2}):?(\d{2})?\s*(AM|PM)?/i);
  if (!m) return { h: 15, m: 30 };
  let h = parseInt(m[1], 10) || 12;
  const min = parseInt(m[2], 10) || 0;
  const pm = (m[3] || '').toUpperCase() === 'PM';
  if (!m[3] && h < 12) h += 12;
  if (pm && h < 12) h += 12;
  if (!pm && h === 12) h = 0;
  return { h, m: min };
}

function nextOccurrenceOfDay(dayAbbr) {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const target = days.indexOf(dayAbbr);
  if (target < 0) return null;
  const d = new Date();
  const today = d.getDay();
  let diff = target - today;
  if (diff <= 0) diff += 7;
  d.setDate(d.getDate() + diff);
  return d;
}

function formatIcsDateTime(date, h, m) {
  const y = date.getFullYear();
  const mo = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hour = String(h).padStart(2, '0');
  const min = String(m).padStart(2, '0');
  return `${y}${mo}${day}T${hour}${min}00`;
}

export function meetingToIcs(meeting) {
  const title = meeting.title || 'Campbell CTRL Meeting';
  const location = (meeting.location || '').replace(/,/g, '\\,').replace(/\n/g, '\\n');
  const desc = (meeting.description || '').replace(/,/g, '\\,').replace(/\n/g, '\\n');
  const days = Array.isArray(meeting.days) ? meeting.days : (meeting.days ? [meeting.days] : ['Fri']);
  const firstDay = days[0] || 'Fri';
  const start = parseTimeTo24(meeting.startTime || '3:30 PM');
  const end = parseTimeTo24(meeting.endTime || '5:30 PM');

  const refDate = nextOccurrenceOfDay(firstDay) || new Date();
  const dtstart = formatIcsDateTime(refDate, start.h, start.m);
  const dtend = formatIcsDateTime(refDate, end.h, end.m);

  const byday = days.map(d => DAY_TO_ICS[d] || 'FR').join(',');
  const until = new Date(refDate);
  until.setMonth(5);
  until.setDate(22);
  const untilStr = until.toISOString().replace(/[-:]/g, '').slice(0, 15) + 'Z';

  const rruleLine = byday ? `RRULE:FREQ=WEEKLY;UNTIL=${untilStr};BYDAY=${byday}` : null;
  const vevent = [
    `DTSTART;TZID=${TZ}:${dtstart}`,
    `DTEND;TZID=${TZ}:${dtend}`,
    rruleLine,
    `LOCATION:${location || 'Campbell High School'}`,
    `SUMMARY:${title}`,
    desc ? `DESCRIPTION:${desc}` : null,
    'STATUS:CONFIRMED',
    'TRANSP:OPAQUE',
  ].filter(Boolean).join('\n');

  return `BEGIN:VCALENDAR
VERSION:2.0
CALSCALE:GREGORIAN
BEGIN:VTIMEZONE
TZID:${TZ}
X-LIC-LOCATION:${TZ}
BEGIN:DAYLIGHT
TZOFFSETFROM:-0500
TZOFFSETTO:-0400
TZNAME:EDT
DTSTART:19700308T020000
RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=2SU
END:DAYLIGHT
BEGIN:STANDARD
TZOFFSETFROM:-0400
TZOFFSETTO:-0500
TZNAME:EST
DTSTART:19701101T020000
RRULE:FREQ=YEARLY;BYMONTH=11;BYDAY=1SU
END:STANDARD
END:VTIMEZONE
BEGIN:VEVENT
${vevent}
END:VEVENT
END:VCALENDAR`.replace(/\n/g, '\r\n');
}

export function gameToIcs(game) {
  const summary = game.game && game.opponent
    ? `${game.game} vs ${game.opponent}`
    : (game.title || game.game || 'Campbell CTRL Match');
  const dateStr = game.date || new Date().toISOString().slice(0, 10);
  const time = parseTimeTo24(game.time || '6:00 PM');
  const d = new Date(dateStr + 'T12:00:00');
  const dtstart = formatIcsDateTime(d, time.h, time.m);
  const dtend = formatIcsDateTime(d, time.h + 1, time.m);
  const location = (game.location || '').replace(/,/g, '\\,').replace(/\n/g, '\\n');

  const vevent = [
    `DTSTART;TZID=${TZ}:${dtstart}`,
    `DTEND;TZID=${TZ}:${dtend}`,
    `SUMMARY:${summary}`,
    location ? `LOCATION:${location}` : null,
    'STATUS:CONFIRMED',
    'TRANSP:OPAQUE',
  ].filter(Boolean).join('\n');

  return `BEGIN:VCALENDAR
VERSION:2.0
CALSCALE:GREGORIAN
BEGIN:VTIMEZONE
TZID:${TZ}
X-LIC-LOCATION:${TZ}
END:VTIMEZONE
BEGIN:VEVENT
${vevent}
END:VEVENT
END:VCALENDAR`.replace(/\n/g, '\r\n');
}

export function icsToUrls(icsText) {
  const unfolded = icsText.replace(/\r?\n[ \t]/g, '');
  const veventMatch = unfolded.match(/BEGIN:VEVENT([\s\S]*?)END:VEVENT/);
  const vevent = veventMatch ? veventMatch[1] : unfolded;
  const get = (key) => {
    const m = vevent.match(new RegExp('^' + key + '[^:]*:(.+)', 'm'));
    return m ? m[1].trim() : '';
  };
  const dtstart = get('DTSTART').replace(/^[^:]+:/, '');
  const dtend = get('DTEND').replace(/^[^:]+:/, '');
  const rrule = get('RRULE');
  const summary = get('SUMMARY');
  const location = get('LOCATION').replace(/\\,/g, ',').replace(/\\n/g, ' ');

  const googleParams = new URLSearchParams({ action: 'TEMPLATE', text: summary, dates: `${dtstart}/${dtend}`, location });
  if (rrule) googleParams.set('recur', `RRULE:${rrule}`);
  const googleUrl = `https://calendar.google.com/calendar/render?${googleParams}`;

  const outlookParams = new URLSearchParams({
    path: '/calendar/action/compose',
    rru: 'addevent',
    subject: summary,
    startdt: dtstart,
    enddt: dtend,
    location: location,
    allday: 'false',
  });
  const outlookUrl = `https://outlook.office.com/calendar/0/deeplink/compose?${outlookParams}`;

  const blob = new Blob([icsText], { type: 'text/calendar;charset=utf-8' });
  const blobUrl = URL.createObjectURL(blob);

  return { googleUrl, outlookUrl, blobUrl, icsText };
}
