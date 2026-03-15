import React, { useEffect, useMemo, useState } from 'react';
import { IconEye, IconEyeOff, IconRotate } from '../icons/SvgIcons';
import { cn } from '../../utils/cn';
import { useHaptics } from '../../hooks/useHaptics';
import HomeTab from '../../pages/HomeTab';
import EsportsTab from '../../pages/EsportsTab';
import MeetingsTab from '../../pages/MeetingsTab';
import LegalTab from '../../pages/LegalTab';
import Navbar from '../Navbar';
import Footer from '../Footer';
import {
  readEditablePosition,
  readEditableStyle,
  readEditableText,
  resetEditableStyleAndPosition,
  resetEditableText,
  updateEditablePosition,
  updateEditableStyle,
  updateEditableText,
} from '../../utils/siteContentEditor';

const MODES = [
  { id: 'select', label: 'Select' },
  { id: 'edit', label: 'Edit Text' },
  { id: 'move', label: 'Move' },
];

const PREVIEW_TABS = [
  { id: 'home', label: 'Home' },
  { id: 'esports', label: 'Esports' },
  { id: 'meetings', label: 'Meetings' },
  { id: 'legal', label: 'Legal' },
];

const NumberField = ({ value, onChange, min, max, step = 1 }) => (
  <input
    type="number"
    value={value}
    min={min}
    max={max}
    step={step}
    onChange={onChange}
    className="w-full bg-slate/5 border border-slate/10 rounded-xl px-3 py-2 font-mono text-xs text-primary focus:outline-none focus:border-accent/40"
  />
);

const AdminContentEditor = ({
  siteContent,
  setSiteContent,
  isMobile = false,
  gamesList = [],
  standings = [],
  rankings = [],
  meetings = [],
  dataLoaded = true,
}) => {
  const haptics = useHaptics();
  const [showPreview, setShowPreview] = useState(!isMobile);
  const [previewTab, setPreviewTab] = useState('home');
  const [mode, setMode] = useState('select');
  const [selectedKey, setSelectedKey] = useState(null);
  const [fallbackText, setFallbackText] = useState('');

  const selectedStyle = selectedKey ? readEditableStyle(siteContent, selectedKey) : {};
  const selectedPosition = selectedKey ? readEditablePosition(siteContent, selectedKey) : { x: 0, y: 0 };
  const selectedFontSize = selectedStyle?.fontSize ?? 16;

  useEffect(() => {
    if (!selectedKey) {
      setFallbackText('');
      return;
    }
    const selector = typeof CSS !== 'undefined' && CSS.escape ? CSS.escape(selectedKey) : selectedKey;
    const node = document.querySelector(`[data-content-key="${selector}"]`);
    setFallbackText(node?.textContent?.trim() || '');
  }, [selectedKey, previewTab, siteContent, mode]);

  const selectedText = selectedKey
    ? readEditableText(siteContent, selectedKey, fallbackText)
    : '';

  const editor = useMemo(() => ({
    enabled: !isMobile,
    mode,
    selectedKey,
    haptics,
    setSelectedKey: (key) => {
      setSelectedKey(key);
      haptics.editSelect?.();
    },
  }), [haptics, isMobile, mode, selectedKey]);

  const updateSelectedFontSize = (value) => {
    if (!selectedKey) return;
    updateEditableStyle(setSiteContent, selectedKey, { fontSize: Number(value) });
  };

  const updateSelectedPosition = (x, y) => {
    if (!selectedKey) return;
    updateEditablePosition(setSiteContent, selectedKey, { x, y });
  };

  const nudgeSelected = (dx, dy) => {
    if (!selectedKey) return;
    haptics.soft();
    updateSelectedPosition(
      Number(selectedPosition.x || 0) + dx,
      Number(selectedPosition.y || 0) + dy
    );
  };

  const renderPreviewTab = () => {
    if (previewTab === 'home') {
      return (
        <HomeTab
          gamesList={gamesList}
          standings={standings}
          rankings={rankings}
          meetings={meetings}
          siteContent={siteContent}
          setSiteContent={setSiteContent}
          contentEditor={editor}
          dataLoaded={dataLoaded}
          onNavigateToEsports={() => setPreviewTab('esports')}
        />
      );
    }
    if (previewTab === 'esports') {
      return (
        <EsportsTab
          gamesList={gamesList}
          standings={standings}
          rankings={rankings}
          dataLoaded={dataLoaded}
          siteContent={siteContent}
          setSiteContent={setSiteContent}
          contentEditor={editor}
        />
      );
    }
    if (previewTab === 'meetings') {
      return (
        <MeetingsTab
          meetings={meetings}
          siteContent={siteContent}
          setSiteContent={setSiteContent}
          contentEditor={editor}
        />
      );
    }
    return (
      <LegalTab
        siteContent={siteContent}
        setSiteContent={setSiteContent}
        contentEditor={editor}
      />
    );
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h3 className="font-sans font-black text-lg sm:text-2xl text-primary italic uppercase tracking-tighter">Site Content</h3>
        <button
          onClick={() => { haptics.toggle?.(); setShowPreview(!showPreview); }}
          className="flex items-center gap-2 text-accent bg-accent/5 px-4 py-2 rounded-xl text-[10px] font-mono font-black border border-accent/20 hover:bg-accent hover:text-white transition-all"
        >
          {showPreview ? <IconEyeOff size={14} /> : <IconEye size={14} />}
          {showPreview ? 'HIDE PREVIEW' : 'SHOW PREVIEW'}
        </button>
      </div>

      <p className="font-sans text-sm text-slate/60 -mt-2">
        Edit text directly in live preview. Typography and movement apply only on desktop.
      </p>

      <div className={cn("grid gap-8", showPreview ? "xl:grid-cols-[340px_1fr]" : "grid-cols-1")}>
        <div className="bg-slate/[0.03] rounded-2xl border border-slate/10 p-5 flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <span className="font-mono text-[9px] font-bold text-accent uppercase tracking-[0.2em]">Interaction Mode</span>
            <div className="grid grid-cols-3 gap-2">
              {MODES.map((item) => (
                <button
                  key={item.id}
                  onClick={() => { setMode(item.id); haptics.tabSwitch?.(); }}
                  className={cn(
                    "min-h-[38px] rounded-xl border font-mono text-[10px] font-bold uppercase tracking-wider transition-all",
                    mode === item.id
                      ? "border-accent bg-accent/10 text-accent"
                      : "border-slate/10 bg-background text-slate/60 hover:text-primary"
                  )}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <span className="font-mono text-[9px] font-bold text-accent uppercase tracking-[0.2em]">Preview Page</span>
            <div className="flex flex-wrap gap-2">
              {PREVIEW_TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => { setPreviewTab(tab.id); haptics.selection(); }}
                  className={cn(
                    "px-3 py-2 rounded-xl border text-[10px] font-mono font-bold uppercase tracking-wider transition-all",
                    previewTab === tab.id
                      ? "border-accent bg-accent/10 text-accent"
                      : "border-slate/10 bg-background text-slate/60 hover:text-primary"
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {isMobile ? (
            <div className="rounded-2xl bg-amber-500/10 border border-amber-500/20 p-4">
              <p className="font-sans text-xs text-amber-700 leading-relaxed">
                Desktop editing tools are disabled on mobile. Use a desktop viewport to edit and move elements.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[9px] font-bold text-accent uppercase tracking-[0.2em]">Selected Element</span>
                {selectedKey && (
                  <button
                    onClick={() => { setSelectedKey(null); haptics.soft(); }}
                    className="text-[9px] font-mono font-bold text-slate/50 hover:text-primary"
                  >
                    CLEAR
                  </button>
                )}
              </div>

              <div className="bg-background border border-slate/10 rounded-2xl p-4 flex flex-col gap-3">
                <p className="font-mono text-[10px] text-slate/50 break-all">{selectedKey || 'No element selected'}</p>

                {selectedKey ? (
                  <>
                    <div className="flex flex-col gap-1.5">
                      <label className="font-sans text-xs font-bold text-primary">Text</label>
                      <textarea
                        value={selectedText}
                        onChange={(e) => { updateEditableText(setSiteContent, selectedKey, e.target.value); haptics.editType?.(); }}
                        rows={3}
                        className="w-full bg-slate/5 border border-slate/10 rounded-xl px-3 py-2 font-sans text-sm text-primary focus:outline-none focus:border-accent/40 resize-none"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="font-sans text-xs font-bold text-primary">Font Size (desktop)</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="range"
                          min={10}
                          max={96}
                          value={selectedFontSize}
                          onChange={(e) => updateSelectedFontSize(e.target.value)}
                          className="flex-1 accent-accent"
                        />
                        <div className="w-16">
                          <NumberField value={selectedFontSize} min={10} max={120} onChange={(e) => updateSelectedFontSize(e.target.value)} />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="flex flex-col gap-1.5">
                        <label className="font-sans text-xs font-bold text-primary">X Offset</label>
                        <NumberField
                          value={selectedPosition.x}
                          min={-500}
                          max={500}
                          onChange={(e) => updateSelectedPosition(Number(e.target.value), selectedPosition.y)}
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="font-sans text-xs font-bold text-primary">Y Offset</label>
                        <NumberField
                          value={selectedPosition.y}
                          min={-500}
                          max={500}
                          onChange={(e) => updateSelectedPosition(selectedPosition.x, Number(e.target.value))}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <button onClick={() => nudgeSelected(0, -1)} className="rounded-xl border border-slate/10 bg-slate/5 py-2 text-xs font-mono font-bold">UP</button>
                      <button onClick={() => nudgeSelected(-1, 0)} className="rounded-xl border border-slate/10 bg-slate/5 py-2 text-xs font-mono font-bold">LEFT</button>
                      <button onClick={() => nudgeSelected(1, 0)} className="rounded-xl border border-slate/10 bg-slate/5 py-2 text-xs font-mono font-bold">RIGHT</button>
                      <button onClick={() => nudgeSelected(0, 1)} className="rounded-xl border border-slate/10 bg-slate/5 py-2 text-xs font-mono font-bold">DOWN</button>
                      <button
                        onClick={() => { resetEditableStyleAndPosition(setSiteContent, selectedKey); haptics.warning(); }}
                        className="rounded-xl border border-amber-500/30 bg-amber-500/10 py-2 text-[10px] font-mono font-bold text-amber-700 uppercase"
                      >
                        Reset Style
                      </button>
                      <button
                        onClick={() => { resetEditableText(setSiteContent, selectedKey); haptics.warning(); }}
                        className="rounded-xl border border-slate/20 bg-slate/10 py-2 text-[10px] font-mono font-bold text-slate uppercase"
                      >
                        Reset Text
                      </button>
                    </div>
                  </>
                ) : (
                  <p className="font-sans text-xs text-slate/60">
                    Select text in preview, then edit here or type directly inline in preview mode.
                  </p>
                )}
              </div>
            </div>
          )}

          <button
            onClick={() => {
              if (!selectedKey) return;
              resetEditableStyleAndPosition(setSiteContent, selectedKey);
              haptics.warning();
            }}
            disabled={!selectedKey}
            className={cn(
              "flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-[10px] font-mono font-black border transition-all",
              selectedKey ? "text-accent bg-accent/5 border-accent/20 hover:bg-accent hover:text-white" : "text-slate/40 bg-slate/5 border-slate/10 cursor-not-allowed"
            )}
          >
            <IconRotate size={12} />
            RESET SELECTED POSITION + SIZE
          </button>
        </div>

        {showPreview && (
          <div className="min-h-[70vh] rounded-2xl border border-slate/10 bg-slate/[0.02] overflow-hidden">
            <div className="px-4 py-2 border-b border-slate/10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <IconEye size={12} className="text-accent" />
                <span className="font-mono text-[9px] font-bold text-accent uppercase tracking-[0.2em]">Full Site Live Preview</span>
              </div>
            </div>
            <div onClick={() => setSelectedKey(null)} className="max-h-[calc(100vh-16rem)] overflow-y-auto custom-scrollbar">
              <Navbar
                currentTab={previewTab}
                onNavigate={(tab) => {
                  if (PREVIEW_TABS.some((t) => t.id === tab)) setPreviewTab(tab);
                }}
                siteContent={siteContent}
                setSiteContent={setSiteContent}
                contentEditor={editor}
                previewStatic
              />
              {renderPreviewTab()}
              <Footer
                onToggleAdmin={() => {}}
                onNavigate={(tab) => {
                  if (PREVIEW_TABS.some((t) => t.id === tab)) setPreviewTab(tab);
                }}
                siteContent={siteContent}
                setSiteContent={setSiteContent}
                contentEditor={editor}
                hideAdminStatus
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminContentEditor;
