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

function escapeIcsText(value) {
  return String(value || '')
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n');
}

export function meetingToIcs(meeting) {
  const title = escapeIcsText(meeting.title || 'Campbell CTRL Meeting');
  const location = escapeIcsText(meeting.location);
  const desc = escapeIcsText(meeting.description);
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
  const summaryRaw = game.game && game.opponent
    ? `${game.game} vs ${game.opponent}`
    : (game.title || game.game || 'Campbell CTRL Match');
  const summary = escapeIcsText(summaryRaw);
  const dateStr = game.date || new Date().toISOString().slice(0, 10);
  const time = parseTimeTo24(game.time || '6:00 PM');
  const d = new Date(dateStr + 'T12:00:00');
  const dtstart = formatIcsDateTime(d, time.h, time.m);
  const dtend = formatIcsDateTime(d, time.h + 1, time.m);
  const location = escapeIcsText(game.location);

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

export function icsToDataUri(icsText) {
  return 'data:text/calendar;charset=utf-8,' + encodeURIComponent(icsText);
}

function parseIcsDateTime(value) {
  if (!value) return null;
  const clean = String(value).trim().replace(/^[^:]+:/, '');
  const dateOnly = clean.match(/^(\d{4})(\d{2})(\d{2})$/);
  if (dateOnly) {
    const [, y, mo, d] = dateOnly;
    // Parse date-only events to local noon to avoid DST boundary rollovers.
    return new Date(Number(y), Number(mo) - 1, Number(d), 12, 0, 0);
  }
  const m = clean.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})?(Z)?$/);
  if (!m) return null;
  const [, y, mo, d, h, mi, s = '00', z] = m;
  if (z) {
    return new Date(Date.UTC(Number(y), Number(mo) - 1, Number(d), Number(h), Number(mi), Number(s)));
  }
  return new Date(Number(y), Number(mo) - 1, Number(d), Number(h), Number(mi), Number(s));
}

function toOutlookIso(date) {
  return date ? date.toISOString() : '';
}

function toAppleCalshow(date) {
  if (!date) return '';
  const appleEpochMs = Date.UTC(2001, 0, 1, 0, 0, 0);
  return `calshow:${Math.floor((date.getTime() - appleEpochMs) / 1000)}`;
}

function toAppleCalshowSlash(date) {
  if (!date) return '';
  const appleEpochMs = Date.UTC(2001, 0, 1, 0, 0, 0);
  return `calshow://${Math.floor((date.getTime() - appleEpochMs) / 1000)}`;
}

function normalizeUrlList(value) {
  return (Array.isArray(value) ? value : [value])
    .filter(item => typeof item === 'string')
    .map(item => item.trim())
    .filter(Boolean);
}

function isApplePlatform() {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent || '';
  const platform = navigator.platform || '';
  const iOS = /iPad|iPhone|iPod/i.test(ua);
  const macOS = /Mac/i.test(platform);
  const iPadOS = macOS && Number(navigator.maxTouchPoints || 0) > 1;
  return iOS || macOS || iPadOS;
}

function isCustomProtocol(url) {
  return /^[a-zA-Z][a-zA-Z\d+.-]*:/.test(url) && !/^(https?|data|blob):/i.test(url);
}

function openCustomProtocol(url) {
  if (typeof document === 'undefined' || !document.body) return false;
  const iframe = document.createElement('iframe');
  iframe.style.display = 'none';
  iframe.setAttribute('aria-hidden', 'true');
  iframe.tabIndex = -1;
  iframe.src = url;
  document.body.appendChild(iframe);
  window.setTimeout(() => iframe.remove(), 1500);
  return true;
}

export function openNativeAppWithFallback(nativeUrl, fallbackUrl, timeoutMs = 1200) {
  if (typeof window === 'undefined') return;
  const nativeUrls = normalizeUrlList(nativeUrl);
  const fallbackUrls = normalizeUrlList(fallbackUrl);
  const openFallback = () => {
    const nextFallback = fallbackUrls.shift();
    if (nextFallback) window.location.assign(nextFallback);
  };

  // #region agent log
  window.__calendarDebugLog?.({
    hypothesisId: 'A',
    location: 'calendarUtils.js:openNativeAppWithFallback:entry',
    message: 'Native launch requested',
    data: { nativeCount: nativeUrls.length, fallbackCount: fallbackUrls.length },
    timestamp: Date.now(),
  });
  // #endregion

  if (!nativeUrls.length && fallbackUrls.length) {
    openFallback();
    return;
  }
  if (!nativeUrls.length) return;
  if (nativeUrls.some(url => /^calshow:/i.test(url)) && !isApplePlatform()) {
    // #region agent log
    window.__calendarDebugLog?.({
      hypothesisId: 'B',
      location: 'calendarUtils.js:openNativeAppWithFallback:nonAppleBypass',
      message: 'Bypassing calshow on non-Apple platform',
      data: { userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '' },
      timestamp: Date.now(),
    });
    // #endregion
    openFallback();
    return;
  }

  let didHide = false;
  let done = false;
  let timerId = 0;
  let attempt = 0;

  const cleanup = () => {
    if (done) return;
    done = true;
    window.removeEventListener('visibilitychange', onVisibility);
    window.removeEventListener('pagehide', onPageHide);
    if (timerId) window.clearTimeout(timerId);
  };

  const onVisibility = () => {
    if (document.visibilityState === 'hidden') {
      didHide = true;
      // #region agent log
      window.__calendarDebugLog?.({
        hypothesisId: 'C',
        location: 'calendarUtils.js:openNativeAppWithFallback:onVisibility',
        message: 'Page hidden after native launch',
        data: { attempt },
        timestamp: Date.now(),
      });
      // #endregion
      cleanup();
    }
  };
  const onPageHide = () => {
    didHide = true;
    cleanup();
  };

  window.addEventListener('visibilitychange', onVisibility);
  window.addEventListener('pagehide', onPageHide);

  const tryOpenNext = () => {
    if (didHide || done) {
      cleanup();
      return;
    }
    const nextNative = nativeUrls[attempt];
    // #region agent log
    window.__calendarDebugLog?.({
      hypothesisId: 'A',
      location: 'calendarUtils.js:openNativeAppWithFallback:attemptNative',
      message: 'Attempting native URL',
      data: { attempt, nextNative: nextNative || null },
      timestamp: Date.now(),
    });
    // #endregion
    attempt += 1;
    if (!nextNative) {
      // #region agent log
      window.__calendarDebugLog?.({
        hypothesisId: 'D',
        location: 'calendarUtils.js:openNativeAppWithFallback:openFallback',
        message: 'All native attempts exhausted; opening fallback',
        data: { remainingFallbacks: fallbackUrls.length },
        timestamp: Date.now(),
      });
      // #endregion
      openFallback();
      cleanup();
      return;
    }
    try {
      if (isCustomProtocol(nextNative)) {
        if (!openCustomProtocol(nextNative)) {
          window.location.assign(nextNative);
        }
      } else {
        window.location.assign(nextNative);
      }
    } catch {
      // If scheme assignment fails synchronously, continue to fallback cycle.
    }
    timerId = window.setTimeout(() => {
      if (didHide) {
        cleanup();
        return;
      }
      tryOpenNext();
    }, timeoutMs);
  };

  tryOpenNext();
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
  const location = get('LOCATION')
    .replace(/\\\\/g, '\\')
    .replace(/\\,/g, ',')
    .replace(/\\;/g, ';')
    .replace(/\\n/g, ' ');

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
  const startDate = parseIcsDateTime(dtstart);
  const endDate = parseIcsDateTime(dtend);
  const nativeOutlookParams = new URLSearchParams({
    subject: summary || 'Campbell CTRL Event',
    start: toOutlookIso(startDate),
    end: toOutlookIso(endDate),
    location: location || '',
  });
  const outlookNativeUrl = `ms-outlook://events/new?${nativeOutlookParams}`;
  const appleNativeUrl = [toAppleCalshow(startDate), toAppleCalshowSlash(startDate)].filter(Boolean);

  const blob = new Blob([icsText], { type: 'text/calendar;charset=utf-8' });
  const blobUrl = URL.createObjectURL(blob);
  const appleDataUri = icsToDataUri(icsText);

  return { googleUrl, outlookUrl, outlookNativeUrl, appleNativeUrl, blobUrl, appleDataUri, icsText };
}
