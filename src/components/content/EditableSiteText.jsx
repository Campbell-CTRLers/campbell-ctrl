import React, { useMemo, useRef } from 'react';
import { cn } from '../../utils/cn';
import {
  getDesktopEditableNodeStyle,
  readEditableMeta,
  readEditablePosition,
  readEditableText,
  sanitizeEditableText,
  updateEditablePosition,
  updateEditableText,
} from '../../utils/siteContentEditor';

const noop = () => {};
const LINE = 'line';
const WORD = 'word';

const buildSegmentKey = (contentKey, kind, index) => `${contentKey}::${kind}:${index}`;

const parseSegmentKey = (value, contentKey) => {
  if (!value || typeof value !== 'string') return null;
  const prefix = `${contentKey}::`;
  if (!value.startsWith(prefix)) return null;
  const remainder = value.slice(prefix.length);
  const [kind, idxRaw] = remainder.split(':');
  const index = Number(idxRaw);
  if (!Number.isFinite(index)) return null;
  if (kind !== LINE && kind !== WORD) return null;
  return { kind, index };
};

export const EditableSiteText = ({
  as = 'span',
  contentKey,
  fallback = '',
  className,
  siteContent,
  setSiteContent,
  editor,
  ...rest
}) => {
  const Element = as;
  const dragRef = useRef({
    active: false,
    startX: 0,
    startY: 0,
    baseX: 0,
    baseY: 0,
    rafId: 0,
    pendingX: 0,
    pendingY: 0,
    lockAxis: null,
    targetKey: contentKey,
  });

  const selected = editor?.selectedKey === contentKey;
  const selectedSegment = parseSegmentKey(editor?.selectedKey, contentKey);
  const selectionGranularity = editor?.selectionGranularity || 'element';
  const editingEnabled = Boolean(editor?.enabled && setSiteContent);
  const mode = editor?.mode || 'select';
  const nodeMeta = readEditableMeta(siteContent, contentKey);
  const locked = nodeMeta.locked;
  const showOutlines = Boolean(editor?.showOutlines);

  const baseText = readEditableText(siteContent, contentKey, fallback);
  const text = useMemo(() => String(baseText ?? ''), [baseText]);
  const desktopStyle = getDesktopEditableNodeStyle(siteContent, contentKey);

  const interactiveClass = useMemo(() => {
    if (!editingEnabled) return '';
    if (selected) return 'outline outline-2 outline-accent outline-offset-2';
    if (showOutlines) return 'outline outline-1 outline-accent/40 outline-offset-2';
    return 'outline outline-1 outline-transparent hover:outline-accent/40';
  }, [editingEnabled, selected, showOutlines]);

  const lineTokens = useMemo(() => text.split('\n'), [text]);
  const wordTokens = useMemo(() => text.split(/(\s+)/), [text]);

  const onSelect = (e) => {
    if (!editingEnabled) return;
    e.stopPropagation();
    editor?.setSelectedKey?.(contentKey, text);
  };

  const onInput = (e) => {
    if (!editingEnabled || mode !== 'edit' || !selected || locked) return;
    const next = sanitizeEditableText(e.currentTarget.textContent);
    updateEditableText(setSiteContent, contentKey, next);
    editor?.haptics?.editType?.();
  };

  const onSegmentInput = (kind, index) => (e) => {
    if (!editingEnabled || mode !== 'edit' || !selectedSegment || locked) return;
    if (selectedSegment.kind !== kind || selectedSegment.index !== index) return;
    const nextPart = sanitizeEditableText(e.currentTarget.textContent);
    if (kind === LINE) {
      const nextLines = [...lineTokens];
      nextLines[index] = nextPart;
      updateEditableText(setSiteContent, contentKey, nextLines.join('\n'));
      editor?.haptics?.editType?.();
      return;
    }
    const nextTokens = [...wordTokens];
    nextTokens[index] = nextPart;
    updateEditableText(setSiteContent, contentKey, nextTokens.join(''));
    editor?.haptics?.editType?.();
  };

  const applySnap = (value, gridSize) => {
    if (!gridSize || gridSize <= 1) return value;
    return Math.round(value / gridSize) * gridSize;
  };

  const onPointerMove = (e) => {
    if (!dragRef.current.active) return;
    const nextX = dragRef.current.baseX + (e.clientX - dragRef.current.startX);
    const nextY = dragRef.current.baseY + (e.clientY - dragRef.current.startY);
    const gridSize = editor?.layout?.snapEnabled ? Number(editor?.layout?.gridSize || 1) : 1;
    let resolvedX = nextX;
    let resolvedY = nextY;

    if (editor?.layout?.shiftAxisLock && e.shiftKey) {
      if (!dragRef.current.lockAxis) {
        const dx = Math.abs(e.clientX - dragRef.current.startX);
        const dy = Math.abs(e.clientY - dragRef.current.startY);
        dragRef.current.lockAxis = dx >= dy ? 'x' : 'y';
      }
      if (dragRef.current.lockAxis === 'x') resolvedY = dragRef.current.baseY;
      if (dragRef.current.lockAxis === 'y') resolvedX = dragRef.current.baseX;
    } else {
      dragRef.current.lockAxis = null;
    }

    resolvedX = applySnap(resolvedX, gridSize);
    resolvedY = applySnap(resolvedY, gridSize);

    dragRef.current.pendingX = resolvedX;
    dragRef.current.pendingY = resolvedY;
    editor?.setGuideState?.({
      showVertical: Math.abs(resolvedX) <= Math.max(1, gridSize / 2),
      showHorizontal: Math.abs(resolvedY) <= Math.max(1, gridSize / 2),
    });
    if (dragRef.current.rafId) return;
    dragRef.current.rafId = requestAnimationFrame(() => {
      updateEditablePosition(setSiteContent, dragRef.current.targetKey || contentKey, {
        x: dragRef.current.pendingX,
        y: dragRef.current.pendingY,
      });
      editor?.haptics?.dragStep?.();
      dragRef.current.rafId = 0;
    });
  };

  const stopDragging = () => {
    if (!dragRef.current.active) return;
    dragRef.current.active = false;
    dragRef.current.lockAxis = null;
    window.removeEventListener('pointermove', onPointerMove);
    window.removeEventListener('pointerup', stopDragging);
    window.removeEventListener('pointercancel', stopDragging);
    if (dragRef.current.rafId) cancelAnimationFrame(dragRef.current.rafId);
    dragRef.current.rafId = 0;
    editor?.setGuideState?.({ showVertical: false, showHorizontal: false });
    editor?.haptics?.dragEnd?.();
  };

  const onPointerDown = (e, targetKey = contentKey) => {
    const isTargetSelected = editor?.selectedKey === targetKey;
    if (!editingEnabled || mode !== 'move' || !isTargetSelected || locked) return;
    e.preventDefault();
    e.stopPropagation();
    const pos = readEditablePosition(siteContent, targetKey);
    dragRef.current.active = true;
    dragRef.current.targetKey = targetKey;
    dragRef.current.startX = e.clientX;
    dragRef.current.startY = e.clientY;
    dragRef.current.baseX = pos.x;
    dragRef.current.baseY = pos.y;
    editor?.haptics?.dragStart?.();
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', stopDragging);
    window.addEventListener('pointercancel', stopDragging);
  };

  const onSegmentPointerDown = (segmentKey) => (e) => {
    if (editor?.selectedKey !== segmentKey) return;
    onPointerDown(e, segmentKey);
  };

  const onSelectSegment = (segmentKey, segmentText) => (e) => {
    if (!editingEnabled) return;
    e.stopPropagation();
    editor?.setSelectedKey?.(segmentKey, segmentText);
  };

  const cursorClass = editingEnabled
    ? mode === 'move' && selected
      ? 'cursor-grab active:cursor-grabbing'
      : mode === 'edit' && selected
        ? 'cursor-text'
        : 'cursor-pointer'
    : '';

  const renderLineMode = () => (
    <Element
      {...rest}
      data-content-key={contentKey}
      onClick={onSelect}
      className={cn('editable-site-node', interactiveClass, className)}
      style={desktopStyle}
    >
      {lineTokens.map((line, index) => {
        const segmentKey = buildSegmentKey(contentKey, LINE, index);
        const isSegmentSelected = editor?.selectedKey === segmentKey;
        const segmentStyle = getDesktopEditableNodeStyle(siteContent, segmentKey);
        return (
          <span
            key={segmentKey}
            data-content-key={segmentKey}
            suppressContentEditableWarning
            contentEditable={editingEnabled && mode === 'edit' && isSegmentSelected && !locked}
            onClick={onSelectSegment(segmentKey, line)}
            onInput={onSegmentInput(LINE, index)}
            onPointerDown={onSegmentPointerDown(segmentKey)}
            className={cn(
              'editable-site-segment editable-site-line',
              isSegmentSelected && 'outline outline-2 outline-accent outline-offset-2',
              showOutlines && !isSegmentSelected && 'outline outline-1 outline-accent/30 outline-offset-2',
              editingEnabled && mode === 'move' && isSegmentSelected ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer'
            )}
            style={segmentStyle}
          >
            {line || '\u00A0'}
          </span>
        );
      })}
    </Element>
  );

  const renderWordMode = () => (
    <Element
      {...rest}
      data-content-key={contentKey}
      onClick={onSelect}
      className={cn('editable-site-node', interactiveClass, className)}
      style={desktopStyle}
    >
      {wordTokens.map((token, index) => {
        const isWhitespace = /^\s+$/.test(token);
        if (isWhitespace) return <React.Fragment key={`${contentKey}-ws-${index}`}>{token}</React.Fragment>;
        const segmentKey = buildSegmentKey(contentKey, WORD, index);
        const isSegmentSelected = editor?.selectedKey === segmentKey;
        const segmentStyle = getDesktopEditableNodeStyle(siteContent, segmentKey);
        return (
          <span
            key={segmentKey}
            data-content-key={segmentKey}
            suppressContentEditableWarning
            contentEditable={editingEnabled && mode === 'edit' && isSegmentSelected && !locked}
            onClick={onSelectSegment(segmentKey, token)}
            onInput={onSegmentInput(WORD, index)}
            onPointerDown={onSegmentPointerDown(segmentKey)}
            className={cn(
              'editable-site-segment',
              isSegmentSelected && 'outline outline-2 outline-accent outline-offset-2',
              showOutlines && !isSegmentSelected && 'outline outline-1 outline-accent/30 outline-offset-2',
              editingEnabled && mode === 'move' && isSegmentSelected ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer'
            )}
            style={segmentStyle}
          >
            {token}
          </span>
        );
      })}
    </Element>
  );

  if (selectionGranularity === LINE) return renderLineMode();
  if (selectionGranularity === WORD) return renderWordMode();

  return (
    <Element
      {...rest}
      data-content-key={contentKey}
      suppressContentEditableWarning
      contentEditable={editingEnabled && selected && mode === 'edit' && !locked}
      onClick={onSelect}
      onInput={onInput}
      onPointerDown={onPointerDown}
      className={cn(
        'editable-site-node',
        interactiveClass,
        cursorClass,
        locked && editingEnabled && 'editable-site-node-locked',
        className
      )}
      style={desktopStyle}
    >
      {text}
    </Element>
  );
};

EditableSiteText.defaultProps = {
  editor: null,
  setSiteContent: noop,
  siteContent: null,
};
