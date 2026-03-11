import React, { useRef, useEffect, useState } from 'react';
import gsap from 'gsap';
import { Calendar, MonitorPlay, Users } from 'lucide-react';
import { ClubMeetings } from '../components/ClubMeetings';
import { CalendarModal } from '../components/CalendarModal';
import MagneticGlowButton from '../ui/MagneticGlowButton';

const MeetingsTab = () => {
  const container = useRef(null);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  useEffect(() => {
    let ctx = gsap.context(() => {
      gsap.from('.tab-header', { y: 20, opacity: 0, duration: 0.8, ease: 'power3.out', delay: 0.1 });
      gsap.from('.meetings-card', { y: 40, opacity: 0, stagger: 0.1, duration: 0.8, ease: 'power3.out', delay: 0.3 });
    }, container);
    window.scrollTo(0, 0); // Reset scroll
    return () => ctx.revert();
  }, []);

  return (
    <div ref={container} className="pt-32 pb-24 px-6 md:px-16 max-w-7xl mx-auto min-h-screen">
      <div className="tab-header mb-16">
        <h1 className="font-sans font-bold text-5xl md:text-7xl text-primary tracking-tighter mb-4">Club <span className="text-accent font-drama italic">Meetings.</span></h1>
        <p className="font-roboto text-slate/80 text-lg max-w-2xl">Where the community comes together. We practice, discuss strategies, and hang out every week after school.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="meetings-card bg-contrast-bg text-contrast-text rounded-[3rem] p-10 md:p-14 relative overflow-hidden shadow-2xl flex flex-col justify-center">
          <div className="absolute top-0 right-0 w-64 h-64 bg-accent/20 rounded-full blur-[80px] -mr-20 -mt-20"></div>

          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-contrast-text/10 border border-contrast-text/20 font-mono text-xs text-contrast-text/80 mb-8">
              <Calendar size={14} /> EVERY WEEK
            </div>
            <h2 className="font-sans font-bold text-4xl md:text-5xl mb-6">Friday Sessions</h2>

            <div className="flex flex-col gap-6 font-sans">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-background/5 border border-background/10 flex items-center justify-center shrink-0 mt-1">
                  <Calendar className="text-accent" size={18} />
                </div>
                <div>
                  <h4 className="font-roboto font-bold text-lg">Time</h4>
                  <p className="font-roboto text-contrast-text/70 leading-relaxed">3:30 PM – 5:30 PM directly after school.</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-background/5 border border-background/10 flex items-center justify-center shrink-0 mt-1">
                  <MonitorPlay className="text-accent" size={18} />
                </div>
                <div>
                  <h4 className="font-roboto font-bold text-lg">Location</h4>
                  <p className="font-roboto text-contrast-text/70 leading-relaxed">The Learning Commons (Library). Follow the glow of monitors.</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-background/5 border border-background/10 flex items-center justify-center shrink-0 mt-1">
                  <Users className="text-accent" size={18} />
                </div>
                <div>
                  <h4 className="font-roboto font-bold text-lg">Who can join?</h4>
                  <p className="font-roboto text-contrast-text/70 leading-relaxed">Anyone from complete beginners to varsity level competitors.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="meetings-card flex flex-col gap-8">
          <ClubMeetings />

          <div className="bg-background rounded-[2rem] p-8 border border-slate/10 shadow-xl flex flex-col items-center justify-center gap-6 text-center">
            <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center text-accent">
              <Calendar size={24} />
            </div>
            <div>
              <h3 className="font-sans font-bold text-xl text-primary mb-1">Add to Calendar</h3>
              <p className="font-roboto text-sm text-slate px-4">Keep the full recurring schedule updated on your devices.</p>
            </div>
            <MagneticGlowButton 
              onClick={() => setIsCalendarOpen(true)}
              solid
              className="w-full max-w-[260px] shadow-2xl shadow-campbell/30 hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              Add to Calendar
            </MagneticGlowButton>
          </div>
        </div>
      </div>
      <CalendarModal open={isCalendarOpen} onClose={() => setIsCalendarOpen(false)} />
    </div>
  );
};

export default MeetingsTab;
