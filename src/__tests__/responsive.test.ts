import { createResponsiveStyle } from '../utils/responsive';
import { BREAKPOINTS } from '../constants';

const mobile = { style: 'm' };
const tablet = { style: 't' };
const desktop = { style: 'd' };

describe('createResponsiveStyle', () => {
  it('returns the mobile style at/under the mobile breakpoint', () => {
    const pick = createResponsiveStyle(mobile, tablet, desktop);
    expect(pick(BREAKPOINTS.mobile)).toBe(mobile);
    expect(pick(BREAKPOINTS.mobile - 100)).toBe(mobile);
  });

  it('returns the tablet style between mobile and tablet breakpoints', () => {
    const pick = createResponsiveStyle(mobile, tablet, desktop);
    expect(pick(BREAKPOINTS.mobile + 1)).toBe(tablet);
    expect(pick(BREAKPOINTS.tablet)).toBe(tablet);
  });

  it('returns the desktop style above the tablet breakpoint', () => {
    const pick = createResponsiveStyle(mobile, tablet, desktop);
    expect(pick(BREAKPOINTS.tablet + 1)).toBe(desktop);
  });

  it('falls back to mobile when the tablet style is missing', () => {
    const pick = createResponsiveStyle(mobile);
    expect(pick(BREAKPOINTS.mobile + 1)).toBe(mobile);
  });

  it('falls back through tablet -> mobile when the desktop style is missing', () => {
    const pickTabletOnly = createResponsiveStyle(mobile, tablet);
    expect(pickTabletOnly(BREAKPOINTS.tablet + 1)).toBe(tablet);

    const pickMobileOnly = createResponsiveStyle(mobile);
    expect(pickMobileOnly(BREAKPOINTS.tablet + 1)).toBe(mobile);
  });
});
