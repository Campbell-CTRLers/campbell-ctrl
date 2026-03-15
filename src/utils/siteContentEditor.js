const EDITOR_ROOT_KEY = 'globalEditor';
const MAX_EDITABLE_TEXT_LENGTH = 500;

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const toFiniteNumber = (value, fallback = 0) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
};

export const sanitizeEditableText = (value) =>
  Array.from(String(value ?? ''))
    .filter((ch) => {
      const code = ch.charCodeAt(0);
      return !(code <= 8 || code === 11 || code === 12 || (code >= 14 && code <= 31) || code === 127);
    })
    .join('')
    .slice(0, MAX_EDITABLE_TEXT_LENGTH);

export const getEditorBuckets = (siteContent) => {
  const root = siteContent?.[EDITOR_ROOT_KEY] || {};
  return {
    text: root.text || {},
    style: root.style || {},
    position: root.position || {},
  };
};

export const readEditableText = (siteContent, contentKey, fallback) => {
  const { text } = getEditorBuckets(siteContent);
  const value = text?.[contentKey];
  return value == null ? fallback : value;
};

export const readEditableStyle = (siteContent, contentKey) => {
  const { style } = getEditorBuckets(siteContent);
  return style?.[contentKey] || {};
};

export const readEditablePosition = (siteContent, contentKey) => {
  const { position } = getEditorBuckets(siteContent);
  const pos = position?.[contentKey] || {};
  return {
    x: toFiniteNumber(pos.x, 0),
    y: toFiniteNumber(pos.y, 0),
  };
};

const updateEditorRoot = (setSiteContent, updater) => {
  setSiteContent((prev) => {
    const previous = prev || {};
    const root = previous[EDITOR_ROOT_KEY] || {};
    const nextRoot = updater(root);
    return {
      ...previous,
      [EDITOR_ROOT_KEY]: nextRoot,
    };
  });
};

export const updateEditableText = (setSiteContent, contentKey, value) => {
  const sanitized = sanitizeEditableText(value);
  updateEditorRoot(setSiteContent, (root) => ({
    ...root,
    text: {
      ...(root.text || {}),
      [contentKey]: sanitized,
    },
  }));
};

export const updateEditableStyle = (setSiteContent, contentKey, stylePatch) => {
  updateEditorRoot(setSiteContent, (root) => {
    const current = (root.style || {})[contentKey] || {};
    const next = {
      ...current,
      ...stylePatch,
    };
    const nextFontSize = toFiniteNumber(next.fontSize, current.fontSize || 0);
    if (next.fontSize != null) next.fontSize = clamp(nextFontSize, 10, 120);
    return {
      ...root,
      style: {
        ...(root.style || {}),
        [contentKey]: next,
      },
    };
  });
};

export const updateEditablePosition = (setSiteContent, contentKey, positionPatch) => {
  updateEditorRoot(setSiteContent, (root) => {
    const current = (root.position || {})[contentKey] || { x: 0, y: 0 };
    const next = {
      x: clamp(toFiniteNumber(positionPatch.x ?? current.x, 0), -500, 500),
      y: clamp(toFiniteNumber(positionPatch.y ?? current.y, 0), -500, 500),
    };
    return {
      ...root,
      position: {
        ...(root.position || {}),
        [contentKey]: next,
      },
    };
  });
};

export const resetEditableText = (setSiteContent, contentKey) => {
  updateEditorRoot(setSiteContent, (root) => {
    const nextText = { ...(root.text || {}) };
    delete nextText[contentKey];
    return {
      ...root,
      text: nextText,
    };
  });
};

export const resetEditableStyleAndPosition = (setSiteContent, contentKey) => {
  updateEditorRoot(setSiteContent, (root) => {
    const nextStyle = { ...(root.style || {}) };
    const nextPosition = { ...(root.position || {}) };
    delete nextStyle[contentKey];
    delete nextPosition[contentKey];
    return {
      ...root,
      style: nextStyle,
      position: nextPosition,
    };
  });
};

export const getDesktopEditableNodeStyle = (siteContent, contentKey) => {
  const style = readEditableStyle(siteContent, contentKey);
  const pos = readEditablePosition(siteContent, contentKey);
  const nodeStyle = {};
  if (style?.fontSize != null) nodeStyle['--editable-font-size'] = `${clamp(toFiniteNumber(style.fontSize, 16), 10, 120)}px`;
  if (pos?.x != null) nodeStyle['--editable-x'] = `${clamp(toFiniteNumber(pos.x, 0), -500, 500)}px`;
  if (pos?.y != null) nodeStyle['--editable-y'] = `${clamp(toFiniteNumber(pos.y, 0), -500, 500)}px`;
  return nodeStyle;
};
