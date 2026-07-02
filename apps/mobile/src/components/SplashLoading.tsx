import Constants from "expo-constants";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import Svg, { Circle, Defs, Line, Polyline, RadialGradient, Rect, Stop } from "react-native-svg";

const NAVY = "#0a1124";

/** Sun + house-with-panels mark, matching the app icon 1:1 (viewBox 0 0 100 100). */
function Mark({ size }: { size: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Circle cx={50} cy={17} r={7.5} fill="none" stroke={NAVY} strokeWidth={5.5} />
      <Line x1={50} y1={4.5} x2={50} y2={0} stroke={NAVY} strokeWidth={3.6} strokeLinecap="round" />
      <Line
        x1={56.25}
        y1={6.2}
        x2={58.5}
        y2={2.3}
        stroke={NAVY}
        strokeWidth={3.6}
        strokeLinecap="round"
      />
      <Line
        x1={43.75}
        y1={6.2}
        x2={41.5}
        y2={2.3}
        stroke={NAVY}
        strokeWidth={3.6}
        strokeLinecap="round"
      />
      <Line
        x1={60.8}
        y1={10.75}
        x2={64.7}
        y2={8.5}
        stroke={NAVY}
        strokeWidth={3.6}
        strokeLinecap="round"
      />
      <Line
        x1={39.2}
        y1={10.75}
        x2={35.3}
        y2={8.5}
        stroke={NAVY}
        strokeWidth={3.6}
        strokeLinecap="round"
      />
      <Line
        x1={62.5}
        y1={17}
        x2={67}
        y2={17}
        stroke={NAVY}
        strokeWidth={3.6}
        strokeLinecap="round"
      />
      <Line
        x1={37.5}
        y1={17}
        x2={33}
        y2={17}
        stroke={NAVY}
        strokeWidth={3.6}
        strokeLinecap="round"
      />
      <Polyline
        points="16,62 50,34 84,62"
        fill="none"
        stroke={NAVY}
        strokeWidth={9}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Rect x={25} y={58} width={15} height={13} rx={3} fill={NAVY} />
      <Rect x={42.5} y={58} width={15} height={13} rx={3} fill={NAVY} />
      <Rect x={60} y={58} width={15} height={13} rx={3} fill={NAVY} />
      <Rect x={25} y={74} width={15} height={13} rx={3} fill={NAVY} />
      <Rect x={42.5} y={74} width={15} height={13} rx={3} fill={NAVY} />
      <Rect x={60} y={74} width={15} height={13} rx={3} fill={NAVY} />
    </Svg>
  );
}

/** Soft ambient highlights matching the design's top/bottom radial glows over the gold gradient. */
function AmbientGlow() {
  return (
    <Svg style={StyleSheet.absoluteFill} width="100%" height="100%" pointerEvents="none">
      <Defs>
        <RadialGradient id="glowTop" cx="50%" cy="0%" r="60%">
          <Stop offset="0" stopColor="#ffffff" stopOpacity="0.35" />
          <Stop offset="0.65" stopColor="#ffffff" stopOpacity="0" />
        </RadialGradient>
        <RadialGradient id="glowBottom" cx="50%" cy="100%" r="65%">
          <Stop offset="0" stopColor="#92400e" stopOpacity="0.28" />
          <Stop offset="0.65" stopColor="#92400e" stopOpacity="0" />
        </RadialGradient>
      </Defs>
      <Rect x="0" y="0" width="100%" height="100%" fill="url(#glowTop)" />
      <Rect x="0" y="0" width="100%" height="100%" fill="url(#glowBottom)" />
    </Svg>
  );
}

/** Pulsing white halo behind the mark — mirrors the design's `glowPulse` keyframes. */
function MarkGlow() {
  const pulse = useSharedValue(0);

  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1300, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 1300, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
    );
  }, [pulse]);

  const style = useAnimatedStyle(() => ({
    opacity: 0.5 + pulse.value * 0.5,
    transform: [{ scale: 1 + pulse.value * 0.12 }],
  }));

  return (
    <Animated.View
      style={[
        {
          position: "absolute",
          top: -55,
          left: -55,
          width: 280,
          height: 280,
          borderRadius: 140,
        },
        style,
      ]}
    >
      <Svg width="100%" height="100%" viewBox="0 0 100 100">
        <Defs>
          <RadialGradient id="markHalo" cx="50%" cy="50%" r="50%">
            <Stop offset="0" stopColor="#ffffff" stopOpacity="0.5" />
            <Stop offset="0.65" stopColor="#ffffff" stopOpacity="0" />
          </RadialGradient>
        </Defs>
        <Rect x="0" y="0" width="100" height="100" fill="url(#markHalo)" />
      </Svg>
    </Animated.View>
  );
}

/** One dot of the 3-dot loader — mirrors the design's `dotBlink` keyframes. */
function Dot({ delay }: { delay: number }) {
  const t = useSharedValue(0);

  useEffect(() => {
    t.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 480, easing: Easing.inOut(Easing.ease) }),
          withTiming(0, { duration: 720, easing: Easing.inOut(Easing.ease) }),
        ),
        -1,
      ),
    );
  }, [t, delay]);

  const style = useAnimatedStyle(() => ({ opacity: 0.25 + t.value * 0.75 }));

  return (
    <Animated.View
      style={[{ width: 7, height: 7, borderRadius: 999, backgroundColor: NAVY }, style]}
    />
  );
}

/**
 * Brand splash/loading screen — shown while fonts/theme/auth are still resolving, before the
 * real app chrome mounts. Deliberately fixed gold + navy colors regardless of light/dark
 * preference, matching the native `assets/splash.png` for a seamless handoff (Design:
 * "Splash & App Icons" 1d).
 */
export function SplashLoading() {
  const version = Constants.expoConfig?.version ?? "";

  return (
    <View style={{ flex: 1 }}>
      <LinearGradient
        colors={["#fde047", "#fbbf24", "#f59e0b"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <AmbientGlow />

      <View className="flex-1 items-center justify-center">
        <View className="items-center justify-center" style={{ width: 170, height: 170 }}>
          <MarkGlow />
          <Mark size={170} />
        </View>
        <Text className="mt-6 text-[38px] font-extrabold tracking-[-1px]" style={{ color: NAVY }}>
          HMI
        </Text>
        <Text className="mt-1.5 text-[13.5px] font-semibold" style={{ color: NAVY, opacity: 0.6 }}>
          Home Management Interface
        </Text>
      </View>

      <View className="absolute inset-x-0 bottom-16 items-center gap-3.5">
        <View className="flex-row gap-2">
          <Dot delay={0} />
          <Dot delay={200} />
          <Dot delay={400} />
        </View>
        {version ? (
          <Text
            className="text-[11px] font-semibold tracking-[0.4px]"
            style={{ color: NAVY, opacity: 0.45 }}
          >
            Version {version}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

export default SplashLoading;
