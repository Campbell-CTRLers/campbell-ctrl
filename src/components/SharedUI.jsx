import React, { useRef, useState, useEffect } from 'react';
import gsap from 'gsap';
import { Gamepad2, Calendar, Trophy, ArrowRight } from 'lucide-react';
import { CalendarModal } from './CalendarModal';
import { useTheme } from '../context/ThemeContext';
import { cn } from '../utils/cn';
export { cn };

// Global Date Formatter Helper
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

// Full game list for dropdowns (matches Live Standings)
export const GAME_LIST = [
  "Rocket League", "Smash Bros", "Marvel Rivals", "Splatoon 3",
  "Street Fighter 6", "Mario Kart 8 Delux", "Smash Bros ALT",
  "Pokémon UNITE", "Madden NFL 26", "Madden NFL 26 ALT"
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

// Game Icon Component — renders the correct SteamGridDB icon for each game
export const GameIcon = ({ game, size = 20, className = "" }) => {
  if (!game) return <Gamepad2 size={size} className={className} />;

  const lowerGame = game.toLowerCase();
  const matchedKey = Object.keys(GAME_ICON_MAP).find(key => lowerGame.includes(key));

  if (matchedKey) {
    return (
      <img
        src={GAME_ICON_MAP[matchedKey]}
        alt={game}
        width={size}
        height={size}
        className={cn("object-contain", className)}
        style={{ imageRendering: 'auto' }}
      />
    );
  }

  // Fallback: generic gamepad icon from lucide
  return <Gamepad2 size={size} className={className} />;
};


