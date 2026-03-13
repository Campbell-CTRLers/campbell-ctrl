import React from 'react';
import { IconGamepad } from './icons/SvgIcons';
import { cn } from '../utils/cn';
import { GAME_ICON_MAP } from '../utils/gameUtils';

// Game Icon Component — renders the correct SteamGridDB icon for each game
export const GameIcon = ({ game, size = 20, className = "" }) => {
  if (!game) return <IconGamepad size={size} className={className} />;

  const lowerGame = game.toLowerCase();
  const matchedKey = Object.keys(GAME_ICON_MAP).find(key => lowerGame.includes(key));

  if (matchedKey) {
    return (
      <img
        src={GAME_ICON_MAP[matchedKey]}
        alt={game}
        width={size}
        height={size}
        loading="lazy"
        className={cn("object-contain", className)}
        style={{ imageRendering: 'auto' }}
      />
    );
  }

  // Fallback: generic gamepad icon from lucide
  return <IconGamepad size={size} className={className} />;
};

