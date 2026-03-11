import React, { useRef, useState } from 'react';
import clsx from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useHaptics } from '../hooks/useHaptics';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

const MagneticGlowButton = ({ children, onClick, className, solid = false }) => {
  const buttonRef = useRef(null);
  const haptics = useHaptics();
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [rotation, setRotation] = useState({ x: 0, y: 0 });
  const [weight, setWeight] = useState(700);
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e) => {
    if (!buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Mobile/Tablet Guard - animations disabled for performance/UX
    if (window.matchMedia("(max-width: 1024px)").matches) return;

    // Update CSS variables for the glow effect
    buttonRef.current.style.setProperty('--mouse-x', `${x}px`);
    buttonRef.current.style.setProperty('--mouse-y', `${y}px`);

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const distanceX = x - centerX;
    const distanceY = y - centerY;

    // Magnetic Pull (max translation)
    setPosition({
      x: distanceX * 0.25,
      y: distanceY * 0.25
    });

    // 3D Tilt based on cursor position
    setRotation({
      x: (distanceY / centerY) * -10,
      y: (distanceX / centerX) * 10
    });

    // Font Weight Morph ("Weight" animation)
    // Closer to center = heavier font
    const distance = Math.sqrt(distanceX ** 2 + distanceY ** 2);
    const maxDistance = Math.sqrt(centerX ** 2 + centerY ** 2);
    const proximity = 1 - Math.min(distance / maxDistance, 1);
    const newWeight = 600 + (proximity * 300); // Morph from 600 to 900
    setWeight(newWeight);
  };

  const handleMouseEnter = () => setIsHovered(true);

  const handleMouseLeave = () => {
    setIsHovered(false);
    setPosition({ x: 0, y: 0 });
    setRotation({ x: 0, y: 0 });
    setWeight(700);
  };

  return (
    <button
      ref={buttonRef}
      onClick={(e) => {
        haptics.selection();
        if (onClick) onClick(e);
      }}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={cn(
        "relative inline-flex items-center justify-center gap-3 px-10 py-5 rounded-full font-roboto text-lg transition-all duration-300 ease-out touch-manipulation group",
        solid ? "bg-accent text-white" : "bg-background text-primary border border-slate/20 shadow-xl overflow-visible",
        className
      )}
      style={{
        transform: `translate(${position.x}px, ${position.y}px) rotateX(${rotation.x}deg) rotateY(${rotation.y}deg)`,
        transition: isHovered ? 'transform 0.1s cubic-bezier(0.2, 0, 0.2, 1), font-variation-settings 0.2s linear' : 'transform 0.6s cubic-bezier(0.2, 1, 0.2, 1), font-variation-settings 0.4s ease',
        fontVariationSettings: `'wght' ${weight}`,
        transformStyle: 'preserve-3d',
        perspective: '1000px'
      }}
    >
      {/* External Ambient Glow (Bleeds outside button) */}
      <div
        className="absolute pointer-events-none rounded-full z-[-10]"
        style={{
          top: -80, left: -80, right: -80, bottom: -80,
          background: `radial-gradient(circle 120px at calc(var(--mouse-x, 50%) + 80px) calc(var(--mouse-y, 50%) + 80px), rgba(var(--color-accent), 0.3), transparent)`,
          opacity: isHovered ? 1 : 0,
          transition: 'opacity 0.4s ease'
        }}
      />

      {/* Background Glow Layer */}
      <div
        className="absolute inset-0 z-0 opacity-0 transition-opacity duration-300 rounded-full overflow-hidden"
        style={{
          background: `radial-gradient(circle 100px at var(--mouse-x, 50%) var(--mouse-y, 50%), rgba(var(--color-accent), 0.1), transparent)`,
          opacity: isHovered ? 1 : 0
        }}
      />

      {/* Border Glow Layer */}
      <div className="absolute inset-0 z-0 rounded-full overflow-hidden p-[1px]">
        <div
          className="absolute inset-[-4px] rounded-full"
          style={{
            background: `radial-gradient(circle 80px at var(--mouse-x, 50%) var(--mouse-y, 50%), rgba(var(--color-accent), 1), transparent)`,
            opacity: isHovered ? 1 : 0,
            transition: 'opacity 0.3s'
          }}
        />
        {/* Inner mask */}
        <div className={cn("absolute inset-[1px] rounded-full z-0", solid ? "bg-accent" : "bg-background")} />
      </div>

      <span className="relative z-10 transition-colors duration-300 flex items-center gap-2">
        {children}
      </span>
    </button>
  );
};

export default MagneticGlowButton;
