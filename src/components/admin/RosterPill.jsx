import { useHaptics } from '../../hooks/useHaptics';
import { cn } from '../../utils/cn';
import { ROSTER_TYPES } from './constants';

const RosterPill = ({ value, onChange, size = 'md' }) => {
  const haptics = useHaptics();
  const isCompact = size === 'sm';
  return (
    <div className="inline-flex gap-0.5 rounded-xl border border-slate/10 bg-primary/5 p-0.5">
      {ROSTER_TYPES.map((opt) => {
        const active = opt.id === value;
        const style = active
          ? opt.id === 'DEL'
            ? 'bg-red-500 border-red-500/40 text-white shadow-sm'
            : opt.id === 'ALT'
              ? 'bg-blue-500 border-blue-500/40 text-white shadow-sm'
              : 'bg-slate/20 border-slate/20 text-primary'
          : 'border-transparent text-slate/40 hover:text-slate/60 hover:bg-slate/5';
        return (
          <button
            key={opt.id}
            type="button"
            title={opt.title}
            onClick={() => { haptics.light(); if (opt.id !== value) onChange(opt.id); }}
            className={cn(
              'rounded-lg border font-mono font-black transition-all duration-200 active:scale-95',
              isCompact ? 'px-2 py-1 text-[9px]' : 'px-3 py-1.5 text-[10px]',
              style
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
};

export default RosterPill;
