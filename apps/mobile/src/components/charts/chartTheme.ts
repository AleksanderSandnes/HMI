import { Platform } from 'react-native';
import { matchFont, type SkFont } from '@shopify/react-native-skia';

// Shared styling tokens for the Victory Native XL solar + weather charts
// (mobile equivalent of apps/web/components/charts/chartTheme.ts).
export const AXIS_LABEL_COLOR = '#71809a'; // text-muted
export const GRID_COLOR = 'rgba(255,255,255,0.07)';

const FONT_FAMILY = Platform.select({
  ios: 'Helvetica Neue',
  android: 'sans-serif',
  default: 'sans-serif',
});

/** Skia font for axis labels — Victory Native XL requires an SkFont, not a CSS
 * font. Uses a system face (no bundled TTF) since the app is native-focused. */
export const axisFont = (size = 12): SkFont =>
  matchFont({
    fontFamily: FONT_FAMILY,
    fontSize: size,
    fontStyle: 'normal',
    fontWeight: '600',
  });
