import React, { useMemo, useRef } from 'react';
import { cn } from '../../utils/cn';
import {
  getDesktopEditableNodeStyle,
  readEditablePosition,
  readEditableText,
  sanitizeEditableText,
  updateEditablePosition,
  updateEditableText,
} from '../../utils/siteContentEditor';

const noop = () => {};

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
  });

  const selected = editor?.selectedKey === contentKey;
  const editingEnabled = Boolean(editor?.enabled && setSiteContent);
  const mode = editor?.mode || 'select';

  const text = readEditableText(siteContent, contentKey, fallback);
  const desktopStyle = getDesktopEditableNodeStyle(siteContent, contentKey);

  const interactiveClass = useMemo(() => {
    if (!editingEnabled) return '';
    if (selected) return 'outline outline-2 outline-accent outline-offset-2';
    return 'outline outline-1 outline-transparent hover:outline-accent/40';
  }, [editingEnabled, selected]);

  const onSelect = (e) => {
    if (!editingEnabled) return;
    e.stopPropagation();
    editor?.setSelectedKey?.(contentKey);
  };

  const onInput = (e) => {
    if (!editingEnabled || mode !== 'edit' || !selected) return;
    const next = sanitizeEditableText(e.currentTarget.textContent);
    updateEditableText(setSiteContent, contentKey, next);
  };

  const onPointerMove = (e) => {
    if (!dragRef.current.active) return;
    const nextX = dragRef.current.baseX + (e.clientX - dragRef.current.startX);
    const nextY = dragRef.current.baseY + (e.clientY - dragRef.current.startY);
    dragRef.current.pendingX = nextX;
    dragRef.current.pendingY = nextY;
    if (dragRef.current.rafId) return;
    dragRef.current.rafId = requestAnimationFrame(() => {
      updateEditablePosition(setSiteContent, contentKey, {
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
    window.removeEventListener('pointermove', onPointerMove);
    window.removeEventListener('pointerup', stopDragging);
    window.removeEventListener('pointercancel', stopDragging);
    if (dragRef.current.rafId) cancelAnimationFrame(dragRef.current.rafId);
    dragRef.current.rafId = 0;
    editor?.haptics?.dragEnd?.();
  };

  const onPointerDown = (e) => {
    if (!editingEnabled || mode !== 'move' || !selected) return;
    e.preventDefault();
    e.stopPropagation();
    const pos = readEditablePosition(siteContent, contentKey);
    dragRef.current.active = true;
    dragRef.current.startX = e.clientX;
    dragRef.current.startY = e.clientY;
    dragRef.current.baseX = pos.x;
    dragRef.current.baseY = pos.y;
    editor?.haptics?.dragStart?.();
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', stopDragging);
    window.addEventListener('pointercancel', stopDragging);
  };

  const cursorClass = editingEnabled
    ? mode === 'move' && selected
      ? 'cursor-grab active:cursor-grabbing'
      : mode === 'edit' && selected
        ? 'cursor-text'
        : 'cursor-pointer'
    : '';

  return (
    <Element
      {...rest}
      data-content-key={contentKey}
      suppressContentEditableWarning
      contentEditable={editingEnabled && selected && mode === 'edit'}
      onClick={onSelect}
      onInput={onInput}
      onPointerDown={onPointerDown}
      className={cn('editable-site-node', interactiveClass, cursorClass, className)}
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
