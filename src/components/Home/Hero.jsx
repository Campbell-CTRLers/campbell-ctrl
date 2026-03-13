import React, { useRef, useEffect } from 'react';
import gsap from 'gsap';
import { ScrollToPlugin } from 'gsap/ScrollToPlugin';
import { isMobileUser } from '../../utils/mobile';

gsap.registerPlugin(ScrollToPlugin);

export const Hero = () => {
  const container = useRef(null);

  useEffect(() => {
    let ctx = gsap.context(() => {
      // Intro animation — shorter on mobile for snappier load
      gsap.fromTo('.hero-elem',
        { y: 30, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          stagger: isMobileUser ? 0.02 : 0.05,
          duration: isMobileUser ? 0.4 : 0.8,
          ease: 'power3.out',
          delay: 0,
          clearProps: 'all',
        }
      );

      // Background breathing — desktop only (continuous GPU compositing on mobile)
      if (!isMobileUser) {
        gsap.to('.hero-bg-img', {
          scale: 1.1,
          x: '2%',
          y: '1%',
          duration: 20,
          ease: 'sine.inOut',
          yoyo: true,
          repeat: -1,
        });
      }
    }, container);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={container} className="relative h-[100dvh] w-full flex items-end pb-24 px-6 md:px-16 overflow-hidden custom-hero-bg transition-colors duration-500">
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

      <div className="relative z-10 max-w-4xl flex flex-col items-center text-center gap-2 w-full lg:w-2/3 mx-auto pb-4 md:pb-12">
        <h1 className="flex flex-col items-center gap-0 w-full mb-1">
          <span className="hero-elem font-display font-black text-2xl sm:text-4xl md:text-6xl lg:text-7xl tracking-tight uppercase text-white leading-tight">BEYOND THE GAME</span>
          <span className="hero-elem font-drama italic text-6xl sm:text-7xl md:text-[8rem] lg:text-[10rem] text-accent leading-[0.9] drop-shadow-[0_0_15px_rgba(0,56,168,0.6)] -mt-1 md:-mt-4 uppercase tracking-tighter">Dominate.</span>
        </h1>
        <p className="hero-elem font-roboto text-[16px] sm:text-lg md:text-xl text-primary max-w-[280px] sm:max-w-md md:max-w-2xl leading-relaxed drop-shadow-md px-2 sm:px-0 font-normal transition-all">
          Where other clubs just play, we dominate. Campbell CTRL Gaming Club.
        </p>
        <div className="hero-elem mt-5 md:mt-8">
          <button
            onClick={() => {
              gsap.to(window, {
                scrollTo: { y: '#dashboard-cards', offsetY: 120, autoKill: false },
                duration: 1,
                ease: 'power3.inOut'
              });
            }}
            className="magnetic-btn bg-[#111113] hover:bg-black text-white px-8 py-3.5 rounded-full font-sans font-bold text-sm md:text-base transition-colors shadow-2xl border border-white/5 active:scale-95 touch-manipulation"
          >
            Learn More
          </button>
        </div>
      </div>
    </section>
  );
};
