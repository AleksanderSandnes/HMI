import { useState } from "react";
import { View } from "react-native";
import Svg, { Defs, Path } from "react-native-svg";

import { GradientDef } from "../charts/svg/gradient";
import { areaPath, linePath, type Pt } from "../charts/svg/paths";
import { buildGeometry } from "../charts/svg/scales";

const MARGINS = { top: 8, right: 1, bottom: 1, left: 1 };

function SparkCanvas({
  width,
  height,
  values,
}: {
  width: number;
  height: number;
  values: number[];
}) {
  const max = Math.max(...values, 1);
  const geo = buildGeometry({
    width,
    height,
    margins: MARGINS,
    count: values.length,
    yDomain: [0, max * 1.1],
  });
  const points: Pt[] = values.map((v, i) => ({ x: geo.x(i), y: geo.y(v) }));

  return (
    <Svg width={width} height={height}>
      <Defs>
        <GradientDef
          id="spark-area"
          stops={[
            { offset: 0, color: "rgba(52,211,153,0.5)" },
            { offset: 0.6, color: "rgba(16,185,129,0.12)" },
            { offset: 1, color: "rgba(16,185,129,0)" },
          ]}
        />
        <GradientDef
          id="spark-line"
          horizontal
          stops={[
            { offset: 0, color: "#34d399" },
            { offset: 1, color: "#818cf8" },
          ]}
        />
      </Defs>
      <Path d={areaPath(points, geo.bounds.bottom)} fill="url(#spark-area)" />
      <Path d={linePath(points)} fill="none" stroke="url(#spark-line)" strokeWidth={3} />
    </Svg>
  );
}

/** Area sparkline for the Dashboard solar hero; fills its (flex) container. */
export function Sparkline({ values }: { values: number[] }) {
  const [size, setSize] = useState({ w: 0, h: 0 });
  const data = values.length > 1 ? values : [0, 0];

  return (
    <View
      className="w-full flex-1"
      onLayout={(e) => setSize({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}
    >
      {size.w > 0 && size.h > 0 ? (
        <SparkCanvas width={size.w} height={size.h} values={data} />
      ) : null}
    </View>
  );
}

export default Sparkline;
