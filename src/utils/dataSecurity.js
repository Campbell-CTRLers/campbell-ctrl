const CONTROL_CHARS_REGEX = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;
const VALID_DAYS = new Set(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']);
const MAX_ITEMS_PER_LIST = 250;
const MAX_SITE_CONTENT_BYTES = 450000;

const isPlainObject = (value) =>
  Boolean(value) && typeof value === 'object' && !Array.isArray(value);

const cleanText = (value, maxLength = 120) =>
  String(value ?? '')
    .replace(CONTROL_CHARS_REGEX, '')
    .trim()
    .slice(0, maxLength);

const toFiniteNumber = (value, fallback = 0) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
};

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const normalizeTimeLabel = (value, fallback = '3:30 PM') => {
  const raw = cleanText(value, 24).toUpperCase();
  const match = raw.match(/^(\d{1,2})(?::(\d{1,2}))?\s*(AM|PM)?$/i);
  if (!match) return fallback;
  let hour = clamp(toFiniteNumber(match[1], 12), 1, 12);
  const minute = clamp(toFiniteNumber(match[2], 0), 0, 59);
  const suffix = (match[3] || 'PM').toUpperCase();
  return `${hour}:${String(minute).padStart(2, '0')} ${suffix}`;
};

const normalizeDateLabel = (value) => {
  const raw = cleanText(value, 24);
  return /^\d{4}-\d{2}-\d{2}$/.test(raw) ? raw : '';
};

const normalizeId = (value, fallback) => {
  const n = Number(value);
  if (Number.isSafeInteger(n) && n > 0) return n;
  return fallback;
};

const dedupeMeetingDays = (days) => {
  const source = Array.isArray(days) ? days : [days];
  const normalized = source
    .map((day) => cleanText(day, 3))
    .filter((day) => VALID_DAYS.has(day));
  const unique = Array.from(new Set(normalized));
  return unique.length ? unique : ['Fri'];
};

const sanitizeGame = (game = {}, index = 0) => ({
  id: normalizeId(game.id, Date.now() + index),
  game: cleanText(game.game, 60) || 'Smash Bros',
  opponent: cleanText(game.opponent, 80) || 'TBD',
  date: normalizeDateLabel(game.date),
  time: normalizeTimeLabel(game.time, '4:00 PM'),
  type: cleanText(game.type, 40) || 'PlayVS Rank',
  location: cleanText(game.location, 120),
  isAlt: Boolean(game.isAlt),
  isDel: Boolean(game.isDel),
});

const sanitizeStanding = (standing = {}, index = 0) => ({
  id: normalizeId(standing.id, (Date.now() * 1000) + index),
  team: cleanText(standing.team, 80) || 'Campbell eSpartans',
  game: cleanText(standing.game, 60) || 'Smash Bros',
  wins: clamp(Math.trunc(toFiniteNumber(standing.wins, 0)), 0, 999),
  losses: clamp(Math.trunc(toFiniteNumber(standing.losses, 0)), 0, 999),
  leagueRank: cleanText(standing.leagueRank, 8),
  leagueName: cleanText(standing.leagueName, 40) || 'PlayVS',
  isAlt: Boolean(standing.isAlt),
  isDel: Boolean(standing.isDel),
});

const sanitizeRanking = (ranking = {}, index = 0) => ({
  id: normalizeId(ranking.id, (Date.now() * 1000) + index),
  team: cleanText(ranking.team, 80) || 'Campbell eSpartans',
  game: cleanText(ranking.game, 60) || 'Smash Bros',
  leagueRank: cleanText(ranking.leagueRank, 8),
  leagueName: cleanText(ranking.leagueName, 40) || 'PlayVS',
  isAlt: Boolean(ranking.isAlt),
  isDel: Boolean(ranking.isDel),
});

const sanitizeMeeting = (meeting = {}, index = 0) => ({
  id: normalizeId(meeting.id, Date.now() + index),
  title: cleanText(meeting.title, 90) || 'Club Meeting',
  days: dedupeMeetingDays(meeting.days),
  startTime: normalizeTimeLabel(meeting.startTime, '3:30 PM'),
  endTime: normalizeTimeLabel(meeting.endTime, '5:30 PM'),
  location: cleanText(meeting.location, 120) || 'Learning Commons',
  description: cleanText(meeting.description, 500),
});

const normalizeSiteContent = (siteContent) => {
  if (!isPlainObject(siteContent)) return null;
  try {
    const serialized = JSON.stringify(siteContent);
    if (serialized.length > MAX_SITE_CONTENT_BYTES) return null;
    return JSON.parse(serialized);
  } catch {
    return null;
  }
};

export const sanitizeCloudData = (raw = {}) => {
  const gamesList = Array.isArray(raw.gamesList)
    ? raw.gamesList.slice(0, MAX_ITEMS_PER_LIST).map(sanitizeGame)
    : [];
  const standings = Array.isArray(raw.standings)
    ? raw.standings.slice(0, MAX_ITEMS_PER_LIST).map(sanitizeStanding)
    : [];
  const rankings = Array.isArray(raw.rankings)
    ? raw.rankings.slice(0, MAX_ITEMS_PER_LIST).map(sanitizeRanking)
    : [];
  const meetings = Array.isArray(raw.meetings)
    ? raw.meetings.slice(0, MAX_ITEMS_PER_LIST).map(sanitizeMeeting)
    : [];
  const siteContent = normalizeSiteContent(raw.siteContent);

  return { gamesList, standings, rankings, meetings, siteContent };
};
