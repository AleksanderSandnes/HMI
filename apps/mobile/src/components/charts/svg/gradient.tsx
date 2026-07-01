import { LinearGradient, Stop } from "react-native-svg";

export interface GradientStop {
  offset: number;
  color: string;
  opacity?: number;
}

export interface GradientDefProps {
  id: string;
  /** Horizontal (left→right) stroke gradient; default is vertical (top→bottom). */
  horizontal?: boolean;
  stops: GradientStop[];
}

/**
 * A `<LinearGradient>` def for use inside an SVG `<Defs>`. Defaults to a vertical
 * fill gradient (top→bottom); set `horizontal` for a left→right stroke gradient
 * (e.g. the solar line). Coordinates are object-bounding-box fractions, so the
 * gradient spans the referencing shape regardless of its pixel position.
 */
export function GradientDef({ id, horizontal = false, stops }: GradientDefProps) {
  const [x1, y1, x2, y2] = horizontal ? ["0", "0", "1", "0"] : ["0", "0", "0", "1"];
  return (
    <LinearGradient id={id} x1={x1} y1={y1} x2={x2} y2={y2}>
      {stops.map((s, i) => (
        <Stop key={i} offset={s.offset} stopColor={s.color} stopOpacity={s.opacity ?? 1} />
      ))}
    </LinearGradient>
  );
}
