import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
  listEditableKeys,
  readEditableMeta,
  readEditablePosition,
  readEditableStyle,
  readEditableText,
  resetEditableByPredicate,
  resetEditableMeta,
  resetEditablePosition,
  resetEditableStyle,
  resetEditableStyleAndPosition,
  resetEditableText,
  updateEditableMeta,
  updateEditablePosition,
  updateEditableStyle,
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

const GRANULARITY_OPTIONS = [
  { id: 'element', label: 'Element' },
  { id: 'line', label: 'Line' },
  { id: 'word', label: 'Word' },
  { id: 'container', label: 'Container' },
];

const DENSITY_OPTIONS = [
  { id: 'minimal', label: 'Minimal' },
  { id: 'standard', label: 'Standard' },
  { id: 'detailed', label: 'Detailed' },
];

const MAX_HISTORY = 50;

const deepClone = (value) => JSON.parse(JSON.stringify(value || {}));
const asJson = (value) => JSON.stringify(value || {});
const getBaseKey = (key) => String(key || '').split('::')[0];
const isEditableTypingTarget = (target) => {
  if (!target) return false;
  const tag = target.tagName?.toLowerCase();
  if (tag === 'input' || tag === 'textarea' || tag === 'select') return true;
  return Boolean(target.isContentEditable);
};

const extractEditorSnapshot = (siteContent) => {
  const root = siteContent?.globalEditor || {};
  return {
    text: deepClone(root.text),
    style: deepClone(root.style),
    position: deepClone(root.position),
    meta: deepClone(root.meta),
  };
};

const diffChangedKeys = (draft, published) => {
  const changed = new Set();
  ['text', 'style', 'position', 'meta'].forEach((bucket) => {
    const keys = new Set([
      ...Object.keys(draft?.[bucket] || {}),
      ...Object.keys(published?.[bucket] || {}),
    ]);
    keys.forEach((key) => {
      if (asJson(draft?.[bucket]?.[key]) !== asJson(published?.[bucket]?.[key])) changed.add(key);
    });
  });
  return changed;
};

const keyToTab = (key) => {
  if (!key) return 'global';
  const base = getBaseKey(key);
  const p = base.split('.')[0];
  if (['legal'].includes(p)) return 'legal';
  if (['meetings', 'homeMeetings'].includes(p)) return 'meetings';
  if (['esports', 'standings', 'rankings', 'globalRankings'].includes(p)) return 'esports';
  if (['home', 'hero', 'about', 'homeEsports', 'liveStandings'].includes(p)) return 'home';
  if (['navbar', 'footer'].includes(p)) return 'global';
  return 'global';
};

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
  const fileImportRef = useRef(null);
  const canvasRef = useRef(null);

  const [previewTab, setPreviewTab] = useState('home');
  const [mode, setMode] = useState('select');
  const [selectedKey, setSelectedKey] = useState(null);
  const [previewVersion, setPreviewVersion] = useState('draft');
  const [selectionGranularity, setSelectionGranularity] = useState('element');
  const [selectionDensity, setSelectionDensity] = useState('standard');
  const [showOutlines, setShowOutlines] = useState(true);
  const [snapEnabled, setSnapEnabled] = useState(true);
  const [gridSize, setGridSize] = useState(8);
  const [shiftAxisLock, setShiftAxisLock] = useState(true);
  const [guidesEnabled, setGuidesEnabled] = useState(true);
  const [guideState, setGuideState] = useState({ showVertical: false, showHorizontal: false });
  const [nudgeStep, setNudgeStep] = useState(1);
  const [availableKeys, setAvailableKeys] = useState([]);
  const [keySearch, setKeySearch] = useState('');
  const [recentSelections, setRecentSelections] = useState([]);
  const [publishedSnapshot, setPublishedSnapshot] = useState(() => extractEditorSnapshot(siteContent));
  const [historyRevision, setHistoryRevision] = useState(0);

  const undoRef = useRef([]);
  const redoRef = useRef([]);
  const skipHistoryRef = useRef(false);
  const previousSnapshotRef = useRef(extractEditorSnapshot(siteContent));
  const previousSnapshotJsonRef = useRef(asJson(previousSnapshotRef.current));

  const draftSnapshot = useMemo(() => extractEditorSnapshot(siteContent), [siteContent]);
  const draftSnapshotJson = useMemo(() => asJson(draftSnapshot), [draftSnapshot]);

  useEffect(() => {
    if (skipHistoryRef.current) {
      skipHistoryRef.current = false;
      previousSnapshotRef.current = deepClone(draftSnapshot);
      previousSnapshotJsonRef.current = draftSnapshotJson;
      return;
    }
    if (previousSnapshotJsonRef.current === draftSnapshotJson) return;
    undoRef.current.push(deepClone(previousSnapshotRef.current));
    if (undoRef.current.length > MAX_HISTORY) undoRef.current.shift();
    redoRef.current = [];
    previousSnapshotRef.current = deepClone(draftSnapshot);
    previousSnapshotJsonRef.current = draftSnapshotJson;
    setHistoryRevision((v) => v + 1);
  }, [draftSnapshot, draftSnapshotJson]);

  const previewSiteContent = useMemo(() => {
    if (previewVersion === 'draft') return siteContent;
    return {
      ...(siteContent || {}),
      globalEditor: deepClone(publishedSnapshot),
    };
  }, [publishedSnapshot, previewVersion, siteContent]);

  const selectedStyle = selectedKey ? readEditableStyle(siteContent, selectedKey) : {};
  const selectedPosition = selectedKey ? readEditablePosition(siteContent, selectedKey) : { x: 0, y: 0 };
  const selectedMeta = selectedKey ? readEditableMeta(siteContent, getBaseKey(selectedKey)) : { locked: false };
  const selectedBaseKey = getBaseKey(selectedKey);
  const selectedFontSize = selectedStyle?.fontSize ?? 16;
  const selectedFontWeight = selectedStyle?.fontWeight ?? 400;
  const selectedLineHeight = selectedStyle?.lineHeight ?? 1.3;
  const selectedLetterSpacing = selectedStyle?.letterSpacing ?? 0;
  const selectedTextAlign = selectedStyle?.textAlign ?? 'left';
  const selectedTextTransform = selectedStyle?.textTransform ?? 'none';
  const applySnapshot = useCallback((snapshot) => {
    skipHistoryRef.current = true;
    setSiteContent((prev) => ({
      ...(prev || {}),
      globalEditor: deepClone(snapshot),
    }));
  }, [setSiteContent]);

  const canUndo = undoRef.current.length > 0;
  const canRedo = redoRef.current.length > 0;

  const undo = useCallback(() => {
    if (!undoRef.current.length) return;
    const previous = undoRef.current.pop();
    redoRef.current.push(deepClone(draftSnapshot));
    applySnapshot(previous);
    haptics.soft();
    setHistoryRevision((v) => v + 1);
  }, [applySnapshot, draftSnapshot, haptics]);

  const redo = useCallback(() => {
    if (!redoRef.current.length) return;
    const next = redoRef.current.pop();
    undoRef.current.push(deepClone(draftSnapshot));
    applySnapshot(next);
    haptics.soft();
    setHistoryRevision((v) => v + 1);
  }, [applySnapshot, draftSnapshot, haptics]);

  const registerSelection = useCallback((key, _currentText = '') => {
    setSelectedKey(key);
    setRecentSelections((prev) => {
      const next = [key, ...prev.filter((item) => item !== key)];
      return next.slice(0, 8);
    });
    haptics.editSelect?.();
  }, [haptics]);

  const editor = useMemo(() => ({
    enabled: !isMobile && previewVersion === 'draft',
    mode,
    selectedKey,
    haptics,
    selectionGranularity: selectionGranularity === 'container' ? 'element' : selectionGranularity,
    showOutlines: showOutlines || selectionDensity !== 'minimal',
    layout: {
      snapEnabled,
      gridSize,
      shiftAxisLock,
    },
    setGuideState: (next) => {
      if (!guidesEnabled) return;
      setGuideState(next);
    },
    setSelectedKey: registerSelection,
  }), [
    gridSize,
    guidesEnabled,
    haptics,
    isMobile,
    mode,
    previewVersion,
    registerSelection,
    selectedKey,
    selectionDensity,
    selectionGranularity,
    shiftAxisLock,
    showOutlines,
    snapEnabled,
  ]);

  useEffect(() => {
    setShowOutlines(selectionDensity !== 'minimal');
  }, [selectionDensity]);

  const clearSelection = () => {
    setSelectedKey(null);
    haptics.soft();
  };

  const updateSelectedFontSize = (value) => {
    if (!selectedKey) return;
    updateEditableStyle(setSiteContent, selectedKey, { fontSize: Number(value) });
  };

  const updateSelectedStyle = (patch) => {
    if (!selectedKey) return;
    updateEditableStyle(setSiteContent, selectedKey, patch);
  };

  const updateSelectedPosition = (x, y) => {
    if (!selectedKey) return;
    updateEditablePosition(setSiteContent, selectedKey, { x, y });
  };

  const nudgeSelected = (dx, dy, multiplier = 1) => {
    if (!selectedKey) return;
    haptics.soft();
    const step = Number(nudgeStep || 1) * multiplier;
    updateSelectedPosition(
      Number(selectedPosition.x || 0) + (dx * step),
      Number(selectedPosition.y || 0) + (dy * step)
    );
  };

  const resetCurrentTab = () => {
    const keysFromDom = Array.from(canvasRef.current?.querySelectorAll?.('[data-content-key]') || [])
      .map((node) => node.getAttribute('data-content-key'))
      .filter(Boolean);
    const baseKeys = new Set(keysFromDom.map(getBaseKey));
    if (!baseKeys.size) return;
    resetEditableByPredicate(setSiteContent, (key) => {
      const base = getBaseKey(key);
      return baseKeys.has(base);
    });
    clearSelection();
    haptics.warning();
  };

  const publishDraftSnapshot = () => {
    setPublishedSnapshot(deepClone(draftSnapshot));
    setPreviewVersion('published');
    haptics.saveSuccess?.();
  };

  const exportDraft = () => {
    const data = JSON.stringify(draftSnapshot, null, 2);
    const blob = new Blob([data], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `content-editor-draft-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    haptics.light();
  };

  const importDraft = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const raw = await file.text();
      const parsed = JSON.parse(raw);
      const imported = parsed?.globalEditor ? parsed.globalEditor : parsed;
      const snapshot = {
        text: imported?.text || {},
        style: imported?.style || {},
        position: imported?.position || {},
        meta: imported?.meta || {},
      };
      applySnapshot(snapshot);
      haptics.success();
    } catch (_err) {
      haptics.error();
    } finally {
      event.target.value = '';
    }
  };

  const changedKeys = useMemo(
    () => diffChangedKeys(draftSnapshot, publishedSnapshot),
    [draftSnapshot, publishedSnapshot]
  );

  const changeSummaryByTab = useMemo(() => {
    const summary = { home: 0, esports: 0, meetings: 0, legal: 0, global: 0 };
    changedKeys.forEach((key) => {
      const tab = keyToTab(key);
      summary[tab] = (summary[tab] || 0) + 1;
    });
    return summary;
  }, [changedKeys]);

  useEffect(() => {
    const domKeys = Array.from(canvasRef.current?.querySelectorAll?.('[data-content-key]') || [])
      .map((node) => node.getAttribute('data-content-key'))
      .filter(Boolean);
    const merged = Array.from(new Set([...domKeys, ...listEditableKeys(siteContent)]))
      .sort((a, b) => a.localeCompare(b));
    setAvailableKeys(merged);
  }, [previewTab, selectionGranularity, siteContent, historyRevision]);

  useEffect(() => {
    const onKeyDown = (e) => {
      const meta = e.metaKey || e.ctrlKey;
      if (meta && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
        return;
      }
      if (!selectedKey) return;
      if (isEditableTypingTarget(e.target)) return;
      if (e.key === 'ArrowLeft') { e.preventDefault(); nudgeSelected(-1, 0, e.shiftKey ? 10 : 1); }
      if (e.key === 'ArrowRight') { e.preventDefault(); nudgeSelected(1, 0, e.shiftKey ? 10 : 1); }
      if (e.key === 'ArrowUp') { e.preventDefault(); nudgeSelected(0, -1, e.shiftKey ? 10 : 1); }
      if (e.key === 'ArrowDown') { e.preventDefault(); nudgeSelected(0, 1, e.shiftKey ? 10 : 1); }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [nudgeStep, redo, selectedKey, undo]);

  const filteredKeys = useMemo(() => {
    const q = keySearch.trim().toLowerCase();
    if (!q) return availableKeys.slice(0, 10);
    return availableKeys.filter((key) => key.toLowerCase().includes(q)).slice(0, 10);
  }, [availableKeys, keySearch]);

  const renderPreviewTab = () => {
    if (previewTab === 'home') {
      return (
        <HomeTab
          gamesList={gamesList}
          standings={standings}
          rankings={rankings}
          meetings={meetings}
          siteContent={previewSiteContent}
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
          siteContent={previewSiteContent}
          setSiteContent={setSiteContent}
          contentEditor={editor}
        />
      );
    }
    if (previewTab === 'meetings') {
      return (
        <MeetingsTab
          meetings={meetings}
          siteContent={previewSiteContent}
          setSiteContent={setSiteContent}
          contentEditor={editor}
        />
      );
    }
    return (
      <LegalTab
        siteContent={previewSiteContent}
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
              <button
                onClick={() => setPreviewVersion((v) => (v === 'draft' ? 'published' : 'draft'))}
                className={cn(
                  'px-3 py-1.5 rounded-xl border text-[10px] font-mono font-bold uppercase tracking-wider transition-all',
                  previewVersion === 'draft'
                    ? 'border-accent bg-accent/10 text-accent'
                    : 'border-slate/10 bg-slate/5 text-slate/60'
                )}
              >
                {previewVersion === 'draft' ? 'Draft View' : 'Published View'}
              </button>
              <button
                onClick={publishDraftSnapshot}
                className="px-3 py-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-700"
              >
                Set Published Baseline
              </button>
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
                <button
                  onClick={undo}
                  disabled={!canUndo}
                  className={cn(
                    'px-3 py-1.5 rounded-xl border text-[10px] font-mono font-bold uppercase tracking-wider transition-all',
                    canUndo ? 'border-slate/10 bg-slate/5 text-slate/60 hover:text-primary' : 'border-slate/10 bg-slate/5 text-slate/30 cursor-not-allowed'
                  )}
                >
                  Undo
                </button>
                <button
                  onClick={redo}
                  disabled={!canRedo}
                  className={cn(
                    'px-3 py-1.5 rounded-xl border text-[10px] font-mono font-bold uppercase tracking-wider transition-all',
                    canRedo ? 'border-slate/10 bg-slate/5 text-slate/60 hover:text-primary' : 'border-slate/10 bg-slate/5 text-slate/30 cursor-not-allowed'
                  )}
                >
                  Redo
                </button>
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

            <div className="mt-3 grid gap-3 xl:grid-cols-[2fr_1.2fr_1fr_1fr]">
              <div className="rounded-xl border border-slate/10 bg-slate/5 p-2.5">
                <div className="font-mono text-[9px] uppercase tracking-[0.2em] text-slate/50 mb-2">Selection</div>
                <div className="flex flex-wrap gap-2 mb-2">
                  {GRANULARITY_OPTIONS.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => { setSelectionGranularity(item.id); haptics.toggle?.(); }}
                      className={cn(
                        'px-2.5 py-1.5 rounded-lg border text-[10px] font-mono font-bold uppercase',
                        selectionGranularity === item.id
                          ? 'border-accent bg-accent/10 text-accent'
                          : 'border-slate/10 text-slate/60'
                      )}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
                <div className="flex flex-wrap gap-2">
                  {DENSITY_OPTIONS.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => { setSelectionDensity(item.id); haptics.toggle?.(); }}
                      className={cn(
                        'px-2.5 py-1.5 rounded-lg border text-[10px] font-mono font-bold uppercase',
                        selectionDensity === item.id
                          ? 'border-accent bg-accent/10 text-accent'
                          : 'border-slate/10 text-slate/60'
                      )}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-xl border border-slate/10 bg-slate/5 p-2.5">
                <div className="font-mono text-[9px] uppercase tracking-[0.2em] text-slate/50 mb-2">Layout Precision</div>
                <div className="flex flex-wrap gap-2 mb-2">
                  <button onClick={() => setSnapEnabled((v) => !v)} className={cn('px-2.5 py-1.5 rounded-lg border text-[10px] font-mono font-bold uppercase', snapEnabled ? 'border-accent bg-accent/10 text-accent' : 'border-slate/10 text-slate/60')}>Snap</button>
                  <button onClick={() => setGuidesEnabled((v) => !v)} className={cn('px-2.5 py-1.5 rounded-lg border text-[10px] font-mono font-bold uppercase', guidesEnabled ? 'border-accent bg-accent/10 text-accent' : 'border-slate/10 text-slate/60')}>Guides</button>
                  <button onClick={() => setShiftAxisLock((v) => !v)} className={cn('px-2.5 py-1.5 rounded-lg border text-[10px] font-mono font-bold uppercase', shiftAxisLock ? 'border-accent bg-accent/10 text-accent' : 'border-slate/10 text-slate/60')}>Shift Lock</button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <NumberField value={gridSize} min={1} max={32} onChange={(e) => setGridSize(Number(e.target.value) || 1)} />
                  <NumberField value={nudgeStep} min={1} max={40} onChange={(e) => setNudgeStep(Number(e.target.value) || 1)} />
                </div>
              </div>

              <div className="rounded-xl border border-slate/10 bg-slate/5 p-2.5">
                <div className="font-mono text-[9px] uppercase tracking-[0.2em] text-slate/50 mb-2">Element Search</div>
                <input
                  type="text"
                  value={keySearch}
                  onChange={(e) => setKeySearch(e.target.value)}
                  placeholder="Find key..."
                  className="w-full bg-background border border-slate/10 rounded-lg px-2.5 py-2 text-xs"
                />
                <div className="mt-2 max-h-24 overflow-y-auto custom-scrollbar flex flex-col gap-1">
                  {filteredKeys.map((key) => (
                    <button
                      key={key}
                      onClick={() => registerSelection(key, readEditableText(siteContent, key, ''))}
                      className="text-left px-2 py-1 rounded-md text-[10px] font-mono border border-slate/10 hover:border-accent/30 hover:bg-accent/5"
                    >
                      {key}
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-xl border border-slate/10 bg-slate/5 p-2.5">
                <div className="font-mono text-[9px] uppercase tracking-[0.2em] text-slate/50 mb-2">Draft Workflow</div>
                <div className="flex flex-col gap-2">
                  <button onClick={exportDraft} className="px-2.5 py-2 rounded-lg border border-slate/10 text-[10px] font-mono font-bold uppercase">Export JSON</button>
                  <button onClick={() => fileImportRef.current?.click()} className="px-2.5 py-2 rounded-lg border border-slate/10 text-[10px] font-mono font-bold uppercase">Import JSON</button>
                  <button onClick={resetCurrentTab} className="px-2.5 py-2 rounded-lg border border-amber-500/30 bg-amber-500/10 text-[10px] font-mono font-bold uppercase text-amber-700">Reset Current Tab</button>
                </div>
                <input ref={fileImportRef} type="file" accept="application/json" className="hidden" onChange={importDraft} />
              </div>
            </div>
          </div>

          {selectedKey && (
            <div className="mt-2 rounded-2xl border border-accent/20 bg-background/95 backdrop-blur-md px-4 py-3 shadow-2xl">
              <div className="flex items-center justify-between gap-3">
                <span className="font-mono text-[10px] font-bold text-accent uppercase tracking-wider truncate">{selectedKey}</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => updateEditableMeta(setSiteContent, selectedBaseKey, { locked: !selectedMeta.locked })}
                    className={cn(
                      'text-[10px] font-mono font-bold px-2.5 py-1.5 rounded-lg border uppercase',
                      selectedMeta.locked
                        ? 'border-rose-500/30 bg-rose-500/10 text-rose-600'
                        : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700'
                    )}
                  >
                    {selectedMeta.locked ? 'Locked' : 'Unlocked'}
                  </button>
                  <button onClick={clearSelection} className="text-[10px] font-mono font-bold text-slate/50 hover:text-primary">Close</button>
                </div>
              </div>
              <p className="mt-2 text-[11px] text-slate/60 font-sans">Edit text directly in the preview while in <span className="font-bold">Edit</span> mode.</p>

              <div className="mt-3 grid gap-3 lg:grid-cols-[1.2fr_1fr_1fr_auto] items-end">
                <div className="flex flex-col gap-1.5">
                  <label className="font-sans text-xs font-bold text-primary">Font Size</label>
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
                    <label className="font-sans text-xs font-bold text-primary">Weight</label>
                    <NumberField value={selectedFontWeight} min={100} max={900} step={100} onChange={(e) => updateSelectedStyle({ fontWeight: Number(e.target.value) })} />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="font-sans text-xs font-bold text-primary">Line H</label>
                    <NumberField value={selectedLineHeight} min={0.8} max={3} step={0.05} onChange={(e) => updateSelectedStyle({ lineHeight: Number(e.target.value) })} />
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

              <div className="mt-3 grid gap-2 lg:grid-cols-[1fr_1fr_1fr_1fr_1fr]">
                <div className="flex flex-col gap-1">
                  <label className="font-sans text-xs font-bold text-primary">Tracking</label>
                  <NumberField value={selectedLetterSpacing} min={-6} max={24} step={0.25} onChange={(e) => updateSelectedStyle({ letterSpacing: Number(e.target.value) })} />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="font-sans text-xs font-bold text-primary">Transform</label>
                  <select value={selectedTextTransform} onChange={(e) => updateSelectedStyle({ textTransform: e.target.value })} className="w-full bg-slate/5 border border-slate/10 rounded-xl px-2.5 py-2 font-mono text-xs text-primary">
                    <option value="none">none</option>
                    <option value="uppercase">uppercase</option>
                    <option value="lowercase">lowercase</option>
                    <option value="capitalize">capitalize</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="font-sans text-xs font-bold text-primary">Align</label>
                  <select value={selectedTextAlign} onChange={(e) => updateSelectedStyle({ textAlign: e.target.value })} className="w-full bg-slate/5 border border-slate/10 rounded-xl px-2.5 py-2 font-mono text-xs text-primary">
                    <option value="left">left</option>
                    <option value="center">center</option>
                    <option value="right">right</option>
                    <option value="justify">justify</option>
                  </select>
                </div>
                <div className="flex items-end gap-2">
                  <button
                    onClick={() => {
                      const style = readEditableStyle(siteContent, selectedKey);
                      navigator.clipboard?.writeText(JSON.stringify(style || {})).catch(() => {});
                      haptics.light();
                    }}
                    className="w-full px-2.5 py-2 rounded-xl border border-slate/10 text-[10px] font-mono font-bold uppercase"
                  >
                    Copy Style
                  </button>
                </div>
                <div className="flex items-end gap-2">
                  <button
                    onClick={async () => {
                      try {
                        const raw = await navigator.clipboard?.readText?.();
                        if (!raw) return;
                        const parsed = JSON.parse(raw);
                        updateSelectedStyle(parsed);
                        haptics.success();
                      } catch (_err) {
                        haptics.error();
                      }
                    }}
                    className="w-full px-2.5 py-2 rounded-xl border border-slate/10 text-[10px] font-mono font-bold uppercase"
                  >
                    Paste Style
                  </button>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                <button onClick={() => resetEditableText(setSiteContent, selectedKey)} className="px-2.5 py-1.5 rounded-lg border border-slate/10 text-[10px] font-mono font-bold uppercase">Reset Text</button>
                <button onClick={() => resetEditableStyle(setSiteContent, selectedKey)} className="px-2.5 py-1.5 rounded-lg border border-slate/10 text-[10px] font-mono font-bold uppercase">Reset Style</button>
                <button onClick={() => resetEditablePosition(setSiteContent, selectedKey)} className="px-2.5 py-1.5 rounded-lg border border-slate/10 text-[10px] font-mono font-bold uppercase">Reset Position</button>
                <button onClick={() => resetEditableMeta(setSiteContent, selectedBaseKey)} className="px-2.5 py-1.5 rounded-lg border border-slate/10 text-[10px] font-mono font-bold uppercase">Reset Lock</button>
                <button onClick={() => { resetEditableText(setSiteContent, selectedBaseKey); resetEditableStyleAndPosition(setSiteContent, selectedBaseKey); resetEditableMeta(setSiteContent, selectedBaseKey); }} className="px-2.5 py-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 text-amber-700 text-[10px] font-mono font-bold uppercase">Reset Base Element</button>
              </div>
            </div>
          )}

          <div className="mt-2 rounded-xl border border-slate/10 bg-background/90 px-4 py-2">
            <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-5 text-[10px] font-mono uppercase tracking-wide text-slate/60">
              <div>Changed: <span className="text-primary font-bold">{changedKeys.size}</span></div>
              <div>Home: <span className="text-primary font-bold">{changeSummaryByTab.home}</span></div>
              <div>Esports: <span className="text-primary font-bold">{changeSummaryByTab.esports}</span></div>
              <div>Meetings: <span className="text-primary font-bold">{changeSummaryByTab.meetings}</span></div>
              <div>Legal/Global: <span className="text-primary font-bold">{changeSummaryByTab.legal + changeSummaryByTab.global}</span></div>
            </div>
            {!!recentSelections.length && (
              <div className="mt-2 flex flex-wrap gap-2">
                {recentSelections.slice(0, 6).map((key) => (
                  <button key={key} onClick={() => registerSelection(key, readEditableText(siteContent, key, ''))} className="px-2 py-1 rounded-md border border-slate/10 text-[10px] font-mono">
                    {key}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div
        ref={canvasRef}
        data-editor-canvas
        onClick={clearSelection}
        className={cn(
          "h-full overflow-y-auto custom-scrollbar",
          selectedKey ? "pt-[29rem] lg:pt-[22rem]" : "pt-[18rem] lg:pt-[12rem]"
        )}
      >
        {guidesEnabled && guideState.showVertical && <div className="pointer-events-none fixed inset-y-0 left-1/2 -translate-x-1/2 w-px bg-accent/50 z-30" />}
        {guidesEnabled && guideState.showHorizontal && <div className="pointer-events-none fixed inset-x-0 top-1/2 -translate-y-1/2 h-px bg-accent/50 z-30" />}
        <Navbar
          currentTab={previewTab}
          onNavigate={(tab) => {
            if (PREVIEW_TABS.some((t) => t.id === tab)) setPreviewTab(tab);
          }}
          siteContent={previewSiteContent}
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
          siteContent={previewSiteContent}
          setSiteContent={setSiteContent}
          contentEditor={editor}
          hideAdminStatus
        />
      </div>
    </div>
  );
};

export default AdminContentEditor;
