import React, { useEffect, useState } from 'react';
import { EditableSiteText } from '../content/EditableSiteText';

export const Hero = ({ content, siteContent = null, setSiteContent, contentEditor }) => {
  const [visible, setVisible] = useState(false);

  const line1 = content?.line1 || 'Campbell CTRL';
  const line2 = content?.line2 || 'eSpartans';
  const description = content?.description || "Campbell High School\u2019s official esports and gaming club.";
  const buttonText = content?.buttonText || 'Learn More';

  useEffect(() => {
    const t = requestAnimationFrame(() => requestAnimationFrame(() => setVisible(true)));
    return () => cancelAnimationFrame(t);
  }, []);

  const scrollToContent = () => {
    document.getElementById('about-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <section className="relative h-[100dvh] w-full flex items-end pb-24 px-6 md:px-16 overflow-hidden custom-hero-bg transition-colors duration-500">
      <div className="absolute inset-0 w-full h-full z-0">
        <img
          src="https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=2000&auto=format&fit=crop"
          alt="Esports Arena Gaming Setup"
          fetchPriority="high"
          loading="eager"
          className="hero-bg-img w-full h-full object-cover origin-center custom-hero-img transition-all duration-500"
        />
        <div className="absolute inset-0 custom-hero-gradient transition-all duration-500"></div>
      </div>

      <div
        className={`relative z-10 max-w-4xl flex flex-col items-center text-center gap-2 w-full lg:w-2/3 mx-auto pb-4 md:pb-12 transition-opacity duration-700 ease-out ${
          visible ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <h1 className="flex flex-col items-center gap-0 w-full mb-1">
          <EditableSiteText as="span" contentKey="hero.line1" fallback={line1} siteContent={siteContent} setSiteContent={setSiteContent} editor={contentEditor} className="font-display font-black text-2xl sm:text-4xl md:text-6xl lg:text-7xl tracking-tight uppercase text-white leading-tight" />
          <EditableSiteText as="span" contentKey="hero.line2" fallback={line2} siteContent={siteContent} setSiteContent={setSiteContent} editor={contentEditor} className="font-drama italic text-6xl sm:text-7xl md:text-[8rem] lg:text-[10rem] text-accent leading-[0.9] drop-shadow-[0_0_15px_rgba(0,56,168,0.6)] -mt-1 md:-mt-4 tracking-tighter" />
        </h1>
        <EditableSiteText as="p" contentKey="hero.description" fallback={description} siteContent={siteContent} setSiteContent={setSiteContent} editor={contentEditor} className="font-roboto text-[16px] sm:text-lg md:text-xl text-primary max-w-[280px] sm:max-w-md md:max-w-2xl leading-relaxed drop-shadow-md px-2 sm:px-0 font-normal transition-all" />
        <div className="mt-5 md:mt-8">
          <button
            onClick={scrollToContent}
            className="bg-[#111113] hover:bg-black text-white px-8 py-3.5 rounded-full font-sans font-bold text-sm md:text-base transition-opacity shadow-lg border border-white/5 active:opacity-90 touch-manipulation"
          >
            <EditableSiteText as="span" contentKey="hero.buttonText" fallback={buttonText} siteContent={siteContent} setSiteContent={setSiteContent} editor={contentEditor} />
          </button>
        </div>
      </div>
    </section>
  );
};
