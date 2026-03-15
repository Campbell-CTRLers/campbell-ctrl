const EDITOR_ROOT_KEY = 'globalEditor';
const MAX_EDITABLE_TEXT_LENGTH = 500;
const TEXT_TRANSFORMS = new Set(['none', 'uppercase', 'lowercase', 'capitalize']);
const TEXT_ALIGNS = new Set(['left', 'center', 'right', 'justify', 'start', 'end']);

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
    meta: root.meta || {},
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

export const readEditableMeta = (siteContent, contentKey) => {
  const { meta } = getEditorBuckets(siteContent);
  const nodeMeta = meta?.[contentKey] || {};
  return {
    locked: Boolean(nodeMeta.locked),
    granularity: nodeMeta.granularity || 'element',
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
    const nextFontWeight = toFiniteNumber(next.fontWeight, current.fontWeight || 400);
    if (next.fontWeight != null) next.fontWeight = clamp(Math.round(nextFontWeight / 100) * 100, 100, 900);
    const nextLineHeight = toFiniteNumber(next.lineHeight, current.lineHeight || 1.3);
    if (next.lineHeight != null) next.lineHeight = clamp(nextLineHeight, 0.8, 3);
    const nextLetterSpacing = toFiniteNumber(next.letterSpacing, current.letterSpacing || 0);
    if (next.letterSpacing != null) next.letterSpacing = clamp(nextLetterSpacing, -6, 24);
    if (next.textTransform != null && !TEXT_TRANSFORMS.has(String(next.textTransform))) {
      delete next.textTransform;
    }
    if (next.textAlign != null && !TEXT_ALIGNS.has(String(next.textAlign))) {
      delete next.textAlign;
    }
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

export const updateEditableMeta = (setSiteContent, contentKey, metaPatch) => {
  updateEditorRoot(setSiteContent, (root) => {
    const current = (root.meta || {})[contentKey] || {};
    const next = {
      ...current,
      ...metaPatch,
    };
    if (next.granularity != null && !['element', 'line', 'word', 'container'].includes(next.granularity)) {
      next.granularity = 'element';
    }
    return {
      ...root,
      meta: {
        ...(root.meta || {}),
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

export const resetEditableStyle = (setSiteContent, contentKey) => {
  updateEditorRoot(setSiteContent, (root) => {
    const nextStyle = { ...(root.style || {}) };
    delete nextStyle[contentKey];
    return {
      ...root,
      style: nextStyle,
    };
  });
};

export const resetEditablePosition = (setSiteContent, contentKey) => {
  updateEditorRoot(setSiteContent, (root) => {
    const nextPosition = { ...(root.position || {}) };
    delete nextPosition[contentKey];
    return {
      ...root,
      position: nextPosition,
    };
  });
};

export const resetEditableMeta = (setSiteContent, contentKey) => {
  updateEditorRoot(setSiteContent, (root) => {
    const nextMeta = { ...(root.meta || {}) };
    delete nextMeta[contentKey];
    return {
      ...root,
      meta: nextMeta,
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

export const listEditableKeys = (siteContent) => {
  const { text, style, position, meta } = getEditorBuckets(siteContent);
  return Array.from(new Set([
    ...Object.keys(text || {}),
    ...Object.keys(style || {}),
    ...Object.keys(position || {}),
    ...Object.keys(meta || {}),
  ])).sort((a, b) => a.localeCompare(b));
};

export const resetEditableByPredicate = (setSiteContent, predicate) => {
  updateEditorRoot(setSiteContent, (root) => {
    const buckets = ['text', 'style', 'position', 'meta'];
    const next = { ...root };
    buckets.forEach((bucket) => {
      const current = { ...(root[bucket] || {}) };
      Object.keys(current).forEach((key) => {
        if (predicate(key)) delete current[key];
      });
      next[bucket] = current;
    });
    return next;
  });
};

export const getDesktopEditableNodeStyle = (siteContent, contentKey) => {
  const style = readEditableStyle(siteContent, contentKey);
  const pos = readEditablePosition(siteContent, contentKey);
  const nodeStyle = {};
  if (style?.fontSize != null) nodeStyle['--editable-font-size'] = `${clamp(toFiniteNumber(style.fontSize, 16), 10, 120)}px`;
  if (style?.fontWeight != null) nodeStyle['--editable-font-weight'] = `${clamp(toFiniteNumber(style.fontWeight, 400), 100, 900)}`;
  if (style?.lineHeight != null) nodeStyle['--editable-line-height'] = `${clamp(toFiniteNumber(style.lineHeight, 1.3), 0.8, 3)}`;
  if (style?.letterSpacing != null) nodeStyle['--editable-letter-spacing'] = `${clamp(toFiniteNumber(style.letterSpacing, 0), -6, 24)}px`;
  if (style?.textTransform != null && TEXT_TRANSFORMS.has(String(style.textTransform))) {
    nodeStyle['--editable-text-transform'] = String(style.textTransform);
  }
  if (style?.textAlign != null && TEXT_ALIGNS.has(String(style.textAlign))) {
    nodeStyle['--editable-text-align'] = String(style.textAlign);
  }
  if (pos?.x != null) nodeStyle['--editable-x'] = `${clamp(toFiniteNumber(pos.x, 0), -500, 500)}px`;
  if (pos?.y != null) nodeStyle['--editable-y'] = `${clamp(toFiniteNumber(pos.y, 0), -500, 500)}px`;
  return nodeStyle;
};
