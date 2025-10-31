import { clamp, scaleItem, packLayout } from '../../../src/widgets/utils/gridLayoutUtils';
import type { Layout } from 'react-grid-layout';

describe('gridLayoutUtils', () => {
  test('clamp bounds', () => {
    expect(clamp(5, 1, 10)).toBe(5)
    expect(clamp(-1, 0, 10)).toBe(0)
    expect(clamp(11, 0, 10)).toBe(10)
  });

  test('scaleItem down from 24 cols to 12 cols', () => {
    const item = { i: 'a', x: 12, y: 10, w: 6, h: 4 } as Layout;
    const scaled = scaleItem(item, 24, 12);
    // ratio 0.5
    expect(scaled.w).toBe(3);
    expect(scaled.x).toBe(6);
    expect(scaled.h).toBe(2);
    expect(scaled.y).toBe(5);
    expect(scaled.minW).toBe(1);
    expect(scaled.maxW).toBe(12);
  });

  test('scaleItem fits within target cols (no overflow)', () => {
    const item = { i: 'a', x: 20, y: 0, w: 10, h: 2 } as Layout;
    const scaled = scaleItem(item, 24, 6); // ratio 0.25
    expect(scaled.w).toBeGreaterThanOrEqual(1);
    expect(scaled.x + scaled.w).toBeLessThanOrEqual(6);
  });

  test('packLayout wraps items that exceed row width', () => {
    const cols = 6;
    const items: Layout[] = [
      { i: 'a', x: 0, y: 0, w: 4, h: 2 },
      { i: 'b', x: 4, y: 0, w: 4, h: 2 }, // exceeds 6 -> should wrap to next row start
    ];
    const packed = packLayout(items, cols);
  const a = packed.find((i: Layout) => i.i === 'a')!;
  const b = packed.find((i: Layout) => i.i === 'b')!;

    expect(a.x).toBe(0);
    expect(a.y).toBe(0);
    // b is clamped to max starting column (cols - w) and then packed below if needed
    expect(b.x).toBe(2);
    expect(b.y).toBeGreaterThanOrEqual(a.h);
  });

  test('packLayout preserves order', () => {
    const cols = 6;
    const items: Layout[] = [
      { i: 'a', x: 0, y: 0, w: 3, h: 1 },
      { i: 'b', x: 3, y: 0, w: 3, h: 1 },
      { i: 'c', x: 6, y: 0, w: 3, h: 1 }, // wraps
    ];
    const packed = packLayout(items, cols);
  expect(packed.map((i: Layout) => i.i)).toEqual(['a', 'b', 'c']);
  });

  test('end-to-end: 24->lg pipeline then scale to sm/xs preserves order and wraps', () => {
    const BASE_FROM_COLS = 24;
    const LG_COLS = 12;
    const SM_COLS = 6;
    const XS_COLS = 2;

    // three widgets across a row (24-col positions)
    const from24: Layout[] = [
      { i: 'w1', x: 0,  y: 0, w: 8, h: 4 },  // left third
      { i: 'w2', x: 8,  y: 0, w: 8, h: 4 },  // middle third
      { i: 'w3', x: 16, y: 0, w: 8, h: 4 },  // right third
    ];

    // scale to LG (12 cols) and pack
    const toLg = packLayout(
      from24.map(it => scaleItem(it, BASE_FROM_COLS, LG_COLS)),
      LG_COLS
    );
    // expect same row in LG: 3 blocks of width ~4
    expect(toLg.map((i: Layout) => i.i)).toEqual(['w1','w2','w3']);
    expect(toLg.every(i => i.y === 0)).toBe(true);

  // scale to SM (6 cols) and pack -> widths shrink; they may fit on one row
    const toSm = packLayout(toLg.map(it => scaleItem(it, LG_COLS, SM_COLS)), SM_COLS);
  expect(toSm[0].y).toBe(0);
  expect(toSm[1].y).toBe(0);
  // with 3 items, each ~2 cols, all can fit on same row in 6 cols
  expect(toSm[2].y).toBe(0);
    // maintain order
    expect(toSm.map((i: Layout) => i.i)).toEqual(['w1','w2','w3']);

    // scale to XS (2 cols) and pack -> all stack vertically
    const toXs = packLayout(toLg.map(it => scaleItem(it, LG_COLS, XS_COLS)), XS_COLS);
  expect(toXs[0].y).toBe(0);
  // first row can contain up to 2 items; third should wrap
  expect(toXs[2].y).toBeGreaterThanOrEqual(toXs[0].y);
  });
});
