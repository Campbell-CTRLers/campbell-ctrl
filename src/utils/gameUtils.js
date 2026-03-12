// Shared game utilities — imported by components that need date formatting or game data

export const formatGameDate = (dateStr, timeStr) => {
  if (!dateStr) return "TBD";
  const dateObj = new Date(dateStr + 'T00:00:00');
  if (dateObj.toString() === 'Invalid Date') return dateStr;

  const formattedDate = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  if (timeStr) {
    return `${formattedDate} - ${timeStr}`;
  }
  return formattedDate;
};

export const GAME_LIST = [
  "Rocket League", "Smash Bros", "Marvel Rivals", "Splatoon 3",
  "Street Fighter", "Mario Kart 8 Delux",
  "Pokémon UNITE", "Madden NFL"
];

// Icon file mapping — maps game name fragments to locally stored SteamGridDB PNGs
export const GAME_ICON_MAP = {
  "rocket league": "/game-icons/rocket-league.png",
  "smash bros": "/game-icons/smash-bros.png",
  "ssbu": "/game-icons/smash-bros.png",
  "super smash": "/game-icons/smash-bros.png",
  "marvel rivals": "/game-icons/marvel-rivals.png",
  "splatoon": "/game-icons/splatoon-3.png",
  "street fighter": "/game-icons/street-fighter-6.png",
  "mario kart": "/game-icons/mario-kart-8.png",
  "pokémon": "/game-icons/pokemon-unite.png",
  "pokemon": "/game-icons/pokemon-unite.png",
  "madden": "/game-icons/madden-nfl.png",
};
