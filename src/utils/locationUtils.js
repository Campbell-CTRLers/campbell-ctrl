const DEFAULT_MEETING_LOCATIONS = [
  'Learning Commons',
  'Campbell High School',
  'Campbell High School, 925 Powder Springs St, Smyrna, GA 30080',
  'Media Center',
  'Room 101',
];

export function buildMeetingLocationOptions(meetings = []) {
  const fromMeetings = meetings
    .map((meeting) => String(meeting?.location || '').trim())
    .filter(Boolean);
  return [...new Set([...DEFAULT_MEETING_LOCATIONS, ...fromMeetings, 'OTHER'])];
}

export function buildGoogleMapsSearchUrl(query = '') {
  const target = String(query || '').trim() || 'Campbell High School';
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(target)}`;
}
