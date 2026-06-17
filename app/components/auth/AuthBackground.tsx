import React from 'react';
import {
  View,
  StyleSheet,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { premiumTheme } from '../../theme/premiumTheme';

/**
 * Shared premium backdrop for the login / register screens.
 * Mirrors the dashboard look: deep gradient base with soft, blurred ambient
 * glow blobs. Children are rendered above the background layers.
 */
export default function AuthBackground({
  children,
}: {
  children: React.ReactNode;
}) {
  const { width, height } = useWindowDimensions();

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <LinearGradient
        colors={premiumTheme.bg.gradient}
        style={StyleSheet.absoluteFill}
      />
      <Blob color={premiumTheme.bg.glowSolar} top={-140} right={-120} size={420} />
      <Blob
        color={premiumTheme.bg.glowEnergy}
        bottom={-160}
        left={-140}
        size={440}
      />
      <Blob
        color={premiumTheme.bg.glowViolet}
        top={height * 0.32}
        left={width * 0.42}
        size={320}
      />
      {children}
    </View>
  );
}

function Blob({
  color,
  size,
  top,
  bottom,
  left,
  right,
}: {
  color: string;
  size: number;
  top?: number;
  bottom?: number;
  left?: number;
  right?: number;
}) {
  return (
    <View
      pointerEvents="none"
      style={[
        {
          position: 'absolute',
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
          top,
          bottom,
          left,
          right,
          opacity: 0.9,
        },
        Platform.OS === 'web'
          ? ({ filter: `blur(100px)` } as object)
          : { opacity: 0.32 },
      ]}
    />
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: premiumTheme.bg.base },
});
