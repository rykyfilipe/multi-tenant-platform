import type { Layout } from 'react-grid-layout';

export const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));

/** Scale a layout item from one column system to another, keeping it in-bounds. */
export const scaleItem = (
  item: Omit<Layout, 'i'> & { i: string },
  fromCols: number,
  toCols: number
): Layout => {
  const ratio = toCols / fromCols;
  const w = clamp(Math.max(1, Math.round(item.w * ratio)), 1, toCols);
  const xRaw = Math.round(item.x * ratio);
  const x = clamp(xRaw, 0, Math.max(0, toCols - w));
  const h = Math.max(1, Math.round(item.h * ratio));
  const y = Math.max(0, Math.round(item.y * ratio));
  return { ...item, x, y, w, h, minW: 1, maxW: toCols, minH: 1 } as Layout;
};

/**
 * Pack items vertically to avoid overlaps and wrap to next rows when they don't fit horizontally.
 * Preserves original order of items in the returned array.
 */
export const packLayout = (items: Layout[], cols: number): Layout[] => {
  const heights = new Array<number>(cols).fill(0);
  const placed: Record<string, Layout> = {};
  const ordered = [...items].sort((a, b) => (a.y - b.y) || (a.x - b.x));
  for (const it of ordered) {
    let x = clamp(it.x, 0, Math.max(0, cols - it.w));
    if (x + it.w > cols) x = 0; // wrap to row start if doesn't fit
    const span = heights.slice(x, x + it.w);
    const top = span.length ? Math.max(...span) : 0;
    const y = Math.max(it.y, top);
    for (let c = x; c < x + it.w; c++) heights[c] = y + it.h;
    placed[it.i] = { ...it, x, y };
  }
  return items.map(i => placed[i.i]);
};
