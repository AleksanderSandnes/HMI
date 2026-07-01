import { Line, Text as SvgText } from "react-native-svg";

import { axisTextProps, GRID_COLOR } from "../chartTheme";

import { xTickIndices, yTickValues, type ChartGeometry } from "./scales";

export interface AxesProps {
  geo: ChartGeometry;
  /** Desired x / y tick counts (clamped to the data, like victory tickCount). */
  xCount: number;
  yCount: number;
  /** Pixel x for a data index — `geo.x` for lines, band centre for bars. */
  xAt: (i: number) => number;
  formatX: (i: number) => string;
  formatY: (v: number) => string;
}

const TEXT = axisTextProps();

/**
 * Horizontal grid lines + x/y tick labels for the SVG charts. Y ticks are spread
 * evenly across the domain; x ticks are evenly spaced data indices. Label text is
 * produced by the caller's formatters (reusing the same helpers as the web).
 */
export function Axes({ geo, xCount, yCount, xAt, formatX, formatY }: AxesProps) {
  const { bounds, count, yDomain } = geo;
  const yTicks = yTickValues(yDomain, yCount);
  const xTicks = xTickIndices(count, xCount);

  return (
    <>
      {yTicks.map((v, i) => {
        const py = geo.y(v);
        return (
          <Line
            key={`g${i}`}
            x1={bounds.left}
            y1={py}
            x2={bounds.right}
            y2={py}
            stroke={GRID_COLOR}
            strokeWidth={1}
          />
        );
      })}
      {yTicks.map((v, i) => (
        <SvgText key={`y${i}`} x={bounds.left - 6} y={geo.y(v) + 4} textAnchor="end" {...TEXT}>
          {formatY(v)}
        </SvgText>
      ))}
      {xTicks.map((i) => (
        <SvgText key={`x${i}`} x={xAt(i)} y={bounds.bottom + 16} textAnchor="middle" {...TEXT}>
          {formatX(i)}
        </SvgText>
      ))}
    </>
  );
}
