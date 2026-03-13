import { IconInstagram, IconDiscord } from './icons/SvgIcons';
import { useHaptics } from '../hooks/useHaptics';

const Footer = ({ onToggleAdmin, onNavigate }) => {
  const haptics = useHaptics();
  const navTo = (tab) => {
    haptics.selection();
    onNavigate(tab);
    window.scrollTo(0, 0);
  };
  return (
    <footer className="bg-[#0A0A0A] text-white rounded-t-[4rem] px-8 py-16 md:py-24 mt-20 relative z-20">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between gap-16">
        <div className="flex flex-col items-center md:items-start gap-6 w-full md:w-1/2 text-center md:text-left">
          <div className="flex items-center gap-3">
            <img src="/logo-transparent.png" alt="Campbell High Esports" className="h-12 sm:h-16 w-fit object-contain brightness-0 invert opacity-90" onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'block'; }} />
          </div>
          <p className="font-roboto text-white/80 max-w-sm drop-shadow-md mx-auto md:mx-0">
            The official home of Campbell High Esports. Updates, schedules, standings, and more.
          </p>
          <div className="flex flex-col items-center md:items-start mt-4 mx-auto md:mx-0 w-fit">
            <span className="font-roboto text-[10px] text-white/40 uppercase tracking-widest pb-2 border-b border-white/20">Our Socials</span>
            <div className="flex items-center gap-3 pt-2">
              <a href="https://discord.gg/HZ2bQsmaSK" target="_blank" rel="noreferrer"
                onClick={() => haptics.light()}
                className="min-w-[44px] min-h-[44px] flex items-center justify-center p-3 sm:p-2 text-white/50 hover:text-white rounded-full hover:bg-white/5 transition-colors touch-manipulation active:scale-95"
                aria-label="Join our Discord">
                <IconDiscord size={20} />
              </a>
              <a href="https://www.instagram.com/espartansgaming?igsh=eHRsamx3MnFxc2Ft" target="_blank" rel="noreferrer"
                onClick={() => haptics.light()}
                className="min-w-[44px] min-h-[44px] flex items-center justify-center p-3 sm:p-2 text-white/50 hover:text-white rounded-full hover:bg-white/5 transition-colors touch-manipulation active:scale-95"
                aria-label="Follow us on Instagram">
                <IconInstagram size={20} />
              </a>
            </div>
          </div>
        </div>

        <div className="flex gap-16 md:gap-24 justify-center md:justify-start">
          <div className="flex flex-col gap-4 font-roboto text-sm items-center md:items-start">
            <h4 className="text-accent font-bold mb-2 uppercase tracking-widest text-xs text-center md:text-left">Navigation</h4>
            <button onClick={() => navTo('home')} className="footer-link text-center md:text-left text-white/70 hover:text-white hover:bg-white/10 min-h-[44px] sm:min-h-0 px-4 py-3 sm:px-3 sm:py-1.5 rounded-full transition-all duration-200 w-fit touch-manipulation active:scale-[0.98]">Home</button>
            <button onClick={() => navTo('esports')} className="footer-link text-center md:text-left text-white/70 hover:text-white hover:bg-white/10 min-h-[44px] sm:min-h-0 px-4 py-3 sm:px-3 sm:py-1.5 rounded-full transition-all duration-200 w-fit touch-manipulation active:scale-[0.98]">Esports</button>
            <button onClick={() => navTo('meetings')} className="footer-link text-center md:text-left text-white/70 hover:text-white hover:bg-white/10 min-h-[44px] sm:min-h-0 px-4 py-3 sm:px-3 sm:py-1.5 rounded-full transition-all duration-200 w-fit touch-manipulation active:scale-[0.98]">Meetings</button>
          </div>
          <div className="flex flex-col gap-4 font-roboto text-sm items-center md:items-start">
            <h4 className="text-accent font-bold mb-2 uppercase tracking-widest text-xs text-center md:text-left">Legal</h4>
            <button onClick={() => navTo('legal')} className="footer-link text-center md:text-left text-white/70 hover:text-white hover:bg-white/10 min-h-[44px] sm:min-h-0 px-4 py-3 sm:px-3 sm:py-1.5 rounded-full transition-all duration-200 w-fit touch-manipulation active:scale-[0.98]">Privacy Policy</button>
            <button onClick={() => navTo('legal')} className="footer-link text-center md:text-left text-white/70 hover:text-white hover:bg-white/10 min-h-[44px] sm:min-h-0 px-4 py-3 sm:px-3 sm:py-1.5 rounded-full transition-all duration-200 w-fit touch-manipulation active:scale-[0.98]">Terms of Service</button>
          </div>
        </div>
      </div>
      <div className="max-w-7xl mx-auto mt-24 pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="font-roboto text-xs text-white/40 text-center md:text-left">© {new Date().getFullYear()} Campbell High Esports.</div>
        <button
          onClick={() => {
            haptics.medium();
            onToggleAdmin();
          }}
          className="flex items-center justify-center gap-3 min-h-[44px] px-5 py-3 sm:px-4 sm:py-2 bg-white/5 rounded-full border border-white/10 hover:bg-white/10 transition-colors touch-manipulation active:scale-95 mx-auto md:mx-0"
        >
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
          <span className="font-roboto text-xs text-white/80 tracking-widest uppercase text-center">System Operational</span>
        </button>
      </div>
    </footer>
  );
};

export default Footer;
