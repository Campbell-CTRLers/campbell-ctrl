import React, { useMemo, useState } from 'react';
import { IconRotate } from '../icons/SvgIcons';
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
  { id: 'edit', label: 'Edit' },
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
    className="w-full bg-slate/5 border border-slate/10 rounded-xl px-2.5 py-2 font-mono text-xs text-primary focus:outline-none focus:border-accent/40"
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
  const [previewTab, setPreviewTab] = useState('home');
  const [mode, setMode] = useState('select');
  const [selectedKey, setSelectedKey] = useState(null);
  const [selectedFallbackText, setSelectedFallbackText] = useState('');

  const selectedStyle = selectedKey ? readEditableStyle(siteContent, selectedKey) : {};
  const selectedPosition = selectedKey ? readEditablePosition(siteContent, selectedKey) : { x: 0, y: 0 };
  const selectedFontSize = selectedStyle?.fontSize ?? 16;
  const selectedText = selectedKey
    ? readEditableText(siteContent, selectedKey, selectedFallbackText)
    : '';

  const editor = useMemo(() => ({
    enabled: !isMobile,
    mode,
    selectedKey,
    haptics,
    setSelectedKey: (key, currentText = '') => {
      setSelectedKey(key);
      setSelectedFallbackText(currentText || '');
      haptics.editSelect?.();
    },
  }), [haptics, isMobile, mode, selectedKey]);

  const clearSelection = () => {
    setSelectedKey(null);
    setSelectedFallbackText('');
    haptics.soft();
  };

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

  if (isMobile) {
    return (
      <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-6">
        <p className="font-sans text-sm text-amber-700 leading-relaxed">
          Site preview editing is desktop-focused so element sizing matches production layout.
        </p>
      </div>
    );
  }

  return (
    <div className="relative h-full min-h-[calc(100vh-11rem)] bg-background">
      <div className="absolute inset-x-0 top-3 z-40 px-4">
        <div className="mx-auto w-full max-w-6xl">
          <div className="rounded-2xl border border-slate/10 bg-background/95 backdrop-blur-md px-4 py-3 shadow-xl">
            <div className="flex flex-wrap items-center gap-3">
              <span className="font-mono text-[9px] font-black text-accent uppercase tracking-[0.2em]">
                Full Site Preview
              </span>
              <div className="flex flex-wrap gap-2">
                {PREVIEW_TABS.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => { setPreviewTab(tab.id); haptics.tabSwitch?.(); }}
                    className={cn(
                      "px-3 py-1.5 rounded-xl border text-[10px] font-mono font-bold uppercase tracking-wider transition-all",
                      previewTab === tab.id
                        ? "border-accent bg-accent/10 text-accent"
                        : "border-slate/10 bg-slate/5 text-slate/60 hover:text-primary"
                    )}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="ml-auto flex gap-2">
                {MODES.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => { setMode(item.id); haptics.selection(); }}
                    className={cn(
                      "px-3 py-1.5 rounded-xl border text-[10px] font-mono font-bold uppercase tracking-wider transition-all",
                      mode === item.id
                        ? "border-accent bg-accent/10 text-accent"
                        : "border-slate/10 bg-slate/5 text-slate/60 hover:text-primary"
                    )}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {selectedKey && (
            <div className="mt-2 rounded-2xl border border-accent/20 bg-background/95 backdrop-blur-md px-4 py-3 shadow-2xl">
              <div className="flex items-center justify-between gap-3">
                <span className="font-mono text-[10px] font-bold text-accent uppercase tracking-wider truncate">{selectedKey}</span>
                <button onClick={clearSelection} className="text-[10px] font-mono font-bold text-slate/50 hover:text-primary">CLOSE</button>
              </div>

              <div className="mt-3 grid gap-3 lg:grid-cols-[2fr_1fr_1fr_auto] items-end">
                <div className="flex flex-col gap-1.5">
                  <label className="font-sans text-xs font-bold text-primary">Text</label>
                  <input
                    type="text"
                    value={selectedText}
                    onChange={(e) => { updateEditableText(setSiteContent, selectedKey, e.target.value); haptics.editType?.(); }}
                    className="w-full bg-slate/5 border border-slate/10 rounded-xl px-3 py-2 font-sans text-sm text-primary focus:outline-none focus:border-accent/40"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="font-sans text-xs font-bold text-primary">Font</label>
                  <div className="flex gap-2 items-center">
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
                    <label className="font-sans text-xs font-bold text-primary">X</label>
                    <NumberField value={selectedPosition.x} min={-500} max={500} onChange={(e) => updateSelectedPosition(Number(e.target.value), selectedPosition.y)} />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="font-sans text-xs font-bold text-primary">Y</label>
                    <NumberField value={selectedPosition.y} min={-500} max={500} onChange={(e) => updateSelectedPosition(selectedPosition.x, Number(e.target.value))} />
                  </div>
                </div>

                <div className="flex gap-2">
                  <button onClick={() => nudgeSelected(-1, 0)} className="px-2 py-2 rounded-lg border border-slate/10 bg-slate/5 text-[10px] font-mono font-bold">←</button>
                  <button onClick={() => nudgeSelected(0, -1)} className="px-2 py-2 rounded-lg border border-slate/10 bg-slate/5 text-[10px] font-mono font-bold">↑</button>
                  <button onClick={() => nudgeSelected(0, 1)} className="px-2 py-2 rounded-lg border border-slate/10 bg-slate/5 text-[10px] font-mono font-bold">↓</button>
                  <button onClick={() => nudgeSelected(1, 0)} className="px-2 py-2 rounded-lg border border-slate/10 bg-slate/5 text-[10px] font-mono font-bold">→</button>
                  <button
                    onClick={() => { resetEditableText(setSiteContent, selectedKey); resetEditableStyleAndPosition(setSiteContent, selectedKey); haptics.warning(); }}
                    className="px-3 py-2 rounded-lg border border-amber-500/30 bg-amber-500/10 text-[10px] font-mono font-bold text-amber-700 uppercase flex items-center gap-1"
                  >
                    <IconRotate size={11} />
                    Reset
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div
        onClick={clearSelection}
        className={cn(
          "h-full overflow-y-auto custom-scrollbar",
          selectedKey ? "pt-48" : "pt-24"
        )}
      >
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
  );
};

export default AdminContentEditor;
