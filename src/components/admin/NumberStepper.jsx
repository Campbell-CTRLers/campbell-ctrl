import { IconChevronDown, IconChevronUp } from '../icons/SvgIcons';
import { useHaptics } from '../../hooks/useHaptics';
import { cn } from '../../utils/cn';

const NumberStepper = ({ value, onChange, label, color = 'accent' }) => {
  const haptics = useHaptics();
  const inc = () => {
    haptics.selection();
    const newVal = (Number(value) || 0) + 1;
    onChange({ target: { value: newVal } });
  };
  const dec = () => {
    haptics.selection();
    const newVal = Math.max(0, (Number(value) || 0) - 1);
    onChange({ target: { value: newVal } });
  };

  const bgClass = color === 'green' ? 'bg-green-500/10 border-green-500/20' : color === 'red' ? 'bg-red-500/10 border-red-500/20' : 'bg-accent/10 border-accent/20';
  const textClass = color === 'green' ? 'text-green-600' : color === 'red' ? 'text-red-500' : 'text-accent';

  return (
    <div className="flex flex-col items-center gap-1.5 font-sans">
      {label && <span className="text-[10px] font-mono font-bold text-slate/40 uppercase tracking-widest">{label}</span>}
      <div className={cn("flex items-center gap-2 p-1.5 rounded-2xl border bg-background shadow-sm transition-all hover:shadow-md", bgClass)}>
        <button
          type="button"
          onClick={dec}
          className="w-8 h-8 flex items-center justify-center rounded-xl bg-slate/5 hover:bg-slate/10 text-slate/60 hover:text-primary transition-all active:scale-90"
        >
          <IconChevronDown size={14} />
        </button>
        <div className={cn("w-10 text-center font-mono font-bold text-lg select-none", textClass)}>
          {value}
        </div>
        <button
          type="button"
          onClick={inc}
          className="w-8 h-8 flex items-center justify-center rounded-xl bg-slate/5 hover:bg-slate/10 text-slate/60 hover:text-primary transition-all active:scale-90"
        >
          <IconChevronUp size={14} />
        </button>
      </div>
    </div>
  );
};

export default NumberStepper;
