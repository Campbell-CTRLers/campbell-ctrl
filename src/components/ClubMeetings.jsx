import React, { useRef, useState, useEffect } from 'react';
import gsap from 'gsap';
import { useTheme } from '../context/useTheme';
import { useMobile } from '../hooks/useMobile';
import { CalendarModal } from './CalendarModal';
import { cn } from '../utils/cn';

export function ClubMeetings() {
  const container = useRef(null);
  const [popupOpen, setPopupOpen] = useState(false);
  const { theme } = useTheme();
  const { isMobile } = useMobile();

  useEffect(() => {
    if (isMobile) return; // Skip all animations on mobile

    let ctx;

    const buildAnimation = () => {
      if (ctx) ctx.revert();

      ctx = gsap.context(() => {
        gsap.from('.time-badge', { y: 15, opacity: 0, duration: 0.6, ease: 'back.out(1.7)', delay: 0.2 });
        gsap.from('.time-display', { y: 20, opacity: 0, scale: 0.9, duration: 0.8, ease: 'back.out(1.7)', delay: 0.4 });
        gsap.from('.time-location', { y: 10, opacity: 0, duration: 0.5, ease: 'power3.out', delay: 0.7 });

        gsap.to('.time-display', { 
          scale: 1.02, 
          opacity: 0.9,
          duration: 2, 
          ease: 'sine.inOut', 
          yoyo: true, 
          repeat: -1, 
          delay: 1.5 
        });

        const tl = gsap.timeline({ repeat: -1, repeatDelay: 2 });

        setTimeout(() => {
          const svg = container.current.querySelector('.cursor-svg');
          const fridayCell = container.current.querySelector('.day-fri');
          const saveBtn = container.current.querySelector('.btn-save');

          if (!svg || !fridayCell || !saveBtn) return;

          const containerRect = container.current.getBoundingClientRect();
          const svgRect = svg.getBoundingClientRect();
          const friRect = fridayCell.getBoundingClientRect();
          const btnRect = saveBtn.getBoundingClientRect();

          const target1X = (friRect.left - containerRect.left) + (friRect.width / 2) - (svgRect.left - containerRect.left);
          const target1Y = (friRect.top - containerRect.top) + (friRect.height / 2) - (svgRect.top - containerRect.top);

          const target2X = (btnRect.left - containerRect.left) + (btnRect.width / 2) - (svgRect.left - containerRect.left);
          const target2Y = (btnRect.top - containerRect.top) + (btnRect.height / 2) - (svgRect.top - containerRect.top);

          tl.set('.cursor-svg', { x: 0, y: 0, opacity: 0, scale: 1 })
            .to('.cursor-svg', { opacity: 1, duration: 0.3 })
            .to('.cursor-svg', { x: target1X, y: target1Y, duration: 1, ease: 'power3.inOut' })
            .to('.cursor-svg', { scale: 0.7, duration: 0.1, yoyo: true, repeat: 1 })
            .to('.day-fri', { 
              backgroundColor: 'rgb(var(--color-campbell))', 
              color: 'white', 
              scale: 1.1,
              duration: 0.15,
              yoyo: true,
              repeat: 1
            }, '-=0.15')
            .to('.day-fri', { 
              backgroundColor: 'rgb(var(--color-campbell))', 
              color: 'white',
              duration: 0.2
            }, '-=0.05')
            .add('moveToBtn', '+=0.6')
            .to('.cursor-svg', { x: target2X, y: target2Y, duration: 0.8, ease: 'power3.inOut' }, 'moveToBtn')
            .to('.cursor-svg', { scale: 0.7, duration: 0.1, yoyo: true, repeat: 1 }, 'moveToBtn+=0.75')
            .to('.btn-save', { 
              backgroundColor: '#002D86', // Darker blue on click
              color: 'white',
              scale: 0.92,
              duration: 0.15 
            }, 'moveToBtn+=0.75')
            .to('.btn-save', { 
              scale: 1,
              duration: 0.2 
            }, 'moveToBtn+=0.9')
            .add('fadeout', '+=1.2')
            .to('.cursor-svg', { opacity: 0, scale: 0.5, duration: 0.4, ease: 'power2.in' }, 'fadeout')
            .to('.btn-save', { backgroundColor: '', color: '', scale: 1, duration: 0.4 }, 'fadeout')
            .to('.day-fri', { backgroundColor: '', color: '', scale: 1, duration: 0.4 }, 'fadeout');
        }, 100);
      }, container);
    };

    buildAnimation();

    let resizeTimer;
    const handleResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(buildAnimation, 250);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (ctx) ctx.revert();
    };
  }, [theme, isMobile]);

  const days = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  return (
    <div ref={container} className="bg-background rounded-[2rem] p-8 border border-slate/10 shadow-xl flex flex-col h-[380px] justify-between relative group">
      <div>
        <h3 className="font-sans font-bold text-2xl text-primary mb-1">Club Meetings</h3>
        <p className="font-roboto text-slate/80 text-sm">Every week in the Learning Commons.</p>
      </div>

      <div className="flex flex-col items-center gap-4 my-auto">
        <div className="time-badge bg-accent/10 border border-accent/20 rounded-full px-5 py-1.5">
          <span className="font-mono text-sm font-bold text-accent tracking-widest uppercase">Fridays</span>
        </div>

        <div className="time-display flex items-center gap-3">
          <span className="font-roboto font-bold text-4xl text-primary tracking-tight">3:30</span>
          <div className="w-4 h-[2px] bg-slate/20 rounded-full" />
          <span className="font-roboto font-bold text-4xl text-primary tracking-tight">5:30</span>
          <span className="font-mono text-sm text-slate/60 mt-2">PM</span>
        </div>

        <div className="time-location flex items-center gap-1.5 text-slate/50">
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" /><circle cx="12" cy="10" r="3" /></svg>
          <span className="font-roboto text-xs">Learning Commons</span>
        </div>
      </div>

      <div className="relative">
        <svg className="cursor-svg absolute z-20 w-6 h-6 text-primary pointer-events-none drop-shadow-md hidden sm:block" viewBox="0 0 24 24" fill="currentColor">
          <path d="M4 4l5.3 16.5c.2.6.9.8 1.4.4l3.8-3.3 4.2 4.2c.4.4 1 .4 1.4 0l1.4-1.4c.4-.4.4-1 0-1.4l-4.2-4.2 3.3-3.8c.4-.5.2-1.2-.4-1.4L4 4z" />
        </svg>
        <div className="grid grid-cols-7 gap-2 mb-3">
          {days.map((d, i) => (
            <div key={i} className={cn("w-full aspect-square rounded-md border border-slate/20 flex items-center justify-center font-mono text-xs text-slate", i === 5 ? "day-fri" : "")}>
              {d}
            </div>
          ))}
        </div>
        <button
          onClick={() => setPopupOpen(o => !o)}
          className="btn-save bg-[#0038A8] text-white w-full sm:w-auto px-5 py-3.5 sm:py-2.5 rounded-full font-roboto text-sm sm:text-xs font-bold uppercase tracking-wider block shadow-lg shadow-[#0038A8]/20 hover:shadow-[#0038A8]/40 transition-shadow duration-300"
        >
          Save Schedule
        </button>
      </div>
      <CalendarModal open={popupOpen} onClose={() => setPopupOpen(false)} />
    </div>
  );
}
