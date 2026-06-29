import {
  formatNum,
  roundedBarPath,
  smoothPath,
} from '../utils/premiumChartHelpers';

describe('premiumChartHelpers', () => {
  it('formats chart numbers with the existing suffix rules', () => {
    expect(formatNum(1_200_000)).toBe('1.2M');
    expect(formatNum(1500)).toBe('1.5k');
    expect(formatNum(10_000)).toBe('10k');
    expect(formatNum(999.6)).toBe('1000');
    expect(formatNum(12.4)).toBe('12');
    expect(formatNum(-1.6)).toBe('-2');
  });

  it('builds smooth paths for empty, single-point, and two-point series', () => {
    expect(smoothPath([])).toBe('');
    expect(smoothPath([{ x: 2, y: 3 }])).toBe('M 2 3');
    expect(
      smoothPath([
        { x: 0, y: 0 },
        { x: 6, y: 6 },
      ])
    ).toBe('M 0 0 C 1 1 5 5 6 6');
  });

  it('builds smooth paths for multi-point series', () => {
    expect(
      smoothPath([
        { x: 0, y: 0 },
        { x: 6, y: 12 },
        { x: 12, y: 0 },
      ])
    ).toBe('M 0 0 C 1 2 4 12 6 12 C 8 12 11 2 12 0');
  });

  it('builds rounded bar paths with radius clamping', () => {
    expect(roundedBarPath(10, 20, 8, 40, 6)).toBe(
      'M 10 40 L 10 24 Q 10 20 14 20 L 14 20 Q 18 20 18 24 L 18 40 Z'
    );
    expect(roundedBarPath(0, 8, 10, 10, 6)).toBe(
      'M 0 10 L 0 10 Q 0 8 2 8 L 8 8 Q 10 8 10 10 L 10 10 Z'
    );
  });

  it('draws a thin cap for zero-ish or negative bar heights', () => {
    expect(roundedBarPath(1, 9.7, 4, 10, 3)).toBe('M 1 10 L 5 10');
    expect(roundedBarPath(1, 11, 4, 10, 3)).toBe('M 1 10 L 5 10');
  });
});
