import { forwardRef } from 'react';
import { AlertTriangle } from 'lucide-react';

const AdminSafetySheet = forwardRef(({ onDiscard, onKeepEditing, onBackdropClick }, ref) => (
  <div
    className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4"
    onClick={onBackdropClick}
  >
    <div
      ref={ref}
      className="w-full sm:max-w-sm bg-background border-t sm:border border-slate/15 rounded-t-[3rem] sm:rounded-[2.5rem] p-8 pb-[calc(3rem+env(safe-area-inset-bottom,0px))] sm:pb-10 flex flex-col items-center gap-6 shadow-2xl relative"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="w-12 h-1.5 bg-slate/10 rounded-full mb-2 sm:hidden" />
      <div className="w-16 h-16 bg-red-500/10 rounded-3xl flex items-center justify-center text-red-500">
        <AlertTriangle size={32} />
      </div>
      <div className="text-center">
        <h3 className="font-sans font-black text-xl italic uppercase tracking-tighter leading-none mb-2">Unsaved Data Alert</h3>
        <p className="font-sans text-slate/50 text-xs px-4">Changes were detected. Discarding will permanently erase local buffer.</p>
      </div>
      <div className="flex flex-col w-full gap-3">
        <button onClick={onDiscard} className="w-full bg-red-500 text-white font-black py-4 rounded-2xl shadow-lg shadow-red-500/20 active:scale-95 transition-all italic tracking-tighter uppercase text-sm">Discard & Exit</button>
        <button onClick={onKeepEditing} className="w-full bg-slate/5 text-slate font-black py-4 rounded-2xl active:scale-95 transition-all uppercase text-sm tracking-tighter">Keep Editing</button>
      </div>
    </div>
  </div>
));

AdminSafetySheet.displayName = 'AdminSafetySheet';

export default AdminSafetySheet;
