import React, { useRef, useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ClubMeetings } from '../components/ClubMeetings';
import { LiveStandings } from '../components/LiveStandings';

// Import extracted Home components
import { Hero } from '../components/Home/Hero';
import { DiagnosticShuffler } from '../components/Home/DiagnosticShuffler';
import { TelemetryTypewriter } from '../components/Home/TelemetryTypewriter';
import { ProtocolSection } from '../components/Home/ProtocolSection';

gsap.registerPlugin(ScrollTrigger);
const TiltCard = ({ children }) => {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia("(max-width: 768px)").matches) return;

    gsap.set(el, { transformPerspective: 1000 });

    const handleMouseMove = (e) => {
      const rect = el.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      const rotateX = ((y - centerY) / centerY) * -10; // Max 10 deg rotation
      const rotateY = ((x - centerX) / centerX) * 10;

      gsap.to(el, { duration: 0.5, rotateX, rotateY, ease: 'power2.out', transformOrigin: 'center center' });
    };

    const handleMouseLeave = () => {
      gsap.to(el, { duration: 1, rotateX: 0, rotateY: 0, ease: 'elastic.out(1, 0.3)' });
    };

    el.addEventListener('mousemove', handleMouseMove);
    el.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      el.removeEventListener('mousemove', handleMouseMove);
      el.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  return <div ref={ref} className="w-full h-full transform-gpu">{children}</div>;
};



const HomeTab = ({ gamesList, standings }) => {
  const container = useRef(null);

  useEffect(() => {
    let ctx = gsap.context(() => {
      const isMobile = window.innerWidth < 768;
      
      if (isMobile) {
        gsap.utils.toArray('.feature-card').forEach(card => {
          gsap.from(card, {
            scrollTrigger: { trigger: card, start: 'top 85%' },
            y: 40, opacity: 0, duration: 0.8, ease: 'power3.out'
          });
        });
      } else {
        gsap.from('.feature-card', {
          scrollTrigger: { trigger: '#dashboard-cards', start: 'top 75%' },
          y: 60, opacity: 0, stagger: 0.15, duration: 1, ease: 'power3.out'
        });
      }

      const texts = gsap.utils.toArray('.phil-text');
      texts.forEach(t => {
        gsap.from(t, { scrollTrigger: { trigger: t, start: 'top 85%' }, y: 30, opacity: 0, duration: 1, ease: 'power3.out' });
      });
      gsap.to('.parallax-bg', { scrollTrigger: { trigger: '.philosophy-section', start: 'top bottom', end: 'bottom top', scrub: true }, y: 100 });
    }, container);
    return () => ctx.revert();
  }, []);

  return (
    <div ref={container} className="w-full">
      <Hero />
      <section id="dashboard-cards" className="py-24 md:py-32 px-6 md:px-16 bg-background rounded-t-[3rem] -mt-[3rem] relative z-20 max-w-7xl mx-auto w-full">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 place-items-center">
          <div className="feature-card w-full sm:h-full" style={{ perspective: '2000px' }}><TiltCard><DiagnosticShuffler /></TiltCard></div>
          <div className="feature-card w-full sm:h-full" style={{ perspective: '2000px' }}><TiltCard><TelemetryTypewriter gamesList={gamesList} /></TiltCard></div>
          <div className="feature-card w-full sm:h-full" style={{ perspective: '2000px' }}><TiltCard><ClubMeetings /></TiltCard></div>
          <div className="feature-card w-full sm:h-full" style={{ perspective: '2000px' }}><TiltCard><LiveStandings standings={standings} /></TiltCard></div>
        </div>
      </section>

      <section className="philosophy-section relative py-40 px-6 md:px-16 custom-phil-bg overflow-hidden flex flex-col items-center justify-center text-center transition-colors duration-500">
        <div className="relative z-10 max-w-5xl">
          <p className="phil-text font-roboto text-lg md:text-xl text-primary/80 mb-10 drop-shadow-sm">
            Other clubs show up. <span className="text-accent font-bold">We show out.</span>
          </p>
          <h2 className="phil-text font-serif italic text-4xl md:text-7xl lg:text-8xl text-primary leading-[1.1] drop-shadow-md px-2">
            Built on <span className="text-accent not-italic font-drama text-shadow">discipline,</span> driven by community, defined by <span className="text-accent underline decoration-1 underline-offset-8">results.</span>
          </h2>
        </div>
      </section>

      <ProtocolSection />
    </div>
  );
};

export default HomeTab;
