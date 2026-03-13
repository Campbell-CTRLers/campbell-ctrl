import React from 'react';
import { IconUsersOpen, IconController, IconTrophyAbout } from '../AboutIcons';

const DEFAULT_CARDS = [
  { title: 'Open to all', desc: 'From complete beginners to varsity competitors. Everyone is welcome.' },
  { title: 'Multiple games', desc: 'Rocket League, Smash Bros, Splatoon 3, Marvel Rivals, Mario Kart, and more.' },
  { title: 'PlayVS competitive', desc: 'Official Campbell eSpartans rosters competing in Georgia and PlayVS leagues.' },
];

const CARD_ICONS = [IconUsersOpen, IconController, IconTrophyAbout];

export const AboutSection = ({ content }) => {
  const heading = content?.heading || 'About the Club';
  const description = content?.description || "Campbell CTRL is Campbell High School\u2019s official esports and gaming club. We practice weekly, compete in PlayVS leagues, and represent Campbell at the state level.";
  const cards = content?.cards || DEFAULT_CARDS;

  return (
    <section
      id="about-section"
      className="w-full py-28 md:py-36 px-6 md:px-16 bg-background rounded-t-[3rem] -mt-[3rem] relative z-20"
    >
      <div className="max-w-4xl mx-auto">
        <h2 className="font-sans font-bold text-3xl md:text-4xl text-primary mb-4 tracking-tight">
          {heading}
        </h2>
        <p className="font-roboto text-slate/80 text-lg md:text-xl leading-relaxed mb-12">
          {description}
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          {cards.map((card, i) => {
            const Icon = CARD_ICONS[i] || CARD_ICONS[0];
            return (
              <div
                key={card.title + i}
                className="flex flex-col gap-3 p-6 rounded-2xl bg-slate/5 border border-slate/10"
              >
                <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center text-accent">
                  <Icon size={24} />
                </div>
                <h3 className="font-sans font-bold text-lg text-primary">{card.title}</h3>
                <p className="font-roboto text-slate/70 text-sm leading-relaxed">{card.desc}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
