/* Shared constants for admin dashboard and roster filtering */

export const ROSTER_OPTIONS = ['ALL', 'VARSITY', 'ALT', 'DEL'];

export const GAME_OPTIONS = [
  "Rocket League", "Smash Bros", "Marvel Rivals", "Splatoon 3",
  "Street Fighter", "Mario Kart 8 Deluxe",
  "Pokémon UNITE", "Madden NFL", "OTHER"
];

export const TYPE_OPTIONS = ['PlayVS Rank', 'Scrimmage', 'Tournament', 'Casual', 'OTHER'];

export const LEAGUE_OPTIONS = ['PlayVS', 'Georgia', 'Georgia PlayVS', 'OTHER'];

export const ROSTER_TYPES = [
  { id: 'VARSITY', label: 'Var', title: 'Varsity' },
  { id: 'ALT', label: 'ALT', title: 'Alternate' },
  { id: 'DEL', label: 'DEL', title: "Alternate's alternate" },
];

export const getRosterType = (item) => (item?.isDel ? 'DEL' : item?.isAlt ? 'ALT' : 'VARSITY');

export const teamKey = (item) => `${String(item?.game ?? '').trim()}\t${Boolean(item?.isAlt)}\t${Boolean(item?.isDel)}`;
export const sameTeam = (a, b) => teamKey(a) === teamKey(b);
