import React, { useRef, useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { MonitorPlay, Gamepad2, ShieldAlert } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

export const ProtocolSection = () => {
  const container = useRef(null);

  useEffect(() => {
    let ctx = gsap.context(() => {
      const isMobile = window.innerWidth < 768;
      
      if (isMobile) {
        gsap.utils.toArray('.protocol-step-card').forEach(card => {
          gsap.fromTo(card,
            { y: 50, opacity: 0 },
            {
              scrollTrigger: { trigger: card, start: 'top 85%', once: true },
              y: 0, opacity: 1, duration: 0.7, ease: 'power3.out', clearProps: 'all'
            }
          );
        });
      } else {
        gsap.fromTo('.protocol-step-card',
          { y: 50, opacity: 0 },
          {
            scrollTrigger: { trigger: container.current, start: 'top 85%', once: true },
            y: 0, opacity: 1, stagger: 0.15, duration: 0.8, ease: 'power3.out', clearProps: 'all'
          }
        );
      }
    }, container);
    return () => ctx.revert();
  }, []);

  const protocols = [
    { num: '01', title: 'Connect', desc: 'Hop in the Discord, pick your game, and find your squad.', Icon: MonitorPlay },
    { num: '02', title: 'Compete', desc: 'Get on the roster and start repping Campbell in PlayVS.', Icon: Gamepad2 },
    { num: '03', title: 'Conquer', desc: 'Show up Fridays, run scrims, study the matchups, and win.', Icon: ShieldAlert }
  ];

  return (
    <section ref={container} className="py-24 px-6 md:px-16 bg-background relative overflow-hidden">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {protocols.map((p, i) => (
            <div 
              key={i} 
              onMouseMove={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                e.currentTarget.style.setProperty('--mouse-x', `${e.clientX - rect.left}px`);
                e.currentTarget.style.setProperty('--mouse-y', `${e.clientY - rect.top}px`);
              }}
              className="protocol-step-card interactive-hover bg-background rounded-[2rem] p-8 border border-slate/10 shadow-xl flex flex-col group relative overflow-hidden transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl hover:border-accent/30"
            >
              {/* Cursor Glow Overlay */}
              <div 
                className="absolute inset-0 z-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                style={{
                  background: `radial-gradient(400px circle at var(--mouse-x, 0px) var(--mouse-y, 0px), rgba(var(--color-accent), 0.1), transparent 80%)`
                }}
              />

              {/* Background Giant Number */}
              <div className="absolute top-0 right-0 p-6 opacity-[0.03] font-mono text-9xl font-bold text-primary translate-x-4 -translate-y-4 group-hover:scale-110 group-hover:text-accent transition-all duration-700 pointer-events-none">
                {p.num}
              </div>
              
              {/* Icon Container */}
              <div className="w-16 h-16 rounded-2xl bg-slate/5 flex items-center justify-center text-primary mb-12 group-hover:bg-accent group-hover:text-background group-hover:scale-110 transition-all duration-500 relative z-10 shadow-sm">
                <p.Icon size={32} />
              </div>
              
              {/* Text Content */}
              <div className="relative z-10 mt-auto">
                <span className="font-mono text-accent text-sm font-bold mb-2 block tracking-wider">STEP {p.num}</span>
                <h3 className="font-display font-bold text-2xl text-primary mb-3 tracking-tight">{p.title}</h3>
                <p className="font-roboto text-slate/80 leading-relaxed text-[15px]">{p.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
