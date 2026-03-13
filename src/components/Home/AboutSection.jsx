import React from 'react';
import { IconUsersOpen, IconController, IconTrophyAbout } from '../AboutIcons';

export const AboutSection = () => {
  const points = [
    {
      Icon: IconUsersOpen,
      title: 'Open to all',
      desc: 'From complete beginners to varsity competitors. Everyone is welcome.',
    },
    {
      Icon: IconController,
      title: 'Multiple games',
      desc: 'Rocket League, Smash Bros, Splatoon 3, Marvel Rivals, Mario Kart, and more.',
    },
    {
      Icon: IconTrophyAbout,
      title: 'PlayVS competitive',
      desc: 'Official Campbell eSpartans rosters competing in Georgia and PlayVS leagues.',
    },
  ];

  return (
    <section
      id="about-section"
      className="w-full py-20 md:py-28 px-6 md:px-16 bg-background rounded-t-[3rem] -mt-[3rem] relative z-20"
    >
      <div className="max-w-4xl mx-auto">
        <h2 className="font-sans font-bold text-3xl md:text-4xl text-primary mb-4 tracking-tight">
          About the Club
        </h2>
        <p className="font-roboto text-slate/80 text-lg md:text-xl leading-relaxed mb-8">
          Campbell CTRL is Campbell High School&apos;s official esports and gaming club. We practice
          weekly, compete in PlayVS leagues, and represent Campbell at the state level.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          {points.map(({ Icon, title, desc }) => (
            <div
              key={title}
              className="flex flex-col gap-3 p-6 rounded-2xl bg-slate/5 border border-slate/10"
            >
              <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center text-accent">
                <Icon size={24} />
              </div>
              <h3 className="font-sans font-bold text-lg text-primary">{title}</h3>
              <p className="font-roboto text-slate/70 text-sm leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
